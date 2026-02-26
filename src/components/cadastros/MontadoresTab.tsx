import { useState } from 'react';
import { AddOutlined as Plus, BuildOutlined as Wrench, PersonRemoveOutlined as UserX, PersonAddOutlined as UserCheck } from '@mui/icons-material';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useMontadores, useToggleMontadorAtivo } from '@/hooks/useMontadores';
import { useMotoristas } from '@/hooks/useMotoristas';
import { MontadorFormModal } from './MontadorFormModal';
import { Montador } from '@/types/montador';
import { cn } from '@/lib/utils';

export function MontadoresTab() {
  const [showInactive, setShowInactive] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMontador, setSelectedMontador] = useState<Montador | null>(null);
  
  const { data: montadores = [], isLoading } = useMontadores(true);
  const { data: motoristas = [] } = useMotoristas(true);
  const toggleAtivo = useToggleMontadorAtivo();

  // Função auxiliar para verificar se montador também é motorista
  const montadorTambemMotorista = (nome: string): boolean => {
    const nomeLower = nome.toLowerCase().trim();
    return motoristas.some(m => m.nome.toLowerCase().trim() === nomeLower && m.ativo);
  };

  const filteredMontadores = showInactive 
    ? montadores 
    : montadores.filter(m => m.ativo);

  const handleOpenForm = (montador?: Montador) => {
    setSelectedMontador(montador || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedMontador(null);
  };

  const handleToggleAtivo = (montador: Montador) => {
    toggleAtivo.mutate({ id: montador.id, ativo: !montador.ativo });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-foreground">Montadores</CardTitle>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={showInactive}
              onCheckedChange={setShowInactive}
              id="show-inactive-montadores"
            />
            <label htmlFor="show-inactive-montadores" className="text-sm text-muted-foreground">
              Mostrar inativos
            </label>
          </div>
          <Button onClick={() => handleOpenForm()} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Montador
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredMontadores.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum montador cadastrado.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-muted/50">
                <TableHead className="text-muted-foreground">Nome</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMontadores.map((montador) => (
                <TableRow 
                  key={montador.id} 
                  className={cn(
                    "border-border hover:bg-muted/50",
                    !montador.ativo && "opacity-50"
                  )}
                >
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <span>{montador.nome}</span>
                      {montadorTambemMotorista(montador.nome) && (
                        <Badge variant="outline" className="text-xs border-blue-500 text-blue-500">
                          também motorista
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={montador.ativo ? "default" : "secondary"}>
                      {montador.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenForm(montador)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAtivo(montador)}
                        className={cn(
                          montador.ativo 
                            ? "text-destructive hover:text-destructive" 
                            : "text-green-500 hover:text-green-600"
                        )}
                      >
                        {montador.ativo ? (
                          <>
                            <UserX className="h-4 w-4 mr-1" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-1" />
                            Reativar
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <MontadorFormModal
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        montador={selectedMontador}
      />
    </Card>
  );
}
