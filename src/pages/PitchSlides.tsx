import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/layout/ui/logo";
import { formatCurrency } from "@/services/formatters/currency";

const EXPENSE_PRICE = Number(import.meta.env.VITE_EXPENSE_PRICE || 5000);

// ─── Pack pricing ───────────────────────────────────────────────────────────────
const PACKS = [
    { qty: 5, discount: 0.10, label: "Pack 5" },
    { qty: 10, discount: 0.20, label: "Pack 10" },
    { qty: 20, discount: 0.30, label: "Pack 20" },
] as const;
import {
    ArrowRight,
    CheckCircle2,
    TrendingDown,
    TrendingUp,
    Brain,
    PiggyBank,
    Shield,
    Users,
    FileText,
    BarChart3,
    MessageSquare,
    Zap,
    Building,
    Star,
    Sparkles,
    Globe,
    Lock,
    Clock,
    AlertTriangle,
    ArrowLeft,
    Grid3x3,
    X,
    Play,
    ChevronLeft,
    ChevronRight,
    Keyboard,
    Home,
    Briefcase,
    Building2,
    Package,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Slide {
    id: string;
    label: string;
    bg: string;
    content: React.ReactNode;
}

// ─── Animated Number ─────────────────────────────────────────────────────────
const AnimNum = ({ n, suffix = "", prefix = "" }: { n: number; suffix?: string; prefix?: string }) => {
    const [v, setV] = useState(0);
    useEffect(() => {
        let start: number | null = null;
        const duration = 1400;
        const step = (ts: number) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / duration, 1);
            setV(Math.floor((1 - Math.pow(1 - p, 3)) * n));
            if (p < 1) requestAnimationFrame(step);
        };
        const t = setTimeout(() => requestAnimationFrame(step), 300);
        return () => clearTimeout(t);
    }, [n]);
    return <>{prefix}{v.toLocaleString("es-AR")}{suffix}</>;
};

// ─── Mock Screen ─────────────────────────────────────────────────────────────
const MockScreen = ({ compact = false }: { compact?: boolean }) => (
    <div className={`rounded-2xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl ${compact ? "text-xs" : ""}`}>
        <div className="bg-black/20 px-4 py-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400/70" />
            <div className="w-2 h-2 rounded-full bg-amber-400/70" />
            <div className="w-2 h-2 rounded-full bg-emerald-400/70" />
            <div className="flex-1 bg-white/10 rounded-full h-4 mx-4 max-w-[140px]" />
        </div>
        <div className="p-4 space-y-2">
            <div className="bg-primary rounded-xl p-4">
                <p className={`text-primary-foreground/80 font-bold ${compact ? "text-[10px]" : "text-xs"} mb-1`}>Torres del Parque · Dic 2025</p>
                <p className={`text-primary-foreground font-black ${compact ? "text-xl" : "text-2xl"}`}>$125.800</p>
                <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className={`${compact ? "w-2.5 h-2.5" : "w-3.5 h-3.5"} text-amber-300`} />
                    <span className={`text-primary-foreground/80 font-bold ${compact ? "text-[9px]" : "text-xs"}`}>+27.7% vs mes anterior</span>
                </div>
            </div>
            {[
                { n: "Sueldos", a: "$58.200", s: "ok", w: 46 },
                { n: "Mantenimiento", a: "$28.750", s: "warn", w: 23 },
                { n: "Servicios", a: "$22.400", s: "ok", w: 18 },
                { n: "Extraord.", a: "$16.450", s: "bad", w: 13 },
            ].map((c) => (
                <div key={c.n} className="flex items-center gap-2 bg-white/10 rounded-lg px-2.5 py-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.s === "ok" ? "bg-emerald-400" : c.s === "warn" ? "bg-amber-400" : "bg-red-400"}`} />
                    <span className={`flex-1 text-white/90 font-medium ${compact ? "text-[9px]" : "text-[11px]"}`}>{c.n}</span>
                    <div className="w-10 h-1 rounded-full bg-white/20 overflow-hidden">
                        <div className="h-full bg-white/60 rounded-full" style={{ width: `${c.w}%` }} />
                    </div>
                    <span className={`text-white font-bold tabular-nums ${compact ? "text-[9px]" : "text-[11px]"}`}>{c.a}</span>
                </div>
            ))}
            <div className="bg-amber-500/30 border border-amber-400/30 rounded-lg p-2 flex gap-1.5">
                <Brain className={`${compact ? "w-2.5 h-2.5" : "w-3 h-3"} text-amber-300 flex-shrink-0 mt-0.5`} />
                <p className={`text-amber-100 ${compact ? "text-[8px]" : "text-[10px]"} leading-relaxed`}>Mantenimiento cobró 38% más que el promedio de tu zona este mes.</p>
            </div>
        </div>
    </div>
);

// ─── Slides Content ───────────────────────────────────────────────────────────

const slides: Slide[] = [
    // ── 0: HERO ────────────────────────────────────────────────────────────────
    {
        id: "hero",
        label: "Inicio",
        bg: "from-background via-background to-background",
        content: (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                <div className="absolute top-[5%] left-[5%] w-[40%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 right-[5%] w-[35%] h-[40%] bg-secondary/8 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center container max-w-6xl">
                    {/* Left */}
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/25 bg-primary/8 text-primary text-sm font-bold">
                            <Sparkles className="w-4 h-4" />
                            IA aplicada a expensas
                        </div>
                        <h1 className="text-5xl xl:text-7xl font-black tracking-tight leading-[1.05]">
                            Tu consorcio
                            <br />
                            está pagando
                            <br />
                            <span className="bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
                                de más.
                            </span>
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                            ExpensaCheck analiza tu expensa con IA, detecta sobreprecios de proveedores y te da el poder de negociar con datos reales.
                        </p>
                        <div className="flex flex-wrap gap-3 pt-2">
                            <Button asChild size="lg" variant="hero" className="rounded-xl shadow-xl shadow-primary/25 font-bold text-base px-8">
                                <Link to="/analizar">Empezar gratis <ArrowRight className="w-4 h-4 ml-1" /></Link>
                            </Button>
                            <Button asChild size="lg" variant="outline" className="rounded-xl border-border/60 font-semibold text-base px-8">
                                <Link to="/ejemplo"><Play className="w-4 h-4 mr-1" /> Demo interactivo</Link>
                            </Button>
                        </div>
                    </div>
                    {/* Right: mock */}
                    <div className="relative hidden lg:block">
                        <div className="absolute -inset-6 bg-gradient-to-br from-primary/20 via-secondary/10 to-emerald-500/15 blur-2xl rounded-[3rem] -z-10" />
                        <MockScreen />
                    </div>
                </div>
            </div>
        ),
    },

    // ── 1: PROBLEMA ────────────────────────────────────────────────────────────
    {
        id: "problema",
        label: "El Problema",
        bg: "from-background via-background to-background",
        content: (
            <div className="w-full h-full flex items-center justify-center container max-w-5xl">
                <div className="w-full space-y-10">
                    <div className="text-center space-y-3">
                        <Badge variant="outline" className="border-red-400/30 bg-red-500/8 text-red-500 font-bold px-4 py-1.5 text-sm">El problema</Badge>
                        <h2 className="text-5xl xl:text-6xl font-black tracking-tight">
                            La gestión de expensas<br />está <span className="text-red-500">rota.</span>
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            El <strong>70% de los consorcios</strong> pagan sobreprecios sin saberlo.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-5">
                        {[
                            { icon: FileText, title: "PDFs incomprensibles", desc: "Las liquidaciones son documentos técnicos y confusos que nadie entiende del todo — ni los administradores.", color: "red" },
                            { icon: AlertTriangle, title: "Sin referencia de mercado", desc: "¿El ascensor cuesta caro? ¿La limpieza está bien? Sin datos comparativos es imposible saberlo.", color: "amber" },
                            { icon: Clock, title: "Reuniones sin datos", desc: "Las asambleas terminan en discusiones sin resolución. Falta información concreta para tomar decisiones.", color: "blue" },
                        ].map((item) => {
                            const c: Record<string, string> = {
                                red: "bg-red-500/10 border-red-500/25 text-red-500",
                                amber: "bg-amber-500/10 border-amber-500/25 text-amber-500",
                                blue: "bg-blue-500/10 border-blue-500/25 text-blue-500",
                            };
                            return (
                                <div key={item.title} className={`rounded-2xl border p-6 ${c[item.color].split(" ").slice(0, 2).join(" ")}`}>
                                    <item.icon className={`w-8 h-8 mb-4 ${c[item.color].split(" ")[2]}`} />
                                    <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        ),
    },

    // ── 2: SOLUCIÓN ────────────────────────────────────────────────────────────
    {
        id: "solucion",
        label: "La Solución",
        bg: "from-background via-background to-background",
        content: (
            <div className="w-full h-full flex items-center justify-center container max-w-5xl">
                <div className="grid lg:grid-cols-2 gap-14 items-center w-full">
                    <div className="space-y-7">
                        <div>
                            <Badge variant="outline" className="border-primary/30 bg-primary/8 text-primary mb-4 font-bold px-4 py-1.5 text-sm">La solución</Badge>
                            <h2 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight">
                                IA aplicada a la
                                gestión del consorcio.
                            </h2>
                        </div>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Subís el PDF de tu expensa, nuestra IA lo analiza en segundos, lo cruza con miles de datos de mercado y te dice exactamente dónde están pagando de más — con nombres y cifras.
                        </p>
                        <div className="space-y-3">
                            {[
                                { icon: Brain, text: "Extracción automática de todos los rubros con IA" },
                                { icon: BarChart3, text: "Comparación con consorcios similares de tu zona" },
                                { icon: PiggyBank, text: "Alternativas reales con ahorros estimados" },
                                { icon: Users, text: "Agenda de asamblea preparada automáticamente" },
                            ].map((item) => (
                                <div key={item.text} className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                                        <item.icon className="w-4 h-4 text-primary" />
                                    </div>
                                    <span className="font-medium text-sm">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Savings mockup */}
                    <div className="bg-emerald-500 rounded-3xl p-7 text-white shadow-2xl shadow-emerald-500/30 space-y-5">
                        <div className="flex items-center gap-3">
                            <PiggyBank className="w-10 h-10 opacity-90" />
                            <div>
                                <p className="text-emerald-100 text-sm font-bold">Detector de Ahorros</p>
                                <p className="text-2xl font-black">Ahorrás $18.200/mes</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {[
                                { p: "AscensorService SA", c: "Mantenimiento", s: "$8.400", pct: "−34%" },
                                { p: "CleanPro Consorcio", c: "Limpieza", s: "$6.100", pct: "−28%" },
                                { p: "Seguridad Total SRL", c: "Vigilancia", s: "$3.700", pct: "−19%" },
                            ].map((i) => (
                                <div key={i.p} className="bg-white/15 rounded-xl px-4 py-3 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-sm">{i.p}</p>
                                        <p className="text-emerald-100/80 text-xs">{i.c}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black">{i.s}</p>
                                        <p className="text-emerald-200 text-xs font-bold">{i.pct}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-emerald-100/70 text-xs text-center">Basado en datos reales de proveedores en AMBA</p>
                    </div>
                </div>
            </div>
        ),
    },

    // ── 3: FEATURES ────────────────────────────────────────────────────────────
    {
        id: "features",
        label: "Features",
        bg: "from-background via-background to-background",
        content: (
            <div className="w-full h-full flex items-center justify-center container max-w-6xl">
                <div className="w-full space-y-8">
                    <div className="text-center space-y-3">
                        <Badge variant="outline" className="border-primary/30 bg-primary/8 text-primary font-bold px-4 py-1.5 text-sm">Todo incluido</Badge>
                        <h2 className="text-5xl font-black tracking-tight">Una plataforma completa.</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                            { icon: Brain, title: "Análisis con IA", desc: "Extracción automática de todos los rubros. Sin formularios.", badge: "Core", accent: "text-primary bg-primary/10 border-primary/20" },
                            { icon: PiggyBank, title: "Detector de Ahorros", desc: "Cruzamos proveedores con nuestra base regional. Alternativas reales.", badge: "⭐ Top", accent: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
                            { icon: BarChart3, title: "Evolución histórica", desc: "Seguí cada rubro mes a mes. Detectá tendencias antes que sean problema.", accent: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
                            { icon: Users, title: "Preparar Reunión IA", desc: "Agenda automática con puntos urgentes y propuestas concretas.", badge: "Nuevo", accent: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
                            { icon: MessageSquare, title: "Comentarios", desc: "Vecinos y admin colaboran en cada análisis. Memoria institucional.", accent: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
                            { icon: Globe, title: "Link compartible", desc: "Compartí el reporte sin que los destinatarios necesiten cuenta.", accent: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
                        ].map((f) => (
                            <div key={f.title} className="rounded-2xl border border-border/40 bg-card/60 p-5 hover:border-primary/30 transition-colors group">
                                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${f.accent}`}>
                                    <f.icon className="w-4 h-4" />
                                </div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <p className="font-bold text-sm">{f.title}</p>
                                    {f.badge && <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-primary/25 bg-primary/5 text-primary">{f.badge}</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ),
    },

    // ── 4: CÓMO FUNCIONA ───────────────────────────────────────────────────────
    {
        id: "como-funciona",
        label: "Cómo Funciona",
        bg: "from-background via-background to-background",
        content: (
            <div className="w-full h-full flex items-center justify-center container max-w-5xl">
                <div className="w-full space-y-12">
                    <div className="text-center space-y-3">
                        <Badge variant="outline" className="border-primary/30 bg-primary/8 text-primary font-bold px-4 py-1.5 text-sm">Simple por diseño</Badge>
                        <h2 className="text-5xl xl:text-6xl font-black tracking-tight">Del PDF al insight en <span className="text-primary">3 pasos.</span></h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6 relative">
                        <div className="hidden md:block absolute top-14 left-[22%] right-[22%] h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
                        {[
                            { step: "01", icon: FileText, title: "Subís la expensa", desc: "Arrastrás el PDF a la plataforma. PDF de hasta 15MB. Sin formularios previos.", note: "Segundos de setup" },
                            { step: "02", icon: Brain, title: "La IA la analiza", desc: "En 2 minutos: rubros, categorías, comparativa histórica y detección de alertas.", note: "Gemini AI + datos regionles" },
                            { step: "03", icon: TrendingDown, title: "Tomás acción", desc: "Identificás sobreprecios, compartís el reporte y llevás propuestas concretas a la asamblea.", note: "Reporte PDF exportable" },
                        ].map((s) => (
                            <div key={s.step} className="text-center group">
                                <div className="relative inline-block mb-5">
                                    <div className="w-28 h-28 rounded-3xl bg-primary/10 border-2 border-primary/20 mx-auto flex items-center justify-center group-hover:border-primary/70 group-hover:bg-primary/15 transition-all duration-300">
                                        <s.icon className="w-12 h-12 text-primary" />
                                    </div>
                                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-black flex items-center justify-center shadow-lg">
                                        {s.step}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed mb-2">{s.desc}</p>
                                <p className="text-xs text-muted-foreground/55 font-medium">{s.note}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center">
                        <Button asChild size="lg" variant="hero" className="rounded-xl px-10 shadow-xl shadow-primary/20">
                            <Link to="/ejemplo">Ver análisis de ejemplo <ArrowRight className="w-4 h-4 ml-1" /></Link>
                        </Button>
                    </div>
                </div>
            </div>
        ),
    },

    // ── 5: AHORROS ─────────────────────────────────────────────────────────────
    {
        id: "ahorros",
        label: "Ahorros",
        bg: "from-background via-background to-background",
        content: (
            <div className="w-full h-full flex items-center justify-center container max-w-5xl">
                <div className="grid lg:grid-cols-2 gap-14 items-center w-full">
                    <div className="space-y-6">
                        <div>
                            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/8 text-emerald-700 mb-4 font-bold px-4 py-1.5 text-sm">Recuperá tu dinero</Badge>
                            <h2 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight mb-3">Los números no mienten.</h2>
                            <p className="text-lg text-muted-foreground">Ahorro promedio detectado: <strong className="text-emerald-600 text-2xl">$8.000 – $25.000/mes</strong> en consorcios de AMBA.</p>
                        </div>
                        <div className="space-y-3">
                            {[
                                { cat: "Ascensores y mantenimiento", over: "38%", save: "$8.400/mes" },
                                { cat: "Limpieza y portería", over: "28%", save: "$6.100/mes" },
                                { cat: "Seguros", over: "22%", save: "$3.200/mes" },
                                { cat: "Servicios técnicos", over: "19%", save: "$2.800/mes" },
                            ].map((i) => (
                                <div key={i.cat} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/40 hover:border-emerald-500/30 transition-colors">
                                    <div>
                                        <p className="font-semibold text-sm">{i.cat}</p>
                                        <p className="text-xs text-red-500 font-bold">sobreprecio promedio: {i.over}</p>
                                    </div>
                                    <p className="font-black text-emerald-600 text-base">{i.save}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-emerald-500 rounded-3xl p-10 text-white text-center shadow-2xl shadow-emerald-500/30">
                        <PiggyBank className="w-16 h-16 mx-auto mb-4 opacity-90" />
                        <p className="text-emerald-100 font-bold uppercase text-sm tracking-widest mb-2">Ahorro anual potencial</p>
                        <p className="text-7xl font-black mb-1">$<AnimNum n={246000} /></p>
                        <p className="text-emerald-100/80 text-sm mb-6">Consorcio de 30 unidades · AMBA</p>
                        <div className="space-y-2 text-left mb-8">
                            {[
                                "Basado en datos reales de mercado",
                                "Sin cambiar todos los proveedores",
                                "Accionable desde la primera asamblea",
                            ].map(t => (
                                <div key={t} className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                    {t}
                                </div>
                            ))}
                        </div>
                        <Button asChild className="w-full bg-white text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl">
                            <Link to="/analizar">Ver mis oportunidades</Link>
                        </Button>
                    </div>
                </div>
            </div>
        ),
    },

    // ── 6: AUDIENCIAS ──────────────────────────────────────────────────────────
    {
        id: "audiencias",
        label: "Para Quién",
        bg: "from-background via-background to-background",
        content: (
            <div className="w-full h-full flex items-center justify-center container max-w-5xl">
                <div className="w-full space-y-10">
                    <div className="text-center space-y-3">
                        <Badge variant="outline" className="border-primary/30 bg-primary/8 text-primary font-bold px-4 py-1.5 text-sm">Para cada actor del consorcio</Badge>
                        <h2 className="text-5xl font-black tracking-tight">Todos ganan con datos.</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: Users, audience: "Propietarios &\nInquilinos",
                                color: { card: "border-primary/20", icon: "bg-primary/10 text-primary border-primary/20", badge: "bg-primary/5 text-primary border-primary/30" },
                                points: ["Entendé tu expensa en 2 minutos", "Detectá si estás pagando de más", "Compartí el análisis con vecinos", "Llevá propuestas concretas a la asamblea"],
                            },
                            {
                                icon: Shield, audience: "Administradores",
                                color: { card: "border-emerald-500/20", icon: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", badge: "bg-emerald-500/5 text-emerald-700 border-emerald-500/30" },
                                points: ["Reportes profesionales al instante", "Agenda de asamblea automática", "Historial completo de cada edificio", "Diferenciación competitiva"],
                            },
                            {
                                icon: Zap, audience: "Inversores",
                                color: { card: "border-purple-500/20", icon: "bg-purple-500/10 text-purple-600 border-purple-500/20", badge: "bg-purple-500/5 text-purple-700 border-purple-500/30" },
                                points: ["TAM: 1.2M unidades en AMBA", "Modelo de ingreso por análisis + suscripción", "Network effects por datos de mercado", "B2B2C: Administradores como canal"],
                            },
                        ].map((item) => (
                            <div key={item.audience} className={`rounded-2xl border p-6 ${item.color.card} bg-card/60 h-full`}>
                                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${item.color.icon}`}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <Badge variant="outline" className={`mb-4 text-xs ${item.color.badge}`}>{item.audience.replace("\n", " ")}</Badge>
                                <ul className="space-y-2.5">
                                    {item.points.map(p => (
                                        <li key={p} className="flex items-start gap-2 text-sm">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-muted-foreground">{p}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ),
    },

    // ── 7: COMPARACIÓN ─────────────────────────────────────────────────────────
    {
        id: "comparacion",
        label: "Comparación",
        bg: "from-background via-background to-background",
        content: (
            <div className="w-full h-full flex items-center justify-center container max-w-4xl">
                <div className="w-full space-y-8">
                    <div className="text-center space-y-3">
                        <h2 className="text-5xl font-black tracking-tight">ExpensaCheck vs. tradicional.</h2>
                    </div>
                    <div className="rounded-2xl border border-border/50 overflow-hidden">
                        <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-border/50 bg-muted/30">
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Aspecto</p>
                            <p className="text-sm font-bold text-center text-muted-foreground uppercase tracking-wider">Gestión tradicional</p>
                            <div className="text-center">
                                <Badge className="bg-primary/10 text-primary border-primary/20 font-bold">ExpensaCheck</Badge>
                            </div>
                        </div>
                        <div className="divide-y divide-border/30">
                            {[
                                ["Tiempo para entender la expensa", "1–2 horas", "2 minutos"],
                                ["Comparativa con mercado", false, true],
                                ["Detección de sobreprecios", false, true],
                                ["Agenda de asamblea automática", false, true],
                                ["Historial y evolución", "Excel manual", "Automático y visual"],
                                ["Disponible desde el celular", false, true],
                                ["Costo", "Consultoría $$$$", `Desde ${formatCurrency(EXPENSE_PRICE)}/análisis`],
                            ].map(([feat, trad, exp]) => (
                                <div key={feat as string} className="grid grid-cols-3 gap-4 px-6 py-3.5 items-center hover:bg-muted/20 transition-colors">
                                    <p className="text-sm font-medium">{feat as string}</p>
                                    <div className="text-center">
                                        {typeof trad === "boolean" ? (
                                            trad ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                                        ) : <p className="text-xs text-muted-foreground">{trad as string}</p>}
                                    </div>
                                    <div className="text-center">
                                        {typeof exp === "boolean" ? (
                                            exp ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                                        ) : <p className="text-xs font-bold text-primary">{exp as string}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        ),
    },

    // ── 8: PRECIOS ──────────────────────────────────────────────────────────────────
    {
        id: "precios",
        label: "Precios",
        bg: "from-background via-background to-background",
        content: (
            <div className="w-full h-full flex items-center justify-center container max-w-5xl">
                <div className="w-full space-y-8">
                    <div className="text-center space-y-2">
                        <Badge variant="outline" className="border-primary/30 bg-primary/8 text-primary font-bold px-4 py-1.5 text-sm">Precios</Badge>
                        <h2 className="text-4xl xl:text-5xl font-black tracking-tight">ROI desde el primer análisis.</h2>
                        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                            Si detecta $10.000/mes de ahorros, el retorno es 200× en el primer mes.
                        </p>
                    </div>

                    {/* ── Dos columnas: Individual | Custom (incluye Packs) ── */}
                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">

                        {/* ─ Individual ─ */}
                        <div className="rounded-3xl border border-border/50 bg-card/60 p-8 flex flex-col relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -z-10 group-hover:bg-primary/20 transition-colors duration-500"></div>
                            <div className="flex flex-col h-full">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-6 uppercase tracking-widest self-start">
                                        Individual
                                    </div>
                                    <div className="mb-6">
                                        <div className="flex items-baseline mb-1">
                                            <span className="text-5xl font-black text-foreground">{formatCurrency(EXPENSE_PRICE)}</span>
                                            <span className="text-muted-foreground text-sm ml-2">/ análisis</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-medium italic opacity-80">
                                            Equivale al valor de un café ☕
                                        </p>
                                    </div>

                                    <ul className="space-y-3 mb-8">
                                        {[
                                            "Análisis IA completo",
                                            "Comparativa de mercado",
                                            "Alertas por categoría",
                                            "Reporte PDF exportable",
                                            "Link compartible"
                                        ].map(f => (
                                            <li key={f} className="flex items-center gap-2 text-xs">
                                                <CheckCircle2 className="w-4 h-4 text-primary" />
                                                <span className="text-muted-foreground font-medium">{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <Button asChild variant="hero" size="xl" className="w-full rounded-2xl py-6 text-sm font-bold shadow-xl shadow-primary/25 mt-auto">
                                    <Link to="/analizar">
                                        Empezar ahora
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* ─ Custom (Administradores + Packs) ─ */}
                        <div className="rounded-3xl border border-primary/30 bg-card p-8 flex flex-col relative overflow-hidden group shadow-2xl shadow-primary/5">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 blur-3xl -z-10"></div>
                            <div className="flex flex-col h-full">
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-[10px] font-bold uppercase tracking-widest">
                                            Administradores
                                        </div>
                                        <Badge className="bg-primary text-primary-foreground font-bold flex items-center gap-1 text-[10px]">
                                            <Building2 className="w-3 h-3" /> Custom
                                        </Badge>
                                    </div>

                                    {/* Packs sub-section slim */}
                                    <div className="grid grid-cols-1 gap-1.5 mb-6">
                                        {PACKS.map(pack => {
                                            const pricePerUnit = EXPENSE_PRICE * (1 - pack.discount);
                                            const total = Math.round(pricePerUnit * pack.qty);
                                            return (
                                                <div key={pack.qty} className="rounded-xl border border-primary/10 bg-primary/5 px-3 py-2 flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-[10px] text-foreground">{pack.label}</span>
                                                        <span className="text-[8px] text-muted-foreground">{formatCurrency(Math.round(pricePerUnit))}/u.</span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-sm font-black text-primary">{formatCurrency(total)}</span>
                                                        <Badge variant="outline" className="text-[7px] border-emerald-500/20 text-emerald-600 bg-emerald-500/5 px-1 py-0 leading-tight">
                                                            -{Math.round(pack.discount * 100)}% dto
                                                        </Badge>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <ul className="space-y-2 mb-8 border-t border-border/30 pt-4">
                                        {[
                                            "Panel multi-consorcio",
                                            "Facturación automatizada",
                                            "Reportes avanzados IA",
                                            "Soporte 24/7"
                                        ].map(f => (
                                            <li key={f} className="flex items-center gap-2 text-xs">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                                                <span className="text-muted-foreground font-medium">{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <Button asChild variant="outline" size="xl" className="w-full rounded-2xl py-6 text-sm font-bold border-secondary/50 text-secondary hover:bg-secondary/10 mt-auto">
                                    <Link to="/contacto">
                                        Consultar Plan Custom
                                        <Briefcase className="w-4 h-4 ml-2" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ),
    },

    // ── 9: CTA ─────────────────────────────────────────────────────────────────
    {
        id: "cta",
        label: "Empezar",
        bg: "from-primary/5 via-background to-background",
        content: (
            <div className="w-full h-full flex items-center justify-center container max-w-4xl">
                <div className="relative w-full overflow-hidden rounded-[3rem] bg-primary p-12 md:p-20 text-primary-foreground shadow-2xl shadow-primary/30 text-center">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-60 h-60 bg-black/15 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />

                    <div className="relative z-10 space-y-8">
                        <div>
                            <Badge className="bg-white/20 border-white/30 text-white mb-5 text-sm font-bold px-5 py-2">
                                🎉 Primer análisis completamente gratis
                            </Badge>
                            <h2 className="text-5xl xl:text-7xl font-black tracking-tight leading-tight">
                                Empezá ahora.<br />No después.
                            </h2>
                        </div>
                        <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed">
                            Cada mes sin analizar tus expensas es un mes pagando de más. El análisis tarda 2 minutos y el primero es gratis.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button asChild size="xl" className="bg-white text-primary hover:bg-white/90 rounded-2xl px-12 font-bold text-lg shadow-xl">
                                <Link to="/analizar">
                                    Analizar mi primera expensa
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Link>
                            </Button>
                            <Button asChild size="xl" variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-2xl px-10 text-lg">
                                <Link to="/ejemplo">Ver demo primero</Link>
                            </Button>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-primary-foreground/70 font-medium pt-2">
                            {["Sin tarjeta de crédito", "Resultados en 2 minutos", "100% privado y seguro"].map(t => (
                                <div key={t} className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-white/70" />
                                    {t}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        ),
    },
];

// ─── Overview Grid ────────────────────────────────────────────────────────────
const SlideOverview = ({ current, onSelect, onClose }: { current: number; onSelect: (i: number) => void; onClose: () => void }) => (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col">
        <div className="flex items-center justify-between px-8 py-5 border-b border-border/50">
            <div className="flex items-center gap-2">
                <Logo className="w-8 h-8" />
                <span className="font-bold text-lg">ExpensaCheck · Vista general</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="w-5 h-5" />
            </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-w-6xl mx-auto">
                {slides.map((slide, i) => (
                    <button
                        key={slide.id}
                        onClick={() => { onSelect(i); onClose(); }}
                        className={`group relative rounded-2xl overflow-hidden aspect-video border-2 transition-all duration-200 text-left hover:scale-105 hover:shadow-xl ${i === current ? "border-primary shadow-lg shadow-primary/20" : "border-border/40 hover:border-primary/50"
                            }`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-muted/60 flex flex-col items-center justify-center p-3">
                            <p className="text-[11px] font-black text-muted-foreground/60 mb-1">{String(i + 1).padStart(2, '0')}</p>
                            <p className="text-xs font-bold text-center text-foreground leading-tight">{slide.label}</p>
                        </div>
                        {i === current && (
                            <div className="absolute inset-0 ring-2 ring-primary ring-inset rounded-2xl" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    </div>
);

// ─── Main Slide Deck ──────────────────────────────────────────────────────────
const PitchSlides = () => {
    const [current, setCurrent] = useState(0);
    const [direction, setDirection] = useState<"next" | "prev">("next");
    const [animating, setAnimating] = useState(false);
    const [overview, setOverview] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const total = slides.length;

    const goTo = useCallback((index: number, dir: "next" | "prev" = "next") => {
        if (animating || index === current) return;
        setDirection(dir);
        setAnimating(true);
        setTimeout(() => {
            setCurrent(index);
            setAnimating(false);
        }, 350);
    }, [animating, current]);

    const next = useCallback(() => {
        if (current < total - 1) goTo(current + 1, "next");
    }, [current, total, goTo]);

    const prev = useCallback(() => {
        if (current > 0) goTo(current - 1, "prev");
    }, [current, goTo]);

    // Keyboard navigation
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (overview) {
                if (e.key === "Escape") setOverview(false);
                return;
            }
            if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); next(); }
            if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); prev(); }
            if (e.key === "Escape" || e.key === "g") setOverview(true);
            if (e.key === "Home") goTo(0, "prev");
            if (e.key === "End") goTo(total - 1, "next");
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [next, prev, goTo, total, overview]);

    return (
        <div className="fixed inset-0 bg-background overflow-hidden flex flex-col select-none">
            {/* ── TOP BAR ── */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border/30 bg-background/80 backdrop-blur-md z-20 flex-shrink-0">
                <Link to="/" className="flex items-center gap-2 group">
                    <Logo className="w-7 h-7 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="font-bold text-sm hidden sm:block">ExpensaCheck</span>
                </Link>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full w-8 h-8"
                        onClick={() => setOverview(true)}
                        title="Vista general (G)"
                    >
                        <Grid3x3 className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full w-8 h-8"
                        onClick={() => setShowHelp(!showHelp)}
                        title="Atajos de teclado"
                    >
                        <Keyboard className="w-4 h-4" />
                    </Button>
                    <span className="text-xs font-bold text-muted-foreground tabular-nums w-10 text-right">
                        {current + 1}/{total}
                    </span>
                </div>
            </div>

            {/* ── SLIDE CONTENT ── */}
            <div className="flex-1 relative overflow-hidden">
                <div
                    key={current}
                    className={`absolute inset-0 transition-all duration-350 ease-in-out ${animating
                        ? direction === "next"
                            ? "opacity-0 translate-x-4"
                            : "opacity-0 -translate-x-4"
                        : "opacity-100 translate-x-0"
                        }`}
                >
                    <div className="w-full h-full flex flex-col py-6 px-6 md:px-10">
                        {slides[current].content}
                    </div>
                </div>
            </div>

            {/* ── BOTTOM BAR ── */}
            <div className="relative border-t border-border/20 bg-background/80 backdrop-blur-md z-20 flex-shrink-0">
                {/* Full-width progress line at the very top */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-muted/50">
                    <div
                        className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${((current + 1) / total) * 100}%` }}
                    />
                </div>

                <div className="flex items-center px-5 py-2.5 gap-4">
                    {/* Left: prev button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={prev}
                        disabled={current === 0}
                        className="rounded-full w-8 h-8 flex-shrink-0 text-muted-foreground hover:text-foreground disabled:opacity-20"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>

                    {/* Center: dot strip + slide label */}
                    <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                        {/* Dots */}
                        <div className="flex items-center gap-1">
                            {slides.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => goTo(i, i > current ? "next" : "prev")}
                                    className={`rounded-full transition-all duration-300 ${i === current
                                        ? "w-6 h-1.5 bg-primary"
                                        : "w-1.5 h-1.5 bg-border hover:bg-muted-foreground/50"
                                        }`}
                                />
                            ))}
                        </div>
                        {/* Current slide label */}
                        <p className="text-[11px] font-semibold text-muted-foreground/60 truncate">
                            <span className="text-muted-foreground/40 tabular-nums">{current + 1}/{total} · </span>
                            {slides[current].label}
                        </p>
                    </div>

                    {/* Right: next button */}
                    {current === total - 1 ? (
                        <Button
                            asChild
                            variant="hero"
                            size="sm"
                            className="rounded-full px-4 h-8 text-xs font-bold flex-shrink-0 shadow-lg shadow-primary/20"
                        >
                            <Link to="/analizar">
                                Empezar <ArrowRight className="w-3 h-3 ml-1" />
                            </Link>
                        </Button>
                    ) : (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={next}
                            className="rounded-full w-8 h-8 flex-shrink-0 text-muted-foreground hover:text-foreground"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* ── OVERVIEW ── */}
            {overview && (
                <SlideOverview
                    current={current}
                    onSelect={(i) => goTo(i, i > current ? "next" : "prev")}
                    onClose={() => setOverview(false)}
                />
            )}

            {/* ── HELP TOOLTIP ── */}
            {showHelp && (
                <div className="fixed bottom-20 right-6 z-40 bg-card border border-border/60 rounded-2xl shadow-2xl p-5 w-64 animate-fade-in-up text-sm">
                    <div className="flex items-center justify-between mb-3">
                        <p className="font-bold">Atajos de teclado</p>
                        <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full" onClick={() => setShowHelp(false)}>
                            <X className="w-3 h-3" />
                        </Button>
                    </div>
                    <div className="space-y-2 text-xs">
                        {[
                            ["→ / Space", "Siguiente"],
                            ["←", "Anterior"],
                            ["G / Esc", "Vista general"],
                            ["Home", "Primera slide"],
                            ["End", "Última slide"],
                        ].map(([key, action]) => (
                            <div key={key} className="flex items-center justify-between">
                                <kbd className="bg-muted px-2 py-0.5 rounded font-mono text-[10px] border border-border/60">{key}</kbd>
                                <span className="text-muted-foreground">{action}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PitchSlides;
