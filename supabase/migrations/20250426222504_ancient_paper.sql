/*
  # Create invoices storage bucket and policies

  1. New Storage Bucket
    - Create a bucket named 'invoices' for storing invoice PDFs
    - Set up public access for viewing invoices
    - Configure policies for secure access
  
  2. Security
    - Enable authenticated users to upload their own invoices
    - Allow public access for viewing invoices
    - Restrict file types to PDFs only
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload files
CREATE POLICY "Users can upload their own invoices"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invoices' AND
  auth.uid()::text = split_part(name, '/', 1) AND
  (CASE RIGHT(LOWER(name), 4)
    WHEN '.pdf' THEN true
    ELSE false
  END)
);

-- Create policy to allow authenticated users to update their own files
CREATE POLICY "Users can update their own invoices"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'invoices' AND
  auth.uid()::text = split_part(name, '/', 1)
)
WITH CHECK (
  bucket_id = 'invoices' AND
  auth.uid()::text = split_part(name, '/', 1) AND
  (CASE RIGHT(LOWER(name), 4)
    WHEN '.pdf' THEN true
    ELSE false
  END)
);

-- Create policy to allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own invoices"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'invoices' AND
  auth.uid()::text = split_part(name, '/', 1)
);

-- Create policy to allow public access to view invoices
CREATE POLICY "Public can view invoices"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'invoices');