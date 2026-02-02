import { useState, useMemo } from 'react';
import { Add as Plus, Speed as Gauge, Print as Printer, Description as FileText, WaterDrop as Droplet, AttachMoney as DollarSign, Person as User } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AbastecimentoTable } from '@/components/abastecimento/AbastecimentoTable';
import { AbastecimentoFormModal } from '@/components/abastecimento/AbastecimentoFormModal';
import { DeleteConfirmDialog } from '@/components/dashboard/DeleteConfirmDialog';
import { TablePrintModal, TableColumn } from '@/components/shared/TablePrintModal';
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
import type { Abastecimento as AbastecimentoType, AbastecimentoFormData } from '@/types/abastecimento';
import { CalendarMonth as CalendarIcon } from '@mui/icons-material';


const AbastecimentoPage = () => {
  const { data: abastecimentos = [], isLoading } = useAbastecimentos();
  const { data: motoristas = [] } = useMotoristas(false); // Apenas ativos
  const createAbastecimento = useCreateAbastecimento();
  const updateAbastecimento = useUpdateAbastecimento();
  const deleteAbastecimento = useDeleteAbastecimento();

  const [activeTab, setActiveTab] = useState('todos');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAbastecimento, setSelectedAbastecimento] = useState<AbastecimentoType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  // Estados específicos da aba "Por Motorista"
  const [selectedMotoristaId, setSelectedMotoristaId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
  }, [abastecimentos, activeTab, selectedMotoristaId, selectedDate, searchTerm, dateFrom, dateTo]);

  // Calcular totais (usando dados filtrados)
  const totalLitros = filteredAbastecimentos.reduce((acc, a) => acc + (a.litros || 0), 0);
  const totalValor = filteredAbastecimentos.reduce((acc, a) => acc + (a.valor_total || 0), 0);

  // Calcular média de consumo (KM/L) - apenas registros com valor válido (usando dados filtrados)
  const abastecimentosComKmPorLitro = filteredAbastecimentos.filter(a => a.km_por_litro != null && a.km_por_litro > 0);
  const mediaConsumo = abastecimentosComKmPorLitro.length > 0
    ? abastecimentosComKmPorLitro.reduce((acc, a) => acc + (a.km_por_litro || 0), 0) / abastecimentosComKmPorLitro.length
    : 0;

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
      render: (value) => value ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0'
    },
    {
      key: 'km_por_litro',
      label: 'KM/L',
      render: (value) => value ? `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} km/l` : 'N/A'
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
      <div className="p-8 lg:p-10 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Controle de Abastecimento</h2>
            <p className="text-slate-500 mt-1">Controle de abastecimentos e consumo</p>
          </div>
          <Button onClick={() => handleOpenForm()} className="bg-brand-green hover:bg-emerald-600 gap-2">
            <Plus className="h-4 w-4" />
            Novo Abastecimento
          </Button>
        </div>

        <div className="space-y-6">
          {/* Cards de resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-brand-white dark:bg-[#181b21] border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow min-h-[140px] flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Registros</span>
                <div className="h-10 w-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{filteredAbastecimentos.length}</p>
              <p className="text-xs text-gray-400 mt-1">abastecimentos listados</p>
            </div>

            <div className="bg-brand-white dark:bg-[#181b21] border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow min-h-[140px] flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Litros</span>
                <div className="h-10 w-10 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center">
                  <Droplet className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalLitros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} L
              </p>
              <p className="text-xs text-gray-400 mt-1">combustível consumido</p>
            </div>

            <div className="bg-brand-white dark:bg-[#181b21] border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow min-h-[140px] flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Média de Consumo</span>
                <div className="h-10 w-10 bg-purple-50 dark:bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <Gauge className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {mediaConsumo > 0
                  ? `${mediaConsumo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km/l`
                  : 'N/A'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {abastecimentosComKmPorLitro.length > 0
                  ? `baseado em ${abastecimentosComKmPorLitro.length} registros`
                  : 'sem dados suficientes'}
              </p>
            </div>

            <div className="bg-brand-white dark:bg-[#181b21] border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow min-h-[140px] flex flex-col">
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
            </div>
          </div>


          {/* Abas e Tabela */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="todos">
                <FileText className="h-4 w-4 mr-2" />
                Todos
              </TabsTrigger>
              <TabsTrigger value="por-motorista">
                <User className="h-4 w-4 mr-2" />
                Por Motorista
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
                  placeholder="Buscar por placa, condutor ou posto..."
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

              <AbastecimentoTable
                abastecimentos={filteredAbastecimentos}
                onEdit={handleOpenForm}
                onDelete={handleOpenDeleteDialog}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="por-motorista" className="space-y-4">
              {/* Filtros específicos da aba Por Motorista */}
              <div className="flex items-center gap-4">
                <div className="flex-1 max-w-md">
                  <Select value={selectedMotoristaId || ''} onValueChange={(value) => setSelectedMotoristaId(value || null)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um motorista..." />
                    </SelectTrigger>
                    <SelectContent>
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
                          "w-[240px] justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'Filtrar por data...'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
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
                  className="gap-2 ml-auto"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir / PDF
                </Button>
              </div>

              {!selectedMotoristaId ? (
                <div className="text-center py-12 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Selecione um motorista para visualizar os abastecimentos</p>
                  <p className="text-sm mt-2">Use o filtro acima para escolher um motorista</p>
                </div>
              ) : (
                <AbastecimentoTable
                  abastecimentos={filteredAbastecimentos}
                  onEdit={handleOpenForm}
                  onDelete={handleOpenDeleteDialog}
                  isLoading={isLoading}
                />
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
    </ModuleLayout>
  );
};

export default AbastecimentoPage;
