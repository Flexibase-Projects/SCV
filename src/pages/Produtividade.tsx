import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WarningAmberOutlined } from '@mui/icons-material';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { SharedFilter } from '@/components/shared/SharedFilter';
import { ProdutividadeKPICards } from '@/components/produtividade/ProdutividadeKPICards';
import { ProdutividadeRelatorio } from '@/components/produtividade/ProdutividadeRelatorio';
import { ProdutividadeRelatorioPorPedido } from '@/components/produtividade/ProdutividadeRelatorioPorPedido';
import { ProdutividadeRetroativoTab } from '@/components/produtividade/ProdutividadeRetroativoTab';
import {
  usePendentesSemProdutividade,
  useProdutividadePorMontador,
  useTodasEntregasMontagemNoPeriodo,
} from '@/hooks/useProdutividade';
import { solidCard } from '@/lib/cardStyles';

const Produtividade = () => {
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('por-pedido');

  const shouldLoadPedido = activeTab === 'por-pedido';
  const shouldLoadMontador = activeTab === 'por-montador';
  const shouldLoadRetroativo = activeTab === 'retroativo';

  const { data: dataMontador, isLoading: isLoadingMontador } = useProdutividadePorMontador(
    dateFrom,
    dateTo,
    { enabled: shouldLoadMontador }
  );

  const { data: todasEntregas = [], isLoading: isLoadingPedidos } = useTodasEntregasMontagemNoPeriodo(
    dateFrom,
    dateTo,
    { enabled: shouldLoadPedido }
  );

  const { data: pendentes = 0 } = usePendentesSemProdutividade();

  const isLoadingKpi = shouldLoadMontador ? isLoadingMontador : isLoadingPedidos;

  const stats = useMemo(() => {
    const entregasKpi = shouldLoadMontador ? (dataMontador?.entregas ?? []) : todasEntregas;
    const concluidas = entregasKpi.filter((e) => e.status_montagem === 'CONCLUIDO');
    const produtividadeTotal = concluidas.reduce((acc, e) => acc + (e.produtividade ?? 0), 0);

    const porMontador = new Map<string, number>();
    for (const entrega of concluidas) {
      if (entrega.montador_1) {
        porMontador.set(
          entrega.montador_1,
          (porMontador.get(entrega.montador_1) ?? 0) + (entrega.produtividade_por_montador ?? 0)
        );
      }
      if (entrega.montador_2) {
        porMontador.set(
          entrega.montador_2,
          (porMontador.get(entrega.montador_2) ?? 0) + (entrega.produtividade_por_montador ?? 0)
        );
      }
    }

    const produtividadeMediaPorMontador =
      porMontador.size > 0
        ? Array.from(porMontador.values()).reduce((acc, value) => acc + value, 0) / porMontador.size
        : 0;

    return {
      totalMontagensConcluidas: concluidas.length,
      produtividadeTotal,
      produtividadeMediaPorMontador,
      pendentesSemConfiguracao: 0,
    };
  }, [dataMontador?.entregas, shouldLoadMontador, todasEntregas]);

  const periodLabel =
    dateFrom && dateTo
      ? `${format(dateFrom, 'dd/MM/yyyy', { locale: ptBR })} a ${format(dateTo, 'dd/MM/yyyy', { locale: ptBR })}`
      : dateFrom
        ? `A partir de ${format(dateFrom, 'dd/MM/yyyy', { locale: ptBR })}`
        : dateTo
          ? `Até ${format(dateTo, 'dd/MM/yyyy', { locale: ptBR })}`
          : 'Todos os períodos';

  return (
    <ModuleLayout>
      <div className="p-8 lg:p-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Produtividade
          </h1>
          <p className="text-slate-500 mt-1">
            Acompanhamento de produtividade dos montadores por período
          </p>
        </div>

        <ProdutividadeKPICards
          stats={stats}
          pendentesSemConfiguracao={pendentes}
          isLoading={isLoadingKpi}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-transparent border-b-0 w-auto justify-start h-auto p-0 gap-6">
              <TabsTrigger
                value="por-pedido"
                className="border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-transparent px-3 py-3 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all rounded-none"
              >
                Relatório por Pedido
              </TabsTrigger>
              <TabsTrigger
                value="por-montador"
                className="border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-transparent px-3 py-3 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all rounded-none"
              >
                Relatório por Montador
              </TabsTrigger>
              <TabsTrigger
                value="retroativo"
                className="border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-transparent px-3 py-3 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all rounded-none"
              >
                Config. Retroativa
                {pendentes > 0 && (
                  <WarningAmberOutlined className="ml-1 shrink-0 text-amber-500" sx={{ fontSize: 18 }} />
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <Card className={solidCard}>
            <CardContent className="p-4">
              <SharedFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                dateFrom={dateFrom}
                onDateFromChange={setDateFrom}
                dateTo={dateTo}
                onDateToChange={setDateTo}
                placeholder="Filtrar por período (use as datas ao lado)"
              />
            </CardContent>
          </Card>

          <TabsContent value="por-pedido" className="mt-0">
            <ProdutividadeRelatorioPorPedido
              entregas={todasEntregas}
              isLoading={isLoadingPedidos}
              periodLabel={periodLabel}
            />
          </TabsContent>

          <TabsContent value="por-montador" className="space-y-4 mt-0">
            <ProdutividadeRelatorio
              montadores={dataMontador?.montadores ?? []}
              isLoading={isLoadingMontador}
              periodLabel={periodLabel}
            />
          </TabsContent>

          <TabsContent value="retroativo" className="mt-0">
            <ProdutividadeRetroativoTab
              dateFrom={dateFrom}
              dateTo={dateTo}
              searchTerm={searchTerm}
              enabled={shouldLoadRetroativo}
            />
          </TabsContent>
        </Tabs>
      </div>
    </ModuleLayout>
  );
};

export default Produtividade;
