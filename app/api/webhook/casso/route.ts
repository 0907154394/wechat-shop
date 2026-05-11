import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { CassoWebhookPayload } from "@/lib/types";
import { notifyAdmin } from "@/lib/telegram";

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const apiKey = request.headers.get("secure-token") || request.headers.get("x-api-key");
  if (apiKey !== process.env.CASSO_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: CassoWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = getAdminSupabase();
  await supabase.from("payment_logs").insert({ raw_payload: payload });

  const records = payload?.data?.records ?? [];
  if (records.length === 0) return NextResponse.json({ ok: true });

  for (const txn of records) {
    const desc = txn.description ?? "";

    // ── Đơn hàng: DH + 8 ký tự ──
    const orderCodeMatch = desc.match(/DH[A-Z0-9]{8}/i);
    if (orderCodeMatch) {
      await handleOrder(supabase, txn, orderCodeMatch[0].toUpperCase());
      continue;
    }

    // ── Nạp ví: NAP {username} ──
    const topupMatch = desc.match(/\bNAP\s+([a-z0-9_]+)\b/i);
    if (topupMatch) {
      await handleTopup(supabase, txn, topupMatch[1].toLowerCase());
      continue;
    }
  }

  return NextResponse.json({ ok: true });
}

async function handleOrder(supabase: any, txn: any, orderCode: string) {
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("order_code", orderCode)
    .eq("status", "pending")
    .single();

  if (!order) return;
  if (txn.amount < order.amount) return;

  await supabase
    .from("payment_logs")
    .update({ matched_order_id: order.id, processed: true })
    .eq("raw_payload->>tid", txn.tid);

  const { error: deliverError } = await supabase.rpc("deliver_order_accounts", {
    p_order_id: order.id,
  });

  if (deliverError) {
    await supabase
      .from("orders")
      .update({ status: "paid", payment_note: txn.description })
      .eq("id", order.id);
    return;
  }

  await supabase.from("notifications").insert({
    user_id: order.user_id,
    type: "order_delivered",
    title: "Đơn hàng đã được giao!",
    message: `Đơn ${order.order_code} đã giao thành công. Vào mục Đơn hàng để xem tài khoản WeChat.`,
    order_id: order.id,
  });

  await notifyAdmin(
    `✅ <b>Đơn giao thành công</b>\nMã: <code>${order.order_code}</code>\nSố tiền: ${Number(order.amount).toLocaleString("vi-VN")}đ`
  );

  // Referral reward nếu đây là đơn delivered đầu tiên
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", order.user_id)
    .eq("status", "delivered");

  if (count === 1) {
    const { data: referral } = await supabase
      .from("referrals")
      .select("*")
      .eq("referred_id", order.user_id)
      .eq("reward_given", false)
      .single();

    if (referral) {
      await supabase.rpc("add_user_credit", { p_user_id: referral.referrer_id, p_amount: 50000 });
      await supabase.from("referrals").update({ reward_given: true }).eq("id", referral.id);
      await supabase.from("notifications").insert({
        user_id: referral.referrer_id,
        type: "referral_reward",
        title: "Nhận thưởng giới thiệu!",
        message: "Bạn bè bạn vừa mua hàng thành công. Bạn được cộng 50.000đ vào tài khoản.",
        order_id: null,
      });
    }
  }
}

async function handleTopup(supabase: any, txn: any, username: string) {
  // Tìm user theo username
  const { data: allUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const user = allUsers?.users?.find(
    (u: any) => u.user_metadata?.username?.toLowerCase() === username
  );
  if (!user) return;

  const amount = txn.amount as number;

  // Cộng tiền vào ví
  await supabase.rpc("add_user_credit", { p_user_id: user.id, p_amount: amount });

  // Ghi lịch sử nạp
  await supabase.from("topup_requests").insert({
    user_id: user.id,
    username,
    amount_vnd: amount,
    tx_description: txn.description,
    status: "confirmed",
  });

  // Thông báo cho user
  await supabase.from("notifications").insert({
    user_id: user.id,
    type: "topup",
    title: "Nạp tiền thành công!",
    message: `Tài khoản được cộng ${amount.toLocaleString("vi-VN")}đ vào ví.`,
    order_id: null,
  });

  await notifyAdmin(
    `💰 <b>Nạp tiền (CK ngân hàng)</b>\nUser: <code>${username}</code>\nSố tiền: ${amount.toLocaleString("vi-VN")}đ\nNội dung: ${txn.description}`
  );
}
