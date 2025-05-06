/*
  # Add email locks table and functions

  1. New Tables
    - `email_locks`
      - `id` (uuid, primary key)
      - `invoice_id` (uuid, foreign key)
      - `locked_at` (timestamptz)
      - `locked_by` (uuid, foreign key)
      - `expires_at` (timestamptz)

  2. Security
    - Enable RLS on `email_locks` table
    - Add policies for authenticated users and edge functions
*/

-- Create table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS email_locks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
    locked_at timestamptz NOT NULL DEFAULT now(),
    locked_by uuid REFERENCES auth.users(id),
    expires_at timestamptz NOT NULL DEFAULT (now() + '00:05:00'::interval)
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Enable RLS
DO $$ BEGIN
  ALTER TABLE email_locks ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Edge Functions can manage email locks" ON email_locks;
  DROP POLICY IF EXISTS "Users can manage their email locks" ON email_locks;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- Create policies
DO $$ BEGIN
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
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;