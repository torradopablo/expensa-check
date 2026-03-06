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
    Loader2
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
            if (!id) return;

            setIsLoading(true);
            setAnalysis(null);
            setOpportunities([]);

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    navigate("/auth");
                    return;
                }

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
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-primary text-primary-foreground p-8 md:p-12 mb-12 shadow-2xl shadow-primary/20">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30 shadow-inner">
                                <PiggyBank className="w-10 h-10 md:w-12 md:h-12 text-white" />
                            </div>
                            <div className="text-center md:text-left">
                                <h2 className="text-2xl md:text-4xl font-black mb-2 tracking-tight">
                                    Tenes una oportunidad de ahorro de {formatCurrency(totalPotentialSavings)}
                                </h2>
                                <p className="text-primary-foreground/80 text-lg font-medium">
                                    {opportunities.length > 0
                                        ? `Analizamos ${analysis?.building_name} (${analysis?.period}) y detectamos ${opportunities.length} rubros para optimizar.`
                                        : analysis ? `Analizamos ${analysis.building_name} (${analysis.period}) y estás en línea con los precios de mercado.` : "Analizamos tus gastos y por ahora estás en línea con los precios de mercado."}
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
                                    <Card key={idx} className="overflow-hidden border-border/50 hover:shadow-xl transition-all duration-300 group">
                                        <CardContent className="p-0">
                                            <div className="flex flex-col md:flex-row">
                                                {/* Category Info */}
                                                <div className="p-6 md:w-1/3 bg-muted/20 border-b md:border-b-0 md:border-r border-border/50 flex flex-col justify-center">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                                            <Icon className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{opp.category}</p>
                                                            <p className="font-bold text-sm leading-tight">{opp.subcategory}</p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-xs font-medium">
                                                            <span className="text-muted-foreground">Pagás hoy:</span>
                                                            <span className="font-bold">{formatCurrency(opp.currentAmount)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-xs font-medium">
                                                            <span className="text-muted-foreground">Promedio mercado:</span>
                                                            <span className="text-status-ok font-bold">{formatCurrency(opp.marketAverage)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 pt-4 border-t border-border/50">
                                                        <div className="flex items-center gap-2 text-status-ok font-black text-lg">
                                                            <TrendingDown className="w-5 h-5" />
                                                            -{opp.potentialSavingsPercent.toFixed(0)}%
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground font-medium">Ahorro potencial estimado</p>
                                                    </div>
                                                </div>

                                                {/* Alternatives */}
                                                <div className="p-6 flex-1 flex flex-col justify-center bg-card">
                                                    <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-primary" />
                                                        Alternativas relevadas en tu zona
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {opp.alternatives.length > 0 ? (
                                                            opp.alternatives.map((alt, aIdx) => (
                                                                <div key={aIdx} className="flex items-center justify-between p-3 rounded-xl bg-muted/10 border border-border/30 hover:bg-muted/20 transition-colors">
                                                                    <div className="flex flex-col">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="text-sm font-black">{alt.name}</span>
                                                                            {alt.inNeighborhood && (
                                                                                <Badge variant="outline" className="h-4 p-0 px-1 text-[8px] border-primary/20 bg-primary/5 text-primary">
                                                                                    Mismo barrio
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        <span className="text-[10px] text-muted-foreground font-bold">
                                                                            Promedio: {formatCurrency(alt.averageAmount)} ({alt.count} reportes)
                                                                        </span>
                                                                    </div>
                                                                    <Badge variant="secondary" className="bg-status-ok/10 text-status-ok border-status-ok/20">
                                                                        Ahorro: {formatCurrency(opp.currentAmount - alt.averageAmount)}
                                                                    </Badge>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="text-center py-6 bg-muted/5 rounded-xl border border-dashed border-border/30">
                                                                <p className="text-xs text-muted-foreground font-medium">
                                                                    Buscando proveedores específicos...
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
