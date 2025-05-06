/*
  # Add email lock table and functions

  1. New Table
    - `email_locks` to prevent duplicate sends
    
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create email locks table
CREATE TABLE IF NOT EXISTS email_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_locks ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Edge Functions can manage email locks"
  ON email_locks
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);