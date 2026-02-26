import { useRef, useMemo } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PrintOutlined as Printer } from '@mui/icons-material';
import { format } from 'date-fns';
import type { Entrega } from '@/types/entrega';
import { ENTREGAS_PRINT_COLUMNS } from '@/components/dashboard/entregasPrintColumns';

const MESES: Record<string, string> = {
  '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
  '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
  '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
};

function groupByMonth(entregas: Entrega[]): { monthKey: string; label: string; rows: Entrega[] }[] {
  const byMonth = new Map<string, Entrega[]>();
  for (const e of entregas) {
    const ds = e.data_saida;
    if (!ds || !/^\d{4}-\d{2}/.test(ds)) continue;
    const key = ds.slice(0, 7);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(e);
  }
  const sorted = Array.from(byMonth.entries()).sort(([a], [b]) => a.localeCompare(b));
  return sorted.map(([monthKey]) => {
    const [year, month] = monthKey.split('-');
    const label = `${MESES[month] || month} ${year}`;
    return { monthKey, label, rows: byMonth.get(monthKey)! };
  });
}

interface EntregasAnoPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  entregas: Entrega[];
  isLoading: boolean;
}

export function EntregasAnoPrintModal({
  isOpen,
  onClose,
  year,
  entregas,
  isLoading,
}: EntregasAnoPrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Entregas_${year}_${format(new Date(), 'yyyy-MM-dd')}`,
  });

  const groups = useMemo(() => groupByMonth(entregas), [entregas]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 rounded-xl">
        <DialogHeader className="p-6 pb-4 pr-12 border-b shrink-0">
          <DialogTitle className="flex items-center justify-between gap-4">
            <span className="min-w-0 truncate">Relatório de Entregas {year}</span>
            {!isLoading && entregas.length > 0 && (
              <Button onClick={handlePrint} className="gap-2 rounded-xl shrink-0">
                <Printer className="h-4 w-4" />
                Imprimir / PDF
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-500">
              Carregando entregas de {year}...
            </div>
          ) : (
            <div
              ref={printRef}
              className="bg-white text-black p-8 print:p-6"
              style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
            >
              <div className="flex items-start gap-4 border-b-2 border-black pb-4 mb-4">
                <div className="shrink-0">
                  <img
                    src="/logo-flexibase.svg"
                    alt="Flexibase"
                    className="w-[170px] h-auto"
                  />
                </div>
                <div className="flex-1 text-center">
                  <h1 className="text-xl font-bold tracking-wide uppercase">
                    Entregas {year}
                  </h1>
                  <p className="text-sm mt-1 text-gray-600">Relatório anual por data de saída</p>
                  <div className="mt-2 text-sm">
                    <p className="font-bold">Flexibase Indústria e Comércio de Móveis</p>
                    <p>Rua 13 c/ Av 01 Qd. 10 Lt. 19/24 CEP 74987-750</p>
                    <p>Apda de Goiânia - GO</p>
                    <p>Fone (062) 3625-5222</p>
                  </div>
                </div>
              </div>

              <div className="mb-4 text-sm space-y-1">
                <p><strong>Data de Geração:</strong> {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
                <p><strong>Total de Registros:</strong> {entregas.length}</p>
                <p><strong>Ano:</strong> {year} (por data de saída)</p>
              </div>

              {entregas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma entrega encontrada para o ano {year}.
                </div>
              ) : (
                groups.map(({ label, rows }) => (
                  <div key={label} className="mb-8 break-inside-avoid">
                    <h2 className="text-base font-bold border-b border-black pb-2 mb-2 mt-4">
                      {label}
                    </h2>
                    <table className="w-full border-collapse border border-black text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          {ENTREGAS_PRINT_COLUMNS.map((col) => (
                            <th
                              key={col.key}
                              className={`border border-black px-3 py-2 text-left font-bold ${col.className || ''}`}
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, index) => (
                          <tr key={row.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {ENTREGAS_PRINT_COLUMNS.map((col) => {
                              const value = row[col.key as keyof Entrega];
                              const displayValue = col.render
                                ? col.render(value, row)
                                : value !== null && value !== undefined
                                  ? String(value)
                                  : '-';
                              return (
                                <td
                                  key={col.key}
                                  className={`border border-black px-3 py-2 ${col.className || ''}`}
                                >
                                  {displayValue}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              )}

              <div className="mt-6 pt-4 border-t border-black text-xs text-center text-gray-600">
                <p>Relatório gerado automaticamente pelo Sistema de Controle de Veículos (SCV)</p>
                <p className="mt-1">Entregas {year} — por data de saída</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
