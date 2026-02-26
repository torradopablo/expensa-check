import { createSupabaseClient } from "../../config/supabase.ts";
import type { Category, BuildingProfile } from "../../types/analysis.types.ts";

export class AnalysisRepository {
  private supabase: ReturnType<typeof createSupabaseClient>;

  constructor(authHeader?: string) {
    this.supabase = createSupabaseClient(authHeader);
  }

  async createAnalysis(analysisData: {
    id: string;
    user_id: string;
    building_name?: string;
    period?: string;
    period_date?: string;
    unit?: string;
    total_amount?: number;
    previous_total?: number;
    file_url?: string;
    status?: string;
    scanned_at?: string;
    building_profile_id?: string;
  }) {
    const { data, error } = await this.supabase
      .from("expense_analyses")
      .insert(analysisData)
      .select()
      .single();

    return { data, error };
  }

  async updateAnalysis(id: string, updates: Partial<{
    building_name: string;
    period: string;
    period_date: string;
    unit: string;
    total_amount: number;
    previous_total: number;
    file_url: string;
    status: string;
    scanned_at: string;
    evolution_analysis: string;
    deviation_stats: any;
    building_profile_id: string;
    administrator_name: string;
    administrator_cuit: string;
  }>) {
    const { data, error } = await this.supabase
      .from("expense_analyses")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  }

  async getAnalysis(id: string) {
    const { data, error } = await this.supabase
      .from("expense_analyses")
      .select("*")
      .eq("id", id)
      .single();

    return { data, error };
  }

  async getUserAnalyses(userId: string, buildingName?: string) {
    let query = this.supabase
      .from("expense_analyses")
      .select("id, period, total_amount, created_at, period_date")
      .eq("user_id", userId);

    if (buildingName) {
      query = query.eq("building_name", buildingName);
    }

    const { data, error } = await query.order("period_date", { ascending: true, nullsFirst: false });

    return { data, error };
  }

  async getBuildingNames(userId: string, excludeAnalysisId?: string) {
    let query = this.supabase
      .from("expense_analyses")
      .select("building_name")
      .eq("user_id", userId)
      .not("building_name", "is", null);

    if (excludeAnalysisId) {
      query = query.neq("id", excludeAnalysisId);
    }

    const { data, error } = await query;

    return { data, error };
  }

  async getAllCompletedAnalyses() {
    const { data, error } = await this.supabase
      .from("expense_analyses")
      .select("period, total_amount, building_name")
      .eq("status", "completed")
      .not("building_name", "is", null);

    return { data, error };
  }

  async createCategories(categories: Array<{
    analysis_id: string;
    name: string;
    icon?: string | null;
    current_amount: number;
    previous_amount?: number | null;
    status?: string;
    explanation?: string | null;
  }>) {
    const { data, error } = await this.supabase
      .from("expense_categories")
      .insert(categories)
      .select();

    return { data, error };
  }

  async getCategories(analysisId: string) {
    const { data, error } = await this.supabase
      .from("expense_categories")
      .select("id, name, icon, current_amount, previous_amount, status, explanation, expense_subcategories(*)")
      .eq("analysis_id", analysisId)
      .order("current_amount", { ascending: false });

    return { data, error };
  }

  async createSubcategories(subcategories: Array<{
    category_id: string;
    name: string;
    amount: number;
    percentage?: number | null;
    expense_type?: string | null;
    provider_name?: string | null;
    provider_cuit?: string | null;
  }>) {
    const { data, error } = await this.supabase
      .from("expense_subcategories")
      .insert(subcategories)
      .select();

    return { data, error };
  }

  async createAnonymizedProviderPrices(prices: Array<{
    provider_name: string;
    provider_cuit?: string | null;
    provider_type?: string | null;
    cuit_confirmed?: boolean | null;
    category_name: string;
    subcategory_name: string;
    amount: number;
    expense_type?: string | null;
    period: string;
    period_month?: number | null;
    period_year?: number | null;
    building_zone?: string | null;
    building_unit_count?: string | null;
    city?: string | null;
    neighborhood?: string | null;
    province?: string | null;
    raw_building_address?: string | null;
  }>) {
    const { data, error } = await this.supabase
      .from("anonymized_provider_prices")
      .insert(prices)
      .select();

    return { data, error };
  }

  async createAnonymizedAdministratorData(adminData: {
    administrator_name: string;
    administrator_cuit?: string | null;
    cuit_confirmed?: boolean | null;
    contact_phone?: string | null;
    contact_email?: string | null;
    contact_address?: string | null;
    period: string;
    period_month?: number | null;
    period_year?: number | null;
    building_zone?: string | null;
    building_unit_count?: string | null;
    city?: string | null;
    neighborhood?: string | null;
    province?: string | null;
    raw_building_address?: string | null;
  }) {
    const { data, error } = await this.supabase
      .from("anonymized_administrator_data")
      .insert(adminData)
      .select();

    return { data, error };
  }

  async getPreviousCategories(analysisId: string) {
    const { data, error } = await this.supabase
      .from("expense_categories")
      .select("name, current_amount")
      .eq("analysis_id", analysisId);

    return { data, error };
  }

  async getUserCategories(userId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from("expense_categories")
      .select(`
        name,
        expense_analyses!inner(user_id)
      `)
      .eq("expense_analyses.user_id", userId);

    if (error || !data) return [];
    const names = data.map((c: any) => c.name as string);
    return Array.from(new Set(names)) as string[];
  }

  async getLatestBuildingCategories(userId: string, buildingName: string): Promise<string[]> {
    const { data: latestAnalysis, error: analysisError } = await this.supabase
      .from("expense_analyses")
      .select("id")
      .eq("user_id", userId)
      .eq("building_name", buildingName)
      .order("period_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (analysisError || !latestAnalysis) return [];

    const { data: categories, error: catError } = await this.supabase
      .from("expense_categories")
      .select("name")
      .eq("analysis_id", latestAnalysis.id);

    if (catError || !categories) return [];
    return (categories as { name: string }[]).map(c => c.name);
  }
}
