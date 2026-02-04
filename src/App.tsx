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
  // #region agent log
  try {
    fetch('http://127.0.0.1:7248/ingest/b899a128-fb87-4900-a86f-9d897eaf2428', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'App.tsx:ENTRY', message: 'Componente App iniciando', data: { isImportEnabled: isImportEnabled() }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }) }).catch(() => { });
  } catch (error) {
    fetch('http://127.0.0.1:7248/ingest/b899a128-fb87-4900-a86f-9d897eaf2428', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'App.tsx:ERROR', message: 'Erro no componente App', data: { errorMessage: error instanceof Error ? error.message : String(error) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }) }).catch(() => { });
  }
  // #endregion
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
