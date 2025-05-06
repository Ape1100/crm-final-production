/*
  # Add business profile fields

  1. Changes
    - Add business-related columns to profiles table:
      - business_name (text)
      - business_email (text)
      - business_type (text)
      - address (text)
      - website (text)
    
  2. Security
    - Maintains existing RLS policies
*/

-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS business_name text,
ADD COLUMN IF NOT EXISTS business_email text,
ADD COLUMN IF NOT EXISTS business_type text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS website text;