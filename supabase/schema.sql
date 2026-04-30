-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Products table (gói acc WeChat)
create table products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price integer not null, -- VND, no decimal
  stock integer not null default 0,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- WeChat accounts inventory
create table wechat_accounts (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id),
  username text not null,
  password text not null,
  phone_number text,
  backup_email text,
  extra_info text, -- JSON string for extra data
  status text not null default 'available', -- available | sold
  order_id uuid, -- filled when sold
  created_at timestamptz default now()
);

-- Orders table
create table orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  product_id uuid references products(id),
  quantity integer not null default 1,
  amount integer not null, -- total VND
  order_code text unique not null, -- mã CK: DH + 8 chars
  status text not null default 'pending', -- pending | paid | delivered | cancelled
  payment_note text, -- ghi chú từ Casso khi CK
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- Order delivered accounts (acc đã giao)
create table order_accounts (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id),
  wechat_account_id uuid references wechat_accounts(id),
  created_at timestamptz default now()
);

-- Casso webhook logs (để debug)
create table payment_logs (
  id uuid primary key default uuid_generate_v4(),
  raw_payload jsonb not null,
  matched_order_id uuid references orders(id),
  processed boolean default false,
  created_at timestamptz default now()
);

-- RLS Policies
alter table products enable row level security;
alter table orders enable row level security;
alter table order_accounts enable row level security;
alter table wechat_accounts enable row level security;
alter table payment_logs enable row level security;

-- Products: ai cũng đọc được
create policy "Products are viewable by everyone"
  on products for select using (is_active = true);

-- Orders: user chỉ xem đơn của mình
create policy "Users can view own orders"
  on orders for select using (auth.uid() = user_id);

create policy "Users can create orders"
  on orders for insert with check (auth.uid() = user_id);

-- Order accounts: user xem acc đã mua
create policy "Users can view own order accounts"
  on order_accounts for select
  using (
    exists (
      select 1 from orders
      where orders.id = order_accounts.order_id
      and orders.user_id = auth.uid()
    )
  );

-- WeChat accounts: chỉ admin đọc trực tiếp (user nhận qua order_accounts)
create policy "Admins can manage wechat accounts"
  on wechat_accounts for all
  using (auth.jwt() ->> 'role' = 'admin');

-- Function: tự động cập nhật stock khi order paid
create or replace function deliver_order_accounts(p_order_id uuid)
returns void language plpgsql security definer as $$
declare
  v_product_id uuid;
  v_quantity integer;
  v_account_id uuid;
begin
  select product_id, quantity into v_product_id, v_quantity
  from orders where id = p_order_id;

  for i in 1..v_quantity loop
    select id into v_account_id
    from wechat_accounts
    where product_id = v_product_id and status = 'available'
    limit 1 for update skip locked;

    if v_account_id is null then
      raise exception 'Insufficient stock for order %', p_order_id;
    end if;

    update wechat_accounts
    set status = 'sold', order_id = p_order_id
    where id = v_account_id;

    insert into order_accounts (order_id, wechat_account_id)
    values (p_order_id, v_account_id);
  end loop;

  update orders set status = 'delivered', paid_at = now()
  where id = p_order_id;

  update products
  set stock = stock - v_quantity
  where id = v_product_id;
end;
$$;

-- Settings table (cấu hình shop: ngân hàng, tên shop...)
create table settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- Default bank settings
insert into settings (key, value) values
  ('bank_id', 'MB'),
  ('account_no', ''),
  ('account_name', ''),
  ('shop_name', 'WeChat Shop VN');

-- RLS: ai cũng đọc được settings (để hiển thị QR), chỉ admin mới sửa
alter table settings enable row level security;

create policy "Settings are readable by everyone"
  on settings for select using (true);

create policy "Only service role can update settings"
  on settings for all using (auth.jwt() ->> 'role' = 'service_role');

-- Indexes
create index idx_orders_order_code on orders(order_code);
create index idx_orders_user_id on orders(user_id);
create index idx_wechat_accounts_status on wechat_accounts(status, product_id);
