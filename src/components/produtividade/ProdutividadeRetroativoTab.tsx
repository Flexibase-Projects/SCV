import { useState, useMemo, useEffect } from 'react';
import { EditOutlined as Edit, WarningAmberOutlined as Warning } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PaginationControl } from '@/components/shared/PaginationControl';
import { ProdutividadeItemFormModal } from '@/components/produtividade/ProdutividadeItemFormModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEntregasComMontagem } from '@/hooks/useProdutividade';
import { useUpdateEntrega } from '@/hooks/useEntregas';
import { useQueryClient } from '@tanstack/react-query';
import { Entrega, STATUS_MONTAGEM_LABELS, StatusMontagem } from '@/types/entrega';
import { formatDateLocal } from '@/utils/dateUtils';
import { format } from 'date-fns';

const PAGE_SIZE = 50;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    return format(new Date(year, month - 1, day), 'dd/MM/yyyy');
  } catch {
    return dateStr;
  }
}

const STATUS_MONTAGEM_CORES: Record<string, string> = {
  PENDENTE: 'border-slate-400 text-slate-600',
  EM_MONTAGEM: 'border-blue-400 text-blue-600',
  MONTAGEM_PARCIAL: 'border-orange-400 text-orange-600',
  CONCLUIDO: 'border-emerald-400 text-emerald-600',
};

export interface ProdutividadeRetroativoTabProps {
  dateFrom: Date | null;
  dateTo: Date | null;
  searchTerm: string;
  enabled?: boolean;
}

export function ProdutividadeRetroativoTab({ dateFrom, dateTo, searchTerm, enabled = true }: ProdutividadeRetroativoTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [dateFrom, dateTo, searchTerm]);

  const [selectedEntrega, setSelectedEntrega] = useState<Entrega | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: entregas = [], isLoading } = useEntregasComMontagem({ enabled });
  const updateEntrega = useUpdateEntrega();
  const queryClient = useQueryClient();

  const filtered = useMemo(() => {
    let result = entregas;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (e) =>
          e.cliente?.toLowerCase().includes(term) ||
          e.nf?.toLowerCase().includes(term) ||
          e.pv_foco?.toLowerCase().includes(term) ||
          e.montador_1?.toLowerCase().includes(term) ||
          e.montador_2?.toLowerCase().includes(term)
      );
    }

    if (dateFrom) {
      result = result.filter((e) => {
        if (!e.data_montagem) return false;
        return new Date(e.data_montagem + 'T00:00:00') >= dateFrom;
      });
    }

    if (dateTo) {
      result = result.filter((e) => {
        if (!e.data_montagem) return true;
        return new Date(e.data_montagem + 'T00:00:00') <= dateTo;
      });
    }

    if (statusFilter !== 'todos') {
      if (statusFilter === 'sem_produtividade') {
        result = result.filter((e) => !e.tipo_servico_id);
      } else {
        result = result.filter((e) => e.status_montagem === statusFilter);
      }
    }

    return result;
  }, [entregas, searchTerm, dateFrom, dateTo, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const semProdutividade = entregas.filter((e) => !e.tipo_servico_id).length;

  const handleEdit = (entrega: Entrega) => {
    setSelectedEntrega(entrega);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedEntrega(null);
  };

  const handleSubmit = (data: {
    status_montagem?: StatusMontagem;
    data_montagem?: Date;
    montador_1?: string;
    montador_2?: string;
    tipo_servico_id?: string;
    produtividade?: number;
    produtividade_por_montador?: number;
  }) => {
    if (!selectedEntrega) return;

    const formattedData = {
      status_montagem: data.status_montagem ?? null,
      data_montagem: data.data_montagem ? formatDateLocal(data.data_montagem) : null,
      montador_1: data.montador_1 || null,
      montador_2: data.montador_2 || null,
      tipo_servico_id: data.tipo_servico_id || null,
      produtividade: data.produtividade ?? 0,
      produtividade_por_montador: data.produtividade_por_montador ?? 0,
    };

    updateEntrega.mutate(
      { id: selectedEntrega.id, data: formattedData },
      {
        onSuccess: () => {
          handleCloseForm();
          queryClient.invalidateQueries({ queryKey: ['entregas-com-montagem'] });
          queryClient.invalidateQueries({ queryKey: ['pendentes-sem-produtividade'] });
          queryClient.invalidateQueries({ queryKey: ['produtividade-por-montador'] });
          queryClient.invalidateQueries({ queryKey: ['todas-montagens-periodo'] });
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Alerta de pendentes */}
      {semProdutividade > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg">
          <Warning className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <strong>{semProdutividade}</strong> montagem{semProdutividade !== 1 ? 's' : ''} sem tipo
            de serviço configurado. Edite cada uma para definir o tipo e calcular a produtividade.
          </p>
        </div>
      )}

      {/* Filtro de status (busca e datas vêm do filtro padrão do topo da página) */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={statusFilter}
          onValueChange={(v) => { setStatusFilter(v); setPage(1); }}
        >
          <SelectTrigger className="w-[220px] bg-brand-white dark:bg-[#181b21] border-gray-100 dark:border-white/5 rounded-xl h-10">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="sem_produtividade">Sem Produtividade</SelectItem>
            <SelectItem value="PENDENTE">Pendente</SelectItem>
            <SelectItem value="EM_MONTAGEM">Em montagem</SelectItem>
            <SelectItem value="MONTAGEM_PARCIAL">Montagem parcial</SelectItem>
            <SelectItem value="CONCLUIDO">Concluído</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tabela */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma montagem encontrada com os filtros aplicados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-muted/30 bg-muted/20">
                    <TableHead className="text-muted-foreground text-xs pl-4">Data Montagem</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Cliente</TableHead>
                    <TableHead className="text-muted-foreground text-xs">NF / PV</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Montadores</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Status</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Produtividade</TableHead>
                    <TableHead className="text-muted-foreground text-xs text-right pr-4">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((entrega) => {
                    const semConfig = !entrega.tipo_servico_id;
                    const montadores = [entrega.montador_1, entrega.montador_2].filter(Boolean);

                    return (
                      <TableRow
                        key={entrega.id}
                        className="border-border hover:bg-muted/30 cursor-pointer"
                        onClick={() => handleEdit(entrega)}
                      >
                        <TableCell className="text-sm text-foreground pl-4">
                          {formatDate(entrega.data_montagem)}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-foreground max-w-[180px] truncate">
                          {entrega.cliente || '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div>{entrega.nf || '—'}</div>
                          {entrega.pv_foco && (
                            <div className="text-xs text-muted-foreground/70">PV: {entrega.pv_foco}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {montadores.length > 0
                              ? montadores.map((nome) => (
                                  <Badge key={nome} variant="secondary" className="text-xs">
                                    {nome}
                                  </Badge>
                                ))
                              : <span className="text-xs text-muted-foreground">—</span>
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          {entrega.status_montagem ? (
                            <Badge
                              variant="outline"
                              className={`text-xs ${STATUS_MONTAGEM_CORES[entrega.status_montagem] || ''}`}
                            >
                              {STATUS_MONTAGEM_LABELS[entrega.status_montagem as StatusMontagem] ?? entrega.status_montagem}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {semConfig ? (
                            <Badge
                              variant="outline"
                              className="text-xs border-amber-400 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10"
                            >
                              Sem Produtividade
                            </Badge>
                          ) : (
                            <div className="space-y-0.5">
                              <div className="text-xs text-muted-foreground">Total:</div>
                              <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                {entrega.produtividade != null
                                  ? formatCurrency(entrega.produtividade)
                                  : '—'}
                              </div>
                              {entrega.produtividade_por_montador != null && (
                                <div className="text-xs text-muted-foreground">
                                  /montador: {formatCurrency(entrega.produtividade_por_montador)}
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleEdit(entrega);
                            }}
                            className="h-8 gap-1 text-muted-foreground hover:text-foreground"
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <PaginationControl
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalRecords={filtered.length}
          itemsPerPage={PAGE_SIZE}
        />
      )}

      <ProdutividadeItemFormModal
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        entrega={selectedEntrega}
        onSubmit={handleSubmit}
        isLoading={updateEntrega.isPending}
      />
    </div>
  );
}
