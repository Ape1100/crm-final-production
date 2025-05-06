/*
  # Add Inventory Management Tables

  1. New Tables
    - `inventory_categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
    
    - `inventory_items`
      - `id` (uuid, primary key)
      - `sku` (text, unique)
      - `name` (text)
      - `category_id` (uuid, foreign key)
      - `price` (numeric)
      - `stock_quantity` (integer)
      - `barcode` (text, optional)
      - `batch_tracking` (boolean)
      - `expiration_date` (timestamp, optional)
      - `reorder_point` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `inventory_transactions`
      - `id` (uuid, primary key)
      - `item_id` (uuid, foreign key)
      - `type` (text: sale/purchase/adjustment)
      - `quantity` (integer)
      - `notes` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create inventory categories table
CREATE TABLE IF NOT EXISTS inventory_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create inventory items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE NOT NULL,
  name text NOT NULL,
  category_id uuid REFERENCES inventory_categories(id),
  price numeric(10,2) NOT NULL DEFAULT 0,
  stock_quantity integer NOT NULL DEFAULT 0,
  barcode text,
  batch_tracking boolean DEFAULT false,
  expiration_date timestamptz,
  reorder_point integer DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create inventory transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES inventory_items(id) ON DELETE CASCADE,
  type text CHECK (type IN ('sale', 'purchase', 'adjustment')) NOT NULL,
  quantity integer NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage inventory categories"
  ON inventory_categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can manage inventory items"
  ON inventory_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can manage inventory transactions"
  ON inventory_transactions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to update stock quantity
CREATE OR REPLACE FUNCTION update_stock_quantity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE inventory_items
  SET stock_quantity = stock_quantity + NEW.quantity
  WHERE id = NEW.item_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating stock quantity
CREATE TRIGGER update_stock_quantity_trigger
AFTER INSERT ON inventory_transactions
FOR EACH ROW
EXECUTE FUNCTION update_stock_quantity();