import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

function adminDb() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = adminDb();

  // Lấy đơn hàng
  const { data: order } = await db
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "pending")
    .single();

  if (!order) return NextResponse.json({ error: "order_not_found" }, { status: 404 });

  // Lấy số dư ví
  const { data: credits } = await db
    .from("user_credits")
    .select("balance")
    .eq("user_id", user.id)
    .single();

  const balance = Number(credits?.balance ?? 0);

  if (balance < order.amount) {
    return NextResponse.json({ error: "insufficient_balance", balance, required: order.amount }, { status: 400 });
  }

  // Trừ tiền trước
  const { error: deductError } = await db
    .from("user_credits")
    .update({ balance: balance - order.amount, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  if (deductError) return NextResponse.json({ error: "deduct_failed" }, { status: 500 });

  // Giao hàng
  const { error: deliverError } = await db.rpc("deliver_order_accounts", { p_order_id: id });

  if (deliverError) {
    // Hoàn tiền nếu giao thất bại
    await db.from("user_credits").update({
      balance: balance,
      updated_at: new Date().toISOString(),
    }).eq("user_id", user.id);

    // Đánh dấu đơn là paid để admin xử lý thủ công
    await db.from("orders").update({ status: "paid", payment_note: "wallet" }).eq("id", id);
    return NextResponse.json({ error: "deliver_failed" }, { status: 500 });
  }

  // Thông báo
  await db.from("notifications").insert({
    user_id: user.id,
    type: "order_delivered",
    title: "Đơn hàng đã được giao!",
    message: `Đơn ${order.order_code} đã giao thành công. Vào mục Đơn hàng để xem tài khoản WeChat.`,
    order_id: id,
  });

  return NextResponse.json({ ok: true });
}
