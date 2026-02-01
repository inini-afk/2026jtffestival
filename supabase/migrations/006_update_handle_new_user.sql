-- =============================================
-- Update handle_new_user to include account_type
-- =============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, company, account_type, company_country)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'company',
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'individual'),
    'JP'  -- Default to Japan
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
