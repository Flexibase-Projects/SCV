import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import Hub from "./pages/Hub";
import Entregas from "./pages/Entregas";
import Abastecimento from "./pages/Abastecimento";
import Manutencao from "./pages/Manutencao";
import Cadastros from "./pages/Cadastros";
import ResumoGeral from "./pages/ResumoGeral";
import AcertoViagem from "./pages/AcertoViagem";
import Produtividade from "./pages/Produtividade";
import Importacao from "./pages/Importacao";
import Ajuda from "./pages/Ajuda";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import RedefinirSenha from "./pages/RedefinirSenha";
import { isImportEnabled } from "@/utils/featureFlags";

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
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
