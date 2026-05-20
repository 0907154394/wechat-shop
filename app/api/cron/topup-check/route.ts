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
    .from("topup_requests")
    .select("*")
    .eq("status", "pending")
    .gte("created_at", since);

  if (!pending?.length) return NextResponse.json({ checked: 0, confirmed: 0 });

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

  // Collect TX hashes already used to prevent double-crediting
  const { data: usedTx } = await db
    .from("topup_requests")
    .select("tx_hash")
    .eq("status", "confirmed")
    .not("tx_hash", "is", null);
  const usedHashes = new Set((usedTx ?? []).map((r: any) => r.tx_hash));

  let confirmed = 0;
  for (const topup of pending) {
    const expectedQuant = Math.round(topup.amount_usdt * 1_000_000);
    const match = transfers.find(t => {
      const quant = parseInt(t.quant ?? "0");
      const ts = t.block_ts ?? 0;
      const txHash = t.transaction_id ?? t.hash ?? null;
      return quant === expectedQuant && ts >= cutoff && txHash && !usedHashes.has(txHash);
    });

    if (!match) continue;

    const txHash = match.transaction_id ?? match.hash;
    usedHashes.add(txHash);

    const { data: existingCredits } = await db
      .from("user_credits").select("balance").eq("user_id", topup.user_id).single();
    await db.from("user_credits").upsert({
      user_id: topup.user_id,
      balance: Number(existingCredits?.balance ?? 0) + Number(topup.amount_usdt),
      updated_at: new Date().toISOString(),
    });

    await db.from("topup_requests").update({
      status: "confirmed",
      tx_hash: txHash,
      confirmed_at: new Date().toISOString(),
    }).eq("id", topup.id);

    await db.from("notifications").insert({
      user_id: topup.user_id,
      type: "topup",
      title: "Nạp tiền thành công!",
      message: `${topup.amount_usdt} USDT đã được cộng vào ví của bạn.`,
      order_id: null,
    });

    await notifyAdmin(
      `💎 <b>USDT Topup (auto cron)</b>\nUser: <code>${topup.username}</code>\nAmount: ${topup.amount_usdt} USDT\nTX: <code>${txHash}</code>`
    ).catch(() => {});

    confirmed++;
  }

  return NextResponse.json({ checked: pending.length, confirmed });
}
