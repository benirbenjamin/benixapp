-- ==========================================
-- VOXIFY SPACE — STORAGE BUCKETS & SECURITY
-- Migration 00003: Storage Buckets Definition (Public Audio & PDFs)
-- ==========================================

-- Insert or update storage buckets into storage.buckets with public = true
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('profile-images', 'profile-images', true),
    ('choir-logos', 'choir-logos', true),
    ('song-audio', 'song-audio', true),
    ('song-parts', 'song-parts', true),
    ('song-documents', 'song-documents', true),
    ('announcement-attachments', 'announcement-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Ensure all storage buckets are marked public
UPDATE storage.buckets
SET public = true
WHERE id IN ('profile-images', 'choir-logos', 'song-audio', 'song-parts', 'song-documents', 'announcement-attachments');

-- Drop old restrictive storage policies
DROP POLICY IF EXISTS "Authenticated admins upload song files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated admins update song files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users access song audio" ON storage.objects;
DROP POLICY IF EXISTS "Public read song audio" ON storage.objects;
DROP POLICY IF EXISTS "Profile images public access" ON storage.objects;
DROP POLICY IF EXISTS "Users upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Choir logos public access" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload choir logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow song storage insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow song storage select" ON storage.objects;
DROP POLICY IF EXISTS "Allow song storage update" ON storage.objects;
DROP POLICY IF EXISTS "Allow song storage delete" ON storage.objects;

-- Create permissive storage object policies for song media & documents
CREATE POLICY "Allow song storage insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id IN ('song-audio', 'song-parts', 'song-documents', 'announcement-attachments', 'profile-images', 'choir-logos'));

CREATE POLICY "Allow song storage select"
ON storage.objects FOR SELECT
USING (bucket_id IN ('song-audio', 'song-parts', 'song-documents', 'announcement-attachments', 'profile-images', 'choir-logos'));

CREATE POLICY "Allow song storage update"
ON storage.objects FOR UPDATE
WITH CHECK (bucket_id IN ('song-audio', 'song-parts', 'song-documents', 'announcement-attachments', 'profile-images', 'choir-logos'));

CREATE POLICY "Allow song storage delete"
ON storage.objects FOR DELETE
USING (bucket_id IN ('song-audio', 'song-parts', 'song-documents', 'announcement-attachments', 'profile-images', 'choir-logos'));
