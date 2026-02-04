import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// #region agent log
try {
  const rootElement = document.getElementById("root");
  fetch('http://127.0.0.1:7248/ingest/b899a128-fb87-4900-a86f-9d897eaf2428', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'main.tsx:ENTRY', message: 'Iniciando aplicação', data: { rootElementExists: !!rootElement, userAgent: navigator.userAgent }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
  if (!rootElement) {
    fetch('http://127.0.0.1:7248/ingest/b899a128-fb87-4900-a86f-9d897eaf2428', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'main.tsx:ERROR', message: 'Elemento root não encontrado', data: {}, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
    throw new Error('Root element not found');
  }
  const root = createRoot(rootElement);
  fetch('http://127.0.0.1:7248/ingest/b899a128-fb87-4900-a86f-9d897eaf2428', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'main.tsx:RENDER', message: 'Renderizando App', data: {}, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
  root.render(<App />);
  fetch('http://127.0.0.1:7248/ingest/b899a128-fb87-4900-a86f-9d897eaf2428', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'main.tsx:SUCCESS', message: 'App renderizado com sucesso', data: {}, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
} catch (error) {
  fetch('http://127.0.0.1:7248/ingest/b899a128-fb87-4900-a86f-9d897eaf2428', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'main.tsx:CATCH', message: 'Erro ao renderizar App', data: { errorMessage: error instanceof Error ? error.message : String(error), errorStack: error instanceof Error ? error.stack : undefined }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
  throw error;
}
// #endregion
