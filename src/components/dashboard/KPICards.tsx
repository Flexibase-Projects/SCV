import { Package, DollarSign, Wrench, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Entrega } from '@/types/entrega';

interface KPICardsProps {
  entregas: Entrega[];
  stats?: {
    totalEntregas: number;
    custoTotalEntregas: number;
    custoTotalMontagem: number;
    percentualMedioGastos: number;
  };
}

export function KPICards({ entregas, stats }: KPICardsProps) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'KPICards.tsx:15', message: 'KPICards recebeu dados', data: { entregasLength: entregas.length, hasStats: !!stats, statsTotal: stats?.totalEntregas, statsObject: stats }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'post-fix', hypothesisId: 'FIX' }) }).catch(() => { });
  // #endregion
  const totalEntregas = stats ? stats.totalEntregas : entregas.length;

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'KPICards.tsx:20', message: 'Total de entregas calculado', data: { totalEntregas, statsTotalEntregas: stats?.totalEntregas, usingStats: !!stats }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'post-fix', hypothesisId: 'FIX' }) }).catch(() => { });
  // #endregion

  const custoTotalEntregas = stats
    ? stats.custoTotalEntregas
    : entregas.reduce((acc, e) => acc + (e.gastos_entrega || 0), 0);

  const custoTotalMontagem = stats
    ? stats.custoTotalMontagem
    : entregas.reduce((acc, e) => acc + (e.gastos_montagem || 0), 0);

  const percentualMedioGastos = stats
    ? stats.percentualMedioGastos
    : (entregas.length > 0
      ? entregas.reduce((acc, e) => acc + (e.percentual_gastos || 0), 0) / entregas.length
      : 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const kpis = [
    {
      title: 'Total de Entregas',
      value: totalEntregas.toString(),
      icon: Package,
      description: 'Total de entregas listadas',
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-500/10"
    },
    {
      title: 'Custo de Entregas',
      value: formatCurrency(custoTotalEntregas),
      icon: DollarSign,
      description: 'Gastos totais com transporte',
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-500/10"
    },
    {
      title: 'Custo de Montagem',
      value: formatCurrency(custoTotalMontagem),
      icon: Wrench,
      description: 'Gastos totais com montagem',
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-500/10"
    },
    {
      title: '% Médio de Gastos',
      value: `${percentualMedioGastos.toFixed(1)}%`,
      icon: TrendingUp,
      description: 'Percentual médio de gastos',
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-500/10"
    }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <div key={kpi.title} className="bg-white dark:bg-[#181b21] border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow min-h-[140px] flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {kpi.title}
            </span>
            <div className={`h-10 w-10 ${kpi.bgColor} rounded-xl flex items-center justify-center`}>
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {kpi.value}
          </p>
          <p className="text-xs text-gray-400 mt-1">{kpi.description}</p>
        </div>
      ))}
    </div>
  );
}
