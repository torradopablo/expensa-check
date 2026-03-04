-- Enhance anonymized_provider_prices with richer detail
ALTER TABLE public.anonymized_provider_prices
  ADD COLUMN IF NOT EXISTS provider_type TEXT,              -- e.g. "ascensores", "limpieza", "seguros"
  ADD COLUMN IF NOT EXISTS city TEXT,                       -- City extracted from building address
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,               -- Barrio/neighborhood
  ADD COLUMN IF NOT EXISTS province TEXT,                   -- Province (e.g. "CABA", "Buenos Aires")
  ADD COLUMN IF NOT EXISTS period_month INTEGER,            -- Month number (1-12) for time-series
  ADD COLUMN IF NOT EXISTS period_year INTEGER,             -- Year for time-series
  ADD COLUMN IF NOT EXISTS cuit_confirmed BOOLEAN DEFAULT FALSE, -- Was CUIT explicitly in the document?
  ADD COLUMN IF NOT EXISTS raw_building_address TEXT;       -- Raw address string for future geolocation

-- Enhance anonymized_administrator_data with richer detail
ALTER TABLE public.anonymized_administrator_data
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS period_month INTEGER,
  ADD COLUMN IF NOT EXISTS period_year INTEGER,
  ADD COLUMN IF NOT EXISTS cuit_confirmed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,              -- Phone from document footer
  ADD COLUMN IF NOT EXISTS contact_email TEXT,              -- Email from document footer
  ADD COLUMN IF NOT EXISTS contact_address TEXT,            -- Admin office address if present
  ADD COLUMN IF NOT EXISTS raw_building_address TEXT;

-- Index for future Savings Engine queries (provider benchmarking)
CREATE INDEX IF NOT EXISTS idx_anon_provider_cuit ON public.anonymized_provider_prices(provider_cuit) WHERE provider_cuit IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_anon_provider_category_zone ON public.anonymized_provider_prices(category_name, building_zone);
CREATE INDEX IF NOT EXISTS idx_anon_provider_period ON public.anonymized_provider_prices(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_anon_provider_city ON public.anonymized_provider_prices(city) WHERE city IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_anon_admin_cuit ON public.anonymized_administrator_data(administrator_cuit) WHERE administrator_cuit IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_anon_admin_zone ON public.anonymized_administrator_data(building_zone);
CREATE INDEX IF NOT EXISTS idx_anon_admin_period ON public.anonymized_administrator_data(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_anon_admin_city ON public.anonymized_administrator_data(city) WHERE city IS NOT NULL;
