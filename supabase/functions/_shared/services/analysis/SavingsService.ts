import { createSupabaseClient, createServiceClient } from "../../config/supabase.ts";
import { normalizeForComparison } from "../../utils/string.utils.ts";

export interface SavingsOpportunity {
    type: "provider" | "administrator";
    category: string;
    subcategory: string;
    currentProvider: string;
    currentAmount: number;
    marketAverage: number;
    potentialSavings: number;
    potentialSavingsPercent: number;
    alternatives: {
        name: string;
        averageAmount: number;
        count: number;
    }[];
}

export class SavingsService {
    private supabase: ReturnType<typeof createSupabaseClient>;

    constructor(authHeader?: string) {
        this.supabase = createSupabaseClient(authHeader);
    }

    async getOpportunities(analysisId: string): Promise<SavingsOpportunity[]> {
        const adminSupabase = createServiceClient();

        // 1. Check cache first
        try {
            const { data: cached } = await adminSupabase
                .from("savings_opportunities_cache")
                .select("opportunities, updated_at")
                .eq("analysis_id", analysisId)
                .maybeSingle();

            if (cached) {
                // Return cached data if exists (for expense analysis it rarely changes)
                return cached.opportunities as SavingsOpportunity[];
            }
        } catch (err) {
            console.error("Cache miss or error:", err);
        }

        // 2. Get analysis details and building profile
        const { data: analysis, error: analysisError } = await this.supabase
            .from("expense_analyses")
            .select("*, building_profiles(*)")
            .eq("id", analysisId)
            .single();

        if (analysisError || !analysis) {
            throw new Error("Analysis not found");
        }

        const buildingProfile = analysis.building_profiles;
        const zone = buildingProfile?.zone;
        const unitCount = buildingProfile?.unit_count_range;

        // 2. Get subcategories for this analysis
        const { data: subcategories, error: subError } = await this.supabase
            .from("expense_subcategories")
            .select(`
        *,
        expense_categories!inner(name, analysis_id)
      `)
            .eq("expense_categories.analysis_id", analysisId);

        if (subError || !subcategories) {
            return [];
        }

        const opportunities: SavingsOpportunity[] = [];

        if (subcategories.length === 0) {
            return opportunities;
        }

        // 3a. Obtener toda la data de mercado en una sola consulta (Solución al problema N+1)
        let marketQuery = adminSupabase
            .from("anonymized_provider_prices")
            .select("amount, provider_name, provider_cuit, neighborhood, subcategory_name")
            .eq("period", analysis.period); // Mismo periodo para comparación justa (anti-inflación)

        if (zone) {
            marketQuery = marketQuery.eq("building_zone", zone);
        }

        if (unitCount) {
            marketQuery = marketQuery.eq("building_unit_count", unitCount);
        }

        const { data: allMarketData, error: marketError } = await marketQuery;

        if (marketError || !allMarketData || allMarketData.length === 0) {
            return opportunities;
        }

        // Función auxiliar para calcular la mediana
        const calculateMedian = (values: number[]): number => {
            if (values.length === 0) return 0;
            const sorted = [...values].sort((a, b) => a - b);
            const half = Math.floor(sorted.length / 2);
            return sorted.length % 2 === 0
                ? (sorted[half - 1] + sorted[half]) / 2.0
                : sorted[half];
        };

        // 3b. Process each subcategory to find market benchmarks
        for (const sub of subcategories) {
            if (sub.amount <= 0) continue;

            const normalizedSubName = sub.name.trim().toLowerCase();

            // Filtrar en memoria los datos de mercado para esta subcategoría específica
            const marketData = allMarketData.filter((d: any) =>
                d.subcategory_name && d.subcategory_name.toLowerCase().includes(normalizedSubName)
            );

            if (marketData.length < 3) {
                // Need at least 3 data points for a meaningful comparison
                continue;
            }

            // Usar la mediana para evitar que valores atípicos (outliers) rompan el cálculo
            const amounts = marketData.map((d: any) => Number(d.amount));
            const medianAverage = calculateMedian(amounts);

            // If current price is significantly above median (> 15%)
            if (sub.amount > medianAverage * 1.15) {
                const currentProviderNameNorm = sub.provider_name ? normalizeForComparison(sub.provider_name) : "";
                const currentProviderCuit = sub.provider_cuit ? sub.provider_cuit.replace(/\D/g, "") : "";

                const providerStats = new Map<string, { name: string; total: number; count: number; inNeighborhood: boolean; cuit?: string }>();

                marketData.forEach((d: any) => {
                    const marketProviderNameNorm = d.provider_name ? normalizeForComparison(d.provider_name) : "";
                    const marketProviderCuit = d.provider_cuit ? d.provider_cuit.replace(/\D/g, "") : "";

                    const isSameByName = currentProviderNameNorm && marketProviderNameNorm === currentProviderNameNorm;
                    const isSameByCuit = currentProviderCuit && marketProviderCuit === currentProviderCuit;

                    if (isSameByName || isSameByCuit) {
                        return; // Skip current provider
                    }

                    // Agrupar idealmente por CUIT si está disponible, sino hacer fallback al nombre
                    const groupingKey = marketProviderCuit || marketProviderNameNorm || "Desconocido";
                    const displayProviderName = d.provider_name || "Proveedor sin nombre";

                    const stats = providerStats.get(groupingKey) || {
                        name: displayProviderName,
                        total: 0,
                        count: 0,
                        inNeighborhood: false,
                        cuit: marketProviderCuit || undefined
                    };

                    stats.total += Number(d.amount);
                    stats.count += 1;

                    if (buildingProfile?.neighborhood && d.neighborhood === buildingProfile.neighborhood) {
                        stats.inNeighborhood = true;
                    }

                    // Asegurarnos de mantener el nombre original si ya lo agrupamos por CUIT
                    if (!stats.name || stats.name === "Proveedor sin nombre") {
                        stats.name = displayProviderName;
                    }

                    providerStats.set(groupingKey, stats);
                });

                const alternatives = Array.from(providerStats.values())
                    .map((stats) => ({
                        name: stats.name,
                        averageAmount: stats.total / stats.count,
                        count: stats.count,
                        inNeighborhood: stats.inNeighborhood
                    }))
                    .filter(a => a.count >= 2) // <-- Restricción: al menos 2 reportes de usuarios distintos
                    .filter(a => a.averageAmount < sub.amount)
                    .sort((a, b) => {
                        // Priorizar coincidencias en el mismo barrio
                        if (a.inNeighborhood && !b.inNeighborhood) return -1;
                        if (!a.inNeighborhood && b.inNeighborhood) return 1;
                        return a.averageAmount - b.averageAmount;
                    })
                    .slice(0, 3); // Top 3 mejores

                opportunities.push({
                    type: "provider",
                    category: sub.expense_categories.name,
                    subcategory: sub.name,
                    currentProvider: sub.provider_name || "Proveedor actual",
                    currentAmount: sub.amount,
                    marketAverage: medianAverage,
                    potentialSavings: sub.amount - medianAverage,
                    potentialSavingsPercent: ((sub.amount - medianAverage) / sub.amount) * 100,
                    alternatives
                });
            }
        }

        // 4. Update cache and flag
        try {
            const hasOpportunities = opportunities.length > 0;

            // Update main table flag
            await adminSupabase
                .from("expense_analyses")
                .update({ has_savings_opportunities: hasOpportunities })
                .eq("id", analysisId);

            // Upsert into cache
            await adminSupabase
                .from("savings_opportunities_cache")
                .upsert({
                    analysis_id: analysisId,
                    opportunities: opportunities,
                    updated_at: new Date().toISOString()
                });
        } catch (err) {
            console.error("Error updating savings cache/flag:", err);
        }

        return opportunities;
    }
}
