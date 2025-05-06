/*
  # Fix email locks table and constraints

  1. Changes
    - Drop existing email_locks table
    - Recreate with proper unique constraint on invoice_id
    - Add better expiration handling
    - Update policies
    
  2. Security
    - Maintain RLS policies
    - Add proper constraints
*/

-- Drop existing table and recreate with proper constraints
DROP TABLE IF EXISTS email_locks;

CREATE TABLE email_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE UNIQUE,
  locked_at timestamptz NOT NULL DEFAULT now(),
  locked_by uuid NOT NULL REFERENCES auth.users(id),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes')
);

-- Enable RLS
ALTER TABLE email_locks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Edge Functions can manage email locks"
  ON email_locks
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can manage their email locks"
  ON email_locks
  FOR ALL
  TO authenticated
  USING (locked_by = auth.uid())
  WITH CHECK (locked_by = auth.uid());

-- Create index for faster lookups
CREATE INDEX email_locks_invoice_id_idx ON email_locks(invoice_id);
CREATE INDEX email_locks_expires_at_idx ON email_locks(expires_at);

-- Create function to clean up expired locks
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS trigger AS $$
BEGIN
  DELETE FROM email_locks
  WHERE expires_at < now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to clean up expired locks
CREATE TRIGGER cleanup_expired_locks
  BEFORE INSERT ON email_locks
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_expired_locks();