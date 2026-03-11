import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import type { Analysis, Category, BuildingProfile } from "../types/analysis";

export interface UseAnalysisState {
  analyses: Analysis[];
  attentionAnalyses: Analysis[];
  totalCount: number;
  buildings: string[];
  categories: string[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  loading: boolean;
  error: string | null;
}

export interface UseAnalysisActions {
  fetchAnalyses: () => Promise<void>;
  fetchNextPage: () => void;
  fetchCategories: (analysisId: string) => Promise<void>;
  createAnalysis: (data: Partial<Analysis>) => Promise<Analysis | null>;
  updateAnalysis: (id: string, data: Partial<Analysis>) => Promise<void>;
  deleteAnalysis: (id: string) => Promise<void>;
  uploadFile: (file: File, analysisId: string) => Promise<string | null>;
  processExpense: (file: File, analysisId: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export interface UseAnalysisFilters {
  buildingName?: string;
  pageSize?: number;
}

export function useAnalysis(filters?: UseAnalysisFilters) {
  const queryClient = useQueryClient();

  // Queries
  const PAGE_SIZE = filters?.pageSize || 10;

  // Infinite Query for analyses
  const {
    data: infiniteAnalyses,
    isLoading: loadingAnalyses,
    error: errorAnalyses,
    refetch: fetchAnalyses,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["analyses", filters],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from("expense_analyses")
        .select("*, expense_categories(*)", { count: 'exact' })
        // Only completed analyses in the paginated list
        .eq("status", "completed")
        .order("period_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (filters?.buildingName && filters.buildingName !== "all") {
        query = query.eq("building_name", filters.buildingName);
      }

      const { data, error, count } = await query.range(pageParam, pageParam + PAGE_SIZE - 1);

      if (error) throw error;
      return {
        data: data as Analysis[],
        totalCount: count || 0
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.data.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined;
    },
    initialPageParam: 0,
  });

  // Separate query that ALWAYS fetches all attention-requiring analyses (no pagination)
  // This ensures they always appear at the top regardless of how many completed analyses exist
  const { data: attentionAnalysesData = [] } = useQuery({
    queryKey: ["analyses-attention"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_analyses")
        .select("*, expense_categories(*)")
        .in("status", ["processing", "paid", "failed", "pending"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Analysis[];
    },
    // Refresh every 15 seconds while any are in progress
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasActiveProcessing = data?.some(a => a.status === "processing" || a.status === "paid");
      return hasActiveProcessing ? 15000 : false;
    },
  });

  const attentionAnalyses = attentionAnalysesData;

  const analyses = infiniteAnalyses?.pages.map(p => p.data).flat() || [];
  const totalCount = infiniteAnalyses?.pages[0]?.totalCount || 0;

  // Query for unique buildings
  const { data: buildings = [] } = useQuery({
    queryKey: ["user-buildings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_analyses")
        .select("building_name")
        .not("building_name", "is", null);

      if (error) throw error;
      const unique = [...new Set(data.map(d => d.building_name))];
      return unique.sort() as string[];
    }
  });

  // Query for unique categories
  const { data: allCategories = [] } = useQuery({
    queryKey: ["user-categories", filters?.buildingName],
    queryFn: async () => {
      let query = supabase
        .from("expense_categories")
        .select("name");

      if (filters?.buildingName && filters.buildingName !== "all") {
        const { data: buildingAnalyses } = await supabase
          .from("expense_analyses")
          .select("id")
          .eq("building_name", filters.buildingName);

        if (buildingAnalyses && buildingAnalyses.length > 0) {
          query = query.in("analysis_id", buildingAnalyses.map(a => a.id));
        } else {
          return [];
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      const unique = [...new Set(data.map(d => d.name))];
      return unique.sort() as string[];
    }
  });

  // Categories query (needs a specific ID, so we might keep it dynamic or use a placeholder)
  const fetchCategoriesQuery = (analysisId: string) => useQuery({
    queryKey: ["categories", analysisId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .eq("analysis_id", analysisId)
        .order("current_amount", { ascending: false });

      if (error) throw error;
      return data as Category[];
    },
    enabled: !!analysisId,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: Partial<Analysis>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { data: result, error } = await supabase
        .from("expense_analyses")
        .insert({
          ...data,
          user_id: user.id,
          status: "pending",
          created_at: new Date().toISOString(),
        } as any)
        .select()
        .single();

      if (error) throw error;
      return result as Analysis;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Analysis> }) => {
      const { error } = await supabase
        .from("expense_analyses")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("expense_analyses")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
    },
  });

  // Helper actions
  const uploadFile = async (file: File, analysisId: string): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const filePath = `${user.id}/${analysisId}/${file.name}`;

      const { error } = await supabase.storage
        .from("expense-files")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: true
        });

      if (error) throw error;

      return filePath;
    } catch (error) {
      console.error("Error al subir archivo:", error);
      return null;
    }
  };

  const processExpense = async (file: File, analysisId: string) => {
    try {
      // Update status to processing
      await updateMutation.mutateAsync({ id: analysisId, data: { status: "processing" } });

      // Upload file
      const filePath = await uploadFile(file, analysisId);
      if (!filePath) throw new Error("Error al subir archivo");

      // Create form data for edge function
      const formData = new FormData();
      formData.append("file", file);
      formData.append("analysisId", analysisId);

      // Call edge function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sesión no encontrada");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-expense`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al procesar el archivo");
      }

      // Update status to completed
      await updateMutation.mutateAsync({ id: analysisId, data: { status: "completed" } });

      // Refresh analyses
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
    } catch (error) {
      console.error("Error al procesar archivo:", error);
      await updateMutation.mutateAsync({ id: analysisId, data: { status: "failed" } });
    }
  };

  return {
    analyses,
    attentionAnalyses,
    totalCount,
    buildings,
    categories: allCategories,
    hasNextPage,
    isFetchingNextPage,
    loading: loadingAnalyses || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    error: errorAnalyses ? (errorAnalyses as Error).message : null,
    fetchAnalyses: async () => { await fetchAnalyses(); },
    fetchNextPage: () => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); },
    createAnalysis: createMutation.mutateAsync,
    updateAnalysis: (id: string, data: Partial<Analysis>) => updateMutation.mutateAsync({ id, data }),
    deleteAnalysis: deleteMutation.mutateAsync,
    uploadFile,
    processExpense,
    clearError: () => { }, // Handled by React Query's error state
    reset: () => {
      queryClient.resetQueries({ queryKey: ["analyses"] });
    },
  };
}
