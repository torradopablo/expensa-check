export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  amount: number;
  percentage?: number | null;
  expense_type: "ordinaria" | "extraordinaria" | "fondo_reserva";
  provider_name?: string | null;
  provider_cuit?: string | null;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  current_amount: number;
  previous_amount: number | null;
  status: "ok" | "attention" | "normal" | "high" | "low" | "new";
  explanation: string | null;
  expense_subcategories?: Subcategory[];
}

export interface Analysis {
  id: string;
  building_name: string;
  period: string;
  unit: string | null;
  total_amount: number;
  previous_total: number | null;
  status: "pending" | "paid" | "processing" | "completed" | "failed";
  created_at: string;
  period_date: string | null;
  file_url: string | null;
  scanned_at: string | null;
  expense_categories?: Category[];
  evolution_analysis?: string | null;
  deviation_stats?: any | null;
  building_profile_id?: string | null;
  administrator_name?: string | null;
  administrator_cuit?: string | null;
}

export interface EvolutionData {
  period: string;
  periodDate?: string | null;
  userPercent: number;
  inflationPercent: number | null;
  inflationEstimated: boolean;
  buildingsPercent: number | null;
}

export interface DeviationAnalysis {
  fromInflation: number;
  fromBuildings: number;
  isSignificant: boolean;
}

export interface BuildingProfile {
  id: string;
  user_id: string;
  building_name: string;
  country: string;
  province: string | null;
  city: string | null;
  neighborhood: string | null;
  zone: "CABA" | "GBA Norte" | "GBA Oeste" | "GBA Sur" | "Interior" | null;
  unit_count_range: "1-10" | "11-30" | "31-50" | "51-100" | "100+" | null;
  age_category: string | null;
  has_amenities: boolean;
  amenities: string[];
  created_at: string;
  updated_at: string;
}

export interface InflationData {
  period: string;
  value: number;
  is_estimated: boolean;
}

export interface BuildingsTrendStats {
  totalBuildings: number;
  totalAnalyses: number;
  averageIncrease: number;
  medianIncrease: number;
  periodsCount?: number;
  filtersApplied?: boolean;
  usedFallback?: boolean;
  appliedFilters?: string[];
}

export interface SharedAnalysis {
  analysis: Analysis;
  categories: Category[];
  historicalData: Analysis[];
  evolutionData: EvolutionData[];
  deviation: DeviationAnalysis | null;
  buildingsTrendStats: BuildingsTrendStats | null;
}

export interface AnalysisRequest {
  userTrend: { period: string; percent: number }[];
  inflationTrend: { period: string; percent: number }[];
  buildingsTrend: { period: string; percent: number }[];
  buildingName: string;
}
