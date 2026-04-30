import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendOrderDeliveryEmail } from "@/lib/email";
import type { CassoWebhookPayload } from "@/lib/types";

// Admin client bypasses RLS
function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  // Verify Casso webhook signature
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

  // Log raw payload
  await supabase.from("payment_logs").insert({ raw_payload: payload });

  const records = payload?.data?.records ?? [];
  if (records.length === 0) {
    return NextResponse.json({ ok: true });
  }

  for (const txn of records) {
    // Find order code in the transaction description
    const orderCodeMatch = txn.description?.match(/DH[A-Z0-9]{8}/i);
    if (!orderCodeMatch) continue;

    const orderCode = orderCodeMatch[0].toUpperCase();

    // Find the pending order
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("order_code", orderCode)
      .eq("status", "pending")
      .single();

    if (!order) continue;

    // Verify amount matches
    if (txn.amount < order.amount) {
      console.warn(`Order ${orderCode}: amount mismatch. Expected ${order.amount}, got ${txn.amount}`);
      continue;
    }

    // Update log with matched order
    await supabase
      .from("payment_logs")
      .update({ matched_order_id: order.id, processed: true })
      .eq("raw_payload->>tid", txn.tid);

    // Deliver accounts via the database function
    const { error: deliverError } = await supabase.rpc("deliver_order_accounts", {
      p_order_id: order.id,
    });

    if (deliverError) {
      console.error("deliver_order_accounts error:", deliverError);
      // Mark as paid but not delivered (manual follow-up needed)
      await supabase
        .from("orders")
        .update({ status: "paid", payment_note: txn.description })
        .eq("id", order.id);
      continue;
    }

    // Get user email for notification
    const { data: authUser } = await supabase.auth.admin.getUserById(order.user_id);
    const userEmail = authUser?.user?.email;

    if (userEmail) {
      // Get the delivered accounts
      const { data: orderAccounts } = await supabase
        .from("order_accounts")
        .select("*, wechat_accounts(*)")
        .eq("order_id", order.id);

      if (orderAccounts && orderAccounts.length > 0) {
        try {
          await sendOrderDeliveryEmail({
            toEmail: userEmail,
            order,
            accounts: orderAccounts.map((oa: any) => oa.wechat_accounts),
          });
        } catch (emailError) {
          console.error("Email send failed:", emailError);
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
