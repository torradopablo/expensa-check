-- Create table for anonymized provider pricing data
CREATE TABLE public.anonymized_provider_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_name TEXT NOT NULL,
  provider_cuit TEXT,
  category_name TEXT NOT NULL,
  subcategory_name TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  expense_type TEXT,
  period TEXT NOT NULL,
  building_zone TEXT,
  building_unit_count TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for provider prices
ALTER TABLE public.anonymized_provider_prices ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can insert anonymized provider prices" ON public.anonymized_provider_prices
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can view anonymized provider prices" ON public.anonymized_provider_prices
  FOR SELECT USING (auth.role() = 'authenticated');


-- Create table for anonymized administrator tracking
CREATE TABLE public.anonymized_administrator_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  administrator_name TEXT NOT NULL,
  administrator_cuit TEXT,
  period TEXT NOT NULL,
  building_zone TEXT,
  building_unit_count TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for administrator data
ALTER TABLE public.anonymized_administrator_data ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can insert anonymized administrator data" ON public.anonymized_administrator_data
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can view anonymized administrator data" ON public.anonymized_administrator_data
  FOR SELECT USING (auth.role() = 'authenticated');
