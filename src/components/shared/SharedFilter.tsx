import { Search, CalendarIcon, X } from 'lucide-react';
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
        <div className={cn("flex flex-col gap-4 md:flex-row md:items-center w-full", className)}>
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 bg-card border-border shadow-sm focus-visible:ring-primary"
                />
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "w-[140px] md:w-[160px] justify-start text-left font-normal bg-card border-border shadow-sm",
                                !dateFrom && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Início"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
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
                                "w-[140px] md:w-[160px] justify-start text-left font-normal bg-card border-border shadow-sm",
                                !dateTo && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateTo ? format(dateTo, "dd/MM/yyyy") : "Fim"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
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
                        className="h-9 px-2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="mr-2 h-4 w-4" />
                        Limpar
                    </Button>
                )}
            </div>
        </div>
    );
}
