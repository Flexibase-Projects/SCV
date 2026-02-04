import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { DashboardHome } from '@/components/dashboard/DashboardHome';

const Hub = () => {
  // #region agent log
  try {
    fetch('http://127.0.0.1:7248/ingest/b899a128-fb87-4900-a86f-9d897eaf2428', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'Hub.tsx:ENTRY', message: 'Componente Hub iniciando', data: {}, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }) }).catch(() => { });
  } catch (error) {
    fetch('http://127.0.0.1:7248/ingest/b899a128-fb87-4900-a86f-9d897eaf2428', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'Hub.tsx:ERROR', message: 'Erro no componente Hub', data: { errorMessage: error instanceof Error ? error.message : String(error) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }) }).catch(() => { });
  }
  // #endregion
  
  return (
    <ModuleLayout>
      <DashboardHome />
    </ModuleLayout>
  );
};

export default Hub;
