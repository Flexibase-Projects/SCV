import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Add as Plus, LocalShipping as Truck, Settings, LocalGasStation as Fuel } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { KPICards } from '@/components/dashboard/KPICards';
import { EntregaFilters } from '@/components/dashboard/EntregaFilters';
import { EntregaTable } from '@/components/dashboard/EntregaTable';
import { EntregaFormModal } from '@/components/dashboard/EntregaFormModal';
import { DeleteConfirmDialog } from '@/components/dashboard/DeleteConfirmDialog';
import { useEntregas, useCreateEntrega, useUpdateEntrega, useDeleteEntrega, useEntregasStats } from '@/hooks/useEntregas';
import { Entrega, EntregaFormData } from '@/types/entrega';
import { format } from 'date-fns';
import { formatDateLocal } from '@/utils/dateUtils';

const Index = () => {
  const { data: entregas = [], isLoading } = useEntregas();
  const createEntrega = useCreateEntrega();
  const updateEntrega = useUpdateEntrega();
  const deleteEntrega = useDeleteEntrega();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [motoristaFilter, setMotoristaFilter] = useState('all');

  // Get accurate stats using RPC function to bypass row limits
  const { data: stats } = useEntregasStats({
    searchTerm: searchTerm || undefined,
    dateFrom: null,
    dateTo: null
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEntrega, setSelectedEntrega] = useState<Entrega | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [entregaToDelete, setEntregaToDelete] = useState<Entrega | null>(null);

  const motoristas = useMemo(() => {
    const uniqueMotoristas = new Set(
      entregas
        .map(e => e.motorista)
        .filter((m): m is string => m !== null && m !== '')
    );
    return Array.from(uniqueMotoristas).sort();
  }, [entregas]);

  const filteredEntregas = useMemo(() => {
    return entregas.filter(entrega => {
      const matchesSearch =
        searchTerm === '' ||
        entrega.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entrega.pv_foco?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        entrega.status === statusFilter;

      const matchesMotorista =
        motoristaFilter === 'all' ||
        entrega.motorista === motoristaFilter;

      return matchesSearch && matchesStatus && matchesMotorista;
    });
  }, [entregas, searchTerm, statusFilter, motoristaFilter]);

  const handleOpenForm = (entrega?: Entrega) => {
    setSelectedEntrega(entrega || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedEntrega(null);
  };

  const handleSubmit = (data: Partial<EntregaFormData> & { montador_1?: string; montador_2?: string; data_saida?: Date; data_montagem?: Date }) => {
    const formattedData = {
      ...data,
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1115]">
      <header className="border-b border-border bg-brand-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Truck className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Controle de Entregas
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gerenciamento de rotas e entregas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/abastecimento">
                <Button variant="outline" className="gap-2">
                  <Fuel className="h-4 w-4" />
                  Abastecimento
                </Button>
              </Link>
              <Link to="/cadastros">
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Cadastros
                </Button>
              </Link>
              <Button onClick={() => handleOpenForm()} className="gap-2 bg-brand-green hover:bg-emerald-600">
                <Plus className="h-4 w-4" />
                Nova Entrega
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <KPICards entregas={filteredEntregas} stats={stats} />

        <div className="space-y-4">
          <EntregaFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            motoristaFilter={motoristaFilter}
            onMotoristaChange={setMotoristaFilter}
            motoristas={motoristas}
          />

          <EntregaTable
            entregas={filteredEntregas}
            onEdit={handleOpenForm}
            onDelete={handleOpenDeleteDialog}
          />
        </div>
      </main>

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
    </div>
  );
};

export default Index;
