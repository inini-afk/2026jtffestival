-- =============================================
-- Promo Codes System
-- =============================================

-- Discount type enum
CREATE TYPE discount_type AS ENUM (
  'free_all',       -- 全チケット無料
  'member_price',   -- 会員価格適用
  'free_venue',     -- 会場参加無料
  'free_ondemand',  -- オンデマンド無料
  'exclude_party',  -- パーティー以外無料
  'fixed_price'     -- 固定価格
);

-- Promo code category enum
CREATE TYPE promo_category AS ENUM (
  'member',    -- JTF会員
  'sponsor',   -- スポンサー
  'speaker',   -- 登壇者
  'partner',   -- 後援団体
  'school',    -- 教育機関
  'staff',     -- 事務局・委員
  'test'       -- テスト用
);

-- =============================================
-- Promo Codes Table
-- =============================================
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Discount settings
  discount_type discount_type NOT NULL,
  fixed_price INTEGER,  -- Only used when discount_type = 'fixed_price'
  member_price_discount INTEGER DEFAULT 0,  -- Discount amount for member_price type

  -- Usage limits
  max_total_uses INTEGER,         -- NULL = unlimited
  max_uses_per_user INTEGER DEFAULT 1,  -- NULL = unlimited
  current_uses INTEGER DEFAULT 0,

  -- Target tickets (NULL = all tickets)
  applicable_ticket_types TEXT[],

  -- Validity period
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,

  -- Metadata
  category promo_category,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Promo Code Usage History
-- =============================================
CREATE TABLE promo_code_uses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Add promo_code reference to orders
-- =============================================
ALTER TABLE orders ADD COLUMN promo_code_id UUID REFERENCES promo_codes(id);
ALTER TABLE orders ADD COLUMN discount_amount INTEGER DEFAULT 0;

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_category ON promo_codes(category);
CREATE INDEX idx_promo_codes_active ON promo_codes(is_active);
CREATE INDEX idx_promo_code_uses_promo ON promo_code_uses(promo_code_id);
CREATE INDEX idx_promo_code_uses_user ON promo_code_uses(user_id);

-- =============================================
-- Row Level Security
-- =============================================
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_uses ENABLE ROW LEVEL SECURITY;

-- Promo codes are readable by all authenticated users
CREATE POLICY "Anyone can read active promo codes"
  ON promo_codes FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- Users can only see their own usage history
CREATE POLICY "Users can view own promo code uses"
  ON promo_code_uses FOR SELECT
  USING (user_id = auth.uid());

-- =============================================
-- Updated_at trigger for promo_codes
-- =============================================
CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON promo_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- Function to validate and apply promo code
-- =============================================
CREATE OR REPLACE FUNCTION validate_promo_code(
  p_code TEXT,
  p_user_id UUID
)
RETURNS TABLE (
  is_valid BOOLEAN,
  promo_code_id UUID,
  discount_type discount_type,
  fixed_price INTEGER,
  error_message TEXT
) AS $$
DECLARE
  v_promo promo_codes%ROWTYPE;
  v_user_uses INTEGER;
BEGIN
  -- Find the promo code
  SELECT * INTO v_promo FROM promo_codes
  WHERE code = UPPER(p_code) AND is_active = TRUE;

  -- Check if code exists
  IF v_promo.id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::discount_type, NULL::INTEGER, 'Invalid promo code'::TEXT;
    RETURN;
  END IF;

  -- Check validity period
  IF v_promo.valid_from IS NOT NULL AND NOW() < v_promo.valid_from THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::discount_type, NULL::INTEGER, 'This code is not yet valid'::TEXT;
    RETURN;
  END IF;

  IF v_promo.valid_until IS NOT NULL AND NOW() > v_promo.valid_until THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::discount_type, NULL::INTEGER, 'This code has expired'::TEXT;
    RETURN;
  END IF;

  -- Check total usage limit
  IF v_promo.max_total_uses IS NOT NULL AND v_promo.current_uses >= v_promo.max_total_uses THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::discount_type, NULL::INTEGER, 'This code has reached its usage limit'::TEXT;
    RETURN;
  END IF;

  -- Check per-user usage limit
  IF v_promo.max_uses_per_user IS NOT NULL THEN
    SELECT COUNT(*) INTO v_user_uses FROM promo_code_uses
    WHERE promo_code_id = v_promo.id AND user_id = p_user_id;

    IF v_user_uses >= v_promo.max_uses_per_user THEN
      RETURN QUERY SELECT FALSE, NULL::UUID, NULL::discount_type, NULL::INTEGER, 'You have already used this code'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Code is valid
  RETURN QUERY SELECT TRUE, v_promo.id, v_promo.discount_type, v_promo.fixed_price, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Function to record promo code usage
-- =============================================
CREATE OR REPLACE FUNCTION use_promo_code(
  p_promo_code_id UUID,
  p_user_id UUID,
  p_order_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Insert usage record
  INSERT INTO promo_code_uses (promo_code_id, user_id, order_id)
  VALUES (p_promo_code_id, p_user_id, p_order_id);

  -- Increment usage counter
  UPDATE promo_codes
  SET current_uses = current_uses + 1
  WHERE id = p_promo_code_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Sample Promo Codes (2026)
-- =============================================
INSERT INTO promo_codes (code, name, description, discount_type, max_uses_per_user, category) VALUES
  ('JTF2026-PERSONAL', 'JTF個人会員用', 'JTF個人会員向け割引コード', 'member_price', 1, 'member'),
  ('JTF2026-CORP', 'JTF法人会員用', 'JTF法人会員向け割引コード（回数無制限）', 'member_price', NULL, 'member'),
  ('STUDENT2026', '学生プロモーション', '学生向け割引（会員価格適用）', 'member_price', 1, 'school'),
  ('SPEAKER2026', '登壇者用', '登壇者向け無料コード', 'free_all', 1, 'speaker'),
  ('STAFF2026', '事務局用', '事務局スタッフ向け無料コード', 'free_all', NULL, 'staff'),
  ('TEST2026', 'テスト用', '決済テスト用（1000円固定）', 'fixed_price', NULL, 'test');

-- Set fixed price for test code
UPDATE promo_codes SET fixed_price = 1000 WHERE code = 'TEST2026';
