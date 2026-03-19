import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    PiggyBank,
    TrendingDown,
    ChevronRight,
    Building,
    ShieldCheck,
    Users,
    Wrench,
    Zap,
    Droplets,
    ArrowRight,
    Info,
    Sparkles,
    AlertCircle,
    Loader2,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Opportunity {
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
        inNeighborhood?: boolean;
    }[];
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const iconMap: Record<string, any> = {
    personal: Users,
    mantenimiento: Wrench,
    gas: Zap,
    electricidad: Zap,
    agua: Droplets,
    administracion: Building,
    seguros: ShieldCheck,
    otros: Sparkles,
};

const AhorroPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [analysis, setAnalysis] = useState<any>(null);

    useEffect(() => {
        const fetchOpportunities = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    navigate("/auth");
                    return;
                }

                if (!id) {
                    setIsLoading(false);
                    return;
                }

                setIsLoading(true);
                setAnalysis(null);
                setOpportunities([]);

                // Call Edge Function
                const { data: response, error: functionError } = await supabase.functions.invoke(
                    "get-savings-opportunities",
                    {
                        body: { analysisId: id }
                    }
                );

                if (functionError) throw functionError;

                // Fetch analysis metadata (now with savings flag)
                const { data: analysisData, error: analysisError } = await supabase
                    .from("expense_analyses")
                    .select("*, building_profiles(*)")
                    .eq("id", id)
                    .single();

                if (analysisError) throw analysisError;
                setAnalysis(analysisData);
                setOpportunities(response.data || []);
            } catch (error: any) {
                console.error("Error loading savings opportunities:", error);
                const message = error.message || "No pudimos cargar las oportunidades de ahorro en este momento.";
                toast.error(message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOpportunities();
    }, [id]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-soft pt-32 pb-20">
                <div className="container max-w-4xl">
                    <Skeleton className="h-12 w-48 mb-8" />
                    <Skeleton className="h-40 w-full mb-8 rounded-[2.5rem]" />
                    <div className="space-y-4">
                        <Skeleton className="h-32 w-full rounded-2xl" />
                        <Skeleton className="h-32 w-full rounded-2xl" />
                        <Skeleton className="h-32 w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    const totalPotentialSavings = opportunities.reduce((sum, opp) => sum + opp.potentialSavings, 0);

    return (
        <div className="min-h-screen bg-gradient-soft pb-20">
            <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
                <div className="container flex items-center justify-between h-20">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold">Módulo de Ahorro</h1>
                            {analysis && (
                                <p className="text-xs text-muted-foreground font-medium">
                                    {analysis.building_name} • {analysis.period}
                                </p>
                            )}
                        </div>
                    </div>
                    {analysis && (
                        <Badge variant="outline" className="hidden sm:flex bg-primary/5 text-primary border-primary/20 font-bold">
                            {analysis.period}
                        </Badge>
                    )}
                </div>
            </header>

            <main className="pt-32">
                <div className="container max-w-4xl">
                    {/* Hero Section */}
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-emerald-500 text-white p-8 md:p-12 mb-12 shadow-2xl shadow-emerald-500/20">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30 shadow-inner">
                                <PiggyBank className="w-10 h-10 md:w-12 md:h-12 text-white" />
                            </div>
                            <div className="text-center md:text-left">
                                <h2 className="text-2xl md:text-4xl font-black mb-2 tracking-tight">
                                    Podés ahorrar hasta {formatCurrency(totalPotentialSavings)} por mes
                                </h2>
                                <p className="text-emerald-50/90 text-lg font-medium">
                                    {opportunities.length > 0
                                        ? `Analizamos la expensa de ${analysis?.period} y cruzamos los datos con otros consorcios. Detectamos ${opportunities.length} proveedores con sobreprecios significativos.`
                                        : analysis ? `Analizamos tu consorcio y por ahora estás pagando valores competitivos en tu zona.` : "Analizamos tus gastos y por ahora estás pagando valores competitivos."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {!opportunities.length ? (
                        <Card className="border-dashed border-2 bg-muted/30">
                            <CardContent className="p-12 text-center">
                                <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                                <h3 className="text-xl font-bold mb-2">
                                    {analysis ? "¡Buen trabajo!" : "Analizá tu primera expensa"}
                                </h3>
                                <p className="text-muted-foreground mb-6">
                                    {analysis
                                        ? `No encontramos oportunidades de ahorro inmediatas. Tus proveedores actuales están dentro de los rangos competitivos de tu zona (${analysis?.building_profiles?.zone || 'Nuestra base de datos'}).`
                                        : "Necesitamos analizar al menos una expensa para poder comparar tus proveedores con los precios del mercado."
                                    }
                                </p>
                                <Button asChild>
                                    <Link to={analysis ? `/analisis/${analysis.id}` : "/analizar"}>
                                        {analysis ? "Volver al análisis" : "Empezar análisis"}
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <TrendingDown className="w-5 h-5 text-status-ok" />
                                    Oportunidades encontradas
                                </h3>
                                <Badge variant="outline" className="font-bold">
                                    Zona: {analysis?.building_profiles?.zone || 'Desconocida'}
                                </Badge>
                            </div>

                            {opportunities.map((opp, idx) => {
                                const Icon = iconMap[opp.category.toLowerCase()] || iconMap[opp.subcategory.toLowerCase()] || Sparkles;

                                return (
                                    <Card key={idx} className="relative overflow-hidden border-emerald-500/20 bg-emerald-500/5 hover:shadow-xl transition-all duration-300 group">
                                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                                        <CardContent className="p-0 relative z-10">
                                            <div className="flex flex-col md:flex-row">
                                                {/* Left Column: Saving Info */}
                                                <div className="p-6 md:w-2/5 border-b md:border-b-0 md:border-r border-emerald-500/20 flex flex-col justify-center">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div>
                                                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 mb-2">
                                                                Sobreprecio Detectado
                                                            </Badge>
                                                            <h4 className="text-lg font-bold text-foreground leading-tight">
                                                                {opp.currentProvider || opp.subcategory}
                                                            </h4>
                                                            <p className="text-xs font-bold text-muted-foreground uppercase mt-0.5">{opp.category}</p>
                                                        </div>
                                                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0 ml-2">
                                                            <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-end gap-2 mb-4">
                                                        <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                                                            {formatCurrency(opp.potentialSavings)}
                                                        </span>
                                                        <span className="text-sm text-muted-foreground font-medium mb-1">
                                                            de ahorro
                                                        </span>
                                                    </div>

                                                    <div className="space-y-2 pt-4 border-t border-emerald-500/10 text-sm">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-muted-foreground">Estás pagando:</span>
                                                            <span className="font-bold line-through opacity-70 text-foreground">{formatCurrency(opp.currentAmount)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-muted-foreground">Promedio en tu zona:</span>
                                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(opp.marketAverage)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Column: Alternatives */}
                                                <div className="p-6 flex-1 flex flex-col justify-center bg-card/60">
                                                    <h4 className="text-sm font-bold mb-4 flex items-center gap-2 text-foreground">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                        Tenemos alternativas relevadas más baratas:
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {opp.alternatives.length > 0 ? (
                                                            opp.alternatives.map((alt, aIdx) => (
                                                                <div key={aIdx} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50 hover:bg-muted/50 transition-colors">
                                                                    <div className="flex flex-col">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="text-sm font-bold text-foreground">{alt.name}</span>
                                                                            {alt.inNeighborhood && (
                                                                                <Badge variant="outline" className="h-4 p-0 px-1.5 text-[9px] border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                                                                                    Mismo barrio
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        <span className="text-xs text-muted-foreground mt-0.5">
                                                                            Promedio cobrado: {formatCurrency(alt.averageAmount)} ({alt.count} reportes)
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 shadow-none font-bold">
                                                                            Ahorro {formatCurrency(opp.currentAmount - alt.averageAmount)}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="text-center py-6 bg-muted/5 rounded-xl border border-dashed border-border/30">
                                                                <p className="text-xs text-muted-foreground font-medium">
                                                                    Buscando proveedores específicos en tu zona...
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {/* Tips Section */}
                    <div className="mt-12 p-8 rounded-[2rem] bg-amber-500/5 border border-amber-500/20">
                        <h4 className="flex items-center gap-2 font-black text-amber-700 mb-4">
                            <Info className="w-5 h-5" />
                            ¿Sabías que?
                        </h4>
                        <p className="text-sm text-amber-800/80 leading-relaxed font-medium">
                            Los porcentajes de ahorro se calculan comparando tus facturas con las de edificios de similares características (unidad, zona y antigüedad). Estos datos son 100% colaborativos y anonimizados de la comunidad ExpensaCheck.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AhorroPage;
