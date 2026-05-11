import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = admin();

  const { data: acc } = await sb.from("wechat_accounts").select("product_id").eq("id", id).single();
  const { error } = await sb.from("wechat_accounts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (acc?.product_id) {
    const { count } = await sb
      .from("wechat_accounts")
      .select("*", { count: "exact", head: true })
      .eq("product_id", acc.product_id)
      .eq("status", "available");
    await sb.from("products").update({ stock: count ?? 0 }).eq("id", acc.product_id);
  }

  return NextResponse.json({ ok: true });
}
