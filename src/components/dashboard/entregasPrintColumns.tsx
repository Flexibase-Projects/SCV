import { format } from 'date-fns';
import type { TableColumn } from '@/components/shared/TablePrintModal';
import type { Entrega } from '@/types/entrega';
import { TIPO_TRANSPORTE_LABELS, STATUS_MONTAGEM_LABELS } from '@/types/entrega';

function formatDataSaidaOuMontagem(value: string | null | undefined): string {
  if (!value) return '-';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }
  return format(new Date(value + 'T12:00:00'), 'dd/MM/yyyy');
}

/** Colunas de impressão de entregas — uso em TablePrintModal e EntregasAnoPrintModal (valores iguais ao sistema) */
export const ENTREGAS_PRINT_COLUMNS: TableColumn<Entrega>[] = [
  { key: 'pv_foco', label: 'PV Foco' },
  { key: 'nf', label: 'NF' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'uf', label: 'UF' },
  {
    key: 'valor',
    label: 'Valor',
    render: (value) => value ? `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-',
    className: 'text-right'
  },
  { key: 'status', label: 'Status' },
  {
    key: 'data_saida',
    label: 'Data Saída',
    render: (value) => formatDataSaidaOuMontagem(value),
  },
  { key: 'motorista', label: 'Motorista' },
  { key: 'carro', label: 'Veículo' },
  {
    key: 'tipo_transporte',
    label: 'Tipo Transporte',
    render: (value) => (value && TIPO_TRANSPORTE_LABELS[value]) ? TIPO_TRANSPORTE_LABELS[value] : (value || '-')
  },
  {
    key: 'precisa_montagem',
    label: 'Precisa Montagem',
    render: (value) => value ? 'SIM' : 'NÃO'
  },
  {
    key: 'status_montagem',
    label: 'Status Montagem',
    render: (value) => (value && STATUS_MONTAGEM_LABELS[value as keyof typeof STATUS_MONTAGEM_LABELS]) ? STATUS_MONTAGEM_LABELS[value as keyof typeof STATUS_MONTAGEM_LABELS] : (value || '-')
  },
  {
    key: 'data_montagem',
    label: 'Data Montagem',
    render: (value) => formatDataSaidaOuMontagem(value),
  },
  { key: 'montador_1', label: 'Montador 1' },
  { key: 'montador_2', label: 'Montador 2' },
  {
    key: 'gastos_entrega',
    label: 'Gastos Entrega',
    render: (value) => value ? `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-',
    className: 'text-right'
  },
  {
    key: 'gastos_montagem',
    label: 'Gastos Montagem',
    render: (value) => value ? `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-',
    className: 'text-right'
  },
  {
    key: 'produtividade',
    label: 'Produtividade',
    render: (value) => value != null ? String(value) : '-'
  },
  {
    key: 'percentual_gastos',
    label: '% Gastos',
    render: (value) => value != null ? `${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%` : '-',
    className: 'text-right'
  },
  { key: 'erros', label: 'Erros' },
  { key: 'descricao_erros', label: 'Descrição dos Erros' },
];
