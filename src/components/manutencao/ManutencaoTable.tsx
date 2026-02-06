import { Card, CardContent } from '@/components/ui/card';
import { solidCard } from '@/lib/cardStyles';
import { VirtualDataTable, VIRTUAL_SCROLL_MAX_HEIGHT } from '@/components/shared/VirtualDataTable';
import { getManutencaoColumns } from './manutencaoColumns';
import type { Manutencao } from '@/types/manutencao';

const MANUTENCAO_TABLE_MIN_WIDTH = 1200;

interface ManutencaoTableProps {
  manutencoes: Manutencao[];
  onEdit: (manutencao: Manutencao) => void;
  onDelete: (manutencao: Manutencao) => void;
  isLoading: boolean;
}

export function ManutencaoTable({ manutencoes, onEdit, onDelete, isLoading }: ManutencaoTableProps) {
  if (isLoading) {
    return (
      <Card className={`${solidCard} rounded-2xl overflow-hidden`}>
        <CardContent className="text-center py-16 text-muted-foreground">
          Carregando manutenções...
        </CardContent>
      </Card>
    );
  }

  if (manutencoes.length === 0) {
    return (
      <Card className={`${solidCard} rounded-2xl overflow-hidden`}>
        <CardContent className="text-center py-16 text-muted-foreground">
          Nenhuma manutenção encontrada.
        </CardContent>
      </Card>
    );
  }

  const columns = getManutencaoColumns(onEdit, onDelete);

  return (
    <Card className={`${solidCard} rounded-2xl overflow-hidden`}>
      <CardContent className="p-0">
        <VirtualDataTable<Manutencao>
          data={manutencoes}
          columns={columns}
          getRowId={(m) => m.id}
          maxHeight={VIRTUAL_SCROLL_MAX_HEIGHT}
          minTableWidth={MANUTENCAO_TABLE_MIN_WIDTH}
        />
      </CardContent>
    </Card>
  );
}
