DO $$ 
BEGIN
  -- Create table if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'email_opens'
  ) THEN
    CREATE TABLE email_opens (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
      customer_id uuid REFERENCES customers(id),
      opened_at timestamptz NOT NULL DEFAULT now(),
      created_at timestamptz DEFAULT now(),
      ip_address text,
      user_agent text
    );
  END IF;

  -- Enable RLS if not already enabled
  ALTER TABLE email_opens ENABLE ROW LEVEL SECURITY;

  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their email opens" ON email_opens;
  DROP POLICY IF EXISTS "Edge Functions can insert email opens" ON email_opens;

  -- Create policies
  CREATE POLICY "Users can view their email opens"
    ON email_opens
    FOR SELECT
    TO authenticated
    USING (
      invoice_id IN (
        SELECT id FROM invoices WHERE true
      )
    );

  CREATE POLICY "Edge Functions can insert email opens"
    ON email_opens
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

END $$;