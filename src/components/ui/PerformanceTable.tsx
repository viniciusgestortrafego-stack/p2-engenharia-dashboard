import { EntityPerformanceRow } from "@/lib/meta";
import { formatBRL, formatNumber } from "@/lib/format";
import { ExternalLink } from "lucide-react";

interface PerformanceTableProps {
  rows: EntityPerformanceRow[];
  nameColumnLabel: string;
  showThumbnails?: boolean;
}

export function PerformanceTable({ rows, nameColumnLabel, showThumbnails }: PerformanceTableProps) {
  if (rows.length === 0) {
    return <div className="h-48 flex items-center justify-center text-gray-500">Sem dados no período selecionado</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-card-border">
            <th className="py-3 pr-4">{nameColumnLabel}</th>
            <th className="py-3 pr-4 text-right">Compras</th>
            <th className="py-3 pr-4 text-right">Investimento</th>
            <th className="py-3 pr-4 text-right">Receita</th>
            <th className="py-3 pr-4 text-right">ROAS</th>
            <th className="py-3 text-right">CPA</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-card-border last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <td className="py-3 pr-4">
                <a
                  href={row.permalinkUrl || row.thumbnailUrl || row.managerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 font-medium text-foreground hover:text-primary transition-colors"
                >
                  {showThumbnails && (
                    row.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.thumbnailUrl} alt={row.name} className="w-12 h-12 rounded-lg object-cover shrink-0 bg-black/10" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg shrink-0 bg-black/10 dark:bg-white/10" />
                    )
                  )}
                  <span className="truncate max-w-[220px]">{row.name}</span>
                  <ExternalLink size={14} className="text-gray-400 shrink-0" />
                </a>
              </td>
              <td className="py-3 pr-4 text-right font-bold">{formatNumber(row.purchases)}</td>
              <td className="py-3 pr-4 text-right">{formatBRL(row.spend)}</td>
              <td className="py-3 pr-4 text-right">{formatBRL(row.revenue)}</td>
              <td className="py-3 pr-4 text-right font-bold text-primary">{row.roas.toFixed(2)}x</td>
              <td className="py-3 text-right font-bold text-primary">{formatBRL(row.cpa)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
