import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  History,
  FileText,
  LogOut,
  Plus,
  Filter,
  X,
  ArrowLeftRight,
  Trash2,
  LineChart,
  Search,
  User,
  Building,
  Users,
  Loader2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Ban
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAnalysis } from "@/hooks/useAnalysis";
import type { Analysis } from "@/types/analysis";

import { Logo } from "@/components/layout/ui/logo";

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container flex items-center justify-between h-20">
        <Link to="/" className="flex items-center gap-2 group">
          <Logo className="w-10 h-10 group-hover:rotate-12 transition-transform duration-500" />
          <span className="text-2xl font-bold tracking-tight bg-clip-text text-foreground">
            ExpensaCheck
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" className="hidden lg:flex rounded-full px-6 hover:bg-accent font-semibold" size="sm">
            <Link to="/preparar-reunion">
              <Users className="w-4 h-4 mr-2" />
              Reuniones
            </Link>
          </Button>
          <Button asChild variant="ghost" className="hidden sm:flex rounded-full px-6 hover:bg-accent font-semibold" size="sm">
            <Link to="/analizar">
              <Plus className="w-4 h-4 mr-2" />
              Nueva expensa
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" title="Mi Perfil" className="rounded-full hover:bg-accent">
              <Link to="/perfil">
                <User className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Cerrar sesión" className="rounded-full hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
};

const calculateChange = (current: number, previous: number | null) => {
  if (!previous || previous === 0) return null;
  return ((current - previous) / previous) * 100;
};

const Historial = () => {
  const navigate = useNavigate();

  // Selection states for comparison
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [analysisToDelete, setAnalysisToDelete] = useState<Analysis | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [buildingFilter, setBuildingFilter] = useState<string>("all");

  const {
    analyses,
    totalCount,
    buildings,
    loading,
    deleteAnalysis,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useAnalysis({ buildingName: buildingFilter });

  const handleDeleteClick = (analysis: Analysis, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAnalysisToDelete(analysis);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!analysisToDelete) return;

    setIsDeleting(true);

    try {
      // First delete the file from storage if it exists
      if (analysisToDelete.file_url) {
        let filePath = analysisToDelete.file_url;

        // If it's a full URL, extract the path after 'expense-files/'
        if (filePath.includes('/expense-files/')) {
          const urlParts = filePath.split('/expense-files/');
          if (urlParts.length > 1) {
            filePath = urlParts[1];
          }
        }

        if (filePath) {
          await supabase.storage
            .from('expense-files')
            .remove([filePath]);
        }
      }

      // Delete related categories
      await supabase
        .from("expense_categories")
        .delete()
        .eq("analysis_id", analysisToDelete.id);

      // Then delete the analysis using the hook
      await deleteAnalysis(analysisToDelete.id);

      toast.success("Análisis eliminado correctamente");
    } catch (error: any) {
      console.error("Error deleting analysis:", error);
      toast.error("Error al eliminar el análisis");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setAnalysisToDelete(null);
    }
  };

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else if (newSet.size < 2) {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleCompare = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 2) {
      navigate(`/comparar?left=${ids[0]}&right=${ids[1]}`);
    }
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };



  // Separate problematic analyses (failed OR stuck processing) from completed ones
  const attentionAnalyses = useMemo(() => {
    return analyses.filter(a => a.status === "failed" || a.status === "processing" || a.status === "paid");
  }, [analyses]);

  // Filter and sort successful/processing analyses
  const filteredCompletedAnalyses = useMemo(() => {
    const relevantAnalyses = analyses.filter(a =>
      a.status === "completed"
    );

    const filtered = relevantAnalyses.filter(analysis => {
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const buildingMatch = analysis.building_name?.toLowerCase().includes(query);
        const periodMatch = analysis.period.toLowerCase().includes(query);
        const unitMatch = analysis.unit?.toLowerCase().includes(query);
        if (!buildingMatch && !periodMatch && !unitMatch) {
          return false;
        }
      }

      // Building filter
      if (buildingFilter !== "all" && analysis.building_name !== buildingFilter) {
        return false;
      }

      return true;
    });

    // Sort by period_date or created_at (newest first)
    return filtered.sort((a, b) => {
      const dateA = a.period_date ? new Date(a.period_date).getTime() : new Date(a.created_at).getTime();
      const dateB = b.period_date ? new Date(b.period_date).getTime() : new Date(b.created_at).getTime();
      return dateB - dateA;
    });
  }, [analyses, searchQuery, buildingFilter]);

  const hasActiveFilters = searchQuery.trim() !== "" || buildingFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setBuildingFilter("all");
  };

  if (loading && analyses.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <Header />
        <main className="pt-24 pb-20">
          <div className="container max-w-4xl">
            <Skeleton className="h-10 w-64 mb-8" />
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 -z-10 bg-background">
        <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-primary/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-secondary/5 blur-[120px] rounded-full"></div>
      </div>

      <Header />
      <main className="pt-32 pb-32">
        <div className="container max-w-4xl relative z-10">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-[1.25rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                <History className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight">Mis Expensas</h1>
                <p className="text-muted-foreground font-medium mt-1">
                  {totalCount > 0
                    ? `Mostrando ${filteredCompletedAnalyses.length + attentionAnalyses.length} de ${totalCount} análisis`
                    : "0 análisis"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="ghost" asChild className="rounded-full px-6 hover:bg-accent font-semibold">
                <Link to="/evolucion">
                  <LineChart className="w-5 h-5 mr-2 text-primary" />
                  Evolución
                </Link>
              </Button>
              {filteredCompletedAnalyses.length >= 2 && (
                <>
                  {selectionMode ? (
                    <div className="flex items-center gap-2 bg-background/50 backdrop-blur-md p-1 rounded-full border border-primary/20 shadow-lg">
                      <Button variant="ghost" size="sm" onClick={cancelSelection} className="rounded-full px-4 h-9">
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleCompare}
                        disabled={selectedIds.size !== 2}
                        className="rounded-full px-6 h-9 bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20"
                      >
                        <ArrowLeftRight className="w-4 h-4 mr-2" />
                        Comparar ({selectedIds.size}/2)
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" className="rounded-full px-6 border-border/50 hover:bg-accent font-semibold" onClick={() => setSelectionMode(true)}>
                      <ArrowLeftRight className="w-4 h-4 mr-2 text-secondary" />
                      Comparar
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Search and Filters Section - Premium Design */}
          {analyses.some(a => a.status === "completed") && (
            <Card className="mb-10 bg-card/40 backdrop-blur-xl border-border/50 shadow-2xl rounded-[2rem] overflow-hidden animate-fade-in-up">
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-6">
                  <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      type="text"
                      placeholder="Buscar por edificio, período o unidad..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-12 bg-background/50 border-border/50 rounded-xl focus:ring-primary/20 text-base"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-muted"
                        onClick={() => setSearchQuery("")}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="w-full lg:w-[240px]">
                    <Select value={buildingFilter} onValueChange={setBuildingFilter}>
                      <SelectTrigger className="h-12 bg-background/50 border-border/50 rounded-xl focus:ring-primary/20">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          <SelectValue placeholder="Edificio" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/50">
                        <SelectItem value="all">Todos los edificios</SelectItem>
                        {buildings.map((building) => (
                          <SelectItem key={building} value={building as string}>
                            {building}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="flex items-center justify-between mt-4 px-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Resultados: <span className="text-foreground font-bold">{filteredCompletedAnalyses.length}</span>
                    </p>
                    <Button variant="link" onClick={clearFilters} className="h-auto p-0 text-xs font-bold uppercase tracking-widest text-primary hover:no-underline">
                      Limpiar Filtros
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Attention Section: failed + processing/stuck */}
          {attentionAnalyses.length > 0 && (
            <div className="mb-10 space-y-4">
              <div className="flex items-center gap-2 px-1 mb-4">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <h2 className="text-sm font-black uppercase tracking-widest text-amber-600">
                  Requieren atención ({attentionAnalyses.length})
                </h2>
              </div>
              <div className="grid gap-4">
                {attentionAnalyses.map((analysis) => {
                  const isFailed = analysis.status === "failed";
                  const isStuck = analysis.status === "processing" || analysis.status === "paid";

                  // Consider processing "stuck" if created more than 10 minutes ago
                  const createdAt = new Date(analysis.created_at).getTime();
                  const minutesElapsed = (Date.now() - createdAt) / 1000 / 60;
                  const isLikelyStuck = isStuck && minutesElapsed > 10;

                  return (
                    <Card
                      key={analysis.id}
                      className={`group transition-all duration-300 rounded-[1.5rem] shadow-md hover:shadow-xl ${isFailed
                          ? "bg-destructive/5 border-destructive/20 hover:border-destructive/40"
                          : isLikelyStuck
                            ? "bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50"
                            : "bg-primary/5 border-primary/20 hover:border-primary/40"
                        }`}
                    >
                      <CardContent className="p-6 md:p-8">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                          <div className="flex items-center gap-4">
                            {/* Status icon */}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isFailed
                                ? "bg-destructive/10 text-destructive"
                                : isLikelyStuck
                                  ? "bg-amber-500/10 text-amber-600"
                                  : "bg-primary/10 text-primary"
                              }`}>
                              {isFailed ? (
                                <X className="w-6 h-6" />
                              ) : isLikelyStuck ? (
                                <AlertTriangle className="w-6 h-6" />
                              ) : (
                                <Loader2 className="w-6 h-6 animate-spin" />
                              )}
                            </div>

                            <div>
                              <p className={`text-sm font-bold truncate mb-0.5 ${isFailed ? "text-destructive/80" : isLikelyStuck ? "text-amber-600" : "text-primary"
                                }`}>
                                {analysis.building_name || "Identificando edificio..."}
                              </p>
                              <h3 className="text-xl font-black text-foreground">{analysis.period}</h3>
                              <p className={`text-xs font-semibold mt-1 flex items-center gap-1.5 ${isFailed ? "text-destructive" : isLikelyStuck ? "text-amber-600" : "text-primary"
                                }`}>
                                {isFailed ? (
                                  <><AlertTriangle className="w-3 h-3" /> Error en el procesamiento</>
                                ) : isLikelyStuck ? (
                                  <><Clock className="w-3 h-3" /> Demorado — {Math.round(minutesElapsed)} min esperando</>
                                ) : (
                                  <><Loader2 className="w-3 h-3 animate-spin" /> Procesando con IA... {Math.round(minutesElapsed)} min</>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 sm:flex-shrink-0">
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className={`rounded-full px-5 font-bold gap-2 ${isFailed
                                  ? "border-destructive/40 text-destructive hover:bg-destructive/10"
                                  : isLikelyStuck
                                    ? "border-amber-500/40 text-amber-700 hover:bg-amber-500/10"
                                    : "border-primary/30 text-primary hover:bg-primary/10"
                                }`}
                            >
                              <Link to={`/analizar?payment=success&analysisId=${analysis.id}`}>
                                <RefreshCw className="w-3.5 h-3.5" />
                                {isFailed ? "Reintentar" : "Verificar estado"}
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full h-9 w-9 border border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-muted-foreground"
                              title="Cancelar y eliminar"
                              onClick={(e) => handleDeleteClick(analysis, e)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <div className="h-px bg-border/50 my-8" />
            </div>
          )}

          {analyses.filter(a => a.status === "completed").length === 0 ? (
            <Card variant="soft" className="animate-fade-in-up">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No tenés análisis todavía</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Subí tu primera liquidación de expensas y obtené un análisis detallado con comparaciones y alertas.
                </p>
                <Button asChild variant="hero" size="lg">
                  <Link to="/analizar">
                    <Plus className="w-4 h-4 mr-2" />
                    Analizar mi primera expensa
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : filteredCompletedAnalyses.length === 0 ? (
            <Card variant="soft" className="animate-fade-in-up">
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-6 h-6 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold mb-2">Sin resultados</h2>
                <p className="text-muted-foreground mb-4 text-sm">
                  No hay análisis que coincidan con los filtros seleccionados.
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredCompletedAnalyses.map((analysis, index) => {
                const change = calculateChange(analysis.total_amount, analysis.previous_total);
                const isSelected = selectedIds.has(analysis.id);
                const isCompleted = analysis.status === "completed";
                const isProcessing = analysis.status === "processing" || analysis.status === "paid";

                const cardContent = (
                  <Card
                    className={cn(
                      "group animate-fade-in-up transition-all duration-300 rounded-[1.5rem] overflow-hidden bg-card/40 backdrop-blur-xl border-border/50 hover:border-primary/50 shadow-lg hover:shadow-2xl hover:shadow-primary/5",
                      isSelected && "ring-2 ring-primary bg-primary/5 shadow-2xl shadow-primary/10",
                      isProcessing && "border-primary/30"
                    )}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row items-stretch">
                        <div className="flex-1 p-6 md:p-8">
                          <div className="flex items-start justify-between gap-6">
                            <div className="flex items-start gap-5">
                              {selectionMode && isCompleted && (
                                <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={isSelected}
                                    disabled={!isSelected && selectedIds.size >= 2}
                                    onCheckedChange={() => toggleSelection(analysis.id, { preventDefault: () => { }, stopPropagation: () => { } } as any)}
                                    className="w-6 h-6 rounded-lg border-2"
                                  />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <p className="text-base font-bold text-foreground truncate">
                                    {analysis.building_name || (isProcessing ? "Edificio (identificando...)" : "Edificio desconocido")}
                                    {analysis.unit && (
                                      <span className="ml-2 px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-black uppercase">
                                        UF {analysis.unit}
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <h3 className="text-2xl font-black tracking-tight text-foreground line-height-none">{analysis.period}</h3>
                                <div className="flex items-center gap-2 mt-3 text-sm font-medium">
                                  {isCompleted ? (
                                    <>
                                      <CheckCircle2 className="w-4 h-4 text-primary" />
                                      <span className="text-muted-foreground">Analizado el {formatDate(analysis.created_at)}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                      <span className="text-primary font-bold">Procesando con IA...</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            {!selectionMode && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 shrink-0 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                                onClick={(e) => handleDeleteClick(analysis, e)}
                              >
                                <Trash2 className="w-5 h-5" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-center gap-8 p-6 md:p-8 bg-muted/20 sm:w-60 border-t sm:border-t-0 sm:border-l border-border/50 group-hover:bg-primary/5 transition-colors">
                          <div className="text-left sm:text-right">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Total abonado</p>
                            <p className="text-2xl font-black text-foreground tabular-nums">
                              {analysis.total_amount > 0 ? formatCurrency(analysis.total_amount) : "(pendiente)"}
                            </p>
                            {isCompleted && change !== null && (
                              <div className={`flex items-center sm:justify-end gap-1.5 text-sm font-extrabold mt-1.5 ${change > 10 ? "text-secondary" : change > 0 ? "text-muted-foreground" : "text-primary"
                                }`}>
                                {change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                {change > 0 ? "+" : ""}{change.toFixed(1)}%
                              </div>
                            )}
                          </div>
                          <ArrowRight className="w-6 h-6 text-primary sm:hidden group-hover:translate-x-1 transition-transform" />
                          <div className="hidden sm:block">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                              <ArrowRight className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );

                if (selectionMode && isCompleted) {
                  return (
                    <div
                      key={analysis.id}
                      className="cursor-pointer"
                      onClick={(e) => toggleSelection(analysis.id, e)}
                    >
                      {cardContent}
                    </div>
                  );
                }

                return (
                  <Link
                    key={analysis.id}
                    to={isCompleted ? `/analisis/${analysis.id}` : `/analizar?payment=success&analysisId=${analysis.id}`}
                    className="block"
                  >
                    {cardContent}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Load More Button */}
          {hasNextPage && (
            <div className="mt-12 text-center animate-fade-in">
              <Button
                variant="outline"
                size="lg"
                onClick={fetchNextPage}
                disabled={isFetchingNextPage}
                className="rounded-full px-12 border-primary/20 hover:bg-primary/5 font-bold h-14 min-w-[200px]"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    Ver más análisis
                    <Plus className="w-5 h-5 ml-3" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Comparison hint */}
          {filteredCompletedAnalyses.length >= 2 && (
            <Card variant="soft" className="mt-8 animate-fade-in-up">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary-soft flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Comparación automática</h3>
                    <p className="text-sm text-muted-foreground">
                      Cada análisis compara automáticamente con el mes anterior.
                      Podés ver la evolución de tus gastos haciendo clic en cada período.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este análisis?</AlertDialogTitle>
            <AlertDialogDescription>
              {analysisToDelete && (
                <>
                  Vas a eliminar el análisis de <strong>{analysisToDelete.building_name || "Edificio"}</strong> del período <strong>{analysisToDelete.period}</strong>.
                  <br /><br />
                  Esta acción no se puede deshacer. Se eliminarán todos los datos y categorías asociadas.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Sí, eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Historial;
