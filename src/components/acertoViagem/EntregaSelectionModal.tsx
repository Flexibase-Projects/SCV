import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SearchOutlined } from '@mui/icons-material';
import { format } from 'date-fns';

export interface EntregaDisponivel {
  id: string;
  pv_foco: string | null;
  nota_fiscal?: string | null;
  cliente: string | null;
  uf: string | null;
  valor: number | null;
  gastos_entrega?: number | null;
  percentual_gastos?: number | null;
  data_saida?: string | null;
  motorista?: string | null;
  carro?: string | null;
}

interface EntregaSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  entregas: EntregaDisponivel[];
  selectedIds: string[];
  onConfirm: (ids: string[]) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  isLoading?: boolean;
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return '-';
  try {
    return format(new Date(dateString + 'T12:00:00'), 'dd/MM/yyyy');
  } catch {
    return dateString;
  }
}

export function EntregaSelectionModal({
  isOpen,
  onClose,
  entregas,
  selectedIds,
  onConfirm,
  searchTerm,
  onSearchTermChange,
  isLoading,
}: EntregaSelectionModalProps) {
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedIds);

  useEffect(() => {
    if (isOpen) {
      setLocalSelectedIds(selectedIds);
    }
  }, [isOpen, selectedIds]);

  const totalSelecionado = useMemo(() => {
    return localSelectedIds.reduce((acc, id) => {
      const entrega = entregas.find((item) => item.id === id);
      return acc + (entrega?.valor || 0);
    }, 0);
  }, [entregas, localSelectedIds]);

  const handleToggle = (id: string) => {
    setLocalSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    onConfirm(localSelectedIds);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Incluir Entregas</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 py-3">
          <SearchOutlined className="h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Buscar por PV, NF ou cliente..."
            className="flex-1"
          />
        </div>

        <div className="flex-1 overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[48px]">Sel.</TableHead>
                <TableHead>PV / NF</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>UF</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Buscando entregas...
                  </TableCell>
                </TableRow>
              ) : entregas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    {searchTerm.trim()
                      ? 'Nenhuma entrega encontrada para esta busca.'
                      : 'Digite PV, NF ou cliente para buscar entregas.'}
                  </TableCell>
                </TableRow>
              ) : (
                entregas.map((entrega) => (
                  <TableRow key={entrega.id} className="hover:bg-muted/40">
                    <TableCell>
                      <Checkbox
                        checked={localSelectedIds.includes(entrega.id)}
                        onCheckedChange={() => handleToggle(entrega.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {entrega.pv_foco || entrega.nota_fiscal || 'Sem PV/NF'}
                    </TableCell>
                    <TableCell>{entrega.cliente || 'Cliente não informado'}</TableCell>
                    <TableCell>{entrega.uf || '-'}</TableCell>
                    <TableCell>{formatDate(entrega.data_saida)}</TableCell>
                    <TableCell className="text-right">
                      {(entrega.valor || 0).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between border-t pt-4 mt-2">
          <div className="text-sm font-medium">
            Selecionadas: {localSelectedIds.length} | Total:{' '}
            <span className="text-emerald-600">
              {totalSelecionado.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm}>Confirmar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
