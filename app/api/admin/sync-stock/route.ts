import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST() {
  const sb = admin();
  const { data: products } = await sb.from("products").select("id");
  if (!products?.length) return NextResponse.json({ synced: 0 });

  await Promise.all(
    products.map(async (p) => {
      const { count } = await sb
        .from("wechat_accounts")
        .select("*", { count: "exact", head: true })
        .eq("product_id", p.id)
        .eq("status", "available");
      await sb.from("products").update({ stock: count ?? 0 }).eq("id", p.id);
    })
  );

  return NextResponse.json({ synced: products.length });
}
