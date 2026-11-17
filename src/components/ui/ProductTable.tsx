import { AnalyticsProductSummary } from "@/lib/analytics";
import { formatBRL, formatNumber } from "@/lib/format";

interface ProductTableProps {
  rows: AnalyticsProductSummary[];
}

export function ProductTable({ rows }: ProductTableProps) {
  if (rows.length === 0) {
    return <div className="h-48 flex items-center justify-center text-gray-500">Sem dados no período selecionado</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-card-border">
            <th className="py-3 pr-4">Produto</th>
            <th className="py-3 pr-4 text-right">Visualizado</th>
            <th className="py-3 pr-4 text-right">Add. Carrinho</th>
            <th className="py-3 pr-4 text-right">Comprado</th>
            <th className="py-3 text-right">Receita</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 20).map((row) => (
            <tr key={row.itemName} className="border-b border-card-border last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <td className="py-3 pr-4 font-medium max-w-[320px] truncate" title={row.itemName}>{row.itemName}</td>
              <td className="py-3 pr-4 text-right font-bold">{formatNumber(row.itemsViewed)}</td>
              <td className="py-3 pr-4 text-right">{formatNumber(row.itemsAddedToCart)}</td>
              <td className="py-3 pr-4 text-right">{formatNumber(row.itemsPurchased)}</td>
              <td className="py-3 text-right text-primary font-bold">{formatBRL(row.itemRevenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
