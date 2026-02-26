import { AttachMoneyOutlined as DollarSign, BuildOutlined as Wrench, SwapVertOutlined as ArrowUpDown, BarChartOutlined as BarChart3, TrendingUpOutlined as TrendingUp, TrendingDownOutlined as TrendingDown } from '@mui/icons-material';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportKPI } from './ReportKPI';
import { Badge } from '@/components/ui/badge';

interface FinancialOverviewProps {
    valorExpedido: number;
    custoManutencao: number;
    custoAbastecimento: number;
    margemOperacional: number;
    statusCounts: Record<string, number>;
    totalPedidos: number;
}

export function FinancialOverview({
    valorExpedido,
    custoManutencao,
    custoAbastecimento,
    margemOperacional,
    statusCounts,
    totalPedidos
}: FinancialOverviewProps) {

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const custoTotal = custoManutencao + custoAbastecimento;
    const margemPercentual = valorExpedido > 0 ? (margemOperacional / valorExpedido) * 100 : 0;

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'PENDENTE': 'bg-yellow-500',
            'EM ROTA': 'bg-blue-500',
            'CONCLUIDO': 'bg-green-500',
            'ENTREGUE': 'bg-emerald-500',
            'EM MONTAGEM': 'bg-purple-500',
            'AGUARDANDO MONTAGEM': 'bg-orange-500',
            'MONTAGEM PARCIAL': 'bg-pink-500',
        };
        return colors[status] || 'bg-gray-500';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ReportKPI
                    title="Valor Expedido"
                    value={formatCurrency(valorExpedido)}
                    icon={DollarSign}
                    variant="success"
                />
                <ReportKPI
                    title="Custos Totais"
                    value={formatCurrency(custoTotal)}
                    icon={Wrench}
                    variant="warning"
                    subtext={`Manutenção: ${formatCurrency(custoManutencao)} | Abastecimento: ${formatCurrency(custoAbastecimento)}`}
                />
                <ReportKPI
                    title="Margem Operacional"
                    value={formatCurrency(margemOperacional)}
                    icon={ArrowUpDown}
                    variant={margemOperacional >= 0 ? "info" : "danger"}
                    trend={{
                        value: Math.abs(Number(margemPercentual.toFixed(1))),
                        isPositive: margemPercentual >= 0
                    }}
                />
                <ReportKPI
                    title="Total de Pedidos"
                    value={totalPedidos}
                    icon={BarChart3}
                    variant="purple"
                />
            </div>

            <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Pipeline de Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Object.entries(statusCounts).map(([status, count]) => {
                            if (count === 0) return null;
                            return (
                                <div key={status} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border hover:bg-secondary/80 transition-colors">
                                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getStatusColor(status)} shadow-[0_0_8px_rgba(0,0,0,0.2)]`} />
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{status}</span>
                                        <span className="text-xl font-bold">{count}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
