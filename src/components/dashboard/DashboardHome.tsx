import { useState, useMemo } from 'react';
import {
    LocalShippingOutlined as Truck,
    BuildOutlined as Wrench,
    AttachMoneyOutlined as DollarSign,
    TrendingUpOutlined as TrendingUp,
    LocalGasStationOutlined as Fuel,
    ArrowForwardOutlined as ArrowRight,
    CalendarTodayOutlined as Calendar,
    AddOutlined as Plus,
    PersonAddOutlined as UserPlus,
    DirectionsCarOutlined as CarFront,
    PeopleOutlined as Users,
    TimelineOutlined as Activity
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend
} from 'recharts';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart";

import { useEntregas } from '@/hooks/useEntregas';
import { useAbastecimentos } from '@/hooks/useAbastecimentos';
import { useManutencoes } from '@/hooks/useManutencoes';
import { useMotoristas } from '@/hooks/useMotoristas';
import { useVeiculos } from '@/hooks/useVeiculos';
import { useMontadores } from '@/hooks/useMontadores';
import { useAcertosViagem } from '@/hooks/useAcertosViagem';
import { StatusBadge } from './StatusBadge';
import type { Entrega } from '@/types/entrega';
import { glassCard, solidCard } from '@/lib/cardStyles';

const MONTHS = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const today = new Date();
const formattedDate = today.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
});

const greeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
};

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(String);

// Chart configs for shadcn Chart (tooltip + legend)
const deliveryChartConfig: ChartConfig = {
    concluidas: { label: 'Concluídas', color: '#10b981' },
    em_rota: { label: 'Em Rota', color: '#3b82f6' },
    pendentes: { label: 'Pendentes', color: '#f59e0b' },
    mes: { label: 'Mês' },
} satisfies ChartConfig;

const fuelChartConfig: ChartConfig = {
    litros: { label: 'Litros', color: '#3b82f6' },
    mes: { label: 'Mês' },
} satisfies ChartConfig;

const maintenanceChartConfig: ChartConfig = {
    preventiva: { label: 'Preventiva', color: '#3b82f6' },
    corretiva: { label: 'Corretiva', color: '#f59e0b' },
    emergencial: { label: 'Emergencial', color: '#ef4444' },
} satisfies ChartConfig;

export function DashboardHome() {
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

    const { data: entregas = [] } = useEntregas();
    const { data: abastecimentos = [] } = useAbastecimentos();
    const { data: manutencoes = [] } = useManutencoes();
    const { data: motoristas = [] } = useMotoristas(true);
    const { data: veiculos = [] } = useVeiculos();
    const { data: montadores = [] } = useMontadores();
    const { data: acertosViagem = [] } = useAcertosViagem();

    const deliveryTrendData = useMemo(() => {
        const monthlyData = Array(12).fill(0).map((_, i) => ({
            mes: MONTHS[i],
            pendentes: 0,
            em_rota: 0,
            concluidas: 0
        }));

        entregas.forEach(entrega => {
            if (!entrega.data_saida) return;
            const date = new Date(entrega.data_saida);
            if (date.getFullYear().toString() !== selectedYear) return;

            const monthIndex = date.getMonth();
            const status = entrega.status;

            if (status === 'PENDENTE') monthlyData[monthIndex].pendentes++;
            else if (status === 'EM ROTA') monthlyData[monthIndex].em_rota++;
            else if (status === 'CONCLUIDO') monthlyData[monthIndex].concluidas++;
        });

        return monthlyData;
    }, [entregas, selectedYear]);

    const fuelData = useMemo(() => {
        const monthlyData = Array(12).fill(0).map((_, i) => ({
            mes: MONTHS[i],
            litros: 0,
            custo: 0
        }));

        abastecimentos.forEach(abast => {
            if (!abast.data) return;
            const date = new Date(abast.data);
            if (date.getFullYear().toString() !== selectedYear) return;

            const monthIndex = date.getMonth();
            monthlyData[monthIndex].litros += Number(abast.litros || 0);
            monthlyData[monthIndex].custo += Number(abast.valor_total || 0);
        });

        return monthlyData;
    }, [abastecimentos, selectedYear]);

    const maintenanceDistribution = useMemo(() => {
        const counts = { preventiva: 0, corretiva: 0, emergencial: 0 };

        manutencoes.forEach(manut => {
            if (!manut.data) return;
            const date = new Date(manut.data);
            if (date.getFullYear().toString() !== selectedYear) return;

            const tipo = (manut.tipo_manutencao || '').toLowerCase();
            if (tipo.includes('preventiva')) counts.preventiva++;
            else if (tipo.includes('emergencial')) counts.emergencial++;
            else counts.corretiva++;
        });

        return [
            { name: 'Preventiva', value: counts.preventiva, color: '#3b82f6' },
            { name: 'Corretiva', value: counts.corretiva, color: '#f59e0b' },
            { name: 'Emergencial', value: counts.emergencial, color: '#ef4444' },
        ].filter(item => item.value > 0);
    }, [manutencoes, selectedYear]);

    const kpis = useMemo(() => {
        const currentMonth = new Date().getMonth();
        const currentYearNum = new Date().getFullYear();

        const activeVehicles = veiculos.filter(v => v.status !== 'INATIVO' && v.status !== 'EM_MANUTENCAO').length;

        const pendingMaintenance = manutencoes.filter(m =>
            m.status !== 'CONCLUIDA' && m.status !== 'resolvida'
        ).length;

        let monthCosts = 0;

        abastecimentos.forEach(a => {
            const d = new Date(a.data);
            if (d.getMonth() === currentMonth && d.getFullYear() === currentYearNum) {
                monthCosts += Number(a.valor_total || 0);
            }
        });

        manutencoes.forEach(m => {
            const d = new Date(m.data);
            if (d.getMonth() === currentMonth && d.getFullYear() === currentYearNum) {
                monthCosts += Number(m.custo_total || 0);
            }
        });

        entregas.forEach(e => {
            const d = new Date(e.data_saida || '');
            if (d.getMonth() === currentMonth && d.getFullYear() === currentYearNum) {
                monthCosts += Number(e.gastos_entrega || 0) + Number(e.gastos_montagem || 0);
            }
        });

        let totalEntregasAno = 0;
        let concluidasAno = 0;

        entregas.forEach(e => {
            if (!e.data_saida) return;
            const d = new Date(e.data_saida);
            if (d.getFullYear().toString() === selectedYear) {
                totalEntregasAno++;
                if (e.status === 'CONCLUIDO') concluidasAno++;
            }
        });

        const deliveryRate = totalEntregasAno > 0 ? Math.round((concluidasAno / totalEntregasAno) * 100) : 0;

        return {
            fleet: { active: activeVehicles, total: veiculos.length },
            maintenance: { pending: pendingMaintenance },
            costs: { month: monthCosts },
            deliveryRate: deliveryRate,
            deliveryTotal: totalEntregasAno,
            deliveryCompleted: concluidasAno
        };

    }, [veiculos, manutencoes, abastecimentos, entregas, selectedYear]);

    const cadastrosCounts = {
        motoristas: motoristas.filter(m => m.ativo).length,
        veiculos: veiculos.length,
        montadores: montadores.length
    };

    const financialPending = useMemo(() => {
        const pending = acertosViagem.filter(a => a.status === 'PENDENTE' || a.status === 'EM_ANALISE');
        const totalValue = pending.reduce((acc, curr) => acc + (Number(curr.valor_adiantamento || 0)), 0);
        return {
            count: pending.length,
            totalValue: totalValue,
            items: pending
        };
    }, [acertosViagem]);

    const ultimasEntregas = useMemo(() => {
        return [...entregas]
            .filter(e => e.data_saida)
            .sort((a, b) => new Date(b.data_saida!).getTime() - new Date(a.data_saida!).getTime())
            .slice(0, 8);
    }, [entregas]);

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f1115] transition-colors duration-300">
            <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">

                {/* Header */}
                <div className="mb-8 p-4 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                                {greeting()} 👋
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {formattedDate}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-[140px] bg-white/80 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/10 text-gray-900 dark:text-gray-100">
                                    <SelectValue placeholder="Selecione o Ano" />
                                </SelectTrigger>
                                <SelectContent>
                                    {YEAR_OPTIONS.map(y => (
                                        <SelectItem key={y} value={y}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Section Cards - KPIs (dashboard-01 style) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card className={`${glassCard} overflow-hidden`}>
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-muted-foreground">Frota Ativa</span>
                                <div className="h-10 w-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center">
                                    <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold">
                                {kpis.fleet.active}<span className="text-base text-muted-foreground font-normal ml-1">/ {kpis.fleet.total}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">veículos operando</p>
                        </CardContent>
                    </Card>

                    <Card className={`${glassCard} overflow-hidden`}>
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-muted-foreground">Manutenções</span>
                                <div className="h-10 w-10 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center">
                                    <Wrench className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                {kpis.maintenance.pending}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">ordens pendentes</p>
                        </CardContent>
                    </Card>

                    <Card className={`${glassCard} overflow-hidden`}>
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-muted-foreground">Custos Mês</span>
                                <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center">
                                    <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold">
                                {formatCurrency(kpis.costs.month)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">mês atual</p>
                        </CardContent>
                    </Card>

                    <Card className={`${glassCard} overflow-hidden`}>
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-muted-foreground">Conclusão ({selectedYear})</span>
                                <div className="h-10 w-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold">
                                {kpis.deliveryRate}%
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{kpis.deliveryCompleted} de {kpis.deliveryTotal} entregas</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    <div className="lg:col-span-8 space-y-6">

                        {/* Gráfico de Entregas - Chart shadcn */}
                        <Card className={`${solidCard} rounded-2xl overflow-hidden`}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            Entregas - {selectedYear}
                                        </CardTitle>
                                        <CardDescription>Evolução mensal</CardDescription>
                                    </div>
                                    <Link to="/entregas">
                                        <Button variant="outline" size="sm" className="border-gray-200 dark:border-white/10">
                                            Ver detalhes
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={deliveryChartConfig} className="h-[300px] w-full">
                                    <AreaChart data={deliveryTrendData}>
                                        <defs>
                                            <linearGradient id="colorConcluidas" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorEmRota" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorPendentes" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="mes" tickLine={false} axisLine={false} />
                                        <YAxis tickLine={false} axisLine={false} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Legend content={<ChartLegendContent nameKey="mes" />} />
                                        <Area type="monotone" dataKey="concluidas" stroke="#10b981" fill="url(#colorConcluidas)" strokeWidth={2} />
                                        <Area type="monotone" dataKey="em_rota" stroke="#3b82f6" fill="url(#colorEmRota)" strokeWidth={2} />
                                        <Area type="monotone" dataKey="pendentes" stroke="#f59e0b" fill="url(#colorPendentes)" strokeWidth={2} />
                                    </AreaChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <Card className={`${solidCard} rounded-2xl overflow-hidden flex flex-col`}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Fuel className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        Abastecimento
                                    </CardTitle>
                                    <CardDescription>Litros por mês ({selectedYear})</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <ChartContainer config={fuelChartConfig} className="h-[240px] w-full">
                                        <BarChart data={fuelData}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                            <XAxis dataKey="mes" tickLine={false} axisLine={false} />
                                            <YAxis tickLine={false} axisLine={false} />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Bar dataKey="litros" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ChartContainer>
                                    <Link to="/abastecimento" className="mt-4 block">
                                        <Button variant="ghost" size="sm" className="w-full text-muted-foreground h-9">
                                            Ver histórico completo <ArrowRight className="h-3 w-3 ml-1" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            <Card className={`${solidCard} rounded-2xl overflow-hidden flex flex-col`}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Wrench className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                        Manutenção
                                    </CardTitle>
                                    <CardDescription>Distribuição ({selectedYear})</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <ChartContainer config={maintenanceChartConfig} className="h-[240px] w-full">
                                        <PieChart>
                                            <Pie
                                                data={maintenanceDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {maintenanceDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Legend content={<ChartLegendContent />} />
                                        </PieChart>
                                    </ChartContainer>
                                    <Link to="/manutencao" className="mt-4 block">
                                        <Button variant="ghost" size="sm" className="w-full text-muted-foreground h-9">
                                            Ver todas O.S. <ArrowRight className="h-3 w-3 ml-1" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Cadastros Ativos */}
                        <Card className={`${solidCard} rounded-2xl overflow-hidden`}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                            Cadastros Ativos
                                        </CardTitle>
                                        <CardDescription>Base de dados atual</CardDescription>
                                    </div>
                                    <Link to="/cadastros">
                                        <Button variant="outline" size="sm" className="border-gray-200 dark:border-white/10">
                                            Gerenciar
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
                                        <div className="h-12 w-12 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{cadastrosCounts.motoristas}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Motoristas</p>
                                    </div>
                                    <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                                        <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                            <Truck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{cadastrosCounts.veiculos}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Veículos</p>
                                    </div>
                                    <div className="text-center p-4 bg-lime-50 dark:bg-lime-500/10 rounded-xl border border-lime-100 dark:border-lime-500/20">
                                        <div className="h-12 w-12 bg-lime-100 dark:bg-lime-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                            <Activity className="h-6 w-6 text-lime-600 dark:text-lime-400" />
                                        </div>
                                        <p className="text-2xl font-bold text-lime-600 dark:text-lime-400">{cadastrosCounts.montadores}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Montadores</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Últimas entregas - DataTable style */}
                        <Card className={`${solidCard} rounded-2xl overflow-hidden`}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            Últimas entregas
                                        </CardTitle>
                                        <CardDescription>Resumo recente</CardDescription>
                                    </div>
                                    <Link to="/entregas">
                                        <Button variant="outline" size="sm" className="border-gray-200 dark:border-white/10">
                                            Ver todas
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-gray-100 dark:border-white/5">
                                                <TableHead className="text-muted-foreground">Data</TableHead>
                                                <TableHead className="text-muted-foreground">Veículo</TableHead>
                                                <TableHead className="text-muted-foreground">Cliente / PV</TableHead>
                                                <TableHead className="text-muted-foreground">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {ultimasEntregas.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                        Nenhuma entrega registrada
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                ultimasEntregas.map((e: Entrega) => (
                                                    <TableRow key={e.id} className="border-gray-100 dark:border-white/5">
                                                        <TableCell className="font-medium">{formatDate(e.data_saida)}</TableCell>
                                                        <TableCell>{e.carro ?? '—'}</TableCell>
                                                        <TableCell>{(e.cliente || e.pv_foco) ?? '—'}</TableCell>
                                                        <TableCell>
                                                            <StatusBadge status={e.status} />
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-4 space-y-6">

                        <Card className="bg-gradient-to-br from-brand-green to-emerald-600 dark:from-brand-green dark:to-emerald-700 border border-white/20 dark:border-white/10 backdrop-blur-sm rounded-2xl overflow-hidden text-white shadow-lg shadow-emerald-900/20">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <DollarSign className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium opacity-90">Pendências Financeiras</h3>
                                        <p className="text-xs opacity-70">Acerto de Viagem</p>
                                    </div>
                                </div>
                                <div className="my-6">
                                    <p className="text-4xl font-bold mb-1">{formatCurrency(financialPending.totalValue)}</p>
                                    <p className="text-sm opacity-80">{financialPending.count} solicitações aguardando</p>
                                </div>
                                {financialPending.items.length > 0 && (
                                    <div className="mb-4 space-y-2 max-h-[200px] overflow-y-auto">
                                        {financialPending.items.map((a) => (
                                            <div
                                                key={a.id}
                                                className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-white/10 text-left"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium truncate">{a.destino ?? '—'}</p>
                                                    <p className="text-xs opacity-80 truncate">
                                                        {a.motorista_nome ?? a.montador_nome ?? '—'} · {formatDate(a.data_saida)}
                                                    </p>
                                                </div>
                                                <span className="text-sm font-medium shrink-0">
                                                    {formatCurrency(Number(a.valor_adiantamento || 0))}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <Link to="/acerto-viagem">
                                    <Button className="w-full bg-white hover:bg-gray-100 text-brand-green font-medium transition-colors shadow-sm">
                                        Revisar Pendências
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        <Card className={`${solidCard} rounded-2xl overflow-hidden`}>
                            <CardHeader>
                                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Link to="/cadastros?tab=motoristas">
                                    <Button variant="outline" className="w-full justify-start gap-3 h-12 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5">
                                        <div className="h-9 w-9 bg-blue-50 dark:bg-blue-500/10 rounded-lg flex items-center justify-center">
                                            <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span className="text-sm font-medium">Cadastrar Motorista</span>
                                    </Button>
                                </Link>
                                <Link to="/cadastros?tab=veiculos">
                                    <Button variant="outline" className="w-full justify-start gap-3 h-12 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5">
                                        <div className="h-9 w-9 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg flex items-center justify-center">
                                            <CarFront className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <span className="text-sm font-medium">Cadastrar Veículo</span>
                                    </Button>
                                </Link>
                                <Link to="/entregas">
                                    <Button variant="outline" className="w-full justify-start gap-3 h-12 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5">
                                        <div className="h-9 w-9 bg-blue-50 dark:bg-blue-500/10 rounded-lg flex items-center justify-center">
                                            <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span className="text-sm font-medium">Nova Entrega</span>
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
