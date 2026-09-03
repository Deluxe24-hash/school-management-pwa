import { LucideIcon } from "lucide-react";
import { cn } from "../utils/helpers";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  color?: "blue" | "green" | "yellow" | "red" | "purple";
  className?: string;
}

// Left-border ledger tab, colored by category — replaces the identical
// rounded-icon-square-on-a-card pattern every dashboard defaults to.
const borderClasses: Record<string, string> = {
  blue: "border-l-primary-500",
  green: "border-l-emerald-600",
  yellow: "border-l-gold-400",
  red: "border-l-red-700",
  purple: "border-l-violet-600",
};

const iconClasses: Record<string, string> = {
  blue: "text-primary-500",
  green: "text-emerald-600",
  yellow: "text-gold-500",
  red: "text-red-700",
  purple: "text-violet-600",
};

export const StatCard = ({ title, value, icon: Icon, trend, color = "blue", className }: StatCardProps) => {
  return (
    <div
      className={cn(
        "bg-white dark:bg-primary-950/30 rounded-md border border-gray-200 dark:border-gray-800 border-l-[3px] p-5",
        borderClasses[color],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="text-3xl font-serif font-semibold text-primary-900 dark:text-white mt-1.5">{value}</h3>
          {trend && (
            <p className={cn("text-xs font-medium mt-2", trend.isPositive ? "text-emerald-700" : "text-red-700")}>
              {trend.isPositive ? "+" : ""}{trend.value}% from last term
            </p>
          )}
        </div>
        <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", iconClasses[color])} />
      </div>
    </div>
  );
};
