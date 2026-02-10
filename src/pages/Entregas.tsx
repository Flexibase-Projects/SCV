import { useState, useMemo, useEffect } from 'react';
import { Add as Plus, Print as Printer, Delete as TrashIcon, Description as FileText, Person as User, DirectionsCar, CalendarMonth as CalendarIcon } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { KPICards } from '@/components/dashboard/KPICards';
import { solidCard } from '@/lib/cardStyles';
import { EntregaTable } from '@/components/dashboard/EntregaTable';
import { EntregaFormModal } from '@/components/dashboard/EntregaFormModal';
import { DeleteConfirmDialog } from '@/components/dashboard/DeleteConfirmDialog';
import { TablePrintModal, TableColumn } from '@/components/shared/TablePrintModal';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { useEntregasPaginated, useEntregasStats, useCreateEntrega, useUpdateEntrega, useDeleteEntrega, useDeleteEntregasBulk, useMotoristasEntregas, useVeiculosEntregas, type DateFieldFilter } from '@/hooks/useEntregas';
import { Entrega, EntregaFormData, StatusEntrega, TIPO_TRANSPORTE_LABELS, STATUS_MONTAGEM_LABELS } from '@/types/entrega';
import { format } from 'date-fns';
import { formatDateLocal } from '@/utils/dateUtils';
import { SharedFilter } from '@/components/shared/SharedFilter';
import { useDebounce } from '@/hooks/use-debounce';
import { PaginationControl } from '@/components/shared/PaginationControl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const Entregas = () => {
  // Tab State
  const [activeTab, setActiveTab] = useState('todos');

  // Pagination State (100 rows per page to avoid excess render; virtual scroll within page)
  const [page, setPage] = useState(1);
  const pageSize = 100;

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [dateField, setDateField] = useState<DateFieldFilter>('data_saida');

  // Estados específicos da aba "Por Motorista"
  const [selectedMotorista, setSelectedMotorista] = useState<string | null>(null);
  const [selectedDateMotorista, setSelectedDateMotorista] = useState<Date | null>(null);

  // Estados específicos da aba "Por Veículo"
  const [selectedVeiculo, setSelectedVeiculo] = useState<string | null>(null);
  const [selectedDateVeiculo, setSelectedDateVeiculo] = useState<Date | null>(null);

  // Hooks para buscar valores únicos
  const { data: motoristasList = [] } = useMotoristasEntregas();
  const { data: veiculosList = [] } = useVeiculosEntregas();

  // Data Fetching (Server-Side Pagination)
  const {
    data: paginatedResult,
    isLoading,
    isFetching
  } = useEntregasPaginated({
    page,
    pageSize,
    searchTerm: activeTab === 'todos' ? debouncedSearchTerm : undefined,
    dateFrom: activeTab === 'todos' ? dateFrom : null,
    dateTo: activeTab === 'todos' ? dateTo : null,
    dateField: activeTab === 'todos' ? dateField : 'data_saida',
    motorista: activeTab === 'por-motorista' ? selectedMotorista : null,
    veiculo: activeTab === 'por-veiculo' ? selectedVeiculo : null,
    dataEspecifica: activeTab === 'por-motorista' ? selectedDateMotorista : 
                    activeTab === 'por-veiculo' ? selectedDateVeiculo : null
  });

  const entregas = paginatedResult?.data || [];
  const totalRecords = paginatedResult?.count || 0;
  const totalPages = Math.ceil(totalRecords / pageSize);

  // Stats Fetching (Global Stats for Filters)
  // Get stats with filters for table calculations
  const { data: stats } = useEntregasStats({
    searchTerm: debouncedSearchTerm,
    dateFrom,
    dateTo
  });

  // Get total stats WITHOUT date filters for KPI display (shows total regardless of filters)
  const { data: totalStats } = useEntregasStats({
    searchTerm: debouncedSearchTerm,
    dateFrom: null,
    dateTo: null
  });

  // Always use totalStats for KPI if available, otherwise fallback to filtered stats
  const kpiStats = useMemo(() => {
    return totalStats ?? stats;
  }, [totalStats, stats]);

  const createEntrega = useCreateEntrega();
  const updateEntrega = useUpdateEntrega();
  const deleteEntrega = useDeleteEntrega();
  const deleteBulk = useDeleteEntregasBulk();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEntrega, setSelectedEntrega] = useState<Entrega | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [entregaToDelete, setEntregaToDelete] = useState<Entrega | null>(null);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Limpar filtros e seleção ao mudar de aba
  useEffect(() => {
    if (activeTab !== 'por-motorista') {
      setSelectedMotorista(null);
      setSelectedDateMotorista(null);
    }
    if (activeTab !== 'por-veiculo') {
      setSelectedVeiculo(null);
      setSelectedDateVeiculo(null);
    }
    setPage(1);
    setSelectedIds(new Set());
  }, [activeTab]);


  // Resetar página quando filtros mudam
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, dateFrom, dateTo, dateField, selectedMotorista, selectedDateMotorista, selectedVeiculo, selectedDateVeiculo]);

  // Dados já filtrados no servidor
  const filteredEntregas = entregas;

  // Configuração de colunas para impressão - TODOS os campos cadastrados
  const printColumns: TableColumn<Entrega>[] = useMemo(() => [
    // Dados do Pedido
    { key: 'pv_foco', label: 'PV Foco' },
    { key: 'nf', label: 'NF' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'uf', label: 'UF' },
    {
      key: 'valor',
      label: 'Valor',
      render: (value) => value ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-',
      className: 'text-right'
    },
    { key: 'status', label: 'Status' },
    // Dados do Transporte
    {
      key: 'data_saida',
      label: 'Data Saída',
      render: (value) => {
        if (!value) return '-';
        // Parse string ISO (YYYY-MM-DD) diretamente sem conversão de timezone
        const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
          const [, year, month, day] = match;
          return `${day}/${month}/${year}`;
        }
        return format(new Date(value + 'T12:00:00'), 'dd/MM/yyyy');
      }
    },
    { key: 'motorista', label: 'Motorista' },
    { key: 'carro', label: 'Veículo' },
    {
      key: 'tipo_transporte',
      label: 'Tipo Transporte',
      render: (value) => (value && TIPO_TRANSPORTE_LABELS[value]) ? TIPO_TRANSPORTE_LABELS[value] : (value || '-')
    },
    // Montagem
    {
      key: 'precisa_montagem',
      label: 'Precisa Montagem',
      render: (value) => value ? 'SIM' : 'NÃO'
    },
    {
      key: 'status_montagem',
      label: 'Status Montagem',
      render: (value) => (value && STATUS_MONTAGEM_LABELS[value as keyof typeof STATUS_MONTAGEM_LABELS]) ? STATUS_MONTAGEM_LABELS[value as keyof typeof STATUS_MONTAGEM_LABELS] : (value || '-')
    },
    {
      key: 'data_montagem',
      label: 'Data Montagem',
      render: (value) => {
        if (!value) return '-';
        // Parse string ISO (YYYY-MM-DD) diretamente sem conversão de timezone
        const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
          const [, year, month, day] = match;
          return `${day}/${month}/${year}`;
        }
        return format(new Date(value + 'T12:00:00'), 'dd/MM/yyyy');
      }
    },
    { key: 'montador_1', label: 'Montador 1' },
    { key: 'montador_2', label: 'Montador 2' },
    // Custos
    {
      key: 'gastos_entrega',
      label: 'Gastos Entrega',
      render: (value) => value ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-',
      className: 'text-right'
    },
    {
      key: 'gastos_montagem',
      label: 'Gastos Montagem',
      render: (value) => value ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-',
      className: 'text-right'
    },
    {
      key: 'produtividade',
      label: 'Produtividade',
      render: (value) => value ? value.toString() : '-'
    },
    {
      key: 'percentual_gastos',
      label: '% Gastos',
      render: (value) => value ? `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%` : '-',
      className: 'text-right'
    },
    // Observações
    { key: 'erros', label: 'Erros' },
    { key: 'descricao_erros', label: 'Descrição dos Erros' },
  ], []);

  // Texto descritivo dos filtros aplicados
  const filtersText = useMemo(() => {
    const filters: string[] = [];
    if (searchTerm) filters.push(`Busca: "${searchTerm}"`);
    if (dateField) filters.push(dateField === 'created_at' ? 'Por data de criação' : 'Por data de saída');
    if (dateFrom) filters.push(`De: ${format(dateFrom, 'dd/MM/yyyy')}`);
    if (dateTo) filters.push(`Até: ${format(dateTo, 'dd/MM/yyyy')}`);
    return filters.length > 0 ? filters.join(' | ') : 'Todos os registros';
  }, [searchTerm, dateField, dateFrom, dateTo]);

  const handleOpenForm = (entrega?: Entrega) => {
    setSelectedEntrega(entrega || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedEntrega(null);
  };

  const handleSubmit = (data: Partial<EntregaFormData> & { montadores?: string; montador_1?: string; montador_2?: string; data_saida?: Date; data_montagem?: Date }) => {
    // Remover o campo 'montadores' pois o banco usa montador_1 e montador_2
    const { montadores, ...restData } = data;

    const formattedData = {
      ...restData,
      data_saida: data.data_saida ? formatDateLocal(data.data_saida) : null,
      data_montagem: data.data_montagem ? formatDateLocal(data.data_montagem) : null,
      percentual_gastos: data.valor && data.gastos_entrega
        ? ((data.gastos_entrega / data.valor) * 100)
        : 0,
    };

    if (selectedEntrega) {
      updateEntrega.mutate(
        { id: selectedEntrega.id, data: formattedData },
        { onSuccess: handleCloseForm }
      );
    } else {
      createEntrega.mutate(formattedData, {
        onSuccess: () => {
          handleCloseForm();
          setDateField('created_at');
          setDateFrom(null);
          setDateTo(null);
          setPage(1);
        }
      });
    }
  };

  const handleOpenDeleteDialog = (entrega: Entrega) => {
    setEntregaToDelete(entrega);
    setIsDeleteDialogOpen(true);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (ids: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleConfirmBulkDelete = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    deleteBulk.mutate(ids, {
      onSuccess: () => {
        setSelectedIds(new Set());
        setIsBulkDeleteDialogOpen(false);
      }
    });
  };

  const handleConfirmDelete = () => {
    if (entregaToDelete) {
      deleteEntrega.mutate(entregaToDelete.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setEntregaToDelete(null);
        }
      });
    }
  };

  // Skeleton apenas na primeira carga (sem dados ainda); refetch mostra indicador leve
  const isFirstLoad = !paginatedResult && isLoading;
  if (isFirstLoad) {
    return (
      <ModuleLayout>
        <div className="min-h-screen bg-white dark:bg-[#0f1115] transition-colors duration-300 px-4 lg:px-8 py-6">
          <div className="max-w-[1600px] mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-2">
                <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
              </div>
              <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
            <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          </div>
        </div>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout>
      <div className="min-h-screen bg-white dark:bg-[#0f1115] transition-colors duration-300 px-4 lg:px-8 py-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* HEADER - mesmo estilo do Dashboard */}
          <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              Controle de Entregas
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Gerenciamento Logístico • {format(new Date(), 'yyyy')}
            </p>
          </div>

          <div className="space-y-6">
            <KPICards entregas={filteredEntregas} stats={kpiStats} />

          {/* Abas e Tabela */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList className="bg-transparent border-b-0 w-auto justify-start h-auto p-0 gap-6">
              <TabsTrigger 
                value="todos"
                className="border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-transparent px-0 py-3 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all"
              >
                <FileText className="h-4 w-4 mr-2" />
                Todos
              </TabsTrigger>
              <TabsTrigger 
                value="por-motorista"
                className="border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-transparent px-0 py-3 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all"
              >
                <User className="h-4 w-4 mr-2" />
                Por Motorista
              </TabsTrigger>
              <TabsTrigger 
                value="por-veiculo"
                className="border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-transparent px-0 py-3 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all"
              >
                <DirectionsCar className="h-4 w-4 mr-2" />
                Por Veículo
              </TabsTrigger>
            </TabsList>
            <Button 
              onClick={() => handleOpenForm()} 
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg h-10 px-4 font-semibold shadow-sm shadow-emerald-500/20 transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Entrega
            </Button>
            </div>

            <TabsContent value="todos" className="space-y-4 animate-in fade-in-50 duration-300">
              <Card className={cn(solidCard, 'rounded-2xl overflow-hidden', isFetching && 'relative')}>
                {isFetching && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500/60 animate-pulse z-10 rounded-t-2xl" aria-hidden />
                )}
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Filtrar por:</span>
                      <Select value={dateField} onValueChange={(v) => setDateField(v as DateFieldFilter)}>
                        <SelectTrigger className="w-[180px] h-10 rounded-xl border-gray-100 dark:border-white/5 bg-brand-white dark:bg-[#181b21]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="data_saida">Data de saída</SelectItem>
                          <SelectItem value="created_at">Data de criação</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <SharedFilter
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        dateFrom={dateFrom}
                        onDateFromChange={setDateFrom}
                        dateTo={dateTo}
                        onDateToChange={setDateTo}
                        placeholder="Buscar por cliente, PV Foco, NF ou motorista..."
                      />
                      {selectedIds.size > 0 && (
                        <Button
                          variant="outline"
                          onClick={() => setIsBulkDeleteDialogOpen(true)}
                          className="gap-2 rounded-lg border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/50 text-red-700 dark:text-red-400 font-medium text-sm h-10"
                        >
                          <TrashIcon className="h-4 w-4" />
                          Excluir selecionados ({selectedIds.size})
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => setIsPrintModalOpen(true)}
                        className="gap-2 rounded-lg border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm h-10"
                      >
                        <Printer className="h-4 w-4" />
                        Imprimir / PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <EntregaTable
                entregas={filteredEntregas}
                onEdit={handleOpenForm}
                onDelete={handleOpenDeleteDialog}
                selection={{
                  selectedIds,
                  onToggle: handleToggleSelect,
                  onSelectAll: handleSelectAll,
                  allIds: filteredEntregas.map((e) => e.id),
                }}
              />
              {totalPages > 1 && (
                <Card className={`${solidCard} rounded-2xl overflow-hidden`}>
                  <CardContent className="px-4 py-3">
                    <PaginationControl
                      currentPage={page}
                      totalPages={totalPages}
                      onPageChange={setPage}
                      totalRecords={totalRecords}
                      itemsPerPage={pageSize}
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="por-motorista" className="space-y-4 animate-in fade-in-50 duration-300">
              <Card className={`${solidCard} rounded-2xl overflow-hidden`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 max-w-md">
                      <Select value={selectedMotorista || ''} onValueChange={(value) => setSelectedMotorista(value || null)}>
                        <SelectTrigger className="rounded-lg border-slate-200 dark:border-slate-800 focus:ring-0 focus:border-emerald-500 h-10">
                          <SelectValue placeholder="Selecione um motorista..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border-slate-200 dark:border-slate-800">
                          {motoristasList.map((motorista) => (
                            <SelectItem key={motorista} value={motorista}>
                              {motorista}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-[220px] justify-start text-left font-normal rounded-lg border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 h-10",
                              !selectedDateMotorista && "text-slate-400"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                            {selectedDateMotorista ? format(selectedDateMotorista, 'dd/MM/yyyy') : 'Filtrar por data...'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-lg border-slate-200 dark:border-slate-800" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDateMotorista || undefined}
                            onSelect={(date) => setSelectedDateMotorista(date || null)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {(selectedMotorista || selectedDateMotorista) && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSelectedMotorista(null);
                          setSelectedDateMotorista(null);
                        }}
                        className="rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-medium h-10"
                      >
                        Limpar Filtros
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      onClick={() => setIsPrintModalOpen(true)}
                      className="gap-2 ml-auto rounded-lg border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm h-10"
                    >
                      <Printer className="h-4 w-4" />
                      Imprimir / PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {!selectedMotorista ? (
                <Card className={`${solidCard} rounded-2xl overflow-hidden`}>
                  <CardContent className="text-center py-16">
                    <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <User className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Selecione um motorista</p>
                    <p className="text-sm text-slate-500 mt-1">Utilize os filtros acima para visualizar os dados</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <EntregaTable
                    entregas={filteredEntregas}
                    onEdit={handleOpenForm}
                    onDelete={handleOpenDeleteDialog}
                  />

                  {totalPages > 1 && (
                    <Card className={`${solidCard} rounded-2xl overflow-hidden`}>
                      <CardContent className="px-4 py-3">
                        <PaginationControl
                          currentPage={page}
                          totalPages={totalPages}
                          onPageChange={setPage}
                          totalRecords={totalRecords}
                          itemsPerPage={pageSize}
                        />
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="por-veiculo" className="space-y-4 animate-in fade-in-50 duration-300">
              <Card className={`${solidCard} rounded-2xl overflow-hidden`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 max-w-md">
                      <Select value={selectedVeiculo || ''} onValueChange={(value) => setSelectedVeiculo(value || null)}>
                        <SelectTrigger className="rounded-lg border-slate-200 dark:border-slate-800 focus:ring-0 focus:border-emerald-500 h-10">
                          <SelectValue placeholder="Selecione um veículo..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border-slate-200 dark:border-slate-800">
                          {veiculosList.map((veiculo) => (
                            <SelectItem key={veiculo} value={veiculo}>
                              {veiculo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-[220px] justify-start text-left font-normal rounded-lg border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 h-10",
                              !selectedDateVeiculo && "text-slate-400"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                            {selectedDateVeiculo ? format(selectedDateVeiculo, 'dd/MM/yyyy') : 'Filtrar por data...'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-lg border-slate-200 dark:border-slate-800" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDateVeiculo || undefined}
                            onSelect={(date) => setSelectedDateVeiculo(date || null)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {(selectedVeiculo || selectedDateVeiculo) && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSelectedVeiculo(null);
                          setSelectedDateVeiculo(null);
                        }}
                        className="rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-medium h-10"
                      >
                        Limpar Filtros
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      onClick={() => setIsPrintModalOpen(true)}
                      className="gap-2 ml-auto rounded-lg border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm h-10"
                    >
                      <Printer className="h-4 w-4" />
                      Imprimir / PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {!selectedVeiculo ? (
                <Card className={`${solidCard} rounded-2xl overflow-hidden`}>
                  <CardContent className="text-center py-16">
                    <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <DirectionsCar className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Selecione um veículo</p>
                    <p className="text-sm text-slate-500 mt-1">Utilize os filtros acima para visualizar os dados</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <EntregaTable
                    entregas={filteredEntregas}
                    onEdit={handleOpenForm}
                    onDelete={handleOpenDeleteDialog}
                  />

                  {totalPages > 1 && (
                    <Card className={`${solidCard} rounded-2xl overflow-hidden`}>
                      <CardContent className="px-4 py-3">
                        <PaginationControl
                          currentPage={page}
                          totalPages={totalPages}
                          onPageChange={setPage}
                          totalRecords={totalRecords}
                          itemsPerPage={pageSize}
                        />
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

          </Tabs>
        </div>

        <EntregaFormModal
          open={isFormOpen}
          onOpenChange={handleCloseForm}
          entrega={selectedEntrega}
          onSubmit={handleSubmit}
          isLoading={createEntrega.isPending || updateEntrega.isPending}
        />

        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          isLoading={deleteEntrega.isPending}
          clienteName={entregaToDelete?.cliente || ''}
        />

        <DeleteConfirmDialog
          open={isBulkDeleteDialogOpen}
          onOpenChange={setIsBulkDeleteDialogOpen}
          onConfirm={handleConfirmBulkDelete}
          isLoading={deleteBulk.isPending}
          title="Excluir entregas selecionadas"
          description={
            <>
              Tem certeza que deseja excluir <strong>{selectedIds.size}</strong> entrega(s)?
              <br /><br />
              <span className="block text-xs uppercase tracking-wider font-bold text-red-600 dark:text-red-400">
                Esta ação é irreversível.
              </span>
            </>
          }
        />

        <TablePrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          title="Relatório de Entregas"
          subtitle="Listagem completa de entregas"
          data={filteredEntregas}
          columns={printColumns}
          filters={filtersText}
        />
        </div>
      </div>
    </ModuleLayout>
  );
};

export default Entregas;
