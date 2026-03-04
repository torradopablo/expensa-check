import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Analizar from "./pages/Analizar";
import Ejemplo from "./pages/Ejemplo";
import AnalysisPage from "./pages/AnalysisPage";
import Historial from "./pages/Historial";
import Comparar from "./pages/Comparar";
import Evolucion from "./pages/Evolucion";
import Terminos from "./pages/Terminos";
import Privacidad from "./pages/Privacidad";
import Contacto from "./pages/Contacto";
import SharedAnalysis from "./pages/SharedAnalysis";
import Perfil from "./pages/Perfil";
import UpdatePassword from "./pages/UpdatePassword";
import PrepararReunion from "./pages/PrepararReunion";
import Proximamente from "./pages/Proximamente";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const SessionManager = () => {
  // Configured for 60 minutes of inactivity
  useSessionTimeout(60 * 60 * 1000);
  return null;
};

const App = () => {
  const isComingSoon = import.meta.env.VITE_COMING_SOON === 'true';

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SessionManager />
          <Routes>
            {isComingSoon ? (
              <Route path="*" element={<Proximamente />} />
            ) : (
              <>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/analizar" element={<Analizar />} />
                <Route path="/ejemplo" element={<Ejemplo />} />
                <Route path="/analisis/:id" element={<AnalysisPage />} />
                <Route path="/historial" element={<Historial />} />
                <Route path="/comparar" element={<Comparar />} />
                <Route path="/evolucion" element={<Evolucion />} />
                <Route path="/terminos" element={<Terminos />} />
                <Route path="/privacidad" element={<Privacidad />} />
                <Route path="/contacto" element={<Contacto />} />
                <Route path="/compartido/:token" element={<SharedAnalysis />} />
                <Route path="/perfil" element={<Perfil />} />
                <Route path="/update-password" element={<UpdatePassword />} />
                <Route path="/preparar-reunion" element={<PrepararReunion />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </>
            )}
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
