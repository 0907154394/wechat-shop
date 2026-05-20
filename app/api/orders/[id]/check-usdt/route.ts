import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

function adminDb() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = adminDb();

  const { data: order } = await db
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (order.status !== "pending") return NextResponse.json({ paid: order.status !== "cancelled" });
  if (order.payment_method !== "usdt_direct" || !order.usdt_amount) {
    return NextResponse.json({ error: "not_usdt_order" }, { status: 400 });
  }

  // Get USDT wallet address from settings
  const { data: addrRow } = await db
    .from("settings").select("value").eq("key", "usdt_address").single();
  const usdtAddress = addrRow?.value;
  if (!usdtAddress) return NextResponse.json({ error: "no_address_configured" }, { status: 500 });

  // Poll Tronscan for recent TRC20 transfers to our address
  const expectedQuant = Math.round(order.usdt_amount * 1_000_000); // USDT has 6 decimals
  const cutoff = Date.now() - 24 * 60 * 60 * 1000; // last 24 hours

  let txHash: string | null = null;
  try {
    const url = `https://apilist.tronscanapi.com/api/token_trc20/transfers?toAddress=${usdtAddress}&contract_address=${USDT_CONTRACT}&limit=50&start=0`;
    const resp = await fetch(url, {
      headers: { "TRON-PRO-API-KEY": process.env.TRONSCAN_API_KEY ?? "" },
      next: { revalidate: 0 },
    });
    const json = await resp.json();
    const transfers: any[] = json?.token_transfers ?? [];

    const match = transfers.find(t => {
      const quant = parseInt(t.quant ?? "0");
      const ts = t.block_ts ?? 0;
      return quant === expectedQuant && ts >= cutoff;
    });

    if (match) {
      txHash = match.transaction_id ?? match.hash ?? null;
    }
  } catch {
    return NextResponse.json({ paid: false, error: "tronscan_unavailable" });
  }

  if (!txHash) {
    return NextResponse.json({ paid: false });
  }

  // Deliver the order
  const { error: deliverError } = await db.rpc("deliver_order_accounts", { p_order_id: id });

  if (deliverError) {
    // Mark as paid for manual handling
    await db.from("orders").update({
      status: "paid",
      payment_note: `usdt:${txHash}`,
      usdt_tx_hash: txHash,
      paid_at: new Date().toISOString(),
    }).eq("id", id);
    return NextResponse.json({ paid: true, delivered: false });
  }

  // Update tx hash
  await db.from("orders").update({
    usdt_tx_hash: txHash,
    payment_note: `usdt:${txHash}`,
  }).eq("id", id);

  // Notify user
  await db.from("notifications").insert({
    user_id: user.id,
    type: "order_delivered",
    title: "Đơn hàng đã được giao!",
    message: `Đơn ${order.order_code} đã thanh toán USDT thành công. Vào mục Đơn hàng để xem tài khoản WeChat.`,
    order_id: id,
  });

  return NextResponse.json({ paid: true, delivered: true });
}
