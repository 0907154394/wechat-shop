-- migration_v5: USDT direct payment support
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'wallet'
  CHECK (payment_method IN ('wallet', 'usdt_direct'));

ALTER TABLE orders ADD COLUMN IF NOT EXISTS usdt_amount NUMERIC(18,6);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS usdt_tx_hash TEXT;
