/*
  # Add paid_date column and fix activity logs RLS

  1. Changes
    - Add `paid_date` column to `invoices` table
    - Update RLS policy for `activity_logs` table to allow inserts from authenticated users

  2. Security
    - Enable RLS on `activity_logs` table
    - Add policy for authenticated users to insert activity logs
*/

-- Add paid_date column to invoices table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'paid_date'
  ) THEN
    ALTER TABLE invoices ADD COLUMN paid_date timestamptz;
  END IF;
END $$;

-- Update activity_logs RLS policies
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can insert activity logs" ON activity_logs;

-- Create new policies
CREATE POLICY "Users can view their activity logs"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert activity logs"
  ON activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());