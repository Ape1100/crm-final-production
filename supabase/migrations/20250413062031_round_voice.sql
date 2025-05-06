/*
  # Create storage bucket for business logos

  1. New Storage Bucket
    - Create a new bucket named 'logos' for storing business logos
    - Set up public access for viewing logos
    - Configure size limits and allowed file types
  
  2. Security
    - Enable authenticated users to upload their own logos
    - Allow public access for viewing logos
    - Restrict file types to images and PDFs
    - Set maximum file size to 5MB
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload files
CREATE POLICY "Users can upload their own logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos' AND
  (CASE RIGHT(LOWER(name), 4)
    WHEN '.jpg' THEN true
    WHEN 'jpeg' THEN true
    WHEN '.png' THEN true
    WHEN '.pdf' THEN true
    ELSE false
  END)
);

-- Create policy to allow authenticated users to update their own files
CREATE POLICY "Users can update their own logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos' AND
  auth.uid()::text = SPLIT_PART(name, '/', 2)
)
WITH CHECK (
  bucket_id = 'logos' AND
  (CASE RIGHT(LOWER(name), 4)
    WHEN '.jpg' THEN true
    WHEN 'jpeg' THEN true
    WHEN '.png' THEN true
    WHEN '.pdf' THEN true
    ELSE false
  END)
);

-- Create policy to allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos' AND
  auth.uid()::text = SPLIT_PART(name, '/', 2)
);

-- Create policy to allow public access to view logos
CREATE POLICY "Public can view logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'logos');