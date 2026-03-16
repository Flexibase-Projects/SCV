import { useState } from 'react';
import { AddOutlined as Plus, EditOutlined as Edit, DeleteOutlined as Trash } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTiposServicoMontagem, useDeleteTipoServicoMontagem } from '@/hooks/useTiposServicoMontagem';
import { TipoServicoFormModal } from './TipoServicoFormModal';
import { TipoServicoMontagem } from '@/types/tipoServicoMontagem';

export function TiposServicoTab() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<TipoServicoMontagem | null>(null);
  const [tipoParaExcluir, setTipoParaExcluir] = useState<TipoServicoMontagem | null>(null);

  const { data: tipos = [], isLoading } = useTiposServicoMontagem();
  const deleteTipo = useDeleteTipoServicoMontagem();

  const handleOpenForm = (tipo?: TipoServicoMontagem) => {
    setSelectedTipo(tipo || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedTipo(null);
  };

  const handleConfirmDelete = () => {
    if (tipoParaExcluir) {
      deleteTipo.mutate(tipoParaExcluir.id, {
        onSuccess: () => setTipoParaExcluir(null),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Tipos de Serviço de Montagem</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Define o percentual aplicado sobre o valor do pedido para calcular a produtividade.
            </p>
          </div>
          <Button onClick={() => handleOpenForm()} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Tipo
          </Button>
        </CardHeader>
        <CardContent>
          {tipos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum tipo de serviço cadastrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-muted/50">
                  <TableHead className="text-muted-foreground">Nome</TableHead>
                  <TableHead className="text-muted-foreground">Percentual</TableHead>
                  <TableHead className="text-muted-foreground text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tipos.map((tipo) => (
                  <TableRow key={tipo.id} className="border-border hover:bg-muted/50">
                    <TableCell className="font-medium text-foreground">{tipo.nome}</TableCell>
                    <TableCell className="text-foreground">
                      {tipo.percentual.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })}%
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenForm(tipo)}
                          className="text-muted-foreground hover:text-foreground gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTipoParaExcluir(tipo)}
                          className="text-destructive hover:text-destructive gap-1"
                        >
                          <Trash className="h-4 w-4" />
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <TipoServicoFormModal
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        tipoServico={selectedTipo}
      />

      <AlertDialog open={!!tipoParaExcluir} onOpenChange={(open) => !open && setTipoParaExcluir(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Excluir Tipo de Serviço</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o tipo <strong>{tipoParaExcluir?.nome}</strong>? Esta ação não pode ser desfeita.
              Entregas que utilizam este tipo de serviço perderão a referência.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
