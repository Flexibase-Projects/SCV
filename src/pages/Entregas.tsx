import { useState, useMemo, useEffect, useRef } from 'react';
import { Add as Plus, Print as Printer, Description as FileText, Person as User, DirectionsCar, CalendarMonth as CalendarIcon } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { KPICards } from '@/components/dashboard/KPICards';
import { EntregaTable } from '@/components/dashboard/EntregaTable';
import { EntregaFormModal } from '@/components/dashboard/EntregaFormModal';
import { DeleteConfirmDialog } from '@/components/dashboard/DeleteConfirmDialog';
import { TablePrintModal, TableColumn } from '@/components/shared/TablePrintModal';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { useEntregasPaginated, useEntregasStats, useCreateEntrega, useUpdateEntrega, useDeleteEntrega, useMotoristasEntregas, useVeiculosEntregas } from '@/hooks/useEntregas';
import { Entrega, EntregaFormData, StatusEntrega } from '@/types/entrega';
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
  }, [debouncedSearchTerm, dateFrom, dateTo, selectedMotorista, selectedDateMotorista, selectedVeiculo, selectedDateVeiculo]);

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
        // Get the maximum data_saida to find the most recent year
        const { data, error } = await supabase
          .from('controle_entregas')
          .select('data_saida')
          .not('data_saida', 'is', null)
          .order('data_saida', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !data?.data_saida) {
          // If no data found, use current year as fallback
          const currentYear = new Date().getFullYear();
          const yearStart = startOfYear(new Date(currentYear, 0, 1));
          const yearEnd = endOfYear(new Date(currentYear, 11, 31));
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

        setDateFrom(yearStart);
        setDateTo(yearEnd);
        autoFilterApplied.current = true;
      } catch (err) {
        console.error('Error fetching most recent year:', err);
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
        <div className="min-h-screen bg-brand-blue dark:bg-[#0f1115] transition-colors duration-300 px-4 lg:px-8 py-6">
          <div className="max-w-[1600px] mx-auto space-y-6">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-2">
                <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
                <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
              </div>
              <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
            </div>
            
            {/* KPI Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
              ))}
            </div>
            
            {/* Table Skeleton */}
            <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout>
      <div className="min-h-screen bg-brand-blue dark:bg-[#0f1115] transition-colors duration-300 px-4 lg:px-8 py-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* HEADER - Minimalista Técnico */}
          <div>
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
              <div className="bg-brand-white dark:bg-[#181b21] border border-gray-100 dark:border-white/5 rounded-3xl p-4 shadow-sm hover:shadow-md transition-shadow">
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

            <TabsContent value="por-motorista" className="space-y-4 animate-in fade-in-50 duration-300">
              {/* Filtros específicos da aba Por Motorista */}
              <div className="bg-brand-white dark:bg-[#181b21] border border-gray-100 dark:border-white/5 rounded-3xl p-4 shadow-sm hover:shadow-md transition-shadow">
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
              </div>

              {!selectedMotorista ? (
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                  <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <User className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Selecione um motorista</p>
                  <p className="text-sm text-slate-500 mt-1">Utilize os filtros acima para visualizar os dados</p>
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

            <TabsContent value="por-veiculo" className="space-y-4 animate-in fade-in-50 duration-300">
              {/* Filtros específicos da aba Por Veículo */}
              <div className="bg-brand-white dark:bg-[#181b21] border border-gray-100 dark:border-white/5 rounded-3xl p-4 shadow-sm hover:shadow-md transition-shadow">
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
              </div>

              {!selectedVeiculo ? (
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                  <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <DirectionsCar className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Selecione um veículo</p>
                  <p className="text-sm text-slate-500 mt-1">Utilize os filtros acima para visualizar os dados</p>
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
      </div>
    </ModuleLayout>
  );
};

export default Entregas;
