import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ReportKPIProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'orange';
    subtext?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

export function ReportKPI({
    title,
    value,
    icon: Icon,
    variant = 'default',
    subtext,
    trend
}: ReportKPIProps) {

    const variants = {
        default: "bg-card border-border text-foreground hover:border-gray-300 dark:hover:border-gray-700",
        success: "bg-white border-emerald-200 text-emerald-950 shadow-sm hover:border-emerald-300 hover:shadow-md dark:bg-emerald-950/10 dark:text-emerald-50 dark:border-emerald-900/50",
        warning: "bg-white border-yellow-200 text-yellow-950 shadow-sm hover:border-yellow-300 hover:shadow-md dark:bg-yellow-950/10 dark:text-yellow-50 dark:border-yellow-900/50",
        danger: "bg-white border-red-200 text-red-950 shadow-sm hover:border-red-300 hover:shadow-md dark:bg-red-950/10 dark:text-red-50 dark:border-red-900/50",
        info: "bg-white border-blue-200 text-blue-950 shadow-sm hover:border-blue-300 hover:shadow-md dark:bg-blue-950/10 dark:text-blue-50 dark:border-blue-900/50",
        purple: "bg-white border-purple-200 text-purple-950 shadow-sm hover:border-purple-300 hover:shadow-md dark:bg-purple-950/10 dark:text-purple-50 dark:border-purple-900/50",
        orange: "bg-white border-orange-200 text-orange-950 shadow-sm hover:border-orange-300 hover:shadow-md dark:bg-orange-950/10 dark:text-orange-50 dark:border-orange-900/50",
    };

    const iconColors = {
        default: "text-muted-foreground",
        success: "text-emerald-600 dark:text-emerald-400",
        warning: "text-yellow-600 dark:text-yellow-400",
        danger: "text-red-600 dark:text-red-400",
        info: "text-blue-600 dark:text-blue-400",
        purple: "text-purple-600 dark:text-purple-400",
        orange: "text-orange-600 dark:text-orange-400",
    };

    const bgIconColors = {
        default: "bg-secondary",
        success: "bg-emerald-50 border border-emerald-100 dark:bg-emerald-900/30 dark:border-none",
        warning: "bg-yellow-50 border border-yellow-100 dark:bg-yellow-900/30 dark:border-none",
        danger: "bg-red-50 border border-red-100 dark:bg-red-900/30 dark:border-none",
        info: "bg-blue-50 border border-blue-100 dark:bg-blue-900/30 dark:border-none",
        purple: "bg-purple-50 border border-purple-100 dark:bg-purple-900/30 dark:border-none",
        orange: "bg-orange-50 border border-orange-100 dark:bg-orange-900/30 dark:border-none",
    };

    return (
        <Card className={cn("shadow-sm transition-all duration-200 hover:shadow-md", variants[variant])}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-muted-foreground/80">{title}</p>
                    <div className={cn("p-2 rounded-lg", bgIconColors[variant])}>
                        <Icon className={cn("h-5 w-5", iconColors[variant])} />
                    </div>
                </div>

                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
                    {trend && (
                        <span className={cn(
                            "text-xs font-medium flex items-center",
                            trend.isPositive ? "text-emerald-600" : "text-red-600"
                        )}>
                            {trend.isPositive ? "+" : ""}{trend.value}%
                        </span>
                    )}
                </div>

                {subtext && (
                    <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
                )}
            </CardContent>
        </Card>
    );
}
