import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
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
  ArrowRight,
  History,
  Sparkles,
  MessageSquare,
  Send,
  FileSearch,
  LayoutList,
  ArrowRightCircle,
  Clock,
  Globe,
  Brain,
  PiggyBank,
  HelpCircle
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { EvolutionComparisonChart } from "@/components/EvolutionComparisonChart";
import { ComparisonChart } from "@/components/ComparisonChart";
import { Logo } from "@/components/layout/ui/logo";

const Header = () => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
    <div className="container flex items-center justify-between h-20">
      <Link to="/" className="flex items-center gap-2 group">
        <Logo className="w-10 h-10 group-hover:rotate-12 transition-transform duration-500" />
        <span className="text-2xl font-bold tracking-tight bg-clip-text text-foreground">
          ExpensaCheck
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm" className="hidden sm:flex rounded-full">
          <Link to="/historial">
            <History className="w-4 h-4 mr-2" />
            Ver historial
          </Link>
        </Button>
        <Button asChild variant="ghost" size="icon" className="sm:hidden">
          <Link to="/historial">
            <History className="w-4 h-4" />
          </Link>
        </Button>
        <Button asChild size="sm" className="rounded-full font-bold shadow-lg shadow-primary/20">
          <Link to="/analizar">
            <span className="hidden sm:inline">Analizar mi expensa</span>
            <span className="sm:hidden">Analizar</span>
          </Link>
        </Button>
      </div>
    </div>
  </header>
);

// Datos de ejemplo simplificados
const expenseData = {
  building: "Torres del Parque",
  period: "Diciembre 2025",
  unit: "4° B",
  total: 125800,
  previousTotal: 98500,
  categories: [
    {
      id: "cat1",
      name: "Sueldos y Cargas Sociales",
      icon: Users,
      current: 52000,
      previous: 45000,
      status: "ok" as const,
      explanation: "Aumento del 15.5% por paritarias del SUTERH. Incluye bono navideño proporcional.",
      subcategories: [
        { name: "Sueldo Encargado", amount: 38500, type: "ordinaria" },
        { name: "Cargas Sociales (AFIP)", amount: 11000, type: "ordinaria" },
        { name: "Bono Navidad", amount: 2500, type: "ordinaria" }
      ]
    },
    {
      id: "cat2",
      name: "Servicios Públicos",
      icon: Zap,
      current: 28500,
      previous: 18200,
      status: "attention" as const,
      explanation: "Subió un 56%. El desglose muestra que el consumo excedente en áreas comunes es el principal factor.",
      subcategories: [
        { name: "Edesur - Áreas Comunes", amount: 15200, type: "ordinaria" },
        { name: "Edesur - Consumo Excedente", amount: 9000, type: "ordinaria" },
        { name: "AySA - Agua", amount: 4300, type: "ordinaria" }
      ]
    },
    {
      id: "cat3",
      name: "Mantenimiento y Reparaciones",
      icon: Wrench,
      current: 18500,
      previous: 12000,
      status: "attention" as const,
      explanation: "Reparación extraordinaria del portón incluida este mes. El resto del mantenimiento se mantiene estable.",
      subcategories: [
        { name: "Mantenimiento Ascensores", amount: 6000, type: "ordinaria" },
        { name: "Reparación Portón (Urgencia)", amount: 10500, type: "extraordinaria" },
        { name: "Fumigación Mensual", amount: 2000, type: "ordinaria" }
      ]
    },
    {
      id: "cat4",
      name: "Seguros y Tasas",
      icon: Shield,
      current: 14500,
      previous: 13200,
      status: "ok" as const,
      explanation: "Ajuste por refacción de póliza integral de consorcio.",
      subcategories: [
        { name: "Seguro Integral", amount: 12500, type: "ordinaria" },
        { name: "Tasas Municipales", amount: 2000, type: "ordinaria" }
      ]
    },
    {
      id: "cat5",
      name: "Administración",
      icon: Building,
      current: 12300,
      previous: 6100,
      status: "attention" as const,
      explanation: "Aumento significativo. Se detectó un cargo por 'Gastos de Papelería' inusualmente alto.",
      subcategories: [
        { name: "Honorarios Administrador", amount: 8500, type: "ordinaria" },
        { name: "Gastos de Papelería/Correo", amount: 3800, type: "ordinaria" }
      ]
    },
  ]
};

const mockHistoricalData = [
  { period: "Jul", total: 85000 },
  { period: "Ago", total: 82000 },
  { period: "Sep", total: 88500 },
  { period: "Oct", total: 92000 },
  { period: "Nov", total: 98500 },
  { period: "Dic", total: 125800 },
];

const mockEvolutionData = [
  { period: "Julio", userPercent: 0, inflationPercent: 0, buildingsPercent: 0, inflationEstimated: false },
  { period: "Agosto", userPercent: 8.5, inflationPercent: 4.2, buildingsPercent: 5.1, inflationEstimated: false },
  { period: "Septiembre", userPercent: 12.1, inflationPercent: 7.8, buildingsPercent: 9.4, inflationEstimated: false },
  { period: "Octubre", userPercent: 19.4, inflationPercent: 11.5, buildingsPercent: 14.2, inflationEstimated: false },
  { period: "Noviembre", userPercent: 25.8, inflationPercent: 16.2, buildingsPercent: 18.7, inflationEstimated: false },
  { period: "Diciembre", userPercent: 42.6, inflationPercent: 21.4, buildingsPercent: 24.8, inflationEstimated: false },
];

const mockDeviation = {
  fromInflation: 21.2,
  fromBuildings: 17.8,
  isSignificant: true
};

const mockComparisonData = expenseData.categories.map(c => ({
  name: c.name,
  leftAmount: c.previous,
  rightAmount: c.current,
  diff: c.current - c.previous,
  changePercent: ((c.current - c.previous) / c.previous) * 100,
  subcategories: (c as any).subcategories || []
})).sort((a, b) => b.rightAmount - a.rightAmount);

const mockMeetingAgenda = [
  {
    id: "1",
    importance: "high",
    category: "Administración",
    title: "Revisión de Gastos de Papelería",
    description: "Se detectó que el rubro Administración aumentó 100%. Gracias al desglose por subcategorías, identificamos que el 30% del gasto corresponde a 'Gastos de Papelería', un valor inusual.",
    problem: "Aumento del 100% en Administración (vs 21.4% de inflación).",
    proposed_solution: "Solicitar facturas de librería y envíos de correo para corroborar el gasto.",
    source: "Detalle de Subcategorías"
  },
  {
    id: "2",
    importance: "medium",
    category: "Servicios Públicos",
    title: "Consumo Excedente de Electricidad",
    description: "El análisis detectó un consumo excedente significativo en Edesur. Se recomienda revisar si hay luminarias encendidas innecesariamente.",
    problem: "Gasto en electricidad subió 56% intermensual.",
    proposed_solution: "Instalación de sensores de movimiento en áreas comunes detectadas por la IA.",
    source: "Detección de Anomalías"
  },
  {
    id: "3",
    importance: "low",
    category: "Mantenimiento",
    title: "Garantía de Reparación Portón",
    description: "Se registró un gasto extraordinario por la reparación del portón. Verificar si el proveedor ofrece garantía sobre el trabajo.",
    problem: "Gasto extraordinario de $10.500 no previsto.",
    proposed_solution: "Solicitar certificado de garantía técnica a la administración.",
    source: "Análisis de Gastos Extraordinarios"
  }
];

const mockComments = [
  {
    author: "Ricardo G.",
    role: "Vecino 5° A",
    comment: "¿Alguien más notó que el cargo de mantenimiento del portón ya figuraba en octubre? Deberíamos consultarlo en la asamblea.",
    date: "Ayer, 18:45",
    isOwner: false
  },
  {
    author: "Admin Torres",
    role: "Administrador",
    comment: "Buenas tardes Ricardo, estamos revisando el detalle técnico. Si hubo un error en la carga se bonificará en el próximo período. Saludos.",
    date: "Hoy, 10:20",
    isOwner: true
  }
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatShortCurrency = (value: number) => {
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
  return `$${value}`;
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#06b6d4'];

const calculateChange = (current: number, previous: number) => {
  return ((current - previous) / previous) * 100;
};

const Ejemplo = () => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (id: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };
  const totalChange = calculateChange(expenseData.total, expenseData.previousTotal);
  const attentionItems = expenseData.categories.filter(c => c.status === "attention").length;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-gradient-soft">
        <Header />
        <main className="pt-24 pb-20">
          <div className="container max-w-4xl">
            {/* Back button */}
            <div className="mb-8">
              <Button variant="ghost" asChild>
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al inicio
                </Link>
              </Button>
            </div>

            {/* Pipeline Indicator */}
            <div className="grid grid-cols-4 gap-2 mb-12">
              {[
                { label: "Análisis", icon: FileSearch, active: true },
                { label: "Evolución", icon: Clock, active: true },
                { label: "Comparativa", icon: Globe, active: true },
                { label: "Ahorro", icon: PiggyBank, active: true },
                { label: "Reunión", icon: LayoutList, active: true },
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step.active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground"}`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${step.active ? "text-primary" : "text-muted-foreground"}`}>{step.label}</span>
                </div>
              ))}
            </div>

            {/* Step 1 Heading */}
            <div className="flex items-center gap-3 mb-6 animate-fade-in text-primary">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="font-bold">1</span>
              </div>
              <h2 className="text-xl font-bold uppercase tracking-tight">Análisis Inteligente y Desglose</h2>
            </div>

            {/* Summary Card */}
            <Card variant="glass" className="mb-8 animate-fade-in-up">
              <CardContent className="p-6 md:p-8">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{expenseData.building}</p>
                        <h1 className="text-2xl md:text-3xl font-bold">{expenseData.period}</h1>
                        <p className="text-muted-foreground">{expenseData.unit}</p>
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
                    <p className="text-3xl md:text-4xl font-bold">{formatCurrency(expenseData.total)}</p>
                    <div className={`flex items-center gap-1 mt-2 text-sm ${totalChange > 0 ? "text-status-attention" : "text-status-ok"}`}>
                      {totalChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="font-medium">
                        {totalChange > 0 ? "+" : ""}{totalChange.toFixed(1)}% vs mes anterior
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Summary */}
            <Card variant="soft" className="mb-8 animate-fade-in-up border-primary/20 bg-primary/5">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary mb-1">Resumen IA con Detección de Rubros</p>
                  <p className="text-sm text-muted-foreground">
                    Tu expensa de {expenseData.period} totaliza {formatCurrency(expenseData.total)} (+{totalChange.toFixed(0)}% vs anterior). <strong className="text-primary font-semibold">Nuestra IA desglosó {expenseData.categories.length} rubros en subcategorías específicas</strong>, detectando aumentos críticos en Electricidad y Administración que impactan en tu liquidación final.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Categories Breakdown */}
            <div className="grid gap-4 mb-8">
              <h2 className="text-xl font-semibold">Detalle por categoría</h2>
              <div className="grid gap-4">
                {expenseData.categories.map((category, index) => {
                  const change = calculateChange(category.current, category.previous);
                  const Icon = category.icon;
                  const isExpanded = expandedCategories.has(category.id);

                  return (
                    <Card
                      key={category.id}
                      variant="default"
                      className="animate-fade-in-up overflow-hidden"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          <div className="flex-1 p-5 md:p-6">
                            <div className="flex items-start gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${category.status === "attention" ? "bg-status-attention-bg" : "bg-status-ok-bg"
                                }`}>
                                <Icon className={`w-6 h-6 ${category.status === "attention" ? "text-status-attention" : "text-status-ok"
                                  }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold">{category.name}</h3>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge
                                        variant={category.status}
                                        className="cursor-help transition-transform hover:scale-105"
                                      >
                                        {category.status === "ok" ? "OK" : "Revisar"}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs">
                                      {category.status === "ok" ? (
                                        <p>✅ Este gasto está dentro de los parámetros normales.</p>
                                      ) : (
                                        <p>⚠️ Este gasto tuvo un aumento significativo. Te recomendamos verificarlo con la administración.</p>
                                      )}
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {category.explanation}
                                </p>
                                {category.subcategories && category.subcategories.length > 0 && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-primary/20 text-primary border-none font-bold animate-pulse">
                                      ¡NUEVO!
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-auto p-0 text-primary font-bold text-xs hover:bg-transparent"
                                      onClick={() => toggleCategory(category.id)}
                                    >
                                      {isExpanded ? (
                                        <>Ocultar detalle <ChevronUp className="w-3 h-3 ml-1" /></>
                                      ) : (
                                        <>Ver desglose de subcategorías <ChevronDown className="w-3 h-3 ml-1" /></>
                                      )}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex md:flex-col items-center justify-between md:justify-center gap-4 p-5 md:p-6 bg-muted/30 md:w-48 border-t md:border-t-0 md:border-l border-border">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground mb-0.5">Este mes</p>
                              <p className="text-lg font-bold">{formatCurrency(category.current)}</p>
                            </div>
                            <div className={`flex items-center gap-1 text-sm font-medium ${change > 20 ? "text-status-attention" : change > 0 ? "text-muted-foreground" : "text-status-ok"
                              }`}>
                              {change > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                              {change > 0 ? "+" : ""}{change.toFixed(1)}%
                            </div>
                          </div>
                        </div>

                        {/* Subcategories Details */}
                        {isExpanded && category.subcategories && (
                          <div className="p-6 md:p-8 bg-muted/20 border-t border-border/50 animate-fade-in">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-primary" />
                              Distribución Interna del Gasto
                            </h4>
                            <div className="grid md:grid-cols-2 gap-8 items-start">
                              {/* Chart */}
                              <div className="min-h-[250px] w-full flex flex-col justify-center bg-background/40 rounded-2xl p-4 border border-border/30">
                                <ResponsiveContainer width="100%" height={220}>
                                  <PieChart>
                                    <Pie
                                      data={category.subcategories}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={60}
                                      outerRadius={85}
                                      paddingAngle={3}
                                      dataKey="amount"
                                      nameKey="name"
                                      stroke="transparent"
                                      cornerRadius={4}
                                    >
                                      {category.subcategories.map((entry, idx) => (
                                        <Cell
                                          key={`cell-${idx}`}
                                          fill={COLORS[idx % COLORS.length]}
                                        />
                                      ))}
                                    </Pie>
                                    <RechartsTooltip
                                      formatter={(value: number) => [formatCurrency(value), "Monto"]}
                                      contentStyle={{
                                        borderRadius: '12px',
                                        border: '1px solid hsl(var(--border)/0.5)',
                                        backgroundColor: 'hsl(var(--background)/0.95)',
                                        backdropFilter: 'blur(4px)'
                                      }}
                                    />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>

                              {/* List */}
                              <div className="space-y-2">
                                {category.subcategories.map((sub, idx) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between items-center p-3 rounded-lg bg-card border border-border/40"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                      />
                                      <div className="flex flex-col">
                                        <span className="text-xs font-bold">{sub.name}</span>
                                        {sub.type === "extraordinaria" && (
                                          <Badge variant="outline" className="w-fit text-[8px] h-4 mt-0.5 bg-amber-100 text-amber-700 border-amber-200">
                                            Extraordinaria
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-xs font-bold">{formatCurrency(sub.amount)}</div>
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

            {/* Step 2 Heading */}
            <div className="flex items-center gap-3 mt-16 mb-8 animate-fade-in text-secondary">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <span className="font-bold">2</span>
              </div>
              <h2 className="text-xl font-bold uppercase tracking-tight">Evolución Histórica</h2>
            </div>

            <div className="grid gap-6 mb-8">
              <p className="text-muted-foreground text-sm leading-relaxed bg-secondary/5 p-4 rounded-2xl border border-secondary/10">
                <strong className="text-foreground">Mirada a largo plazo:</strong> Entender cómo varían tus expensas en el tiempo es clave. No solo mostramos tu histórico, sino que lo comparamos con el <strong className="text-foreground">índice de inflación</strong> acumulada para saber si tus aumentos están justificados por el contexto macro.
              </p>
            </div>


            {/* Historical Evolution Chart - Custom mock since we can't use the component directly */}
            <div className="mb-8">
              <Card variant="glass" className="animate-fade-in-up">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary-soft flex items-center justify-center">
                      <History className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Evolución histórica</h3>
                      <p className="text-sm text-muted-foreground">Últimos 6 análisis de {expenseData.building}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={mockHistoricalData}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="period" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={formatShortCurrency} fontSize={11} tickLine={false} axisLine={false} />
                      <RechartsTooltip formatter={(v: number) => [formatCurrency(v), "Total"]} />
                      <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="url(#colorTotal)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Step 3 Heading */}
            <div className="flex items-center gap-3 mt-16 mb-8 animate-fade-in text-primary">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <span className="font-bold">3</span>
              </div>
              <h2 className="text-xl font-bold uppercase tracking-tight">Comparativa de Mercado</h2>
            </div>

            <div className="grid gap-6 mb-8">
              <p className="text-muted-foreground text-sm leading-relaxed bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <strong className="text-foreground">¿Estás pagando de más?</strong> Comparamos tus costos contra una <strong className="text-foreground">red de edificios similares</strong> en tu zona. Gracias a nuestra base de datos, podemos decirte con precisión si un rubro (como administración o limpieza) está fuera de mercado.
              </p>
            </div>
            <div className="mb-12">
              <div className="grid gap-4">
                {mockComparisonData.map((cat, index) => {
                  const Icon = (expenseData.categories.find(c => c.name === cat.name)?.icon as any) || Building;
                  const isIncrease = cat.diff > 0;

                  return (
                    <Card key={cat.name} className="overflow-hidden border-border/50 bg-card/40 backdrop-blur-md">
                      <CardContent className="p-0">
                        <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                          <div className="p-6 text-right">
                            <span className="text-xs text-muted-foreground block mb-1">Noviembre</span>
                            <span className="text-lg font-bold tabular-nums opacity-60">{formatCurrency(cat.leftAmount)}</span>
                          </div>

                          <div className="flex flex-col items-center gap-2 min-w-[150px] py-4">
                            <div className="flex items-center gap-2 px-3 py-1 bg-background rounded-full border border-border/50">
                              <Icon className="w-3.5 h-3.5 text-primary" />
                              <span className="text-xs font-bold">{cat.name}</span>
                            </div>
                            <div className={`text-[10px] font-black flex items-center gap-1 ${isIncrease ? "text-secondary" : "text-primary"}`}>
                              {isIncrease ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {cat.changePercent > 0 ? "+" : ""}{cat.changePercent.toFixed(1)}%
                            </div>
                          </div>

                          <div className="p-6 text-left">
                            <span className="text-xs text-muted-foreground block mb-1">Diciembre</span>
                            <span className="text-lg font-bold tabular-nums">{formatCurrency(cat.rightAmount)}</span>
                            {cat.subcategories.length > 0 && (
                              <div className="mt-2 space-y-0.5">
                                {cat.subcategories.map((sub, i) => (
                                  <p key={i} className="text-[9px] text-muted-foreground">
                                    {sub.name}: <span className="font-bold text-foreground/60">{formatCurrency(sub.amount)}</span>
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
            </div>

            {/* Evolution Comparison Chart */}
            <div className="mb-8">
              <EvolutionComparisonChart
                data={mockEvolutionData}
                buildingName={expenseData.building}
                deviation={mockDeviation}
                analysis="El aumento de este mes supera la inflación acumulada del edificio en 21.2 puntos. Se observa un desvío significativo respecto a otros edificios de la zona, principalmente por el rubro Administración."
              />
            </div>

            {/* Step 4 Heading */}
            <div className="flex items-center gap-3 mt-16 mb-8 animate-fade-in text-secondary">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                <span className="font-bold">4</span>
              </div>
              <h2 className="text-xl font-bold uppercase tracking-tight">Preparación de Reunión (Agenda IA)</h2>
            </div>

            <div className="grid gap-6 mb-8">
              <p className="text-muted-foreground text-sm leading-relaxed bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <strong className="text-foreground">El paso final:</strong> Una vez detectadas las anomalías, nuestra IA genera automáticamente un <strong className="text-foreground">temario para tu próxima asamblea</strong>. Te damos los argumentos basados en datos para que puedas plantear tus dudas con fundamentos sólidos.
              </p>


              <div className="grid md:grid-cols-3 gap-6 animate-fade-in-up delay-100 mb-8">
                <Card className="md:col-span-2 rounded-[2rem] border-primary/20 bg-primary/5 backdrop-blur-xl overflow-hidden">
                  <CardHeader className="p-6 border-b border-primary/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                        <Brain className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold">Guía de Preparación</CardTitle>
                        <CardDescription className="text-xs">Preguntas anticipadas y argumentos clave</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-primary/10">
                      <div className="p-6 hover:bg-primary/10 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 w-6 h-6 rounded-full bg-secondary/20 text-secondary flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground mb-1 text-sm">¿Por qué aumentaron tanto los honorarios?</p>
                            <p className="text-xs text-muted-foreground leading-relaxed italic">
                              <span className="text-primary font-bold not-italic mr-1">R:</span>
                              El aumento del 57.5% supera la inflación acumulada (21%). Se sugiere pedir revisión del contrato.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-6 hover:bg-primary/10 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 w-6 h-6 rounded-full bg-secondary/20 text-secondary flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground mb-1 text-sm">¿Es necesario cambiar las luces ahora?</p>
                            <p className="text-xs text-muted-foreground leading-relaxed italic">
                              <span className="text-primary font-bold not-italic mr-1">R:</span>
                              Sí, la tarifa eléctrica subió 56%. La inversión en LED se recupera en 4 meses con el ahorro generado.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[2rem] border-secondary/20 bg-secondary/5 backdrop-blur-xl overflow-hidden h-fit">
                  <CardHeader className="p-6 border-b border-secondary/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center shadow-lg shadow-secondary/20">
                        <Zap className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-lg font-bold">Datos en Mano</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Inflación Acumulada</span>
                      <span className="text-xl font-black text-secondary">21.4%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Aumento Expensas</span>
                      <span className="text-xl font-black text-secondary">42.6%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Incidencia Sueldos</span>
                      <span className="text-xl font-black text-secondary">41.3%</span>
                    </div>
                    <div className="pt-3 border-t border-secondary/10">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 leading-tight">
                        <Info className="w-3 h-3 flex-shrink-0" />
                        Datos clave para responder con autoridad.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="rounded-[2rem] border-primary/20 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
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
                    {mockMeetingAgenda.map((item) => (
                      <div key={item.id} className="flex transition-colors bg-card/40 hover:bg-card/60">
                        {/* Checkbox Column */}
                        <div className="w-14 flex items-center justify-center border-r border-border/30 cursor-pointer bg-primary/5">
                          <Checkbox checked={true} className="w-5 h-5 rounded-md border-2" />
                        </div>

                        <div className="flex-1 p-6">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={
                              item.importance === 'high' ? "bg-status-attention text-white" :
                                item.importance === 'medium' ? "bg-primary/20 text-primary border-primary/30" :
                                  "bg-muted text-muted-foreground"
                            }>
                              {item.importance === 'high' ? 'Crítico' : item.importance === 'medium' ? 'Importante' : 'Sugerencia'}
                            </Badge>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.category}</span>
                          </div>
                          <h4 className="font-bold mb-1">{item.title}</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed mb-3">{item.description}</p>

                          {(item.problem || item.proposed_solution) && (
                            <div className="grid gap-2 sm:grid-cols-2 mt-3 pt-3 border-t border-border/40">
                              {item.problem && (
                                <div className="bg-destructive/5 rounded-lg p-2.5 border border-destructive/10">
                                  <p className="text-[10px] font-bold text-destructive uppercase mb-1 flex items-center gap-1.5">
                                    <AlertTriangle className="w-3 h-3" />
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
                            <ArrowRightCircle className="w-3 h-3" />
                            Fuente: {item.source}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comments Section */}
            <div className="mb-8">
              <Card variant="glass" className="animate-fade-in-up overflow-hidden rounded-[2rem] border-secondary/20 shadow-xl">
                <CardHeader className="bg-secondary/5 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary-soft flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Comentarios y Feedback</h3>
                      <p className="text-sm text-muted-foreground">Conversación entre vecinos y administración</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {mockComments.map((comment, i) => (
                      <div key={i} className={`p-6 ${comment.isOwner ? 'bg-secondary/5' : ''}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${comment.isOwner ? 'bg-secondary text-white' : 'bg-muted text-muted-foreground'}`}>
                              {comment.author[0]}
                            </div>
                            <div>
                              <p className="text-sm font-bold">{comment.author}</p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{comment.role}</p>
                            </div>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{comment.date}</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {comment.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="p-6 bg-muted/30 border-t border-border/50">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Send className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <input
                        type="text"
                        disabled
                        placeholder="Escribí un comentario público..."
                        className="w-full bg-background border border-border rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 opacity-70 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3 text-center italic">
                      Esta es una demostración. En la versión real podés interactuar con otros propietarios.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Info Card */}
            <Card variant="soft" className="mb-8 animate-fade-in-up">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary-soft flex items-center justify-center flex-shrink-0">
                    <Info className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">¿Qué significa "Revisar"?</h3>
                    <p className="text-sm text-muted-foreground">
                      Los ítems marcados como "Revisar" tuvieron aumentos mayores al promedio.
                      No significa que sean incorrectos, pero vale la pena verificarlos con
                      la administración o las actas del consorcio.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card variant="glass" className="animate-fade-in-up">
              <CardContent className="p-8 text-center">
                <h2 className="text-xl font-bold mb-2">¿Querés analizar tu propia expensa?</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Subí el PDF de tu liquidación y recibí un análisis
                  personalizado en menos de 1 minuto.
                </p>
                <Button asChild variant="hero" size="lg">
                  <Link to="/analizar">
                    Analizar mi expensa
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default Ejemplo;
