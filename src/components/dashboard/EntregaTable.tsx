import { Edit as Pencil, Delete as Trash2 } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from './StatusBadge';
import { Entrega } from '@/types/entrega';
import { Badge } from '@/components/ui/badge';

interface EntregaTableProps {
  entregas: Entrega[];
  onEdit: (entrega: Entrega) => void;
  onDelete: (entrega: Entrega) => void;
}

export function EntregaTable({ entregas, onEdit, onDelete }: EntregaTableProps) {
  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    // Parse string ISO (YYYY-MM-DD) diretamente sem conversão de timezone
    const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      const formatted = `${day}/${month}/${year}`;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EntregaTable.tsx:formatDate',message:'formatDate exibindo data',data:{input:dateString,formatted,method:'direct_parse'},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return formatted;
    }
    // Fallback para outros formatos
    const date = new Date(dateString + 'T12:00:00'); // Usar meio-dia para evitar problemas de timezone
    const formatted = date.toLocaleDateString('pt-BR');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1876b801-4017-4911-86b8-3f0fe2655b09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EntregaTable.tsx:formatDate',message:'formatDate exibindo data',data:{input:dateString,formatted,method:'fallback'},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return formatted;
  };

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="text-foreground font-semibold">PV Foco</TableHead>
            <TableHead className="text-foreground font-semibold">NF</TableHead>
            <TableHead className="text-foreground font-semibold">Cliente</TableHead>
            <TableHead className="text-foreground font-semibold">UF</TableHead>
            <TableHead className="text-foreground font-semibold">Data Saída</TableHead>
            <TableHead className="text-foreground font-semibold">Motorista</TableHead>
            <TableHead className="text-foreground font-semibold">Tipo</TableHead>
            <TableHead className="text-foreground font-semibold">Valor</TableHead>
            <TableHead className="text-foreground font-semibold">Status</TableHead>
            <TableHead className="text-foreground font-semibold">Status Montagem</TableHead>
            <TableHead className="text-foreground font-semibold text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entregas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                Nenhuma entrega encontrada.
              </TableCell>
            </TableRow>
          ) : (
            entregas.map((entrega) => {
              const isDeclaracao = entrega.nf?.toUpperCase() === 'DECLARAÇÃO';
              const nfDisplay = entrega.nf || '-';
              
              return (
                <TableRow key={entrega.id} className="hover:bg-muted/30">
                  <TableCell>{entrega.pv_foco || '-'}</TableCell>
                  <TableCell className={`font-medium ${isDeclaracao ? 'text-red-600 font-semibold' : ''}`}>
                    {nfDisplay}
                  </TableCell>
                  <TableCell>{entrega.cliente || '-'}</TableCell>
                  <TableCell>{entrega.uf || '-'}</TableCell>
                  <TableCell>{formatDate(entrega.data_saida)}</TableCell>
                  <TableCell>{entrega.motorista || '-'}</TableCell>
                  <TableCell>{entrega.tipo_transporte || '-'}</TableCell>
                  <TableCell>{formatCurrency(entrega.valor)}</TableCell>
                  <TableCell>
                    <StatusBadge status={entrega.status} />
                  </TableCell>
                  <TableCell>
                    {entrega.precisa_montagem ? (
                      entrega.status_montagem === 'CONCLUIDO' ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Concluído
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          Pendente
                        </Badge>
                      )
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(entrega)}
                        className="h-8 w-8 hover:bg-primary/10"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(entrega)}
                        className="h-8 w-8 hover:bg-destructive/10 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
