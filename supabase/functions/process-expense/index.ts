import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { corsHeaders } from "../_shared/config/cors.ts";
import { validateUUID, validateFileUpload } from "../_shared/validators/common.validator.ts";
import { validateAIResponse } from "../_shared/validators/analysis.validator.ts";
import { createSupabaseClient } from "../_shared/config/supabase.ts";
import { ExpenseAnalysisService } from "../_shared/services/analysis/ExpenseAnalysisService.ts";
import { AnalysisRepository } from "../_shared/services/database/AnalysisRepository.ts";
import { BuildingRepository } from "../_shared/services/database/BuildingRepository.ts";
import { StorageService } from "../_shared/services/storage/StorageService.ts";
import { PDFService } from "../_shared/services/pdf/PDFService.ts";
import { ComparisonService } from "../_shared/services/analysis/ComparisonService.ts";
import { EvolutionInsightService } from "../_shared/services/analysis/EvolutionInsightService.ts";
import { buildPeriodDate } from "../_shared/utils/date.utils.ts";
import { ValidationError, AuthenticationError, isRateLimitError } from "../_shared/utils/error.utils.ts";
import type { ValidatedAIResponse } from "../_shared/types/analysis.types.ts";


serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  let analysisId = "";

  try {
    const formData = await req.formData();
    let file = formData.get("file") as File | null;
    analysisId = formData.get("analysisId") as string;

    validateUUID(analysisId);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthenticationError("No autorizado");
    }

    // Initialize services
    const supabase = createSupabaseClient(authHeader);
    const analysisRepository = new AnalysisRepository(authHeader);
    const buildingRepository = new BuildingRepository(authHeader);
    const storageService = new StorageService(authHeader);
    const expenseAnalysisService = new ExpenseAnalysisService();
    const pdfService = new PDFService();

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new AuthenticationError("Token inválido");
    }

    const userId = user.id;

    // Fetch existing analysis to check status and file_url
    const { data: currentAnalysis, error: fetchError } = await analysisRepository.getAnalysis(analysisId);

    if (fetchError || !currentAnalysis) {
      throw new ValidationError("Análisis no encontrado");
    }

    if (currentAnalysis.status === "completed") {
      return new Response(
        JSON.stringify({ success: true, message: "Análisis ya completado previamente" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If file is missing, try to recover from storage
    if (!file) {
      console.log("File missing in request, attempting to recover from storage...");
      if (!currentAnalysis.file_url) {
        throw new ValidationError("No se proporcionó ningún archivo y no se encontró uno previo en el historial");
      }

      const { data: fileBlob, error: downloadError } = await supabase.storage
        .from("expense-files")
        .download(currentAnalysis.file_url);

      if (downloadError || !fileBlob) {
        console.error("Storage download error:", downloadError);
        throw new ValidationError("No se pudo recuperar el archivo del almacenamiento para reintentar");
      }

      // Convert blob to File
      const fileName = currentAnalysis.file_url.split('/').pop() || "expensa.pdf";
      file = new File([fileBlob], fileName, { type: "application/pdf" });
      console.log(`Recovered file "${fileName}" from storage`);
    }

    // Clean up any existing categories if this is a retry
    await supabase
      .from("expense_categories")
      .delete()
      .eq("analysis_id", analysisId);

    // Convert file to base64 for AI processing (safe for large files)
    const arrayBuffer = await file.arrayBuffer();
    const base64 = encode(new Uint8Array(arrayBuffer));
    const mimeType = file.type;
    const isPDF = mimeType === "application/pdf";

    // For PDFs, we use OCR to extract text first, saving on AI image processing costs
    let pdfText = "";
    if (isPDF) {
      console.log("Extracting text from PDF using PDFService...");
      pdfText = await pdfService.extractText(arrayBuffer);
      console.log(`Extracted ${pdfText.length} characters from PDF`);
    }

    // Upload file to storage (ensure it exists and update if necessary)
    const filePath = storageService.createFilePath(userId, analysisId, file.name);
    const { error: uploadError } = await storageService.uploadFile(
      "expense-files",
      filePath,
      file,
      { contentType: mimeType }
    );

    if (uploadError) {
      console.warn("File storage sync warning (continuing processing):", uploadError);
    }

    // Update analysis with the latest file_url and status processing
    await analysisRepository.updateAnalysis(analysisId, {
      file_url: filePath,
      status: "processing"
    });

    // Fetch existing building names for the user to help with matching
    const { data: existingAnalyses } = await analysisRepository.getBuildingNames(userId, analysisId);
    const existingBuildingNames = existingAnalyses
      ? [...new Set((existingAnalyses as { building_name: string }[]).map(a => a.building_name).filter(Boolean))]
      : [];

    // Try a quick match in the text to identify the building and fetch its standard categories
    let matchedBuildingName = "";
    if (pdfText) {
      for (const name of existingBuildingNames) {
        if (pdfText.toLowerCase().includes(name.toLowerCase())) {
          matchedBuildingName = name;
          break;
        }
      }
    }

    let previousCategories: string[] = [];
    if (matchedBuildingName) {
      console.log(`Matched existing building "${matchedBuildingName}" from text. Fetching previous categories...`);
      previousCategories = await analysisRepository.getLatestBuildingCategories(userId, matchedBuildingName);
    } else {
      // Fallback: get all unique categories of the user to guide the AI
      console.log("No specific building matched. Fetching user-wide common categories...");
      previousCategories = await analysisRepository.getUserCategories(userId);
    }

    // Limit categories to 50 most relevant to avoid too large prompt
    previousCategories = previousCategories.slice(0, 50);

    // Analyze expense file using AI service
    let extractedData: ValidatedAIResponse;
    try {
      if (isPDF && pdfText) {
        const aiResponse = await expenseAnalysisService.analyzeExpenseText(pdfText, previousCategories, existingBuildingNames);
        extractedData = validateAIResponse(aiResponse);
      } else {
        const aiResponse = await expenseAnalysisService.analyzeExpenseFile(
          base64,
          mimeType,
          isPDF,
          previousCategories,
          existingBuildingNames
        );
        extractedData = validateAIResponse(aiResponse);
      }
    } catch (aiError) {
      if (isRateLimitError(aiError)) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido. Por favor, intentá de nuevo en unos minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (aiError instanceof Error && aiError.message.includes("429")) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Por favor, agregá créditos a tu cuenta." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`Error al procesar el documento: ${aiError instanceof Error ? aiError.message : "Error desconocido"}`);
    }

    // Build period_date from extracted month/year
    const periodDate = buildPeriodDate(extractedData.period_year, extractedData.period_month);

    // Normalize building name using ComparisonService
    let normalizedBuildingName = extractedData.building_name;

    if (normalizedBuildingName) {
      const { data: existingAnalyses } = await analysisRepository.getBuildingNames(userId, analysisId);

      if (existingAnalyses && existingAnalyses.length > 0) {
        const existingBuildingNames = [...new Set(
          (existingAnalyses as { building_name?: string }[])
            .map((a) => a.building_name)
            .filter((name): name is string => name !== null && name !== undefined)
        )];

        const matchingBuilding = ComparisonService.findMatchingBuilding(
          normalizedBuildingName,
          existingBuildingNames
        );

        if (matchingBuilding) {
          normalizedBuildingName = matchingBuilding;
        }
      }
    }

    // Update or create building profile using repository
    let buildingProfileId: string | undefined;
    if (normalizedBuildingName) {
      try {
        const { data: profile } = await buildingRepository.mergeBuildingProfile(
          userId,
          normalizedBuildingName,
          extractedData.building_profile || {}
        );
        if (profile) {
          buildingProfileId = (profile as any).id;
          console.log(`Linked analysis to building profile: ${buildingProfileId}`);
        }
      } catch (error) {
        console.error("Building profile error:", error);
      }
    }

    // Update analysis record with extracted data using repository
    const { error: updateError } = await analysisRepository.updateAnalysis(analysisId, {
      building_name: normalizedBuildingName,
      period: extractedData.period,
      period_date: periodDate || undefined,
      unit: extractedData.unit || undefined,
      total_amount: extractedData.total_amount,
      file_url: filePath,
      status: "completed",
      scanned_at: new Date().toISOString(),
      building_profile_id: buildingProfileId,
      administrator_name: extractedData.administrator_name || undefined,
      administrator_cuit: extractedData.administrator_cuit || undefined,
    });

    if (updateError) {
      console.error("Analysis update error:", updateError);
      throw new Error(`No se pudo actualizar el estado del análisis: ${updateError.message}`);
    }

    // Insert categories and subcategories using repository
    if (extractedData.categories && extractedData.categories.length > 0) {
      const categoriesToInsert = extractedData.categories.map((cat) => ({
        analysis_id: analysisId,
        name: cat.name,
        icon: cat.icon || null,
        current_amount: cat.current_amount,
        previous_amount: cat.previous_amount || null,
        status: cat.status || "ok",
        explanation: cat.explanation || null,
      }));

      const { data: createdCategories, error: catError } = await analysisRepository.createCategories(categoriesToInsert);

      if (catError) {
        console.error("Categories creation error:", catError);
      } else if (createdCategories && createdCategories.length > 0) {
        // Map subcategories back to their parent category IDs
        const subcategoriesToInsert: any[] = [];

        extractedData.categories.forEach((extractedCat) => {
          if (extractedCat.subcategories && extractedCat.subcategories.length > 0) {
            // Find the ID of the created category
            const matchingCreatedCat = (createdCategories as any[]).find(
              c => c.name === extractedCat.name && c.current_amount === extractedCat.current_amount
            );

            if (matchingCreatedCat) {
              extractedCat.subcategories.forEach((sub) => {
                subcategoriesToInsert.push({
                  category_id: matchingCreatedCat.id,
                  name: sub.name,
                  amount: sub.amount,
                  percentage: sub.percentage || null,
                  expense_type: sub.expense_type || "ordinaria",
                  provider_name: sub.provider_name || null,
                  provider_cuit: sub.provider_cuit || null,
                });
              });
            }
          }
        });

        if (subcategoriesToInsert.length > 0) {
          const { error: subError } = await analysisRepository.createSubcategories(subcategoriesToInsert);
          if (subError) {
            console.error("Subcategories creation error:", subError);
          } else {
            console.log(`Successfully persisted ${subcategoriesToInsert.length} subcategories`);

            // Save ALL subcategory data anonymously for the Savings Engine / crowdsourcing
            // Even subcategories without an explicit provider are valuable for price benchmarking
            const anonymizedPrices = subcategoriesToInsert.map(s => {
              let categoryName = "Desconocida";
              if (createdCategories) {
                const cat = (createdCategories as any[]).find(c => c.id === s.category_id);
                if (cat) categoryName = cat.name;
              }

              return {
                provider_name: s.provider_name || s.name, // Subcategory name as fallback identifier
                provider_cuit: s.provider_cuit || null,
                provider_type: (s as any).provider_type || null,
                cuit_confirmed: (s as any).cuit_confirmed === true,
                category_name: categoryName,
                subcategory_name: s.name,
                amount: s.amount,
                expense_type: s.expense_type,
                period: extractedData.period,
                period_month: extractedData.period_month || null,
                period_year: extractedData.period_year || null,
                building_zone: extractedData.building_profile?.zone || null,
                building_unit_count: extractedData.building_profile?.unit_count_range || null,
                city: extractedData.building_profile?.city || null,
                neighborhood: extractedData.building_profile?.neighborhood || null,
                province: extractedData.building_profile?.province || null,
                raw_building_address: (extractedData as any).building_address || null,
              };
            });

            if (anonymizedPrices.length > 0) {
              await analysisRepository.createAnonymizedProviderPrices(anonymizedPrices).catch(e => {
                console.error("Failed to insert anonymized provider prices (non-blocking):", e);
              });
              console.log(`Saved ${anonymizedPrices.length} anonymized price records for Savings Engine.`);
            }
          }
        }
      }
    }

    // Save anonymized administrator data for crowdsourcing / Savings Engine
    if (extractedData.administrator_name && extractedData.administrator_name.trim() !== '') {
      await analysisRepository.createAnonymizedAdministratorData({
        administrator_name: extractedData.administrator_name,
        administrator_cuit: extractedData.administrator_cuit || null,
        cuit_confirmed: extractedData.administrator_cuit_confirmed === true,
        contact_phone: extractedData.administrator_contact_phone || null,
        contact_email: extractedData.administrator_contact_email || null,
        contact_address: extractedData.administrator_contact_address || null,
        period: extractedData.period,
        period_month: extractedData.period_month || null,
        period_year: extractedData.period_year || null,
        building_zone: extractedData.building_profile?.zone || null,
        building_unit_count: extractedData.building_profile?.unit_count_range || null,
        city: extractedData.building_profile?.city || null,
        neighborhood: extractedData.building_profile?.neighborhood || null,
        province: extractedData.building_profile?.province || null,
        raw_building_address: (extractedData as any).building_address || null,
      }).catch(e => {
        console.error("Failed to insert anonymized administrator data (non-blocking):", e);
      });
    }

    // Generate automated evolution analysis (async, but we wait for it to ensure it persists)
    if (normalizedBuildingName) {
      try {
        const evolutionInsightService = new EvolutionInsightService(authHeader);
        await evolutionInsightService.generateAndSaveAnalysis(userId, normalizedBuildingName, analysisId);
      } catch (error) {
        console.error("Error generating evolution highlights:", error);
      }
    }

    // CRITICAL: We only delete the file from storage if the processing was 100% successful.
    // If we reached this point, the analysis is 'completed' and categories are saved.
    // This allows the user to retry (re-procesar) if anything failed before this.
    if (filePath) {
      console.log("Success! Cleaning up storage...");
      // Use service role to ensure deletion permissions regardless of user RLS
      const systemStorageService = new StorageService();
      const { error: deleteFileError } = await systemStorageService.deleteFile("expense-files", filePath);

      if (deleteFileError) {
        console.error("File deletion error (non-critical):", deleteFileError);
      } else {
        // Update the analysis to clear the file_url since the file no longer exists
        await analysisRepository.updateAnalysis(analysisId, { file_url: "" });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: extractedData,
        analysisId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Process expense error:", error);

    // Update status to failed in DB if we have an analysisId
    try {
      const authHeader = req.headers.get("Authorization");
      if (authHeader && analysisId) {
        const repo = new AnalysisRepository(authHeader);
        await repo.updateAnalysis(analysisId, { status: "failed" });
      }
    } catch (dbError) {
      console.error("Failed to update status to failed:", dbError);
    }

    if (error instanceof ValidationError || error instanceof AuthenticationError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: error.statusCode, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});