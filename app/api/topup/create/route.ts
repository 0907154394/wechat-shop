import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { getSettings } from "@/lib/settings";

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

  const { amount_usdt } = await req.json();
  const usdt = parseFloat(amount_usdt);
  if (!usdt || usdt < 1) {
    return NextResponse.json({ error: "min_amount" }, { status: 400 });
  }

  const settings = await getSettings();
  const usdtAddress = settings.usdt_address;
  if (!usdtAddress) {
    return NextResponse.json({ error: "no_address" }, { status: 500 });
  }

  // Add unique micro-variation for Tronscan auto-detection
  const unique = (Date.now() % 1000) / 10000;
  const expected_usdt = Math.round((usdt + unique) * 10000) / 10000;

  const db = adminDb();
  const id = crypto.randomUUID();

  const { error } = await db.from("topup_requests").insert({
    id,
    user_id: user.id,
    username: user.user_metadata?.username ?? user.email,
    amount_usdt: expected_usdt,
    status: "pending",
  });

  if (error) {
    console.error("[topup/create] insert error:", error);
    return NextResponse.json({ error: "insert_failed", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ id, expected_usdt, usdt_address: usdtAddress });
}
