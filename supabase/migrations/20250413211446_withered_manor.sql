/*
  # Add email settings support

  1. Changes
    - Add email configuration to settings table
    - Add default values for email settings
    
  2. Security
    - Maintains existing RLS policies
*/

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
      'from_email', 'MS_bJzDiC@test-3m5jgro7z5xgdpyo.mlsender.net',
      'from_name', 'BoltCRM'
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