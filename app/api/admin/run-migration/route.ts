import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import postgres from "postgres";

const MIGRATION_SQL = `
-- Ensure service_role and authenticated have full privileges on all tables
grant all on table products          to service_role, authenticated;
grant all on table wechat_accounts   to service_role, authenticated;
grant all on table orders            to service_role, authenticated;
grant all on table order_accounts    to service_role, authenticated;
grant all on table payment_logs      to service_role;
grant all on table settings          to service_role, authenticated;

-- notifications (may not exist yet, ignore error)
do $$ begin
  grant all on table notifications to service_role, authenticated;
exception when undefined_table then null;
end $$;

-- user_credits / topup_requests (migration_v2/v3, ignore if missing)
do $$ begin
  grant all on table user_credits    to service_role, authenticated;
exception when undefined_table then null;
end $$;
do $$ begin
  grant all on table topup_requests  to service_role, authenticated;
exception when undefined_table then null;
end $$;

-- Future tables inherit the same grants automatically
alter default privileges in schema public
  grant all on tables to service_role, authenticated, anon;

-- Products: add insert/update/delete policies for service_role
drop policy if exists "Service role can insert products" on products;
drop policy if exists "Service role can update products" on products;
drop policy if exists "Service role can delete products" on products;

create policy "Service role can insert products"
  on products for insert with check (auth.role() = 'service_role');

create policy "Service role can update products"
  on products for update using (auth.role() = 'service_role');

create policy "Service role can delete products"
  on products for delete using (auth.role() = 'service_role');

-- wechat_accounts
drop policy if exists "Admins can manage wechat accounts" on wechat_accounts;
drop policy if exists "Service role can manage wechat accounts" on wechat_accounts;

create policy "Service role can manage wechat accounts"
  on wechat_accounts for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
`;

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim());
  if (!adminEmails.includes(user.email ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json(
      { error: "DATABASE_URL chưa được cấu hình trong .env.local" },
      { status: 500 }
    );
  }

  let sql;
  try {
    sql = postgres(dbUrl, { max: 1, idle_timeout: 10 });
    await sql.unsafe(MIGRATION_SQL);
    await sql.end();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    try { await sql?.end(); } catch {}
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
