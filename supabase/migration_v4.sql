-- Fix: ensure service_role has full privileges on all tables
-- (Supabase default grants should cover this, but run explicitly if permissions are missing)

grant all on table products          to service_role, authenticated;
grant all on table wechat_accounts   to service_role, authenticated;
grant all on table orders            to service_role, authenticated;
grant all on table order_accounts    to service_role, authenticated;
grant all on table payment_logs      to service_role;
grant all on table settings          to service_role, authenticated;
grant all on table user_credits      to service_role, authenticated;
grant all on table topup_requests    to service_role, authenticated;

-- Allow future tables to inherit the same grants automatically
alter default privileges in schema public
  grant all on tables to service_role, authenticated, anon;

-- Products INSERT/UPDATE/DELETE: only via service_role (admin API routes bypass RLS anyway,
-- but add explicit policies so it works even if BYPASSRLS is not active for the key)
drop policy if exists "Service role can insert products"  on products;
drop policy if exists "Service role can update products"  on products;
drop policy if exists "Service role can delete products"  on products;

create policy "Service role can insert products"
  on products for insert
  with check (auth.role() = 'service_role');

create policy "Service role can update products"
  on products for update
  using (auth.role() = 'service_role');

create policy "Service role can delete products"
  on products for delete
  using (auth.role() = 'service_role');

-- Same for wechat_accounts (drop the old broad admin policy first)
drop policy if exists "Admins can manage wechat accounts" on wechat_accounts;

create policy "Service role can manage wechat accounts"
  on wechat_accounts for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- notifications table (if it exists)
grant all on table notifications to service_role, authenticated;
