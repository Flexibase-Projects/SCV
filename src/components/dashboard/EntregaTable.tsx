import { Card, CardContent } from '@/components/ui/card';
import { solidCard } from '@/lib/cardStyles';
import { VirtualDataTable, VIRTUAL_SCROLL_MAX_HEIGHT } from '@/components/shared/VirtualDataTable';
import { getEntregaColumns, type EntregaSelectionProps } from './entregaColumns';
import type { Entrega } from '@/types/entrega';

const ENTREGA_TABLE_MIN_WIDTH = 1310;

interface EntregaTableProps {
  entregas: Entrega[];
  onEdit: (entrega: Entrega) => void;
  onDelete: (entrega: Entrega) => void;
  selection?: EntregaSelectionProps;
}

export function EntregaTable({ entregas, onEdit, onDelete, selection }: EntregaTableProps) {
  if (entregas.length === 0) {
    return (
      <Card className={`${solidCard} rounded-2xl overflow-hidden`}>
        <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
          Nenhuma entrega encontrada.
        </div>
      </Card>
    );
  }

  const columns = getEntregaColumns(onEdit, onDelete, selection);

  return (
    <Card className={`${solidCard} rounded-2xl overflow-hidden`}>
      <CardContent className="p-0">
        <VirtualDataTable<Entrega>
        data={entregas}
        columns={columns}
        getRowId={(e) => e.id}
        maxHeight={VIRTUAL_SCROLL_MAX_HEIGHT}
        minTableWidth={ENTREGA_TABLE_MIN_WIDTH}
        />
      </CardContent>
    </Card>
  );
}
