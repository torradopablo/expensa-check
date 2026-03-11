import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/config/cors.ts";
import { createSupabaseClient, createServiceClient } from "../_shared/config/supabase.ts";
import { AnalysisRepository } from "../_shared/services/database/AnalysisRepository.ts";
import { MeetingPrepService } from "../_shared/services/analysis/MeetingPrepService.ts";
import { AuthenticationError, ValidationError, AppError } from "../_shared/utils/error.utils.ts";
import { encodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";

// Version: 1.0.3
serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {

        console.log(`[prepare-meeting] Request received. Method: ${req.method}`);
        const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");

        if (!authHeader) {
            console.error("[prepare-meeting] CRITICAL: Missing Authorization header");
            throw new AuthenticationError("No se proporcionó token de sesión (Header missing)");
        }

        const body = await req.json().catch((e: Error) => {
            console.error("[prepare-meeting] Error parsing body:", e);
            return {};
        });
        const { analysis_ids, building_name } = body;

        if (!analysis_ids || !Array.isArray(analysis_ids) || analysis_ids.length === 0) {
            throw new ValidationError("Se requiere una lista de IDs de análisis");
        }

        console.log(`[prepare-meeting] Verifying token for ${analysis_ids.length} analyses...`);

        // Use SERVICE ROLE for verification (more reliable in Edge Functions)
        const supabaseService = createServiceClient();
        const token = authHeader.replace(/^[Bb]earer\s+/i, "");

        const { data: { user }, error: userError } = await supabaseService.auth.getUser(token);

        if (userError) {
            console.error("[prepare-meeting] Auth verification failed:", userError.message);
            throw new AuthenticationError(`Token inválido o expirado: ${userError.message}`);
        }
        if (!user) {
            console.error("[prepare-meeting] No user found for this token");
            throw new AuthenticationError("Usuario no encontrado");
        }

        console.log(`[prepare-meeting] User authenticated: ${user.id}. Checking daily limit...`);

        // Use the USER's own token for database operations to respect RLS
        const analysisRepo = new AnalysisRepository(authHeader);
        const supabase = createSupabaseClient(authHeader);
        const meetingService = new MeetingPrepService();

        // 0. Check Daily Limit (3 per day, unless free_analysis is true)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Fetch user profile to check for free_analysis flag
        const { data: profile } = await supabaseService
            .from("profiles")
            .select("free_analysis")
            .eq("user_id", user.id)
            .maybeSingle();

        const isFreeUser = profile?.free_analysis === true;

        const { count, error: countError } = await supabase
            .from("meeting_preparation_logs")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .gte("created_at", today.toISOString());

        if (countError) {
            console.error("[prepare-meeting] Error checking daily limit:", countError);
        } else if (!isFreeUser && count !== null && count >= 3) {
            return new Response(
                JSON.stringify({
                    error: "Límite diario alcanzado",
                    code: "RATE_LIMIT_EXCEEDED",
                    details: "Has alcanzado el límite de 3 temarios generados por día. Por favor, intentá mañana."
                }),
                { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 1. Fetch Analyses and Categories
        console.log(`[prepare-meeting] Fetching data for ${analysis_ids.length} analyses...`);
        const analysesData = await Promise.all(
            analysis_ids.map(async (id) => {
                const [analysisRes, categoriesRes] = await Promise.all([
                    analysisRepo.getAnalysis(id),
                    analysisRepo.getCategories(id)
                ]);

                if (analysisRes.error || !analysisRes.data) {
                    console.error(`Error fetching analysis ${id}:`, analysisRes.error || 'No data found (RLS?)');
                    return null;
                }

                return {
                    ...analysisRes.data,
                    categories: categoriesRes.data || [],
                    owner_notes: analysisRes.data.owner_notes || ""
                };
            })
        );

        const validAnalyses = analysesData.filter(Boolean);
        if (validAnalyses.length === 0) {
            throw new ValidationError("No se encontraron análisis válidos en la base de datos");
        }

        // 2. Fetch Comments for these analyses
        const { data: allComments, error: commentsError } = await supabase
            .from("analysis_comments")
            .select("*")
            .in("analysis_id", analysis_ids)
            .order("created_at", { ascending: false });

        if (commentsError) {
            console.error("[prepare-meeting] Error fetching comments:", commentsError);
        }

        const commentsByType = {
            owner: (allComments || []).filter((c: any) => c.is_owner_comment),
            shared: (allComments || []).filter((c: any) => !c.is_owner_comment)
        };

        // 3. Map periods to shared comments for context
        const analysisMap = new Map(validAnalyses.map(a => [a.id, a.period]));
        commentsByType.shared = commentsByType.shared.map((c: any) => ({
            ...c,
            period: analysisMap.get(c.analysis_id) || "General"
        }));

        // 4. Generate Cache Key
        // Incorporate analysis_ids, owner notes, and all comments into the hash.
        // This guarantees that if the user adds/edits a comment or note, the cache key changes 
        // and a fresh AI generation occurs automatically.
        const sortedIds = [...analysis_ids].sort().join(",");

        // Extract all text that could affect the AI's output
        const ownerNotesText = validAnalyses.map(a => a.owner_notes || "").join("|");
        const commentsText = (allComments || []).map((c: any) => `${c.id}:${c.content}`).join("|");

        const rawContentToHash = `${sortedIds}@@${ownerNotesText}@@${commentsText}`;

        // Use a simple hash for the cache key
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(rawContentToHash);
        const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
        const cacheKey = encodeHex(hashBuffer);

        console.log(`[prepare-meeting] Cache key generated: ${cacheKey}`);

        // Set a Cache TTL of 30 days (30 * 24 * 60 * 60 * 1000 ms)
        // If it's older than 30 days, we let the AI generate a fresh checklist.
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        // Check if we have a valid (not expired) cached summary for this exact combination
        const { data: cachedPrep, error: cacheError } = await supabaseService
            .from("meeting_prep_cache")
            .select("data, created_at")
            .eq("cache_key", cacheKey)
            .gte("created_at", thirtyDaysAgo)
            .maybeSingle();

        if (!cacheError && cachedPrep) {
            console.log(`[prepare-meeting] Cache hit! Returning cached summary for key ${cacheKey}`);

            // Log the usage even for cached results to respect rate limits
            try {
                await supabase
                    .from("meeting_preparation_logs")
                    .insert({
                        user_id: user.id,
                        building_name: building_name || (validAnalyses[0] && validAnalyses[0].building_name) || "Consorcio"
                    });
            } catch (logError) {
                console.error("[prepare-meeting] Failed to log usage:", logError);
            }

            return new Response(
                JSON.stringify(cachedPrep.data),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`[prepare-meeting] Cache miss. Generating new summary.`);

        // 5. Generate Summary using AI
        const finalBuildingName = building_name || (validAnalyses[0] && validAnalyses[0].building_name) || "Consorcio";

        console.log(`[prepare-meeting] Requesting AI summary for ${finalBuildingName} using OpenAI`);

        const summary = await meetingService.generateMeetingChecklist({
            buildingName: finalBuildingName,
            analyses: validAnalyses,
            commentsByType
        });

        // 6. Save back to cache
        try {
            await supabaseService
                .from("meeting_prep_cache")
                .upsert({
                    cache_key: cacheKey,
                    data: summary
                }, { onConflict: "cache_key" });
            console.log(`[prepare-meeting] Saved new summary to cache with key ${cacheKey}`);
        } catch (saveCacheError) {
            console.error("[prepare-meeting] Failed to save to cache (non-blocking):", saveCacheError);
        }

        // 7. Log the usage
        try {
            await supabase
                .from("meeting_preparation_logs")
                .insert({
                    user_id: user.id,
                    building_name: finalBuildingName
                });
        } catch (logError) {
            console.error("[prepare-meeting] Failed to log usage:", logError);
        }

        return new Response(
            JSON.stringify(summary),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error: any) {
        console.error("Prepare meeting error:", error);

        let status = 500;
        let message = "Error interno del servidor";
        let code = "SERVER_ERROR";

        if (error instanceof AppError) {
            status = error.statusCode;
            message = error.message;
            code = error instanceof AuthenticationError ? "UNAUTHORIZED" : "BAD_REQUEST";
        } else if (error.message?.includes("token") || error.message?.includes("session") || error.message?.includes("unauthorized")) {
            status = 401;
            message = error.message;
            code = "UNAUTHORIZED";
        }

        return new Response(
            JSON.stringify({
                error: message,
                code: code,
                details: error instanceof Error ? error.message : String(error)
            }),
            { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
