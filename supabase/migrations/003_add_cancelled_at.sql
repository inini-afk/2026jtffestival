-- Add cancelled_at column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Add promo_code_id and discount_amount columns if they don't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES promo_codes(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount INTEGER DEFAULT 0;

-- Create index for promo_code_id
CREATE INDEX IF NOT EXISTS idx_orders_promo_code_id ON orders(promo_code_id);
