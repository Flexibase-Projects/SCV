import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Print as Printer, Download } from '@mui/icons-material';
import { useAcertoViagem } from '@/hooks/useAcertosViagem';
import { 
  calcularTotalDespesas, 
  calcularSaldo, 
  calcularDiasViagem,
  calcularKmRodado 
} from '@/types/acertoViagem';

interface AcertoViagemPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  acertoId: string | null;
}

export function AcertoViagemPrintModal({ isOpen, onClose, acertoId }: AcertoViagemPrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { data: acerto, isLoading } = useAcertoViagem(acertoId);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: acerto ? `Acerto_Viagem_${acerto.destino}_${acerto.data_saida}` : 'Acerto_Viagem',
  });

  if (!acertoId) return null;

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    const d = new Date(date);
    const diasSemana = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    const diaSemana = diasSemana[d.getUTCDay()];
    return `${diaSemana}, ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })}`;
  };

  const formatCurrency = (value: number | null | undefined) => {
    return `R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const getResponsavel = () => {
    if (acerto?.motorista_nome && acerto?.montador_nome) {
      return `${acerto.motorista_nome} / ${acerto.montador_nome}`;
    }
    return acerto?.motorista_nome || acerto?.montador_nome || '-';
  };

  const totalDespesas = acerto ? calcularTotalDespesas(acerto) : 0;
  const saldo = acerto ? calcularSaldo(acerto) : { valor: 0, tipo: 'devolver' as const };
  const dias = acerto ? calcularDiasViagem(acerto.data_saida, acerto.data_chegada) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span>Visualizar / Imprimir Acerto de Viagem</span>
            <Button onClick={() => handlePrint()} className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimir / PDF
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : acerto ? (
          <div 
            ref={printRef} 
            className="bg-white text-black p-8 print:p-6"
            style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
          >
            {/* Cabeçalho */}
            <div className="flex items-start gap-4 border-b-2 border-black pb-4 mb-4">
              <div className="shrink-0">
                <img
                  src="/logo-flexible.svg"
                  alt="Flexibase"
                  className="w-[170px] h-auto"
                />
              </div>
              <div className="flex-1 text-center">
                <h1 className="text-xl font-bold tracking-wide">
                  ACERTO DE VIAGEM - {getResponsavel().toUpperCase()}
                </h1>
                <div className="mt-2 text-sm">
                  <p className="font-bold">Flexibase Indústria e Comércio de Móveis</p>
                  <p>Rua 13 c/ Av 01 Qd. 10 Lt. 19/24 CEP 74987-750</p>
                  <p>Apda de Goiânia - GO</p>
                  <p>Fone (062) 3625-5222</p>
                </div>
              </div>
            </div>

            {/* Dados do Veículo */}
            <table className="w-full border-collapse mb-4 text-sm">
              <tbody>
                <tr>
                  <td className="border border-black px-2 py-1 bg-gray-100 font-bold w-24">Placa</td>
                  <td className="border border-black px-2 py-1">{acerto.veiculo_placa || '-'}</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 bg-gray-100 font-bold">Modelo</td>
                  <td className="border border-black px-2 py-1">{acerto.veiculo_modelo || '-'}</td>
                </tr>
              </tbody>
            </table>

            {/* Dados da Viagem */}
            <table className="w-full border-collapse mb-4 text-sm">
              <tbody>
                <tr>
                  <td className="border border-black px-2 py-1 bg-gray-200 font-bold text-center" colSpan={2}>
                    DESTINO:
                  </td>
                  <td className="border border-black px-2 py-1 text-center font-bold" colSpan={2}>
                    {acerto.destino?.toUpperCase()}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 bg-gray-200 font-bold text-center" colSpan={2}>
                    MOTORISTA
                  </td>
                  <td className="border border-black px-2 py-1 text-center" colSpan={2}>
                    {acerto.motorista_nome || '-'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 bg-gray-200 font-bold text-center" colSpan={2}>
                    MONTADOR:
                  </td>
                  <td className="border border-black px-2 py-1 text-center" colSpan={2}>
                    {acerto.montador_nome || '-'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Valor Especificado */}
            <table className="w-full border-collapse mb-4 text-sm">
              <tbody>
                <tr>
                  <td className="border-2 border-black px-2 py-2 font-bold">VALOR ESPECIFICADO</td>
                  <td className="border-2 border-black px-2 py-2">R$</td>
                  <td className="border-2 border-black px-2 py-2 text-right font-bold text-lg">
                    {(acerto.valor_adiantamento || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Período */}
            <table className="w-full border-collapse mb-4 text-sm">
              <tbody>
                <tr>
                  <td className="border border-black px-2 py-1 bg-gray-200 font-bold w-32">DATA SAÍDA</td>
                  <td className="border border-black px-2 py-1">{formatDate(acerto.data_saida)}</td>
                  <td className="border border-black px-2 py-1 bg-gray-200 font-bold w-16 text-center" rowSpan={2}>
                    DIAS
                  </td>
                  <td className="border border-black px-2 py-1 text-center font-bold text-lg" rowSpan={2}>
                    {dias}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 bg-gray-200 font-bold">DATA CHEGADA</td>
                  <td className="border border-black px-2 py-1">{formatDate(acerto.data_chegada)}</td>
                </tr>
              </tbody>
            </table>

            {/* Despesas */}
            <table className="w-full border-collapse mb-4 text-sm">
              <thead>
                <tr>
                  <th className="border border-black px-2 py-2 bg-gray-200 text-center" colSpan={4}>
                    DESPESAS
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black px-2 py-1 bg-gray-100 font-bold w-1/4">COMBUSTÍVEL</td>
                  <td className="border border-black px-2 py-1 text-right w-1/4">{formatCurrency(acerto.despesa_combustivel)}</td>
                  <td className="border border-black px-2 py-1 bg-gray-100 font-bold w-1/4">DESPESA VEÍCULO</td>
                  <td className="border border-black px-2 py-1 text-right w-1/4">{formatCurrency(acerto.despesa_veiculo)}</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 bg-gray-100 font-bold">MAT. MONTAGEM</td>
                  <td className="border border-black px-2 py-1 text-right">{formatCurrency(acerto.despesa_material_montagem)}</td>
                  <td className="border border-black px-2 py-1 bg-gray-100 font-bold">AJUDANTE</td>
                  <td className="border border-black px-2 py-1 text-right">{formatCurrency(acerto.despesa_ajudante)}</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 bg-gray-100 font-bold">PASSAGEM ÔNIBUS</td>
                  <td className="border border-black px-2 py-1 text-right">{formatCurrency(acerto.despesa_passagem_onibus)}</td>
                  <td className="border border-black px-2 py-1 bg-gray-100 font-bold">CARTÃO TELEFÔNICO</td>
                  <td className="border border-black px-2 py-1 text-right">{formatCurrency(acerto.despesa_cartao_telefonico)}</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 bg-gray-100 font-bold">HOTEL</td>
                  <td className="border border-black px-2 py-1 text-right">{formatCurrency(acerto.despesa_hotel)}</td>
                  <td className="border border-black px-2 py-1 bg-gray-100 font-bold">ALIMENTAÇÃO</td>
                  <td className="border border-black px-2 py-1 text-right">{formatCurrency(acerto.despesa_alimentacao)}</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 bg-gray-100 font-bold">LAVANDERIA</td>
                  <td className="border border-black px-2 py-1 text-right">{formatCurrency(acerto.despesa_lavanderia)}</td>
                  <td className="border border-black px-2 py-1 bg-gray-100 font-bold">DIÁRIA MOTORISTA</td>
                  <td className="border border-black px-2 py-1 text-right">{formatCurrency(acerto.despesa_diaria_motorista)}</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 bg-gray-100 font-bold">TAXI/TRANSPORTE</td>
                  <td className="border border-black px-2 py-1 text-right">{formatCurrency(acerto.despesa_taxi_transporte)}</td>
                  <td className="border border-black px-2 py-1 bg-gray-100 font-bold">DIÁRIA MONTADOR</td>
                  <td className="border border-black px-2 py-1 text-right">{formatCurrency(acerto.despesa_diaria_montador)}</td>
                </tr>
                {acerto.despesa_outros > 0 && (
                  <tr>
                    <td className="border border-black px-2 py-1 bg-gray-100 font-bold">OUTROS</td>
                    <td className="border border-black px-2 py-1 text-right">{formatCurrency(acerto.despesa_outros)}</td>
                    <td className="border border-black px-2 py-1 text-sm italic" colSpan={2}>
                      {acerto.despesa_outros_descricao || ''}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Observações */}
            <table className="w-full border-collapse mb-4 text-sm">
              <thead>
                <tr>
                  <th className="border border-black px-2 py-1 bg-gray-200">OBSERVAÇÕES:</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black px-2 py-2 min-h-[60px]">
                    {acerto.observacoes || '-'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Entregas Vinculadas */}
            {acerto.entregas && acerto.entregas.length > 0 && (
              <table className="w-full border-collapse mb-4 text-sm">
                <thead>
                  <tr>
                    <th className="border border-black px-2 py-1 bg-gray-200" colSpan={4}>
                      ENTREGAS VINCULADAS
                    </th>
                  </tr>
                  <tr>
                    <th className="border border-black px-2 py-1 bg-gray-100">PV/NF</th>
                    <th className="border border-black px-2 py-1 bg-gray-100">Cliente</th>
                    <th className="border border-black px-2 py-1 bg-gray-100">UF</th>
                    <th className="border border-black px-2 py-1 bg-gray-100 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {acerto.entregas.map((e, idx) => (
                    <tr key={idx}>
                      <td className="border border-black px-2 py-1">
                        {e.entrega?.pv_foco || e.entrega?.nota_fiscal || '-'}
                      </td>
                      <td className="border border-black px-2 py-1">{e.entrega?.cliente || '-'}</td>
                      <td className="border border-black px-2 py-1 text-center">{e.entrega?.uf || '-'}</td>
                      <td className="border border-black px-2 py-1 text-right">
                        {formatCurrency(e.entrega?.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Totais */}
            <table className="w-full border-collapse mb-6 text-sm">
              <tbody>
                <tr>
                  <td className="border-2 border-black px-4 py-2 bg-gray-200 font-bold">TOTAL DESPESAS</td>
                  <td className="border-2 border-black px-4 py-2 text-right font-bold text-lg">
                    {formatCurrency(totalDespesas)}
                  </td>
                </tr>
                <tr>
                  <td className="border-2 border-black px-4 py-2 bg-gray-200 font-bold">
                    {saldo.tipo === 'devolver' ? 'DEVOLVER P/ EMPRESA:' : 'RECEBER DA EMPRESA:'}
                  </td>
                  <td className="border-2 border-black px-4 py-2 text-right font-bold text-lg">
                    {formatCurrency(saldo.valor)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Assinaturas */}
            <div className="mt-8 space-y-6">
              <div className="border-t border-black pt-2 text-center">
                <p className="font-bold">{getResponsavel().toUpperCase()}</p>
              </div>
              <div className="border-t border-black pt-2 text-center">
                <p className="font-bold">GERENTE EXPEDIÇÃO</p>
              </div>
              <div className="border-t border-black pt-2 text-center">
                <p className="font-bold">FINANCEIRO</p>
              </div>
            </div>

            {/* KM Rodado (se informado) */}
            {acerto.km_saida && acerto.km_chegada && (
              <div className="mt-6 text-xs text-gray-500 text-right">
                KM Saída: {acerto.km_saida?.toLocaleString('pt-BR')} | 
                KM Chegada: {acerto.km_chegada?.toLocaleString('pt-BR')} | 
                KM Rodado: {calcularKmRodado(acerto.km_saida, acerto.km_chegada)?.toLocaleString('pt-BR')} km
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Acerto não encontrado
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
