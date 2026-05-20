import { NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { notifyAdmin } from "@/lib/telegram";

const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

function adminDb() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = adminDb();

  const { data: addrRow } = await db.from("settings").select("value").eq("key", "usdt_address").single();
  const usdtAddress = addrRow?.value;
  if (!usdtAddress) return NextResponse.json({ error: "no_address" });

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: pending } = await db
    .from("orders")
    .select("*")
    .eq("status", "pending")
    .eq("payment_method", "usdt_direct")
    .not("usdt_amount", "is", null)
    .gte("created_at", since);

  if (!pending?.length) return NextResponse.json({ checked: 0, delivered: 0 });

  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  let transfers: any[] = [];
  try {
    const url = `https://apilist.tronscanapi.com/api/token_trc20/transfers?toAddress=${usdtAddress}&contract_address=${USDT_CONTRACT}&limit=200&start=0`;
    const resp = await fetch(url, {
      headers: { "TRON-PRO-API-KEY": process.env.TRONSCAN_API_KEY ?? "" },
      next: { revalidate: 0 },
    });
    const json = await resp.json();
    transfers = json?.token_transfers ?? [];
  } catch {
    return NextResponse.json({ error: "tronscan_unavailable" });
  }

  // Collect TX hashes already used to prevent double-delivery
  const { data: usedTx } = await db
    .from("orders")
    .select("usdt_tx_hash")
    .not("usdt_tx_hash", "is", null);
  const usedHashes = new Set((usedTx ?? []).map((r: any) => r.usdt_tx_hash));

  let delivered = 0;
  for (const order of pending) {
    const expectedQuant = Math.round(order.usdt_amount * 1_000_000);
    const match = transfers.find(t => {
      const quant = parseInt(t.quant ?? "0");
      const ts = t.block_ts ?? 0;
      const txHash = t.transaction_id ?? t.hash ?? null;
      return quant === expectedQuant && ts >= cutoff && txHash && !usedHashes.has(txHash);
    });

    if (!match) continue;

    const txHash = match.transaction_id ?? match.hash;
    usedHashes.add(txHash);

    const { error: deliverError } = await db.rpc("deliver_order_accounts", { p_order_id: order.id });

    if (deliverError) {
      await db.from("orders").update({
        status: "paid",
        payment_note: `usdt:${txHash}`,
        usdt_tx_hash: txHash,
        paid_at: new Date().toISOString(),
      }).eq("id", order.id);
    } else {
      await db.from("orders").update({
        usdt_tx_hash: txHash,
        payment_note: `usdt:${txHash}`,
      }).eq("id", order.id);

      await db.from("notifications").insert({
        user_id: order.user_id,
        type: "order_delivered",
        title: "Đơn hàng đã được giao!",
        message: `Đơn ${order.order_code} đã thanh toán USDT thành công. Vào Đơn hàng để xem tài khoản WeChat.`,
        order_id: order.id,
      });

      await notifyAdmin(
        `📦 <b>Order Delivered (auto cron)</b>\nOrder: <code>${order.order_code}</code>\nAmount: ${order.usdt_amount} USDT\nTX: <code>${txHash}</code>`
      ).catch(() => {});

      delivered++;
    }
  }

  return NextResponse.json({ checked: pending.length, delivered });
}
