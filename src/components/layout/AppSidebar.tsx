import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LocalShippingOutlined as Truck,
  LocalGasStationOutlined as Fuel,
  BuildOutlined as Wrench,
  DashboardOutlined as LayoutDashboard,
  AccountBalanceWalletOutlined as Wallet,
  PeopleOutlined as Users,
  CloudUploadOutlined as Upload,
  AssessmentOutlined as FileBarChart,
  HelpOutlined as LifeBuoy,
  LogoutOutlined as LogOut,
  ChevronLeftOutlined as ChevronLeft,
  ChevronRightOutlined as ChevronRight,
  LightModeOutlined as Sun,
  DarkModeOutlined as Moon
} from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTheme } from '@/components/theme-provider';
import { isImportEnabled } from '@/utils/featureFlags';

interface NavItem {
  icon: React.ElementType;
  label: string;
  to: string;
}

const operationItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
  { icon: Truck, label: 'Entregas', to: '/entregas' },
  { icon: Fuel, label: 'Abastecimento', to: '/abastecimento' },
  { icon: Wrench, label: 'Manutenção', to: '/manutencao' },
];

const financeItems: NavItem[] = [
  { icon: Wallet, label: 'Acerto de Viagem', to: '/acerto-viagem' },
];

const getManagementItems = (): NavItem[] => {
  const baseItems: NavItem[] = [
    { icon: Users, label: 'Cadastros', to: '/cadastros' },
    { icon: FileBarChart, label: 'Relatórios', to: '/resumo-geral' },
  ];

  if (isImportEnabled()) {
    baseItems.splice(1, 0, { icon: Upload, label: 'Importação', to: '/importacao' });
  }

  return baseItems;
};

export function AppSidebar() {
  // CRITICAL: Always reset to expanded state on page load (no localStorage)
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const toggleSidebar = () => setIsCollapsed(prev => !prev);
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.to;
    const Icon = item.icon;

    const linkContent = (
      <Link
        to={item.to}
        className={`
          relative flex items-center gap-3 px-3 py-2.5 rounded-xl
          transition-all duration-200 group
          ${isCollapsed ? 'justify-center' : ''}
          ${isActive
            ? 'bg-brand-blue text-brand-green dark:bg-brand-green/10 dark:text-brand-green shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-brand-green dark:hover:text-brand-green hover:bg-brand-blue dark:hover:bg-brand-white/5'
          }
        `}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />

        <span
          className={`
            font-medium text-sm whitespace-nowrap
            transition-all duration-300 ease-in-out
            ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}
          `}
        >
          {item.label}
        </span>

        {/* Active dot indicator */}
        {isActive && !isCollapsed && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-green dark:bg-brand-green" />
        )}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            {linkContent}
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 font-medium shadow-lg"
          >
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div className={`
      px-3 mb-2 transition-all duration-300 ease-in-out overflow-hidden
      ${isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100'}
    `}>
      <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
        {children}
      </p>
    </div>
  );

  const Divider = () => (
    <div className={`my-4 border-t border-gray-100 dark:border-white/5 transition-all duration-300 ${isCollapsed ? 'mx-2' : 'mx-3'}`} />
  );

  return (
    <TooltipProvider>
      <aside
        className={`
          ${isCollapsed ? 'w-[72px]' : 'w-64'} 
          bg-brand-white dark:bg-[#181b21]
          flex-shrink-0 flex flex-col 
          border-r border-gray-200 dark:border-white/5
          h-screen transition-all duration-300 ease-in-out
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/5">
          <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            {/* Logo Clean */}
            <div className="h-10 w-10 bg-gradient-to-br from-brand-green to-emerald-600 dark:from-brand-green dark:to-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Truck className="h-5 w-5 text-brand-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-gray-900 dark:text-gray-100">SCV</h1>
              <p className="text-[10px] text-gray-500 font-medium">Controle de Frota</p>
            </div>
          </div>

          {/* Mini logo when collapsed */}
          {isCollapsed && (
            <div className="h-10 w-10 bg-gradient-to-br from-brand-green to-emerald-600 dark:from-brand-green dark:to-emerald-600 rounded-2xl flex items-center justify-center shadow-sm mx-auto">
              <Truck className="h-5 w-5 text-brand-white" />
            </div>
          )}

          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {isCollapsed && (
          <div className="flex justify-center py-3 border-b border-gray-100 dark:border-white/5">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto">
          {/* Operação */}
          <SectionLabel>Operação</SectionLabel>
          <div className="space-y-1 mb-6">
            {operationItems.map(item => (
              <NavLink key={item.to} item={item} />
            ))}
          </div>

          {/* Financeiro */}
          <SectionLabel>Financeiro</SectionLabel>
          <div className="space-y-1 mb-6">
            {financeItems.map(item => (
              <NavLink key={item.to} item={item} />
            ))}
          </div>

          {/* Gestão */}
          <SectionLabel>Gestão</SectionLabel>
          <div className="space-y-1">
            {getManagementItems().map(item => (
              <NavLink key={item.to} item={item} />
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-white/5 p-3 space-y-1">
          {/* Theme Toggle */}
          {isCollapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="w-full h-10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 font-medium">
                {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              onClick={toggleTheme}
              className="w-full justify-start gap-3 h-10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="font-medium text-sm">{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
            </Button>
          )}

          {/* Sair */}
          {isCollapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-10 text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 font-medium">
                Sair
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-10 px-3 text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium text-sm">Sair</span>
            </Button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
