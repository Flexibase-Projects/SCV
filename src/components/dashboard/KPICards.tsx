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
  fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'KPICards.tsx:15',message:'KPICards recebeu dados',data:{entregasLength:entregas.length,hasStats:!!stats,statsTotal:stats?.totalEntregas,statsObject:stats},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'FIX'})}).catch(()=>{});
  // #endregion
  const totalEntregas = stats ? stats.totalEntregas : entregas.length;
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'KPICards.tsx:20',message:'Total de entregas calculado',data:{totalEntregas,statsTotalEntregas:stats?.totalEntregas,usingStats:!!stats},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'FIX'})}).catch(()=>{});
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
      description: 'Total de entregas listadas'
    },
    {
      title: 'Custo de Entregas',
      value: formatCurrency(custoTotalEntregas),
      icon: DollarSign,
      description: 'Gastos totais com transporte'
    },
    {
      title: 'Custo de Montagem',
      value: formatCurrency(custoTotalMontagem),
      icon: Wrench,
      description: 'Gastos totais com montagem'
    },
    {
      title: '% Médio de Gastos',
      value: `${percentualMedioGastos.toFixed(1)}%`,
      icon: TrendingUp,
      description: 'Percentual médio de gastos'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.title}
            </CardTitle>
            <kpi.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
            <p className="text-xs text-muted-foreground">{kpi.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
