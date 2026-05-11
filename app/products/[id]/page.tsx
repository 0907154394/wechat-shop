export const dynamic = "force-dynamic";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as adminClient } from "@supabase/supabase-js";
import { generateOrderCode } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { ProductDetailContent } from "./ProductDetailContent";

function getAdmin() {
  return adminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const sb = getAdmin();

  const [{ data: product }, { data: { user } }] = await Promise.all([
    sb.from("products").select("*").eq("id", id).eq("is_active", true).single(),
    supabase.auth.getUser(),
  ]);

  if (!product) notFound();

  const p = product as Product;

  const { count: realStock } = await sb
    .from("wechat_accounts")
    .select("*", { count: "exact", head: true })
    .eq("product_id", id)
    .eq("status", "available");

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, comment, reviewer_name, created_at")
    .eq("product_id", id)
    .order("created_at", { ascending: false });

  const reviewList = reviews ?? [];
  const avgRating = reviewList.length > 0
    ? reviewList.reduce((s, r) => s + r.rating, 0) / reviewList.length
    : 0;

  let eligibleOrderId: string | null = null;
  let hasReviewed = false;
  if (user) {
    const { data: deliveredOrder } = await supabase
      .from("orders").select("id")
      .eq("user_id", user.id).eq("product_id", id).eq("status", "delivered")
      .limit(1).single();
    if (deliveredOrder) {
      const { data: existingReview } = await supabase
        .from("reviews").select("id").eq("order_id", deliveredOrder.id).single();
      eligibleOrderId = deliveredOrder.id;
      hasReviewed = !!existingReview;
    }
  }

  return (
    <ProductDetailContent
      product={p}
      realStock={realStock ?? 0}
      reviews={reviewList}
      avgRating={avgRating}
      eligibleOrderId={eligibleOrderId}
      hasReviewed={hasReviewed}
      createOrderAction={createOrderAction}
    />
  );
}

async function createOrderAction(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const productId = formData.get("product_id") as string;
  const quantity  = Math.max(1, Math.min(10, parseInt(formData.get("quantity") as string) || 1));
  const payMethod = formData.get("pay_method") === "usdt" ? "usdt_direct" : "wallet";

  const { createClient: adminClientFn } = await import("@supabase/supabase-js");
  const sb = adminClientFn(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: product } = await sb.from("products").select("*").eq("id", productId).single();
  if (!product) redirect("/products");

  const { count: availStock } = await sb
    .from("wechat_accounts")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId)
    .eq("status", "available");
  if ((availStock ?? 0) < quantity) redirect("/products");

  const totalVnd = product.price * quantity;
  let usdtAmount: number | null = null;
  let paymentNote: string | null = null;

  if (payMethod === "usdt_direct") {
    const { data: rateRow } = await sb.from("settings").select("value").eq("key", "usdt_rate").single();
    const rate = parseFloat(rateRow?.value ?? "25500") || 25500;
    const base = Math.ceil((totalVnd / rate) * 100) / 100;
    const unique = (Date.now() % 1000) / 10000;
    usdtAmount = Math.round((base + unique) * 10000) / 10000;
    paymentNote = `usdt:${usdtAmount}`;
  }

  let order: any = null;
  let insertError: any = null;

  const fullInsert = await sb.from("orders").insert({
    user_id: user.id, product_id: productId, quantity, amount: totalVnd,
    order_code: generateOrderCode(), status: "pending",
    payment_method: payMethod, usdt_amount: usdtAmount, payment_note: paymentNote,
  }).select().single();

  if (fullInsert.error?.message?.includes("column")) {
    const fallback = await sb.from("orders").insert({
      user_id: user.id, product_id: productId, quantity, amount: totalVnd,
      order_code: generateOrderCode(), status: "pending", payment_note: paymentNote,
    }).select().single();
    order = fallback.data;
    insertError = fallback.error;
  } else {
    order = fullInsert.data;
    insertError = fullInsert.error;
  }

  if (insertError || !order) redirect("/products");
  redirect(`/orders/${order.id}/pay`);
}
