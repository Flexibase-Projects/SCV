import { useState, useMemo } from 'react';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { ResumoGeralPrintModal } from '@/components/shared/ResumoGeralPrintModal';
import { useEntregas } from '@/hooks/useEntregas';
import { useAbastecimentos } from '@/hooks/useAbastecimentos';
import { useManutencoes } from '@/hooks/useManutencoes';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { FinancialOverview } from '@/components/reports/FinancialOverview';
import { OperationalReport } from '@/components/reports/OperationalReport';
import { FleetReport } from '@/components/reports/FleetReport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, Truck, Wrench } from 'lucide-react';

const ResumoGeral = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Data Fetching
  const { data: entregas = [] } = useEntregas();
  const { data: abastecimentos = [] } = useAbastecimentos();
  const { data: manutencoes = [] } = useManutencoes();

  // Filter Logic
  const filteredEntregas = useMemo(() => {
    return entregas.filter(e => {
      if (!e.data_saida) return false;
      const date = new Date(e.data_saida);
      return date.getMonth() === parseInt(selectedMonth) && date.getFullYear() === parseInt(selectedYear);
    });
  }, [entregas, selectedMonth, selectedYear]);

  const filteredAbastecimentos = useMemo(() => {
    return abastecimentos.filter(a => {
      const date = new Date(a.data);
      return date.getMonth() === parseInt(selectedMonth) && date.getFullYear() === parseInt(selectedYear);
    });
  }, [abastecimentos, selectedMonth, selectedYear]);

  const filteredManutencoes = useMemo(() => {
    return manutencoes.filter(m => {
      const date = new Date(m.data);
      return date.getMonth() === parseInt(selectedMonth) && date.getFullYear() === parseInt(selectedYear);
    });
  }, [manutencoes, selectedMonth, selectedYear]);

  // Derived Metrics
  const valorExpedidoMes = filteredEntregas.reduce((acc, e) => acc + (e.valor || 0), 0);
  const custoManutencaoGeralMes = filteredManutencoes.reduce((acc, m) => acc + (m.custo_total || 0), 0);
  const custoAbastecimentoGeralMes = filteredAbastecimentos.reduce((acc, a) => acc + (a.valor_total || 0), 0);
  const margemOperacional = valorExpedidoMes - custoManutencaoGeralMes - custoAbastecimentoGeralMes;

  const statusCounts = useMemo(() => {
    const statusMap: Record<string, number> = {
      'PENDENTE': 0, 'EM ROTA': 0, 'CONCLUIDO': 0, 'ENTREGUE': 0,
      'EM MONTAGEM': 0, 'AGUARDANDO MONTAGEM': 0, 'MONTAGEM PARCIAL': 0,
    };
    filteredEntregas.forEach(e => {
      if (e.status && statusMap[e.status] !== undefined) {
        statusMap[e.status] += 1;
      } else if (e.status) {
        statusMap[e.status] = (statusMap[e.status] || 0) + 1;
      }
    });
    return statusMap;
  }, [filteredEntregas]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(currentDate.getFullYear());
    years.add(currentDate.getFullYear() - 1);
    const getYear = (dateStr?: string) => dateStr ? new Date(dateStr).getFullYear() : null;
    entregas.forEach(e => { const y = getYear(e.data_saida); if (y) years.add(y); });
    abastecimentos.forEach(a => { const y = getYear(a.data); if (y) years.add(y); });
    manutencoes.forEach(m => { const y = getYear(m.data); if (y) years.add(y); });
    return Array.from(years).sort((a, b) => b - a);
  }, [entregas, abastecimentos, manutencoes, currentDate]);

  // Specific Report Data
  const entregasPorVeiculo = useMemo(() => {
    const map: Record<string, { carro: string; qtd: number; valor: number }> = {};
    filteredEntregas.forEach(e => {
      const carro = e.carro || 'Não informado';
      if (!map[carro]) map[carro] = { carro, qtd: 0, valor: 0 };
      map[carro].qtd += 1;
      map[carro].valor += e.valor || 0;
    });
    return Object.values(map).sort((a, b) => b.qtd - a.qtd);
  }, [filteredEntregas]);

  const entregasPorUF = useMemo(() => {
    const map: Record<string, { uf: string; qtd: number; valor: number }> = {};
    filteredEntregas.forEach(e => {
      const uf = e.uf || 'N/A';
      if (!map[uf]) map[uf] = { uf, qtd: 0, valor: 0 };
      map[uf].qtd += 1;
      map[uf].valor += e.valor || 0;
    });
    return Object.values(map).sort((a, b) => b.valor - a.valor);
  }, [filteredEntregas]);

  const kmRodadoPorVeiculo = useMemo(() => {
    const kmMap: Record<string, { placa: string; kmMin: number; kmMax: number }> = {};
    filteredAbastecimentos.forEach(a => {
      if (a.veiculo_id && a.km_inicial) {
        if (!kmMap[a.veiculo_id]) {
          kmMap[a.veiculo_id] = { placa: a.veiculo_placa || 'N/A', kmMin: a.km_inicial, kmMax: a.km_inicial };
        } else {
          kmMap[a.veiculo_id].kmMin = Math.min(kmMap[a.veiculo_id].kmMin, a.km_inicial);
          kmMap[a.veiculo_id].kmMax = Math.max(kmMap[a.veiculo_id].kmMax, a.km_inicial);
        }
      }
    });
    return Object.entries(kmMap).map(([id, data]) => ({
      id, placa: data.placa, kmRodado: data.kmMax - data.kmMin, kmInicial: data.kmMin, kmFinal: data.kmMax,
    })).filter(v => v.kmRodado > 0).sort((a, b) => b.kmRodado - a.kmRodado);
  }, [filteredAbastecimentos]);

  const custoAbastecimentoPorVeiculo = useMemo(() => {
    const map: Record<string, { placa: string; custo: number; litros: number }> = {};
    filteredAbastecimentos.forEach(a => {
      if (!map[a.veiculo_id]) map[a.veiculo_id] = { placa: a.veiculo_placa || 'N/A', custo: 0, litros: 0 };
      map[a.veiculo_id].custo += a.valor_total || 0;
      map[a.veiculo_id].litros += a.litros || 0;
    });
    return Object.entries(map).map(([id, data]) => ({ id, ...data })).sort((a, b) => b.custo - a.custo);
  }, [filteredAbastecimentos]);

  const custoManutencaoPorVeiculo = useMemo(() => {
    const map: Record<string, { placa: string; custo: number; qtd: number }> = {};
    filteredManutencoes.forEach(m => {
      if (!map[m.veiculo_id]) map[m.veiculo_id] = { placa: m.veiculo_placa || 'N/A', custo: 0, qtd: 0 };
      map[m.veiculo_id].custo += m.custo_total || 0;
      map[m.veiculo_id].qtd += 1;
    });
    return Object.entries(map).map(([id, data]) => ({ id, ...data })).sort((a, b) => b.custo - a.custo);
  }, [filteredManutencoes]);

  const custoCombustivelPorEstado = useMemo(() => {
    const map: Record<string, { estado: string; totalValor: number; totalLitros: number; qtd: number }> = {};
    filteredAbastecimentos.forEach(a => {
      const estado = a.estado || 'N/A';
      if (!map[estado]) map[estado] = { estado, totalValor: 0, totalLitros: 0, qtd: 0 };
      map[estado].totalValor += a.valor_unitario || 0;
      map[estado].totalLitros += a.litros || 0;
      map[estado].qtd += 1;
    });
    return Object.values(map).map(e => ({
      ...e,
      mediaPreco: e.qtd > 0 ? e.totalValor / e.qtd : 0,
    })).sort((a, b) => b.totalLitros - a.totalLitros);
  }, [filteredAbastecimentos]);

  // For Printing (Keep existing logic or pass to modal)
  const metricasSelecionadas = [ // Passing all for print as "legacy" support or allow all
    'valor-expedido', 'km-rodado', 'entregas-veiculo', 'entregas-uf',
    'custo-abastecimento', 'custo-manutencao', 'combustivel-estado', 'controle-status'
  ];

  return (
    <ModuleLayout>
      <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Resumo Geral</h1>
          <p className="text-muted-foreground">Métricas e indicadores de desempenho da operação</p>
        </div>

        <ReportFilters
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          availableYears={availableYears}
          onPrint={() => setIsPrintModalOpen(true)}
        />

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="bg-muted p-1 rounded-xl w-full sm:w-auto flex">
            <TabsTrigger value="overview" className="flex-1 sm:flex-none gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
              <LayoutDashboard className="h-4 w-4" />
              Visão Financeira
            </TabsTrigger>
            <TabsTrigger value="operational" className="flex-1 sm:flex-none gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
              <Truck className="h-4 w-4" />
              Operacional
            </TabsTrigger>
            <TabsTrigger value="fleet" className="flex-1 sm:flex-none gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
              <Wrench className="h-4 w-4" />
              Frota
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <FinancialOverview
              valorExpedido={valorExpedidoMes}
              custoManutencao={custoManutencaoGeralMes}
              custoAbastecimento={custoAbastecimentoGeralMes}
              margemOperacional={margemOperacional}
              statusCounts={statusCounts}
              totalPedidos={filteredEntregas.length}
            />
          </TabsContent>

          <TabsContent value="operational" className="mt-0">
            <OperationalReport
              entregasPorVeiculo={entregasPorVeiculo}
              entregasPorUF={entregasPorUF}
            />
          </TabsContent>

          <TabsContent value="fleet" className="mt-0">
            <FleetReport
              kmRodadoPorVeiculo={kmRodadoPorVeiculo}
              custoAbastecimentoPorVeiculo={custoAbastecimentoPorVeiculo}
              custoManutencaoPorVeiculo={custoManutencaoPorVeiculo}
              custoCombustivelPorEstado={custoCombustivelPorEstado}
            />
          </TabsContent>
        </Tabs>

        {/* Mantendo o Modal de Impressão (Hidden logic handle) */}
        <ResumoGeralPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          metricasSelecionadas={metricasSelecionadas}
          valorExpedidoMes={valorExpedidoMes}
          custoManutencaoGeralMes={custoManutencaoGeralMes}
          custoAbastecimentoGeralMes={custoAbastecimentoGeralMes}
          margemOperacional={margemOperacional}
          kmRodadoPorVeiculo={kmRodadoPorVeiculo}
          entregasPorVeiculo={entregasPorVeiculo}
          entregasPorUF={entregasPorUF}
          custoAbastecimentoPorVeiculo={custoAbastecimentoPorVeiculo}
          custoManutencaoPorVeiculo={custoManutencaoPorVeiculo}
          custoCombustivelPorEstado={custoCombustivelPorEstado}
          statusCounts={statusCounts}
          totalEntregas={filteredEntregas.length}
        />
      </div>
    </ModuleLayout>
  );
};

export default ResumoGeral;
