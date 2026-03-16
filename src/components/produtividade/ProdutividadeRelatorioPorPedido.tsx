import {
  ReceiptLongOutlined as Receipt,
  WarningAmberOutlined as Warning,
  SettingsOutlined as Settings,
  EditOutlined as Edit,
} from '@mui/icons-material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Entrega, STATUS_MONTAGEM_LABELS, StatusMontagem } from '@/types/entrega';
import { useTiposServicoMontagem } from '@/hooks/useTiposServicoMontagem';
import { useUpdateEntrega } from '@/hooks/useEntregas';
import { ProdutividadeItemFormModal } from '@/components/produtividade/ProdutividadeItemFormModal';
import { EntregaDetailModal } from '@/components/dashboard/EntregaDetailModal';
import { PaginationControl } from '@/components/shared/PaginationControl';
import { formatDateLocal } from '@/utils/dateUtils';
import { format } from 'date-fns';

interface ProdutividadeRelatorioPorPedidoProps {
  entregas: Entrega[];
  isLoading: boolean;
  periodLabel: string;
}

const PAGE_SIZE = 100;

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
  PENDENTE: 'border-slate-400 text-slate-600 dark:text-slate-400',
  EM_MONTAGEM: 'border-blue-400 text-blue-600 dark:text-blue-400',
  MONTAGEM_PARCIAL: 'border-orange-400 text-orange-600 dark:text-orange-400',
  CONCLUIDO: 'border-emerald-400 text-emerald-600 dark:text-emerald-400',
};

export function ProdutividadeRelatorioPorPedido({
  entregas,
  isLoading,
  periodLabel,
}: ProdutividadeRelatorioPorPedidoProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: tiposServico = [] } = useTiposServicoMontagem();
  const updateEntrega = useUpdateEntrega();
  const [selectedEntrega, setSelectedEntrega] = useState<Entrega | null>(null);
  const [detailEntrega, setDetailEntrega] = useState<Entrega | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [page, setPage] = useState(1);

  const tipoMap = useMemo(
    () => new Map(tiposServico.map((t) => [t.id, t])),
    [tiposServico]
  );

  // Apenas entradas concluídas e configuradas entram nos totais
  const totais = useMemo(() => {
    const configuradas = entregas.filter(
      (e) => e.status_montagem === 'CONCLUIDO' && e.tipo_servico_id
    );
    return {
      produtividadeTotal: configuradas.reduce((acc, e) => acc + (e.produtividade ?? 0), 0),
      produtividadePorMontador: configuradas.reduce(
        (acc, e) => acc + (e.produtividade_por_montador ?? 0),
        0
      ),
      valorTotal: entregas.reduce((acc, e) => acc + (e.valor ?? 0), 0),
      totalPedidos: entregas.length,
      configuradas: configuradas.length,
      pendentes: entregas.filter((e) => e.status_montagem === 'CONCLUIDO' && !e.tipo_servico_id).length,
    };
  }, [entregas]);

  const totalPages = Math.ceil(entregas.length / PAGE_SIZE);
  const paginatedEntregas = useMemo(
    () => entregas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [entregas, page]
  );

  useEffect(() => {
    setPage(1);
  }, [entregas]);

  const handleEdit = (entrega: Entrega) => {
    setSelectedEntrega(entrega);
    setIsFormOpen(true);
  };

  const handleOpenDetail = (entrega: Entrega) => {
    setDetailEntrega(entrega);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (entregas.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Receipt className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-base font-semibold text-foreground mb-1">
            Nenhuma montagem encontrada
          </h3>
          <p className="text-sm text-muted-foreground">
            {periodLabel === 'Todos os períodos'
              ? 'Você está vendo todo o período. Não há montagens com data registrada. Use Data inicial e Data final para filtrar.'
              : `Não há montagens com data registrada em ${periodLabel}.`}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Alerta de pendentes sem configuração */}
      {totais.pendentes > 0 && (
        <div className="flex items-center justify-between gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg">
          <div className="flex items-center gap-3">
            <Warning className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <strong>{totais.pendentes}</strong> montagem{totais.pendentes !== 1 ? 's' : ''}{' '}
              concluída{totais.pendentes !== 1 ? 's' : ''} sem tipo de serviço configurado.
              Configure retroativamente para incluir nos totais de produtividade.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/produtividade', { state: { tab: 'retroativo' } })}
            className="shrink-0 border-amber-400 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 gap-1"
          >
            <Settings className="h-4 w-4" />
            Config. Retroativa
          </Button>
        </div>
      )}

      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-muted/30 bg-muted/20">
                  <TableHead className="text-muted-foreground text-xs pl-4 w-[110px]">
                    Data Montagem
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs">Cliente</TableHead>
                  <TableHead className="text-muted-foreground text-xs w-[120px]">NF / PV</TableHead>
                  <TableHead className="text-muted-foreground text-xs text-right w-[120px]">
                    Valor Pedido
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs w-[110px]">Status</TableHead>
                  <TableHead className="text-muted-foreground text-xs w-[140px]">
                    Tipo de Serviço
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs text-right w-[140px]">
                    Produtividade Total
                  </TableHead>
                    <TableHead className="text-muted-foreground text-xs text-right w-[130px]">
                      Prod./Montador
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs">Montadores</TableHead>
                    <TableHead className="text-muted-foreground text-xs text-right pr-4">Ação</TableHead>
                  </TableRow>
                </TableHeader>

              <TableBody>
                {paginatedEntregas.map((entrega) => {
                  const tipo = entrega.tipo_servico_id
                    ? tipoMap.get(entrega.tipo_servico_id)
                    : null;
                  const montadores = [entrega.montador_1, entrega.montador_2].filter(Boolean);
                  const semConfig =
                    entrega.status_montagem === 'CONCLUIDO' && !entrega.tipo_servico_id;
                  const naoConcluida = entrega.status_montagem !== 'CONCLUIDO';

                  return (
                    <TableRow
                      key={entrega.id}
                      className={`border-border hover:bg-muted/30 cursor-pointer ${semConfig ? 'bg-amber-50/40 dark:bg-amber-500/5' : ''}`}
                      onClick={() => handleOpenDetail(entrega)}
                    >
                      <TableCell className="text-sm text-foreground pl-4">
                        {formatDate(entrega.data_montagem)}
                      </TableCell>

                      <TableCell className="text-sm font-medium text-foreground max-w-[200px] truncate">
                        {entrega.cliente || '—'}
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        <div>{entrega.nf || '—'}</div>
                        {entrega.pv_foco && (
                          <div className="text-xs text-muted-foreground/70">
                            PV: {entrega.pv_foco}
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="text-sm text-foreground text-right">
                        {entrega.valor != null ? formatCurrency(entrega.valor) : '—'}
                      </TableCell>

                      <TableCell>
                        {entrega.status_montagem ? (
                          <Badge
                            variant="outline"
                            className={`text-xs ${STATUS_MONTAGEM_CORES[entrega.status_montagem] ?? ''}`}
                          >
                            {STATUS_MONTAGEM_LABELS[entrega.status_montagem as StatusMontagem] ??
                              entrega.status_montagem}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {naoConcluida ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : tipo ? (
                          <div>
                            <span className="text-sm font-medium text-foreground">{tipo.nome}</span>
                            <div className="text-xs text-muted-foreground">
                              {tipo.percentual.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 4,
                              })}%
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Warning className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                            <Badge
                              variant="outline"
                              className="text-xs border-amber-400 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10"
                            >
                              Configurar retroativo
                            </Badge>
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        {naoConcluida || semConfig ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            {entrega.produtividade != null
                              ? formatCurrency(entrega.produtividade)
                              : '—'}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        {naoConcluida || semConfig ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {entrega.produtividade_por_montador != null
                              ? formatCurrency(entrega.produtividade_por_montador)
                              : '—'}
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {montadores.length > 0 ? (
                            montadores.map((nome) => (
                              <Badge key={nome} variant="secondary" className="text-xs">
                                {nome}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div
                          onClick={(event) => {
                            event.stopPropagation();
                          }}
                          className="flex justify-end"
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                aria-label="Configurações do item"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={(event) => {
                                  event.preventDefault();
                                  handleEdit(entrega);
                                }}
                                className="gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Editar produtividade
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>

              <TableFooter>
                <TableRow className="border-border bg-muted/30 font-semibold">
                  <TableCell colSpan={3} className="text-sm text-foreground pl-4">
                    Total — {totais.totalPedidos} pedido{totais.totalPedidos !== 1 ? 's' : ''}
                    {totais.pendentes > 0 && (
                      <span className="ml-2 text-xs font-normal text-amber-600 dark:text-amber-400">
                        ({totais.pendentes} sem configuração)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-right text-foreground">
                    {formatCurrency(totais.valorTotal)}
                  </TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell className="text-right text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(totais.produtividadeTotal)}
                  </TableCell>
                  <TableCell className="text-right text-blue-600 dark:text-blue-400">
                    {formatCurrency(totais.produtividadePorMontador)}
                  </TableCell>
                  <TableCell />
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <PaginationControl
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalRecords={entregas.length}
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

      <EntregaDetailModal
        open={!!detailEntrega}
        onOpenChange={(open) => {
          if (!open) setDetailEntrega(null);
        }}
        entrega={detailEntrega}
        showEditButton={false}
      />
    </div>
  );
}
