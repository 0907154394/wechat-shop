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

  const { amount_vnd } = await req.json();
  if (!amount_vnd || amount_vnd < 50000) {
    return NextResponse.json({ error: "min_amount" }, { status: 400 });
  }

  const settings = await getSettings();
  const rate = parseFloat(settings.usdt_rate) || 25500;
  const usdtAddress = settings.usdt_address;
  if (!usdtAddress) {
    return NextResponse.json({ error: "no_address" }, { status: 500 });
  }

  // Generate unique USDT amount with small decimal variation to identify this request
  const base = Math.ceil((amount_vnd / rate) * 100) / 100;
  const unique = (Date.now() % 1000) / 10000;
  const expected_usdt = Math.round((base + unique) * 10000) / 10000;
  const actual_vnd = Math.round(expected_usdt * rate);

  const db = adminDb();
  const id = crypto.randomUUID();

  const { error } = await db.from("topup_requests").insert({
    id,
    user_id: user.id,
    username: user.user_metadata?.username ?? user.email,
    amount_usdt: expected_usdt,
    amount_vnd: actual_vnd,
    status: "pending",
  });

  if (error) {
    console.error("[topup/create] insert error:", error);
    return NextResponse.json({ error: "insert_failed", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({
    id,
    expected_usdt,
    amount_vnd: actual_vnd,
    usdt_address: usdtAddress,
  });
}
