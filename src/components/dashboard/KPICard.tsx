import { TrendingUp, TrendingDown } from "lucide-react";
import { formatKES } from "@/lib/demo-data";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  prefix?: string;
  suffix?: string;
  icon: React.ReactNode;
}

const KPICard = ({ title, value, change, prefix, suffix, icon }: KPICardProps) => {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="surface-card p-6 hover:-translate-y-0.5 hover:shadow-elevated transition-all duration-300 animate-count-up">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-primary" : "text-destructive"}`}>
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {isPositive ? "+" : ""}{change}%
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <p className="text-2xl font-display font-bold text-foreground">
        {prefix}{typeof value === "number" ? value.toLocaleString() : value}{suffix}
      </p>
    </div>
  );
};

export default KPICard;
