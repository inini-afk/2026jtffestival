-- =============================================
-- JTF Translation Festival 2026 - Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. Profiles (extends auth.users)
-- =============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  roles TEXT[] DEFAULT ARRAY['purchaser']::TEXT[],  -- 'purchaser', 'attendee', 'admin'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, company)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'company'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- 2. Ticket Types (reference table)
-- =============================================
CREATE TABLE ticket_types (
  id TEXT PRIMARY KEY,  -- 'full', 'onsite', 'online', 'party'
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,  -- in JPY
  includes_onsite BOOLEAN DEFAULT FALSE,
  includes_online BOOLEAN DEFAULT FALSE,
  includes_party BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default ticket types
INSERT INTO ticket_types (id, name, description, price, includes_onsite, includes_online, includes_party) VALUES
  ('full', 'Full Package', '会場参加＋オンデマンド視聴＋交流パーティー', 30000, TRUE, TRUE, TRUE),
  ('onsite', '会場参加', '会場参加のみ（オンデマンド視聴なし）', 15000, TRUE, FALSE, FALSE),
  ('online', 'オンデマンド視聴', 'オンデマンド視聴のみ', 10000, FALSE, TRUE, FALSE),
  ('party', '交流パーティー', '交流パーティーのみ（要別途参加券）', 5000, FALSE, FALSE, TRUE);

-- =============================================
-- 3. Orders
-- =============================================
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'cancelled', 'refunded');
CREATE TYPE payment_method AS ENUM ('card', 'bank_transfer', 'invoice');

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,  -- 'ORD-2026-XXXXX'
  purchaser_id UUID NOT NULL REFERENCES profiles(id),
  status order_status DEFAULT 'pending',
  payment_method payment_method,
  subtotal INTEGER NOT NULL,  -- in JPY
  tax INTEGER NOT NULL,       -- consumption tax
  total INTEGER NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-2026-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE order_number_seq START 1;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- =============================================
-- 4. Order Items
-- =============================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ticket_type_id TEXT NOT NULL REFERENCES ticket_types(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. Tickets
-- =============================================
CREATE TYPE ticket_status AS ENUM ('unassigned', 'invited', 'assigned');

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number TEXT UNIQUE NOT NULL,  -- 'TKT-2026-XXXXX'
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  ticket_type_id TEXT NOT NULL REFERENCES ticket_types(id),
  purchaser_id UUID NOT NULL REFERENCES profiles(id),
  attendee_id UUID REFERENCES profiles(id),  -- NULL until assigned
  status ticket_status DEFAULT 'unassigned',
  invite_email TEXT,
  invite_token TEXT UNIQUE,
  invite_sent_at TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number := 'TKT-2026-' || LPAD(NEXTVAL('ticket_number_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE ticket_number_seq START 1;

CREATE TRIGGER set_ticket_number
  BEFORE INSERT ON tickets
  FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();

-- =============================================
-- 6. Row Level Security (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Ticket types are public (read-only)
CREATE POLICY "Anyone can view ticket types"
  ON ticket_types FOR SELECT
  TO authenticated, anon
  USING (TRUE);

-- Orders policies
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (purchaser_id = auth.uid());

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (purchaser_id = auth.uid());

-- Order items policies
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    order_id IN (SELECT id FROM orders WHERE purchaser_id = auth.uid())
  );

-- Tickets policies
CREATE POLICY "Purchasers can view their purchased tickets"
  ON tickets FOR SELECT
  USING (purchaser_id = auth.uid());

CREATE POLICY "Attendees can view their assigned tickets"
  ON tickets FOR SELECT
  USING (attendee_id = auth.uid());

CREATE POLICY "Purchasers can update their tickets (for inviting)"
  ON tickets FOR UPDATE
  USING (purchaser_id = auth.uid());

-- =============================================
-- 7. Indexes
-- =============================================
CREATE INDEX idx_orders_purchaser ON orders(purchaser_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_tickets_purchaser ON tickets(purchaser_id);
CREATE INDEX idx_tickets_attendee ON tickets(attendee_id);
CREATE INDEX idx_tickets_invite_token ON tickets(invite_token);
CREATE INDEX idx_tickets_status ON tickets(status);

-- =============================================
-- 8. Updated_at trigger
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
