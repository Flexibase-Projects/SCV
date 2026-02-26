import { PrintOutlined as Printer, CalendarTodayOutlined as Calendar } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface ReportFiltersProps {
    selectedMonth: string;
    onMonthChange: (value: string) => void;
    selectedYear: string;
    onYearChange: (value: string) => void;
    availableYears: number[];
    onPrint: () => void;
}

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

export function ReportFilters({
    selectedMonth,
    onMonthChange,
    selectedYear,
    onYearChange,
    availableYears,
    onPrint
}: ReportFiltersProps) {
    return (
        <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium text-sm text-muted-foreground">Período de Análise:</span>
                </div>

                <div className="flex items-center gap-2 flex-1 md:flex-none w-full md:w-auto">
                    <Select value={selectedMonth} onValueChange={onMonthChange}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Selecione o Mês" />
                        </SelectTrigger>
                        <SelectContent>
                            {MESES.map((mes) => (
                                <SelectItem key={mes.value} value={mes.value}>
                                    {mes.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedYear} onValueChange={onYearChange}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableYears.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="h-8 w-[1px] bg-border mx-2 hidden md:block" />

                    <Button
                        variant="outline"
                        onClick={onPrint}
                        className="gap-2 whitespace-nowrap"
                    >
                        <Printer className="h-4 w-4" />
                        <span className="hidden sm:inline">Imprimir Relatório</span>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
