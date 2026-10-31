CREATE TABLE public.orders (
  id text PRIMARY KEY,
  kind text NOT NULL DEFAULT 'pickup',
  customer text NOT NULL DEFAULT 'عميل ناصع',
  phone text NOT NULL DEFAULT '0500000000',
  area text NOT NULL DEFAULT 'حي النرجس',
  time text NOT NULL DEFAULT '',
  pieces int NOT NULL DEFAULT 0,
  handover text NOT NULL DEFAULT 'تعليقة الباب',
  total numeric NOT NULL DEFAULT 0,
  paid boolean NOT NULL DEFAULT false,
  step int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo read" ON public.orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "demo insert" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (step = 0);
CREATE POLICY "demo update" ON public.orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (step BETWEEN 0 AND 3);
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;