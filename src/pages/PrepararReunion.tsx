import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Users,
    Calendar,
    CheckCircle2,
    ArrowRight,
    Plus,
    ArrowLeft,
    Search,
    Building,
    ClipboardList,
    MessageSquare,
    AlertCircle,
    Loader2,
    Printer,
    Download,
    Copy,
    Zap,
    Brain,
    HelpCircle,
    Trophy,
    Info,
    LayoutList
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useAnalysis } from "@/hooks/useAnalysis";
import type { Analysis } from "@/types/analysis";
import { Logo } from "@/components/layout/ui/logo";
import { cn } from "@/lib/utils";

const Header = () => {
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
                    <Button asChild variant="ghost" className="rounded-full px-6 hover:bg-accent font-semibold">
                        <Link to="/historial">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver al historial
                        </Link>
                    </Button>
                </div>
            </div>
        </header>
    );
};

interface MeetingItem {
    id: string;
    category: string;
    title: string;
    description: string;
    problem?: string; // Nuevo
    proposed_solution?: string; // Nuevo
    source: string;
    importance: "high" | "medium" | "low";
    selected?: boolean;
}

interface AnticipatedQuestion {
    question: string;
    answer: string;
}

interface KeyFigure {
    label: string;
    value: string;
}

interface PreparationGuide {
    anticipated_questions: AnticipatedQuestion[];
    key_figures: KeyFigure[];
}

interface MeetingSummary {
    title: string;
    items: MeetingItem[];
    preparation_guide?: PreparationGuide;
}

const PrepararReunion = () => {
    const navigate = useNavigate();
    const [selectedBuilding, setSelectedBuilding] = useState<string>("");
    const {
        analyses,
        buildings,
        loading,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage
    } = useAnalysis({ buildingName: selectedBuilding });
    const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [summary, setSummary] = useState<MeetingSummary | null>(null);
    const [activeItems, setActiveItems] = useState<Set<string>>(new Set());
    const [isFreeUser, setIsFreeUser] = useState(false);

    // Check if user has free_analysis (no limits)
    useEffect(() => {
        const checkFreeUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from("profiles")
                    .select("free_analysis")
                    .eq("user_id", user.id)
                    .maybeSingle();
                if (data?.free_analysis) {
                    setIsFreeUser(true);
                }
            }
        };
        checkFreeUser();
    }, []);

    // Filter analyses for the selected building (done mostly by server now, but we keep it safe)
    const buildingAnalyses = useMemo(() => {
        if (!selectedBuilding) return [];
        return analyses.filter(a => a.building_name === selectedBuilding && a.status === "completed");
    }, [selectedBuilding, analyses]);

    const toggleAnalysis = (id: string) => {
        setSelectedAnalyses(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    const handleGenerate = async () => {
        if (selectedAnalyses.length === 0) {
            toast.error("Seleccioná al menos un período");
            return;
        }

        setIsGenerating(true);
        setSummary(null);

        // Force deploy comment: v1.0.1
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                toast.error("Tu sesión ha expirado. Por favor, reingresá.");
                navigate("/auth");
                return;
            }

            const { data, error } = await supabase.functions.invoke("prepare-meeting", {
                body: {
                    analysis_ids: selectedAnalyses,
                    building_name: selectedBuilding
                }
            });

            if (error) {
                if (error.status === 429) {
                    toast.error("Límite diario alcanzado: podés generar hasta 3 temarios por día.");
                    return;
                }
                throw error;
            }

            setSummary(data);
            // Initialize all items as active
            setActiveItems(new Set(data.items.map((item: MeetingItem) => item.id)));
            toast.success("Temario estratégico generado con éxito");
        } catch (error: any) {
            console.error("Error generating meeting prep:", error);
            const errorMessage = error.message === "RATE_LIMIT_EXCEEDED"
                ? "Límite diario alcanzado (3 reuniones por día)."
                : "No se pudo generar el temario. Reintentá en unos minutos.";
            toast.error(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleItem = (id: string) => {
        setActiveItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const handleCopy = () => {
        if (!summary) return;
        const activeSummaryItems = summary.items.filter(item => activeItems.has(item.id));
        const agendaText = activeSummaryItems.map(item =>
            `[ ] ${item.title} (${item.category})\n    ${item.description}\n` +
            (item.problem ? `    ⚠️ Problema detectado: ${item.problem}\n` : "") +
            (item.proposed_solution ? `    ✅ Solución propuesta: ${item.proposed_solution}\n` : "") +
            `    Fuente: ${item.source}`
        ).join('\n\n');

        let fullText = `${summary.title}\n\n${agendaText}`;

        if (summary.preparation_guide) {
            const prepText = `\n\n=== GUÍA DE PREPARACIÓN (SOLO ADMINISTRADOR) ===\n\n` +
                `DATOS CLAVE:\n` +
                summary.preparation_guide.key_figures.map(f => `- ${f.label}: ${f.value}`).join('\n') +
                `\n\nPREGUNTAS DIFÍCILES ANTICIPADAS:\n` +
                summary.preparation_guide.anticipated_questions.map(q => `P: ${q.question}\nR: ${q.answer}`).join('\n\n');

            fullText += prepText;
        }

        navigator.clipboard.writeText(fullText);
        toast.success("Copiado al portapapeles (incluye guía de preparación)");
    };


    const exportToPDF = async () => {
        if (!summary) return;
        setIsExporting(true);
        try {
            const element = document.getElementById("meeting-temario-content");
            if (!element) return;

            // 1. Prepare View for Capture
            const pdfHeader = document.getElementById("pdf-header");
            if (pdfHeader) pdfHeader.style.display = "flex";

            element.classList.add("pdf-export-container");
            const originalWidth = element.style.width;
            const originalPadding = element.style.padding;
            const originalMaxWidth = element.style.maxWidth;

            element.style.width = "1000px";
            element.style.maxWidth = "1000px";
            element.style.padding = "40px";

            // Use html2canvas to capture the element
            const canvas = await html2canvas(element, {
                scale: 3, // Increased from 2 for better sharpness
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false,
                windowWidth: 1000,
                onclone: (clonedDoc) => {
                    const el = clonedDoc.getElementById("meeting-temario-content");
                    const header = clonedDoc.getElementById("pdf-header");
                    if (el) el.style.backgroundColor = "#ffffff";
                    if (header) header.style.display = "flex";
                }
            });

            // 2. Restore View
            element.classList.remove("pdf-export-container");
            element.style.width = originalWidth;
            element.style.maxWidth = originalMaxWidth;
            element.style.padding = originalPadding;
            if (pdfHeader) pdfHeader.style.display = "none";

            // 3. Generate PDF with multi-page support
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            const pdfWidth = 210;
            const pdfHeight = 297;
            const margin = 10;
            const footerHeight = 15;
            const printWidth = pdfWidth - (margin * 2);
            const imgHeight = (canvas.height * printWidth) / canvas.width;

            let heightLeft = imgHeight;
            let printedHeight = 0;
            let pageNumber = 1;

            const drawFooter = (pageNo: number) => {
                const footerY = pdfHeight - 10;
                pdf.setDrawColor(220, 220, 220);
                pdf.line(margin, footerY - 5, pdfWidth - margin, footerY - 5);
                pdf.setFontSize(8);
                pdf.setTextColor(100);
                pdf.text("ExpensaCheck - Temario de Reunión", margin, footerY);
                pdf.text(`Generado el ${new Date().toLocaleDateString()}`, pdfWidth - margin, footerY, { align: "right" });
                pdf.text(`Pág ${pageNo}`, pdfWidth / 2, footerY, { align: "center" });
            };

            // First Page
            const startY = margin;
            const maxContentY = pdfHeight - margin - footerHeight;
            const firstPageCap = maxContentY - startY;

            pdf.addImage(imgData, "PNG", margin, startY, printWidth, imgHeight);

            // Mask for footer
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, maxContentY, pdfWidth, pdfHeight - maxContentY, "F");
            drawFooter(1);

            heightLeft -= firstPageCap;
            printedHeight += firstPageCap;

            // Subsequent Pages
            while (heightLeft > 0) {
                pageNumber++;
                pdf.addPage();

                const pageStartY = margin + 10;
                const pageMaxContentY = pdfHeight - margin - footerHeight;
                const availableHeight = pageMaxContentY - pageStartY;

                pdf.addImage(imgData, "PNG", margin, pageStartY - (printedHeight * (imgHeight / imgHeight)), printWidth, imgHeight);
                // Adjust position based on scale
                const adjustedPrintedHeight = (printedHeight * imgHeight) / imgHeight; // Simplification, testing shows this works better

                pdf.addImage(imgData, "PNG", margin, pageStartY - printedHeight, printWidth, imgHeight);

                // Mask top and bottom
                pdf.setFillColor(255, 255, 255);
                pdf.rect(0, 0, pdfWidth, pageStartY, "F");
                pdf.rect(0, pageMaxContentY, pdfWidth, pdfHeight - pageMaxContentY, "F");

                drawFooter(pageNumber);
                heightLeft -= availableHeight;
                printedHeight += availableHeight;
            }

            pdf.save(`Temario_${selectedBuilding}_${new Date().toLocaleDateString("es-AR")}.pdf`);
            toast.success("Temario exportado como PDF");
        } catch (error) {
            console.error("Error exporting PDF:", error);
            toast.error("Error al generar el PDF");
        } finally {
            setIsExporting(false);
        }
    };

    if (loading && analyses.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-soft">
                <Header />
                <main className="pt-32 pb-20 container max-w-4xl">
                    <Skeleton className="h-10 w-64 mb-8" />
                    <Skeleton className="h-64 w-full" />
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-background">
            {/* Background Decor */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-secondary/5 blur-[120px] rounded-full"></div>
            </div>

            <Header />

            <main className="pt-32 pb-32">
                <div className="container max-w-4xl relative z-10">
                    <div className="flex items-center gap-5 mb-12">
                        <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                            <Users className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight">Preparar Reunión</h1>
                            <p className="text-muted-foreground font-medium mt-1">
                                Generá un temario inteligente para tu próxima reunión de consorcio.
                            </p>
                        </div>
                    </div>

                    {!summary ? (
                        <div className="grid gap-8">
                            {/* Step 1: Select Building */}
                            <Card className="rounded-[2.5rem] border-border/50 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden animate-fade-in-up">
                                <CardHeader className="p-8 md:p-10 border-b border-border/50 bg-primary/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                                        <div>
                                            <CardTitle className="text-xl">Seleccioná el Edificio</CardTitle>
                                            <CardDescription>Elegí el consorcio para el cual querés preparar la reunión</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 md:p-10">
                                    <Select value={selectedBuilding} onValueChange={(val) => {
                                        setSelectedBuilding(val);
                                        setSelectedAnalyses([]);
                                    }}>
                                        <SelectTrigger className="h-14 bg-background/50 border-border/50 rounded-2xl text-lg group focus:ring-primary/20 transition-all">
                                            <div className="flex items-center gap-3">
                                                <Building className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                                                <SelectValue placeholder="Seleccionar consorcio..." />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-border/50">
                                            {buildings.map(b => (
                                                <SelectItem key={b} value={b as string} className="py-3 focus:bg-primary/5">{b}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                            </Card>

                            {/* Step 2: Select Periods */}
                            {selectedBuilding && (
                                <Card className="rounded-[2.5rem] border-border/50 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden animate-fade-in-up">
                                    <CardHeader className="p-8 md:p-10 border-b border-border/50 bg-secondary/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center font-bold">2</div>
                                            <div>
                                                <CardTitle className="text-xl">Seleccioná los Períodos</CardTitle>
                                                <CardDescription>Marcá las expensas que se van a tratar en la reunión</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8 md:p-10">
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            {buildingAnalyses.map((analysis) => (
                                                <div
                                                    key={analysis.id}
                                                    onClick={() => toggleAnalysis(analysis.id)}
                                                    className={cn(
                                                        "flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer group",
                                                        selectedAnalyses.includes(analysis.id)
                                                            ? "bg-primary/10 border-primary/40 shadow-lg shadow-primary/5"
                                                            : "bg-background/50 border-border/50 hover:border-primary/30"
                                                    )}
                                                >
                                                    <Checkbox
                                                        checked={selectedAnalyses.includes(analysis.id)}
                                                        onCheckedChange={() => toggleAnalysis(analysis.id)}
                                                        className="w-5 h-5 rounded-lg border-2"
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-base truncate">{analysis.period}</p>
                                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">
                                                            {analysis.unit ? `UF: ${analysis.unit}` : "General"}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Load More Periods */}
                                        {hasNextPage && (
                                            <div className="mt-8 text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={fetchNextPage}
                                                    disabled={isFetchingNextPage}
                                                    className="rounded-full px-8 text-muted-foreground hover:text-primary hover:bg-primary/5 font-bold"
                                                >
                                                    {isFetchingNextPage ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            Cargando más períodos...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus className="w-4 h-4 mr-2" />
                                                            Cargar más períodos
                                                        </>
                                                    )}
                                                </Button>
                                                <p className="text-[10px] text-muted-foreground mt-2 italic">
                                                    Si no encontrás el período que buscás, podés cargar análisis anteriores.
                                                </p>
                                            </div>
                                        )}

                                        <Button
                                            onClick={handleGenerate}
                                            disabled={isGenerating || selectedAnalyses.length === 0}
                                            variant="hero"
                                            size="xl"
                                            className="w-full mt-10 rounded-2xl h-16 text-lg font-black shadow-xl shadow-primary/20"
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <Loader2 className="w-6 h-6 animate-spin mr-3" />
                                                    Procesando con IA...
                                                </>
                                            ) : (
                                                <>
                                                    Generar Temario Inteligente
                                                    <ClipboardList className="w-6 h-6 ml-3" />
                                                </>
                                            )}
                                        </Button>

                                        {!isFreeUser && (
                                            <p className="text-center text-xs text-muted-foreground mt-4 font-medium flex items-center justify-center gap-1.5 opacity-70">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                Límite: 3 temarios estratégicos por día.
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    ) : (
                        <div id="meeting-temario-content" className="space-y-8 animate-fade-in print:p-0">
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
                                    <p>{selectedBuilding}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                                        {new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 print:hidden">
                                <div>
                                    <h2 className="text-3xl font-black text-foreground">{summary.title}</h2>
                                    <p className="text-muted-foreground font-medium mt-1">
                                        Seleccioná los puntos que querés mantener en el temario final.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button variant="outline" onClick={() => setSummary(null)} className="rounded-full px-6 font-bold h-12">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Reiniciar
                                    </Button>
                                    <Button onClick={handleCopy} className="rounded-full px-6 bg-primary text-white font-bold h-12 shadow-lg shadow-primary/20">
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copiar
                                    </Button>
                                </div>
                            </div>

                            {/* PREPARATION GUIDE SECTION - NEW ASSET */}
                            {summary.preparation_guide && (
                                <div className="grid md:grid-cols-3 gap-6 animate-fade-in-up delay-100 pdf-section">
                                    <Card className="md:col-span-2 rounded-[2.5rem] border-primary/20 bg-primary/5 backdrop-blur-xl overflow-hidden pdf-card">
                                        <CardHeader className="p-8 border-b border-primary/10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                                                    <Brain className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-xl font-bold">Guía de Preparación</CardTitle>
                                                    <CardDescription>Preguntas anticipadas y argumentos clave para el administrador</CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="divide-y divide-primary/10">
                                                {summary.preparation_guide.anticipated_questions.map((q, idx) => (
                                                    <div key={idx} className="p-6 hover:bg-primary/10 transition-colors">
                                                        <div className="flex items-start gap-4">
                                                            <div className="mt-1 w-6 h-6 rounded-full bg-secondary/20 text-secondary flex items-center justify-center flex-shrink-0">
                                                                <HelpCircle className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-foreground mb-2">{q.question}</p>
                                                                <p className="text-sm text-muted-foreground leading-relaxed italic">
                                                                    <span className="text-primary font-bold not-italic mr-1">R:</span>
                                                                    {q.answer}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="rounded-[2.5rem] border-secondary/20 bg-secondary/5 backdrop-blur-xl overflow-hidden h-fit pdf-card">
                                        <CardHeader className="p-8 border-b border-secondary/10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center shadow-lg shadow-secondary/20">
                                                    <Zap className="w-5 h-5" />
                                                </div>
                                                <CardTitle className="text-lg font-bold">Datos en Mano</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-8 space-y-6">
                                            {summary.preparation_guide.key_figures.map((figure, idx) => (
                                                <div key={idx} className="flex flex-col">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{figure.label}</span>
                                                    <span className="text-xl font-black text-secondary">{figure.value}</span>
                                                </div>
                                            ))}
                                            <div className="pt-4 border-t border-secondary/10">
                                                <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 leading-tight">
                                                    <Info className="w-3 h-3 flex-shrink-0" />
                                                    Estos datos te sirven como respaldo y guía informativa durante la asamblea.
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            <div className="mb-8 pdf-section">
                                <Card className="rounded-[2rem] border-primary/20 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden pdf-card">
                                    <CardHeader className="p-6 border-b border-border/50 bg-primary/5">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <LayoutList className="w-5 h-5 text-primary" />
                                                Temario Sugerido para Reunión
                                            </CardTitle>
                                            <Badge variant="outline" className="text-[10px] uppercase font-bold">
                                                Generado por IA
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-border/50">
                                            {summary.items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className={cn(
                                                        "flex transition-colors",
                                                        activeItems.has(item.id)
                                                            ? "bg-card/40 hover:bg-card/60 pdf-item-active"
                                                            : "bg-muted/5 opacity-60 hover:opacity-80 item-inactive pdf-item-hidden"
                                                    )}
                                                >
                                                    {/* Checkbox Column */}
                                                    <div
                                                        className="w-14 flex items-center justify-center border-r border-border/30 cursor-pointer pdf-hide-column"
                                                        onClick={() => toggleItem(item.id)}
                                                    >
                                                        <Checkbox
                                                            checked={activeItems.has(item.id)}
                                                            onCheckedChange={() => toggleItem(item.id)}
                                                            className="w-5 h-5 rounded-md border-2"
                                                        />
                                                    </div>

                                                    {/* Content Column */}
                                                    <div className="flex-1 p-6">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <Badge className={cn(
                                                                "rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest",
                                                                item.importance === 'high' ? "bg-status-attention text-white" :
                                                                    item.importance === 'medium' ? "bg-primary/20 text-primary border-primary/30" :
                                                                        "bg-muted text-muted-foreground"
                                                            )}>
                                                                {item.importance === 'high' ? 'Crítico' : item.importance === 'medium' ? 'Importante' : 'Rutinario'}
                                                            </Badge>
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.category}</span>
                                                        </div>

                                                        <h4 className="font-bold mb-1 text-lg">{item.title}</h4>
                                                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{item.description}</p>

                                                        {(item.problem || item.proposed_solution) && (
                                                            <div className="grid gap-2 sm:grid-cols-2 mt-3 pt-3 border-t border-border/40">
                                                                {item.problem && (
                                                                    <div className="bg-destructive/5 rounded-lg p-2.5 border border-destructive/10">
                                                                        <p className="text-[10px] font-bold text-destructive uppercase mb-1 flex items-center gap-1.5">
                                                                            <AlertCircle className="w-3 h-3" />
                                                                            Problema
                                                                        </p>
                                                                        <p className="text-xs text-foreground/80 font-medium">{item.problem}</p>
                                                                    </div>
                                                                )}
                                                                {item.proposed_solution && (
                                                                    <div className="bg-primary/5 rounded-lg p-2.5 border border-primary/10">
                                                                        <p className="text-[10px] font-bold text-primary uppercase mb-1 flex items-center gap-1.5">
                                                                            <CheckCircle2 className="w-3 h-3" />
                                                                            Solución
                                                                        </p>
                                                                        <p className="text-xs text-foreground/80 font-medium">{item.proposed_solution}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-primary/70 uppercase">
                                                            <ArrowRight className="w-3 h-3" />
                                                            Fuente: {item.source}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* LEGAL DISCLAIMER */}
                                <div className="mt-8 p-6 bg-muted/30 rounded-[1.5rem] border border-border/50">
                                    <p className="text-[11px] text-muted-foreground leading-relaxed text-center">
                                        <strong className="text-foreground font-bold">Aviso importante:</strong> Este contenido ha sido generado automáticamente por Inteligencia Artificial y debe ser utilizado únicamente como guía informativa.
                                        ExpensaCheck no es una entidad de auditoría matriculada ni ofrece asesoramiento legal o contable.
                                        Se recomienda validar toda la información con la liquidación original y consultar con profesionales idóneos.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-16 flex flex-col items-center gap-6 print:hidden">
                                <Button
                                    variant="hero"
                                    onClick={exportToPDF}
                                    disabled={isExporting}
                                    size="xl"
                                    className="w-full sm:w-auto min-w-[300px] rounded-3xl h-20 text-xl font-black shadow-2xl shadow-primary/30 group relative overflow-hidden transition-all hover:scale-[1.02]"
                                >
                                    {isExporting ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin mr-3" />
                                            Generando Documento...
                                        </>
                                    ) : (
                                        <>
                                            Finalizar y Descargar PDF
                                            <Download className="w-6 h-6 ml-3 group-hover:translate-y-1 transition-transform" />
                                        </>
                                    )}
                                </Button>

                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="ghost"
                                        onClick={handleCopy}
                                        className="rounded-full px-8 h-12 font-bold text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <Copy className="w-5 h-5 mr-2" />
                                        Copiar Texto del Temario
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main >
        </div >
    );
};

export default PrepararReunion;
