import { Card, CardContent } from '@/components/ui/card';
import { solidCard } from '@/lib/cardStyles';
import { VirtualDataTable, VIRTUAL_SCROLL_MAX_HEIGHT } from '@/components/shared/VirtualDataTable';
import { getAbastecimentoColumns } from './abastecimentoColumns';
import type { Abastecimento } from '@/types/abastecimento';

const ABASTECIMENTO_TABLE_MIN_WIDTH = 1570;

interface AbastecimentoTableProps {
  abastecimentos: Abastecimento[];
  onEdit: (abastecimento: Abastecimento) => void;
  onDelete: (abastecimento: Abastecimento) => void;
  isLoading: boolean;
}

export function AbastecimentoTable({
  abastecimentos,
  onEdit,
  onDelete,
  isLoading,
}: AbastecimentoTableProps) {
  if (isLoading) {
    return (
      <Card className={`${solidCard} rounded-2xl overflow-hidden`}>
        <CardContent className="text-center py-8 text-muted-foreground">
          Carregando...
        </CardContent>
      </Card>
    );
  }

  if (abastecimentos.length === 0) {
    return (
      <Card className={`${solidCard} rounded-2xl overflow-hidden`}>
        <CardContent className="text-center py-8 text-muted-foreground">
          Nenhum abastecimento encontrado.
        </CardContent>
      </Card>
    );
  }

  const columns = getAbastecimentoColumns(onEdit, onDelete);

  return (
    <Card className={`${solidCard} rounded-2xl overflow-hidden w-full min-w-0`}>
      <CardContent className="p-0">
        <VirtualDataTable<Abastecimento>
          data={abastecimentos}
          columns={columns}
          getRowId={(r) => r.id}
          maxHeight={VIRTUAL_SCROLL_MAX_HEIGHT}
          minTableWidth={ABASTECIMENTO_TABLE_MIN_WIDTH}
        />
      </CardContent>
    </Card>
  );
}
