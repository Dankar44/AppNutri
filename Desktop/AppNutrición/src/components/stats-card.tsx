import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  change?: number;
  color: string;
  muted?: boolean;
}

export function StatsCard({ icon: Icon, label, value, change, color, muted }: StatsCardProps) {
  return (
    <div className={cn("rounded-xl border border-border p-5", muted ? "bg-muted/30" : "bg-card")}>
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full",
              change > 0 && "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10",
              change < 0 && "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10",
              change === 0 && "text-muted-foreground bg-muted"
            )}
          >
            {change > 0 ? <TrendingUp className="w-3 h-3" /> : change < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {change > 0 ? "+" : ""}{change}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold mt-3">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
