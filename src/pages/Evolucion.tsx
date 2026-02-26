import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  periodToYearMonth
} from "@/services/formatters/date";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  LogOut,
  LineChart,
  Building,
  RefreshCw,
  Sparkles,
  ArrowLeft,
  User,
  Download
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { EvolutionComparisonChart } from "@/components/EvolutionComparisonChart";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useEvolution } from "@/hooks/useEvolution";
import type { EvolutionData } from "@/types/analysis";

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
          <Button asChild variant="ghost" className="hidden md:flex rounded-full px-6 hover:bg-accent font-semibold" size="sm">
            <Link to="/historial">Ver historial</Link>
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

const Evolucion = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isExporting, setIsExporting] = useState(false);

  const [selectedBuilding, setSelectedBuilding] = useState<string>(
    searchParams.get("edificio") || "all"
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get("categoria") || "all"
  );
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [deviation, setDeviation] = useState<any | null>(null);

  const { analyses, buildings: hookBuildings, categories: hookCategories, loading: loadingAnalyses, error: errorAnalyses } = useAnalysis({
    buildingName: selectedBuilding !== "all" ? selectedBuilding : undefined,
    pageSize: 50 // Fetch more history for charts
  });

  const {
    inflationData,
    buildingsTrend,
    buildingsTrendStats,
    loading: loadingEvolution,
    error: errorEvolution,
    calculateEvolution,
    calculateDeviation
  } = useEvolution(selectedCategory, selectedBuilding);

  useEffect(() => {
    if (errorEvolution) {
      toast.error(`Error al cargar datos de evolución: ${errorEvolution}`);
    }
    if (errorAnalyses) {
      toast.error(`Error al cargar análisis: ${errorAnalyses}`);
    }
  }, [errorEvolution, errorAnalyses]);

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById("evolucion-report-content");
      if (!element) return;

      const filtersCard = document.getElementById("filters-card");
      const pdfFilterSummary = document.getElementById("pdf-filter-summary");
      const pdfHeader = document.getElementById("pdf-header");

      // 1. Prepare View for Capture
      if (filtersCard) filtersCard.style.display = "none";
      if (pdfFilterSummary) pdfFilterSummary.style.display = "block";
      if (pdfHeader) pdfHeader.style.display = "flex";

      // 2. Set fixed width and high contrast class for consistency
      const originalWidth = element.style.width;
      const originalPadding = element.style.padding;

      element.classList.add("pdf-export-container");
      element.style.width = "1100px";
      element.style.padding = "40px";

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 1200
      });

      // 3. Restore View
      element.classList.remove("pdf-export-container");
      element.style.width = originalWidth;
      element.style.padding = originalPadding;

      if (filtersCard) filtersCard.style.display = "";
      if (pdfFilterSummary) pdfFilterSummary.style.display = "none";
      if (pdfHeader) pdfHeader.style.display = "none";

      // 4. Generate PDF
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 10;
      const footerHeight = 15; // Space reserved for footer

      const printWidth = pdfWidth - (margin * 2);

      const imgHeight = (canvas.height * printWidth) / canvas.width;
      let heightLeft = imgHeight;
      let printedHeight = 0;
      let pageNumber = 1;

      // Helper to draw footer
      const drawFooter = (pageNo: number) => {
        const footerY = pdfHeight - 10;
        pdf.setDrawColor(220, 220, 220);
        pdf.line(margin, footerY - 5, pdfWidth - margin, footerY - 5);

        pdf.setFontSize(8);
        pdf.setTextColor(100);
        pdf.text("ExpensaCheck - Informe de Evolución", margin, footerY);
        pdf.text(`Generado el ${new Date().toLocaleDateString()}`, pdfWidth - margin, footerY, { align: "right" });
        pdf.text(`Pág ${pageNo}`, pdfWidth / 2, footerY, { align: "center" });
      };

      // --- First Page ---
      // Content area on Page 1: from [margin] to [pdfHeight - margin - footerHeight]
      const startY = margin;
      const maxContentY = pdfHeight - margin - footerHeight;
      const firstPageCap = maxContentY - startY; // Available height for content

      pdf.addImage(imgData, "PNG", margin, startY, printWidth, imgHeight);

      // MASK BOTTOM (to protect footer)
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, maxContentY, pdfWidth, pdfHeight - maxContentY, "F");

      drawFooter(1);

      heightLeft -= firstPageCap;
      printedHeight += firstPageCap;

      // --- Subsequent Pages ---
      while (heightLeft > 0) {
        pageNumber++;
        pdf.addPage();

        const headerHeight = 8;
        const pageStartY = margin + headerHeight;
        const pageMaxContentY = pdfHeight - margin - footerHeight;
        const availableHeight = pageMaxContentY - pageStartY;

        pdf.addImage(imgData, "PNG", margin, pageStartY - printedHeight, printWidth, imgHeight);

        // MASK TOP (Cover previous content above header)
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pdfWidth, pageStartY, "F");

        // MASK BOTTOM (Cover future content below footer area)
        pdf.rect(0, pageMaxContentY, pdfWidth, pdfHeight - pageMaxContentY, "F");

        // Header
        pdf.setFontSize(9);
        pdf.setTextColor(150);
        pdf.text(`ExpensaCheck - Informe de Evolución`, margin, margin);

        drawFooter(pageNumber);

        heightLeft -= availableHeight;
        printedHeight += availableHeight;
      }

      pdf.save(`Evolución_Expensas_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Informe descargado correctamente");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Error al generar el PDF");
    } finally {
      setIsExporting(false);
    }
  };

  // Get unique buildings from the direct buildings query (more reliable than derived from paginated analyses)
  const buildings = useMemo(() => {
    return hookBuildings || [];
  }, [hookBuildings]);

  // If no building is selected AND no search param exists, pick the first one as default
  useEffect(() => {
    if (selectedBuilding === "all" && buildings.length > 0 && !searchParams.get("edificio")) {
      // We only auto-select the first building on initial load if no param is present
      // To avoid overriding the user's choice of "all" later
      const hasInitiallySelected = sessionStorage.getItem("hasInitiallySelectedBuilding");
      if (!hasInitiallySelected) {
        setSelectedBuilding(buildings[0]);
        sessionStorage.setItem("hasInitiallySelectedBuilding", "true");
      }
    }
  }, [buildings, selectedBuilding, searchParams]);

  // Get unique categories from the hook (which queries the DB directly)
  const categories = useMemo(() => {
    return hookCategories || [];
  }, [hookCategories]);

  // Filter and prepare chart data
  const chartData = useMemo(() => {
    let filtered = analyses.filter(a => a.status === "completed");

    if (selectedBuilding !== "all") {
      filtered = filtered.filter(a => a.building_name === selectedBuilding);
    }

    // Sort by period_date if available, otherwise fallback
    const sorted = [...filtered].sort((a, b) => {
      if (a.period_date && b.period_date) {
        return new Date(a.period_date).getTime() - new Date(b.period_date).getTime();
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    // Limit to latest 15 periods
    const sliced = sorted.slice(-15);

    return sliced.map(a => {
      let amount = a.total_amount;

      if (selectedCategory !== "all") {
        const cat = a.expense_categories?.find(c => c.name === selectedCategory);
        amount = cat ? cat.current_amount : 0;
      }

      return {
        period: a.period,
        periodDate: a.period_date,
        total: amount,
        id: a.id,
      };
    });
  }, [analyses, selectedBuilding, selectedCategory]);

  // Use the hook to calculate comparison data
  const comparisonData = useMemo(() => {
    const baseEvolution = calculateEvolution(analyses.filter(a =>
      a.status === "completed" &&
      (selectedBuilding === "all" || a.building_name === selectedBuilding)
    ), selectedCategory);

    if (baseEvolution.length < 2) return [];

    // Enhance with inflation and buildings data
    // Build a map: YYYY-MM -> cumulative index value (for compound accumulation)
    const inflationMap = new Map(inflationData.map(d => [d.period, d.value]));
    const firstPeriodYM = periodToYearMonth(baseEvolution[0].period, baseEvolution[0].periodDate ?? null);
    const baseInflationIndex = firstPeriodYM ? inflationMap.get(firstPeriodYM) ?? null : null;

    // Create a map of buildings trend by period using the raw average
    // The trend periods are in Spanish ("enero 2024"), same as analysis.period
    const buildingsTrendMap = new Map(
      buildingsTrend.map((t: any) => [t.period, t.average])
    );

    // Get the market average for the first period of our series
    const baseMarketAvg = buildingsTrendMap.get(baseEvolution[0].period);

    return baseEvolution.map(point => {
      const yyyymm = periodToYearMonth(point.period, point.periodDate ?? null);

      // Compound (multiplicative) inflation accumulation from base period
      let infPercent: number | null = null;
      if (yyyymm && baseInflationIndex !== null && baseInflationIndex > 0) {
        const currentInfIndex = inflationMap.get(yyyymm) ?? null;
        if (currentInfIndex !== null) {
          // Compound: ((current / base) - 1) * 100
          infPercent = parseFloat(((currentInfIndex / baseInflationIndex - 1) * 100).toFixed(1));
        }
      }

      // Get buildings percent for this specific period, re-normalized to our base period
      let buildingsPercent: number | null = null;
      const currentMarketAvg = buildingsTrendMap.get(point.period);
      if (currentMarketAvg !== undefined && baseMarketAvg !== undefined && Number(baseMarketAvg) > 0) {
        buildingsPercent = parseFloat(((Number(currentMarketAvg) / Number(baseMarketAvg) - 1) * 100).toFixed(1));
      }

      return {
        ...point,
        inflationPercent: infPercent,
        buildingsPercent
      } as EvolutionData;
    });
  }, [analyses, selectedBuilding, selectedCategory, inflationData, buildingsTrend, calculateEvolution]);

  // Derive deviation from the latest comparison data point
  const comparisonDeviation = useMemo(() => {
    return calculateDeviation(comparisonData, buildingsTrendStats);
  }, [comparisonData, buildingsTrendStats, calculateDeviation]);

  // Update AI analysis based on selected building
  useEffect(() => {
    const completed = analyses.filter(a => a.status === "completed");
    if (selectedBuilding !== "all" && selectedCategory === "all") {
      const latest = [...completed]
        .filter(a => a.building_name === selectedBuilding)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      if (latest?.evolution_analysis) {
        setAiAnalysis(latest.evolution_analysis);
        setDeviation(latest.deviation_stats);
      } else {
        setAiAnalysis(null);
        setDeviation(null);
      }
    } else {
      setAiAnalysis(null);
      setDeviation(null);
    }
  }, [analyses, selectedBuilding, selectedCategory]);

  // Calculate stats
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;

    const totals = chartData.map(d => d.total);
    const min = Math.min(...totals);
    const max = Math.max(...totals);
    const avg = totals.reduce((a, b) => a + b, 0) / totals.length;

    const lastTwo = chartData.slice(-2);
    let changePercent = 0;
    if (lastTwo.length === 2 && lastTwo[0].total > 0) {
      changePercent = ((lastTwo[1].total - lastTwo[0].total) / lastTwo[0].total) * 100;
    }

    return { min, max, avg, changePercent, count: chartData.length };
  }, [chartData]);

  const handleBuildingChange = (value: string) => {
    setSelectedBuilding(value);
    if (value === "all") {
      searchParams.delete("edificio");
    } else {
      searchParams.set("edificio", value);
    }
    setSearchParams(searchParams);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    if (value === "all") {
      searchParams.delete("categoria");
    } else {
      searchParams.set("categoria", value);
    }
    setSearchParams(searchParams);
  };

  const isLoading = loadingAnalyses || loadingEvolution;

  if (isLoading && analyses.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <Header />
        <main className="pt-24 pb-20">
          <div className="container max-w-5xl">
            <Skeleton className="h-10 w-64 mb-8" />
            <Skeleton className="h-96 w-full" />
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
        <div className="container max-w-5xl relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
            <div>
              <Button variant="ghost" className="pl-0 mb-4 hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors group" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Volver al historial
              </Button>
            </div>
            <Button onClick={exportToPDF} disabled={isExporting || loadingAnalyses} variant="hero" className="gap-3 rounded-2xl px-8 shadow-xl shadow-primary/20">
              {isExporting ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              {isExporting ? "Generando informe..." : "Exportar PDF"}
            </Button>
          </div>

          <div id="evolucion-report-content">
            {/* PDF / PRINT HEADER — visible only when printing or exporting, hidden on screen */}
            <div id="pdf-header" className="hidden print:flex pdf-header-standard">
              <div className="logo-section">
                <div className="w-14 h-14">
                  <Logo className="w-full h-full" />
                </div>
                <div className="branding">
                  <h1>ExpensaCheck</h1>
                  <p>Inteligencia Artificial para tus Expensas</p>
                </div>
              </div>
              <div className="info-section">
                <p>{selectedBuilding !== "all" ? selectedBuilding : "Reporte Global de Evolución"}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                  {new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="mb-12 pdf-hide">
              <h1 className="text-5xl font-extrabold tracking-tight mb-4">Evolución de Expensas</h1>
              <p className="text-xl text-muted-foreground font-medium max-w-2xl">
                Visualizá el comportamiento de tus gastos y comparalos con indicadores clave del mercado.
              </p>
            </div>

            {analyses.filter(a => a.status === "completed").length === 0 ? (
              <Card variant="soft" className="animate-fade-in-up">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
                    <LineChart className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">No hay datos para mostrar</h2>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Necesitás al menos un análisis completado para ver la evolución.
                  </p>
                  <Button asChild variant="hero">
                    <Link to="/analizar">Analizar mi primera expensa</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Selectors - Interactive (Hidden on PDF) */}
                {/* Selectors - Premium Glassmatic Design */}
                <Card id="filters-card" className="mb-8 bg-card/40 backdrop-blur-xl border-border/50 shadow-2xl rounded-[2rem] overflow-hidden animate-fade-in-up">
                  <CardContent className="p-8">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-8">
                      <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Building className="w-5 h-5 text-primary" />
                          </div>
                          <span className="text-base font-bold text-foreground">Edificio:</span>
                        </div>
                        <Select value={selectedBuilding} onValueChange={handleBuildingChange}>
                          <SelectTrigger className="w-full sm:w-[260px] h-12 rounded-xl bg-background/50 border-border/50 focus:ring-primary/20">
                            <SelectValue placeholder="Seleccionar edificio" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border/50">
                            <SelectItem value="all">Todos los edificios</SelectItem>
                            {buildings.map((building) => (
                              <SelectItem key={building} value={building}>
                                {building}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center border border-secondary/20">
                            <Sparkles className="w-5 h-5 text-secondary" />
                          </div>
                          <span className="text-base font-bold text-foreground">Categoría:</span>
                        </div>
                        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                          <SelectTrigger className="w-full sm:w-[260px] h-12 rounded-xl bg-background/50 border-border/50 focus:ring-primary/20">
                            <SelectValue placeholder="Ver todas" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border/50">
                            <SelectItem value="all">Monto total (todas)</SelectItem>
                            {categories.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {loadingEvolution && (
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/5">
                          <RefreshCw className="w-6 h-6 animate-spin text-primary shrink-0" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Static Filter Summary for PDF */}
                <div id="pdf-filter-summary" className="hidden mb-10 p-8 border-2 border-dashed rounded-3xl bg-muted/30 border-border/50">
                  <div className="flex flex-row justify-between items-center text-lg">
                    <div className="flex items-center gap-4">
                      <Building className="w-6 h-6 text-primary" />
                      <div>
                        <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Edificio Seleccionado</p>
                        <p className="font-extrabold text-foreground">{selectedBuilding === "all" ? "Todos los edificios" : selectedBuilding}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Sparkles className="w-6 h-6 text-secondary" />
                      <div>
                        <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Categoría de Análisis</p>
                        <p className="font-extrabold text-foreground">{selectedCategory === "all" ? "Monto total (todas)" : selectedCategory}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-lg rounded-3xl animate-fade-in-up">
                      <CardContent className="p-6 text-center">
                        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">Períodos</p>
                        <p className="text-4xl font-extrabold text-foreground">{stats.count}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-lg rounded-3xl animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
                      <CardContent className="p-6 text-center">
                        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">Promedio</p>
                        <p className="text-2xl font-extrabold text-foreground">{formatCurrency(stats.avg)}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-lg rounded-3xl animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                      <CardContent className="p-6 text-center">
                        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">Mínimo</p>
                        <p className="text-2xl font-extrabold text-primary">{formatCurrency(stats.min)}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-lg rounded-3xl animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
                      <CardContent className="p-6 text-center">
                        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">Máximo</p>
                        <p className="text-2xl font-extrabold text-secondary">{formatCurrency(stats.max)}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Evolution Chart (Absolute values) */}
                {chartData.length > 0 && (
                  <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-2xl rounded-[2.5rem] overflow-hidden animate-fade-in-up mb-8">
                    <CardHeader className="p-8 pb-4">
                      <div className="flex items-center justify-between flex-wrap gap-6">
                        <div>
                          <CardTitle className="text-2xl font-extrabold tracking-tight">
                            {selectedCategory === "all" ? "Evolución Histórica Monomodal" : `Gasto en ${selectedCategory}`}
                          </CardTitle>
                          <CardDescription className="text-base font-medium text-muted-foreground mt-1">
                            {selectedBuilding === "all"
                              ? "Consolidado de todos tus activos"
                              : `Edificio: ${selectedBuilding}`}
                          </CardDescription>
                        </div>
                        {stats && stats.count >= 2 && (
                          <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-base font-black tracking-tight shadow-lg ${stats.changePercent > 0
                            ? "bg-secondary/10 text-secondary shadow-secondary/10"
                            : stats.changePercent < 0
                              ? "bg-primary/10 text-primary shadow-primary/10"
                              : "bg-muted text-muted-foreground"
                            }`}>
                            {stats.changePercent > 0 ? (
                              <TrendingUp className="w-6 h-6" />
                            ) : stats.changePercent < 0 ? (
                              <TrendingDown className="w-6 h-6" />
                            ) : (
                              <Minus className="w-6 h-6" />
                            )}
                            <span>
                              {stats.changePercent > 0 ? "+" : ""}
                              {stats.changePercent.toFixed(1)}% mensual
                            </span>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                      <div className="h-[400px] w-full mt-6">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.3)" />
                            <XAxis
                              dataKey="period"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 13, fontWeight: 600, fill: "hsl(var(--muted-foreground))" }}
                              dy={15}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 13, fontWeight: 600, fill: "hsl(var(--muted-foreground))" }}
                              tickFormatter={(value) => `$${(value / 1000).toLocaleString()}${value >= 1000 ? 'k' : ''}`}
                            />
                            <Tooltip
                              cursor={{ stroke: 'hsl(var(--primary)/0.2)', strokeWidth: 2 }}
                              contentStyle={{
                                backgroundColor: "hsl(var(--card)/0.9)",
                                backdropFilter: "blur(8px)",
                                borderColor: "hsl(var(--border)/0.5)",
                                borderRadius: "20px",
                                boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.5)",
                                border: "1px solid hsl(var(--border)/0.5)",
                                padding: "16px"
                              }}
                              itemStyle={{ color: "hsl(var(--foreground))", fontWeight: 700 }}
                              labelStyle={{ color: "hsl(var(--muted-foreground))", fontWeight: 600, marginBottom: "8px" }}
                              formatter={(value: number) => [formatCurrency(value), "Monto Final"]}
                            />
                            <Area
                              type="monotone"
                              dataKey="total"
                              stroke="hsl(var(--primary))"
                              strokeWidth={4}
                              fillOpacity={1}
                              fill="url(#colorTotal)"
                              animationDuration={2000}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Comparison Chart */}
                {comparisonData.length >= 2 && (
                  <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                    <EvolutionComparisonChart
                      data={comparisonData}
                      buildingName={selectedBuilding !== "all" ? selectedBuilding : "Mis edificios"}
                      categoryName={selectedCategory !== "all" ? selectedCategory : "Total"}
                      deviation={comparisonDeviation ?? undefined}
                      analysis={aiAnalysis}
                      buildingsTrendStats={buildingsTrendStats}
                    />
                  </div>
                )}

                {/* AI Analysis / Evolution Insights */}
                {aiAnalysis && (
                  <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-2xl rounded-[3rem] overflow-hidden mt-12 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                    <CardHeader className="p-10 pb-6 border-b border-border/30">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl font-extrabold tracking-tight">Análisis Predictivo & Tendencias</CardTitle>
                          <p className="text-muted-foreground font-medium">Información generada por nuestro motor de IA</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-10 pt-8">
                      <div className="prose prose-lg dark:prose-invert max-w-none text-foreground font-medium leading-relaxed whitespace-pre-line opacity-90">
                        {aiAnalysis}
                      </div>

                      {deviation && deviation.isSignificant && (
                        <div className="mt-10 p-8 bg-secondary/10 border border-secondary/20 rounded-[2rem] flex items-center gap-6 shadow-lg shadow-secondary/5">
                          <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center border border-secondary/20 shrink-0">
                            <TrendingUp className="w-8 h-8 text-secondary" />
                          </div>
                          <div>
                            <p className="text-xl font-extrabold text-secondary mb-1">Desviación Atípica Detectada</p>
                            <p className="text-lg text-muted-foreground font-medium lg:max-w-xl">
                              Tus expensas están <span className="text-foreground">{deviation.fromInflation > 0 ? "por encima" : "por debajo"}</span> de la inflación acumulada en un <span className="text-foreground font-bold">{Math.abs(deviation.fromInflation).toFixed(1)}%</span>.
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Footer removed, handled by jsPDF */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Evolucion;
