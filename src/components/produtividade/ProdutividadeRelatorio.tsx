import { BuildOutlined as Wrench, ExpandMoreOutlined as ChevronDown, ExpandLessOutlined as ChevronUp } from '@mui/icons-material';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MontadorProdutividadeItem } from '@/hooks/useProdutividade';
import { Entrega } from '@/types/entrega';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProdutividadeRelatorioProps {
  montadores: MontadorProdutividadeItem[];
  isLoading: boolean;
  periodLabel: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    return format(new Date(year, month - 1, day), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

function MontadorCard({ item }: { item: MontadorProdutividadeItem }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <Wrench className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-base text-foreground">{item.nome}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.totalMontagens} montagem{item.totalMontagens !== 1 ? 's' : ''} no período
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total produtividade</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(item.totalProdutividade)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(v => !v)}
              className="h-8 w-8 p-0 text-muted-foreground"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-muted/30 bg-muted/20">
                  <TableHead className="text-muted-foreground text-xs">Data Montagem</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Cliente</TableHead>
                  <TableHead className="text-muted-foreground text-xs">NF</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Valor Pedido</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Produtividade/Montador</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Montadores</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.montagens.map((entrega) => (
                  <MontagemRow key={entrega.id} entrega={entrega} montadorAtual={item.nome} />
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Total do montador:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                {formatCurrency(item.totalProdutividade)}
              </span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function MontagemRow({ entrega, montadorAtual }: { entrega: Entrega; montadorAtual: string }) {
  const montadores = [entrega.montador_1, entrega.montador_2].filter(Boolean);
  const numMontadores = montadores.length;

  return (
    <TableRow className="border-border hover:bg-muted/30">
      <TableCell className="text-sm text-foreground">
        {formatDate(entrega.data_montagem)}
      </TableCell>
      <TableCell className="text-sm font-medium text-foreground">
        {entrega.cliente || '—'}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {entrega.nf || '—'}
      </TableCell>
      <TableCell className="text-sm text-foreground">
        {entrega.valor != null ? formatCurrency(entrega.valor) : '—'}
      </TableCell>
      <TableCell className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
        {entrega.produtividade_por_montador != null
          ? formatCurrency(entrega.produtividade_por_montador)
          : <Badge variant="outline" className="border-amber-400 text-amber-600 text-xs">Sem cálculo</Badge>
        }
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {montadores.map((nome) => (
            <Badge
              key={nome}
              variant={nome === montadorAtual ? 'default' : 'secondary'}
              className={
                nome === montadorAtual
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 text-xs'
                  : 'text-xs'
              }
            >
              {nome}
            </Badge>
          ))}
          {numMontadores === 0 && (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function ProdutividadeRelatorio({
  montadores,
  isLoading,
  periodLabel,
}: ProdutividadeRelatorioProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (montadores.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Wrench className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-base font-semibold text-foreground mb-1">
            Nenhuma montagem concluída
          </h3>
          <p className="text-sm text-muted-foreground">
            {periodLabel === 'Todos os períodos'
              ? 'Você está vendo todo o período. Não há montagens concluídas com produtividade. Use Data inicial e Data final para filtrar.'
              : `Não há montagens concluídas com produtividade em ${periodLabel}.`}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {montadores.map((item) => (
        <MontadorCard key={item.nome} item={item} />
      ))}
    </div>
  );
}
