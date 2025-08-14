/*
  # Reset database and create storage buckets

  1. Reset sequences for clean IDs
  2. Create storage buckets for file uploads
  3. Set up proper RLS policies for buckets
*/

-- Reset all sequences to start from 1
DO $$
DECLARE
    seq_record RECORD;
BEGIN
    FOR seq_record IN 
        SELECT schemaname, sequencename 
        FROM pg_sequences 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ALTER SEQUENCE ' || quote_ident(seq_record.schemaname) || '.' || quote_ident(seq_record.sequencename) || ' RESTART WITH 1';
    END LOOP;
END $$;

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('device-files', 'device-files', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('intervention-files', 'intervention-files', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for device-files bucket
CREATE POLICY "Public can view device files" ON storage.objects
  FOR SELECT USING (bucket_id = 'device-files');

CREATE POLICY "Authenticated users can upload device files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'device-files' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can update device files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'device-files' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete device files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'device-files' AND 
    auth.role() = 'authenticated'
  );

-- Create RLS policies for intervention-files bucket
CREATE POLICY "Authenticated users can view intervention files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'intervention-files' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can upload intervention files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'intervention-files' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can update intervention files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'intervention-files' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete intervention files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'intervention-files' AND 
    auth.role() = 'authenticated'
  );