import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { order_id, product_id, rating, comment } = await request.json();
  if (!order_id || !product_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  // Verify order belongs to user and is delivered
  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("id", order_id)
    .eq("user_id", user.id)
    .eq("status", "delivered")
    .single();

  if (!order) return NextResponse.json({ error: "Order not eligible" }, { status: 403 });

  const reviewer_name = user.user_metadata?.full_name || user.user_metadata?.username || user.email?.split("@")[0] || "Khách";

  const { error } = await supabase.from("reviews").upsert({
    user_id: user.id,
    product_id,
    order_id,
    rating,
    comment: comment?.trim() || null,
    reviewer_name,
  }, { onConflict: "order_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
