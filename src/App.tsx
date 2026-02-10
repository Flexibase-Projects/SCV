import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Hub from "./pages/Hub";
import Entregas from "./pages/Entregas";
import Abastecimento from "./pages/Abastecimento";
import Manutencao from "./pages/Manutencao";
import Cadastros from "./pages/Cadastros";
import ResumoGeral from "./pages/ResumoGeral";
import AcertoViagem from "./pages/AcertoViagem";
import Importacao from "./pages/Importacao";
import Ajuda from "./pages/Ajuda";
import NotFound from "./pages/NotFound";
import { isImportEnabled } from "@/utils/featureFlags";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Hub />} />
            <Route path="/entregas" element={<Entregas />} />
            <Route path="/abastecimento" element={<Abastecimento />} />
            <Route path="/manutencao" element={<Manutencao />} />
            <Route path="/cadastros" element={<Cadastros />} />
            <Route path="/resumo-geral" element={<ResumoGeral />} />
            <Route path="/acerto-viagem" element={<AcertoViagem />} />
            {isImportEnabled() && <Route path="/importacao" element={<Importacao />} />}
            <Route path="/ajuda" element={<Ajuda />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
