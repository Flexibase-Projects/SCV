import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { solidCard } from '@/lib/cardStyles';
import { VirtualDataTable, VIRTUAL_SCROLL_MAX_HEIGHT } from '@/components/shared/VirtualDataTable';
import { getAcertoColumns } from './acertoViagemColumns';
import { useDeleteAcertoViagem } from '@/hooks/useAcertosViagem';
import { DeleteAcertoOptionsDialog } from './DeleteAcertoOptionsDialog';
import type { AcertoViagem } from '@/types/acertoViagem';

const ACERTO_TABLE_MIN_WIDTH = 1180;

interface AcertoViagemTableProps {
  acertos: AcertoViagem[];
  isLoading: boolean;
  onEdit: (acerto: AcertoViagem) => void;
  onPrint: (acerto: AcertoViagem) => void;
  onRowClick?: (acerto: AcertoViagem) => void;
}

export function AcertoViagemTable({ acertos, isLoading, onEdit, onPrint, onRowClick }: AcertoViagemTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteAcerto = useDeleteAcertoViagem();

  const handleDelete = (cleanupMode: 'keep' | 'zero') => {
    if (!deleteId) return;
    deleteAcerto.mutate(
      { id: deleteId, cleanupMode },
      {
        onSuccess: () => setDeleteId(null),
      }
    );
  };

  if (isLoading) {
    return (
      <Card className={`${solidCard} rounded-2xl overflow-hidden`}>
        <CardContent className="p-0">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (acertos.length === 0) {
    return (
      <Card className={`${solidCard} rounded-2xl overflow-hidden`}>
        <CardContent className="p-0">
          <div className="flex items-center justify-center h-32 text-muted-foreground text-xs">
            Nenhum acerto de viagem encontrado.
          </div>
        </CardContent>
      </Card>
    );
  }

  const columns = getAcertoColumns(onEdit, onPrint, setDeleteId);

  return (
    <>
      <Card className={`${solidCard} rounded-2xl overflow-hidden`}>
        <CardContent className="p-0">
          <VirtualDataTable<AcertoViagem>
            data={acertos}
            columns={columns}
            getRowId={(acerto) => acerto.id}
            maxHeight={VIRTUAL_SCROLL_MAX_HEIGHT}
            minTableWidth={ACERTO_TABLE_MIN_WIDTH}
            onRowClick={onRowClick}
          />
        </CardContent>
      </Card>

      <DeleteAcertoOptionsDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        onDeleteKeep={() => handleDelete('keep')}
        onDeleteZero={() => handleDelete('zero')}
        isLoading={deleteAcerto.isPending}
      />
    </>
  );
}

