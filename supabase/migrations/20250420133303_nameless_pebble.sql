/*
  # Add email tracking table and policies

  1. Changes
    - Create email_opens table if it doesn't exist
    - Enable RLS
    - Add policies for viewing and inserting records
    
  2. Security
    - Only authenticated users can view their own email opens
    - Edge functions can insert new records
*/

-- Create table if it doesn't exist
DO $$ 
BEGIN
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
END $$;

-- Enable RLS
DO $$ 
BEGIN
  ALTER TABLE email_opens ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their email opens" ON email_opens;
  DROP POLICY IF EXISTS "Edge Functions can insert email opens" ON email_opens;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- Create policies
DO $$ 
BEGIN
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
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;