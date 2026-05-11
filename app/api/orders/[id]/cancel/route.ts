import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    .from("orders").select("id, status, user_id").eq("id", id).single();

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (order.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (order.status !== "pending") return NextResponse.json({ error: "Cannot cancel" }, { status: 400 });

  await db.from("orders").update({ status: "cancelled" }).eq("id", id);

  return NextResponse.json({ ok: true });
}
