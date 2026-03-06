import { useState, useMemo, useEffect } from 'react';
import { AddOutlined as Plus, DescriptionOutlined as FileText, PrintOutlined as Printer } from '@mui/icons-material';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { glassCard, solidCard } from '@/lib/cardStyles';
import { cn } from '@/lib/utils';
import { useAcertosViagem } from '@/hooks/useAcertosViagem';
import { AcertoViagemTable } from '@/components/acertoViagem/AcertoViagemTable';
import { AcertoViagemFormModal } from '@/components/acertoViagem/AcertoViagemFormModal';
import { AcertoViagemDetailModal } from '@/components/acertoViagem/AcertoViagemDetailModal';
import { AcertoViagemPrintModal } from '@/components/acertoViagem/AcertoViagemPrintModal';
import { TablePrintModal, TableColumn, type KpiPrintItem } from '@/components/shared/TablePrintModal';
import { SharedFilter } from '@/components/shared/SharedFilter';
import { PaginationControl } from '@/components/shared/PaginationControl';
import { AcertoViagem } from '@/types/acertoViagem';
import { calcularTotalDespesas, calcularSaldo, calcularDiasViagem } from '@/types/acertoViagem';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';

const ROWS_PER_PAGE = 100;

const AcertoViagemPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [tablePage, setTablePage] = useState(1);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isTablePrintModalOpen, setIsTablePrintModalOpen] = useState(false);
  const [selectedAcerto, setSelectedAcerto] = useState<AcertoViagem | null>(null);
  const [detailAcerto, setDetailAcerto] = useState<AcertoViagem | null>(null);

  const { data: acertos = [], isLoading } = useAcertosViagem();

  const filteredAcertos = useMemo(() => {
    return acertos.filter((acerto) => {
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !searchLower ||
        acerto.destino?.toLowerCase().includes(searchLower) ||
        acerto.motorista_nome?.toLowerCase().includes(searchLower) ||
        acerto.montador_nome?.toLowerCase().includes(searchLower) ||
        acerto.veiculo_placa?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      if (!acerto.data_saida) return !dateFrom && !dateTo;
      const dataSaida = parseISO(acerto.data_saida);
      if (dateFrom && dateTo) {
        return isWithinInterval(dataSaida, {
          start: startOfDay(dateFrom),
          end: endOfDay(dateTo),
        });
      }
      if (dateFrom) return dataSaida >= startOfDay(dateFrom);
      if (dateTo) return dataSaida <= endOfDay(dateTo);
      return true;
    });
  }, [acertos, searchTerm, dateFrom, dateTo]);

  useEffect(() => {
    setTablePage(1);
  }, [searchTerm, dateFrom, dateTo]);

  const slicedAcertos = useMemo(() => {
    if (filteredAcertos.length <= ROWS_PER_PAGE) return filteredAcertos;
    return filteredAcertos.slice((tablePage - 1) * ROWS_PER_PAGE, tablePage * ROWS_PER_PAGE);
  }, [filteredAcertos, tablePage]);
  const totalTablePages = Math.ceil(filteredAcertos.length / ROWS_PER_PAGE);
  const showTablePagination = filteredAcertos.length > ROWS_PER_PAGE;

  // KPIs dinâmicos (baseados nos dados filtrados)
  const totalAcertos = filteredAcertos.length;
  const acertosPendentes = filteredAcertos.filter((a) => a.status === 'PENDENTE').length;
  const acertosFinalizados = filteredAcertos.filter((a) => a.status === 'ACERTADO').length;
  const totalDespesasFiltrado = filteredAcertos.reduce((acc, a) => acc + calcularTotalDespesas(a), 0);

  const printColumns: TableColumn<AcertoViagem>[] = useMemo(
    () => [
      { key: 'destino', label: 'Destino' },
      {
        key: 'motorista_nome',
        label: 'Responsável',
        render: (_, row) =>
          row.motorista_nome && row.montador_nome
            ? `${row.motorista_nome} / ${row.montador_nome}`
            : row.motorista_nome || row.montador_nome || '-',
      },
      {
        key: 'veiculo_placa',
        label: 'Veículo',
        render: (_, row) =>
          row.veiculo_placa
            ? `${row.veiculo_placa}${row.veiculo_modelo ? ` - ${row.veiculo_modelo}` : ''}`
            : '-',
      },
      {
        key: 'data_saida',
        label: 'Período',
        render: (value, row) => {
          const saida = value ? format(new Date(value), 'dd/MM/yyyy') : '-';
          const chegada = row.data_chegada
            ? format(new Date(row.data_chegada + 'T12:00:00'), 'dd/MM/yyyy')
            : '-';
          return `${saida} a ${chegada}`;
        },
      },
      {
        key: 'data_saida',
        label: 'Dias',
        render: (value, row) => {
          const dias = calcularDiasViagem(value, row.data_chegada);
          return dias > 0 ? `${dias} dias` : '-';
        },
      },
      {
        key: 'valor_adiantamento',
        label: 'Adiantamento',
        render: (value) => `R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        className: 'text-right',
      },
      {
        key: 'id',
        label: 'Despesas',
        render: (_, row) => {
          const total = calcularTotalDespesas(row);
          return `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        },
        className: 'text-right font-medium',
      },
      {
        key: 'id',
        label: 'Saldo',
        render: (_, row) => {
          const saldo = calcularSaldo(row);
          return `${saldo.tipo === 'devolver' ? '+' : '-'} R$ ${saldo.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        },
        className: 'text-right',
      },
      {
        key: 'status',
        label: 'Status',
        render: (value) => (value === 'PENDENTE' ? 'Pendente' : 'Acertado'),
      },
    ],
    []
  );

  const filtersText = useMemo(() => {
    const parts: string[] = [];
    if (searchTerm.trim()) parts.push(`Busca: "${searchTerm.trim()}"`);
    if (dateFrom) parts.push(`De: ${format(dateFrom, 'dd/MM/yyyy')}`);
    if (dateTo) parts.push(`Até: ${format(dateTo, 'dd/MM/yyyy')}`);
    return parts.length > 0 ? parts.join(' | ') : 'Todos os registros';
  }, [searchTerm, dateFrom, dateTo]);

  const printKpiItems = useMemo((): KpiPrintItem[] => {
    const formatCurrency = (v: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    return [
      {
        title: 'Total de Acertos',
        value: String(totalAcertos),
        description: 'registros no período',
      },
      {
        title: 'Pendentes',
        value: String(acertosPendentes),
        description: 'aguardando acerto',
      },
      {
        title: 'Acertados',
        value: String(acertosFinalizados),
        description: 'finalizados',
      },
      {
        title: 'Total Despesas',
        value: formatCurrency(totalDespesasFiltrado),
        description: 'soma das despesas',
      },
    ];
  }, [totalAcertos, acertosPendentes, acertosFinalizados, totalDespesasFiltrado]);

  const handleEdit = (acerto: AcertoViagem) => {
    setSelectedAcerto(acerto);
    setIsFormModalOpen(true);
  };

  const handlePrint = (acerto: AcertoViagem) => {
    setSelectedAcerto(acerto);
    setIsPrintModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setSelectedAcerto(null);
  };

  const handleClosePrintModal = () => {
    setIsPrintModalOpen(false);
    setSelectedAcerto(null);
  };

  return (
    <ModuleLayout>
      <div className="min-h-screen bg-white dark:bg-[#0f1115] transition-colors duration-300 px-4 lg:px-8 py-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Header - mesmo estilo Entregas */}
          <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              Acerto de Viagem
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Gerencie os acertos de viagem e despesas • {format(new Date(), 'yyyy')}
            </p>
          </div>

          <div className="space-y-6">
            {/* KPIs - glassCard como Entregas, baseados no filtro */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card
                className={`${glassCard} rounded-2xl min-h-[140px] flex flex-col animate-in fade-in-50 slide-in-from-bottom-4`}
                style={{ animationDelay: '0ms' }}
              >
                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Total de Acertos
                    </span>
                    <div className="h-10 w-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalAcertos}</p>
                  <p className="text-xs text-gray-400 mt-1">registros no período</p>
                </CardContent>
              </Card>
              <Card
                className={`${glassCard} rounded-2xl min-h-[140px] flex flex-col animate-in fade-in-50 slide-in-from-bottom-4`}
                style={{ animationDelay: '100ms' }}
              >
                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Pendentes</span>
                    <div className="h-10 w-10 bg-yellow-50 dark:bg-yellow-500/10 rounded-xl flex items-center justify-center">
                      <FileText className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {acertosPendentes}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">aguardando acerto</p>
                </CardContent>
              </Card>
              <Card
                className={`${glassCard} rounded-2xl min-h-[140px] flex flex-col animate-in fade-in-50 slide-in-from-bottom-4`}
                style={{ animationDelay: '200ms' }}
              >
                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Acertados</span>
                    <div className="h-10 w-10 bg-green-50 dark:bg-green-500/10 rounded-xl flex items-center justify-center">
                      <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {acertosFinalizados}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">finalizados</p>
                </CardContent>
              </Card>
              <Card
                className={`${glassCard} rounded-2xl min-h-[140px] flex flex-col animate-in fade-in-50 slide-in-from-bottom-4`}
                style={{ animationDelay: '300ms' }}
              >
                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Total Despesas
                    </span>
                    <div className="h-10 w-10 bg-orange-50 dark:bg-orange-500/10 rounded-xl flex items-center justify-center">
                      <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    R$ {totalDespesasFiltrado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">soma no período</p>
                </CardContent>
              </Card>
            </div>

            {/* Abas e Tabela - mesmo padrão Entregas (só "Todos" por enquanto) */}
            <Tabs value="todos" className="space-y-6">
              <div className="flex items-center justify-between">
                <TabsList className="bg-transparent border-b-0 w-auto justify-start h-auto p-0 gap-6">
                  <TabsTrigger
                    value="todos"
                    className={cn(
                      'border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-transparent px-3 py-3 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all rounded-none'
                    )}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Todos
                  </TabsTrigger>
                </TabsList>
                <Button
                  onClick={() => setIsFormModalOpen(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg h-10 px-4 font-semibold shadow-sm shadow-emerald-500/20 transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Acerto
                </Button>
              </div>

              <TabsContent value="todos" className="space-y-4 animate-in fade-in-50 duration-300">
                <Card className={cn(solidCard, 'rounded-2xl overflow-hidden')}>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                          Filtrar por:
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <SharedFilter
                          searchTerm={searchTerm}
                          onSearchChange={setSearchTerm}
                          dateFrom={dateFrom}
                          onDateFromChange={setDateFrom}
                          dateTo={dateTo}
                          onDateToChange={setDateTo}
                          placeholder="Buscar por destino, motorista, montador ou placa..."
                        />
                        <Button
                          variant="outline"
                          onClick={() => setIsTablePrintModalOpen(true)}
                          className="gap-2 rounded-lg border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm h-10"
                        >
                          <Printer className="h-4 w-4" />
                          Imprimir / PDF
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <AcertoViagemTable
                  acertos={slicedAcertos}
                  isLoading={isLoading}
                  onEdit={handleEdit}
                  onPrint={handlePrint}
                  onRowClick={(acerto) => setDetailAcerto(acerto)}
                />

                {showTablePagination && (
                  <Card className={cn(solidCard, 'rounded-2xl overflow-hidden')}>
                    <CardContent className="px-4 py-3">
                      <PaginationControl
                        currentPage={tablePage}
                        totalPages={totalTablePages}
                        onPageChange={setTablePage}
                        totalRecords={filteredAcertos.length}
                        itemsPerPage={ROWS_PER_PAGE}
                      />
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AcertoViagemDetailModal
        open={!!detailAcerto}
        onOpenChange={(open) => !open && setDetailAcerto(null)}
        acerto={detailAcerto}
        onEdit={(acerto) => {
          setDetailAcerto(null);
          setSelectedAcerto(acerto);
          setIsFormModalOpen(true);
        }}
      />

      <AcertoViagemFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        acerto={selectedAcerto}
      />

      <AcertoViagemPrintModal
        isOpen={isPrintModalOpen}
        onClose={handleClosePrintModal}
        acertoId={selectedAcerto?.id || null}
      />

      <TablePrintModal
        isOpen={isTablePrintModalOpen}
        onClose={() => setIsTablePrintModalOpen(false)}
        title="Relatório de Acertos de Viagem"
        subtitle="Listagem de acertos de viagem"
        data={filteredAcertos}
        columns={printColumns}
        filters={filtersText}
        kpiItems={printKpiItems}
      />
    </ModuleLayout>
  );
};

export default AcertoViagemPage;
