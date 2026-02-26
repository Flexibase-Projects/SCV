import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PrintOutlined as Printer } from '@mui/icons-material';
import { format } from 'date-fns';

export interface TableColumn<T = any> {
  key: string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

interface TablePrintModalProps<T = any> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: T[];
  columns: TableColumn<T>[];
  filters?: string;
  subtitle?: string;
}

export function TablePrintModal<T extends Record<string, any>>({
  isOpen,
  onClose,
  title,
  data,
  columns,
  filters,
  subtitle
}: TablePrintModalProps<T>) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${title}_${format(new Date(), 'yyyy-MM-dd')}`,
  });

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 rounded-xl">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span>Visualizar / Imprimir {title}</span>
            <Button onClick={handlePrint} className="gap-2 rounded-xl">
              <Printer className="h-4 w-4" />
              Imprimir / PDF
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div 
            ref={printRef} 
            className="bg-white text-black p-8 print:p-6"
            style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
          >
            {/* Cabeçalho */}
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
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm mt-1 text-gray-600">{subtitle}</p>
                )}
                <div className="mt-2 text-sm">
                  <p className="font-bold">Flexibase Indústria e Comércio de Móveis</p>
                  <p>Rua 13 c/ Av 01 Qd. 10 Lt. 19/24 CEP 74987-750</p>
                  <p>Apda de Goiânia - GO</p>
                  <p>Fone (062) 3625-5222</p>
                </div>
              </div>
            </div>

            {/* Informações do Relatório */}
            <div className="mb-4 text-sm space-y-1">
              <p><strong>Data de Geração:</strong> {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
              <p><strong>Total de Registros:</strong> {data.length}</p>
              {filters && (
                <p><strong>Filtros Aplicados:</strong> {filters}</p>
              )}
            </div>

            {/* Tabela */}
            {data.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum registro encontrado para impressão.
              </div>
            ) : (
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className={`border border-black px-3 py-2 text-left font-bold ${column.className || ''}`}
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {columns.map((column) => {
                        const value = row[column.key];
                        const displayValue = column.render 
                          ? column.render(value, row)
                          : value !== null && value !== undefined 
                            ? String(value)
                            : '-';
                        
                        return (
                          <td
                            key={column.key}
                            className={`border border-black px-3 py-2 ${column.className || ''}`}
                          >
                            {displayValue}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Rodapé */}
            <div className="mt-6 pt-4 border-t border-black text-xs text-center text-gray-600">
              <p>Relatório gerado automaticamente pelo Sistema de Controle de Veículos (SCV)</p>
              <p className="mt-1">Página 1 de 1</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

