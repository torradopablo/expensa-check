import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/layout/ui/logo";
import { formatCurrency } from "@/services/formatters/currency";

const EXPENSE_PRICE = Number(import.meta.env.VITE_EXPENSE_PRICE || 5000);

// ─── Pack pricing helper ───────────────────────────────────────────────────────
// Packs: quantity → discount %
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
    Star,
    ChevronDown,
    Play,
    Sparkles,
    Globe,
    Lock,
    Clock,
    AlertTriangle,
    X,
    Menu,
    Presentation,
    Briefcase,
    Building2,
    Package,
} from "lucide-react";

// ─── Intersection Observer Hook ──────────────────────────────────────────────
const useInView = (threshold = 0.15) => {
    const ref = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const observer = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) setInView(true);
        }, { threshold });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [threshold]);
    return { ref, inView };
};

// ─── Animated counter ───────────────────────────────────────────────────────
const useCountUp = (target: number, duration = 1800, start = false) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!start) return;
        let startTime: number | null = null;
        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [target, duration, start]);
    return count;
};

// ─── FadeIn wrapper ──────────────────────────────────────────────────────────
const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => {
    const { ref, inView } = useInView(0.1);
    return (
        <div
            ref={ref}
            className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

// ─── StatCard ────────────────────────────────────────────────────────────────
const StatCard = ({ value, suffix, label, color }: { value: number; suffix: string; label: string; color: string }) => {
    const { ref, inView } = useInView();
    const count = useCountUp(value, 1800, inView);
    return (
        <div ref={ref} className="text-center p-6">
            <div className={`text-5xl md:text-6xl font-black tabular-nums ${color}`}>
                {count.toLocaleString("es-AR")}{suffix}
            </div>
            <p className="text-muted-foreground font-medium mt-2 text-sm uppercase tracking-widest">{label}</p>
        </div>
    );
};

// ─── FeatureCard ─────────────────────────────────────────────────────────────
const FeatureCard = ({ icon: Icon, title, description, badge, accent = "primary", delay = 0 }: {
    icon: React.ElementType; title: string; description: string; badge?: string; accent?: string; delay?: number;
}) => {
    const accentMap: Record<string, string> = {
        primary: "bg-primary/10 text-primary border-primary/20",
        emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        amber: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        purple: "bg-purple-500/10 text-purple-600 border-purple-500/20",
        blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        rose: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    };
    return (
        <FadeIn delay={delay}>
            <Card className="h-full hover:shadow-xl transition-all duration-300 border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/30 group">
                <CardContent className="p-6 md:p-8 flex flex-col h-full">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border mb-5 group-hover:scale-110 transition-transform ${accentMap[accent] || accentMap.primary}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-bold leading-tight">{title}</h3>
                        {badge && <Badge variant="outline" className="ml-2 flex-shrink-0 text-xs border-primary/30 bg-primary/5 text-primary">{badge}</Badge>}
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed flex-1">{description}</p>
                </CardContent>
            </Card>
        </FadeIn>
    );
};

// ─── Mock Analysis Card ───────────────────────────────────────────────────────
const MockAnalysisCard = () => (
    <div className="rounded-3xl overflow-hidden border border-border/40 bg-card shadow-2xl">
        <div className="bg-background/80 border-b border-border/40 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400/70" />
                <div className="w-3 h-3 rounded-full bg-amber-400/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/70" />
            </div>
            <div className="flex-1 mx-4 bg-muted/50 rounded-full h-6 max-w-[200px] mx-auto" />
            <div className="w-16" />
        </div>
        <div className="p-5 space-y-4">
            <div className="bg-primary rounded-2xl p-5 text-primary-foreground">
                <p className="text-xs font-bold opacity-70 mb-1">Torres del Parque · Dic 2025</p>
                <p className="text-3xl font-black">$125.800</p>
                <div className="flex items-center gap-1 mt-2 text-sm font-bold opacity-90">
                    <TrendingUp className="w-4 h-4" />
                    +27.7% vs mes anterior
                </div>
            </div>
            <div className="space-y-2">
                {[
                    { name: "Sueldos y Cargas", amount: "$58.200", pct: 46, status: "ok" },
                    { name: "Mantenimiento", amount: "$28.750", pct: 23, status: "attention" },
                    { name: "Servicios", amount: "$22.400", pct: 18, status: "ok" },
                    { name: "Expensas Extraord.", amount: "$16.450", pct: 13, status: "critical" },
                ].map((cat) => (
                    <div key={cat.name} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cat.status === "ok" ? "bg-emerald-500" : cat.status === "attention" ? "bg-amber-500" : "bg-red-500"}`} />
                        <span className="text-sm font-medium flex-1">{cat.name}</span>
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary/60 rounded-full" style={{ width: `${cat.pct}%` }} />
                        </div>
                        <span className="text-sm font-bold tabular-nums text-right w-20">{cat.amount}</span>
                    </div>
                ))}
            </div>
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3 flex gap-2">
                <Brain className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                    Mantenimiento aumentó 38% en 3 meses. El proveedor actual cobra 22% más que el promedio de tu zona.
                </p>
            </div>
        </div>
    </div>
);

// ─── ComparisonRow ────────────────────────────────────────────────────────────
const ComparisonRow = ({ feature, traditional, expensacheck }: { feature: string; traditional: string | boolean; expensacheck: string | boolean }) => (
    <div className="grid grid-cols-3 gap-4 py-4 border-b border-border/30 items-center">
        <p className="text-sm font-medium text-foreground">{feature}</p>
        <div className="text-center">
            {typeof traditional === "boolean"
                ? traditional ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                : <p className="text-xs text-muted-foreground">{traditional}</p>}
        </div>
        <div className="text-center">
            {typeof expensacheck === "boolean"
                ? expensacheck ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                : <p className="text-xs font-bold text-primary">{expensacheck}</p>}
        </div>
    </div>
);

// ─── Header ──────────────────────────────────────────────────────────────────
const PitchHeader = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const sections = [
        { label: "Problema", href: "#problema" },
        { label: "Features", href: "#features" },
        { label: "Ahorros", href: "#ahorros" },
        { label: "Cómo funciona", href: "#como-funciona" },
        { label: "Precios", href: "#precios" },
    ];
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
            <div className="container flex items-center justify-between h-20">
                <Link to="/" className="flex items-center gap-2 group">
                    <Logo className="w-10 h-10 group-hover:rotate-12 transition-transform duration-500" />
                    <span className="text-2xl font-bold tracking-tight text-foreground">ExpensaCheck</span>
                </Link>
                <nav className="hidden lg:flex items-center gap-6">
                    {sections.map(s => (
                        <a key={s.href} href={s.href} className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">{s.label}</a>
                    ))}
                </nav>
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm" className="hidden sm:flex rounded-full">
                        <Link to="/presentacion">
                            <Presentation className="w-4 h-4 mr-2" />
                            Modo slides
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="hidden sm:flex rounded-full">
                        <Link to="/ejemplo">Ver demo</Link>
                    </Button>
                    <Button asChild size="sm" className="rounded-full font-bold shadow-lg shadow-primary/20">
                        <Link to="/analizar">
                            Empezar gratis
                            <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuOpen(!menuOpen)}>
                        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </Button>
                </div>
            </div>
            {menuOpen && (
                <div className="lg:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl px-6 py-4 space-y-1">
                    {sections.map(s => (
                        <a key={s.href} href={s.href} onClick={() => setMenuOpen(false)} className="block py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground">{s.label}</a>
                    ))}
                    <Link to="/presentacion" className="block py-2.5 text-sm font-semibold text-primary">🎯 Ver en modo slides</Link>
                </div>
            )}
        </header>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const Pitch = () => (
    <div className="min-h-screen bg-background overflow-x-hidden">
        <PitchHeader />

        {/* ── HERO ─────────────────────────────────────────────────────────────── */}
        <section className="relative pt-40 pb-24 overflow-hidden">
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-[5%] left-[10%] w-[40%] h-[50%] bg-primary/8 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 right-[5%] w-[35%] h-[40%] bg-secondary/8 blur-[100px] rounded-full" />
                <div className="absolute top-[30%] right-[20%] w-[20%] h-[30%] bg-emerald-500/5 blur-[80px] rounded-full" />
            </div>
            <div className="container max-w-5xl text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-bold mb-8">
                    <Sparkles className="w-4 h-4" />
                    IA aplicada a la gestión de expensas · Disponible hoy
                </div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-6">
                    Tu consorcio está
                    <br />
                    <span className="bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
                        pagando de más.
                    </span>
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-3xl mx-auto mb-10 leading-relaxed">
                    ExpensaCheck analiza tus expensas con IA, detecta sobreprecios de proveedores y te da el poder de negociar con datos reales.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                    <Button asChild size="xl" variant="hero" className="rounded-2xl px-10 shadow-2xl shadow-primary/25 text-lg">
                        <Link to="/analizar">
                            Analizar mi expensa gratis
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Link>
                    </Button>
                    <Button asChild size="xl" variant="outline" className="rounded-2xl px-10 text-lg border-border/60">
                        <Link to="/ejemplo">
                            <Play className="w-5 h-5 mr-2" />
                            Ver demo interactivo
                        </Link>
                    </Button>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground font-medium mb-4">
                    {["Primer análisis gratis", "Sin tarjeta de crédito", "Resultados en 2 minutos", "100% privado y seguro"].map(t => (
                        <div key={t} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            {t}
                        </div>
                    ))}
                </div>
                {/* Slides CTA */}
                <div className="mt-2">
                    <Link to="/presentacion" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground/60 hover:text-primary transition-colors border border-border/30 hover:border-primary/30 rounded-full px-4 py-2">
                        <Presentation className="w-3.5 h-3.5" />
                        ¿Preferís verlo como presentación? → Modo slides
                    </Link>
                </div>
                <div className="mt-14 relative max-w-2xl mx-auto">
                    <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-secondary/10 to-emerald-500/20 blur-2xl rounded-[3rem] -z-10" />
                    <MockAnalysisCard />
                </div>
            </div>
            <div className="flex justify-center mt-12">
                <a href="#problema" className="flex flex-col items-center gap-2 text-muted-foreground/50 hover:text-muted-foreground transition-colors group">
                    <span className="text-xs font-semibold uppercase tracking-widest">Seguir viendo</span>
                    <ChevronDown className="w-5 h-5 animate-bounce group-hover:text-primary" />
                </a>
            </div>
        </section>

        {/* ── STATS ────────────────────────────────────────────────────────────── */}
        <section className="border-y border-border/40 bg-muted/20 py-4">
            <div className="container max-w-4xl">
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border/40">
                    <StatCard value={35} suffix="%" label="Ahorro promedio detectado" color="text-emerald-500" />
                    <StatCard value={2} suffix="min" label="Tiempo de análisis" color="text-primary" />
                    <StatCard value={18} suffix="K+" label="Datos de mercado" color="text-secondary" />
                    <StatCard value={100} suffix="%" label="Privacidad garantizada" color="text-foreground" />
                </div>
            </div>
        </section>

        {/* ── PROBLEMA ─────────────────────────────────────────────────────────── */}
        <section id="problema" className="py-28">
            <div className="container max-w-5xl">
                <FadeIn>
                    <div className="text-center mb-16">
                        <Badge variant="outline" className="mb-4 border-red-400/30 bg-red-500/5 text-red-500">El problema real</Badge>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">La gestión de expensas está rota.</h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">El 70% de los consorcios pagan sobreprecios sin saberlo. La opacidad protege a los proveedores, no a los vecinos.</p>
                    </div>
                </FadeIn>
                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        { icon: FileText, title: "PDFs incomprensibles", desc: "Las liquidaciones son documentos técnicos y confusos. Nadie los entiende del todo — ni los administradores.", bg: "bg-red-500/10 border-red-500/20 text-red-500" },
                        { icon: AlertTriangle, title: "Sin referencia de mercado", desc: "¿El ascensor cuesta caro? ¿La limpieza está bien? Sin datos comparativos es imposible saberlo.", bg: "bg-amber-500/10 border-amber-500/20 text-amber-500" },
                        { icon: Clock, title: "Reuniones sin datos", desc: "Las asambleas terminan en discusiones sin resolución. Falta información concreta para tomar decisiones.", bg: "bg-blue-500/10 border-blue-500/20 text-blue-500" },
                    ].map((item, i) => {
                        const [bgBorder, colorClass] = [item.bg.split(" ").slice(0, 2).join(" "), item.bg.split(" ")[2]];
                        return (
                            <FadeIn key={item.title} delay={i * 100}>
                                <Card className={`border h-full ${bgBorder}`}>
                                    <CardContent className="p-7">
                                        <item.icon className={`w-8 h-8 mb-4 ${colorClass}`} />
                                        <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                                    </CardContent>
                                </Card>
                            </FadeIn>
                        );
                    })}
                </div>
            </div>
        </section>

        {/* ── SOLUCIÓN ─────────────────────────────────────────────────────────── */}
        <section className="py-24 bg-muted/20 border-y border-border/40">
            <div className="container max-w-5xl">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <FadeIn>
                        <div>
                            <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary">La solución</Badge>
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6 leading-tight">Inteligencia artificial al servicio del consorcio.</h2>
                            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">Subís el PDF, nuestra IA lo analiza en segundos, lo compara con miles de datos de mercado y te dice exactamente dónde están pagando de más — con nombres y cifras.</p>
                            <div className="space-y-4">
                                {[
                                    { icon: Brain, text: "Extracción automática de rubros con IA de última generación" },
                                    { icon: BarChart3, text: "Comparación con base de datos de consorcios similares de tu zona" },
                                    { icon: PiggyBank, text: "Detección de sobreprecios con alternativas reales y ahorros estimados" },
                                    { icon: Users, text: "Preparación de agenda de asamblea con propuestas de acción" },
                                ].map(item => (
                                    <div key={item.text} className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 border border-primary/20">
                                            <item.icon className="w-4 h-4 text-primary" />
                                        </div>
                                        <p className="text-sm font-medium leading-relaxed">{item.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </FadeIn>
                    <FadeIn delay={200}>
                        <div className="relative">
                            <div className="absolute -inset-4 bg-emerald-500/10 blur-2xl rounded-3xl -z-10" />
                            <div className="bg-emerald-500 rounded-3xl p-8 text-white shadow-2xl shadow-emerald-500/25 space-y-5">
                                <div className="flex items-center gap-3">
                                    <PiggyBank className="w-10 h-10 opacity-90" />
                                    <div>
                                        <p className="text-emerald-100 text-sm font-bold">Detector de Ahorros</p>
                                        <p className="text-2xl font-black">Podés ahorrar $18.200/mes</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {[
                                        { p: "AscensorService SA", c: "Mantenimiento", s: "$8.400", pct: "−34%" },
                                        { p: "CleanPro Consorcio", c: "Limpieza", s: "$6.100", pct: "−28%" },
                                        { p: "Seguridad Total SRL", c: "Vigilancia", s: "$3.700", pct: "−19%" },
                                    ].map(i => (
                                        <div key={i.p} className="bg-white/15 rounded-xl px-4 py-3 flex items-center justify-between">
                                            <div><p className="font-bold text-sm">{i.p}</p><p className="text-emerald-100/80 text-xs">{i.c}</p></div>
                                            <div className="text-right"><p className="font-black">{i.s}</p><p className="text-emerald-200 text-xs font-bold">{i.pct}</p></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
        <section id="features" className="py-28">
            <div className="container max-w-6xl">
                <FadeIn>
                    <div className="text-center mb-16">
                        <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary">Todo incluido</Badge>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Una plataforma completa.</h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Desde el análisis inicial hasta la preparación de la asamblea — todo en un solo lugar.</p>
                    </div>
                </FadeIn>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FeatureCard icon={Brain} title="Análisis con IA" description="Nuestra IA extrae y categoriza automáticamente todos los rubros del PDF. Sin formularios, sin carga manual." badge="Core" accent="primary" delay={0} />
                    <FeatureCard icon={PiggyBank} title="Detector de Ahorros" description="Cruzamos tus proveedores con nuestra base de datos regional. Detectamos sobreprecio con alternativas reales." badge="⭐ Top" accent="emerald" delay={100} />
                    <FeatureCard icon={BarChart3} title="Evolución histórica" description="Seguí cada rubro mes a mes. Identifica tendencias y detecta subas desmedidas antes que sean un problema." accent="blue" delay={200} />
                    <FeatureCard icon={Users} title="Preparar Reunión con IA" description="Generamos la agenda de tu asamblea con puntos urgentes, propuestas concretas y datos de respaldo." badge="Nuevo" accent="purple" delay={300} />
                    <FeatureCard icon={MessageSquare} title="Comentarios colaborativos" description="Vecinos y administradores pueden agregar contexto a cada análisis. Memoria institucional del consorcio." accent="amber" delay={400} />
                    <FeatureCard icon={Globe} title="Link compartible" description="Compartí el análisis con otros vecinos sin que necesiten crear una cuenta. Transparencia sin fricción." accent="rose" delay={500} />
                </div>
            </div>
        </section>

        {/* ── AHORROS ──────────────────────────────────────────────────────────── */}
        <section id="ahorros" className="py-28 bg-emerald-500/5 border-y border-emerald-500/15">
            <div className="container max-w-5xl">
                <FadeIn>
                    <div className="text-center mb-16">
                        <Badge variant="outline" className="mb-4 border-emerald-500/30 bg-emerald-500/10 text-emerald-700">Recuperá tu dinero</Badge>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Los números no mienten.</h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            En promedio detectamos ahorros de entre <strong className="text-emerald-600">$8.000 y $25.000 por mes</strong> en consorcios medianos de AMBA.
                        </p>
                    </div>
                </FadeIn>
                <div className="grid md:grid-cols-2 gap-8 items-start">
                    <FadeIn delay={100}>
                        <div className="space-y-4">
                            {[
                                { category: "Ascensores y mantenimiento", overprice: "38%", saving: "$8.400/mes", detail: "Contratos plurianuales sin actualización de precios de mercado." },
                                { category: "Limpieza y portería", overprice: "28%", saving: "$6.100/mes", detail: "Mucho margen comparando prestadores del mismo barrio." },
                                { category: "Seguros", overprice: "22%", saving: "$3.200/mes", detail: "Pólizas renovadas automáticamente sin comparación de mercado." },
                                { category: "Servicios técnicos", overprice: "19%", saving: "$2.800/mes", detail: "Proveedores de zona muchas veces son mejores y más baratos." },
                            ].map((item, i) => (
                                <FadeIn key={item.category} delay={i * 80}>
                                    <div className="p-4 rounded-2xl bg-background border border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="font-bold text-sm">{item.category}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                                            </div>
                                            <div className="text-right ml-4 flex-shrink-0">
                                                <p className="text-lg font-black text-emerald-600">{item.saving}</p>
                                                <Badge variant="outline" className="text-[10px] border-red-400/30 bg-red-500/5 text-red-500 py-0">sobreprecio {item.overprice}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </FadeIn>
                    <FadeIn delay={200}>
                        <Card className="bg-emerald-500 text-white border-0 rounded-3xl shadow-2xl shadow-emerald-500/30 overflow-hidden">
                            <CardContent className="p-10 text-center">
                                <PiggyBank className="w-16 h-16 mx-auto mb-4 opacity-90" />
                                <p className="text-emerald-100 font-bold uppercase text-sm tracking-widest mb-3">Ahorro anual potencial</p>
                                <p className="text-6xl font-black mb-2">$246.000</p>
                                <p className="text-emerald-100 text-sm mb-8">En un consorcio de 30 unidades de AMBA</p>
                                <div className="space-y-3 text-left mb-8">
                                    {["Detectado con datos reales de mercado", "Sin cambiar todos los proveedores", "Accionable desde la primera asamblea"].map(t => (
                                        <div key={t} className="flex items-center gap-2 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
                                            {t}
                                        </div>
                                    ))}
                                </div>
                                <Button asChild className="w-full bg-white text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl">
                                    <Link to="/analizar">Ver mis oportunidades</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </FadeIn>
                </div>
            </div>
        </section>

        {/* ── CÓMO FUNCIONA ────────────────────────────────────────────────────── */}
        <section id="como-funciona" className="py-28">
            <div className="container max-w-5xl">
                <FadeIn>
                    <div className="text-center mb-16">
                        <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary">Simple por diseño</Badge>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Del PDF al insight en 3 pasos.</h2>
                    </div>
                </FadeIn>
                <div className="relative">
                    <div className="hidden lg:block absolute top-16 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-primary/30 via-primary/60 to-primary/30" />
                    <div className="grid lg:grid-cols-3 gap-8">
                        {[
                            { step: "01", icon: FileText, title: "Subís la expensa", desc: "Arrastrás el PDF de tu liquidación a la plataforma. Hasta 15MB. Sin configuración previa.", note: "Sin formularios." },
                            { step: "02", icon: Brain, title: "La IA la analiza", desc: "En 2 minutos tenés análisis completo: rubros, categorías, comparativa y alertas.", note: "Gemini AI + datos regionales." },
                            { step: "03", icon: TrendingDown, title: "Tomás acción", desc: "Identificás sobreprecios, compartís el reporte y llevás propuestas concretas a la asamblea.", note: "Reporte PDF exportable." },
                        ].map((item, i) => (
                            <FadeIn key={item.step} delay={i * 150}>
                                <div className="text-center group">
                                    <div className="relative inline-block mb-6">
                                        <div className="w-32 h-32 rounded-3xl bg-primary/10 border-2 border-primary/20 mx-auto flex items-center justify-center group-hover:border-primary/60 group-hover:bg-primary/15 transition-all duration-300">
                                            <item.icon className="w-12 h-12 text-primary" />
                                        </div>
                                        <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-black flex items-center justify-center">{item.step}</div>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed mb-2">{item.desc}</p>
                                    <p className="text-xs text-muted-foreground/60 font-medium">{item.note}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
                <FadeIn delay={400}>
                    <div className="text-center mt-14">
                        <Button asChild size="xl" variant="hero" className="rounded-2xl px-12 shadow-xl shadow-primary/20">
                            <Link to="/ejemplo">Ver análisis de ejemplo completo <ArrowRight className="w-5 h-5 ml-2" /></Link>
                        </Button>
                    </div>
                </FadeIn>
            </div>
        </section>

        {/* ── COMPARACIÓN ──────────────────────────────────────────────────────── */}
        <section className="py-24 bg-muted/20 border-y border-border/40">
            <div className="container max-w-4xl">
                <FadeIn><div className="text-center mb-12"><h2 className="text-4xl font-black tracking-tight mb-4">ExpensaCheck vs. la forma tradicional</h2></div></FadeIn>
                <FadeIn delay={100}>
                    <Card className="overflow-hidden border-border/50">
                        <CardContent className="p-0">
                            <div className="grid grid-cols-3 gap-4 px-6 py-5 border-b border-border/50 bg-muted/30">
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Aspecto</p>
                                <p className="text-sm font-bold text-center text-muted-foreground uppercase tracking-wider">Gestión tradicional</p>
                                <div className="text-center"><Badge className="bg-primary/10 text-primary border-primary/20 font-bold">ExpensaCheck</Badge></div>
                            </div>
                            <div className="px-6">
                                <ComparisonRow feature="Tiempo para entender la expensa" traditional="1-2 horas" expensacheck="2 minutos" />
                                <ComparisonRow feature="Comparativa con mercado" traditional={false} expensacheck={true} />
                                <ComparisonRow feature="Detección de sobreprecios" traditional={false} expensacheck={true} />
                                <ComparisonRow feature="Agenda de asamblea automática" traditional={false} expensacheck={true} />
                                <ComparisonRow feature="Historial y evolución" traditional="Excel manual" expensacheck="Automático y visual" />
                                <ComparisonRow feature="Accesible desde el celular" traditional={false} expensacheck={true} />
                                <ComparisonRow feature="Costo de implementación" traditional="Consultoría $$$" expensacheck={`Desde ${formatCurrency(EXPENSE_PRICE)}/análisis`} />
                            </div>
                        </CardContent>
                    </Card>
                </FadeIn>
            </div>
        </section>

        {/* ── AUDIENCIAS ────────────────────────────────────────────────────────── */}
        <section className="py-28">
            <div className="container max-w-5xl">
                <FadeIn>
                    <div className="text-center mb-16">
                        <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary">Para cada actor del consorcio</Badge>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Todos ganan con datos.</h2>
                    </div>
                </FadeIn>
                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        { icon: Users, aud: "Propietarios & Inquilinos", c: { card: "border-primary/20", icon: "bg-primary/10 text-primary border-primary/20", badge: "bg-primary/5 text-primary border-primary/30" }, pts: ["Entendé tu expensa en 2 minutos", "Detectá si estás pagando de más", "Compartí el análisis con vecinos", "Llevá propuestas concretas a la asamblea"] },
                        { icon: Shield, aud: "Administradores", c: { card: "border-emerald-500/20", icon: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", badge: "bg-emerald-500/5 text-emerald-700 border-emerald-500/30" }, pts: ["Reportes profesionales al instante", "Agenda de asamblea automática", "Historial completo de cada edificio", "Diferenciación competitiva"] },
                        { icon: Zap, aud: "Inversores", c: { card: "border-purple-500/20", icon: "bg-purple-500/10 text-purple-600 border-purple-500/20", badge: "bg-purple-500/5 text-purple-700 border-purple-500/30" }, pts: ["TAM: 1.2M unidades en AMBA", "Modelo por análisis + suscripción", "Network effects por datos de mercado", "B2B2C: Administradores como canal"] },
                    ].map((item, i) => (
                        <FadeIn key={item.aud} delay={i * 120}>
                            <Card className={`h-full border ${item.c.card} bg-card/60`}>
                                <CardContent className="p-7">
                                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 ${item.c.icon}`}><item.icon className="w-6 h-6" /></div>
                                    <Badge variant="outline" className={`mb-4 ${item.c.badge}`}>{item.aud}</Badge>
                                    <ul className="space-y-3">
                                        {item.pts.map(p => (
                                            <li key={p} className="flex items-start gap-2 text-sm">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-muted-foreground leading-relaxed">{p}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </section>

        {/* ── PRECIOS ───────────────────────────────────────────────────────────── */}
        <section id="precios" className="py-28 bg-muted/20 border-y border-border/40">
            <div className="container max-w-6xl">
                <FadeIn>
                    <div className="text-center mb-16">
                        <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary">Precios</Badge>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">ROI desde el primer análisis.</h2>
                        <p className="text-xl text-muted-foreground">Si detecta $10.000/mes de ahorros, el retorno es 200× en el primer mes.</p>
                    </div>
                </FadeIn>

                {/* ── Dos columnas: Individual | Custom (incluye Packs) ── */}
                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">

                    {/* ─ Individual ─ */}
                    <FadeIn delay={0}>
                        <Card className="border-border/50 bg-card/60 h-full flex flex-col relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -z-10 group-hover:bg-primary/20 transition-colors duration-500"></div>
                            <CardContent className="p-10 flex flex-col h-full">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-8 uppercase tracking-widest">
                                        Uso Individual
                                    </div>
                                    <div className="mb-8">
                                        <div className="flex items-baseline mb-1">
                                            <span className="text-6xl font-black text-foreground">{formatCurrency(EXPENSE_PRICE)}</span>
                                            <span className="text-muted-foreground text-lg ml-2">/ análisis</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium italic pl-1 flex items-center gap-1.5 opacity-80">
                                            (Equivale al valor de un café ☕)
                                        </p>
                                    </div>

                                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 mb-10">
                                        <p className="text-sm font-bold text-primary flex items-center gap-2">
                                            <span className="text-lg">🎁</span>
                                            ¡Primer análisis BONIFICADO!
                                        </p>
                                    </div>

                                    <ul className="space-y-4 mb-10">
                                        {[
                                            "Análisis completo con IA",
                                            "Comparativa de mercado",
                                            "Alertas por categoría",
                                            "Reporte PDF exportable",
                                            "Link compartible",
                                            "Dashboard histórico"
                                        ].map(f => (
                                            <li key={f} className="flex items-center gap-3 text-base">
                                                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                                                </div>
                                                <span className="text-muted-foreground font-medium">{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <Button asChild variant="hero" size="xl" className="w-full rounded-2xl py-7 text-lg font-bold shadow-xl shadow-primary/25 hover:scale-[1.02] transition-transform mt-auto">
                                    <Link to="/analizar">
                                        Empezar ahora
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </FadeIn>

                    {/* ─ Custom (Administradores + Packs) ─ */}
                    <FadeIn delay={120}>
                        <Card className="border-primary/30 border bg-card h-full flex flex-col relative overflow-hidden group shadow-2xl shadow-primary/5">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 blur-3xl -z-10"></div>
                            <CardContent className="p-10 flex flex-col h-full">
                                <div>
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold uppercase tracking-widest">
                                            Administradores
                                        </div>
                                        <Badge className="bg-primary text-primary-foreground font-bold flex items-center gap-1">
                                            <Building2 className="w-3 h-3" /> Custom
                                        </Badge>
                                    </div>

                                    <div className="mb-8">
                                        <h3 className="text-3xl font-black mb-2 text-foreground">Planes por volumen</h3>
                                        <p className="text-muted-foreground text-sm font-medium">Ideal para administrar múltiples consorcios con descuentos exclusivos.</p>
                                    </div>

                                    {/* Packs sub-section */}
                                    <div className="space-y-3 mb-10">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 flex items-center gap-2">
                                            <Package className="w-3 h-3 text-primary" /> Packs de análisis prepagos
                                        </p>
                                        <div className="grid grid-cols-1 gap-2.5">
                                            {PACKS.map(pack => {
                                                const pricePerUnit = EXPENSE_PRICE * (1 - pack.discount);
                                                const total = Math.round(pricePerUnit * pack.qty);
                                                return (
                                                    <div key={pack.qty} className="rounded-xl border border-primary/10 bg-primary/5 px-4 py-3 flex items-center justify-between group/pack hover:border-primary/30 transition-colors">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-sm text-foreground">{pack.label} análisis</span>
                                                            <span className="text-[10px] text-muted-foreground">{formatCurrency(Math.round(pricePerUnit))}/u.</span>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-xl font-black text-primary">{formatCurrency(total)}</span>
                                                            <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-600 bg-emerald-500/5 px-1.5 py-0 leading-tight">
                                                                -{Math.round(pack.discount * 100)}% dto
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <ul className="space-y-4 mb-10 border-t border-border/40 pt-8">
                                        {[
                                            "Facturación A/B automatizada",
                                            "Panel multi-consorcio centralizado",
                                            "Reportes de gestión con inteligencia de red",
                                            "Soporte prioritario 7x24"
                                        ].map(f => (
                                            <li key={f} className="flex items-center gap-3 text-sm">
                                                <CheckCircle2 className="w-4 h-4 text-secondary flex-shrink-0" />
                                                <span className="text-muted-foreground font-medium">{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <Button asChild variant="outline" size="xl" className="w-full rounded-2xl py-7 text-lg font-bold border-secondary/50 text-secondary hover:bg-secondary/10 mt-auto group/btn">
                                    <Link to="/contacto">
                                        Consultar Plan Custom
                                        <Briefcase className="w-5 h-5 ml-2 group-hover/btn:scale-110 transition-transform" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </FadeIn>
                </div>
            </div>
        </section>

        {/* ── TESTIMONIALS ─────────────────────────────────────────────────────── */}
        <section className="py-28">
            <div className="container max-w-5xl">
                <FadeIn><div className="text-center mb-16"><h2 className="text-4xl font-black tracking-tight mb-4">Lo que dicen nuestros usuarios.</h2></div></FadeIn>
                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        { q: "Nunca entendí bien mis expensas hasta que usé ExpensaCheck. En 5 minutos supe que el mantenimiento del ascensor nos cobraban 40% más que en edificios similares del barrio.", name: "Lucía M.", role: "Propietaria · Palermo, CABA" },
                        { q: "Como administrador, ahora puedo mostrarles a mis clientes reportes profesionales automáticos. Me diferencia de la competencia y ahorra horas de trabajo.", name: "Diego R.", role: "Administrador de Consorcios · San Isidro, GBA Norte" },
                        { q: "Llevamos los datos de ExpensaCheck a la asamblea y logramos renegociar el contrato de limpieza. Ahorramos $6.000 por mes a partir del mes siguiente.", name: "Fernanda K.", role: "Delegada de Consorcio · Belgrano, CABA" },
                    ].map((t, i) => (
                        <FadeIn key={t.name} delay={i * 100}>
                            <Card className="border-border/40 bg-card/60 h-full">
                                <CardContent className="p-7 flex flex-col h-full">
                                    <div className="flex gap-1 mb-4">{[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}</div>
                                    <p className="text-sm text-foreground leading-relaxed flex-1 italic mb-5">"{t.q}"</p>
                                    <div><p className="font-bold text-sm">{t.name}</p><p className="text-xs text-muted-foreground">{t.role}</p></div>
                                </CardContent>
                            </Card>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </section>

        {/* ── SEGURIDAD ─────────────────────────────────────────────────────────── */}
        <section className="py-20 bg-muted/20 border-y border-border/40">
            <div className="container max-w-4xl">
                <div className="grid md:grid-cols-4 gap-6">
                    {[
                        { icon: Lock, title: "Datos encriptados", text: "Toda la información se procesa con encriptación de extremo a extremo." },
                        { icon: Shield, title: "Sin reventa de datos", text: "Tus documentos nunca son compartidos ni vendidos a terceros." },
                        { icon: Globe, title: "Hosting en Argentina", text: "Infraestructura local para cumplir con la ley de datos personales." },
                        { icon: Zap, title: "Disponible 24/7", text: "Plataforma en la nube con 99.9% de uptime garantizado." },
                    ].map((item, i) => (
                        <FadeIn key={item.title} delay={i * 80}>
                            <div className="text-center p-6">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4"><item.icon className="w-6 h-6 text-primary" /></div>
                                <p className="font-bold text-sm mb-2">{item.title}</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </section>

        {/* ── CTA FINAL ─────────────────────────────────────────────────────────── */}
        <section className="py-32">
            <div className="container max-w-4xl text-center">
                <FadeIn>
                    <div className="relative">
                        <div className="absolute -inset-8 bg-gradient-to-r from-primary/10 via-secondary/10 to-emerald-500/10 blur-3xl rounded-[4rem] -z-10" />
                        <div className="relative overflow-hidden rounded-[3rem] bg-primary p-12 md:p-20 text-primary-foreground shadow-2xl shadow-primary/30">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/15 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />
                            <div className="relative z-10">
                                <Badge className="bg-white/20 text-white border-white/30 mb-6 text-sm font-bold">🎉 Primer análisis completamente gratuito</Badge>
                                <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">Empezá ahora.<br />No después.</h2>
                                <p className="text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">Cada mes sin analizar tus expensas es un mes pagando de más. El análisis tarda 2 minutos y el primero es gratis.</p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Button asChild size="xl" className="bg-white text-primary hover:bg-white/90 rounded-2xl px-12 font-bold text-lg shadow-xl">
                                        <Link to="/analizar">Analizar mi primera expensa <ArrowRight className="w-5 h-5 ml-2" /></Link>
                                    </Button>
                                    <Button asChild size="xl" variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-2xl px-10 text-lg">
                                        <Link to="/presentacion">
                                            <Presentation className="w-5 h-5 mr-2" />
                                            Ver en modo slides
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </section>

        {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
        <footer className="border-t border-border/40 py-12">
            <div className="container max-w-5xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <Link to="/" className="flex items-center gap-2">
                        <Logo className="w-8 h-8" />
                        <span className="text-lg font-bold text-foreground">ExpensaCheck</span>
                    </Link>
                    <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                        <Link to="/ejemplo" className="hover:text-foreground transition-colors">Demo</Link>
                        <Link to="/presentacion" className="hover:text-foreground transition-colors">Slides</Link>
                        <Link to="/terminos" className="hover:text-foreground transition-colors">Términos</Link>
                        <Link to="/privacidad" className="hover:text-foreground transition-colors">Privacidad</Link>
                        <Link to="/contacto" className="hover:text-foreground transition-colors">Contacto</Link>
                    </div>
                    <p className="text-xs text-muted-foreground/60">© 2026 ExpensaCheck · Hecho con ❤️ en Argentina</p>
                </div>
            </div>
        </footer>
    </div>
);

export default Pitch;
