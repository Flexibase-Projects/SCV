import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RouteLoadingFallback } from "@/components/layout/RouteLoadingFallback";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import RedefinirSenha from "./pages/RedefinirSenha";
import { isImportEnabled } from "@/utils/featureFlags";

const Hub = lazy(() => import("./pages/Hub"));
const Entregas = lazy(() => import("./pages/Entregas"));
const Abastecimento = lazy(() => import("./pages/Abastecimento"));
const Manutencao = lazy(() => import("./pages/Manutencao"));
const Cadastros = lazy(() => import("./pages/Cadastros"));
const ResumoGeral = lazy(() => import("./pages/ResumoGeral"));
const AcertoViagem = lazy(() => import("./pages/AcertoViagem"));
const Produtividade = lazy(() => import("./pages/Produtividade"));
const Importacao = lazy(() => import("./pages/Importacao"));
const Ajuda = lazy(() => import("./pages/Ajuda"));

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="scv-ui-theme">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Suspense fallback={<RouteLoadingFallback />}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/redefinir-senha" element={<RedefinirSenha />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Hub />} />
                    <Route path="/entregas" element={<Entregas />} />
                    <Route path="/abastecimento" element={<Abastecimento />} />
                    <Route path="/manutencao" element={<Manutencao />} />
                    <Route path="/cadastros" element={<Cadastros />} />
                    <Route path="/resumo-geral" element={<ResumoGeral />} />
                    <Route path="/acerto-viagem" element={<AcertoViagem />} />
                    <Route path="/produtividade" element={<Produtividade />} />
                    {isImportEnabled() && <Route path="/importacao" element={<Importacao />} />}
                    <Route path="/ajuda" element={<Ajuda />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
