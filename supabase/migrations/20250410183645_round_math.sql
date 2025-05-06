/*
  # Update invoice constraints to support estimates

  1. Changes
    - Update status check constraint to include 'estimate'
    - Update type check constraint to include 'estimate'
    
  2. Security
    - Maintains existing RLS policies
*/

-- Drop existing constraints
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_type_check;

-- Add updated constraints
ALTER TABLE invoices 
  ADD CONSTRAINT invoices_status_check 
  CHECK (status IN ('draft', 'sent', 'paid', 'void', 'overdue', 'estimate'));

ALTER TABLE invoices 
  ADD CONSTRAINT invoices_type_check 
  CHECK (type IN ('invoice', 'quote', 'receipt', 'estimate'));