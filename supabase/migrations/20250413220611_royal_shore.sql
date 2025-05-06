-- Insert default email settings if they don't exist
CREATE OR REPLACE FUNCTION initialize_email_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO settings (
    user_id,
    type,
    settings
  ) VALUES (
    NEW.id,
    'email',
    jsonb_build_object(
      'api_key', NULL,
      'from_email', 'no-reply@boltcrm.app',
      'from_name', 'BoltCRM',
      'provider', 'mailersend'
    )
  ) ON CONFLICT (user_id, type) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to initialize email settings for new users
DROP TRIGGER IF EXISTS on_auth_user_created_email_settings ON auth.users;
CREATE TRIGGER on_auth_user_created_email_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_email_settings();