import { useState, useMemo, useEffect } from 'react';
import { Add as Plus, Search, Description as FileText, Print as Printer } from '@mui/icons-material';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAcertosViagem } from '@/hooks/useAcertosViagem';
import { AcertoViagemTable } from '@/components/acertoViagem/AcertoViagemTable';
import { AcertoViagemFormModal } from '@/components/acertoViagem/AcertoViagemFormModal';
import { AcertoViagemPrintModal } from '@/components/acertoViagem/AcertoViagemPrintModal';
import { TablePrintModal, TableColumn } from '@/components/shared/TablePrintModal';
import { AcertoViagem } from '@/types/acertoViagem';
import { calcularTotalDespesas, calcularSaldo, calcularDiasViagem } from '@/types/acertoViagem';
import { format } from 'date-fns';

const AcertoViagemPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isTablePrintModalOpen, setIsTablePrintModalOpen] = useState(false);
  const [selectedAcerto, setSelectedAcerto] = useState<AcertoViagem | null>(null);

  const { data: acertos = [], isLoading, error, isError } = useAcertosViagem();

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AcertoViagem.tsx:23',message:'Estado da query',data:{isLoading,isError,errorMessage:error?.message,acertosLength:acertos.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  }, [isLoading, isError, error, acertos.length]);
  // #endregion

  // Filtrar acertos
  const filteredAcertos = acertos.filter(acerto => {
    const searchLower = searchTerm.toLowerCase();
    return (
      acerto.destino?.toLowerCase().includes(searchLower) ||
      acerto.motorista_nome?.toLowerCase().includes(searchLower) ||
      acerto.montador_nome?.toLowerCase().includes(searchLower) ||
      acerto.veiculo_placa?.toLowerCase().includes(searchLower)
    );
  });

  // KPIs
  const totalAcertos = acertos.length;
  const acertosPendentes = acertos.filter(a => a.status === 'PENDENTE').length;
  const acertosFinalizados = acertos.filter(a => a.status === 'ACERTADO').length;
  const totalDespesas = acertos.reduce((acc, a) => acc + calcularTotalDespesas(a), 0);

  // Configuração de colunas para impressão
  const printColumns: TableColumn<AcertoViagem>[] = useMemo(() => [
    { key: 'destino', label: 'Destino' },
    { 
      key: 'motorista_nome', 
      label: 'Responsável',
      render: (value, row) => {
        if (row.motorista_nome && row.montador_nome) {
          return `${row.motorista_nome} / ${row.montador_nome}`;
        }
        return row.motorista_nome || row.montador_nome || '-';
      }
    },
    { 
      key: 'veiculo_placa', 
      label: 'Veículo',
      render: (value, row) => row.veiculo_placa ? `${row.veiculo_placa}${row.veiculo_modelo ? ` - ${row.veiculo_modelo}` : ''}` : '-'
    },
    { 
      key: 'data_saida', 
      label: 'Período',
      render: (value, row) => {
        const saida = value ? format(new Date(value), 'dd/MM/yyyy') : '-';
        const chegada = row.data_chegada ? format(new Date(row.data_chegada), 'dd/MM/yyyy') : '-';
        return `${saida} a ${chegada}`;
      }
    },
    { 
      key: 'data_saida', 
      label: 'Dias',
      render: (value, row) => {
        const dias = calcularDiasViagem(value, row.data_chegada);
        return dias > 0 ? `${dias} dias` : '-';
      }
    },
    { 
      key: 'valor_adiantamento', 
      label: 'Adiantamento',
      render: (value) => `R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      className: 'text-right'
    },
    { 
      key: 'id', 
      label: 'Despesas',
      render: (value, row) => {
        const total = calcularTotalDespesas(row);
        return `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      },
      className: 'text-right font-medium'
    },
    { 
      key: 'id', 
      label: 'Saldo',
      render: (value, row) => {
        const saldo = calcularSaldo(row);
        return `${saldo.tipo === 'devolver' ? '+' : '-'} R$ ${saldo.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      },
      className: 'text-right'
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value) => value === 'PENDENTE' ? 'Pendente' : 'Acertado'
    },
  ], []);

  // Texto descritivo dos filtros aplicados
  const filtersText = useMemo(() => {
    if (searchTerm.trim()) {
      return `Busca: "${searchTerm}"`;
    }
    return 'Todos os registros';
  }, [searchTerm]);

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
      <div className="p-8 lg:p-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Acerto de Viagem</h1>
            <p className="text-slate-500 mt-1">Gerencie os acertos de viagem e despesas</p>
          </div>
          <Button onClick={() => setIsFormModalOpen(true)} className="bg-green-600 hover:bg-green-700 gap-2">
            <Plus className="h-4 w-4" />
            Novo Acerto
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-sm border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Total de Acertos</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalAcertos}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Pendentes</span>
              </div>
              <p className="text-2xl font-bold text-yellow-500">{acertosPendentes}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Acertados</span>
              </div>
              <p className="text-2xl font-bold text-green-500">{acertosFinalizados}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-muted-foreground">Total Despesas</span>
              </div>
              <p className="text-2xl font-bold text-orange-500">
                R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Table + Search */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/50 mb-4">
            <CardTitle>Lista de Acertos</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por destino, motorista..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={() => setIsTablePrintModalOpen(true)}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Imprimir / PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-6 pb-6">
              <AcertoViagemTable
                acertos={filteredAcertos}
                isLoading={isLoading}
                onEdit={handleEdit}
                onPrint={handlePrint}
              />
            </div>
          </CardContent>
        </Card>

        {/* Modals */}
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
          subtitle="Listagem completa de acertos de viagem"
          data={filteredAcertos}
          columns={printColumns}
          filters={filtersText}
        />
      </div>
    </ModuleLayout>
  );
};

export default AcertoViagemPage;
