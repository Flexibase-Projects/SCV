import { useState, useMemo, useEffect, useRef } from 'react';
import { Add as Plus, Print as Printer, Description as FileText, Person as User, DirectionsCar, CalendarMonth as CalendarIcon, Build as Wrench } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { KPICards } from '@/components/dashboard/KPICards';
import { EntregaTable } from '@/components/dashboard/EntregaTable';
import { EntregaFormModal } from '@/components/dashboard/EntregaFormModal';
import { DeleteConfirmDialog } from '@/components/dashboard/DeleteConfirmDialog';
import { TablePrintModal, TableColumn } from '@/components/shared/TablePrintModal';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { useEntregasPaginated, useEntregasStats, useCreateEntrega, useUpdateEntrega, useDeleteEntrega, useMotoristasEntregas, useVeiculosEntregas } from '@/hooks/useEntregas';
import { Entrega, EntregaFormData, StatusEntrega, StatusMontagem } from '@/types/entrega';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay, startOfYear, endOfYear } from 'date-fns';
import { formatDateLocal } from '@/utils/dateUtils';
import { SharedFilter } from '@/components/shared/SharedFilter';
import { useDebounce } from '@/hooks/use-debounce';
import { PaginationControl } from '@/components/shared/PaginationControl';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const Entregas = () => {
  // Tab State
  const [activeTab, setActiveTab] = useState('todos');

  // Pagination State
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms debounce
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  // Estados específicos da aba "Por Motorista"
  const [selectedMotorista, setSelectedMotorista] = useState<string | null>(null);
  const [selectedDateMotorista, setSelectedDateMotorista] = useState<Date | null>(null);

  // Estados específicos da aba "Por Veículo"
  const [selectedVeiculo, setSelectedVeiculo] = useState<string | null>(null);
  const [selectedDateVeiculo, setSelectedDateVeiculo] = useState<Date | null>(null);

  // Estados específicos da aba "Por Status de Montagem"
  const [selectedStatusMontagem, setSelectedStatusMontagem] = useState<StatusMontagem | null>(null);
  const [selectedDateMontagem, setSelectedDateMontagem] = useState<Date | null>(null);

  // Flag to track if auto-filter has been applied
  const autoFilterApplied = useRef(false);

  // Hooks para buscar valores únicos
  const { data: motoristasList = [] } = useMotoristasEntregas();
  const { data: veiculosList = [] } = useVeiculosEntregas();

  // Data Fetching (Server-Side Pagination)
  const {
    data: paginatedResult,
    isLoading
  } = useEntregasPaginated({
    page,
    pageSize,
    searchTerm: activeTab === 'todos' ? debouncedSearchTerm : undefined,
    dateFrom: activeTab === 'todos' ? dateFrom : null,
    dateTo: activeTab === 'todos' ? dateTo : null,
    motorista: activeTab === 'por-motorista' ? selectedMotorista : null,
    veiculo: activeTab === 'por-veiculo' ? selectedVeiculo : null,
    dataEspecifica: activeTab === 'por-motorista' ? selectedDateMotorista : 
                    activeTab === 'por-veiculo' ? selectedDateVeiculo : 
                    activeTab === 'por-montagem' ? selectedDateMontagem : null,
    statusMontagem: activeTab === 'por-montagem' ? selectedStatusMontagem : null
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

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'Entregas.tsx:53', message: 'Estatísticas recebidas', data: { statsTotalEntregas: stats?.totalEntregas, stats }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }) }).catch(() => { });
  }, [stats]);

  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'Entregas.tsx:62', message: 'Estatísticas totais (sem filtros de data)', data: { totalStatsTotalEntregas: totalStats?.totalEntregas, totalStats }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'post-fix', hypothesisId: 'FIX' }) }).catch(() => { });
  }, [totalStats]);

  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'Entregas.tsx:72', message: 'Stats sendo passado para KPICards', data: { kpiStatsTotalEntregas: kpiStats?.totalEntregas, usingTotalStats: !!totalStats, hasTotalStats: !!totalStats, hasStats: !!stats }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'post-fix', hypothesisId: 'FIX' }) }).catch(() => { });
  }, [kpiStats, totalStats, stats]);
  // #endregion

  const createEntrega = useCreateEntrega();
  const updateEntrega = useUpdateEntrega();
  const deleteEntrega = useDeleteEntrega();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEntrega, setSelectedEntrega] = useState<Entrega | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [entregaToDelete, setEntregaToDelete] = useState<Entrega | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Limpar filtros ao mudar de aba para melhorar UX
  useEffect(() => {
    if (activeTab !== 'por-motorista') {
      setSelectedMotorista(null);
      setSelectedDateMotorista(null);
    }
    if (activeTab !== 'por-veiculo') {
      setSelectedVeiculo(null);
      setSelectedDateVeiculo(null);
    }
    // Resetar página ao mudar de aba
    setPage(1);
  }, [activeTab]);

  // Resetar página quando filtros mudam
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, dateFrom, dateTo, selectedMotorista, selectedDateMotorista, selectedVeiculo, selectedDateVeiculo, selectedStatusMontagem, selectedDateMontagem]);

  // Auto-filter by most recent year on first load
  useEffect(() => {
    // Only apply auto-filter if:
    // 1. Auto-filter hasn't been applied yet
    // 2. No date filters are currently set
    if (autoFilterApplied.current || dateFrom !== null || dateTo !== null) {
      return;
    }

    // Fetch the most recent year from deliveries
    const fetchMostRecentYear = async () => {
      try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'Entregas.tsx:81', message: 'Iniciando busca do ano mais recente', data: { autoFilterApplied: autoFilterApplied.current, dateFrom: dateFrom?.toISOString(), dateTo: dateTo?.toISOString() }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
        // #endregion
        // Get the maximum data_saida to find the most recent year
        const { data, error } = await supabase
          .from('controle_entregas')
          .select('data_saida')
          .not('data_saida', 'is', null)
          .order('data_saida', { ascending: false })
          .limit(1)
          .maybeSingle();

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'Entregas.tsx:90', message: 'Resultado da busca do ano mais recente', data: { hasError: !!error, errorMessage: error?.message, dataSaida: data?.data_saida }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
        // #endregion

        if (error || !data?.data_saida) {
          // If no data found, use current year as fallback
          const currentYear = new Date().getFullYear();
          const yearStart = startOfYear(new Date(currentYear, 0, 1));
          const yearEnd = endOfYear(new Date(currentYear, 11, 31));
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'Entregas.tsx:97', message: 'Aplicando fallback para ano atual', data: { currentYear, yearStart: yearStart.toISOString(), yearEnd: yearEnd.toISOString() }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
          // #endregion
          setDateFrom(yearStart);
          setDateTo(yearEnd);
          autoFilterApplied.current = true;
          return;
        }

        // Extract year from the most recent data_saida
        const mostRecentDate = new Date(data.data_saida);
        const year = mostRecentDate.getFullYear();

        // Set dateFrom to January 1st and dateTo to December 31st of that year
        const yearStart = startOfYear(new Date(year, 0, 1));
        const yearEnd = endOfYear(new Date(year, 11, 31));

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'Entregas.tsx:110', message: 'Aplicando filtro automático por ano', data: { year, mostRecentDate: mostRecentDate.toISOString(), yearStart: yearStart.toISOString(), yearEnd: yearEnd.toISOString() }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
        // #endregion
        setDateFrom(yearStart);
        setDateTo(yearEnd);
        autoFilterApplied.current = true;
      } catch (err) {
        console.error('Error fetching most recent year:', err);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'Entregas.tsx:115', message: 'Erro ao buscar ano mais recente', data: { error: String(err) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
        // #endregion
        // Fallback to current year on error
        const currentYear = new Date().getFullYear();
        const yearStart = startOfYear(new Date(currentYear, 0, 1));
        const yearEnd = endOfYear(new Date(currentYear, 11, 31));
        setDateFrom(yearStart);
        setDateTo(yearEnd);
        autoFilterApplied.current = true;
      }
    };

    fetchMostRecentYear();
  }, [dateFrom, dateTo]);

  // Client-side filtering removed - handled by server
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
    { key: 'tipo_transporte', label: 'Tipo Transporte' },
    // Montagem
    {
      key: 'precisa_montagem',
      label: 'Precisa Montagem',
      render: (value) => value ? 'SIM' : 'NÃO'
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
    if (dateFrom) filters.push(`De: ${format(dateFrom, 'dd/MM/yyyy')}`);
    if (dateTo) filters.push(`Até: ${format(dateTo, 'dd/MM/yyyy')}`);
    return filters.length > 0 ? filters.join(' | ') : 'Todos os registros';
  }, [searchTerm, dateFrom, dateTo]);

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
      createEntrega.mutate(formattedData, { onSuccess: handleCloseForm });
    }
  };

  const handleOpenDeleteDialog = (entrega: Entrega) => {
    setEntregaToDelete(entrega);
    setIsDeleteDialogOpen(true);
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

  if (isLoading) {
    return (
      <ModuleLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout>
      <div className="p-8 lg:p-10 space-y-8">
        {/* HEADER DA PÁGINA PADRONIZADO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Controle de Entregas</h2>
            <p className="text-slate-500 mt-1">Gerenciamento de rotas e entregas</p>
          </div>
          <Button onClick={() => handleOpenForm()} className="bg-brand-green hover:bg-emerald-600 gap-2">
            <Plus className="h-4 w-4" />
            Nova Entrega
          </Button>
        </div>

        <div className="space-y-6">
          <KPICards entregas={filteredEntregas} stats={kpiStats} />

          {/* Abas e Tabela */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full max-w-3xl grid-cols-4">
              <TabsTrigger value="todos">
                <FileText className="h-4 w-4 mr-2" />
                Todos
              </TabsTrigger>
              <TabsTrigger value="por-motorista">
                <User className="h-4 w-4 mr-2" />
                Por Motorista
              </TabsTrigger>
              <TabsTrigger value="por-veiculo">
                <DirectionsCar className="h-4 w-4 mr-2" />
                Por Veículo
              </TabsTrigger>
              <TabsTrigger value="por-montagem">
                <Wrench className="h-4 w-4 mr-2" />
                Por Montagem
              </TabsTrigger>
            </TabsList>

            <TabsContent value="todos" className="space-y-4">
              <div className="flex items-center justify-between">
                <SharedFilter
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  dateFrom={dateFrom}
                  onDateFromChange={setDateFrom}
                  dateTo={dateTo}
                  onDateToChange={setDateTo}
                  placeholder="Buscar por cliente, PV Foco, NF ou motorista..."
                />
                <Button
                  variant="outline"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir / PDF
                </Button>
              </div>

              <EntregaTable
                entregas={filteredEntregas}
                onEdit={handleOpenForm}
                onDelete={handleOpenDeleteDialog}
              />

              <PaginationControl
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalRecords={totalRecords}
                itemsPerPage={pageSize}
              />
            </TabsContent>

            <TabsContent value="por-motorista" className="space-y-4">
              {/* Filtros específicos da aba Por Motorista */}
              <div className="flex items-center gap-4">
                <div className="flex-1 max-w-md">
                  <Select value={selectedMotorista || ''} onValueChange={(value) => setSelectedMotorista(value || null)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um motorista..." />
                    </SelectTrigger>
                    <SelectContent>
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
                          "w-[240px] justify-start text-left font-normal",
                          !selectedDateMotorista && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDateMotorista ? format(selectedDateMotorista, 'dd/MM/yyyy') : 'Filtrar por data...'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
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
                  >
                    Limpar Filtros
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="gap-2 ml-auto"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir / PDF
                </Button>
              </div>

              {!selectedMotorista ? (
                <div className="text-center py-12 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Selecione um motorista para visualizar as entregas</p>
                  <p className="text-sm mt-2">Use o filtro acima para escolher um motorista</p>
                </div>
              ) : (
                <>
                  <EntregaTable
                    entregas={filteredEntregas}
                    onEdit={handleOpenForm}
                    onDelete={handleOpenDeleteDialog}
                  />

                  <PaginationControl
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    totalRecords={totalRecords}
                    itemsPerPage={pageSize}
                  />
                </>
              )}
            </TabsContent>

            <TabsContent value="por-veiculo" className="space-y-4">
              {/* Filtros específicos da aba Por Veículo */}
              <div className="flex items-center gap-4">
                <div className="flex-1 max-w-md">
                  <Select value={selectedVeiculo || ''} onValueChange={(value) => setSelectedVeiculo(value || null)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um veículo..." />
                    </SelectTrigger>
                    <SelectContent>
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
                          "w-[240px] justify-start text-left font-normal",
                          !selectedDateVeiculo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDateVeiculo ? format(selectedDateVeiculo, 'dd/MM/yyyy') : 'Filtrar por data...'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
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
                  >
                    Limpar Filtros
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="gap-2 ml-auto"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir / PDF
                </Button>
              </div>

              {!selectedVeiculo ? (
                <div className="text-center py-12 text-muted-foreground">
                  <DirectionsCar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Selecione um veículo para visualizar as entregas</p>
                  <p className="text-sm mt-2">Use o filtro acima para escolher um veículo</p>
                </div>
              ) : (
                <>
                  <EntregaTable
                    entregas={filteredEntregas}
                    onEdit={handleOpenForm}
                    onDelete={handleOpenDeleteDialog}
                  />

                  <PaginationControl
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    totalRecords={totalRecords}
                    itemsPerPage={pageSize}
                  />
                </>
              )}
            </TabsContent>

            <TabsContent value="por-montagem" className="space-y-4">
              {/* Filtros específicos da aba Por Montagem */}
              <div className="flex items-center gap-4">
                <div className="flex-1 max-w-md">
                  <Select 
                    value={selectedStatusMontagem || ''} 
                    onValueChange={(value) => setSelectedStatusMontagem(value as StatusMontagem || null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDENTE">Pendente</SelectItem>
                      <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !selectedDateMontagem && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDateMontagem ? format(selectedDateMontagem, 'dd/MM/yyyy') : 'Filtrar por data...'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDateMontagem || undefined}
                        onSelect={(date) => setSelectedDateMontagem(date || null)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {(selectedStatusMontagem || selectedDateMontagem) && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSelectedStatusMontagem(null);
                      setSelectedDateMontagem(null);
                    }}
                  >
                    Limpar Filtros
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="gap-2 ml-auto"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir / PDF
                </Button>
              </div>

              {!selectedStatusMontagem ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Selecione um status de montagem para visualizar as entregas</p>
                  <p className="text-sm mt-2">Use o filtro acima para escolher um status</p>
                </div>
              ) : (
                <>
                  <EntregaTable
                    entregas={filteredEntregas}
                    onEdit={handleOpenForm}
                    onDelete={handleOpenDeleteDialog}
                  />

                  <PaginationControl
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    totalRecords={totalRecords}
                    itemsPerPage={pageSize}
                  />
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
    </ModuleLayout>
  );
};

export default Entregas;
