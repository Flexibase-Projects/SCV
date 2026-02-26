import { Inventory2Outlined as Package, LocationOnOutlined as MapPin } from '@mui/icons-material';
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface OperationalReportProps {
    entregasPorVeiculo: Array<{ carro: string; qtd: number; valor: number }>;
    entregasPorUF: Array<{ uf: string; qtd: number; valor: number }>;
}

export function OperationalReport({ entregasPorVeiculo, entregasPorUF }: OperationalReportProps) {

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover border border-border p-3 rounded-lg shadow-lg">
                    <p className="font-medium text-popover-foreground mb-1">{label}</p>
                    <p className="text-sm text-primary">
                        Quantidade: <span className="font-bold">{payload[0].value}</span>
                    </p>
                    <p className="text-sm text-emerald-500">
                        Valor: <span className="font-bold">{formatCurrency(payload[0].payload.valor)}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Gráficos Resumidos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Top 5 Veículos por Entregas</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={entregasPorVeiculo.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="carro" type="category" width={100} tick={{ fontSize: 12, fill: 'currentColor' }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="qtd" radius={[0, 4, 4, 0]}>
                                    {entregasPorVeiculo.slice(0, 5).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={`hsl(var(--emerald-500) / ${1 - index * 0.1})`} className="stroke-emerald-600 dark:stroke-none stroke-1" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Top 5 Estados</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={entregasPorUF.slice(0, 5)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="uf" tick={{ fontSize: 12, fill: 'currentColor' }} />
                                <YAxis hide />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="qtd" radius={[4, 4, 0, 0]}>
                                    {entregasPorUF.slice(0, 5).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={`hsl(var(--purple-500) / ${1 - index * 0.1})`} className="stroke-purple-600 dark:stroke-none stroke-1" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Entregas por Veículo */}
                <Card className="bg-card border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Package className="h-5 w-5 text-emerald-500" />
                            Detalhamento por Veículo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Veículo</TableHead>
                                        <TableHead className="text-center">Qtd. Entregas</TableHead>
                                        <TableHead className="text-right">Valor Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {entregasPorVeiculo.length > 0 ? (
                                        entregasPorVeiculo.map((item, idx) => (
                                            <TableRow key={idx} className="hover:bg-muted/50">
                                                <TableCell className="font-medium">{item.carro}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none">{item.qtd}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(item.valor)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                                Nenhuma entrega no período selecionado
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Entregas por UF */}
                <Card className="bg-card border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <MapPin className="h-5 w-5 text-purple-500" />
                            Detalhamento por UF
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>UF</TableHead>
                                        <TableHead className="text-center">Qtd. Entregas</TableHead>
                                        <TableHead className="text-right">Valor Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {entregasPorUF.length > 0 ? (
                                        entregasPorUF.map((item, idx) => (
                                            <TableRow key={idx} className="hover:bg-muted/50">
                                                <TableCell className="font-medium flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-700 dark:text-purple-400 text-xs font-bold">
                                                        {item.uf}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="secondary">{item.qtd}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-purple-600 dark:text-purple-400">
                                                    {formatCurrency(item.valor)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                                Nenhuma entrega no período selecionado
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
