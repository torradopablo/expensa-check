import { useEffect, useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle2,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  Building,
  Wrench,
  Droplets,
  Zap,
  Users,
  Shield,
  LogOut,
  Share2,
  MessageCircle,
  Mail,
  History,
  Link2,
  Copy,
  Check,
  Loader2,
  Globe,
  User,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  CreditCard,
  Sparkles,
  Flame,
  Briefcase,
  ShieldCheck,
  PiggyBank,
  ArrowUpDown,
  ArrowRight,
  Eye,
  Leaf,
  Hammer,
  Wifi,
  Package,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatPeriod, periodToYearMonth } from "@/services/formatters/date";
import { AnomalyAlerts } from "@/components/AnomalyAlerts";
import { HistoricalEvolutionChart } from "@/components/HistoricalEvolutionChart";
import { EvolutionComparisonChart } from "@/components/EvolutionComparisonChart";
import { ComparisonChart } from "@/components/ComparisonChart";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';

// Icon map: includes both new Spanish keys (vocabulary-controlled) and legacy English keys
// for backward compatibility with already-stored analyses.
const iconMap: Record<string, any> = {
  // ─── New vocabulary-controlled keys (Spanish) ───
  personal: Users,
  mantenimiento: Wrench,
  gas: Flame,
  electricidad: Zap,
  agua: Droplets,
  administracion: Briefcase,
  seguros: ShieldCheck,
  fondo_reserva: PiggyBank,
  ascensores: ArrowUpDown,
  seguridad: Eye,
  jardineria: Leaf,
  obras: Hammer,
  comunicaciones: Wifi,
  otros: Package,
  // ─── Legacy English keys (keep for stored data) ───
  users: Users,
  zap: Zap,
  droplets: Droplets,
  wrench: Wrench,
  shield: Shield,
  building: Building,
};

import { Logo } from "@/components/layout/ui/logo";

const Header = ({ id }: { id?: string }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-20">
        <Link to="/" className="flex items-center gap-2 group">
          <Logo className="w-10 h-10 group-hover:rotate-12 transition-transform duration-500" />
          <span className="text-2xl font-bold tracking-tight">ExpensaCheck</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="hidden sm:flex">
            <Link to="/historial">
              <History className="w-4 h-4 mr-2" />
              Ver historial
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="hidden sm:flex">
            <Link to={id ? `/ahorro/${id}` : "/ahorro"}>
              <PiggyBank className="w-4 h-4 mr-2" />
              Ahorro
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="sm:hidden">
            <Link to={id ? `/ahorro/${id}` : "/ahorro"}>
              <PiggyBank className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="sm:hidden">
            <Link to="/historial">
              <History className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/analizar">
              <span className="hidden sm:inline">Analizar otra expensa</span>
              <span className="sm:hidden">Analizar</span>
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" title="Mi Perfil">
            <Link to="/perfil">
              <User className="w-4 h-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Cerrar sesión">
            <LogOut className="w-4 h-4" />
          </Button>
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

const calculateChange = (current: number, previous: number | null) => {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

interface Category {
  id: string;
  name: string;
  icon: string;
  current_amount: number;
  previous_amount: number | null;
  status: string;
  explanation: string | null;
  expense_subcategories?: {
    id: string;
    name: string;
    amount: number;
    percentage: number | null;
    expense_type: "ordinaria" | "extraordinaria" | "fondo_reserva"
  }[];
}

interface Analysis {
  id: string;
  user_id: string;
  building_name: string | null;
  period: string;
  unit: string | null;
  total_amount: number;
  previous_total: number | null;
  status: string;
  created_at: string;
  scanned_at: string | null;
  notes: string | null;
  has_savings_opportunities?: boolean | null;
  building_profiles?: any;
}

interface HistoricalDataPoint {
  id: string;
  period: string;
  total_amount: number;
  period_date: string | null;
  expense_categories?: { name: string; current_amount: number }[];
}

interface EvolutionDataPoint {
  period: string;
  userPercent: number;
  inflationPercent: number | null;
  inflationEstimated: boolean;
  buildingsPercent: number | null;
}

interface Deviation {
  fromInflation: number;
  fromBuildings: number;
  isSignificant: boolean;
}

interface BuildingsTrendStats {
  totalBuildings: number;
  totalAnalyses: number;
  averageIncrease: number;
  medianIncrease: number;
  periodsCount?: number;
  filtersApplied?: boolean;
  usedFallback?: boolean;
}

interface AnalysisComment {
  id: string;
  analysis_id: string;
  token: string | null;
  author_name: string;
  author_email: string | null;
  comment: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
  is_owner_comment: boolean;
  parent_comment_id: string | null;
  user_id: string | null;
}

const formatShortCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return `$${value}`;
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#06b6d4'];

const AnalysisPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [previousPeriodLabel, setPreviousPeriodLabel] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [evolutionData, setEvolutionData] = useState<EvolutionDataPoint[]>([]);
  const [deviation, setDeviation] = useState<Deviation | null>(null);
  const [buildingsTrendStats, setBuildingsTrendStats] = useState<BuildingsTrendStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [sharedLink, setSharedLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [comments, setComments] = useState<AnalysisComment[]>([]);
  const [newComment, setNewComment] = useState({ author_name: '', author_email: '', comment: '' });
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [ownerReply, setOwnerReply] = useState('');
  const [user, setUser] = useState<any>(null);
  const [sharedToken, setSharedToken] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [inflationDataRaw, setInflationDataRaw] = useState<any[]>([]);
  const [buildingsTrendRaw, setBuildingsTrendRaw] = useState<any[]>([]);
  const [isBuildingsTrendLoading, setIsBuildingsTrendLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [hasSavingsOpportunities, setHasSavingsOpportunities] = useState(false);

  useEffect(() => {
    const checkSavings = async () => {
      if (!id || hasSavingsOpportunities !== false) return; // Skip if already determined
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession) return;

        const { data: response } = await supabase.functions.invoke("get-savings-opportunities", {
          body: { analysisId: id }
        });
        if (response?.success && response?.data?.length > 0) {
          setHasSavingsOpportunities(true);
        }
      } catch (err) {
        console.error("Error checking savings:", err);
      }
    };
    if (id) checkSavings();
  }, [id, hasSavingsOpportunities]);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!id) return;

      setIsLoading(true);
      setAnalysis(null);
      setCategories([]);
      setHistoricalData([]);
      setEvolutionData([]);
      setDeviation(null);
      setBuildingsTrendStats(null);
      setComments([]);
      setSharedLink(null);
      setSharedToken(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      try {
        // Fetch analysis
        const { data: analysisData, error: analysisError } = await supabase
          .from("expense_analyses")
          .select("*")
          .eq("id", id)
          .single();

        if (analysisError) throw analysisError;
        setAnalysis(analysisData);

        // If high-level check was already done, sync state
        if (analysisData.has_savings_opportunities !== null) {
          setHasSavingsOpportunities(analysisData.has_savings_opportunities);
        }

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("expense_categories")
          .select("*, expense_subcategories(*)")
          .eq("analysis_id", id)
          .order("current_amount", { ascending: false });

        if (categoriesError) throw categoriesError;
        const rawCategories = (categoriesData || []) as unknown as Category[];
        setCategories(rawCategories);
        setPreviousPeriodLabel(null);

        // Check for existing shared link
        const { data: existingLink } = await supabase
          .from("shared_analysis_links")
          .select("token, is_active")
          .eq("analysis_id", id)
          .eq("is_active", true)
          .maybeSingle();

        if (existingLink) {
          setSharedLink(`${window.location.origin}/compartido/${existingLink.token}`);
          setSharedToken(existingLink.token); // Guardar el token para usar en comentarios
        }

        // Fetch comments for this analysis
        const { data: commentsData, error: commentsError } = await (supabase as any)
          .from("analysis_comments")
          .select("*")
          .eq("analysis_id", id)
          .order("created_at", { ascending: true });

        if (commentsError) {
          console.error("Error fetching comments:", commentsError);
        } else {
          setComments((commentsData || []) as AnalysisComment[]);
        }

        // Fetch historical data and evolution if building name exists
        if (analysisData?.building_name) {
          // Fetch historical analyses for this building
          const { data: historicalAnalyses } = await supabase
            .from("expense_analyses")
            .select("id, period, total_amount, period_date, expense_categories(name, current_amount)")
            .eq("user_id", session.user.id)
            .eq("building_name", analysisData.building_name)
            .eq("status", "completed")
            .order("period_date", { ascending: true, nullsFirst: false });

          if (historicalAnalyses && historicalAnalyses.length > 0) {
            // Limit historical analyses to 15 periods ending at the current analysis
            let slicedHistoricalAnalyses = historicalAnalyses || [];
            if (slicedHistoricalAnalyses.length > 0) {
              const currentIdx = slicedHistoricalAnalyses.findIndex((h) => h.id === analysisData.id);
              if (currentIdx !== -1) {
                const startIdx = Math.max(0, currentIdx - 14); // 15 periods total
                slicedHistoricalAnalyses = slicedHistoricalAnalyses.slice(startIdx, currentIdx + 1);
              } else {
                slicedHistoricalAnalyses = slicedHistoricalAnalyses.slice(-15);
              }
            }

            setHistoricalData(slicedHistoricalAnalyses as HistoricalDataPoint[]);

            // Extract unique categories across all historical periods
            const allCatNames = new Set<string>();
            slicedHistoricalAnalyses.forEach(h => {
              h.expense_categories?.forEach((c: any) => allCatNames.add(c.name));
            });
            setAvailableCategories(Array.from(allCatNames).sort());

            // Enrich previous-period data for older analyses (when previous_* fields are null)
            const globalCurrentIdx = historicalAnalyses.findIndex((h) => h.id === analysisData.id);
            const previousAnalysis = globalCurrentIdx > 0 ? historicalAnalyses[globalCurrentIdx - 1] : null;

            if (previousAnalysis) {
              setPreviousPeriodLabel(previousAnalysis.period);

              const needsPrevTotal = analysisData.previous_total === null;
              const needsPrevCategories = rawCategories.some((c) => c.previous_amount === null);

              if (needsPrevTotal || needsPrevCategories) {
                const { data: prevCats, error: prevCatsError } = await supabase
                  .from("expense_categories")
                  .select("name, current_amount")
                  .eq("analysis_id", previousAnalysis.id);

                if (prevCatsError) throw prevCatsError;

                const normalizeName = (name: string) => name.toLowerCase().trim();
                const prevMap = new Map<string, number>(
                  (prevCats || []).map((c) => [normalizeName(c.name), c.current_amount])
                );

                if (needsPrevCategories) {
                  const enriched = rawCategories.map((c) => ({
                    ...c,
                    previous_amount:
                      c.previous_amount !== null
                        ? c.previous_amount
                        : (prevMap.get(normalizeName(c.name)) ?? null),
                  }));

                  setCategories(enriched);
                }

                if (needsPrevTotal) {
                  setAnalysis({ ...(analysisData as any), previous_total: previousAnalysis.total_amount });
                }
              }
            }

            // Fetch inflation data using the same method as Evolucion.tsx
            const inflationResponse = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-inflation`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                },
              }
            );

            let inflationData = null;
            if (inflationResponse.ok) {
              const result = await inflationResponse.json();
              if (result.data) {
                inflationData = result.data;
              }
            }

            // Store inflation data
            if (inflationData) {
              setInflationDataRaw(inflationData);
            }
          }
        }
      } catch (error: any) {
        console.error("Error fetching analysis:", error);
        toast.error("Error al cargar el análisis");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [id, navigate]);

  // Second effect: Fetch building trends when category or analysis changes
  useEffect(() => {
    const fetchBuildingTrends = async () => {
      if (!analysis?.building_name) return;

      setIsBuildingsTrendLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Fetch building profile for filtering
        const { data: profile } = await supabase
          .from("building_profiles")
          .select("unit_count_range, age_category, neighborhood, zone, has_amenities")
          .eq("building_name", analysis.building_name)
          .maybeSingle();

        const filters: Record<string, any> = {};
        if (profile) {
          if (profile.unit_count_range) filters.unit_count_range = profile.unit_count_range;
          if (profile.age_category) filters.age_category = profile.age_category;
          if (profile.neighborhood) filters.neighborhood = profile.neighborhood;
          if (profile.zone) filters.zone = profile.zone;
          if (profile.has_amenities !== null) filters.has_amenities = profile.has_amenities;
        }

        // Add category filter
        if (selectedCategory && selectedCategory !== "all") {
          filters.category = selectedCategory;
        }

        filters.excludeBuilding = analysis.building_name;
        filters.excludeUserId = session.user.id;

        // Use consistent fallback strategy across all sections
        const trendResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-buildings-trend`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              filters: Object.keys(filters).length > 0 ? filters : undefined,
              fallbackIfEmpty: true // Consistent with useEvolution hook
            }),
          }
        );

        if (trendResponse.ok) {
          const result = await trendResponse.json();
          setBuildingsTrendRaw(result.data || []);
          setBuildingsTrendStats(result.stats || null);
        }
      } catch (error) {
        console.error("Error fetching building trends:", error);
      } finally {
        setIsBuildingsTrendLoading(false);
      }
    };

    fetchBuildingTrends();
  }, [analysis?.building_name, selectedCategory]);

  // Third effect: Recalculate evolution data when anything changes
  useEffect(() => {
    if (historicalData.length < 2) return;

    const getAmount = (h: HistoricalDataPoint) => {
      if (selectedCategory === "all") return h.total_amount;
      const cat = h.expense_categories?.find(c => c.name === selectedCategory);
      return cat ? cat.current_amount : 0;
    };

    const baseAmount = getAmount(historicalData[0]);

    // Create inflation map
    const inflationMap = new Map<string, { value: number; is_estimated: boolean }>();
    if (inflationDataRaw) {
      inflationDataRaw.forEach(inf => {
        inflationMap.set(inf.period, { value: inf.value, is_estimated: inf.is_estimated });
      });
    }

    // Find base inflation value
    const firstPeriod = historicalData[0];
    const firstPeriodYYYYMM = periodToYearMonth(firstPeriod.period, firstPeriod.period_date);
    const baseInflation = firstPeriodYYYYMM ? (inflationMap.get(firstPeriodYYYYMM) ?? null) : null;

    // Find base buildings average
    const firstPeriodLabel = historicalData[0].period;
    const baseBuildingsItem = buildingsTrendRaw.find(b => b.period === firstPeriodLabel);
    const baseBuildingsAverage = baseBuildingsItem?.average ?? null;

    const evolution: EvolutionDataPoint[] = historicalData.map((h) => {
      const currentAmount = getAmount(h);
      const userPercent = baseAmount > 0 ? ((currentAmount - baseAmount) / baseAmount) * 100 : 0;

      let inflationPercent: number | null = null;
      let inflationEstimated = false;

      const periodYYYYMM = periodToYearMonth(h.period, h.period_date);
      if (periodYYYYMM && baseInflation !== null && baseInflation.value > 0) {
        const inflationItem = inflationMap.get(periodYYYYMM);
        if (inflationItem) {
          // Compound: ((current / base) - 1) * 100
          inflationPercent = parseFloat(((inflationItem.value / baseInflation.value - 1) * 100).toFixed(1));
          inflationEstimated = inflationItem.is_estimated;
        }
      }

      let buildingsPercent: number | null = null;
      if (baseBuildingsAverage !== null && baseBuildingsAverage > 0) {
        const buildingsItem = buildingsTrendRaw.find(b => b.period === h.period);
        if (buildingsItem) {
          buildingsPercent = parseFloat(((buildingsItem.average / baseBuildingsAverage - 1) * 100).toFixed(1));
        }
      }

      return {
        period: h.period,
        userPercent,
        inflationPercent,
        inflationEstimated,
        buildingsPercent
      };
    });

    setEvolutionData(evolution);

    // Calculate deviation for latest period
    const latestEvolution = evolution[evolution.length - 1];
    if (latestEvolution) {
      const fromInflation = latestEvolution.inflationPercent !== null && !isNaN(latestEvolution.inflationPercent)
        ? latestEvolution.userPercent - latestEvolution.inflationPercent
        : 0;
      const fromBuildings = latestEvolution.buildingsPercent !== null && !isNaN(latestEvolution.buildingsPercent)
        ? latestEvolution.userPercent - latestEvolution.buildingsPercent
        : 0;

      setDeviation({
        fromInflation,
        fromBuildings,
        isSignificant: Math.abs(fromInflation) > 10 || Math.abs(fromBuildings) > 10
      });
    }
  }, [selectedCategory, historicalData, inflationDataRaw, buildingsTrendRaw]);

  const extraordinaryExpenses = useMemo(() => {
    const subs = categories.flatMap(cat => cat.expense_subcategories || []);
    const extraordinary = subs.filter(sub => sub.expense_type === "extraordinaria");
    const totalExtraordinary = extraordinary.reduce((sum, sub) => sum + sub.amount, 0);
    const reserveFund = subs.filter(sub => sub.expense_type === "fondo_reserva");
    const totalReserveFund = reserveFund.reduce((sum, sub) => sum + sub.amount, 0);

    return {
      items: extraordinary,
      total: totalExtraordinary,
      reserveItems: reserveFund,
      reserveTotal: totalReserveFund,
      hasExtraordinary: extraordinary.length > 0 || reserveFund.length > 0
    };
  }, [categories]);

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 -z-10 bg-background">
          <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-primary/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-secondary/5 blur-[120px] rounded-full"></div>
        </div>

        <Header id={id} />
        <main className="pt-32 pb-20 relative z-10">
          <div className="container max-w-4xl">
            <Skeleton className="h-[400px] w-full mb-12 rounded-[2rem]" />
            <Skeleton className="h-48 w-full mb-8 rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Análisis no encontrado</h1>
          <Button asChild>
            <Link to="/analizar">Volver</Link>
          </Button>
        </div>
      </div>
    );
  }

  const totalChange = calculateChange(analysis.total_amount, analysis.previous_total);
  const attentionItems = categories.filter(c => c.status === "attention").length;

  const generateShareText = () => {
    const statusText = attentionItems > 0
      ? `⚠️ ${attentionItems} punto(s) a revisar`
      : "✅ Todo en orden";

    // Find categories with biggest changes
    const sortedByChange = [...categories]
      .filter(c => c.previous_amount)
      .map(c => ({
        name: c.name,
        change: calculateChange(c.current_amount, c.previous_amount) || 0,
        current: c.current_amount,
        previous: c.previous_amount!,
        status: c.status
      }))
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    const topChanges = sortedByChange.slice(0, 3);
    const difference = analysis.previous_total
      ? analysis.total_amount - analysis.previous_total
      : null;

    let detailText = "";
    if (topChanges.length > 0) {
      detailText = "\n📋 *Principales variaciones:*\n" + topChanges.map(c =>
        `• ${c.name}: ${c.change > 0 ? "+" : ""}${c.change.toFixed(1)}% (${formatCurrency(c.current)})`
      ).join("\n");
    }

    const attentionCategories = categories.filter(c => c.status === "attention");
    let attentionText = "";
    if (attentionCategories.length > 0) {
      attentionText = "\n\n🔍 *Puntos de atención:*\n" + attentionCategories.map(c =>
        `• ${c.name}`
      ).join("\n");
    }

    return `📊 *Análisis de Expensas - ExpensaCheck*

🏢 ${analysis.building_name || "Mi edificio"}
📅 Período: ${analysis.period}

💰 *Total: ${formatCurrency(analysis.total_amount)}*
${analysis.previous_total ? `📈 Mes anterior: ${formatCurrency(analysis.previous_total)}
💵 Diferencia: ${difference && difference > 0 ? "+" : ""}${difference ? formatCurrency(difference) : "-"} (${totalChange && totalChange > 0 ? "+" : ""}${totalChange?.toFixed(1) || 0}%)` : ""}

${statusText}
${detailText}${attentionText}

---
Analizá tu expensa en ExpensaCheck`;
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Análisis de Expensas - ${analysis.period}`);
    const body = encodeURIComponent(generateShareText().replace(/\*/g, ""));
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const generateShareableLink = async () => {
    if (!analysis || !id) return;

    setIsGeneratingLink(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Debes iniciar sesión para generar un enlace");
        return;
      }

      // Generate a unique token
      const token = crypto.randomUUID().replace(/-/g, '').substring(0, 32);

      const { error } = await supabase
        .from("shared_analysis_links")
        .insert({
          analysis_id: id,
          token: token,
          created_by: session.user.id,
          is_active: true
        });

      if (error) throw error;

      const link = `${window.location.origin}/compartido/${token}`;
      setSharedLink(link);

      // Copy to clipboard
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);

      toast.success("Enlace creado y copiado al portapapeles");
    } catch (error: any) {
      console.error("Error generating link:", error);
      toast.error("Error al generar el enlace");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copySharedLink = async () => {
    if (!sharedLink) return;
    await navigator.clipboard.writeText(sharedLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    toast.success("Enlace copiado al portapapeles");
  };

  // Function to submit owner reply
  const handleOwnerReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyingTo || !ownerReply.trim()) {
      setCommentError("Por favor escribe una respuesta");
      return;
    }

    setIsSubmittingComment(true);
    setCommentError(null);

    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setCommentError("No hay sesión activa");
        return;
      }

      // Si no hay token compartido, crear uno nuevo
      let tokenToUse = sharedToken;
      if (!tokenToUse) {
        const token = crypto.randomUUID().replace(/-/g, '').substring(0, 32);
        const { error: linkError } = await supabase
          .from("shared_analysis_links")
          .insert({
            analysis_id: id,
            token: token,
            created_by: user?.id,
            is_active: true
          });

        if (linkError) {
          throw new Error("No se pudo crear el enlace compartido");
        }

        tokenToUse = token;
        setSharedToken(token);
      }

      console.log('Enviando respuesta:', {
        token: tokenToUse,
        user_id: analysis?.user_id || user?.id,
        parent_comment_id: replyingTo,
        comment: ownerReply.trim()
      });

      const { data: responseData, error: invokeError } = await supabase.functions.invoke(
        'add-owner-comment',
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: {
            token: tokenToUse,
            user_id: analysis?.user_id || user?.id, // Usar el user_id del análisis
            parent_comment_id: replyingTo,
            comment: ownerReply.trim(),
          },
        }
      );

      if (invokeError) {
        throw new Error(invokeError.message || 'Error al enviar la respuesta');
      }

      // Add new reply to local state
      const newReplyData = (responseData as any).comment;
      setComments(prev => [...prev, newReplyData]);

      // Invalidate cache for this analysis to ensure share shows updated comments
      try {
        await supabase.functions.invoke('invalidate-share-cache', {
          body: { analysis_id: id }
        });
      } catch (cacheError) {
        console.log('Cache invalidation failed:', cacheError);
        // Don't fail the comment submission if cache invalidation fails
      }

      // Reset form
      setOwnerReply('');
      setReplyingTo(null);

      toast.success("Respuesta enviada correctamente");

    } catch (err: any) {
      console.error('Error submitting owner reply:', err);
      setCommentError(err.message || 'Error al enviar la respuesta');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Function to submit a new comment
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !newComment.comment.trim()) {
      setCommentError("Por favor escribe un comentario");
      return;
    }

    setIsSubmittingComment(true);
    setCommentError(null);

    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setCommentError("No hay sesión activa");
        return;
      }

      // Si no hay token compartido, crear uno nuevo
      let tokenToUse = sharedToken;
      if (!tokenToUse) {
        const token = crypto.randomUUID().replace(/-/g, '').substring(0, 32);
        const { error: linkError } = await supabase
          .from("shared_analysis_links")
          .insert({
            analysis_id: id,
            token: token,
            created_by: user?.id,
            is_active: true
          });

        if (linkError) {
          throw new Error("No se pudo crear el enlace compartido");
        }

        tokenToUse = token;
        setSharedToken(token);
      }

      console.log('Enviando comentario:', {
        token: tokenToUse,
        user_id: user?.id,
        analysis_id: id,
        comment: newComment.comment.trim()
      });

      const { data: responseData, error: invokeError } = await supabase.functions.invoke(
        'add-owner-comment',
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: {
            token: tokenToUse,
            user_id: analysis?.user_id || user?.id, // Usar el user_id del análisis
            comment: newComment.comment.trim(),
          },
        }
      );

      if (invokeError) {
        throw new Error(invokeError.message || 'Error al enviar el comentario');
      }

      // Add new comment to local state
      const newCommentData = (responseData as any).comment;
      setComments(prev => [...prev, newCommentData]);

      // Invalidate cache for this analysis to ensure share shows updated comments
      try {
        await supabase.functions.invoke('invalidate-share-cache', {
          body: { analysis_id: id }
        });
      } catch (cacheError) {
        console.log('Cache invalidation failed:', cacheError);
        // Don't fail the comment submission if cache invalidation fails
      }

      // Reset form
      setNewComment({ author_name: '', author_email: '', comment: '' });

      toast.success("Comentario enviado correctamente");

    } catch (err: any) {
      console.error('Error submitting comment:', err);
      setCommentError(err.message || 'Error al enviar el comentario');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-gradient-soft">
        <Header id={id} />
        <main className="pt-32 pb-20">
          <div className="container max-w-4xl">
            <div className="flex items-center justify-between mb-8">
              <Button variant="ghost" asChild>
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al inicio
                </Link>
              </Button>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartir
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {sharedLink ? (
                      <DropdownMenuItem onClick={copySharedLink} className="cursor-pointer">
                        {linkCopied ? (
                          <Check className="w-4 h-4 mr-2 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 mr-2 text-primary" />
                        )}
                        {linkCopied ? "¡Copiado!" : "Copiar enlace público"}
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={generateShareableLink} className="cursor-pointer" disabled={isGeneratingLink}>
                        {isGeneratingLink ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Link2 className="w-4 h-4 mr-2 text-primary" />
                        )}
                        Crear enlace público
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={shareViaWhatsApp} className="cursor-pointer">
                      <MessageCircle className="w-4 h-4 mr-2 text-green-600" />
                      WhatsApp
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={shareViaEmail} className="cursor-pointer">
                      <Mail className="w-4 h-4 mr-2 text-blue-600" />
                      Email
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Summary Card */}
            <Card variant="glass" className="mb-8 animate-fade-in-up">
              <CardContent className="p-6 md:p-8">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {analysis.building_name || "Edificio"}
                        </p>
                        <h1 className="text-2xl md:text-3xl font-bold">{analysis.period}</h1>
                        {analysis.unit && (
                          <p className="text-muted-foreground">{analysis.unit}</p>
                        )}
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant={attentionItems > 0 ? "attention" : "ok"} className="text-sm px-3 py-1 cursor-help transition-transform hover:scale-105">
                            {attentionItems > 0 ? (
                              <><AlertTriangle className="w-3.5 h-3.5 mr-1.5" />{attentionItems} puntos a revisar</>
                            ) : (
                              <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />Todo en orden</>
                            )}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          {attentionItems > 0 ? (
                            <p>Hay {attentionItems} categorías con aumentos mayores al promedio que vale la pena revisar.</p>
                          ) : (
                            <p>Todas las categorías tienen variaciones dentro de lo esperado.</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-muted-foreground text-sm max-w-lg">
                      {attentionItems > 0
                        ? "Tu expensa de este mes tiene algunos aumentos que merecen atención. A continuación te explicamos cada uno en detalle."
                        : "Tu expensa de este mes está dentro de los rangos normales. No detectamos aumentos inusuales."}
                    </p>
                  </div>
                  <div className="flex flex-col justify-center items-start md:items-end">
                    <p className="text-sm text-muted-foreground mb-1">Total del mes</p>
                    <p className="text-3xl md:text-4xl font-bold">
                      {formatCurrency(analysis.total_amount)}
                    </p>
                    {analysis.previous_total && (
                      <div className={`flex items-center gap-1 mt-2 text-sm ${totalChange > 0 ? "text-status-attention" : "text-status-ok"}`}>
                        {totalChange > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="font-medium">
                          {totalChange > 0 ? "+" : ""}{totalChange.toFixed(1)}% vs mes anterior
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Savings Opportunity Teaser */}
            {hasSavingsOpportunities && (
              <Card variant="glass" className="mb-8 animate-bounce-subtle border-status-ok/30 bg-status-ok/5 overflow-hidden group hover:shadow-xl hover:shadow-status-ok/10 transition-all duration-500 cursor-pointer" onClick={() => navigate(`/ahorro/${id}`)}>
                <CardContent className="p-0">
                  <div className="flex items-center gap-6 p-6">
                    <div className="w-14 h-14 rounded-2xl bg-status-ok/10 flex items-center justify-center flex-shrink-0 border border-status-ok/20 group-hover:scale-110 transition-transform duration-500">
                      <PiggyBank className="w-8 h-8 text-status-ok" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-status-ok mb-1 flex items-center gap-2">
                        Oportunidad de ahorro detectada
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-ok opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-status-ok"></span>
                        </span>
                      </h3>
                      <p className="text-sm text-muted-foreground font-medium">
                        Analizamos tus proveedores y encontramos opciones más económicas en tu zona.
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-status-ok group-hover:translate-x-2 transition-transform">
                      <ArrowRight className="w-6 h-6" />
                    </Button>
                  </div>
                  <div className="h-1 w-full bg-status-ok/10 overflow-hidden">
                    <div className="h-full bg-status-ok animate-shimmer" style={{ width: '100%', background: 'linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.4) 50%, transparent 100%)', backgroundSize: '200% 100%' }}></div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Summary */}
            <Card variant="soft" className="mb-8 animate-fade-in-up border-primary/20 bg-primary/5">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary mb-1">Resumen IA</p>
                  <p className="text-sm text-muted-foreground">
                    {attentionItems > 0
                      ? `Tu expensa de ${analysis.period} totaliza ${formatCurrency(analysis.total_amount)}${analysis.previous_total ? ` (${totalChange > 0 ? '+' : ''}${totalChange.toFixed(0)}% vs anterior)` : ''}. ${attentionItems} categoría${attentionItems > 1 ? 's merecen' : ' merece'} revisión por aumentos significativos.`
                      : `Tu expensa de ${analysis.period} totaliza ${formatCurrency(analysis.total_amount)}${analysis.previous_total ? ` (${totalChange > 0 ? '+' : ''}${totalChange.toFixed(0)}% vs anterior)` : ''}. Todos los rubros están dentro de parámetros normales.`}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Extraordinary Expenses Alert for Tenants */}
            {extraordinaryExpenses.hasExtraordinary && (
              <Card variant="soft" className="mb-8 animate-fade-in-up border-amber-500/30 bg-amber-500/5">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                      <ShieldAlert className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                        <h3 className="text-lg font-bold text-amber-600 flex flex-wrap items-center gap-2">
                          Atención Inquilinos
                          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                            Detección de Extraordinarias
                          </Badge>
                        </h3>
                        <span className="text-xl font-black text-amber-700">
                          {formatCurrency(extraordinaryExpenses.total + extraordinaryExpenses.reserveTotal)}
                        </span>
                      </div>
                      <p className="text-sm text-amber-800/80 mb-6 leading-relaxed">
                        Hemos detectado conceptos que suelen ser considerados <strong>Extraordinarios</strong> o <strong>Fondo de Reserva</strong>.
                        En Argentina, por ley, estos gastos no deberían ser abonados por el inquilino, sino por el propietario.
                      </p>

                      <div className="grid gap-2">
                        {[...extraordinaryExpenses.items, ...extraordinaryExpenses.reserveItems].map((item, i) => (
                          <div key={i} className="flex justify-between items-center text-xs py-2.5 px-4 bg-amber-500/10 rounded-xl border border-amber-500/10">
                            <span className="font-semibold text-amber-900">{item.name}</span>
                            <span className="font-bold text-amber-700">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Categories Breakdown */}
            {categories.length > 0 && (
              <div className="grid gap-4 mb-8">
                <h2 className="text-xl font-semibold">Detalle por categoría</h2>
                <div className="grid gap-4">
                  {categories.map((category, index) => {
                    const change = calculateChange(category.current_amount, category.previous_amount);
                    const Icon = iconMap[category.icon] || Building;

                    return (
                      <Card
                        key={category.id}
                        variant="default"
                        className="animate-fade-in-up overflow-hidden transition-all duration-300"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <CardContent className="p-0">
                          <div
                            className="flex flex-col md:flex-row cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => {
                              setExpandedCategories(prev => {
                                const next = new Set(prev);
                                if (next.has(category.id)) next.delete(category.id);
                                else next.add(category.id);
                                return next;
                              });
                            }}
                          >
                            <div className="flex-1 p-5 md:p-6">
                              <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${category.status === "attention" ? "bg-status-attention-bg" : category.status === "info" ? "bg-status-info-bg" : "bg-status-ok-bg"
                                  }`}>
                                  <Icon className={`w-6 h-6 ${category.status === "attention" ? "text-status-attention" : category.status === "info" ? "text-status-info" : "text-status-ok"
                                    }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold">{category.name}</h3>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge
                                          variant={category.status as any}
                                          className="cursor-help transition-transform hover:scale-105"
                                        >
                                          {category.status === "ok" ? "OK" : category.status === "info" ? "Info" : "Revisar"}
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-xs">
                                        {category.status === "ok" ? (
                                          <p>✅ Este gasto está dentro de los parámetros normales.</p>
                                        ) : category.status === "info" ? (
                                          <p>ℹ️ Información relevante sobre este gasto para tu conocimiento.</p>
                                        ) : (
                                          <p>⚠️ Este gasto tuvo un aumento significativo. Te recomendamos verificarlo con la administración.</p>
                                        )}
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {category.explanation || "Sin observaciones"}
                                  </p>
                                  {category.expense_subcategories && category.expense_subcategories.length > 0 && (
                                    <div className="flex items-center gap-1 mt-2 text-primary font-medium text-xs">
                                      {expandedCategories.has(category.id) ? (
                                        <>Ocultar detalle <ChevronUp className="w-3 h-3" /></>
                                      ) : (
                                        <>Ver detalle <ChevronDown className="w-3 h-3" /></>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex md:flex-col items-center justify-between md:justify-center gap-4 p-5 md:p-6 bg-muted/30 md:w-48 border-t md:border-t-0 md:border-l border-border">
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground mb-0.5">Este mes</p>
                                <p className="text-lg font-bold">{formatCurrency(category.current_amount)}</p>
                              </div>
                              {category.previous_amount && (
                                <div className={`flex items-center gap-1 text-sm font-medium ${change > 10 ? "text-status-attention" : change > 0 ? "text-muted-foreground" : "text-status-ok"
                                  }`}>
                                  {change > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                  {change > 0 ? "+" : ""}{change.toFixed(1)}%
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Subcategories Details */}
                          {expandedCategories.has(category.id) && category.expense_subcategories && category.expense_subcategories.length > 0 && (
                            <div className="p-6 md:p-8 bg-muted/20 border-t border-border/50 animate-fade-in">
                              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                Distribución de gastos
                              </h4>
                              <div className="grid md:grid-cols-2 gap-8 items-start">
                                {/* Chart */}
                                <div className="min-h-[350px] md:min-h-[400px] w-full flex flex-col justify-center bg-background/40 rounded-2xl p-4 border border-border/30">
                                  <ResponsiveContainer width="100%" height={350}>
                                    <PieChart>
                                      <defs>
                                        {COLORS.map((color, idx) => (
                                          <linearGradient key={`grad-${idx}`} id={`colorGrad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={color} stopOpacity={1} />
                                            <stop offset="100%" stopColor={color} stopOpacity={0.8} />
                                          </linearGradient>
                                        ))}
                                      </defs>
                                      <Pie
                                        data={category.expense_subcategories}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={3}
                                        dataKey="amount"
                                        nameKey="name"
                                        stroke="transparent"
                                        cornerRadius={6}
                                      >
                                        {category.expense_subcategories.map((entry, index) => (
                                          <Cell
                                            key={`cell-${index}`}
                                            fill={`url(#colorGrad-${index % COLORS.length})`}
                                            className="hover:opacity-90 transition-opacity cursor-pointer focus:outline-none"
                                            style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))' }}
                                          />
                                        ))}
                                      </Pie>
                                      <RechartsTooltip
                                        formatter={(value: number, name: string, props: any) => {
                                          const percent = props.payload.percentage ? ` (${props.payload.percentage}%)` : '';
                                          return [`${formatCurrency(value)}${percent}`, name];
                                        }}
                                        contentStyle={{
                                          borderRadius: '16px',
                                          border: '1px solid hsl(var(--border)/0.5)',
                                          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                                          padding: '16px',
                                          backgroundColor: 'hsl(var(--background)/0.95)',
                                          backdropFilter: 'blur(8px)'
                                        }}
                                        itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 700, paddingTop: '4px' }}
                                        labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}
                                        cursor={{ fill: 'transparent' }}
                                      />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>

                                {/* List */}
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
                                  {category.expense_subcategories.map((sub, idx) => (
                                    <div
                                      key={sub.id || idx}
                                      className="flex justify-between items-center p-4 rounded-xl bg-card border border-border/40 hover:border-primary/30 hover:shadow-md transition-all duration-300 group"
                                    >
                                      <div className="flex items-center gap-4">
                                        <div
                                          className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm transition-transform group-hover:scale-110"
                                          style={{
                                            background: `linear-gradient(to bottom, ${COLORS[idx % COLORS.length]}, ${COLORS[idx % COLORS.length]}dd)`,
                                            boxShadow: `0 0 10px ${COLORS[idx % COLORS.length]}40`
                                          }}
                                        />
                                        <div className="flex flex-col">
                                          <span className="text-sm font-semibold line-clamp-2 text-foreground/90 group-hover:text-foreground transition-colors">{sub.name}</span>
                                          {sub.expense_type && sub.expense_type !== "ordinaria" && (
                                            <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 px-2 py-0.5 rounded-full w-fit ${sub.expense_type === "extraordinaria"
                                              ? "bg-amber-100 text-amber-700 border border-amber-200"
                                              : "bg-blue-100 text-blue-700 border border-blue-200"
                                              }`}>
                                              {sub.expense_type === "extraordinaria" ? "Extraordinaria" : "Fondo Reserva"}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-right pl-4">
                                        <div className="font-bold text-sm">{formatCurrency(sub.amount)}</div>
                                        {sub.percentage && (
                                          <div className="text-xs text-muted-foreground font-bold bg-muted/50 inline-block px-2 py-0.5 rounded-md mt-1">{sub.percentage}%</div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Anomaly Alerts */}
            {categories.length > 0 && (
              <div className="mb-8">
                <AnomalyAlerts categories={categories} threshold={30} />
              </div>
            )}


            {/* Visual Comparison Chart - Bar chart comparing with previous period */}
            {categories.length > 0 && categories.some(c => c.previous_amount !== null) && (
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Análisis Comparativo</h3>
                    <p className="text-sm text-muted-foreground">Comparación detallada con el período anterior</p>
                  </div>
                </div>
                {hasSavingsOpportunities && (
                  <Button asChild variant="outline" size="sm" className="rounded-full border-status-ok/30 text-status-ok hover:bg-status-ok/10 transition-colors">
                    <Link to={`/ahorro/${id}`}>
                      <PiggyBank className="w-4 h-4 mr-2" />
                      Ver Ahorros del Período
                    </Link>
                  </Button>
                )}
              </div>
            )}

            {categories.length > 0 && categories.some(c => c.previous_amount !== null) && (
              <div className="mb-8">
                <ComparisonChart
                  data={categories
                    .filter(c => c.previous_amount !== null)
                    .map(c => ({
                      name: c.name,
                      leftAmount: c.previous_amount || 0,
                      rightAmount: c.current_amount,
                      diff: c.current_amount - (c.previous_amount || 0),
                      changePercent: c.previous_amount
                        ? ((c.current_amount - c.previous_amount) / c.previous_amount) * 100
                        : null,
                      leftSubcategories: [], // We don't have the previous subcategories easily here without a deep fetch
                      rightSubcategories: c.expense_subcategories || []
                    }))
                    .sort((a, b) => b.rightAmount - a.rightAmount)}
                  leftLabel={previousPeriodLabel ? previousPeriodLabel : "Mes anterior"}
                  rightLabel={analysis.period}
                />
              </div>
            )}

            {/* Evolution Section Filter */}
            {analysis.building_name && (
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Evolución y Tendencias</h3>
                    <p className="text-sm text-muted-foreground">Análisis histórico comparado con el mercado e inflación</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hasSavingsOpportunities && (
                    <Button asChild variant="outline" size="sm" className="rounded-full border-status-ok/30 text-status-ok hover:bg-status-ok/10 transition-colors hidden md:flex">
                      <Link to={`/ahorro/${id}`}>
                        <PiggyBank className="w-4 h-4 mr-2" />
                        Ahorro Detectado
                      </Link>
                    </Button>
                  )}
                  <div className="flex flex-col gap-1.5 min-w-[280px]">
                    <label htmlFor="category-filter" className="text-xs font-semibold text-muted-foreground px-1 uppercase tracking-wider">
                      Análisis específico por rubro
                    </label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger id="category-filter" className="bg-background/50 backdrop-blur-md border-border/50 h-11 rounded-xl focus:ring-primary/20 transition-all font-medium shadow-sm">
                        <SelectValue placeholder="Todos los rubros" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <SelectItem value="all" className="font-semibold text-primary">📊 Todos los rubros (Total)</SelectItem>
                        {availableCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Historical Evolution Chart - Absolute values */}
            {analysis.building_name && (
              <div className="mb-8 relative">
                {isBuildingsTrendLoading && (
                  <div className="absolute inset-0 z-10 bg-background/20 backdrop-blur-[1px] flex items-center justify-center rounded-[2rem]">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                )}
                <HistoricalEvolutionChart
                  buildingName={analysis.building_name}
                  currentAnalysisId={analysis.id}
                  currentPeriod={analysis.period}
                  category={selectedCategory}
                />
              </div>
            )}

            {/* Evolution Comparison Chart - Percentage with inflation and other buildings */}
            {evolutionData.length >= 2 && (
              <div className="mb-12 relative">
                {isBuildingsTrendLoading && (
                  <div className="absolute inset-0 z-10 bg-background/20 backdrop-blur-[1px] flex items-center justify-center rounded-[2rem]">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                )}
                <EvolutionComparisonChart
                  data={evolutionData}
                  buildingName={analysis.building_name || "Este edificio"}
                  deviation={deviation || undefined}
                  buildingsTrendStats={buildingsTrendStats}
                />
              </div>
            )}


            {/* Comments Section */}
            <Card className="mb-12 bg-card/40 backdrop-blur-xl border border-border/50 shadow-2xl rounded-[2rem] overflow-hidden animate-fade-in-up">
              <CardHeader className="p-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20">
                    <MessageSquare className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Comunidad y Consultas</CardTitle>
                    <p className="text-sm text-muted-foreground font-medium">
                      {comments.length} comentario{comments.length !== 1 ? 's' : ''} en este análisis
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                {/* Comment Form */}
                <form onSubmit={handleCommentSubmit} className="mb-10 p-8 bg-muted/20 backdrop-blur-md rounded-[1.5rem] border border-border/50 shadow-inner">
                  <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Agregá una nota o comentario
                  </h4>
                  <div className="grid gap-6">
                    <textarea
                      value={newComment.comment}
                      onChange={(e) => setNewComment(prev => ({ ...prev, comment: e.target.value }))}
                      className="w-full px-5 py-4 bg-background/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-foreground min-h-[120px] resize-none"
                      placeholder="Escribí aquí tus notas personales o comentarios compartidos..."
                      maxLength={500}
                      required
                    />
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                        {newComment.comment.length}/500 caracteres
                      </div>
                      <Button
                        type="submit"
                        disabled={isSubmittingComment}
                        variant="hero"
                        className="px-8 py-6 h-auto text-lg rounded-xl shadow-xl shadow-primary/20"
                      >
                        {isSubmittingComment ? "Enviando..." : "Publicar nota"}
                      </Button>
                    </div>
                    {commentError && (
                      <div className="text-sm font-bold text-status-attention bg-status-attention-bg/50 p-4 rounded-xl border border-status-attention/30">
                        {commentError}
                      </div>
                    )}
                  </div>
                </form>

                {/* Comments List */}
                {comments.length === 0 ? (
                  <div className="text-center py-12 bg-muted/10 rounded-[2rem] border border-dashed border-border/50">
                    <p className="text-muted-foreground font-medium">No hay notas ni comentarios aún.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {comments.filter(c => !c.parent_comment_id).map((comment) => (
                      <div key={comment.id} className="group animate-fade-in-up">
                        <div className={`p-6 rounded-[1.5rem] border transition-all hover:shadow-lg ${comment.is_owner_comment
                          ? 'bg-primary/5 border-primary/20'
                          : 'bg-card/20 border-border/50'
                          }`}>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${comment.is_owner_comment
                                ? 'bg-primary border-primary/20 text-white'
                                : 'bg-muted border-border/50'
                                }`}>
                                {comment.is_owner_comment ? (
                                  <Building className="w-6 h-6" />
                                ) : (
                                  <User className="w-6 h-6 text-foreground/70" />
                                )}
                              </div>
                              <div>
                                <p className="font-black text-base text-foreground">
                                  {comment.is_owner_comment ? 'Tú (Autor del Análisis)' : comment.author_name}
                                </p>
                                <p className="text-xs text-muted-foreground font-bold tracking-wider">{formatDate(comment.created_at)}</p>
                              </div>
                            </div>
                            {user && !comment.is_owner_comment && (
                              <button
                                onClick={() => setReplyingTo(comment.id)}
                                className="text-sm font-bold text-primary hover:underline transition-all"
                              >
                                Responder
                              </button>
                            )}
                          </div>
                          <p className="text-base leading-relaxed text-foreground font-medium">
                            {comment.comment}
                          </p>

                          {/* Owner Reply Form UI */}
                          {replyingTo === comment.id && (
                            <div className="mt-4 p-6 bg-muted/30 backdrop-blur-md rounded-[1.5rem] border border-primary/30 shadow-inner">
                              <form onSubmit={handleOwnerReply} className="space-y-4">
                                <textarea
                                  value={ownerReply}
                                  onChange={(e) => setOwnerReply(e.target.value)}
                                  className="w-full px-5 py-4 bg-background/50 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-foreground min-h-[100px] resize-none"
                                  placeholder="Escribe tu respuesta..."
                                  maxLength={1000}
                                  required
                                />
                                <div className="flex justify-between items-center">
                                  <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                    {ownerReply.length}/1000 caracteres
                                  </div>
                                  <div className="flex gap-3">
                                    <Button
                                      type="submit"
                                      disabled={isSubmittingComment}
                                      size="sm"
                                      className="h-10 px-6 rounded-lg"
                                    >
                                      Responder
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-10 px-6 rounded-lg"
                                      onClick={() => {
                                        setReplyingTo(null);
                                        setOwnerReply('');
                                      }}
                                    >
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              </form>
                            </div>
                          )}
                        </div>

                        {/* Replies */}
                        {comments.filter(c => c.parent_comment_id === comment.id).map((reply) => (
                          <div key={reply.id} className="ml-12 mt-4 p-5 bg-primary/5 rounded-[1.25rem] border border-primary/20 shadow-sm animate-fade-in-up">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
                                <Building className="w-4 h-4" />
                              </div>
                              <p className="font-bold text-sm text-primary">Tú (Autor)</p>
                            </div>
                            <p className="text-base leading-relaxed text-foreground font-medium">
                              {reply.comment}
                            </p>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="mb-12 bg-card/30 backdrop-blur-md border border-border/50 shadow-lg rounded-[2rem] overflow-hidden animate-fade-in-up">
              <CardContent className="p-8">
                <div className="flex gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center flex-shrink-0 border border-secondary/20">
                    <Info className="w-7 h-7 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">¿Qué significa esto?</h3>
                    <p className="text-base text-muted-foreground leading-relaxed font-medium">
                      Los gastos marcados como "a revisar" no necesariamente son incorrectos.
                      Pueden deberse a aumentos de tarifas o gastos extraordinarios justificados.
                      Te recomendamos revisar las actas del consorcio o consultar con la administración
                      si tenés dudas sobre algún ítem específico.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <div className="text-center pt-12 pb-20">
              <p className="text-muted-foreground text-lg mb-8 font-medium">
                ¿Querés analizar otra expensa?
              </p>
              <Button asChild variant="hero" size="lg" className="px-10 h-16 text-xl rounded-2xl shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                <Link to="/analizar">Subir nueva expensa</Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default AnalysisPage;
