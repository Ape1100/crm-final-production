/*
  # Create customers and related tables

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `customer_number` (text, unique)
      - `first_name` (text)
      - `last_name` (text)
      - `email` (text)
      - `phone` (text)
      - `created_at` (timestamp)
    
    - `customer_notes`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key)
      - `content` (text)
      - `reminder_date` (timestamp)
      - `is_reminder` (boolean)
      - `created_at` (timestamp)
    
    - `products_services`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key)
      - `name` (text)
      - `type` (text)
      - `description` (text)
      - `date` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their data
*/

-- Create customers table
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_number text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- Create customer notes table
CREATE TABLE customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  content text NOT NULL,
  reminder_date timestamptz,
  is_reminder boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create products/services table
CREATE TABLE products_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text CHECK (type IN ('product', 'service')) NOT NULL,
  description text,
  date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE products_services ENABLE ROW LEVEL SECURITY;

-- Create policies for customers table
CREATE POLICY "Users can manage their customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for customer notes
CREATE POLICY "Users can manage their customer notes"
  ON customer_notes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for products/services
CREATE POLICY "Users can manage their products/services"
  ON products_services
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);