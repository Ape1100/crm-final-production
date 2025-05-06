-- Create function to get table policies
CREATE OR REPLACE FUNCTION get_policies(table_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT json_agg(json_build_object(
    'policyname', pol.policyname,
    'cmd', pol.cmd,
    'permissive', pol.permissive,
    'roles', pol.roles,
    'qual', pol.qual,
    'with_check', pol.with_check
  ))::jsonb
  INTO result
  FROM pg_policies pol
  WHERE pol.tablename = table_name
  AND pol.schemaname = 'public';

  RETURN result;
END;
$$;

-- Create function to recreate email tracking policies
CREATE OR REPLACE FUNCTION recreate_email_tracking_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can view their email opens" ON email_opens;
  DROP POLICY IF EXISTS "Edge Functions can insert email opens" ON email_opens;
  DROP POLICY IF EXISTS "Anyone can insert email opens" ON email_opens;

  -- Create new policies
  CREATE POLICY "Anyone can insert email opens"
    ON email_opens FOR INSERT
    TO public
    WITH CHECK (true);

  CREATE POLICY "Users can view their email opens"
    ON email_opens FOR SELECT
    TO authenticated
    USING (
      invoice_id IN (
        SELECT id FROM invoices
      )
    );

  -- Ensure RLS is enabled
  ALTER TABLE email_opens ENABLE ROW LEVEL SECURITY;

  -- Create indexes if they don't exist
  CREATE INDEX IF NOT EXISTS idx_email_opens_invoice_id ON email_opens(invoice_id);
  CREATE INDEX IF NOT EXISTS idx_email_opens_customer_id ON email_opens(customer_id);
  CREATE INDEX IF NOT EXISTS idx_email_opens_opened_at ON email_opens(opened_at DESC);
END;
$$;