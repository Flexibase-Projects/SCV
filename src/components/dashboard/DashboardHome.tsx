import { useState, useMemo } from 'react';
import {
    LocalShipping as Truck,
    Build as Wrench,
    AttachMoney as DollarSign,
    TrendingUp,
    LocalGasStation as Fuel,
    WarningAmber as AlertTriangle,
    CheckCircle as CheckCircle2,
    AccessTime as Clock,
    ArrowForward as ArrowRight,
    CalendarToday as Calendar,
    Add as Plus,
    PersonAdd as UserPlus,
    DirectionsCar as CarFront,
    People as Users,
    Timeline as Activity
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { KPICard } from './KPICard';
import { useStaggerAnimation } from '@/hooks/useStaggerAnimation';
import { AnimatedChart } from '@/components/shared/AnimatedChart';
import { cn } from '@/lib/utils';
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
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Hooks de Dados Reais
import { useEntregas } from '@/hooks/useEntregas';
import { useAbastecimentos } from '@/hooks/useAbastecimentos';
import { useManutencoes } from '@/hooks/useManutencoes';
import { useMotoristas } from '@/hooks/useMotoristas';
import { useVeiculos } from '@/hooks/useVeiculos';
import { useMontadores } from '@/hooks/useMontadores';
import { useAcertosViagem } from '@/hooks/useAcertosViagem';

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

// Custom tooltip para gráficos
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-lg">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-medium" style={{ color: entry.color }}>{entry.name}:</span> {entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export function DashboardHome() {
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

    // Fetch Data
    const { data: entregas = [] } = useEntregas();

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'DashboardHome.tsx:96', message: 'Entregas recebidas no componente', data: { entregasLength: entregas.length, firstId: entregas[0]?.id, lastId: entregas[entregas.length - 1]?.id }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }) }).catch(() => { });
    // #endregion
    const { data: abastecimentos = [] } = useAbastecimentos();
    const { data: manutencoes = [] } = useManutencoes();
    const { data: motoristas = [] } = useMotoristas(true);
    const { data: veiculos = [] } = useVeiculos();
    const { data: montadores = [] } = useMontadores();
    const { data: acertosViagem = [] } = useAcertosViagem();

    // --- AGREGADORES ---

    // 1. Dados de Entregas por Mês (Filtrado pelo Ano Selecionado)
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

    // 2. Dados de Abastecimento por Mês
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

    // 3. Distribuição de Manutenção (Total do Ano Selecionado)
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

    // 4. KPIs Gerais
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
            totalValue: totalValue
        };
    }, [acertosViagem]);


    // Staggered animation para KPIs
    const { isVisible } = useStaggerAnimation(4, 100, 200);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">

                {/* Header - Asymmetric */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                                {greeting()} 👋
                            </h1>
                            <p className="text-sm text-slate-600 dark:text-slate-400 capitalize flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {formattedDate}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-[140px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg">
                                    <SelectValue placeholder="Selecione o Ano" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="2024">2024</SelectItem>
                                    <SelectItem value="2025">2025</SelectItem>
                                    <SelectItem value="2026">2026</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* KPIs - Staggered Grid (Não Uniforme) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <KPICard
                        title="Frota Ativa"
                        value={<>{kpis.fleet.active}<span className="text-base text-slate-400 dark:text-slate-500 font-normal ml-1">/ {kpis.fleet.total}</span></>}
                        description="veículos operando"
                        icon={Truck}
                        iconColor="text-emerald-600 dark:text-emerald-400"
                        iconBgColor="bg-emerald-50 dark:bg-emerald-500/10"
                        delay={0}
                        isVisible={isVisible(0)}
                        variant="sharp"
                    />
                    <KPICard
                        title="Manutenções"
                        value={kpis.maintenance.pending.toString()}
                        description="ordens pendentes"
                        icon={Wrench}
                        iconColor="text-amber-600 dark:text-amber-400"
                        iconBgColor="bg-amber-50 dark:bg-amber-500/10"
                        delay={100}
                        isVisible={isVisible(1)}
                        variant="sharp"
                        showPulse={kpis.maintenance.pending > 0}
                    />
                    <KPICard
                        title="Custos Mês"
                        value={formatCurrency(kpis.costs.month)}
                        description="mês atual"
                        icon={DollarSign}
                        iconColor="text-lime-600 dark:text-lime-400"
                        iconBgColor="bg-lime-50 dark:bg-lime-500/10"
                        delay={200}
                        isVisible={isVisible(2)}
                        variant="sharp"
                    />
                    <KPICard
                        title={`Conclusão (${selectedYear})`}
                        value={`${kpis.deliveryRate}%`}
                        description={`${kpis.deliveryCompleted} de ${kpis.deliveryTotal} entregas`}
                        icon={TrendingUp}
                        iconColor="text-emerald-600 dark:text-emerald-400"
                        iconBgColor="bg-emerald-50 dark:bg-emerald-500/10"
                        delay={300}
                        isVisible={isVisible(3)}
                        variant="sharp"
                        showPulse={kpis.deliveryRate >= 90}
                    />
                </div>

                {/* Main Content - 90/10 Split */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* LEFT SECTION - Col 1-10 (90%) */}
                    <div className="lg:col-span-10 space-y-6">

                        {/* Gráfico de Entregas - Área */}
                        <AnimatedChart delay={0}>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                        <Truck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                        Entregas - {selectedYear}
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Evolução mensal</p>
                                </div>
                                <Link to="/entregas">
                                    <Button variant="outline" size="sm" className="border-slate-200 dark:border-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                                        Ver detalhes
                                    </Button>
                                </Link>
                            </div>

                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={deliveryTrendData}>
                                    <defs>
                                        <linearGradient id="colorConcluidas" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorEmRota" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#a3e635" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorPendentes" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="dark:opacity-20" />
                                    <XAxis
                                        dataKey="mes"
                                        stroke="#64748b"
                                        style={{ fontSize: '12px' }}
                                    />
                                    <YAxis
                                        stroke="#64748b"
                                        style={{ fontSize: '12px' }}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        wrapperStyle={{ fontSize: '12px' }}
                                        iconType="circle"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="concluidas"
                                        stroke="#10b981"
                                        fillOpacity={1}
                                        fill="url(#colorConcluidas)"
                                        strokeWidth={2}
                                        name="Concluídas"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="em_rota"
                                        stroke="#a3e635"
                                        fillOpacity={1}
                                        fill="url(#colorEmRota)"
                                        strokeWidth={2}
                                        name="Em Rota"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="pendentes"
                                        stroke="#f59e0b"
                                        fillOpacity={1}
                                        fill="url(#colorPendentes)"
                                        strokeWidth={2}
                                        name="Pendentes"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                            </div>
                        </AnimatedChart>

                        {/* Grid 2 colunas - Abastecimento e Manutenção */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Gráfico de Abastecimento - Barras */}
                            <AnimatedChart delay={100}>
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                            <Fuel className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                            Abastecimento
                                        </h3>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Litros por mês ({selectedYear})</p>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <ResponsiveContainer width="100%" height={240}>
                                        <BarChart data={fuelData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="dark:opacity-20" />
                                            <XAxis
                                                dataKey="mes"
                                                stroke="#64748b"
                                                style={{ fontSize: '11px' }}
                                            />
                                            <YAxis
                                                stroke="#64748b"
                                                style={{ fontSize: '11px' }}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar
                                                dataKey="litros"
                                                fill="#10b981"
                                                radius={[8, 8, 0, 0]}
                                                name="Litros"
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                <Link to="/abastecimento" className="mt-4 block">
                                    <Button variant="ghost" size="sm" className="w-full text-slate-600 dark:text-slate-400 h-9 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
                                        Ver histórico completo <ArrowRight className="h-3 w-3 ml-1" />
                                    </Button>
                                </Link>
                                </div>
                            </AnimatedChart>

                            {/* Gráfico de Manutenção - Donut */}
                            <AnimatedChart delay={200}>
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                            <Wrench className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                            Manutenção
                                        </h3>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Distribuição ({selectedYear})</p>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <ResponsiveContainer width="100%" height={240}>
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
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend
                                                verticalAlign="bottom"
                                                height={36}
                                                wrapperStyle={{ fontSize: '11px' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                <Link to="/manutencao" className="mt-4 block">
                                    <Button variant="ghost" size="sm" className="w-full text-slate-600 dark:text-slate-400 h-9 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors">
                                        Ver todas O.S. <ArrowRight className="h-3 w-3 ml-1" />
                                    </Button>
                                </Link>
                                </div>
                            </AnimatedChart>
                        </div>

                        {/* Card Cadastros */}
                        <AnimatedChart delay={300}>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                        <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                        Cadastros Ativos
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Base de dados atual</p>
                                </div>
                                <Link to="/cadastros">
                                    <Button variant="outline" size="sm" className="border-slate-200 dark:border-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                                        Gerenciar
                                    </Button>
                                </Link>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer">
                                    <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{cadastrosCounts.motoristas}</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Motoristas</p>
                                </div>

                                <div className="text-center p-4 bg-lime-50 dark:bg-lime-500/10 rounded-xl border border-lime-100 dark:border-lime-500/20 hover:bg-lime-100 dark:hover:bg-lime-500/20 transition-colors cursor-pointer">
                                    <div className="h-12 w-12 bg-lime-100 dark:bg-lime-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <Truck className="h-6 w-6 text-lime-600 dark:text-lime-400" />
                                    </div>
                                    <p className="text-2xl font-bold text-lime-600 dark:text-lime-400">{cadastrosCounts.veiculos}</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Veículos</p>
                                </div>

                                <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                                    <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <Activity className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                                    </div>
                                    <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{cadastrosCounts.montadores}</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Montadores</p>
                                </div>
                            </div>
                            </div>
                        </AnimatedChart>
                    </div>

                    {/* RIGHT SIDEBAR - Col 11-12 (10%) */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Financeiro CTA */}
                        <div className="bg-gradient-to-br from-emerald-500 to-lime-400 dark:from-emerald-600 dark:to-lime-500 border border-emerald-300 dark:border-emerald-700 rounded-3xl p-6 shadow-xl text-white hover:shadow-2xl transition-shadow duration-300 cursor-pointer">
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

                            <Link to="/acerto-viagem">
                                <Button className="w-full bg-white hover:bg-slate-50 text-emerald-600 font-medium transition-colors shadow-lg hover:shadow-xl">
                                    Revisar Pendências
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </Link>
                        </div>

                        {/* Ações Rápidas */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Ações Rápidas</h3>

                            <div className="space-y-3">
                                <Link to="/cadastros?tab=motoristas">
                                    <Button variant="outline" className="w-full justify-start gap-3 h-12 border-slate-200 dark:border-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 hover:scale-[1.02]">
                                        <div className="h-9 w-9 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg flex items-center justify-center">
                                            <UserPlus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Cadastrar Motorista</span>
                                    </Button>
                                </Link>

                                <Link to="/cadastros?tab=veiculos">
                                    <Button variant="outline" className="w-full justify-start gap-3 h-12 border-slate-200 dark:border-slate-800 hover:bg-lime-50 dark:hover:bg-lime-500/10 hover:border-lime-300 dark:hover:border-lime-700 transition-all duration-200 hover:scale-[1.02]">
                                        <div className="h-9 w-9 bg-lime-50 dark:bg-lime-500/10 rounded-lg flex items-center justify-center">
                                            <CarFront className="h-4 w-4 text-lime-600 dark:text-lime-400" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Cadastrar Veículo</span>
                                    </Button>
                                </Link>

                                <Link to="/entregas">
                                    <Button variant="outline" className="w-full justify-start gap-3 h-12 border-slate-200 dark:border-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 hover:scale-[1.02]">
                                        <div className="h-9 w-9 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg flex items-center justify-center">
                                            <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nova Entrega</span>
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
