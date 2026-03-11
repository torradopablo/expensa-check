-- Create a cache table to avoid re-generating meeting checklists with AI

CREATE TABLE IF NOT EXISTS public.meeting_prep_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT NOT NULL UNIQUE,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_meeting_prep_cache_key ON public.meeting_prep_cache(cache_key);

-- Enable RLS
ALTER TABLE public.meeting_prep_cache ENABLE ROW LEVEL SECURITY;

-- No public policies needed as this will only be queried via Supabase edge functions using the service_role key
