import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
        <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-muted-foreground">
                Mostrando <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> a <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalRecords)}</span> de <span className="font-medium">{totalRecords}</span> resultados
            </div>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                </Button>
                <div className="text-sm font-medium">
                    Página {currentPage} de {totalPages}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
