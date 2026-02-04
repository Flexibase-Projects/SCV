import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | ReactNode;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  iconBgColor?: string;
  delay?: number;
  isVisible?: boolean;
  variant?: 'sharp' | 'rounded';
  showPulse?: boolean;
  className?: string;
}

export function KPICard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-emerald-600 dark:text-emerald-400',
  iconBgColor = 'bg-emerald-50 dark:bg-emerald-500/10',
  delay = 0,
  isVisible = true,
  variant = 'sharp',
  showPulse = false,
  className
}: KPICardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
        'shadow-sm hover:shadow-lg transition-all duration-300',
        'min-h-[140px] flex flex-col',
        'cursor-pointer',
        'hover:scale-[1.02] hover:-translate-y-1',
        'will-change-transform',
        variant === 'sharp' ? 'rounded-none' : 'rounded-3xl',
        !isVisible && 'opacity-0 translate-y-5',
        isVisible && 'animate-stagger-fade',
        'motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:hover:translate-y-0 motion-reduce:opacity-100 motion-reduce:translate-y-0',
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'forwards'
      }}
    >
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {title}
          </span>
          <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', iconBgColor)}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
        </div>
        
        <div className="flex-1 flex flex-col justify-center">
          <p
            className={cn(
              'text-2xl font-bold text-slate-900 dark:text-slate-100',
              showPulse && 'animate-pulse-subtle'
            )}
          >
            {value}
          </p>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
