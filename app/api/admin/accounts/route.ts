import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const sb = admin();
  const [{ data: products }, { data: accounts }] = await Promise.all([
    sb.from("products").select("id, name, price, stock, is_active").order("created_at", { ascending: false }),
    sb.from("wechat_accounts").select("*, products(name)").order("created_at", { ascending: false }),
  ]);
  return NextResponse.json({ products: products ?? [], accounts: accounts ?? [] });
}
