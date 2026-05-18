export const dynamic = "force-dynamic";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { PayContent } from "./PayContent";

function adminDb() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function PayOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = adminDb();
  const { data: order } = await db
    .from("orders")
    .select("*, products(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!order) notFound();
  if (order.status === "delivered") redirect(`/orders/${id}`);
  if (order.status === "cancelled") redirect("/orders");

  const payNote = (order.payment_note ?? "") as string;
  const isUsdt = order.payment_method === "usdt_direct" || payNote.startsWith("usdt:");
  const usdtAmount: number = order.usdt_amount
    ?? (payNote.startsWith("usdt:") ? parseFloat(payNote.replace("usdt:", "")) || 0 : 0);

  const [creditsResult, addrResult] = await Promise.all([
    db.from("user_credits").select("balance").eq("user_id", user.id).single(),
    db.from("settings").select("value").eq("key", "usdt_address").single(),
  ]);

  const balance = Number((creditsResult.data as any)?.balance ?? 0);
  const usdtAddress = (addrResult.data as any)?.value ?? "";

  // order.amount is already USDT — add unique micro-variation if not yet set
  let resolvedUsdtAmount = usdtAmount;
  if (!isUsdt || resolvedUsdtAmount === 0) {
    const unique = (Date.now() % 1000) / 10000;
    resolvedUsdtAmount = Math.round((Number(order.amount) + unique) * 10000) / 10000;
  }

  return (
    <PayContent
      orderId={id}
      orderCode={order.order_code}
      productName={(order as any).products?.name ?? "—"}
      quantity={order.quantity}
      amount={order.amount}
      balance={balance}
      usdtAddress={usdtAddress}
      initialMethod={isUsdt ? "usdt_direct" : "wallet"}
      initialUsdtAmount={resolvedUsdtAmount}
    />
  );
}
