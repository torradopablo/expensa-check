-- Add administrator tracking to expense_analyses
ALTER TABLE public.expense_analyses
ADD COLUMN administrator_name TEXT,
ADD COLUMN administrator_cuit TEXT;

-- Add provider tracking to expense_subcategories
ALTER TABLE public.expense_subcategories
ADD COLUMN provider_name TEXT,
ADD COLUMN provider_cuit TEXT;
