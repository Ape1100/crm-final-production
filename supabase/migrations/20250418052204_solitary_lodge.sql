/*
  # Add updated_at column to invoices table

  1. Changes
    - Add `updated_at` column to `invoices` table with default value
    - Create trigger function to update timestamp
    - Add trigger to automatically update the timestamp
    
  2. Security
    - No changes to RLS policies required
*/

-- Add updated_at column
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger (will error if exists, which is fine)
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();