-- migration_v6: Anti-spam purchase rate limiting
-- Chạy file này trong Supabase SQL Editor

-- Thêm settings cho rate limiting
INSERT INTO settings (key, value) VALUES
  ('purchase_cooldown_minutes', '5'),    -- Thời gian chờ giữa 2 lần mua (phút)
  ('max_pending_orders', '3'),           -- Số đơn pending tối đa cùng lúc
  ('max_quantity_per_order', '10'),       -- Số lượng tối đa mỗi đơn
  ('max_orders_per_day', '20')           -- Số đơn tối đa mỗi ngày
ON CONFLICT (key) DO NOTHING;
