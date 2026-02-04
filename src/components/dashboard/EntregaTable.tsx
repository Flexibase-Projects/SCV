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
    const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      return `${day}/${month}/${year}`;
    }
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="bg-brand-white dark:bg-[#181b21] border border-gray-100 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <TableHead className="text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider h-11">PV Foco</TableHead>
            <TableHead className="text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider h-11">NF</TableHead>
            <TableHead className="text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider h-11">Cliente</TableHead>
            <TableHead className="text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider h-11">UF</TableHead>
            <TableHead className="text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider h-11">Data Saída</TableHead>
            <TableHead className="text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider h-11">Motorista</TableHead>
            <TableHead className="text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider h-11">Tipo</TableHead>
            <TableHead className="text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider h-11">Valor</TableHead>
            <TableHead className="text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider h-11">Status</TableHead>
            <TableHead className="text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider h-11">Montagem</TableHead>
            <TableHead className="text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider h-11 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entregas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="h-32 text-center text-slate-500">
                Nenhuma entrega encontrada.
              </TableCell>
            </TableRow>
          ) : (
            entregas.map((entrega) => {
              const isDeclaracao = entrega.nf?.toUpperCase() === 'DECLARAÇÃO';
              const nfDisplay = entrega.nf || '-';
              
              return (
                <TableRow 
                  key={entrega.id} 
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150 group border-b border-slate-100 dark:border-slate-800/50"
                >
                  <TableCell className="font-mono text-sm text-slate-700 dark:text-slate-300">{entrega.pv_foco || '-'}</TableCell>
                  <TableCell className={`font-mono text-sm ${isDeclaracao ? 'text-rose-600 font-semibold' : 'text-slate-700 dark:text-slate-300'}`}>
                    {nfDisplay}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900 dark:text-slate-100">{entrega.cliente || '-'}</TableCell>
                  <TableCell className="font-mono text-sm text-slate-600 dark:text-slate-400">{entrega.uf || '-'}</TableCell>
                  <TableCell className="font-mono text-sm text-slate-600 dark:text-slate-400">{formatDate(entrega.data_saida)}</TableCell>
                  <TableCell className="text-sm text-slate-700 dark:text-slate-300">{entrega.motorista || '-'}</TableCell>
                  <TableCell className="text-sm text-slate-600 dark:text-slate-400">{entrega.tipo_transporte || '-'}</TableCell>
                  <TableCell className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100">{formatCurrency(entrega.valor)}</TableCell>
                  <TableCell>
                    <StatusBadge status={entrega.status} />
                  </TableCell>
                  <TableCell>
                    {entrega.precisa_montagem ? (
                      entrega.status_montagem === 'CONCLUIDO' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 text-xs font-medium">
                          Concluído
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 text-xs font-medium">
                          Pendente
                        </span>
                      )
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(entrega)}
                        className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg text-slate-400"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(entrega)}
                        className="h-8 w-8 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg text-slate-400"
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
