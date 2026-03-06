import { useState, useCallback, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  Upload,
  FileText,
  ArrowLeft,
  ArrowRight,
  X,
  Loader2,
  CreditCard,
  LogOut,
  AlertCircle,
  User,
  Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { Logo } from "@/components/layout/ui/logo";
import { formatCurrency } from "@/services/formatters/currency";

const EXPENSE_PRICE = Number(import.meta.env.VITE_EXPENSE_PRICE || 5000);

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(undefined); // undefined = loading
  const [session, setSession] = useState<any>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isLoading = user === undefined;

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
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground hidden md:block">
              {user.email}
            </span>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="icon" title="Mi Perfil" className="rounded-full hover:bg-accent">
                <Link to="/perfil">
                  <User className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Cerrar sesión" className="rounded-full hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

const steps = [
  { number: 1, title: "Subir expensa", description: "Cargá tu archivo" },
  { number: 2, title: "Confirmar pago", description: "Pago seguro" },
  { number: 3, title: "Ver análisis", description: "Tu reporte listo" },
];

const Stepper = ({ currentStep }: { currentStep: number }) => (
  <div className="flex items-center justify-center gap-6 mb-16 lg:mb-24">
    {steps.map((step, index) => (
      <div key={step.number} className="flex items-center">
        <div className="flex flex-col items-center group">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold transition-all duration-500 border-2 ${currentStep >= step.number
              ? "bg-primary border-primary text-primary-foreground shadow-2xl shadow-primary/20 scale-110"
              : "bg-muted/50 border-border text-muted-foreground"
              }`}
          >
            {currentStep > step.number ? (
              <CheckCircle2 className="w-7 h-7" />
            ) : (
              step.number
            )}
          </div>
          <div className="mt-4 text-center">
            <p className={`text-sm font-bold tracking-tight uppercase ${currentStep >= step.number ? "text-foreground" : "text-muted-foreground"}`}>
              {step.title}
            </p>
            <p className="text-xs text-muted-foreground hidden md:block mt-1 font-medium">{step.description}</p>
          </div>
        </div>
        {index < steps.length - 1 && (
          <div className="px-4">
            <div
              className={`w-12 sm:w-20 lg:w-32 h-1 rounded-full transition-all duration-1000 ${currentStep > step.number ? "bg-primary shadow-sm shadow-primary/50" : "bg-muted"
                }`}
            />
          </div>
        )}
      </div>
    ))}
  </div>
);

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ACCEPTED_TYPES = ["application/pdf"];

const UploadStep = ({
  file,
  onFileSelect,
  onFileRemove,
  onNext,
  isUploading
}: {
  file: File | null;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  onNext: () => void;
  isUploading: boolean;
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File): boolean => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Formato no válido", {
        description: "Por favor, subí solo archivos PDF."
      });
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Archivo demasiado grande", {
        description: "El límite máximo por archivo es de 15MB."
      });
      return false;
    }
    return true;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && validateFile(droppedFile)) {
      onFileSelect(droppedFile);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && validateFile(selectedFile)) {
      onFileSelect(selectedFile);
    }
  }, [onFileSelect]);

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="text-center pt-12">
          <CardTitle className="text-3xl font-extrabold tracking-tight">Preparar Análisis</CardTitle>
          <CardDescription className="text-lg">
            Subí tu liquidación de expensas para que nuestra IA la procese.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-12 space-y-8">
          {!file ? (
            <label
              className={`relative flex flex-col items-center justify-center w-full h-80 border-2 border-dashed rounded-[2rem] cursor-pointer transition-all duration-300 ${isDragging
                ? "border-primary bg-primary/5 scale-[0.99]"
                : "border-border/50 hover:border-primary/50 bg-background/50 hover:bg-background/80"
                }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                className="hidden"
                accept=".pdf"
                onChange={handleFileInput}
              />
              <div className="flex flex-col items-center gap-6">
                <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                  <Upload className="w-12 h-12 text-primary animate-bounce-slow" />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    Arrastrá tu archivo aquí
                  </p>
                  <p className="text-muted-foreground font-medium mt-2">
                    o hacé clic para buscar en tu equipo (PDF, máx. 15MB)
                  </p>
                </div>
              </div>
            </label>
          ) : (
            <div className="flex items-center gap-6 p-6 bg-primary/10 border border-primary/20 rounded-3xl group transition-all duration-300">
              <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/20">
                <FileText className="w-10 h-10 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xl font-bold truncate text-foreground leading-none mb-2">{file.name}</p>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-md bg-primary/20 text-primary text-[10px] font-black uppercase">
                    PDF Ready
                  </span>
                  <p className="text-sm font-medium text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onFileRemove}
                className="flex-shrink-0 w-12 h-12 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Quitar archivo"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6">
            <Button variant="ghost" asChild className="rounded-xl px-8 hover:bg-accent order-2 sm:order-1 w-full sm:w-auto">
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Link>
            </Button>
            <Button
              variant="hero"
              size="xl"
              disabled={!file || isUploading}
              onClick={onNext}
              className="rounded-2xl px-12 shadow-xl shadow-primary/20 order-1 sm:order-2 w-full sm:w-auto font-bold"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  Continuar al pago
                  <ArrowRight className="w-5 h-5 ml-3" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-12 text-center text-muted-foreground animate-fade-in" style={{ animationDelay: "0.5s" }}>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-full border border-border/50 text-xs font-semibold uppercase tracking-widest leading-none">
          <Shield className="w-3.5 h-3.5 text-primary" />
          Procesamiento seguro y confidencial
        </div>
      </div>
    </div>
  );
};

const PaymentStep = ({
  onBack,
  onNext,
  isProcessing,
  isFreeAnalysis = false,
  isFirstAnalysis = false
}: {
  onBack: () => void;
  onNext: () => void;
  isProcessing: boolean;
  isFreeAnalysis?: boolean;
  isFirstAnalysis?: boolean;
}) => {
  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="text-center pt-12">
          <CardTitle className="text-3xl font-extrabold tracking-tight">
            {isFreeAnalysis
              ? (isFirstAnalysis ? "¡Promoción Exclusiva!" : "Acceso Bonificado")
              : "Confirmar Pago"
            }
          </CardTitle>
          <CardDescription className="text-lg">
            {isFreeAnalysis
              ? (isFirstAnalysis
                ? "Disfrutá de tu primer análisis sin costo alguno."
                : "Tenés habilitado un análisis sin cargo."
              )
              : "Pago único y seguro para procesar tu documento."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-12 space-y-8">
          {isFreeAnalysis && (
            <div className="bg-primary/10 border border-primary/20 rounded-[1.5rem] p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/20">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold text-primary mb-1">
                  {isFirstAnalysis ? "🎉 Primer Análisis GRATIS" : "Análisis Bonificado"}
                </p>
                <p className="text-muted-foreground font-medium">
                  {isFirstAnalysis
                    ? "Conocé cómo la IA puede darte claridad absoluta hoy mismo."
                    : "Tu beneficio ha sido aplicado correctamente."
                  }
                </p>
              </div>
            </div>
          )}

          <div className="bg-muted/30 backdrop-blur-sm rounded-[2rem] p-8 border border-border/50 space-y-6">
            <div className="flex justify-between items-center text-lg font-medium">
              <span className="text-muted-foreground tracking-tight">Servicio de Análisis IA</span>
              <span className={`${isFreeAnalysis ? "line-through text-muted-foreground opacity-50" : "text-foreground font-bold"}`}>
                {formatCurrency(EXPENSE_PRICE)} ARS
              </span>
            </div>
            <div className="border-t border-border/50 pt-6">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">Total a abonar</span>
                  <span className={`text-4xl font-black ${isFreeAnalysis ? "text-primary" : "text-foreground"}`}>
                    {isFreeAnalysis ? "GRATIS" : `${formatCurrency(EXPENSE_PRICE)} ARS`}
                  </span>
                </div>
                {!isFreeAnalysis && (
                  <p className="text-xs text-right text-muted-foreground font-medium italic">
                    (Equivale al valor de un café ☕)
                  </p>
                )}
              </div>
            </div>
          </div>

          {!isFreeAnalysis && (
            <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0 border border-secondary/20">
                <CreditCard className="w-6 h-6 text-secondary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Checkout seguro con Mercado Pago</p>
                <p className="text-xs text-muted-foreground font-medium mt-1">
                  Tarjetas de crédito, débito y dinero disponible. Procesamiento instantáneo.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              "Extracción IA de alta precisión",
              "Detección de anomalías en rubros",
              "Referencia de mercado actualizada",
              "Resumen ejecutivo informativo"
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <CheckCircle2 className="w-3 h-3 text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-center text-muted-foreground italic px-4">
            * ExpensaCheck es una herramienta de asistencia basada en IA. No constituye asesoría contable ni profesional.
          </p>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
            <Button variant="ghost" onClick={onBack} disabled={isProcessing} className="rounded-xl px-8 order-2 sm:order-1 w-full sm:w-auto font-medium">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <Button
              variant="hero"
              size="xl"
              onClick={onNext}
              disabled={isProcessing}
              className="rounded-2xl px-12 shadow-xl shadow-primary/20 order-1 sm:order-2 w-full sm:w-auto font-bold"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  {isFreeAnalysis ? "Comenzar Análisis" : "Confirmar y Pagar"}
                  <ArrowRight className="w-5 h-5 ml-3" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ProcessingStep = () => (
  <div className="max-w-2xl mx-auto text-center animate-fade-in-up">
    <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-2xl rounded-[3rem] overflow-hidden py-16 px-10">
      <CardContent className="space-y-10">
        <div className="relative mx-auto w-32 h-32">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-30"></div>
          <div className="relative w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30 backdrop-blur-md">
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-4xl font-extrabold tracking-tight">Procesando tu Expensa</h2>
          <p className="text-xl text-muted-foreground font-medium max-w-sm mx-auto">
            Nuestra IA está extrayendo y comparando miles de puntos de datos.
          </p>
        </div>

        <div className="bg-muted/30 rounded-[2rem] p-8 space-y-4 max-w-sm mx-auto border border-border/50">
          {[
            "Extrayendo rubros del PDF",
            "Cruzando con red de edificios",
            "Identificando desvíos significativos",
            "Generando resumen operativo"
          ].map((step, index) => (
            <div
              key={index}
              className="flex items-center gap-4 text-left group transition-all"
              style={{ animationDelay: `${index * 0.8}s` }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-sm shadow-primary/50" />
              <span className="text-base font-medium text-muted-foreground group-hover:text-foreground transition-colors">{step}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

const PaymentSuccessHandler = ({
  analysisId,
  file,
  onProcessingComplete
}: {
  analysisId: string;
  file: File | null;
  onProcessingComplete: (id: string) => void;
}) => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processExpense = async () => {
      let currentFile = file;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("No autorizado");

        // If file is missing (e.g. refresh), try to fetch it from storage using analysisId
        if (!currentFile) {
          console.log("File missing in state, checking for file_url in DB...");
          const { data: analysis, error: fetchError } = await supabase
            .from("expense_analyses")
            .select("file_url")
            .eq("id", analysisId)
            .single();

          if (!fetchError && analysis?.file_url) {
            console.log("File URL found in DB, attempting to download...");
            const { data: fileBlob, error: downloadError } = await supabase.storage
              .from("expense-files")
              .download(analysis.file_url);

            if (!downloadError && fileBlob) {
              const fileName = analysis.file_url.split('/').pop() || "expensa.pdf";
              currentFile = new File([fileBlob], fileName, { type: "application/pdf" });
              console.log("File recovered from storage");
            } else {
              console.warn("Could not download file from storage, Edge Function will try to recover it");
            }
          }
        }

        const formData = new FormData();
        if (currentFile) {
          formData.append("file", currentFile);
        }
        formData.append("analysisId", analysisId);

        // Update status to processing
        await supabase
          .from("expense_analyses")
          .update({ status: "processing" })
          .eq("id", analysisId);

        console.log("Starting analysis processing...");
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-expense`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al procesar la expensa");
        }

        onProcessingComplete(analysisId);
      } catch (err: any) {
        console.error("Processing error:", err);
        setError(err.message || "Error al procesar la expensa");
        setIsProcessing(false);

        // Mark as failed in DB
        await supabase
          .from("expense_analyses")
          .update({ status: "failed" })
          .eq("id", analysisId);
      }
    };

    processExpense();
  }, [analysisId, file, onProcessingComplete]);

  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center animate-fade-in-up">
        <Card variant="elevated">
          <CardContent className="py-16 space-y-6">
            <div className="w-20 h-20 rounded-full bg-destructive/10 mx-auto flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Error al procesar</h2>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button asChild variant="hero">
              <Link to="/analizar">Intentar de nuevo</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <ProcessingStep />;
};

const Analizar = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [isFreeAnalysis, setIsFreeAnalysis] = useState(false);
  const [isFirstAnalysis, setIsFirstAnalysis] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for payment callback
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const returnedAnalysisId = searchParams.get("analysisId");

    if (paymentStatus === "success" && returnedAnalysisId) {
      setAnalysisId(returnedAnalysisId);
      setShowPaymentSuccess(true);
      setCurrentStep(3);
      toast.success("¡Pago confirmado! Procesando tu expensa...");
    } else if (paymentStatus === "failure") {
      toast.error("El pago no se pudo completar. Por favor, intentá de nuevo.");
    } else if (paymentStatus === "pending") {
      toast.info("Tu pago está pendiente de confirmación.");
    }
  }, [searchParams]);

  useEffect(() => {
    // Check auth state and user's analysis history
    const checkAuthAndAnalyses = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

      // Check if user has free_analysis flag
      const { data: profile } = await supabase
        .from("profiles")
        .select("free_analysis")
        .eq("user_id", session.user.id)
        .single();

      if (profile?.free_analysis) {
        setIsFreeAnalysis(true);
      } else {
        // Check if this is the user's first analysis (promo: first one is free)
        const { count } = await supabase
          .from("expense_analyses")
          .select("id", { count: "exact", head: true })
          .eq("user_id", session.user.id)
          .eq("status", "completed");

        // If no completed analyses, first one is free
        if (count === 0) {
          setIsFirstAnalysis(true);
          setIsFreeAnalysis(true);
        }
      }

      setIsLoading(false);
    };

    checkAuthAndAnalyses();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

      // Check if user has free_analysis flag
      const { data: profile } = await supabase
        .from("profiles")
        .select("free_analysis")
        .eq("user_id", session.user.id)
        .single();

      if (profile?.free_analysis) {
        setIsFreeAnalysis(true);
      } else {
        // Check if this is the user's first analysis
        const { count } = await supabase
          .from("expense_analyses")
          .select("id", { count: "exact", head: true })
          .eq("user_id", session.user.id)
          .eq("status", "completed");

        if (count === 0) {
          setIsFirstAnalysis(true);
          setIsFreeAnalysis(true);
        }
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Store file in sessionStorage for payment return
  useEffect(() => {
    if (file) {
      // We can't store File objects in sessionStorage, so we store metadata
      // The user will need to re-upload if they close the browser
      sessionStorage.setItem("pendingFile", JSON.stringify({
        name: file.name,
        size: file.size,
        type: file.type,
      }));
    }
  }, [file]);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
  };

  const handleFileRemove = () => {
    setFile(null);
    sessionStorage.removeItem("pendingFile");
  };

  const handleUploadAndContinue = async () => {
    if (!file || !user) return;

    setIsUploading(true);
    try {
      // 1. Create analysis record
      const { data: analysis, error: analysisError } = await supabase
        .from("expense_analyses")
        .insert({
          user_id: user.id,
          period: new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" }),
          total_amount: 0,
          status: "pending",
        })
        .select()
        .single();

      if (analysisError) throw analysisError;

      // 2. Upload file to storage immediately
      const filePath = `${user.id}/${analysis.id}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("expense-files")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 3. Update record with file_url
      const { error: updateError } = await supabase
        .from("expense_analyses")
        .update({ file_url: filePath })
        .eq("id", analysis.id);

      if (updateError) throw updateError;

      setAnalysisId(analysis.id);
      setCurrentStep(2);
    } catch (error: any) {
      console.error("Error creating analysis or uploading file:", error);
      toast.error("Error al preparar el análisis. Por favor, intentá de nuevo.");
    } finally {
      setIsUploading(false);
    }
  };

  // Free analysis if: user has free_analysis flag OR this is their first analysis (promo)
  const skipPayment = isFreeAnalysis;

  const handlePaymentOrSkip = async () => {
    if (skipPayment) {
      // Skip payment and process directly
      setIsProcessing(true);
      setShowPaymentSuccess(true);
      setCurrentStep(3);
      if (isFirstAnalysis) {
        toast.success("¡Tu primer análisis es gratis! 🎉");
      } else {
        toast.info("Análisis gratuito");
      }
    } else {
      await handlePayment();
    }
  };

  const handlePayment = async () => {
    if (!analysisId || !file) return;

    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No autorizado");

      // Create Mercado Pago payment preference
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          analysisId,
          successUrl: `${window.location.origin}/analizar?payment=success&analysisId=${analysisId}`,
          failureUrl: `${window.location.origin}/analizar?payment=failure`,
        },
      });

      if (error) throw error;

      if (data?.initPoint) {
        // Store file temporarily before redirect
        // Note: The file object itself can't be persisted across page loads
        // After payment, user will need to re-upload if they closed the tab

        // Redirect to Mercado Pago checkout
        window.location.href = data.initPoint;
      } else {
        throw new Error("No se recibió la URL de pago");
      }
    } catch (error: any) {
      console.error("Error creating payment:", error);
      toast.error(error.message || "Error al iniciar el pago");
      setIsProcessing(false);
    }
  };

  const handleProcessingComplete = (id: string) => {
    toast.success("¡Análisis completado!");
    navigate(`/analisis/${id}`);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 -z-10 bg-background">
        <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-primary/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-secondary/5 blur-[120px] rounded-full"></div>
      </div>

      <Header />
      <main className="pt-32 pb-32">
        <div className="container relative z-10">
          <Stepper currentStep={currentStep} />

          {currentStep === 1 && !showPaymentSuccess && (
            <UploadStep
              file={file}
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              onNext={handleUploadAndContinue}
              isUploading={isUploading}
            />
          )}

          {currentStep === 2 && !showPaymentSuccess && (
            <PaymentStep
              onBack={() => setCurrentStep(1)}
              onNext={handlePaymentOrSkip}
              isProcessing={isProcessing}
              isFreeAnalysis={isFreeAnalysis}
              isFirstAnalysis={isFirstAnalysis}
            />
          )}

          {currentStep === 3 && showPaymentSuccess && analysisId && (
            <PaymentSuccessHandler
              analysisId={analysisId}
              file={file}
              onProcessingComplete={handleProcessingComplete}
            />
          )}

          {currentStep === 3 && !showPaymentSuccess && <ProcessingStep />}
        </div>
      </main>
    </div>
  );
};

export default Analizar;
