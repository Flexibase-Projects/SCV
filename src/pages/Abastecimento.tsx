import { useState, useMemo } from 'react';
import { Plus, Gauge, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AbastecimentoTable } from '@/components/abastecimento/AbastecimentoTable';
import { AbastecimentoFormModal } from '@/components/abastecimento/AbastecimentoFormModal';
import { DeleteConfirmDialog } from '@/components/dashboard/DeleteConfirmDialog';
import { TablePrintModal, TableColumn } from '@/components/shared/TablePrintModal';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { SharedFilter } from '@/components/shared/SharedFilter';
import { cn } from '@/lib/utils';
import {
  useAbastecimentos,
  useCreateAbastecimento,
  useUpdateAbastecimento,
  useDeleteAbastecimento
} from '@/hooks/useAbastecimentos';
import type { Abastecimento as AbastecimentoType, AbastecimentoFormData } from '@/types/abastecimento';


const AbastecimentoPage = () => {
  const { data: abastecimentos = [], isLoading } = useAbastecimentos();
  const createAbastecimento = useCreateAbastecimento();
  const updateAbastecimento = useUpdateAbastecimento();
  const deleteAbastecimento = useDeleteAbastecimento();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAbastecimento, setSelectedAbastecimento] = useState<AbastecimentoType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

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
    return abastecimentos.filter(a => {
      const matchesSearch =
        searchTerm === '' ||
        a.veiculo_placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.condutor_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.posto?.toLowerCase().includes(searchTerm.toLowerCase());

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

      return matchesSearch && matchesDate;
    });
  }, [abastecimentos, searchTerm, dateFrom, dateTo]);

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
          <Button onClick={() => handleOpenForm()} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Abastecimento
          </Button>
        </div>

        <div className="space-y-6">
          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Registros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{filteredAbastecimentos.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Litros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {totalLitros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} L
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  Média de Consumo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-500">
                  {mediaConsumo > 0
                    ? `${mediaConsumo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km/l`
                    : 'N/A'}
                </p>
                {abastecimentosComKmPorLitro.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Baseado em {abastecimentosComKmPorLitro.length} registro(s)
                  </p>
                )}
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Valor Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-500">
                  R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
          </div>


          {/* Tabela */}
          <div className="space-y-4">
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
          </div>
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
