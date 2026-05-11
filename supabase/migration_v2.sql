-- Migration v2: Reviews, Notifications, Referrals, Login History, User Credits
-- Chạy file này trong Supabase SQL Editor

-- Reviews
create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  order_id uuid references orders(id) on delete cascade not null unique,
  rating integer not null check (rating between 1 and 5),
  comment text,
  reviewer_name text,
  created_at timestamptz default now()
);
alter table reviews enable row level security;
create policy "Anyone can view reviews" on reviews for select using (true);
create policy "Users can insert own reviews" on reviews for insert with check (auth.uid() = user_id);

-- Notifications
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null default 'system',
  title text not null,
  message text not null,
  order_id uuid references orders(id) on delete set null,
  is_read boolean default false,
  created_at timestamptz default now()
);
alter table notifications enable row level security;
create policy "Users can view own notifications" on notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications" on notifications for update using (auth.uid() = user_id);

-- User credits (ví nạp tiền)
create table if not exists user_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance bigint not null default 0 check (balance >= 0),
  updated_at timestamptz default now()
);
alter table user_credits enable row level security;
create policy "Users can view own credits" on user_credits for select using (auth.uid() = user_id);

-- Referrals
create table if not exists referrals (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid references auth.users(id) on delete cascade not null,
  referred_id uuid references auth.users(id) on delete cascade not null unique,
  reward_given boolean default false,
  created_at timestamptz default now()
);
alter table referrals enable row level security;
create policy "Users can view referrals they sent" on referrals for select using (auth.uid() = referrer_id);

-- Login history
create table if not exists login_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);
alter table login_history enable row level security;
create policy "Users can view own login history" on login_history for select using (auth.uid() = user_id);

-- Function: cộng credit cho user
create or replace function add_user_credit(p_user_id uuid, p_amount bigint)
returns void language plpgsql security definer as $$
begin
  insert into user_credits (user_id, balance)
  values (p_user_id, p_amount)
  on conflict (user_id) do update
  set balance = user_credits.balance + excluded.balance,
      updated_at = now();
end;
$$;

-- Indexes
create index if not exists idx_reviews_product_id on reviews(product_id);
create index if not exists idx_notifications_user_unread on notifications(user_id, is_read);
create index if not exists idx_login_history_user_id on login_history(user_id);
create index if not exists idx_referrals_referrer on referrals(referrer_id);
