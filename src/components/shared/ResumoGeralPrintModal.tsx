import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Print as Printer } from '@mui/icons-material';
import { format } from 'date-fns';

const MESES = [
  { value: '0', label: 'Janeiro' },
  { value: '1', label: 'Fevereiro' },
  { value: '2', label: 'Março' },
  { value: '3', label: 'Abril' },
  { value: '4', label: 'Maio' },
  { value: '5', label: 'Junho' },
  { value: '6', label: 'Julho' },
  { value: '7', label: 'Agosto' },
  { value: '8', label: 'Setembro' },
  { value: '9', label: 'Outubro' },
  { value: '10', label: 'Novembro' },
  { value: '11', label: 'Dezembro' },
];

interface ResumoGeralPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string;
  selectedYear: string;
  metricasSelecionadas: string[];
  valorExpedidoMes: number;
  custoManutencaoGeralMes: number;
  custoAbastecimentoGeralMes: number;
  margemOperacional: number;
  kmRodadoPorVeiculo: Array<{ placa: string; kmRodado: number; kmInicial: number; kmFinal: number }>;
  entregasPorVeiculo: Array<{ carro: string; qtd: number; valor: number }>;
  entregasPorUF: Array<{ uf: string; qtd: number; valor: number }>;
  custoAbastecimentoPorVeiculo: Array<{ placa: string; custo: number; litros: number }>;
  custoManutencaoPorVeiculo: Array<{ placa: string; custo: number; qtd: number }>;
  custoCombustivelPorEstado: Array<{ estado: string; totalValor: number; totalLitros: number; qtd: number; mediaPreco: number }>;
  statusCounts: Record<string, number>;
  totalEntregas: number;
}

export function ResumoGeralPrintModal({
  isOpen,
  onClose,
  selectedMonth,
  selectedYear,
  metricasSelecionadas,
  valorExpedidoMes,
  custoManutencaoGeralMes,
  custoAbastecimentoGeralMes,
  margemOperacional,
  kmRodadoPorVeiculo,
  entregasPorVeiculo,
  entregasPorUF,
  custoAbastecimentoPorVeiculo,
  custoManutencaoPorVeiculo,
  custoCombustivelPorEstado,
  statusCounts,
  totalEntregas,
}: ResumoGeralPrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Resumo_Geral_${MESES[parseInt(selectedMonth)]?.label}_${selectedYear}`,
  });

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const mesLabel = MESES[parseInt(selectedMonth)]?.label || '';

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'PENDENTE': '#eab308',
      'EM ROTA': '#3b82f6',
      'CONCLUIDO': '#22c55e',
      'ENTREGUE': '#10b981',
      'EM MONTAGEM': '#a855f7',
      'AGUARDANDO MONTAGEM': '#f97316',
      'MONTAGEM PARCIAL': '#ec4899',
    };
    return colors[status] || '#6b7280';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span>Visualizar / Imprimir Resumo Geral</span>
            <Button onClick={handlePrint} className="gap-2">
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
                  Resumo Geral
                </h1>
                <div className="mt-2 text-sm">
                  <p className="font-bold">Flexibase Indústria e Comércio de Móveis</p>
                  <p>Rua 13 c/ Av 01 Qd. 10 Lt. 19/24 CEP 74987-750</p>
                  <p>Apda de Goiânia - GO</p>
                  <p>Fone (062) 3625-5222</p>
                </div>
              </div>
            </div>

            {/* Informações do Relatório */}
            <div className="mb-6 text-sm space-y-1 border-b border-gray-300 pb-4">
              <p><strong>Período:</strong> {mesLabel} de {selectedYear}</p>
              <p><strong>Data de Geração:</strong> {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
              <p><strong>Métricas Incluídas:</strong> {metricasSelecionadas.length} de 8</p>
            </div>

            {/* KPIs Principais - Valor Expedido x Custo */}
            {metricasSelecionadas.includes('valor-expedido') && (
              <div className="mb-6 page-break-inside-avoid">
                <h2 className="text-lg font-bold mb-3 border-b border-black pb-2">
                  Valor Expedido x Custos
                </h2>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="border border-black p-3">
                    <p className="text-xs text-gray-600 mb-1">Valor Expedido</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(valorExpedidoMes)}</p>
                  </div>
                  <div className="border border-black p-3">
                    <p className="text-xs text-gray-600 mb-1">Custos (Manutenção + Abastecimento)</p>
                    <p className="text-xl font-bold text-orange-600">
                      {formatCurrency(custoManutencaoGeralMes + custoAbastecimentoGeralMes)}
                    </p>
                  </div>
                  <div className="border border-black p-3">
                    <p className="text-xs text-gray-600 mb-1">Margem Operacional</p>
                    <p className={`text-xl font-bold ${margemOperacional >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(margemOperacional)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* KM Rodado por Veículo */}
            {metricasSelecionadas.includes('km-rodado') && (
              <div className="mb-6 page-break-inside-avoid">
                <h2 className="text-lg font-bold mb-3 border-b border-black pb-2">
                  KM Rodado por Veículo
                </h2>
                {kmRodadoPorVeiculo.length > 0 ? (
                  <table className="w-full border-collapse border border-black text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black px-3 py-2 text-left font-bold">Veículo</th>
                        <th className="border border-black px-3 py-2 text-right font-bold">KM Inicial</th>
                        <th className="border border-black px-3 py-2 text-right font-bold">KM Final</th>
                        <th className="border border-black px-3 py-2 text-right font-bold">KM Rodado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kmRodadoPorVeiculo.map((item, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-black px-3 py-2 font-medium">{item.placa}</td>
                          <td className="border border-black px-3 py-2 text-right">{formatNumber(item.kmInicial)} km</td>
                          <td className="border border-black px-3 py-2 text-right">{formatNumber(item.kmFinal)} km</td>
                          <td className="border border-black px-3 py-2 text-right font-bold">{formatNumber(item.kmRodado)} km</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 italic">Nenhum dado de KM no período (necessário ao menos 2 abastecimentos por veículo)</p>
                )}
              </div>
            )}

            {/* Entregas por Veículo */}
            {metricasSelecionadas.includes('entregas-veiculo') && (
              <div className="mb-6 page-break-inside-avoid">
                <h2 className="text-lg font-bold mb-3 border-b border-black pb-2">
                  Entregas por Veículo
                </h2>
                {entregasPorVeiculo.length > 0 ? (
                  <table className="w-full border-collapse border border-black text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black px-3 py-2 text-left font-bold">Veículo</th>
                        <th className="border border-black px-3 py-2 text-center font-bold">Qtd. Entregas</th>
                        <th className="border border-black px-3 py-2 text-right font-bold">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entregasPorVeiculo.map((item, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-black px-3 py-2 font-medium">{item.carro}</td>
                          <td className="border border-black px-3 py-2 text-center">{item.qtd}</td>
                          <td className="border border-black px-3 py-2 text-right font-semibold text-green-600">
                            {formatCurrency(item.valor)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 italic">Nenhuma entrega no período selecionado</p>
                )}
              </div>
            )}

            {/* Entregas por UF */}
            {metricasSelecionadas.includes('entregas-uf') && (
              <div className="mb-6 page-break-inside-avoid">
                <h2 className="text-lg font-bold mb-3 border-b border-black pb-2">
                  Entregas por UF
                </h2>
                {entregasPorUF.length > 0 ? (
                  <table className="w-full border-collapse border border-black text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black px-3 py-2 text-left font-bold">UF</th>
                        <th className="border border-black px-3 py-2 text-center font-bold">Qtd. Entregas</th>
                        <th className="border border-black px-3 py-2 text-right font-bold">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entregasPorUF.map((item, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-black px-3 py-2 font-medium">{item.uf}</td>
                          <td className="border border-black px-3 py-2 text-center">{item.qtd}</td>
                          <td className="border border-black px-3 py-2 text-right font-semibold text-green-600">
                            {formatCurrency(item.valor)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 italic">Nenhuma entrega no período selecionado</p>
                )}
              </div>
            )}

            {/* Custo Abastecimento por Veículo */}
            {metricasSelecionadas.includes('custo-abastecimento') && (
              <div className="mb-6 page-break-inside-avoid">
                <h2 className="text-lg font-bold mb-3 border-b border-black pb-2">
                  Custo de Abastecimento por Veículo
                </h2>
                {custoAbastecimentoPorVeiculo.length > 0 ? (
                  <table className="w-full border-collapse border border-black text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black px-3 py-2 text-left font-bold">Veículo</th>
                        <th className="border border-black px-3 py-2 text-center font-bold">Litros</th>
                        <th className="border border-black px-3 py-2 text-right font-bold">Custo Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {custoAbastecimentoPorVeiculo.map((item, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-black px-3 py-2 font-medium">{item.placa}</td>
                          <td className="border border-black px-3 py-2 text-center">{formatNumber(item.litros)} L</td>
                          <td className="border border-black px-3 py-2 text-right font-semibold text-orange-600">
                            {formatCurrency(item.custo)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 italic">Nenhum abastecimento no período selecionado</p>
                )}
              </div>
            )}

            {/* Custo Manutenção por Veículo */}
            {metricasSelecionadas.includes('custo-manutencao') && (
              <div className="mb-6 page-break-inside-avoid">
                <h2 className="text-lg font-bold mb-3 border-b border-black pb-2">
                  Custo de Manutenção por Veículo
                </h2>
                {custoManutencaoPorVeiculo.length > 0 ? (
                  <table className="w-full border-collapse border border-black text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black px-3 py-2 text-left font-bold">Veículo</th>
                        <th className="border border-black px-3 py-2 text-center font-bold">Qtd. Serviços</th>
                        <th className="border border-black px-3 py-2 text-right font-bold">Custo Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {custoManutencaoPorVeiculo.map((item, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-black px-3 py-2 font-medium">{item.placa}</td>
                          <td className="border border-black px-3 py-2 text-center">{item.qtd}</td>
                          <td className="border border-black px-3 py-2 text-right font-semibold text-red-600">
                            {formatCurrency(item.custo)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 italic">Nenhuma manutenção no período selecionado</p>
                )}
              </div>
            )}

            {/* Combustível por Estado */}
            {metricasSelecionadas.includes('combustivel-estado') && (
              <div className="mb-6 page-break-inside-avoid">
                <h2 className="text-lg font-bold mb-3 border-b border-black pb-2">
                  Média de Combustível por Estado
                </h2>
                {custoCombustivelPorEstado.length > 0 ? (
                  <table className="w-full border-collapse border border-black text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black px-3 py-2 text-left font-bold">Estado</th>
                        <th className="border border-black px-3 py-2 text-center font-bold">Abastecimentos</th>
                        <th className="border border-black px-3 py-2 text-center font-bold">Total Litros</th>
                        <th className="border border-black px-3 py-2 text-right font-bold">Média R$/L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {custoCombustivelPorEstado.map((item, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-black px-3 py-2 font-medium">{item.estado}</td>
                          <td className="border border-black px-3 py-2 text-center">{item.qtd}</td>
                          <td className="border border-black px-3 py-2 text-center">{formatNumber(item.totalLitros)} L</td>
                          <td className="border border-black px-3 py-2 text-right font-semibold text-blue-600">
                            {formatCurrency(item.mediaPreco)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 italic">Nenhum abastecimento no período selecionado</p>
                )}
              </div>
            )}

            {/* Controle de Status */}
            {metricasSelecionadas.includes('controle-status') && (
              <div className="mb-6 page-break-inside-avoid">
                <h2 className="text-lg font-bold mb-3 border-b border-black pb-2">
                  Controle de Status - Pedidos do Período
                </h2>
                <div className="mb-4">
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(statusCounts).map(([status, count]) => (
                      <div key={status} className="flex items-center gap-2 border border-black p-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: getStatusColor(status) }}
                        />
                        <span className="text-sm flex-1">{status}</span>
                        <span className="text-sm font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-black pt-2">
                  <p className="text-sm">
                    <strong>Total de pedidos no período:</strong> {totalEntregas}
                  </p>
                </div>
              </div>
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

