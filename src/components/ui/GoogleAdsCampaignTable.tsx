import { GoogleAdsCampaignRow } from "@/lib/googleAds";
import { formatBRL, formatNumber } from "@/lib/format";

interface GoogleAdsCampaignTableProps {
  rows: GoogleAdsCampaignRow[];
}

function sum(rows: GoogleAdsCampaignRow[], key: keyof GoogleAdsCampaignRow): number {
  return rows.reduce((acc, row) => acc + (row[key] as number), 0);
}

export function GoogleAdsCampaignTable({ rows }: GoogleAdsCampaignTableProps) {
  if (rows.length === 0) {
    return <div className="h-48 flex items-center justify-center text-gray-500">Sem dados no período selecionado</div>;
  }

  const totalImpressions = sum(rows, "impressions");
  const totalClicks = sum(rows, "clicks");
  const totalConversions = sum(rows, "conversions");
  const totalSpend = sum(rows, "spend");
  const totalConversionValue = sum(rows, "conversionValue");

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
            <th className="py-3 pr-4 text-right">Investimento</th>
            <th className="py-3 pr-4 text-right">Conversões</th>
            <th className="py-3 pr-4 text-right">Custo por Conv.</th>
            <th className="py-3 text-right">ROAS</th>
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
              <td className="py-3 pr-4 text-right">{formatBRL(row.spend)}</td>
              <td className="py-3 pr-4 text-right font-bold">{formatNumber(row.conversions)}</td>
              <td className="py-3 pr-4 text-right">{formatBRL(row.costPerConversion)}</td>
              <td className="py-3 text-right font-bold text-primary">{row.roas.toFixed(2)}x</td>
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
            <td className="py-3 pr-4 text-right">{formatBRL(totalSpend)}</td>
            <td className="py-3 pr-4 text-right">{formatNumber(totalConversions)}</td>
            <td className="py-3 pr-4 text-right">{formatBRL(totalConversions > 0 ? totalSpend / totalConversions : 0)}</td>
            <td className="py-3 text-right text-primary">{(totalSpend > 0 ? totalConversionValue / totalSpend : 0).toFixed(2)}x</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
