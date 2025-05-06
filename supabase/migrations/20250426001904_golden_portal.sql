/*
  # Add email lock table and functions

  1. New Table
    - `email_locks` to prevent duplicate sends
    
  2. New Functions
    - `acquire_email_lock` to get exclusive lock
    - `release_email_lock` to release lock
    
  3. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create email locks table
CREATE TABLE IF NOT EXISTS email_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  locked_at timestamptz NOT NULL DEFAULT now(),
  locked_by uuid NOT NULL REFERENCES auth.users(id),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes')
);

-- Enable RLS
ALTER TABLE email_locks ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can manage their email locks"
  ON email_locks
  FOR ALL
  TO authenticated
  USING (locked_by = auth.uid())
  WITH CHECK (locked_by = auth.uid());

-- Function to acquire lock
CREATE OR REPLACE FUNCTION acquire_email_lock(
  p_invoice_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_lock_exists boolean;
BEGIN
  -- Check for existing valid lock
  SELECT EXISTS (
    SELECT 1 
    FROM email_locks 
    WHERE invoice_id = p_invoice_id 
    AND expires_at > now()
  ) INTO v_lock_exists;

  IF v_lock_exists THEN
    RETURN false;
  END IF;

  -- Remove expired locks
  DELETE FROM email_locks 
  WHERE invoice_id = p_invoice_id 
  AND expires_at <= now();

  -- Try to acquire lock
  INSERT INTO email_locks (invoice_id, locked_by)
  VALUES (p_invoice_id, p_user_id)
  ON CONFLICT DO NOTHING;

  RETURN true;
EXCEPTION
  WHEN unique_violation THEN
    RETURN false;
END;
$$;

-- Function to release lock
CREATE OR REPLACE FUNCTION release_email_lock(
  p_invoice_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM email_locks 
  WHERE invoice_id = p_invoice_id 
  AND locked_by = p_user_id;
END;
$$;