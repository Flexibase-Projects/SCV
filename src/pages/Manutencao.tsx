import { useState, useMemo, useEffect } from 'react';
import { AddOutlined as Plus, BuildOutlined as Wrench, AttachMoneyOutlined as DollarSign, DirectionsCarOutlined as Car, CalendarTodayOutlined as Calendar, PrintOutlined as Printer, DescriptionOutlined as FileText } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { glassCard, solidCard } from '@/lib/cardStyles';
import { ManutencaoTable } from '@/components/manutencao/ManutencaoTable';
import { ManutencaoFormModal } from '@/components/manutencao/ManutencaoFormModal';
import { DeleteConfirmDialog } from '@/components/dashboard/DeleteConfirmDialog';
import { TablePrintModal, TableColumn } from '@/components/shared/TablePrintModal';
import { PaginationControl } from '@/components/shared/PaginationControl';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { SharedFilter } from '@/components/shared/SharedFilter';
import {
  useManutencoes,
  useCreateManutencao,
  useUpdateManutencao,
  useDeleteManutencao,
} from '@/hooks/useManutencoes';
import type { Manutencao as ManutencaoType, ManutencaoFormData, TipoManutencao } from '@/types/manutencao';

const ROWS_PER_PAGE = 100;

const Manutencao = () => {
  const { data: manutencoes = [], isLoading } = useManutencoes();
  const createManutencao = useCreateManutencao();
  const updateManutencao = useUpdateManutencao();
  const deleteManutencao = useDeleteManutencao();

  const [tablePage, setTablePage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedManutencao, setSelectedManutencao] = useState<ManutencaoType | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [manutencaoToDelete, setManutencaoToDelete] = useState<ManutencaoType | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  useEffect(() => {
    setTablePage(1);
  }, [searchTerm, dateFrom, dateTo]);

  // Valores padrão para o formulário
  const [defaultFormValues, setDefaultFormValues] = useState<{
    tipo?: TipoManutencao;
    veiculoId?: string;
    tipoServico?: string;
  }>({});

  const handleOpenForm = (manutencao?: ManutencaoType) => {
    setSelectedManutencao(manutencao || null);
    setDefaultFormValues({});
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setSelectedManutencao(null);
    setDefaultFormValues({});
    setIsFormOpen(false);
  };


  const handleSubmit = (data: ManutencaoFormData) => {
    if (selectedManutencao) {
      updateManutencao.mutate(
        { id: selectedManutencao.id, data },
        { onSuccess: handleCloseForm }
      );
    } else {
      createManutencao.mutate(data, { onSuccess: handleCloseForm });
    }
  };

  const handleOpenDeleteDialog = (manutencao: ManutencaoType) => {
    setManutencaoToDelete(manutencao);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (manutencaoToDelete) {
      deleteManutencao.mutate(manutencaoToDelete.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setManutencaoToDelete(null);
        },
      });
    }
  };

  const filteredManutencoes = useMemo(() => {
    return manutencoes.filter(m => {
      const matchesSearch =
        searchTerm === '' ||
        m.veiculo_placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.tipo_servico?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.estabelecimento?.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesDate = true;
      if (m.data) {
        const date = parseISO(m.data);
        if (dateFrom && dateTo) {
          matchesDate = isWithinInterval(date, {
            start: startOfDay(dateFrom),
            end: endOfDay(dateTo)
          });
        } else if (dateFrom) {
          matchesDate = date >= startOfDay(dateFrom);
        } else if (dateTo) {
          matchesDate = date <= endOfDay(dateTo);
        }
      } else if (dateFrom || dateTo) {
        matchesDate = false;
      }

      return matchesSearch && matchesDate;
    });
  }, [manutencoes, searchTerm, dateFrom, dateTo]);

  // Cálculos para os cards de resumo usando dados filtrados
  const totalManutencoes = filteredManutencoes.length;
  const custoTotalGeral = filteredManutencoes.reduce((acc, m) => acc + (m.custo_total || 0), 0);

  // Manutenções do período filtrado (ou mês atual se sem filtro)
  const custoPeriodo = filteredManutencoes.reduce((acc, m) => acc + (m.custo_total || 0), 0);

  // Veículos únicos com manutenção
  const veiculosUnicos = new Set(filteredManutencoes.map((m) => m.veiculo_id)).size;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Configuração de colunas para impressão
  const printColumns: TableColumn<ManutencaoType>[] = useMemo(() => [
    {
      key: 'data',
      label: 'Data',
      render: (value) => value ? format(new Date(value + 'T00:00:00'), 'dd/MM/yyyy') : '-'
    },
    { key: 'veiculo_placa', label: 'Veículo' },
    {
      key: 'tipo_manutencao',
      label: 'Tipo',
      render: (value) => value === 'preventiva' ? 'Preventiva' : 'Corretiva'
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        switch (value) {
          case 'pendente': return 'Pendente';
          case 'em_andamento': return 'Em Andamento';
          case 'resolvida': return 'Resolvida';
          default: return String(value);
        }
      }
    },
    { key: 'tipo_servico', label: 'Serviço' },
    { key: 'estabelecimento', label: 'Estabelecimento' },
    {
      key: 'custo_total',
      label: 'Custo',
      render: (value) => formatCurrency(value || 0),
      className: 'text-right font-medium'
    },
    {
      key: 'km_manutencao',
      label: 'KM',
      render: (value) => value ? `${value.toLocaleString('pt-BR')} km` : '0 km',
      className: 'text-right'
    },
  ], []);

  const filtersText = useMemo(() => {
    const filters: string[] = [];
    if (searchTerm) filters.push(`Busca: "${searchTerm}"`);
    if (dateFrom) filters.push(`De: ${format(dateFrom, 'dd/MM/yyyy')}`);
    if (dateTo) filters.push(`Até: ${format(dateTo, 'dd/MM/yyyy')}`);
    return filters.length > 0 ? filters.join(' | ') : 'Todos os registros';
  }, [searchTerm, dateFrom, dateTo]);

  const slicedManutencoes = useMemo(() => {
    if (filteredManutencoes.length <= ROWS_PER_PAGE) return filteredManutencoes;
    return filteredManutencoes.slice((tablePage - 1) * ROWS_PER_PAGE, tablePage * ROWS_PER_PAGE);
  }, [filteredManutencoes, tablePage]);
  const totalTablePages = Math.ceil(filteredManutencoes.length / ROWS_PER_PAGE);
  const showTablePagination = filteredManutencoes.length > ROWS_PER_PAGE;

  return (
    <ModuleLayout>
      <div className="min-h-screen bg-white dark:bg-[#0f1115] transition-colors duration-300 px-4 lg:px-8 py-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* HEADER - estilo glass (Dashboard/Entregas/Abastecimento) */}
          <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              Controle de Manutenção
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Gerenciamento de manutenções da frota • {format(new Date(), 'yyyy')}
            </p>
          </div>

        <div className="space-y-6">
          {/* KPIs - Card com glassCard (Dashboard/Entregas/Abastecimento) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className={`${glassCard} rounded-2xl min-h-[140px] flex flex-col animate-in fade-in-50 slide-in-from-bottom-4`} style={{ animationDelay: '0ms' }}>
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Manutenções</span>
                  <div className="h-10 w-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <Wrench className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalManutencoes}</p>
                <p className="text-xs text-gray-400 mt-1">registros encontrados</p>
              </CardContent>
            </Card>

            <Card className={`${glassCard} rounded-2xl min-h-[140px] flex flex-col animate-in fade-in-50 slide-in-from-bottom-4`} style={{ animationDelay: '100ms' }}>
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Custo Total</span>
                  <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(custoTotalGeral)}
                </p>
                <p className="text-xs text-gray-400 mt-1">custo acumulado</p>
              </CardContent>
            </Card>

            <Card className={`${glassCard} rounded-2xl min-h-[140px] flex flex-col animate-in fade-in-50 slide-in-from-bottom-4`} style={{ animationDelay: '200ms' }}>
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Custo no Período</span>
                  <div className="h-10 w-10 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(custoPeriodo)}
                </p>
                <p className="text-xs text-gray-400 mt-1">custo filtrado</p>
              </CardContent>
            </Card>

            <Card className={`${glassCard} rounded-2xl min-h-[140px] flex flex-col animate-in fade-in-50 slide-in-from-bottom-4`} style={{ animationDelay: '300ms' }}>
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Veículos Atendidos</span>
                  <div className="h-10 w-10 bg-purple-50 dark:bg-purple-500/10 rounded-xl flex items-center justify-center">
                    <Car className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{veiculosUnicos}</p>
                <p className="text-xs text-gray-400 mt-1">veículos distintos</p>
              </CardContent>
            </Card>
          </div>

          {/* Barra de ação - mesma estrutura de Entregas/Abastecimento (linha com "aba" à esquerda e botão à direita) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 px-0 py-3 text-sm font-medium">
              <FileText className="h-4 w-4" />
              Listagem
            </div>
            <Button
              onClick={() => handleOpenForm()}
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg h-10 px-4 font-semibold shadow-sm shadow-emerald-500/20 transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Manutenção
            </Button>
          </div>

          {/* Filtros em Card sólido (padrão Entregas/Abastecimento) */}
          <div className="space-y-4">
            <Card className={`${solidCard} rounded-2xl overflow-hidden`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <SharedFilter
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    dateFrom={dateFrom}
                    onDateFromChange={setDateFrom}
                    dateTo={dateTo}
                    onDateToChange={setDateTo}
                    placeholder="Buscar por placa, serviço ou estabelecimento..."
                  />
                  <Button
                    variant="outline"
                    onClick={() => setIsPrintModalOpen(true)}
                    className="gap-2 rounded-lg border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm h-10"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimir / PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            <ManutencaoTable
              manutencoes={slicedManutencoes}
              onEdit={handleOpenForm}
              onDelete={handleOpenDeleteDialog}
              isLoading={isLoading}
            />
            {showTablePagination && (
              <Card className={`${solidCard} rounded-2xl overflow-hidden`}>
                <CardContent className="px-4 py-3">
                  <PaginationControl
                    currentPage={tablePage}
                    totalPages={totalTablePages}
                    onPageChange={setTablePage}
                    totalRecords={filteredManutencoes.length}
                    itemsPerPage={ROWS_PER_PAGE}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Modal de formulário */}
        <ManutencaoFormModal
          open={isFormOpen}
          onOpenChange={handleCloseForm}
          manutencao={selectedManutencao}
          onSubmit={handleSubmit}
          isLoading={createManutencao.isPending || updateManutencao.isPending}
          defaultTipo={defaultFormValues.tipo}
          defaultVeiculoId={defaultFormValues.veiculoId}
          defaultTipoServico={defaultFormValues.tipoServico}
        />

        {/* Dialog de confirmação de exclusão */}
        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          isLoading={deleteManutencao.isPending}
          title="Excluir Manutenção"
          description="Tem certeza que deseja excluir este registro de manutenção? Esta ação não pode ser desfeita."
        />

        <TablePrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          title="Relatório de Manutenções"
          subtitle="Listagem completa de manutenções"
          data={filteredManutencoes}
          columns={printColumns}
          filters={filtersText}
        />
        </div>
      </div>
    </ModuleLayout>
  );
};

export default Manutencao;
