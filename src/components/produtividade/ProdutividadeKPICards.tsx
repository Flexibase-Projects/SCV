import { BuildOutlined as Wrench, AttachMoneyOutlined as DollarSign, TrendingUpOutlined as TrendingUp, WarningAmberOutlined as Warning } from '@mui/icons-material';
import { Card, CardContent } from '@/components/ui/card';
import { glassCard } from '@/lib/cardStyles';
import { ProdutividadeStats } from '@/hooks/useProdutividade';

interface ProdutividadeKPICardsProps {
  stats: ProdutividadeStats;
  pendentesSemConfiguracao: number;
  isLoading?: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function ProdutividadeKPICards({
  stats,
  pendentesSemConfiguracao,
  isLoading,
}: ProdutividadeKPICardsProps) {
  const kpis = [
    {
      title: 'Montagens Concluídas',
      value: isLoading ? '—' : stats.totalMontagensConcluidas.toString(),
      icon: Wrench,
      description: 'no período selecionado',
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Produtividade Total',
      value: isLoading ? '—' : formatCurrency(stats.produtividadeTotal),
      icon: DollarSign,
      description: 'soma das produtividades no período',
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Média por Montador',
      value: isLoading ? '—' : formatCurrency(stats.produtividadeMediaPorMontador),
      icon: TrendingUp,
      description: 'média entre montadores ativos',
      iconBg: 'bg-blue-50 dark:bg-blue-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Pendentes de Configuração',
      value: pendentesSemConfiguracao.toString(),
      icon: Warning,
      description: 'montagens sem tipo de serviço',
      iconBg: 'bg-amber-50 dark:bg-amber-500/10',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
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
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{kpi.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
