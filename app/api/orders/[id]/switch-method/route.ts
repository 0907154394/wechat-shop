import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: order } = await db
    .from("orders").select("id, status, user_id, amount, payment_method, usdt_amount, payment_note")
    .eq("id", id).single();

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (order.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (order.status !== "pending") return NextResponse.json({ error: "Cannot change" }, { status: 400 });

  const { method } = await req.json() as { method: "wallet" | "usdt_direct" };

  if (method === "usdt_direct") {
    // order.amount is already in USDT — add unique micro-variation for auto-detection
    const unique = (Date.now() % 1000) / 10000;
    const usdtAmount = Math.round((Number(order.amount) + unique) * 10000) / 10000;
    const paymentNote = `usdt:${usdtAmount}`;

    await db.from("orders").update({
      payment_method: "usdt_direct",
      usdt_amount: usdtAmount,
      payment_note: paymentNote,
    }).eq("id", id);

    return NextResponse.json({ ok: true, usdtAmount });
  }

  // Switch back to wallet
  await db.from("orders").update({
    payment_method: "wallet",
    usdt_amount: null,
    payment_note: null,
  }).eq("id", id);

  return NextResponse.json({ ok: true });
}
