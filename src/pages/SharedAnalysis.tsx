import { useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Building,
  Wrench,
  Droplets,
  Zap,
  Users,
  Shield,
  Lock,
  ExternalLink,
  History,
  MessageSquare,
  Send,
  User,
  Loader2,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  CreditCard,
  Flame,
  Briefcase,
  ShieldCheck,
  PiggyBank,
  ArrowUpDown,
  Eye,
  Leaf,
  Hammer,
  Wifi,
  Package,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { periodToYearMonth } from "@/services/formatters/date";
import { createClient } from "@supabase/supabase-js";
import { Sparkles } from "lucide-react";
import { EvolutionComparisonChart } from "@/components/EvolutionComparisonChart";
import { ComparisonChart } from "@/components/ComparisonChart";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
} from "recharts";

// Create a separate client for function calls that bypasses authentication
const supabaseFunctions = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
);

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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatShortCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return `$${value}`;
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
  building_name: string;
  building_address?: string;
  period: string;
  period_date: string;
  total_amount: number;
  previous_total: number | null;
  unit: string | null;
  categories_count: number;
  created_at: string;
  owner_notes?: string;
  status?: string;
}

interface HistoricalDataPoint {
  id: string;
  period: string;
  total_amount: number;
  created_at: string;
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

interface AnalysisComment {
  id: string;
  author_name: string;
  author_email: string | null;
  comment: string;
  created_at: string;
  is_owner_comment: boolean;
  user_id: string | null;
  parent_comment_id: string | null;
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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#06b6d4'];

import { Logo } from "@/components/layout/ui/logo";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-20">
        <Link to="/" className="flex items-center gap-2 group">
          <Logo className="w-10 h-10 group-hover:rotate-12 transition-transform duration-500" />
          <span className="text-2xl font-bold tracking-tight">ExpensaCheck</span>
        </Link>
        <Button asChild size="sm">
          <Link to="/analizar">
            Analizar mi expensa
          </Link>
        </Button>
      </div>
    </header>
  );
};

// Inline HistoricalEvolutionChart for shared view (no auth required)
const SharedHistoricalChart = ({
  historicalData,
  currentAnalysisId,
  currentPeriod,
  buildingName,
  category = "all"
}: {
  historicalData: HistoricalDataPoint[];
  currentAnalysisId: string;
  currentPeriod: string;
  buildingName: string | null;
  category?: string;
}) => {
  if (historicalData.length < 2) {
    return null;
  }

  const getAmount = (h: HistoricalDataPoint) => {
    if (category === "all") return h.total_amount;
    const cat = h.expense_categories?.find(c => c.name === category);
    return cat ? cat.current_amount : 0;
  };

  const chartData = historicalData.map((item) => ({
    period: item.period,
    total: getAmount(item),
    isCurrent: item.id === currentAnalysisId,
  }));

  const totals = historicalData.map((d) => getAmount(d));
  const average = totals.reduce((a, b) => a + b, 0) / totals.length;
  const min = Math.min(...totals);
  const max = Math.max(...totals);
  const currentTotal = getAmount(historicalData.find((d) => d.id === currentAnalysisId)!);

  const firstTotal = getAmount(historicalData[0]);
  const totalEvolution = firstTotal
    ? ((currentTotal - firstTotal) / firstTotal) * 100
    : null;

  return (
    <Card variant="glass" className="animate-fade-in-up">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-soft flex items-center justify-center">
              <History className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {category === "all" ? "Evolución histórica" : `Evolución: ${category}`}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {historicalData.length} análisis de {buildingName}
              </p>
            </div>
          </div>
          {totalEvolution !== null && (
            <Badge
              variant={totalEvolution > 0 ? "attention" : "ok"}
              className="flex items-center gap-1"
            >
              {totalEvolution > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {totalEvolution > 0 ? "+" : ""}{totalEvolution.toFixed(1)}% desde el primer análisis
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Promedio</p>
            <p className="font-semibold text-sm">{formatCurrency(average)}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Mínimo</p>
            <p className="font-semibold text-sm text-status-ok">{formatCurrency(min)}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Máximo</p>
            <p className="font-semibold text-sm text-status-attention">{formatCurrency(max)}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Actual</p>
            <p className="font-semibold text-sm">{formatCurrency(currentTotal)}</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorTotalShared" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="period"
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickFormatter={formatShortCurrency}
              tickLine={false}
              axisLine={false}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value: number) => [formatCurrency(value), "Total"]}
              labelFormatter={(label) => `Período: ${label}`}
            />
            <ReferenceLine
              y={average}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
              label={{
                value: "Promedio",
                position: "right",
                fill: "hsl(var(--muted-foreground))",
                fontSize: 10,
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#colorTotalShared)"
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (payload.isCurrent) {
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={6}
                      fill="hsl(var(--primary))"
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    />
                  );
                }
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill="hsl(var(--primary))"
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{
                r: 6,
                fill: "hsl(var(--primary))",
                stroke: "hsl(var(--background))",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>

        <p className="text-xs text-muted-foreground text-center mt-4">
          El punto más grande indica el análisis actual ({currentPeriod})
        </p>
      </CardContent>
    </Card>
  );
};

const SharedAnalysis = () => {
  const { token } = useParams<{ token: string }>();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [evolutionData, setEvolutionData] = useState<EvolutionDataPoint[]>([]);
  const [deviation, setDeviation] = useState<Deviation | null>(null);
  const [buildingsTrendStats, setBuildingsTrendStats] = useState<BuildingsTrendStats | null>(null);
  const [comments, setComments] = useState<AnalysisComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [inflationDataRaw, setInflationDataRaw] = useState<any[]>([]);
  const [categoryTrends, setCategoryTrends] = useState<Record<string, any>>({});

  // Form state for new comment
  const [newComment, setNewComment] = useState({ author_name: '', author_email: '', comment: '' });
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // State for owner reply
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [ownerReply, setOwnerReply] = useState('');

  useEffect(() => {
    const fetchSharedAnalysis = async () => {
      if (!token) {
        setError("Token inválido");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setAnalysis(null);
      setCategories([]);
      setHistoricalData([]);
      setEvolutionData([]);
      setDeviation(null);
      setBuildingsTrendStats(null);
      setComments([]);
      setInflationDataRaw([]);
      setCategoryTrends({});

      try {
        console.log("Fetching shared analysis for token:", token);

        // Use edge function for all operations (bypasses RLS and works for both logged in and anonymous users)
        const { data: analysisResult, error: analysisError } = await supabaseFunctions
          .functions.invoke('get-shared-analysis', {
            body: { token }
          });

        console.log("Edge function response:", { analysisResult, analysisError });

        if (analysisError) {
          console.error("Edge function error:", analysisError);

          // Handle specific error cases from edge function
          if (analysisError.message?.includes("Link not found")) {
            setError("Este enlace no existe o ya no está disponible");
          } else if (analysisError.message?.includes("Link is deactivated")) {
            setError("Este enlace fue desactivado");
          } else if (analysisError.message?.includes("Link has expired")) {
            setError("Este enlace ha expirado");
          } else if (analysisError.message?.includes("Token is required")) {
            setError("Token inválido");
          } else {
            setError("Error al cargar el análisis compartido");
          }
          setIsLoading(false);
          return;
        }

        if (analysisResult.analysis) {
          console.log("Analysis loaded successfully");
          setAnalysis(analysisResult.analysis);
          setCategories(analysisResult.categories || []);
          setHistoricalData(analysisResult.historicalData || []);
          setEvolutionData(analysisResult.evolutionData || []);
          setDeviation(analysisResult.deviation || null);
          setBuildingsTrendStats(analysisResult.buildingsTrendStats || null);
          setComments(analysisResult.comments || []);

          // Store raw data for local filtering
          setInflationDataRaw(analysisResult.inflationData || []);
          setCategoryTrends(analysisResult.categoryTrends || {});

          // Extract unique categories across all historical periods
          const allCatNames = new Set<string>();
          (analysisResult.historicalData || []).forEach((h: any) => {
            h.expense_categories?.forEach((c: any) => allCatNames.add(c.name));
          });
          setAvailableCategories(Array.from(allCatNames).sort());
        } else {
          console.log("No analysis data in response");
          setError("No se pudo cargar el análisis");
        }
      } catch (err: any) {
        console.error("Error fetching shared analysis:", err);
        setError("Error al cargar el análisis compartido");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedAnalysis();
  }, [token]);

  // Recalculate evolution locally based on selected category
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
        const periodKey = inf.period;
        if (periodKey) {
          inflationMap.set(periodKey, { value: inf.value, is_estimated: inf.is_estimated });
        }
      });
    }

    // Find base inflation value
    const firstPeriod = historicalData[0];
    const firstPeriodYYYYMM = periodToYearMonth(firstPeriod.period, firstPeriod.period_date);
    const baseInflation = firstPeriodYYYYMM ? (inflationMap.get(firstPeriodYYYYMM) ?? null) : null;

    // Find custom category trend data
    const activeTrend = categoryTrends[selectedCategory] || { data: [], stats: null };
    const buildingsTrendRaw = activeTrend.data || [];

    // Find base buildings average
    const firstPeriodLabel = historicalData[0].period;
    const baseBuildingsItem = buildingsTrendRaw.find((b: any) => b.period === firstPeriodLabel);
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
        const buildingsItem = buildingsTrendRaw.find((b: any) => b.period === h.period);
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
    setBuildingsTrendStats(activeTrend.stats || null);

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
  }, [selectedCategory, historicalData, inflationDataRaw, categoryTrends]);

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
      console.log('Submitting owner reply:', {
        token: token?.substring(0, 10) + '...',
        user_id: 'owner-user-id', // Esto debería venir del auth real
        parent_comment_id: replyingTo,
        comment: ownerReply.trim()
      });

      const { data: responseData, error: responseError } = await supabaseFunctions.functions.invoke('add-owner-comment', {
        body: {
          token,
          user_id: 'owner-user-id', // Esto debería venir del auth real
          parent_comment_id: replyingTo,
          comment: ownerReply.trim()
        }
      });

      console.log('Response from owner-reply:', { data: responseData, error: responseError });

      if (responseError) {
        console.error('Owner reply error:', responseError);
        let errorMsg = responseError.message;
        if (responseError instanceof Error && (responseError as any).context) {
          try {
            const body = await (responseError as any).context.json();
            if (body.error) errorMsg = body.error;
          } catch (e) {
            console.error('Failed to parse error body:', e);
          }
        }
        throw new Error(errorMsg || 'Error al enviar la respuesta');
      }

      // Add new reply to local state
      const newReplyData = responseData.comment;
      setComments(prev => [...prev, newReplyData]);

      // Invalidate cache to ensure updated comments are shown
      try {
        await supabaseFunctions.functions.invoke('invalidate-share-cache', {
          body: { analysis_id: analysis?.id }
        });
      } catch (cacheError) {
        console.log('Cache invalidation failed:', cacheError);
        // Don't fail the comment submission if cache invalidation fails
      }

      // Reset form
      setOwnerReply('');
      setReplyingTo(null);

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

    if (!token || !newComment.author_name.trim() || !newComment.comment.trim()) {
      setCommentError("Por favor completa tu nombre y el comentario");
      return;
    }

    setIsSubmittingComment(true);
    setCommentError(null);

    try {
      console.log('Submitting comment:', {
        token: token?.substring(0, 10) + '...',
        author_name: newComment.author_name.trim(),
        author_email: newComment.author_email.trim() || undefined,
        comment: newComment.comment.trim()
      });

      const { data: responseData, error: responseError } = await supabaseFunctions.functions.invoke('add-analysis-comment', {
        body: {
          token,
          author_name: newComment.author_name.trim(),
          author_email: newComment.author_email.trim() || undefined,
          comment: newComment.comment.trim()
        }
      });

      console.log('Response from add-comment:', { data: responseData, error: responseError });

      if (responseError) {
        console.error('Comment submission error:', responseError);
        let errorMsg = responseError.message;
        if (responseError instanceof Error && (responseError as any).context) {
          try {
            const body = await (responseError as any).context.json();
            if (body.error) errorMsg = body.error;
          } catch (e) {
            console.error('Failed to parse error body:', e);
          }
        }
        throw new Error(errorMsg || 'Error al enviar el comentario');
      }

      // Add the new comment to the local state
      const newCommentData = responseData.comment;
      setComments(prev => [...prev, newCommentData]);

      // Invalidate cache to ensure updated comments are shown
      try {
        await supabaseFunctions.functions.invoke('invalidate-share-cache', {
          body: { analysis_id: analysis?.id }
        });
      } catch (cacheError) {
        console.log('Cache invalidation failed:', cacheError);
        // Don't fail the comment submission if cache invalidation fails
      }

      // Reset form
      setNewComment({ author_name: '', author_email: '', comment: '' });

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
      <div className="min-h-screen bg-gradient-soft">
        <Header />
        <main className="pt-24 pb-20">
          <div className="container max-w-4xl">
            <Skeleton className="h-48 w-full mb-8" />
            <Skeleton className="h-32 w-full mb-4" />
            <Skeleton className="h-32 w-full mb-4" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <Header />
        <main className="pt-24 pb-20 flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h1 className="text-xl font-bold mb-2">Enlace no disponible</h1>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button asChild>
                <Link to="/">
                  Ir al inicio
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const totalChange = calculateChange(analysis.total_amount, analysis.previous_total);
  const attentionItems = categories.filter(c => c.status === "attention").length;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen relative overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 -z-10 bg-background">
          <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-primary/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-secondary/5 blur-[120px] rounded-full"></div>
        </div>

        <Header />
        <main className="pt-32 pb-20 relative z-10">
          <div className="container max-w-4xl">
            {/* Shared badge */}
            <div className="flex items-center gap-2 mb-8 text-sm text-muted-foreground font-medium">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <ExternalLink className="w-4 h-4 text-primary" />
              </div>
              <span>Análisis compartido</span>
            </div>

            {/* Summary Card */}
            <Card className="mb-8 bg-card/40 backdrop-blur-xl border-border/50 shadow-2xl rounded-[2rem] overflow-hidden animate-fade-in-up">
              <CardContent className="p-8 md:p-10">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-base text-muted-foreground font-medium mb-1">
                          {analysis.building_name || "Edificio"}
                        </p>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{analysis.period}</h1>
                        {analysis.unit && (
                          <p className="text-lg text-muted-foreground font-medium mt-2">{analysis.unit}</p>
                        )}
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant={attentionItems > 0 ? "attention" : "ok"} className="text-sm px-4 py-1.5 rounded-full cursor-help shadow-lg">
                            {attentionItems > 0 ? (
                              <><AlertTriangle className="w-4 h-4 mr-2" />{attentionItems} puntos a revisar</>
                            ) : (
                              <><CheckCircle2 className="w-4 h-4 mr-2" />Todo en orden</>
                            )}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs p-4 rounded-xl">
                          {attentionItems > 0 ? (
                            <p className="font-medium">Hay {attentionItems} categorías con aumentos mayores al promedio.</p>
                          ) : (
                            <p className="font-medium">Todas las categorías tienen variaciones dentro de lo esperado.</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-muted-foreground text-lg font-medium max-w-lg leading-relaxed">
                      {attentionItems > 0
                        ? "Esta expensa tiene algunos aumentos que merecen atención."
                        : "Esta expensa está dentro de los rangos normales."}
                    </p>
                  </div>
                  <div className="flex flex-col justify-center items-start md:items-end">
                    <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-2">Total del mes</p>
                    <p className="text-4xl md:text-5xl font-black text-foreground">
                      {formatCurrency(analysis.total_amount)}
                    </p>
                    {analysis.previous_total && (
                      <div className={`flex items-center gap-2 mt-4 text-base font-bold px-4 py-2 rounded-xl ${totalChange > 0 ? "bg-status-attention-bg text-status-attention" : "bg-status-ok-bg text-status-ok"}`}>
                        {totalChange > 0 ? (
                          <TrendingUp className="w-5 h-5" />
                        ) : (
                          <TrendingDown className="w-5 h-5" />
                        )}
                        <span>
                          {totalChange > 0 ? "+" : ""}{totalChange.toFixed(1)}% vs mes anterior
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Summary */}
            <Card className="mb-12 bg-primary/5 backdrop-blur-md border-primary/20 shadow-xl rounded-[1.5rem] animate-fade-in-up">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/30">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-primary uppercase tracking-widest mb-2">Análisis de Inteligencia Artificial</p>
                  <p className="text-base text-foreground/90 leading-relaxed font-medium">
                    {attentionItems > 0
                      ? `Esta expensa de ${analysis.period} totaliza ${formatCurrency(analysis.total_amount)}${analysis.previous_total ? ` (${totalChange > 0 ? '+' : ''}${totalChange.toFixed(0)}% vs anterior)` : ''}. ${attentionItems} categoría${attentionItems > 1 ? 's merecen' : ' merece'} revisión por aumentos significativos.`
                      : `Esta expensa de ${analysis.period} totaliza ${formatCurrency(analysis.total_amount)}${analysis.previous_total ? ` (${totalChange > 0 ? '+' : ''}${totalChange.toFixed(0)}% vs anterior)` : ''}. Todos los rubros están dentro de parámetros normales.`}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Extraordinary Expenses Alert for Tenants */}
            {extraordinaryExpenses.hasExtraordinary && (
              <Card className="mb-12 bg-amber-500/5 backdrop-blur-md border-amber-500/30 shadow-xl rounded-[1.5rem] animate-fade-in-up">
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 rounded-[1.25rem] bg-amber-500/20 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
                      <ShieldAlert className="w-8 h-8 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <h3 className="text-2xl font-black text-amber-700 flex flex-wrap items-center gap-3">
                          Atención Inquilinos
                          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 uppercase tracking-widest text-[10px] font-black px-3 py-1">
                            Detección de Extraordinarias
                          </Badge>
                        </h3>
                        <span className="text-2xl font-black text-amber-600">
                          {formatCurrency(extraordinaryExpenses.total + extraordinaryExpenses.reserveTotal)}
                        </span>
                      </div>
                      <p className="text-base text-amber-900/80 mb-6 leading-relaxed font-medium">
                        Hemos detectado conceptos que suelen ser considerados <strong>Extraordinarios</strong> o <strong>Fondo de Reserva</strong>.
                        En Argentina, por ley, estos gastos no deberían ser abonados por el inquilino, sino por el propietario.
                      </p>

                      <div className="grid gap-3">
                        {[...extraordinaryExpenses.items, ...extraordinaryExpenses.reserveItems].map((item, i) => (
                          <div key={i} className="flex justify-between items-center py-3.5 px-5 bg-amber-500/10 rounded-2xl border border-amber-500/10 transition-all hover:bg-amber-500/15">
                            <span className="font-bold text-amber-900">{item.name}</span>
                            <span className="font-black text-amber-700">{formatCurrency(item.amount)}</span>
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
              <div className="grid gap-6 mb-12">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-primary rounded-full"></div>
                  <h2 className="text-2xl font-bold tracking-tight">Detalle por categoría</h2>
                </div>
                <div className="grid gap-6">
                  {categories.map((category, index) => {
                    const change = calculateChange(category.current_amount, category.previous_amount);
                    const Icon = iconMap[category.icon] || Building;

                    return (
                      <Card
                        key={category.id}
                        className="bg-card/30 backdrop-blur-md border border-border/50 shadow-lg rounded-[1.5rem] overflow-hidden animate-fade-in-up hover:bg-card/40 transition-all duration-300"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <CardContent className="p-0">
                          <div
                            className="flex flex-col md:flex-row cursor-pointer hover:bg-muted/10 transition-colors"
                            onClick={() => {
                              setExpandedCategories(prev => {
                                const next = new Set(prev);
                                if (next.has(category.id)) next.delete(category.id);
                                else next.add(category.id);
                                return next;
                              });
                            }}
                          >
                            <div className="flex-1 p-6 md:p-8">
                              <div className="flex items-start gap-5">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border ${category.status === "attention" ? "bg-status-attention-bg border-status-attention/30" : category.status === "info" ? "bg-status-info-bg border-status-info/30" : "bg-status-ok-bg border-status-ok/30"
                                  }`}>
                                  <Icon className={`w-7 h-7 ${category.status === "attention" ? "text-status-attention" : category.status === "info" ? "text-status-info" : "text-status-ok"
                                    }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-bold">{category.name}</h3>
                                    <Badge variant={category.status as any} className="px-3">
                                      {category.status === "ok" ? "OK" : category.status === "info" ? "Info" : "Revisar"}
                                    </Badge>
                                  </div>
                                  <p className="text-base text-muted-foreground leading-relaxed font-medium">
                                    {category.explanation || "Sin observaciones específicas para este rubro."}
                                  </p>
                                  {category.expense_subcategories && category.expense_subcategories.length > 0 && (
                                    <div className="flex items-center gap-1 mt-3 text-primary font-bold text-sm">
                                      {expandedCategories.has(category.id) ? (
                                        <>Ocultar detalle <ChevronUp className="w-4 h-4" /></>
                                      ) : (
                                        <>Ver detalle <ChevronDown className="w-4 h-4" /></>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex md:flex-col items-center justify-between md:justify-center gap-6 p-6 md:p-8 bg-muted/20 md:w-56 border-t md:border-t-0 md:border-l border-border/50">
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Este mes</p>
                                <p className="text-2xl font-black">{formatCurrency(category.current_amount)}</p>
                              </div>
                              {category.previous_amount && (
                                <div className={`flex items-center gap-1.5 text-base font-bold px-3 py-1 rounded-lg ${change > 15 ? "bg-status-attention-bg text-status-attention" : change > 0 ? "bg-muted/50 text-muted-foreground" : "bg-status-ok-bg text-status-ok"
                                  }`}>
                                  {change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
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
                                          <linearGradient key={`grad-${idx}`} id={`colorGrad-shared-${idx}`} x1="0" y1="0" x2="0" y2="1">
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
                                            fill={`url(#colorGrad-shared-${index % COLORS.length})`}
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


            {/* Visual Comparison Chart - Bar chart comparing with previous period */}
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
                      leftSubcategories: [],
                      rightSubcategories: c.expense_subcategories || []
                    }))
                    .sort((a, b) => b.rightAmount - a.rightAmount)}
                  leftLabel="Mes anterior"
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
                    <h3 className="text-xl font-bold font-heading">Evolución y Tendencias</h3>
                    <p className="text-sm text-muted-foreground">Análisis histórico comparado con el mercado e inflación</p>
                  </div>
                </div>

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
            )}

            {/* Historical Evolution Chart */}
            {historicalData.length >= 2 && (
              <div className="mb-8">
                <SharedHistoricalChart
                  historicalData={historicalData}
                  currentAnalysisId={analysis.id}
                  currentPeriod={analysis.period}
                  buildingName={analysis.building_name}
                  category={selectedCategory}
                />
              </div>
            )}

            {/* Evolution Comparison Chart - Percentage with inflation and other buildings */}
            {evolutionData.length >= 2 && (
              <div className="mb-8">
                <EvolutionComparisonChart
                  data={evolutionData}
                  buildingName={analysis.building_name || "Este edificio"}
                  deviation={deviation || undefined}
                  buildingsTrendStats={buildingsTrendStats}
                />
              </div>
            )}

            {/* Owner's Notes Section */}
            {analysis?.owner_notes && (
              <Card className="mb-12 bg-card/40 backdrop-blur-xl border border-border/50 shadow-2xl rounded-[2rem] overflow-hidden animate-fade-in-up">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <MessageSquare className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">Notas del Autor</CardTitle>
                      <p className="text-sm text-muted-foreground font-medium">
                        Información adicional de este reporte
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                  <div className="p-6 bg-primary/5 rounded-[1.5rem] border border-primary/10">
                    <p className="text-base leading-relaxed text-foreground/90 font-medium italic">
                      "{analysis.owner_notes}"
                    </p>
                  </div>
                </CardContent>
              </Card>
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
                    Dejá tu comentario o duda
                  </h4>
                  <div className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground/80 ml-1">Tu nombre *</label>
                        <input
                          type="text"
                          value={newComment.author_name}
                          onChange={(e) => setNewComment(prev => ({ ...prev, author_name: e.target.value }))}
                          className="w-full px-5 py-3 bg-background/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-foreground"
                          placeholder="Ej: Juan Pérez"
                          maxLength={100}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground/80 ml-1">Email (opcional)</label>
                        <input
                          type="email"
                          value={newComment.author_email}
                          onChange={(e) => setNewComment(prev => ({ ...prev, author_email: e.target.value }))}
                          className="w-full px-5 py-3 bg-background/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-foreground"
                          placeholder="juan@ejemplo.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground/80 ml-1">Tu comentario *</label>
                      <textarea
                        value={newComment.comment}
                        onChange={(e) => setNewComment(prev => ({ ...prev, comment: e.target.value }))}
                        className="w-full px-5 py-4 bg-background/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-foreground min-h-[120px] resize-none"
                        placeholder="Escribí tu consulta o comentario sobre estas expensas..."
                        maxLength={500}
                        required
                      />
                      <div className="flex justify-between items-center px-1">
                        <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                          {newComment.comment.length}/500 caracteres
                        </div>
                      </div>
                    </div>
                    {commentError && (
                      <div className="text-sm font-bold text-status-attention bg-status-attention-bg/50 p-4 rounded-xl border border-status-attention/30">
                        {commentError}
                      </div>
                    )}
                    <Button
                      type="submit"
                      disabled={isSubmittingComment}
                      variant="hero"
                      className="w-full md:w-auto px-8 py-6 h-auto text-lg rounded-xl shadow-xl shadow-primary/20"
                    >
                      {isSubmittingComment ? "Enviando..." : "Publicar comentario"}
                    </Button>
                  </div>
                </form>

                {/* Comments List */}
                {comments.length === 0 ? (
                  <div className="text-center py-16 bg-muted/10 rounded-[2rem] border border-dashed border-border/50">
                    <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-6">
                      <MessageSquare className="w-10 h-10 text-muted-foreground opacity-50" />
                    </div>
                    <h5 className="text-xl font-bold mb-2 text-foreground/70">Aún no hay comentarios</h5>
                    <p className="text-muted-foreground font-medium">Sé el primero en participar de la conversación.</p>
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
                                <p className="font-black text-base text-foreground flex items-center gap-2">
                                  {comment.is_owner_comment ? 'Autor del Análisis' : comment.author_name}
                                  {comment.is_owner_comment && (
                                    <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] uppercase tracking-widest px-2 py-0">Autor</Badge>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground font-bold tracking-wider">{formatDate(comment.created_at)}</p>
                              </div>
                            </div>
                            {analysis?.user_id === 'owner-user-id' && !comment.is_owner_comment && (
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
                                <div>
                                  <label className="block text-sm font-bold mb-2 ml-1 text-primary">Tu respuesta como Autor:</label>
                                  <textarea
                                    value={ownerReply}
                                    onChange={(e) => setOwnerReply(e.target.value)}
                                    className="w-full px-5 py-4 bg-background/50 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-foreground min-h-[100px] resize-none"
                                    placeholder="Responde al comentario..."
                                    maxLength={1000}
                                    required
                                  />
                                  <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-2 px-1">
                                    {ownerReply.length}/1000 caracteres
                                  </div>
                                </div>
                                {commentError && (
                                  <div className="text-sm font-bold text-status-attention bg-status-attention-bg/50 p-3 rounded-lg border border-status-attention/30">
                                    {commentError}
                                  </div>
                                )}
                                <div className="flex gap-3">
                                  <Button
                                    type="submit"
                                    disabled={isSubmittingComment}
                                    size="sm"
                                    className="h-10 px-6 rounded-lg shadow-lg shadow-primary/20"
                                  >
                                    {isSubmittingComment ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        <span>Enviando...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Send className="w-4 h-4 mr-2" />
                                        <span>Enviar respuesta</span>
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-10 px-6 rounded-lg border-border/50"
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setOwnerReply('');
                                    }}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </form>
                            </div>
                          )}

                          {/* Replies list */}
                          {comments.filter(c => c.parent_comment_id === comment.id).map((reply) => (
                            <div key={reply.id} className="ml-8 md:ml-12 mt-4 p-5 bg-primary/5 backdrop-blur-md rounded-[1.25rem] border border-primary/20 shadow-sm animate-fade-in-up">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center border border-primary/20 shadow-sm">
                                  <Building className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="font-bold text-sm text-primary flex items-center gap-1.5 underline underline-offset-4 decoration-primary/30">
                                    Autor del Análisis
                                  </p>
                                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">{formatDate(reply.created_at)}</p>
                                </div>
                              </div>
                              <p className="text-base leading-relaxed text-foreground font-medium italic">
                                "{reply.comment}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="bg-primary shadow-2xl shadow-primary/20 rounded-[2rem] overflow-hidden animate-fade-in-up border-0">
              <CardContent className="p-10 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-32 -mt-32"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-black text-white mb-3">¿Querés analizar tu propia expensa?</h3>
                  <p className="text-white/80 text-lg font-medium mb-8 max-w-lg mx-auto leading-relaxed">
                    Unite a cientos de vecinos que ya controlan sus gastos. Obtené transparencia total en segundos.
                  </p>
                  <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 px-10 h-14 text-lg font-bold rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95">
                    <Link to="/analizar">Analizar mi expensa GRATIS</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default SharedAnalysis;
