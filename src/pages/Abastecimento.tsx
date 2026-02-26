import { useState, useMemo, useEffect } from 'react';
import { Add as Plus, Speed as Gauge, Print as Printer, Description as FileText, WaterDrop as Droplet, AttachMoney as DollarSign, Person as User, DirectionsCar } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { glassCard, solidCard } from '@/lib/cardStyles';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AbastecimentoTable } from '@/components/abastecimento/AbastecimentoTable';
import { AbastecimentoFormModal } from '@/components/abastecimento/AbastecimentoFormModal';
import { DeleteConfirmDialog } from '@/components/dashboard/DeleteConfirmDialog';
import { TablePrintModal, TableColumn } from '@/components/shared/TablePrintModal';
import { PaginationControl } from '@/components/shared/PaginationControl';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay, isSameDay } from 'date-fns';
import { SharedFilter } from '@/components/shared/SharedFilter';
import { cn } from '@/lib/utils';
import {
  useAbastecimentos,
  useCreateAbastecimento,
  useUpdateAbastecimento,
  useDeleteAbastecimento
} from '@/hooks/useAbastecimentos';
import { useMotoristas } from '@/hooks/useMotoristas';
import { useVeiculos } from '@/hooks/useVeiculos';
import type { Abastecimento as AbastecimentoType, AbastecimentoFormData } from '@/types/abastecimento';
import { CalendarMonth as CalendarIcon } from '@mui/icons-material';


const ROWS_PER_PAGE = 100;

const AbastecimentoPage = () => {
  const { data: abastecimentos = [], isLoading } = useAbastecimentos();
  const { data: motoristas = [] } = useMotoristas(false); // Apenas ativos
  const { data: veiculos = [] } = useVeiculos(false); // Apenas veículos ativos
  const createAbastecimento = useCreateAbastecimento();
  const updateAbastecimento = useUpdateAbastecimento();
  const deleteAbastecimento = useDeleteAbastecimento();

  const [activeTab, setActiveTab] = useState('todos');
  const [tablePage, setTablePage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAbastecimento, setSelectedAbastecimento] = useState<AbastecimentoType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  // Estados específicos da aba "Por Motorista"
  const [selectedMotoristaId, setSelectedMotoristaId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Estados específicos da aba "Por Veículos"
  const [selectedVeiculoId, setSelectedVeiculoId] = useState<string | null>(null);
  const [selectedDateVeiculo, setSelectedDateVeiculo] = useState<Date | null>(null);

  // Limpar filtros ao mudar de aba e resetar página da tabela
  useEffect(() => {
    if (activeTab !== 'por-motorista') {
      setSelectedMotoristaId(null);
      setSelectedDate(null);
    }
    if (activeTab !== 'por-veiculo') {
      setSelectedVeiculoId(null);
      setSelectedDateVeiculo(null);
    }
    setTablePage(1);
  }, [activeTab]);

  useEffect(() => {
    setTablePage(1);
  }, [searchTerm, dateFrom, dateTo, selectedMotoristaId, selectedDate, selectedVeiculoId, selectedDateVeiculo]);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [abastecimentoToDelete, setAbastecimentoToDelete] = useState<AbastecimentoType | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const handleOpenForm = (abastecimento?: AbastecimentoType) => {
    setSelectedAbastecimento(abastecimento || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedAbastecimento(null);
  };

  const handleSubmit = (data: AbastecimentoFormData) => {
    if (selectedAbastecimento) {
      updateAbastecimento.mutate(
        { id: selectedAbastecimento.id, data },
        { onSuccess: handleCloseForm }
      );
    } else {
      createAbastecimento.mutate(data, { onSuccess: handleCloseForm });
    }
  };

  const handleOpenDeleteDialog = (abastecimento: AbastecimentoType) => {
    setAbastecimentoToDelete(abastecimento);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (abastecimentoToDelete) {
      deleteAbastecimento.mutate(abastecimentoToDelete.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setAbastecimentoToDelete(null);
        }
      });
    }
  };


  const filteredAbastecimentos = useMemo(() => {
    let filtered = abastecimentos;

    // Filtros da aba "Por Motorista"
    if (activeTab === 'por-motorista') {
      // Filtrar por motorista selecionado
      if (selectedMotoristaId) {
        filtered = filtered.filter(a => a.condutor_id === selectedMotoristaId);
      }

      // Filtrar por data específica (se selecionada)
      if (selectedDate) {
        filtered = filtered.filter(a => {
          if (!a.data) return false;
          const date = parseISO(a.data);
          return isSameDay(date, selectedDate);
        });
      }

      // ORDENAÇÃO: Por km_inicial do maior para o menor (DESC)
      filtered = filtered.sort((a, b) => {
        const kmA = a.km_inicial || 0;
        const kmB = b.km_inicial || 0;
        return kmB - kmA; // DESC: maior primeiro
      });
    }

    // Filtros da aba "Por Veículos"
    if (activeTab === 'por-veiculo') {
      // Filtrar por veículo selecionado
      if (selectedVeiculoId) {
        filtered = filtered.filter(a => a.veiculo_id === selectedVeiculoId);
      }

      // Filtrar por data específica (se selecionada)
      if (selectedDateVeiculo) {
        filtered = filtered.filter(a => {
          if (!a.data) return false;
          const date = parseISO(a.data);
          return isSameDay(date, selectedDateVeiculo);
        });
      }

      // ORDENAÇÃO: Por data DESC (mais recente primeiro), depois created_at DESC
      filtered = filtered.sort((a, b) => {
        // Tratar nulls para data: nulls vão para o final
        if (!a.data && !b.data) return 0;
        if (!a.data) return 1; // a é null, vai para o final
        if (!b.data) return -1; // b é null, vai para o final

        const dateA = parseISO(a.data);
        const dateB = parseISO(b.data);
        const dateDiff = dateB.getTime() - dateA.getTime(); // DESC: mais recente primeiro

        if (dateDiff !== 0) {
          return dateDiff;
        }

        // Se datas são iguais, ordenar por created_at (mais recente primeiro)
        if (a.created_at && b.created_at) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return 0;
      });
    }

    // Filtros da aba "Todos" (busca e período)
    if (activeTab === 'todos') {
      // Busca textual
      filtered = filtered.filter(a => {
        const matchesSearch =
          searchTerm === '' ||
          a.veiculo_placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.condutor_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.posto?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
      });

      // Filtro de período
      filtered = filtered.filter(a => {
        let matchesDate = true;
        if (a.data) {
          const date = parseISO(a.data);
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
        return matchesDate;
      });

      // ORDENAÇÃO: Por data DESC (mais recente primeiro), depois created_at DESC
      filtered = filtered.sort((a, b) => {
        // Comparar por data primeiro
        if (a.data && b.data) {
          const dateA = parseISO(a.data);
          const dateB = parseISO(b.data);
          const dateDiff = dateB.getTime() - dateA.getTime();
          if (dateDiff !== 0) {
            return dateDiff; // DESC: mais recente primeiro
          }
        }
        // Se uma data é null e outra não, a com data vem primeiro
        if (a.data && !b.data) return -1;
        if (!a.data && b.data) return 1;
        
        // Se datas são iguais ou ambas null, ordenar por created_at
        if (a.created_at && b.created_at) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return 0;
      });
    }

    return filtered;
  }, [abastecimentos, activeTab, selectedMotoristaId, selectedDate, selectedVeiculoId, selectedDateVeiculo, searchTerm, dateFrom, dateTo]);

  // Calcular totais (usando dados filtrados)
  const totalLitros = filteredAbastecimentos.reduce((acc, a) => acc + (a.litros || 0), 0);
  const totalValor = filteredAbastecimentos.reduce((acc, a) => acc + (a.valor_total || 0), 0);

  // Calcular média de consumo (KM/L) - apenas registros com valor válido (usando dados filtrados)
  const abastecimentosComKmPorLitro = filteredAbastecimentos.filter(a => a.km_por_litro != null && a.km_por_litro > 0);
  const mediaConsumo = abastecimentosComKmPorLitro.length > 0
    ? abastecimentosComKmPorLitro.reduce((acc, a) => acc + (a.km_por_litro || 0), 0) / abastecimentosComKmPorLitro.length
    : 0;

  const slicedAbastecimentos = useMemo(() => {
    if (filteredAbastecimentos.length <= ROWS_PER_PAGE) return filteredAbastecimentos;
    return filteredAbastecimentos.slice((tablePage - 1) * ROWS_PER_PAGE, tablePage * ROWS_PER_PAGE);
  }, [filteredAbastecimentos, tablePage]);
  const totalTablePages = Math.ceil(filteredAbastecimentos.length / ROWS_PER_PAGE);
  const showTablePagination = filteredAbastecimentos.length > ROWS_PER_PAGE;

  // Configuração de colunas para impressão
  const printColumns: TableColumn<AbastecimentoType>[] = useMemo(() => [
    {
      key: 'data',
      label: 'Data',
      render: (value) => value ? format(new Date(value), 'dd/MM/yyyy') : '-'
    },
    { key: 'veiculo_placa', label: 'Veículo' },
    { key: 'condutor_nome', label: 'Condutor' },
    { key: 'posto', label: 'Posto/Manutenção' },
    {
      key: 'cidade',
      label: 'Cidade',
      render: (value, row) => row.cidade && row.estado ? `${row.cidade} - ${row.estado}` : '-'
    },
    {
      key: 'km_inicial',
      label: 'Km Inicial',
      render: (value) => value ? value.toLocaleString('pt-BR') : '0'
    },
    {
      key: 'litros',
      label: 'Litros',
      render: (value) => value ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '0'
    },
    {
      key: 'km_por_litro',
      label: 'KM/L',
      render: (value) => value != null ? `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} km/l` : '0,00 km/l'
    },
    { key: 'produto', label: 'Produto' },
    {
      key: 'valor_unitario',
      label: 'Valor Un.',
      render: (value) => value ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00',
      className: 'text-right'
    },
    {
      key: 'valor_total',
      label: 'Valor Total',
      render: (value) => value ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00',
      className: 'text-right font-semibold'
    },
  ], []);

  // Texto descritivo dos filtros aplicados
  const filtersText = useMemo(() => {
    const filters: string[] = [];
    if (searchTerm) filters.push(`Busca: "${searchTerm}"`);
    if (dateFrom) filters.push(`De: ${format(dateFrom, 'dd/MM/yyyy')}`);
    if (dateTo) filters.push(`Até: ${format(dateTo, 'dd/MM/yyyy')}`);
    return filters.length > 0 ? filters.join(' | ') : 'Todos os registros';
  }, [searchTerm, dateFrom, dateTo]);


  return (
    <ModuleLayout>
      <div className="min-h-screen w-full min-w-0 bg-white dark:bg-[#0f1115] transition-colors duration-300 px-4 lg:px-8 py-6">
        <div className="w-full max-w-[1600px] mx-auto space-y-6">
          {/* HEADER - estilo glass (Dashboard/Entregas) */}
          <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              Controle de Abastecimento
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Controle de abastecimentos e consumo • {format(new Date(), 'yyyy')}
            </p>
          </div>

        <div className="w-full space-y-6">
          {/* KPIs - Card com glassCard (Dashboard/Entregas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className={`${glassCard} rounded-2xl min-h-[140px] flex flex-col animate-in fade-in-50 slide-in-from-bottom-4`} style={{ animationDelay: '0ms' }}>
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Registros</span>
                  <div className="h-10 w-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{filteredAbastecimentos.length}</p>
                <p className="text-xs text-gray-400 mt-1">abastecimentos listados</p>
              </CardContent>
            </Card>

            <Card className={`${glassCard} rounded-2xl min-h-[140px] flex flex-col animate-in fade-in-50 slide-in-from-bottom-4`} style={{ animationDelay: '100ms' }}>
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Litros</span>
                  <div className="h-10 w-10 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center">
                    <Droplet className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {totalLitros.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} L
                </p>
                <p className="text-xs text-gray-400 mt-1">combustível consumido</p>
              </CardContent>
            </Card>

            <Card className={`${glassCard} rounded-2xl min-h-[140px] flex flex-col animate-in fade-in-50 slide-in-from-bottom-4`} style={{ animationDelay: '200ms' }}>
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Média de Consumo</span>
                  <div className="h-10 w-10 bg-purple-50 dark:bg-purple-500/10 rounded-xl flex items-center justify-center">
                    <Gauge className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {mediaConsumo > 0
                    ? `${mediaConsumo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km/l`
                    : '0,00 km/l'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {abastecimentosComKmPorLitro.length > 0
                    ? `baseado em ${abastecimentosComKmPorLitro.length} registros`
                    : 'sem dados suficientes'}
                </p>
              </CardContent>
            </Card>

            <Card className={`${glassCard} rounded-2xl min-h-[140px] flex flex-col animate-in fade-in-50 slide-in-from-bottom-4`} style={{ animationDelay: '300ms' }}>
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Valor Total</span>
                  <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-400 mt-1">custo total no período</p>
              </CardContent>
            </Card>
          </div>


          {/* Abas e Tabela */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col space-y-6">
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
                Novo Abastecimento
              </Button>
            </div>

            <TabsContent value="todos" className="w-full min-w-0 flex-1 space-y-4 animate-in fade-in-50 duration-300">
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
                    placeholder="Buscar por placa, condutor ou posto..."
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

              <AbastecimentoTable
                abastecimentos={slicedAbastecimentos}
                onEdit={handleOpenForm}
                onDelete={handleOpenDeleteDialog}
                isLoading={isLoading}
              />
              {showTablePagination && (
                <PaginationControl
                  currentPage={tablePage}
                  totalPages={totalTablePages}
                  onPageChange={setTablePage}
                  totalRecords={filteredAbastecimentos.length}
                  itemsPerPage={ROWS_PER_PAGE}
                />
              )}
            </TabsContent>

            <TabsContent value="por-motorista" className="w-full min-w-0 flex-1 space-y-4 animate-in fade-in-50 duration-300">
              <Card className={`${solidCard} rounded-2xl overflow-hidden`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                  <div className="flex-1 max-w-md">
                    <Select value={selectedMotoristaId || ''} onValueChange={(value) => setSelectedMotoristaId(value || null)}>
                      <SelectTrigger className="rounded-lg border-slate-200 dark:border-slate-800 focus:ring-0 focus:border-emerald-500 h-10">
                        <SelectValue placeholder="Selecione um motorista..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-slate-200 dark:border-slate-800">
                        {motoristas.map((motorista) => (
                          <SelectItem key={motorista.id} value={motorista.id}>
                            {motorista.nome}
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
                            !selectedDate && "text-slate-400"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                          {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'Filtrar por data...'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-lg border-slate-200 dark:border-slate-800" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate || undefined}
                          onSelect={(date) => setSelectedDate(date || null)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {(selectedMotoristaId || selectedDate) && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSelectedMotoristaId(null);
                        setSelectedDate(null);
                      }}
                    >
                      Limpar Filtros
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => setIsPrintModalOpen(true)}
                    className="gap-2 rounded-lg border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm h-10 ml-auto"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimir / PDF
                  </Button>
                  </div>
                </CardContent>
              </Card>

              {!selectedMotoristaId ? (
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
                  <AbastecimentoTable
                    abastecimentos={slicedAbastecimentos}
                    onEdit={handleOpenForm}
                    onDelete={handleOpenDeleteDialog}
                    isLoading={isLoading}
                  />
                  {showTablePagination && (
                    <PaginationControl
                      currentPage={tablePage}
                      totalPages={totalTablePages}
                      onPageChange={setTablePage}
                      totalRecords={filteredAbastecimentos.length}
                      itemsPerPage={ROWS_PER_PAGE}
                    />
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="por-veiculo" className="w-full min-w-0 flex-1 space-y-4 animate-in fade-in-50 duration-300">
              <Card className={`${solidCard} rounded-2xl overflow-hidden`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                  <div className="flex-1 max-w-md">
                    <Select value={selectedVeiculoId || ''} onValueChange={(value) => setSelectedVeiculoId(value || null)}>
                      <SelectTrigger className="rounded-lg border-slate-200 dark:border-slate-800 focus:ring-0 focus:border-emerald-500 h-10">
                        <SelectValue placeholder="Selecione um veículo..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-slate-200 dark:border-slate-800">
                        {veiculos.map((veiculo) => {
                          // Formatação: Placa - Modelo (ou Fabricante se não houver modelo)
                          const displayText = veiculo.modelo 
                            ? `${veiculo.placa} - ${veiculo.modelo}`
                            : veiculo.fabricante
                            ? `${veiculo.placa} - ${veiculo.fabricante}`
                            : veiculo.placa;
                          return (
                            <SelectItem key={veiculo.id} value={veiculo.id}>
                              {displayText}
                            </SelectItem>
                          );
                        })}
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

                  {(selectedVeiculoId || selectedDateVeiculo) && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSelectedVeiculoId(null);
                        setSelectedDateVeiculo(null);
                      }}
                    >
                      Limpar Filtros
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => setIsPrintModalOpen(true)}
                    className="gap-2 rounded-lg border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm h-10 ml-auto"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimir / PDF
                  </Button>
                  </div>
                </CardContent>
              </Card>

              {!selectedVeiculoId ? (
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
                  <AbastecimentoTable
                    abastecimentos={slicedAbastecimentos}
                    onEdit={handleOpenForm}
                    onDelete={handleOpenDeleteDialog}
                    isLoading={isLoading}
                  />
                  {showTablePagination && (
                    <PaginationControl
                      currentPage={tablePage}
                      totalPages={totalTablePages}
                      onPageChange={setTablePage}
                      totalRecords={filteredAbastecimentos.length}
                      itemsPerPage={ROWS_PER_PAGE}
                    />
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <AbastecimentoFormModal
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          abastecimento={selectedAbastecimento}
          onSubmit={handleSubmit}
          isLoading={createAbastecimento.isPending || updateAbastecimento.isPending}
        />

        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          isLoading={deleteAbastecimento.isPending}
          title="Excluir Abastecimento"
          description="Tem certeza que deseja excluir este abastecimento? Esta ação não pode ser desfeita."
        />

        <TablePrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          title="Relatório de Abastecimentos"
          subtitle="Listagem completa de abastecimentos"
          data={filteredAbastecimentos}
          columns={printColumns}
          filters={filtersText}
        />
        </div>
      </div>
    </ModuleLayout>
  );
};

export default AbastecimentoPage;
