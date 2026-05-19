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

export default async function ProductDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; limit?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const sb = getAdmin();

  const [{ data: product }, { data: { user } }] = await Promise.all([
    sb.from("products").select("*").eq("id", id).eq("is_active", true).single(),
    supabase.auth.getUser(),
  ]);

  const balance: number = user
    ? await sb.from("user_credits").select("balance").eq("user_id", user.id).single()
        .then(r => Number(r.data?.balance ?? 0))
    : 0;

  if (!product) notFound();

  const p = product as Product;

  // Load rate limit settings
  const { data: settingsRows } = await sb.from("settings").select("key, value").in("key", [
    "max_quantity_per_order"
  ]);
  const cfgMap = Object.fromEntries((settingsRows ?? []).map(r => [r.key, r.value]));
  const maxQtyPerOrder = parseInt(cfgMap.max_quantity_per_order ?? "10") || 10;

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
      maxQtyPerOrder={maxQtyPerOrder}
      orderError={sp.error ?? null}
      orderErrorLimit={sp.limit ? parseInt(sp.limit) : null}
      balance={balance}
    />
  );
}

async function createOrderAction(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const productId = formData.get("product_id") as string;
  const payMethod = formData.get("pay_method") === "usdt" ? "usdt_direct" : "wallet";

  const { createClient: adminClientFn } = await import("@supabase/supabase-js");
  const sb = adminClientFn(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // ── Load rate limit settings ──
  const { data: settingsRows } = await sb.from("settings").select("key, value").in("key", [
    "max_pending_orders", "max_quantity_per_order", "max_orders_per_day"
  ]);
  const cfg = Object.fromEntries((settingsRows ?? []).map(r => [r.key, r.value]));
  const maxPending        = parseInt(cfg.max_pending_orders ?? "3") || 3;
  const maxQtyPerOrder    = parseInt(cfg.max_quantity_per_order ?? "10") || 10;
  const maxOrdersPerDay   = parseInt(cfg.max_orders_per_day ?? "20") || 20;

  const quantity = Math.max(1, Math.min(maxQtyPerOrder, parseInt(formData.get("quantity") as string) || 1));

  // ── Rate limit 1: Max quantity per order ──
  const requestedQty = parseInt(formData.get("quantity") as string) || 1;
  if (requestedQty > maxQtyPerOrder) {
    redirect(`/products/${productId}?error=max_quantity&limit=${maxQtyPerOrder}`);
  }

  // ── Rate limit 2: Max pending orders ──
  const { count: pendingCount } = await sb
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "pending");

  if ((pendingCount ?? 0) >= maxPending) {
    redirect(`/products/${productId}?error=max_pending&limit=${maxPending}`);
  }

  // ── Rate limit 3: Max orders per day ──
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count: todayCount } = await sb
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", todayStart.toISOString());

  if ((todayCount ?? 0) >= maxOrdersPerDay) {
    redirect(`/products/${productId}?error=max_daily&limit=${maxOrdersPerDay}`);
  }

  // ── Stock check ──
  const { data: product } = await sb.from("products").select("*").eq("id", productId).single();
  if (!product) redirect("/products");

  const { count: availStock } = await sb
    .from("wechat_accounts")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId)
    .eq("status", "available");
  if ((availStock ?? 0) < quantity) redirect("/products");

  // product.price is in USDT
  const totalUsdt = Number(product.price) * quantity;
  let usdtAmount: number | null = null;
  let paymentNote: string | null = null;

  if (payMethod === "usdt_direct") {
    const unique = (Date.now() % 1000) / 10000;
    usdtAmount = Math.round((totalUsdt + unique) * 10000) / 10000;
    paymentNote = `usdt:${usdtAmount}`;
  }

  let order: any = null;
  let insertError: any = null;

  const fullInsert = await sb.from("orders").insert({
    user_id: user.id, product_id: productId, quantity, amount: totalUsdt,
    order_code: generateOrderCode(), status: "pending",
    payment_method: payMethod, usdt_amount: usdtAmount, payment_note: paymentNote,
  }).select().single();

  if (fullInsert.error?.message?.includes("column")) {
    const fallback = await sb.from("orders").insert({
      user_id: user.id, product_id: productId, quantity, amount: totalUsdt,
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
