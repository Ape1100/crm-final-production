-- Create storage bucket for documents
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
  auth.uid()::text = SPLIT_PART(name, '/', 2)
)
WITH CHECK (
  bucket_id = 'documents' AND
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
  auth.uid()::text = SPLIT_PART(name, '/', 2)
);

-- Create policy to allow public access to view documents
CREATE POLICY "Public can view documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documents');