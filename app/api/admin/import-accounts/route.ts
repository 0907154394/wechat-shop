import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const { productId, rows } = await req.json();
  if (!productId || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Thiếu dữ liệu" }, { status: 400 });
  }

  const supabase = getAdmin();
  const inserts = rows
    .filter((r) => r.username && r.password)
    .map((r) => ({
      product_id: productId,
      username: String(r.username).trim(),
      password: String(r.password).trim(),
      phone_number: r.phone ? String(r.phone).trim() : null,
      backup_email: r.email ? String(r.email).trim() : null,
      status: "available",
    }));

  if (inserts.length === 0) {
    return NextResponse.json({ error: "Không có dòng hợp lệ" }, { status: 400 });
  }

  const { data, error } = await supabase.from("wechat_accounts").insert(inserts).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { count } = await supabase
    .from("wechat_accounts")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId)
    .eq("status", "available");
  await supabase.from("products").update({ stock: count ?? 0 }).eq("id", productId);

  return NextResponse.json({ imported: data.length });
}
