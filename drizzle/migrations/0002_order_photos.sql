ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS photos text[] NOT NULL DEFAULT '{}';
CREATE POLICY "order photos upload" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'order-photos');
CREATE POLICY "order photos read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'order-photos');