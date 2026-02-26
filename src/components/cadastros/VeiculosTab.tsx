import { useState } from 'react';
import { AddOutlined as Plus, DirectionsCarOutlined as Car, CancelOutlined as XCircle } from '@mui/icons-material';
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
import { useVeiculos, useToggleVeiculoAtivo } from '@/hooks/useVeiculos';
import { VeiculoFormModal } from './VeiculoFormModal';
import { Veiculo } from '@/types/veiculo';
import { cn } from '@/lib/utils';

export function VeiculosTab() {
  const [showInactive, setShowInactive] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedVeiculo, setSelectedVeiculo] = useState<Veiculo | null>(null);
  
  const { data: veiculos = [], isLoading } = useVeiculos(true);
  const toggleAtivo = useToggleVeiculoAtivo();

  const filteredVeiculos = showInactive 
    ? veiculos 
    : veiculos.filter(v => v.ativo);

  const handleOpenForm = (veiculo?: Veiculo) => {
    setSelectedVeiculo(veiculo || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedVeiculo(null);
  };

  const handleToggleAtivo = (veiculo: Veiculo) => {
    toggleAtivo.mutate({ id: veiculo.id, ativo: !veiculo.ativo });
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
        <CardTitle className="text-foreground">Veículos</CardTitle>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={showInactive}
              onCheckedChange={setShowInactive}
              id="show-inactive-veiculos"
            />
            <label htmlFor="show-inactive-veiculos" className="text-sm text-muted-foreground">
              Mostrar inativos
            </label>
          </div>
          <Button onClick={() => handleOpenForm()} className="bg-green-600 hover:bg-green-700 gap-2">
            <Plus className="h-4 w-4" />
            Novo Veículo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredVeiculos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum veículo cadastrado.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-muted/50">
                <TableHead className="text-muted-foreground">Placa</TableHead>
                <TableHead className="text-muted-foreground">Fabricante</TableHead>
                <TableHead className="text-muted-foreground">Modelo</TableHead>
                <TableHead className="text-muted-foreground">Tipo</TableHead>
                <TableHead className="text-muted-foreground">Ano</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVeiculos.map((veiculo) => (
                <TableRow 
                  key={veiculo.id} 
                  className={cn(
                    "border-border hover:bg-muted/50",
                    !veiculo.ativo && "opacity-50"
                  )}
                >
                  <TableCell className="font-medium text-foreground uppercase">
                    {veiculo.placa}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {veiculo.fabricante || '-'}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {veiculo.modelo || '-'}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {veiculo.tipo || '-'}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {veiculo.ano || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={veiculo.ativo ? "default" : "secondary"}>
                      {veiculo.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenForm(veiculo)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAtivo(veiculo)}
                        className={cn(
                          veiculo.ativo 
                            ? "text-destructive hover:text-destructive" 
                            : "text-green-500 hover:text-green-600"
                        )}
                      >
                        {veiculo.ativo ? (
                          <>
                            <XCircle className="h-4 w-4 mr-1" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Car className="h-4 w-4 mr-1" />
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

      <VeiculoFormModal
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        veiculo={selectedVeiculo}
      />
    </Card>
  );
}
