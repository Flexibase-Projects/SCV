import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { SearchOutlined, LocalGasStationOutlined as Fuel } from '@mui/icons-material';
import { formatDateLocal } from '@/utils/dateUtils';

interface Abastecimento {
  id: string;
  data: string;
  valor_total: number;
  posto: string;
  litros: number;
}

interface AbastecimentoSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  abastecimentos: Abastecimento[];
  selectedIds: string[];
  onConfirm: (ids: string[]) => void;
  motoristaNome?: string | null;
}

export function AbastecimentoSelectionModal({
  isOpen,
  onClose,
  abastecimentos,
  selectedIds,
  onConfirm,
  motoristaNome,
}: AbastecimentoSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedIds);

  // Sincronizar seleção local quando o modal abre ou selectedIds muda
  // (Idealmente faríamos isso num useEffect se o modal não fosse desmontado, 
  // mas aqui vamos inicializar apenas quando o modal for montado/aberto)
  // Como é controlado externamente, melhor usar useEffect ou setar no botão de abrir.
  // Vamos assumir que selectedIds vem atualizado.
  
  // Bug fix: Se selectedIds mudar fora, queremos refletir aqui? Sim.
  // Mas se o usuário estiver editando, não queremos sobrescrever. 
  // Vamos usar um useEffect que atualiza localSelectedIds apenas quando o modal ABRE.
  
  useMemo(() => {
    if (isOpen) {
      setLocalSelectedIds(selectedIds);
    }
  }, [isOpen, selectedIds]);

  const filteredAbastecimentos = abastecimentos.filter((a) =>
    a.posto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.data && formatDateLocal(a.data)?.includes(searchTerm))
  );

  const handleToggle = (id: string) => {
    setLocalSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (localSelectedIds.length === filteredAbastecimentos.length && filteredAbastecimentos.length > 0) {
        // Desmarcar todos os filtrados
        const filteredIds = new Set(filteredAbastecimentos.map(a => a.id));
        setLocalSelectedIds(prev => prev.filter(id => !filteredIds.has(id)));
    } else {
        // Marcar todos os filtrados
        const newIds = new Set(localSelectedIds);
        filteredAbastecimentos.forEach(a => newIds.add(a.id));
        setLocalSelectedIds(Array.from(newIds));
    }
  };
  
  const isAllSelected = filteredAbastecimentos.length > 0 && filteredAbastecimentos.every(a => localSelectedIds.includes(a.id));

  const handleConfirm = () => {
    onConfirm(localSelectedIds);
    onClose();
  };

  const totalSelecionado = localSelectedIds.reduce((acc, id) => {
      const abs = abastecimentos.find(a => a.id === id);
      return acc + (abs?.valor_total || 0);
  }, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Selecionar Abastecimentos
            {motoristaNome && (
              <span className="text-sm font-normal text-muted-foreground">
                - {motoristaNome}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 py-4">
          <SearchOutlined className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por posto ou data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>

        <div className="flex-1 overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox 
                    checked={isAllSelected}
                    onCheckedChange={handleToggleAll}
                  />
                </TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Posto</TableHead>
                <TableHead className="text-right">Litros</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAbastecimentos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    {searchTerm.trim() 
                      ? 'Nenhum abastecimento encontrado com o termo buscado.'
                      : motoristaNome
                        ? `Nenhum abastecimento encontrado para ${motoristaNome}.`
                        : 'Nenhum abastecimento disponível.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAbastecimentos.map((abastecimento) => (
                  <TableRow key={abastecimento.id}>
                    <TableCell>
                      <Checkbox
                        checked={localSelectedIds.includes(abastecimento.id)}
                        onCheckedChange={() => handleToggle(abastecimento.id)}
                      />
                    </TableCell>
                    <TableCell>
                      {abastecimento.data ? format(new Date(abastecimento.data + 'T12:00:00'), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell>{abastecimento.posto}</TableCell>
                    <TableCell className="text-right">
                      {abastecimento.litros?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} L
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {abastecimento.valor_total?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between border-t pt-4 mt-2">
            <div className="text-sm font-medium">
                Total Selecionado: <span className="text-green-600">{totalSelecionado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
                Cancelar
            </Button>
            <Button onClick={handleConfirm}>
                Confirmar Seleção ({localSelectedIds.length})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
