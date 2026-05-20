import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const db = adminDb();

  const { data: topup } = await db
    .from("topup_requests")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!topup) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (topup.status === "confirmed") {
    return NextResponse.json({ confirmed: true, amount_usdt: topup.amount_usdt });
  }
  if (topup.status !== "pending") return NextResponse.json({ confirmed: false });

  // Get USDT address from settings
  const { data: addrRow } = await db.from("settings").select("value").eq("key", "usdt_address").single();
  const usdtAddress = addrRow?.value;
  if (!usdtAddress) return NextResponse.json({ confirmed: false });

  // Search Tronscan for a TRC20 USDT transfer matching the exact unique amount
  const expectedQuant = Math.round(topup.amount_usdt * 1_000_000); // USDT has 6 decimals
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

    if (match) txHash = match.transaction_id ?? match.hash ?? null;
  } catch {
    return NextResponse.json({ confirmed: false, error: "tronscan_unavailable" });
  }

  if (!txHash) return NextResponse.json({ confirmed: false });

  // Credit user wallet in USDT
  const { data: existingCredits } = await db
    .from("user_credits").select("balance").eq("user_id", user.id).single();
  await db.from("user_credits").upsert({
    user_id: user.id,
    balance: Number(existingCredits?.balance ?? 0) + Number(topup.amount_usdt),
    updated_at: new Date().toISOString(),
  });

  // Mark topup as confirmed
  await db.from("topup_requests").update({
    status: "confirmed",
    tx_hash: txHash,
    confirmed_at: new Date().toISOString(),
  }).eq("id", id);

  // Notify user
  await db.from("notifications").insert({
    user_id: user.id,
    type: "topup",
    title: "Topup successful!",
    message: `${topup.amount_usdt} USDT has been added to your wallet.`,
    order_id: null,
  });

  // Notify admin via Telegram
  const username = user.user_metadata?.username ?? user.email;
  await notifyAdmin(
    `💎 <b>USDT Topup (auto-confirmed)</b>\nUser: <code>${username}</code>\nAmount: ${topup.amount_usdt} USDT\nTX: <code>${txHash}</code>`
  );

  return NextResponse.json({
    confirmed: true,
    amount_usdt: topup.amount_usdt,
  });
}
