import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

interface PaginationControlProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalRecords: number;
    itemsPerPage: number;
}

export function PaginationControl({
    currentPage,
    totalPages,
    onPageChange,
    totalRecords,
    itemsPerPage
}: PaginationControlProps) {

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between px-4 py-3 bg-brand-white dark:bg-[#181b21] border border-gray-100 dark:border-white/5 rounded-lg mt-4">
            <div className="text-sm text-slate-600 dark:text-slate-400">
                Mostrando <span className="font-medium text-slate-900 dark:text-slate-100">{((currentPage - 1) * itemsPerPage) + 1}</span> a <span className="font-medium text-slate-900 dark:text-slate-100">{Math.min(currentPage * itemsPerPage, totalRecords)}</span> de <span className="font-medium text-slate-900 dark:text-slate-100">{totalRecords}</span> resultados
            </div>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="rounded-lg border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium h-9 disabled:opacity-50"
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                </Button>
                <div className="text-sm font-medium px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100">
                    {currentPage} / {totalPages}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium h-9 disabled:opacity-50"
                >
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </div>
        </div>
    );
}
