import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}

export function PageHeader({ icon: Icon, title, subtitle, action }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-1 sm:mb-6">
      <div className="flex items-start gap-3 min-w-0">
        <Icon
          className="w-7 h-7 sm:w-9 sm:h-9 text-foreground shrink-0 mt-0.5 sm:mt-1"
          strokeWidth={1.75}
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-3xl font-bold leading-tight line-clamp-2 sm:truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 line-clamp-2 sm:truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
