import { useState, useMemo } from 'react';
import { Add as Plus, PersonAdd as UserCheck, PersonRemove as UserX, WarningAmber as AlertTriangle, FilterList as Filter } from '@mui/icons-material';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useMotoristas, useToggleMotoristaAtivo } from '@/hooks/useMotoristas';
import { MotoristaFormModal } from './MotoristaFormModal';
import { Motorista, getStatusVencimento, getVencimentoToxicologico, StatusVencimento } from '@/types/motorista';
import { cn } from '@/lib/utils';

type FiltroVencimento = 'todos' | 'vencidos' | 'proximos' | 'ok';

export function MotoristasTab() {
  const [showInactive, setShowInactive] = useState(false);
  const [filtroVencimento, setFiltroVencimento] = useState<FiltroVencimento>('todos');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMotorista, setSelectedMotorista] = useState<Motorista | null>(null);
  
  const { data: motoristas = [], isLoading } = useMotoristas(true);
  const toggleAtivo = useToggleMotoristaAtivo();

  // Função auxiliar para obter badges de funções
  const getFuncoesBadges = (motorista: Motorista) => {
    const badges = [];
    if (motorista.eh_motorista) {
      badges.push(
        <Badge key="motorista" variant="default">
          Motorista / Condutor
        </Badge>
      );
    }
    if (motorista.eh_montador) {
      badges.push(
        <Badge key="montador" variant="outline" className="border-blue-500 text-blue-500">
          Montador
        </Badge>
      );
    }
    return badges;
  };

  // Função auxiliar para obter status de cada motorista
  const getMotoristaStatus = (m: Motorista) => {
    const statusCNH = getStatusVencimento(m.data_vencimento_cnh);
    const vencTox = getVencimentoToxicologico(m.data_exame_toxicologico);
    const statusTox = getStatusVencimento(vencTox);
    return { statusCNH, statusTox, vencTox };
  };

  const filteredMotoristas = useMemo(() => {
    let filtered = showInactive ? motoristas : motoristas.filter(m => m.ativo);
    
    if (filtroVencimento !== 'todos') {
      filtered = filtered.filter(m => {
        const { statusCNH, statusTox } = getMotoristaStatus(m);
        
        if (filtroVencimento === 'vencidos') {
          return statusCNH === 'vencido' || statusTox === 'vencido';
        }
        if (filtroVencimento === 'proximos') {
          return (statusCNH === 'proximo' || statusTox === 'proximo') && 
                 statusCNH !== 'vencido' && statusTox !== 'vencido';
        }
        if (filtroVencimento === 'ok') {
          return statusCNH === 'ok' && statusTox === 'ok';
        }
        return true;
      });
    }
    
    return filtered;
  }, [motoristas, showInactive, filtroVencimento]);

  // Contadores para os filtros
  const contadores = useMemo(() => {
    const ativos = motoristas.filter(m => m.ativo);
    let vencidos = 0, proximos = 0, ok = 0;
    
    ativos.forEach(m => {
      const { statusCNH, statusTox } = getMotoristaStatus(m);
      if (statusCNH === 'vencido' || statusTox === 'vencido') {
        vencidos++;
      } else if (statusCNH === 'proximo' || statusTox === 'proximo') {
        proximos++;
      } else {
        ok++;
      }
    });
    
    return { vencidos, proximos, ok };
  }, [motoristas]);

  const handleOpenForm = (motorista?: Motorista) => {
    setSelectedMotorista(motorista || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedMotorista(null);
  };

  const handleToggleAtivo = (motorista: Motorista) => {
    toggleAtivo.mutate({ id: motorista.id, ativo: !motorista.ativo });
  };

  const getStatusBadge = (status: StatusVencimento, label: string) => {
    if (status === 'vencido') {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          {label}
        </Badge>
      );
    }
    if (status === 'proximo') {
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-500 gap-1">
          <AlertTriangle className="h-3 w-3" />
          {label}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-green-500 text-green-500">
        {label}
      </Badge>
    );
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
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
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground">Motoristas e Condutores</CardTitle>
          <Button onClick={() => handleOpenForm()} className="bg-green-600 hover:bg-green-700 gap-2">
            <Plus className="h-4 w-4" />
            Novo Cadastro
          </Button>
        </div>
        
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={showInactive}
              onCheckedChange={setShowInactive}
              id="show-inactive"
            />
            <label htmlFor="show-inactive" className="text-sm text-muted-foreground">
              Mostrar inativos
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filtroVencimento} onValueChange={(v) => setFiltroVencimento(v as FiltroVencimento)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por vencimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="vencidos">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Vencidos ({contadores.vencidos})
                  </span>
                </SelectItem>
                <SelectItem value="proximos">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    Próximos 30 dias ({contadores.proximos})
                  </span>
                </SelectItem>
                <SelectItem value="ok">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Em dia ({contadores.ok})
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Indicadores de alerta */}
          {contadores.vencidos > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {contadores.vencidos} com documentação vencida
            </Badge>
          )}
          {contadores.proximos > 0 && (
            <Badge variant="outline" className="border-yellow-500 text-yellow-500 gap-1">
              <AlertTriangle className="h-3 w-3" />
              {contadores.proximos} próximos do vencimento
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {filteredMotoristas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum motorista ou condutor encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-muted/50">
                  <TableHead className="text-muted-foreground">Nome</TableHead>
                  <TableHead className="text-muted-foreground">Funções</TableHead>
                  <TableHead className="text-muted-foreground">CNH</TableHead>
                  <TableHead className="text-muted-foreground">Venc. CNH</TableHead>
                  <TableHead className="text-muted-foreground">Venc. Toxicológico</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMotoristas.map((motorista) => {
                  const { statusCNH, statusTox, vencTox } = getMotoristaStatus(motorista);
                  
                  return (
                    <TableRow 
                      key={motorista.id} 
                      className={cn(
                        "border-border hover:bg-muted/50",
                        !motorista.ativo && "opacity-50"
                      )}
                    >
                      <TableCell className="font-medium text-foreground">
                        {motorista.nome}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 flex-wrap">
                          {getFuncoesBadges(motorista)}
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">
                        <div className="flex flex-col">
                          <span>{motorista.numero_cnh || '-'}</span>
                          {motorista.categoria_cnh && (
                            <span className="text-xs text-muted-foreground">Cat. {motorista.categoria_cnh}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {motorista.data_vencimento_cnh ? (
                          getStatusBadge(statusCNH, formatDate(motorista.data_vencimento_cnh))
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {vencTox ? (
                          <div className="flex flex-col gap-1">
                            {getStatusBadge(statusTox, formatDate(vencTox))}
                            <span className="text-xs text-muted-foreground">
                              Exame: {formatDate(motorista.data_exame_toxicologico)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={motorista.ativo ? "default" : "secondary"}>
                          {motorista.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenForm(motorista)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleAtivo(motorista)}
                            className={cn(
                              motorista.ativo 
                                ? "text-destructive hover:text-destructive" 
                                : "text-green-500 hover:text-green-600"
                            )}
                          >
                            {motorista.ativo ? (
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
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <MotoristaFormModal
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        motorista={selectedMotorista}
      />
    </Card>
  );
}
