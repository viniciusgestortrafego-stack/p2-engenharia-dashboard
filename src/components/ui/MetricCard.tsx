import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: string;
  trendUp?: boolean;
}

export function MetricCard({ title, value, subtitle, icon, trend, trendUp }: MetricCardProps) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-xs font-bold text-primary uppercase tracking-wider">{title}</h3>
        {icon && <div className="text-gray-400 bg-black/5 dark:bg-white/5 p-2 rounded-lg">{icon}</div>}
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <div className="flex items-center gap-2">
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trendUp ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
