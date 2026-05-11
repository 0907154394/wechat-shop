-- Migration v3: Topup Requests
-- Chạy file này trong Supabase SQL Editor sau migration_v2

-- Bảng lưu lịch sử nạp tiền (USDT + chuyển khoản ngân hàng)
create table if not exists topup_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  username text,
  amount_usdt numeric,          -- số USDT (chỉ có với USDT topup)
  amount_vnd bigint not null,   -- số VND đã quy đổi
  tx_hash text unique,          -- TX hash USDT (chỉ có với USDT topup)
  tx_description text,          -- mô tả CK ngân hàng (chỉ có với bank topup)
  status text not null default 'pending', -- pending | confirmed | rejected
  confirmed_at timestamptz,
  note text,
  created_at timestamptz default now()
);

alter table topup_requests enable row level security;

create policy "Users can view own topup requests"
  on topup_requests for select using (auth.uid() = user_id);

create index if not exists idx_topup_requests_user_id
  on topup_requests(user_id, created_at desc);

create index if not exists idx_topup_requests_tx_hash
  on topup_requests(tx_hash);

create index if not exists idx_topup_requests_status
  on topup_requests(status, created_at desc);
