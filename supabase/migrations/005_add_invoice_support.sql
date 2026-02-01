-- =============================================
-- Add Invoice Support for Corporate Customers
-- =============================================

-- Account type for profiles (individual or company)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'individual';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_phone VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_registration_number VARCHAR(50); -- 法人番号 (T+13桁)

-- Add stripe_invoice_id to orders for invoice payments
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_invoice_id VARCHAR(255);

-- Create index for stripe_invoice_id
CREATE INDEX IF NOT EXISTS idx_orders_stripe_invoice_id ON orders(stripe_invoice_id);

-- Update comments
COMMENT ON COLUMN profiles.account_type IS 'Account type: individual (個人) or company (法人)';
COMMENT ON COLUMN profiles.company_address IS 'Company address for invoice';
COMMENT ON COLUMN profiles.company_phone IS 'Company phone number';
COMMENT ON COLUMN profiles.company_registration_number IS 'Japanese corporate number (法人番号)';
COMMENT ON COLUMN orders.stripe_invoice_id IS 'Stripe Invoice ID for invoice payments';
