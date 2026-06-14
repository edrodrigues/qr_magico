-- The app_secrets table may already exist with key-based PK.
-- Using IF NOT EXISTS to make the migration idempotent.
CREATE TABLE IF NOT EXISTS public.app_secrets (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;

-- Only the Edge Function (service_role) should access this table.
-- No RLS policies for anon/users — only service_role bypasses RLS.

INSERT INTO public.app_secrets (key, value)
VALUES ('ELEVENLABS_API_KEY', '')
ON CONFLICT (key) DO NOTHING;
