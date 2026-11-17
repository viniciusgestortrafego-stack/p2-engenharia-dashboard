import { CampaignPerformanceRow } from "@/lib/meta";
import { formatBRL, formatNumber } from "@/lib/format";

interface CampaignTableProps {
  rows: CampaignPerformanceRow[];
}

function sum(rows: CampaignPerformanceRow[], key: keyof CampaignPerformanceRow): number {
  return rows.reduce((acc, row) => acc + (row[key] as number), 0);
}

export function CampaignTable({ rows }: CampaignTableProps) {
  if (rows.length === 0) {
    return <div className="h-48 flex items-center justify-center text-gray-500">Sem dados no período selecionado</div>;
  }

  const totalImpressions = sum(rows, "impressions");
  const totalClicks = sum(rows, "clicks");
  const totalCheckouts = sum(rows, "checkoutsIniciados");
  const totalPurchases = sum(rows, "purchases");
  const totalSpend = sum(rows, "spend");
  const totalRevenue = sum(rows, "revenue");

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-card-border">
            <th className="py-3 pr-4">Campanha</th>
            <th className="py-3 pr-4 text-right">Impressões</th>
            <th className="py-3 pr-4 text-right">Cliques</th>
            <th className="py-3 pr-4 text-right">CPC</th>
            <th className="py-3 pr-4 text-right">CPM</th>
            <th className="py-3 pr-4 text-right">Fina. Iniciada</th>
            <th className="py-3 pr-4 text-right">Custo por Fina.</th>
            <th className="py-3 pr-4 text-right">Compras</th>
            <th className="py-3 pr-4 text-right">Custo por Com.</th>
            <th className="py-3 text-right">Lucro Bruto</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-card-border last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <td className="py-3 pr-4 font-medium max-w-[220px] truncate" title={row.name}>{row.name}</td>
              <td className="py-3 pr-4 text-right">{formatNumber(row.impressions)}</td>
              <td className="py-3 pr-4 text-right">{formatNumber(row.clicks)}</td>
              <td className="py-3 pr-4 text-right">{formatBRL(row.cpc)}</td>
              <td className="py-3 pr-4 text-right">{formatBRL(row.cpm)}</td>
              <td className="py-3 pr-4 text-right">{formatNumber(row.checkoutsIniciados)}</td>
              <td className="py-3 pr-4 text-right">{formatBRL(row.custoPorCheckout)}</td>
              <td className="py-3 pr-4 text-right font-bold">{formatNumber(row.purchases)}</td>
              <td className="py-3 pr-4 text-right">{formatBRL(row.cpa)}</td>
              <td className="py-3 text-right font-bold text-green-600 dark:text-green-400 bg-green-500/10 rounded-lg px-2">{formatBRL(row.grossProfit)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-card-border font-bold">
            <td className="py-3 pr-4">Total geral</td>
            <td className="py-3 pr-4 text-right">{formatNumber(totalImpressions)}</td>
            <td className="py-3 pr-4 text-right">{formatNumber(totalClicks)}</td>
            <td className="py-3 pr-4 text-right">{formatBRL(totalClicks > 0 ? totalSpend / totalClicks : 0)}</td>
            <td className="py-3 pr-4 text-right">{formatBRL(totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0)}</td>
            <td className="py-3 pr-4 text-right">{formatNumber(totalCheckouts)}</td>
            <td className="py-3 pr-4 text-right">{formatBRL(totalCheckouts > 0 ? totalSpend / totalCheckouts : 0)}</td>
            <td className="py-3 pr-4 text-right">{formatNumber(totalPurchases)}</td>
            <td className="py-3 pr-4 text-right">{formatBRL(totalPurchases > 0 ? totalSpend / totalPurchases : 0)}</td>
            <td className="py-3 text-right text-green-600 dark:text-green-400">{formatBRL(totalRevenue - totalSpend)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
