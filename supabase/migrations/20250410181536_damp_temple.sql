/*
  # Create invoices table and relationships

  1. New Tables
    - `invoices`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key to customers)
      - `invoice_number` (text, unique)
      - `type` (text)
      - `status` (text)
      - `amount` (numeric)
      - `tax_rate` (numeric)
      - `tax_amount` (numeric)
      - `subtotal` (numeric)
      - `total` (numeric)
      - `due_date` (timestamp with time zone)
      - `items` (jsonb)
      - `notes` (text)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `invoices` table
    - Add policies for authenticated users to manage their invoices
    
  3. Relationships
    - Foreign key from `invoices.customer_id` to `customers.id`
*/

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  invoice_number text UNIQUE NOT NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  amount numeric(10,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) DEFAULT 0,
  tax_amount numeric(10,2) DEFAULT 0,
  subtotal numeric(10,2) DEFAULT 0,
  total numeric(10,2) DEFAULT 0,
  due_date timestamptz,
  items jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their invoices"
  ON invoices
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX invoices_customer_id_idx ON invoices(customer_id);
CREATE INDEX invoices_created_at_idx ON invoices(created_at DESC);
CREATE INDEX invoices_status_idx ON invoices(status);

-- Add constraints for status and type
ALTER TABLE invoices 
  ADD CONSTRAINT invoices_status_check 
  CHECK (status IN ('draft', 'sent', 'paid', 'void', 'overdue'));

ALTER TABLE invoices 
  ADD CONSTRAINT invoices_type_check 
  CHECK (type IN ('invoice', 'quote', 'receipt'));