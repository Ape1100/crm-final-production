/*
  # Add Email Tracking Support

  1. New Tables
    - `email_opens`
      - `id` (uuid, primary key)
      - `invoice_id` (uuid, foreign key)
      - `customer_id` (uuid, foreign key)
      - `opened_at` (timestamptz)
      - `created_at` (timestamptz)
      - `ip_address` (text)
      - `user_agent` (text)

  2. Security
    - Enable RLS on email_opens table
    - Add policies for authenticated users
*/

CREATE TABLE email_opens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id),
  opened_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Enable RLS
ALTER TABLE email_opens ENABLE ROW LEVEL SECURITY;

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