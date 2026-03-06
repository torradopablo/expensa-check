import { createSupabaseClient, createServiceClient } from "../../config/supabase.ts";

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

        // 3. Process each subcategory to find market benchmarks
        for (const sub of subcategories) {
            if (sub.amount <= 0) continue;

            // Query market data for this subcategory
            // We normalize names slightly (trim, lowercase)
            const normalizedSubName = sub.name.trim().toLowerCase();

            let marketQuery = adminSupabase
                .from("anonymized_provider_prices")
                .select("amount, provider_name, neighborhood")
                .ilike("subcategory_name", `%${normalizedSubName}%`)
                .eq("period", analysis.period); // Mismo periodo para comparación justa (anti-inflación)

            if (zone) {
                marketQuery = marketQuery.eq("building_zone", zone);
            }

            if (unitCount) {
                marketQuery = marketQuery.eq("building_unit_count", unitCount);
            }

            const { data: marketData, error: marketError } = await marketQuery;

            if (marketError || !marketData || marketData.length < 3) {
                // Need at least 3 data points for a meaningful comparison
                continue;
            }

            // Use median if possible for market average? No, mean is fine for a quick benchmark
            const amounts = marketData.map((d: any) => Number(d.amount));
            const average = amounts.reduce((a: number, b: number) => a + b, 0) / amounts.length;

            // If current price is significantly above average (> 15%)
            if (sub.amount > average * 1.15) {
                // Group by provider to find alternatives
                const providerStats = new Map<string, { total: number; count: number; inNeighborhood: boolean }>();
                marketData.forEach((d: any) => {
                    const stats = providerStats.get(d.provider_name) || { total: 0, count: 0, inNeighborhood: false };
                    stats.total += Number(d.amount);
                    stats.count += 1;
                    if (buildingProfile?.neighborhood && d.neighborhood === buildingProfile.neighborhood) {
                        stats.inNeighborhood = true;
                    }
                    providerStats.set(d.provider_name, stats);
                });

                const alternatives = Array.from(providerStats.entries())
                    .map(([name, stats]) => ({
                        name,
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
                    marketAverage: average,
                    potentialSavings: sub.amount - average,
                    potentialSavingsPercent: ((sub.amount - average) / sub.amount) * 100,
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
