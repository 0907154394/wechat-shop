import { createClient } from "@/lib/supabase/server";
import { createClient as adminClient } from "@supabase/supabase-js";
import type { Product } from "@/lib/types";
import { ProductsContent } from "./ProductsContent";

export const dynamic = "force-dynamic";

function getAdmin() {
  return adminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function ProductsPage() {
  const supabase = await createClient();
  const sb = getAdmin();

  const [{ data: { user } }, { data: products }] = await Promise.all([
    supabase.auth.getUser(),
    sb.from("products").select("*").eq("is_active", true).order("price"),
  ]);

  const productIds = products?.map(p => p.id) ?? [];
  const stockMap: Record<string, number> = {};
  if (productIds.length > 0) {
    const { data: avail } = await sb
      .from("wechat_accounts")
      .select("product_id")
      .in("product_id", productIds)
      .eq("status", "available");
    avail?.forEach(a => { stockMap[a.product_id] = (stockMap[a.product_id] ?? 0) + 1; });
  }

  return (
    <ProductsContent
      products={(products ?? []) as Product[]}
      stockMap={stockMap}
      isLoggedIn={!!user}
    />
  );
}
