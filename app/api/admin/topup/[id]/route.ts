import { createClient as createAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function adminDb() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e: string) => e.trim());
  return adminEmails.includes(user.email ?? "");
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { action, note } = await req.json();
  const db = adminDb();

  const { data: topup } = await db.from("topup_requests").select("*").eq("id", id).single();
  if (!topup) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (topup.status !== "pending") return NextResponse.json({ error: "Already processed" }, { status: 400 });

  if (action === "confirm") {
    await db.from("topup_requests").update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      note: note ?? null,
    }).eq("id", id);

    // Credit user balance
    const { data: existing } = await db.from("user_credits").select("balance").eq("user_id", topup.user_id).single();
    await db.from("user_credits").upsert({
      user_id: topup.user_id,
      balance: (existing?.balance ?? 0) + topup.amount_vnd,
      updated_at: new Date().toISOString(),
    });

    await db.from("notifications").insert({
      user_id: topup.user_id,
      type: "topup",
      title: "Nạp tiền thành công!",
      message: `Tài khoản được cộng ${Number(topup.amount_vnd).toLocaleString("vi-VN")}đ (${topup.amount_usdt} USDT).`,
      order_id: null,
    });

    return NextResponse.json({ ok: true });
  }

  if (action === "reject") {
    await db.from("topup_requests").update({
      status: "rejected",
      confirmed_at: new Date().toISOString(),
      note: note ?? null,
    }).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
