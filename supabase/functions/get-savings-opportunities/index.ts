import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/config/cors.ts";
import { createSupabaseClient } from "../_shared/config/supabase.ts";
import { SavingsService } from "../_shared/services/analysis/SavingsService.ts";
import { validateUUID } from "../_shared/validators/common.validator.ts";

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { status: 200, headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const { analysisId } = body;
        console.log(`get-savings-opportunities hit for analysisId: ${analysisId}`);
        console.log(`Headers: ${JSON.stringify(Object.fromEntries(req.headers.entries()))}`);

        if (!analysisId) {
            throw new Error("analysisId is required");
        }

        validateUUID(analysisId);

        const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");

        if (!authHeader) {
            console.warn("Auth header missing, falling back to service role (caution)");
        }

        const savingsService = new SavingsService(authHeader || undefined);
        const opportunities = await savingsService.getOpportunities(analysisId);

        console.log(`Found ${opportunities.length} opportunities for analysis ${analysisId}`);

        return new Response(
            JSON.stringify({
                success: true,
                data: opportunities,
            }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (error: any) {
        console.error("Error in get-savings-opportunities:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
