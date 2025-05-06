/*
  # Fix activity logs RLS policies

  1. Changes
    - Enable RLS on activity_logs table
    - Create separate policies for SELECT and INSERT operations
    - Ensure authenticated users can insert and view their own logs

  2. Security
    - Users can only view their own activity logs
    - Users can only insert logs with their own user_id
*/

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can insert activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can manage their activity logs" ON activity_logs;

-- Create separate policies for SELECT and INSERT
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