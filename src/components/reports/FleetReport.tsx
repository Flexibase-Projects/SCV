import { LocalGasStationOutlined as Fuel, BuildOutlined as Wrench, DirectionsCarOutlined as Car, LocationOnOutlined as MapPin } from '@mui/icons-material';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface FleetReportProps {
    kmRodadoPorVeiculo: Array<{ placa: string; kmRodado: number; kmInicial: number; kmFinal: number }>;
    custoAbastecimentoPorVeiculo: Array<{ placa: string; custo: number; litros: number }>;
    custoManutencaoPorVeiculo: Array<{ placa: string; custo: number; qtd: number }>;
    custoCombustivelPorEstado: Array<{ estado: string; totalValor: number; totalLitros: number; qtd: number; mediaPreco: number }>;
}

export function FleetReport({
    kmRodadoPorVeiculo,
    custoAbastecimentoPorVeiculo,
    custoManutencaoPorVeiculo,
    custoCombustivelPorEstado
}: FleetReportProps) {

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('pt-BR').format(value);
    };

    // Encontrar o maior KM para barras de progresso
    const maxKm = Math.max(...kmRodadoPorVeiculo.map(v => v.kmRodado), 100);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* KM Rodado */}
            <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Car className="h-5 w-5 text-blue-500" />
                        KM Rodado por Veículo
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-[120px]">Veículo</TableHead>
                                    <TableHead>Uso da Frota (KM)</TableHead>
                                    <TableHead className="text-right w-[100px]">Total KM</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {kmRodadoPorVeiculo.length > 0 ? (
                                    kmRodadoPorVeiculo.map((item, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium">{item.placa}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Progress value={(item.kmRodado / maxKm) * 100} className="h-2" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge className="bg-blue-500">{formatNumber(item.kmRodado)} km</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                            Nenhum dado de KM no período
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Custo Abastecimento */}
                <Card className="bg-card border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Fuel className="h-5 w-5 text-orange-500" />
                            Custo de Abastecimento
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Veículo</TableHead>
                                        <TableHead className="text-center">Litros</TableHead>
                                        <TableHead className="text-right">Custo Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {custoAbastecimentoPorVeiculo.length > 0 ? (
                                        custoAbastecimentoPorVeiculo.map((item, idx) => (
                                            <TableRow key={idx} className="hover:bg-muted/50">
                                                <TableCell className="font-medium">{item.placa}</TableCell>
                                                <TableCell className="text-center text-sm">
                                                    {formatNumber(item.litros)} L
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-orange-600 dark:text-orange-400">
                                                    {formatCurrency(item.custo)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                                Nenhum abastecimento no período
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Custo Manutenção */}
                <Card className="bg-card border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Wrench className="h-5 w-5 text-red-500" />
                            Custo de Manutenção
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Veículo</TableHead>
                                        <TableHead className="text-center">Serviços</TableHead>
                                        <TableHead className="text-right">Custo Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {custoManutencaoPorVeiculo.length > 0 ? (
                                        custoManutencaoPorVeiculo.map((item, idx) => (
                                            <TableRow key={idx} className="hover:bg-muted/50">
                                                <TableCell className="font-medium">{item.placa}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="secondary">{item.qtd}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-red-600 dark:text-red-400">
                                                    {formatCurrency(item.custo)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                                Nenhuma manutenção no período
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Combustível por Estado */}
            <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPin className="h-5 w-5 text-blue-500" />
                        Média de Combustível por Estado
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-center">Abastecimentos</TableHead>
                                    <TableHead className="text-center">Total Litros</TableHead>
                                    <TableHead className="text-right">Média R$/L</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {custoCombustivelPorEstado.length > 0 ? (
                                    custoCombustivelPorEstado.map((item, idx) => (
                                        <TableRow key={idx} className="hover:bg-muted/50">
                                            <TableCell className="font-medium flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 text-xs font-bold">
                                                    {item.estado}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline">{item.qtd}</Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatNumber(item.totalLitros)} L
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-blue-600 dark:text-blue-400">
                                                R$ {item.mediaPreco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                            Nenhum abastecimento no período
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
