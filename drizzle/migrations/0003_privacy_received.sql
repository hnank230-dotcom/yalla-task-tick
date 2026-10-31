ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS privacy boolean NOT NULL DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS received boolean NOT NULL DEFAULT false;