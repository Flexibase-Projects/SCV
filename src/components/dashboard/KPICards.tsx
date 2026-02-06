import { LocalShipping as Truck, AttachMoney as DollarSign, TrendingUp, AccountBalanceWallet as Wallet } from '@mui/icons-material';
import { Card, CardContent } from '@/components/ui/card';
import { glassCard } from '@/lib/cardStyles';
import { Entrega } from '@/types/entrega';

interface KPICardsProps {
  entregas: Entrega[];
  stats?: {
    totalEntregas: number;
    custoTotalEntregas: number;
    custoTotalMontagem: number;
    percentualMedioGastos: number;
    valorTotalEntregas?: number;
    entregasConcluidas?: number;
  };
}

export function KPICards({ entregas, stats }: KPICardsProps) {
  const totalEntregas = stats ? stats.totalEntregas : entregas.length;

  const valorTotalEntregas = stats?.valorTotalEntregas || entregas.reduce((acc, e) => acc + (e.valor || 0), 0);

  const entregasConcluidas = stats?.entregasConcluidas || entregas.filter(e => e.status === 'ENTREGUE' || e.status === 'CONCLUIDO').length;
  
  const taxaConclusao = totalEntregas > 0 ? Math.round((entregasConcluidas / totalEntregas) * 100) : 0;

  const gastosTotais = stats
    ? (stats.custoTotalEntregas + stats.custoTotalMontagem)
    : entregas.reduce((acc, e) => acc + (e.gastos_entrega || 0) + (e.gastos_montagem || 0), 0);

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
      icon: Truck,
      description: 'entregas no período',
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      title: 'Valor Total',
      value: formatCurrency(valorTotalEntregas),
      icon: DollarSign,
      description: 'em entregas',
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      title: 'Taxa de Conclusão',
      value: `${taxaConclusao}%`,
      icon: TrendingUp,
      description: `${entregasConcluidas} de ${totalEntregas} concluídas`,
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      title: 'Gastos Totais',
      value: formatCurrency(gastosTotais),
      icon: Wallet,
      description: 'gastos operacionais',
      iconBg: 'bg-amber-50 dark:bg-amber-500/10',
      iconColor: 'text-amber-600 dark:text-amber-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => (
        <Card
          key={kpi.title}
          className={`${glassCard} overflow-hidden rounded-lg animate-in fade-in-50 slide-in-from-bottom-4`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {kpi.title}
              </span>
              <div className={`h-10 w-10 ${kpi.iconBg} rounded-lg flex items-center justify-center`}>
                <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
              {kpi.value}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {kpi.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
