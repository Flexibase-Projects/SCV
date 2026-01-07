import { Link } from 'react-router-dom';
import { HelpOutline } from '@mui/icons-material';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function FloatingHelpButton() {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Link
            to="/ajuda"
            className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-brand-green hover:bg-emerald-600 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-white"
            aria-label="Ajuda"
          >
            <HelpOutline className="h-6 w-6" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="left" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 font-medium">
          Ajuda
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

