-- =============================================
-- Add Stripe Customer ID to profiles
-- =============================================

-- Stripe Customerを管理するためのカラムを追加
-- 銀行振込（customer_balance）を使用するにはStripe Customerが必要
ALTER TABLE profiles ADD COLUMN stripe_customer_id VARCHAR(255);

-- インデックスを追加
CREATE INDEX idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
