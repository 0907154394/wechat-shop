-- Migration v8: Change price/amount columns to numeric for USDT decimal support

-- products.price: integer → numeric(18,4)
ALTER TABLE products
  ALTER COLUMN price TYPE numeric(18,4) USING price::numeric;

-- orders.amount: integer → numeric(18,4)
ALTER TABLE orders
  ALTER COLUMN amount TYPE numeric(18,4) USING amount::numeric;

-- user_credits.balance: bigint → numeric(18,6)
ALTER TABLE user_credits
  ALTER COLUMN balance TYPE numeric(18,6) USING balance::numeric;

-- topup_requests.amount_vnd: make nullable (no longer required, VND dropped)
ALTER TABLE topup_requests
  ALTER COLUMN amount_vnd DROP NOT NULL;
