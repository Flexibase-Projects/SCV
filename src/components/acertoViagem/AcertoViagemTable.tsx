import { useState, useRef } from 'react';
import { Edit, Delete as Trash2, Print as Printer, MoreHoriz as MoreHorizontal } from '@mui/icons-material';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteConfirmDialog } from '@/components/dashboard/DeleteConfirmDialog';
import { useDeleteAcertoViagem } from '@/hooks/useAcertosViagem';
import { VirtualizedTableBody, VIRTUAL_SCROLL_MAX_HEIGHT, VIRTUAL_SCROLL_ROW_HEIGHT } from '@/components/shared/VirtualizedTableBody';
import { AcertoViagem, calcularTotalDespesas, calcularSaldo, calcularDiasViagem } from '@/types/acertoViagem';

const ACERTO_COL_WIDTHS = ['12%', '14%', '12%', '14%', '8%', '10%', '10%', '12%', '8%', '8%'];

interface AcertoViagemTableProps {
  acertos: AcertoViagem[];
  isLoading: boolean;
  onEdit: (acerto: AcertoViagem) => void;
  onPrint: (acerto: AcertoViagem) => void;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'PENDENTE':
      return <Badge className="bg-yellow-500">Pendente</Badge>;
    case 'ACERTADO':
      return <Badge className="bg-green-500">Acertado</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function formatDate(date: string | null) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}

function getResponsavel(acerto: AcertoViagem) {
  if (acerto.motorista_nome && acerto.montador_nome) {
    return `${acerto.motorista_nome} / ${acerto.montador_nome}`;
  }
  return acerto.motorista_nome || acerto.montador_nome || '-';
}

function renderAcertoRow(
  acerto: AcertoViagem,
  _index: number,
  onEdit: (a: AcertoViagem) => void,
  onPrint: (a: AcertoViagem) => void,
  onDeleteRequest: (id: string) => void
) {
  const totalDespesas = calcularTotalDespesas(acerto);
  const saldo = calcularSaldo(acerto);
  const dias = calcularDiasViagem(acerto.data_saida, acerto.data_chegada);

  return (
    <>
      <TableCell className="font-medium">{acerto.destino}</TableCell>
      <TableCell>{getResponsavel(acerto)}</TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{acerto.veiculo_placa || '-'}</span>
          <span className="text-xs text-muted-foreground">{acerto.veiculo_modelo}</span>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex flex-col text-sm">
          <span>{formatDate(acerto.data_saida)}</span>
          <span className="text-muted-foreground">{formatDate(acerto.data_chegada)}</span>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Badge variant="outline">{dias > 0 ? `${dias} dias` : '-'}</Badge>
      </TableCell>
      <TableCell className="text-right">
        R$ {(acerto.valor_adiantamento || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </TableCell>
      <TableCell className="text-right text-orange-500 font-medium">
        R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </TableCell>
      <TableCell className="text-right">
        <span className={saldo.tipo === 'devolver' ? 'text-green-500' : 'text-red-500'}>
          {saldo.tipo === 'devolver' ? '+' : '-'} R$ {saldo.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
        <p className="text-xs text-muted-foreground">
          {saldo.tipo === 'devolver' ? 'a devolver' : 'a receber'}
        </p>
      </TableCell>
      <TableCell className="text-center">
        {getStatusBadge(acerto.status)}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onPrint(acerto)}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(acerto)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDeleteRequest(acerto.id)} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </>
  );
}

export function AcertoViagemTable({ acertos, isLoading, onEdit, onPrint }: AcertoViagemTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const deleteAcerto = useDeleteAcertoViagem();

  const handleDelete = () => {
    if (deleteId) {
      deleteAcerto.mutate(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (acertos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum acerto de viagem encontrado.
      </div>
    );
  }

  return (
    <>
      <div
        ref={parentRef}
        className="overflow-auto rounded-lg border"
        style={{ maxHeight: VIRTUAL_SCROLL_MAX_HEIGHT }}
      >
        <table className="w-full caption-bottom text-sm table-fixed">
          <colgroup>
            {ACERTO_COL_WIDTHS.map((w, i) => (
              <col key={i} style={{ width: w }} />
            ))}
          </colgroup>
          <TableHeader className="sticky top-0 z-10 bg-muted/50 dark:bg-muted/30 border-b border-border">
            <TableRow className="border-0">
              <TableHead>Destino</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Veículo</TableHead>
              <TableHead className="text-center">Período</TableHead>
              <TableHead className="text-center">Dias</TableHead>
              <TableHead className="text-right">Adiantamento</TableHead>
              <TableHead className="text-right">Despesas</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
        </table>
        <VirtualizedTableBody
          parentRef={parentRef}
          data={acertos}
          rowHeight={VIRTUAL_SCROLL_ROW_HEIGHT}
          getRowKey={(a) => a.id}
          renderRow={(item, index) => renderAcertoRow(item, index, onEdit, onPrint, setDeleteId)}
          colWidths={ACERTO_COL_WIDTHS}
        />
      </div>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={deleteAcerto.isPending}
        title="Excluir Acerto de Viagem"
        description="Tem certeza que deseja excluir este acerto de viagem? Esta ação não pode ser desfeita."
      />
    </>
  );
}
