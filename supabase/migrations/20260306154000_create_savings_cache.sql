-- Create a cache table for savings opportunities to improve performance and reduce repeated computations
CREATE TABLE IF NOT EXISTS public.savings_opportunities_cache (
    analysis_id UUID PRIMARY KEY REFERENCES public.expense_analyses(id) ON DELETE CASCADE,
    opportunities JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.savings_opportunities_cache ENABLE ROW LEVEL SECURITY;

-- Service role access
CREATE POLICY "Service role can do everything on savings_opportunities_cache" 
ON public.savings_opportunities_cache
USING (true)
WITH CHECK (true);

-- Adding flag to expense_analyses for quick UI feedback
ALTER TABLE public.expense_analyses ADD COLUMN IF NOT EXISTS has_savings_opportunities BOOLEAN;

-- Index for the new column
CREATE INDEX IF NOT EXISTS idx_expense_analyses_has_savings ON public.expense_analyses(has_savings_opportunities) WHERE has_savings_opportunities IS TRUE;
