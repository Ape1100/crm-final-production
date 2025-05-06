-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can view documents" ON storage.objects;

-- Create storage bucket for documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload files
CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = split_part(name, '/', 1) AND
  (CASE RIGHT(LOWER(name), 4)
    WHEN '.pdf' THEN true
    ELSE false
  END)
);

-- Create policy to allow authenticated users to update their own files
CREATE POLICY "Users can update their own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = split_part(name, '/', 1)
)
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = split_part(name, '/', 1) AND
  (CASE RIGHT(LOWER(name), 4)
    WHEN '.pdf' THEN true
    ELSE false
  END)
);

-- Create policy to allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = split_part(name, '/', 1)
);

-- Create policy to allow public access to view documents
CREATE POLICY "Public can view documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documents');