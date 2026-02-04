import { Search, CalendarMonth as CalendarIcon, Close as X } from '@mui/icons-material';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SharedFilterProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    dateFrom: Date | null;
    onDateFromChange: (date: Date | null) => void;
    dateTo: Date | null;
    onDateToChange: (date: Date | null) => void;
    placeholder?: string;
    className?: string;
}

export function SharedFilter({
    searchTerm,
    onSearchChange,
    dateFrom,
    onDateFromChange,
    dateTo,
    onDateToChange,
    placeholder = "Buscar...",
    className,
}: SharedFilterProps) {
    const hasFilters = searchTerm || dateFrom || dateTo;

    const handleClear = () => {
        onSearchChange('');
        onDateFromChange(null);
        onDateToChange(null);
    };

    return (
        <div className={cn("flex flex-col gap-3 md:flex-row md:items-center w-full", className)}>
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 bg-brand-white dark:bg-[#181b21] border-gray-100 dark:border-white/5 rounded-xl focus-visible:ring-0 focus-visible:border-emerald-500 font-medium placeholder:text-slate-400 h-10"
                />
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "w-[140px] md:w-[150px] justify-start text-left font-normal bg-brand-white dark:bg-[#181b21] border-gray-100 dark:border-white/5 rounded-xl h-10 hover:bg-slate-50 dark:hover:bg-slate-800",
                                !dateFrom && "text-slate-400"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                            {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Data inicial"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl border-gray-100 dark:border-white/5 bg-brand-white dark:bg-[#181b21]" align="start">
                        <Calendar
                            mode="single"
                            selected={dateFrom || undefined}
                            onSelect={onDateFromChange}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "w-[140px] md:w-[150px] justify-start text-left font-normal bg-brand-white dark:bg-[#181b21] border-gray-100 dark:border-white/5 rounded-xl h-10 hover:bg-slate-50 dark:hover:bg-slate-800",
                                !dateTo && "text-slate-400"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                            {dateTo ? format(dateTo, "dd/MM/yyyy") : "Data final"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl border-gray-100 dark:border-white/5 bg-brand-white dark:bg-[#181b21]" align="start">
                        <Calendar
                            mode="single"
                            selected={dateTo || undefined}
                            onSelect={onDateToChange}
                            initialFocus
                            disabled={(date) => dateFrom ? date < dateFrom : false}
                        />
                    </PopoverContent>
                </Popover>

                {hasFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className="h-10 px-3 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium"
                    >
                        <X className="mr-1.5 h-4 w-4" />
                        Limpar
                    </Button>
                )}
            </div>
        </div>
    );
}
