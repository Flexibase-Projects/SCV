import { Search } from '@mui/icons-material';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STATUS_OPTIONS } from '@/types/entrega';

interface EntregaFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  motoristaFilter: string;
  onMotoristaChange: (value: string) => void;
  motoristas: string[];
}

export function EntregaFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  motoristaFilter,
  onMotoristaChange,
  motoristas
}: EntregaFiltersProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente ou PV Foco..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-card border-border rounded-xl"
        />
      </div>
      
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full md:w-[180px] bg-card border-border rounded-xl">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border rounded-xl">
          <SelectItem value="all">Todos os Status</SelectItem>
          {STATUS_OPTIONS.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={motoristaFilter} onValueChange={onMotoristaChange}>
        <SelectTrigger className="w-full md:w-[180px] bg-card border-border rounded-xl">
          <SelectValue placeholder="Motorista" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border rounded-xl">
          <SelectItem value="all">Todos os Motoristas</SelectItem>
          {motoristas.map((motorista) => (
            <SelectItem key={motorista} value={motorista}>
              {motorista}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
