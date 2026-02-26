import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText,
  Shield,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Upload,
  BarChart3,
  Download,
  Users,
  LineChart,
  Menu,
  X,
  Home,
  Briefcase,
  Building2,
  User,
  LayoutList
} from "lucide-react";
import { Logo } from "@/components/layout/ui/logo";

const AIProcessingMockup = () => {
  return (
    <div className="w-full bg-background/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-border/50 relative overflow-hidden group/mockup">
      {/* Dynamic background glow */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 blur-[80px] rounded-full group-hover/mockup:bg-primary/30 transition-colors duration-700"></div>
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-secondary/20 blur-[80px] rounded-full group-hover/mockup:bg-secondary/30 transition-colors duration-700"></div>

      {/* MacOS like Header */}
      <div className="h-14 border-b border-border/50 bg-muted/10 flex items-center px-6 gap-2 relative z-10">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive/60"></div>
          <div className="w-3 h-3 rounded-full bg-status-attention/60"></div>
          <div className="w-3 h-3 rounded-full bg-status-ok/60"></div>
        </div>
        <div className="mx-auto flex items-center gap-2 bg-background/50 px-4 py-1.5 rounded-full border border-border/50 shadow-sm text-xs font-medium text-muted-foreground mr-16">
          <FileText className="w-3.5 h-3.5" />
          expensas_agosto_2026.pdf
        </div>
      </div>

      <div className="p-8 space-y-8 relative z-10">
        <div className="flex justify-between items-center bg-card/50 backdrop-blur-md rounded-2xl p-5 border border-border/40 shadow-sm">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
              <Shield className="w-5 h-5 text-primary" />
              Procesamiento IA
            </h3>
            <p className="text-sm text-muted-foreground font-light">Analizando patrones de consumo...</p>
          </div>
          <div className="relative w-14 h-14">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/20" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="283" strokeDashoffset="75" className="text-primary animate-[spin_4s_linear_infinite]" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-bold text-sm text-foreground">
              74%
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-status-ok" /> Lectura de documento</span>
              <span className="text-status-ok">100%</span>
            </div>
            <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
              <div className="h-full bg-status-ok w-full"></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-status-ok" /> Extracción de subcategorías</span>
              <span className="text-status-ok">100%</span>
            </div>
            <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
              <div className="h-full bg-status-ok w-full"></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-foreground flex items-center gap-1.5">
                <span className="w-4 h-4 flex items-center justify-center">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin"></span>
                </span>
                Analisis de precios
              </span>
              <span className="text-primary animate-pulse">Comparando...</span>
            </div>
            <div className="h-2 w-full bg-muted overflow-hidden rounded-full relative">
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/50 to-primary w-[65%] rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)] relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20 w-full animate-[slide-in-right_2s_ease-in-out_infinite]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Card mock */}
        <div className="bg-status-attention/10 border border-status-attention/20 rounded-2xl p-4 flex gap-4 animate-fade-in-up shadow-sm" style={{ animationDelay: '0.5s' }}>
          <div className="w-10 h-10 rounded-full bg-status-attention/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-status-attention" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Sobrecosto detectado</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">El abono en <strong className="text-foreground">Ascensores</strong> es un 22% mayor al mercado.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
import { formatCurrency } from "@/services/formatters/currency";

const EXPENSE_PRICE = Number(import.meta.env.VITE_EXPENSE_PRICE || 5000);

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container flex items-center justify-between h-20">
        <Link to="/" className="flex items-center gap-2 group">
          <Logo className="w-10 h-10 group-hover:rotate-12 transition-transform duration-500" />
          <span className="text-2xl font-bold tracking-tight bg-clip-text text-foreground">
            ExpensaCheck
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-10">
          <a href="#como-funciona" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Cómo funciona
          </a>
          <a href="#beneficios" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Beneficios
          </a>
          <a href="#precios" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Precios
          </a>
          {session && (
            <>
              <Link to="/historial" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Mi historial
              </Link>
              <Link to="/preparar-reunion" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Preparar Reunión
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {session ? (
            <Button asChild variant="ghost" size="icon" title="Mi Perfil" className="rounded-full hover:bg-accent">
              <Link to="/perfil">
                <User className="w-5 h-5" />
              </Link>
            </Button>
          ) : (
            <Link to="/auth" className="hidden sm:inline-flex text-sm font-medium hover:text-primary transition-colors">
              Iniciar sesión
            </Link>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>

          <Button asChild size="lg" className="hidden sm:inline-flex rounded-full shadow-lg shadow-primary/25 font-semibold">
            <Link to="/analizar">Analizar ahora</Link>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border animate-fade-in">
          <nav className="container py-8 flex flex-col gap-6">
            <a
              href="#como-funciona"
              className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Cómo funciona
            </a>
            <a
              href="#beneficios"
              className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Beneficios
            </a>
            <a
              href="#precios"
              className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Precios
            </a>
            {session && (
              <>
                <Link
                  to="/historial"
                  className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mi historial
                </Link>
                <Link
                  to="/preparar-reunion"
                  className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Preparar Reunión
                </Link>
                <Link
                  to="/perfil"
                  className="text-lg font-medium text-primary flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-5 h-5" />
                  Mi Perfil
                </Link>
              </>
            )}
            {!session && (
              <Link
                to="/auth"
                className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Iniciar sesión
              </Link>
            )}
            <Button asChild size="xl" className="mt-4 w-full rounded-2xl">
              <Link to="/analizar" onClick={() => setMobileMenuOpen(false)}>
                Analizar expensas
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

const HeroSection = () => (
  <section className="relative pt-36 pb-32 overflow-hidden flex flex-col items-center justify-center min-h-[95vh]">
    <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
      <div className="absolute top-[-10%] right-[10%] w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full mix-blend-multiply animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] left-[10%] w-[600px] h-[600px] bg-secondary/20 blur-[150px] rounded-full mix-blend-multiply animate-pulse-slow" style={{ animationDelay: "2s" }}></div>
    </div>

    <div className="container relative z-10">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/50 backdrop-blur-md border border-border/50 text-foreground text-sm font-medium shadow-sm hover:border-primary/30 transition-colors">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]"></span>
            Inteligencia Artificial para tu Consorcio
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-bold leading-[1.05] tracking-tight text-foreground">
            Expensas claras,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-secondary animate-gradient-x">
              decisiones inteligentes
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-xl leading-relaxed font-light">
            Analizá tus expensas comparándolas con una <strong className="text-foreground font-medium">red de edificios</strong> y el impacto de la <strong className="text-foreground font-medium">inflación</strong>. Claridad total impulsada por IA.
          </p>
          <div className="flex flex-col sm:flex-row gap-5">
            <Button asChild size="xl" className="rounded-2xl px-10 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 relative group overflow-hidden bg-primary text-primary-foreground border-none">
              <Link to="/analizar">
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                Analizar expensas
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl" className="rounded-2xl px-10 border-border/50 bg-background/50 backdrop-blur-md hover:bg-accent/50 hover:text-foreground hover:-translate-y-0.5 transition-all duration-300">
              <Link to="/ejemplo">Ver demostración</Link>
            </Button>
          </div>

          <div className="flex items-center gap-8 pt-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground/80">
              <CheckCircle2 className="w-4 h-4 text-primary/80" />
              Pago por uso
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground/80">
              <CheckCircle2 className="w-4 h-4 text-primary/80" />
              Sin suscripción
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground/80">
              <CheckCircle2 className="w-4 h-4 text-primary/80" />
              Reporte PDF
            </div>
          </div>
        </div>

        <div className="relative animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="relative z-10 p-1 rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-border/30 to-secondary/20 backdrop-blur-sm group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-border/30 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur border-0 rounded-[2.5rem]"></div>
            <div className="bg-background/90 rounded-[2.4rem] overflow-hidden p-2 shadow-2xl relative z-10 transition-transform duration-700 group-hover:scale-[1.01]">
              <AIProcessingMockup />
            </div>
          </div>

          <div className="absolute -bottom-8 -left-8 bg-background/80 backdrop-blur-2xl rounded-2xl p-4 border border-border/50 shadow-xl animate-float z-20 hidden md:block group hover:border-primary/50 transition-colors cursor-default">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Detección de Desvíos</p>
                <p className="text-xs text-muted-foreground">Comparativa IA</p>
              </div>
            </div>
          </div>

          <div className="absolute -top-6 -right-6 bg-background/80 backdrop-blur-2xl rounded-2xl p-4 border border-border/50 shadow-xl animate-float z-20 hidden md:block group hover:border-secondary/50 transition-colors cursor-default" style={{ animationDelay: "1.5s" }}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Contexto Real</p>
                <p className="text-xs text-muted-foreground">Inflación vs Histórico</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const HowItWorksSection = () => {
  const steps = [
    {
      icon: Upload,
      title: "1. Carga e Inteligencia",
      description: "Subí tu PDF. Nuestra IA no solo extrae rubros, sino que los desglosa en subcategorías (ej. sueldos vs cargas sociales) para una claridad total."
    },
    {
      icon: TrendingUp,
      title: "2. Evolución y Mercado",
      description: "Comparamos tus gastos contra tu historial, la inflación acumulada y una red de edificios similares."
    },
    {
      icon: LayoutList,
      title: "3. IA y Temario de Asamblea",
      description: "Detectamos anomalías automáticamente y generamos un orden del día con argumentos sólidos para tu próxima reunión."
    }
  ];

  return (
    <section id="como-funciona" className="py-32 relative">
      <div className="container">
        <div className="text-center space-y-6 mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Proceso simple, resultados potentes</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Diseñado para ser intuitivo y darte la información que importa en segundos.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative group animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="absolute -top-5 -left-5 w-10 h-10 rounded-xl bg-background border border-border/50 shadow-sm text-foreground flex items-center justify-center text-lg font-semibold z-10 group-hover:border-primary/40 group-hover:text-primary transition-colors duration-500">
                {index + 1}
              </div>
              <div className="bg-card/20 backdrop-blur-xl rounded-[2rem] p-10 border border-border/40 hover:border-primary/30 hover:bg-card/40 transition-all duration-500 h-full group-hover:-translate-y-1 shadow-sm hover:shadow-xl hover:shadow-primary/5">
                <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 border border-primary/10">
                  <step.icon className="w-7 h-7 text-primary/80" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed font-light text-[1.05rem]">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const BenefitsSection = () => {
  const pillars = [
    {
      icon: Users,
      title: "Comunidad Inteligente",
      description: "Referencia de mercado real",
      detail: "Contrastamos tus gastos con una red de edificios similares para saber si tus costos están optimizados.",
      color: "secondary"
    },
    {
      icon: LineChart,
      title: "Economía de Escala",
      description: "Detección de sobreprecios",
      detail: "Analizamos rubro por rubro para identificar áreas donde podrías estar pagando más de lo necesario.",
      color: "primary"
    },
    {
      icon: TrendingUp,
      title: "Visión a Largo Plazo",
      description: "Seguimiento de tendencias",
      detail: "Evolución histórica detallada que te permite anticipar gastos y planificar el futuro de tu consorcio.",
      color: "accent"
    }
  ];

  return (
    <section id="beneficios" className="py-32 bg-muted/30">
      <div className="container">
        <div className="text-center space-y-6 mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Información que genera valor</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            Herramientas inteligentes para una visión clara y transparente de tus gastos compartidos.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {pillars.map((pillar, index) => (
            <div
              key={index}
              className="bg-card/20 backdrop-blur-xl rounded-[2rem] p-8 md:p-12 border border-border/40 hover:bg-card/30 hover:border-primary/20 hover:-translate-y-1 transition-all duration-500 animate-fade-in-up group hover:shadow-xl hover:shadow-primary/5"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-14 h-14 rounded-2xl ${pillar.color === 'primary' ? 'bg-primary/5 border-primary/10' : pillar.color === 'secondary' ? 'bg-secondary/5 border-secondary/10' : 'bg-accent/30 border-border/30'} border flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
                <pillar.icon className={`w-7 h-7 ${pillar.color === 'primary' ? 'text-primary/80' : pillar.color === 'secondary' ? 'text-secondary/80' : 'text-foreground/80'}`} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{pillar.title}</h3>
              <p className="text-primary/80 text-[10px] font-bold mb-4 uppercase tracking-[0.2em]">{pillar.description}</p>
              <p className="text-muted-foreground leading-relaxed font-light">{pillar.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const UseCasesSection = () => {
  const useCases = [
    {
      icon: Home,
      role: "Propietarios",
      title: "Justicia en tus Gastos",
      scenarios: [
        "¿Recibiste un aumento injustificado?",
        "Compará con edificios de tu zona",
        "Argumentos sólidos para asambleas",
        "Control total de tu patrimonio"
      ]
    },
    {
      icon: Briefcase,
      role: "Administradores",
      title: "Gestión Transparente",
      scenarios: [
        "Reportes visuales para reuniones",
        "Justificá gastos con IA y datos",
        "Transparencia que genera confianza",
        "Anticipate a las dudas de los vecinos"
      ]
    },
    {
      icon: Building2,
      role: "Inversores",
      title: "Rentabilidad Clara",
      scenarios: [
        "Evaluá costos antes de comprar",
        "Optimizá el ROI de tus unidades",
        "Detectá ineficiencias operativas",
        "Data-driven real estate management"
      ]
    }
  ];

  return (
    <section id="casos-de-uso" className="py-32">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center space-y-6 mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Diseñado para cada perfil</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Diferentes necesidades, una misma herramienta poderosa para dar claridad financiera.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className="group bg-card/20 backdrop-blur-xl rounded-[2rem] p-10 border border-border/40 hover:bg-card/40 hover:border-primary/20 hover:-translate-y-1 transition-all duration-500 animate-fade-in-up shadow-sm hover:shadow-xl hover:shadow-primary/5"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex flex-col items-start text-left mb-8">
                <div className="w-14 h-14 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                  <useCase.icon className="w-6 h-6 text-primary/80" />
                </div>
                <span className="text-[10px] font-bold text-primary/80 uppercase tracking-[0.2em] mb-2">{useCase.role}</span>
                <h3 className="text-xl font-semibold mb-1 text-foreground">{useCase.title}</h3>
              </div>
              <ul className="space-y-4">
                {useCase.scenarios.map((scenario, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-2 flex-shrink-0" />
                    <span className="text-muted-foreground font-light leading-relaxed">{scenario}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="text-center mt-20">
          <Button asChild variant="outline" size="xl" className="rounded-2xl px-12 border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300">
            <Link to="/analizar" className="flex items-center gap-3">
              Empezar ahora
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

const PricingSection = () => (
  <section id="precios" className="py-32 relative overflow-hidden">
    {/* Background Glow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full -z-10"></div>

    <div className="container">
      <div className="text-center space-y-6 mb-20 animate-fade-in">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Planes a tu medida</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
          Elegí la opción que mejor se adapte a tus necesidades. Transparencia total desde el primer momento.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-10 max-w-5xl mx-auto">
        {/* Individual Card */}
        <div className="bg-card/20 backdrop-blur-2xl rounded-[2.5rem] p-10 border border-primary/20 shadow-xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 animate-fade-in-up relative overflow-hidden flex flex-col h-full group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -z-10"></div>

          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-8 shadow-sm uppercase tracking-widest">
              Uso Individual
            </div>

            <div className="mb-8">
              <div className="flex items-baseline mb-1">
                <span className="text-6xl font-bold text-foreground">{formatCurrency(EXPENSE_PRICE)}</span>
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
                "Comparativa con Red de Edificios",
                "Desglose Detallado por Subcategorías",
                "Monitoreo de Impacto Inflacionario",
                "IA con Detección de Desvíos",
                "Reporte Exportable",
                "Dashboard Histórico de Evolución"
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-muted-foreground font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button asChild variant="hero" size="xl" className="w-full rounded-2xl py-7 text-lg font-bold shadow-xl shadow-primary/25 hover:scale-[1.02] transition-transform mt-auto">
            <Link to="/analizar">
              Empezar Análisis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>

          <div className="flex items-center justify-center gap-2 mt-6">
            <Shield className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground font-medium">
              Pago seguro vía Mercado Pago
            </p>
          </div>
        </div>

        {/* Administrators Card */}
        <div className="bg-card/20 backdrop-blur-2xl rounded-[2.5rem] p-10 border border-border/40 hover:border-border/60 shadow-xl hover:shadow-2xl transition-all duration-500 animate-fade-in-up relative overflow-hidden flex flex-col h-full border-dashed group" style={{ animationDelay: "0.2s" }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-3xl -z-10"></div>

          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold mb-8 shadow-sm uppercase tracking-widest">
              Administradores
            </div>

            <div className="mb-8">
              <span className="text-5xl font-bold text-foreground">Custom</span>
              <p className="text-muted-foreground mt-2 font-medium">Planes por volumen de edificios</p>
            </div>

            <div className="bg-secondary/5 border border-secondary/10 rounded-2xl p-4 mb-10">
              <p className="text-sm font-bold text-secondary flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Soporte para múltiples consorcios
              </p>
            </div>

            <ul className="space-y-4 mb-10">
              {[
                "Membresías Mensuales Flexibles",
                "Panel Multi-Consorcio Centralizado",
                "Facturación A/B Automatizada",
                "Reportes de Analisis de Gestión",
                "Soporte Prioritario Dedicado"
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                  </div>
                  <span className="text-muted-foreground font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button asChild variant="outline" size="xl" className="w-full rounded-2xl py-7 text-lg font-bold border-secondary/50 text-secondary hover:bg-secondary/10 transition-all mt-auto">
            <Link to="/contacto">
              Contactar al equipo
              <Briefcase className="w-5 h-5 ml-2" />
            </Link>
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-6 font-medium">
            Atención personalizada para grandes volúmenes
          </p>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="py-20 border-t border-border bg-background relative overflow-hidden">
    <div className="container">
      <div className="grid md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-2 space-y-6">
          <Link to="/" className="flex items-center gap-3 group">
            <Logo className="w-10 h-10 group-hover:rotate-12 transition-transform" />
            <span className="text-2xl font-bold tracking-tight">ExpensaCheck</span>
          </Link>
          <p className="text-muted-foreground text-lg max-w-sm">
            Nuestra misión es brindar transparencia y claridad financiera a cada consorcio de Argentina utilizando inteligencia artificial y datos de mercado.
          </p>
        </div>
        <div>
          <h4 className="font-bold text-lg mb-6">Producto</h4>
          <ul className="space-y-4">
            <li><a href="#como-funciona" className="text-muted-foreground hover:text-primary transition-colors font-medium">Cómo funciona</a></li>
            <li><a href="#beneficios" className="text-muted-foreground hover:text-primary transition-colors font-medium">Beneficios</a></li>
            <li><a href="#precios" className="text-muted-foreground hover:text-primary transition-colors font-medium">Precios</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-lg mb-6">Legal</h4>
          <ul className="space-y-4">
            <li><Link to="/terminos" className="text-muted-foreground hover:text-primary transition-colors font-medium">Términos</Link></li>
            <li><Link to="/privacidad" className="text-muted-foreground hover:text-primary transition-colors font-medium">Privacidad</Link></li>
            <li><Link to="/contacto" className="text-muted-foreground hover:text-primary transition-colors font-medium">Contacto</Link></li>
          </ul>
        </div>
      </div>
      <div className="pt-12 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-muted-foreground font-medium">
          © 2026 ExpensaCheck. Todos los derechos reservados.
        </p>
        <div className="flex gap-8">
          {/* Social icons could go here */}
        </div>
      </div>
    </div>
  </footer>
);

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <BenefitsSection />
        <UseCasesSection />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
