import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";
import { notifyAdmin } from "@/lib/telegram";
import crypto from "crypto";

function adminDb() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function verifyBinanceDeposit(txHash: string): Promise<{ ok: boolean; amount: number }> {
  const settings = await getSettings();
  const apiKey = process.env.BINANCE_API_KEY || settings.binance_api_key;
  const secret = process.env.BINANCE_API_SECRET || settings.binance_api_secret;
  if (!apiKey || !secret) return { ok: false, amount: 0 };

  const timestamp = Date.now();
  // Search last 7 days
  const startTime = timestamp - 7 * 24 * 60 * 60 * 1000;
  const queryString = `coin=USDT&txId=${txHash}&startTime=${startTime}&timestamp=${timestamp}`;
  const signature = crypto.createHmac("sha256", secret).update(queryString).digest("hex");

  try {
    const res = await fetch(
      `https://api.binance.com/sapi/v1/capital/deposit/hisrec?${queryString}&signature=${signature}`,
      { headers: { "X-MBX-APIKEY": apiKey } }
    );
    if (!res.ok) return { ok: false, amount: 0 };

    const data: any[] = await res.json();
    const deposit = data.find(
      (d) => d.txId?.toLowerCase() === txHash.toLowerCase() && d.status === 1
    );
    if (!deposit) return { ok: false, amount: 0 };
    return { ok: true, amount: parseFloat(deposit.amount) };
  } catch {
    return { ok: false, amount: 0 };
  }
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = adminDb();
  const [{ data: requests }, { data: credits }] = await Promise.all([
    db.from("topup_requests").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(20),
    db.from("user_credits").select("balance").eq("user_id", user.id).single(),
  ]);

  return NextResponse.json({ balance: credits?.balance ?? 0, requests: requests ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tx_hash } = await req.json();
  if (!tx_hash?.trim()) return NextResponse.json({ error: "missing_txhash" }, { status: 400 });

  const txHash = tx_hash.trim();
  const db = adminDb();

  // Kiểm tra TX hash đã dùng chưa
  const { data: existing } = await db.from("topup_requests").select("id").eq("tx_hash", txHash).single();
  if (existing) return NextResponse.json({ error: "tx_already_used" }, { status: 409 });

  // Xác minh với Binance
  const { ok, amount: usdtAmount } = await verifyBinanceDeposit(txHash);
  if (!ok) return NextResponse.json({ error: "tx_not_found" }, { status: 404 });

  // Quy đổi sang VND
  const settings = await getSettings();
  const rate = parseFloat(settings.usdt_rate) || 25500;
  const amount_vnd = Math.round(usdtAmount * rate);

  // Cộng tiền vào ví
  const { data: existingCredits } = await db.from("user_credits").select("balance").eq("user_id", user.id).single();
  await db.from("user_credits").upsert({
    user_id: user.id,
    balance: (existingCredits?.balance ?? 0) + amount_vnd,
    updated_at: new Date().toISOString(),
  });

  // Lưu lịch sử
  await db.from("topup_requests").insert({
    user_id: user.id,
    username: user.user_metadata?.username ?? user.email,
    amount_usdt: usdtAmount,
    amount_vnd,
    tx_hash: txHash,
    status: "confirmed",
    confirmed_at: new Date().toISOString(),
  });

  // Thông báo
  await db.from("notifications").insert({
    user_id: user.id,
    type: "topup",
    title: "Nạp tiền thành công!",
    message: `Tài khoản được cộng ${amount_vnd.toLocaleString("vi-VN")}đ (${usdtAmount} USDT).`,
    order_id: null,
  });

  const username = user.user_metadata?.username ?? user.email;
  await notifyAdmin(
    `💎 <b>Nạp USDT thành công</b>\nUser: <code>${username}</code>\nSố USDT: ${usdtAmount}\nSố VND: ${amount_vnd.toLocaleString("vi-VN")}đ\nTX: <code>${txHash}</code>`
  );

  return NextResponse.json({ ok: true, amount_usdt: usdtAmount, amount_vnd });
}
