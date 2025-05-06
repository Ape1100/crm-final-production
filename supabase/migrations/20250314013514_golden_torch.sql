/*
  # Add business logo support

  1. Changes
    - Add logo_url column to profiles table
    - Add logo_settings column to store metadata
  
  2. Security
    - Maintains existing RLS policies
*/

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS logo_settings jsonb DEFAULT jsonb_build_object(
  'allowed_types', ARRAY['image/jpeg', 'image/png', 'application/pdf'],
  'max_size', 5242880 -- 5MB in bytes
);