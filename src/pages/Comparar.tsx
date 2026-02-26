import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ComparisonChart } from "@/components/ComparisonChart";
import {
  CheckCircle2,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Building,
  Wrench,
  Droplets,
  Zap,
  Users,
  Shield,
  LogOut,
  ArrowLeftRight,
  AlertTriangle,
  Download,
  RefreshCw,
  Plus
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Logo } from "@/components/layout/ui/logo";

const iconMap: Record<string, any> = {
  users: Users,
  zap: Zap,
  droplets: Droplets,
  wrench: Wrench,
  shield: Shield,
  building: Building,
};

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
          <Button asChild variant="ghost" className="hidden sm:flex rounded-full px-6 hover:bg-accent font-semibold" size="sm">
            <Link to="/analizar">
              <Plus className="w-4 h-4 mr-2" />
              Nueva expensa
            </Link>
          </Button>
          <div className="flex items-center gap-2">
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

const calculateChange = (current: number, previous: number) => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  amount: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  current_amount: number;
  previous_amount: number | null;
  status: string;
  explanation: string | null;
  expense_subcategories?: Subcategory[];
}

interface Analysis {
  id: string;
  building_name: string | null;
  period: string;
  unit: string | null;
  total_amount: number;
  previous_total: number | null;
  status: string;
  created_at: string;
  categories?: Category[];
}

const CompararPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const leftId = searchParams.get("left");
  const rightId = searchParams.get("right");

  useEffect(() => {
    const fetchAnalyses = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("expense_analyses")
          .select("*")
          .eq("status", "completed")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setAnalyses(data || []);
      } catch (error: any) {
        console.error("Error fetching analyses:", error);
        toast.error("Error al cargar los análisis");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyses();
  }, [navigate]);

  const [leftAnalysis, setLeftAnalysis] = useState<Analysis | null>(null);
  const [rightAnalysis, setRightAnalysis] = useState<Analysis | null>(null);
  const [leftCategories, setLeftCategories] = useState<Category[]>([]);
  const [rightCategories, setRightCategories] = useState<Category[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!leftId || !rightId) {
        setLeftAnalysis(null);
        setRightAnalysis(null);
        setLeftCategories([]);
        setRightCategories([]);
        return;
      }

      setLoadingDetails(true);
      try {
        const [leftData, rightData] = await Promise.all([
          supabase.from("expense_analyses").select("*").eq("id", leftId).single(),
          supabase.from("expense_analyses").select("*").eq("id", rightId).single(),
        ]);

        if (leftData.error) throw leftData.error;
        if (rightData.error) throw rightData.error;

        setLeftAnalysis(leftData.data);
        setRightAnalysis(rightData.data);

        const [leftCats, rightCats] = await Promise.all([
          supabase.from("expense_categories").select("*, expense_subcategories(*)").eq("analysis_id", leftId).order("current_amount", { ascending: false }),
          supabase.from("expense_categories").select("*, expense_subcategories(*)").eq("analysis_id", rightId).order("current_amount", { ascending: false }),
        ]);

        if (leftCats.error) throw leftCats.error;
        if (rightCats.error) throw rightCats.error;

        setLeftCategories(leftCats.data as unknown as Category[] || []);
        setRightCategories(rightCats.data as unknown as Category[] || []);
      } catch (error: any) {
        console.error("Error fetching details:", error);
        toast.error("Error al cargar los detalles");
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [leftId, rightId]);

  const categoryComparison = useMemo(() => {
    if (!leftCategories.length || !rightCategories.length) return [];

    const allCategoryNames = new Set([
      ...leftCategories.map(c => c.name),
      ...rightCategories.map(c => c.name),
    ]);

    return Array.from(allCategoryNames).map(name => {
      const left = leftCategories.find(c => c.name === name);
      const right = rightCategories.find(c => c.name === name);
      const leftAmount = left?.current_amount || 0;
      const rightAmount = right?.current_amount || 0;
      const diff = rightAmount - leftAmount;
      const changePercent = leftAmount > 0 ? calculateChange(rightAmount, leftAmount) : null;

      return {
        name,
        icon: left?.icon || right?.icon || "building",
        leftAmount,
        rightAmount,
        diff,
        changePercent,
        leftSubcategories: left?.expense_subcategories || [],
        rightSubcategories: right?.expense_subcategories || [],
      };
    }).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  }, [leftCategories, rightCategories]);

  const handleSelectLeft = (id: string) => {
    setSearchParams({ left: id, right: rightId || "" });
  };

  const handleSelectRight = (id: string) => {
    setSearchParams({ left: leftId || "", right: id });
  };

  const swapSelections = () => {
    if (leftId && rightId) {
      setSearchParams({ left: rightId, right: leftId });
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById("comparar-report-content");
      if (!element) return;

      const filtersCard = document.getElementById("comparison-filters-card");
      const pdfSummary = document.getElementById("pdf-comparison-summary");
      const pdfHeader = document.getElementById("pdf-header");

      // 1. Prepare View for Capture
      if (filtersCard) filtersCard.style.display = "none";
      if (pdfSummary) pdfSummary.style.display = "block";
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
      if (pdfSummary) pdfSummary.style.display = "none";
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
        pdf.text("ExpensaCheck - Comparativa de Expensas", margin, footerY);
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
        pdf.text(`ExpensaCheck - Comparativa - Pág ${pageNumber}`, margin, margin);

        drawFooter(pageNumber);

        heightLeft -= availableHeight;
        printedHeight += availableHeight;
      }

      pdf.save(`Comparativa_Expensas_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Comparativa descargada correctamente");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Error al generar el PDF");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 -z-10 bg-background">
          <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-primary/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-secondary/5 blur-[120px] rounded-full"></div>
        </div>
        <Header />
        <main className="pt-32 pb-32">
          <div className="container max-w-6xl relative z-10">
            <Skeleton className="h-48 w-full mb-8 rounded-[2.5rem]" />
            <Skeleton className="h-96 w-full rounded-[2.5rem]" />
          </div>
        </main>
      </div>
    );
  }

  if (analyses.length < 2) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 -z-10 bg-background">
          <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-primary/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-secondary/5 blur-[120px] rounded-full"></div>
        </div>
        <Header />
        <main className="pt-32 pb-32">
          <div className="container max-w-4xl text-center relative z-10">
            <div className="w-20 h-20 rounded-[2rem] bg-muted flex items-center justify-center mx-auto mb-8 border border-border/50">
              <ArrowLeftRight className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">Insuficientes datos</h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-lg mx-auto font-medium">
              Necesitás al menos 2 análisis completados para poder compararlos lado a lado.
            </p>
            <Button asChild variant="hero" size="xl" className="rounded-2xl px-12 shadow-xl shadow-primary/20">
              <Link to="/analizar">
                <Plus className="w-5 h-5 mr-3" />
                Analizar nueva expensa
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const totalDiff = leftAnalysis && rightAnalysis
    ? rightAnalysis.total_amount - leftAnalysis.total_amount
    : 0;
  const totalChangePercent = leftAnalysis && rightAnalysis && leftAnalysis.total_amount > 0
    ? calculateChange(rightAnalysis.total_amount, leftAnalysis.total_amount)
    : 0;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 -z-10 bg-background">
        <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-primary/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-secondary/5 blur-[120px] rounded-full"></div>
      </div>

      <Header />
      <main className="pt-32 pb-32">
        <div className="container max-w-6xl relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
            <Button variant="ghost" className="pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors group" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Volver al historial
            </Button>
            {leftId && rightId && !loadingDetails && (
              <Button onClick={exportToPDF} disabled={isExporting} variant="hero" className="gap-3 rounded-2xl px-8 shadow-xl shadow-primary/20">
                {isExporting ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                {isExporting ? "Generando informe..." : "Exportar Comparativa PDF"}
              </Button>
            )}
          </div>

          <div id="comparar-report-content">
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
                <p>{leftAnalysis?.building_name || "Comparativa lado a lado"}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                  {new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="mb-10 pdf-hide">
              <h1 className="text-5xl font-extrabold tracking-tight mb-4">Comparativa Lado a Lado</h1>
              <p className="text-xl text-muted-foreground font-medium max-w-2xl">
                Analizá las variaciones específicas entre dos períodos de liquidación.
              </p>
            </div>

            {/* Selection Area - Premium Glass Design */}
            <Card id="comparison-filters-card" className="mb-12 bg-card/40 backdrop-blur-xl border-border/50 shadow-2xl rounded-[2.5rem] overflow-hidden animate-fade-in-up">
              <CardContent className="p-10">
                <div className="grid md:grid-cols-[1fr,auto,1fr] gap-8 items-end">
                  <div className="space-y-4">
                    <label className="text-sm font-black uppercase tracking-widest text-muted-foreground px-1">Análisis Base (Mes A)</label>
                    <Select value={leftId || ""} onValueChange={handleSelectLeft}>
                      <SelectTrigger className="h-14 bg-background/50 border-border/50 rounded-2xl focus:ring-primary/20 text-lg font-bold">
                        <SelectValue placeholder="Seleccionar período..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-border/50">
                        {analyses.map((a) => (
                          <SelectItem key={a.id} value={a.id} disabled={a.id === rightId} className="py-3">
                            <span className="font-bold">{a.period}</span>
                            <span className="ml-2 text-muted-foreground font-medium">- {a.building_name || "Edificio"}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-center pb-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={swapSelections}
                      disabled={!leftId || !rightId}
                      className="w-14 h-14 rounded-2xl border-border/50 hover:bg-accent group"
                    >
                      <ArrowLeftRight className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-black uppercase tracking-widest text-muted-foreground px-1">Comparar con (Mes B)</label>
                    <Select value={rightId || ""} onValueChange={handleSelectRight}>
                      <SelectTrigger className="h-14 bg-background/50 border-border/50 rounded-2xl focus:ring-primary/20 text-lg font-bold">
                        <SelectValue placeholder="Seleccionar período..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-border/50">
                        {analyses.map((a) => (
                          <SelectItem key={a.id} value={a.id} disabled={a.id === leftId} className="py-3">
                            <span className="font-bold">{a.period}</span>
                            <span className="ml-2 text-muted-foreground font-medium">- {a.building_name || "Edificio"}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Static PDF Summary (Hidden on Screen) */}
            <div id="pdf-comparison-summary" className="hidden mb-8 p-6 border rounded-xl bg-gray-50 border-gray-200">
              <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center text-sm">
                <div>
                  <span className="block font-semibold text-gray-500 mb-1">Análisis Base</span>
                  <span className="text-lg font-medium">
                    {leftAnalysis ? `${leftAnalysis.building_name || "Edificio"} - ${leftAnalysis.period}` : "No seleccionado"}
                  </span>
                </div>

                <div className="px-4 text-gray-400">vs</div>

                <div className="text-right">
                  <span className="block font-semibold text-gray-500 mb-1">Comparado con</span>
                  <span className="text-lg font-medium">
                    {rightAnalysis ? `${rightAnalysis.building_name || "Edificio"} - ${rightAnalysis.period}` : "No seleccionado"}
                  </span>
                </div>
              </div>
            </div>

            {loadingDetails && (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            )}

            {leftAnalysis && rightAnalysis && !loadingDetails && (
              <>
                {/* Summary Comparison */}
                {/* Summary Comparison - Premium Dashboard Card */}
                <Card className="mb-12 bg-card/40 backdrop-blur-xl border-border/50 shadow-2xl rounded-[3rem] overflow-hidden animate-fade-in-up">
                  <CardContent className="p-12">
                    <div className="grid md:grid-cols-[1fr,auto,1fr] gap-12 items-center">
                      <div className="text-center md:text-left space-y-2">
                        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                          {leftAnalysis.period}
                        </p>
                        <p className="text-4xl font-black tabular-nums">{formatCurrency(leftAnalysis.total_amount)}</p>
                        <p className="text-sm font-medium text-muted-foreground">{leftAnalysis.building_name || "Edificio"}</p>
                      </div>

                      <div className="flex flex-col items-center gap-4">
                        <div className={`text-2xl font-black flex items-center gap-2 drop-shadow-sm ${totalDiff > 0 ? "text-secondary" : totalDiff < 0 ? "text-primary" : "text-muted-foreground"
                          }`}>
                          {totalDiff > 0 ? <TrendingUp className="w-8 h-8" /> : totalDiff < 0 ? <TrendingDown className="w-8 h-8" /> : <Minus className="w-8 h-8" />}
                          {totalDiff > 0 ? "+" : ""}{formatCurrency(totalDiff)}
                        </div>
                        <div className={`px-6 py-2 rounded-full text-base font-black tracking-tight ${totalDiff > 0
                          ? "bg-secondary/10 text-secondary border border-secondary/20"
                          : totalDiff < 0
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-muted text-muted-foreground"
                          }`}>
                          {totalChangePercent > 0 ? "+" : ""}{totalChangePercent.toFixed(1)}% mensual
                        </div>
                      </div>

                      <div className="text-center md:text-right space-y-2">
                        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                          {rightAnalysis.period}
                        </p>
                        <p className="text-4xl font-black tabular-nums">{formatCurrency(rightAnalysis.total_amount)}</p>
                        <p className="text-sm font-medium text-muted-foreground">{rightAnalysis.building_name || "Edificio"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bar Chart Comparison */}
                {categoryComparison.length > 0 && (
                  <div className="mb-8">
                    <ComparisonChart
                      data={categoryComparison}
                      leftLabel={`${leftAnalysis.building_name || "Edificio"} - ${leftAnalysis.period}`}
                      rightLabel={`${rightAnalysis.building_name || "Edificio"} - ${rightAnalysis.period}`}
                    />
                  </div>
                )}

                {/* Category Comparison Section */}
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-extrabold tracking-tight">Desglose Comparativo</h2>
                  <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    <ArrowLeftRight className="w-4 h-4" />
                    Categorías Detectadas
                  </div>
                </div>

                <div className="space-y-4 mb-12">
                  {categoryComparison.map((cat, index) => {
                    const Icon = iconMap[cat.icon] || Building;
                    const isIncrease = cat.diff > 0;
                    const isDecrease = cat.diff < 0;
                    const isSignificant = cat.changePercent !== null && Math.abs(cat.changePercent) > 20;

                    return (
                      <Card
                        key={cat.name}
                        className={cn(
                          "group animate-fade-in-up transition-all duration-300 rounded-3xl overflow-hidden bg-card/40 backdrop-blur-xl border-border/50 hover:border-primary/50 shadow-lg",
                          isSignificant && isIncrease && "border-secondary/30 bg-secondary/5"
                        )}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <CardContent className="p-6 md:p-8">
                          <div className="grid grid-cols-[1fr,auto,1fr] gap-8 items-center">
                            <div className="text-right">
                              <p className="text-xl font-bold tabular-nums text-foreground/80">{formatCurrency(cat.leftAmount)}</p>
                              {cat.leftSubcategories.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {cat.leftSubcategories.map((sub: any) => (
                                    <p key={sub.id} className="text-[10px] text-muted-foreground">
                                      {sub.name}: <span className="font-medium text-foreground/60">{formatCurrency(sub.amount)}</span>
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col items-center gap-3 min-w-[180px]">
                              <div className="flex items-center gap-3 px-4 py-2 bg-background/50 rounded-2xl border border-border/50 group-hover:bg-primary/5 transition-colors">
                                <Icon className="w-5 h-5 text-primary" />
                                <span className="text-base font-extrabold text-foreground">{cat.name}</span>
                              </div>
                              <div className={`text-sm font-black flex items-center gap-1.5 ${isIncrease ? "text-secondary" : isDecrease ? "text-primary" : "text-muted-foreground"
                                }`}>
                                {isIncrease ? <TrendingUp className="w-4 h-4" /> : isDecrease ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                                {cat.changePercent !== null ? (
                                  <span>{cat.changePercent > 0 ? "+" : ""}{cat.changePercent.toFixed(1)}%</span>
                                ) : (
                                  <span>0.0%</span>
                                )}
                              </div>
                              {isSignificant && isIncrease && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-secondary/20 rounded-full border border-secondary/20">
                                  <AlertTriangle className="w-4 h-4 text-secondary" />
                                  <span className="text-[10px] font-black uppercase text-secondary">Alerta de Desvío</span>
                                </div>
                              )}
                            </div>

                            <div className="text-left">
                              <p className="text-xl font-bold tabular-nums text-foreground">{formatCurrency(cat.rightAmount)}</p>
                              {cat.rightSubcategories.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {cat.rightSubcategories.map((sub: any) => (
                                    <p key={sub.id} className="text-[10px] text-muted-foreground">
                                      {sub.name}: <span className="font-medium text-foreground/80">{formatCurrency(sub.amount)}</span>
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {categoryComparison.length === 0 && (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      No hay categorías para comparar
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {!leftId && !rightId && !loadingDetails && (
              <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-2xl rounded-[3rem] overflow-hidden py-24 px-10 border-dashed border-2 animate-fade-in-up">
                <CardContent className="text-center space-y-8">
                  <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse"></div>
                    <div className="relative w-24 h-24 rounded-full bg-background/50 flex items-center justify-center border border-border/50 backdrop-blur-md">
                      <ArrowLeftRight className="w-10 h-10 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="max-w-sm mx-auto space-y-3">
                    <h3 className="text-2xl font-extrabold tracking-tight">Listo para comparar</h3>
                    <p className="text-lg text-muted-foreground font-medium">
                      Seleccioná dos períodos arriba para ver un análisis detallado de sus diferencias.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Footer removed, handled by jsPDF */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CompararPage;
