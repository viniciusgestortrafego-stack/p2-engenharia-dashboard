import { GoogleAdsKeywordSummary } from "@/lib/googleAds";
import { formatBRL, formatNumber } from "@/lib/format";

interface GoogleAdsKeywordTableProps {
  rows: GoogleAdsKeywordSummary[];
}

const MATCH_TYPE_LABELS: Record<string, string> = {
  EXACT: "Exata",
  PHRASE: "Frase",
  BROAD: "Ampla",
};

export function GoogleAdsKeywordTable({ rows }: GoogleAdsKeywordTableProps) {
  if (rows.length === 0) {
    return <div className="h-48 flex items-center justify-center text-gray-500">Sem dados no período selecionado</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-card-border">
            <th className="py-3 pr-4">Palavra-chave</th>
            <th className="py-3 pr-4">Tipo</th>
            <th className="py-3 pr-4 text-right">Cliques</th>
            <th className="py-3 pr-4 text-right">CPC</th>
            <th className="py-3 pr-4 text-right">Investimento</th>
            <th className="py-3 pr-4 text-right">Conversões</th>
            <th className="py-3 text-right">Custo por Conv.</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 30).map((row, i) => (
            <tr key={i} className="border-b border-card-border last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <td className="py-3 pr-4 font-medium max-w-[220px] truncate" title={row.keyword}>{row.keyword}</td>
              <td className="py-3 pr-4 text-gray-400">{MATCH_TYPE_LABELS[row.matchType] ?? row.matchType}</td>
              <td className="py-3 pr-4 text-right">{formatNumber(row.clicks)}</td>
              <td className="py-3 pr-4 text-right">{formatBRL(row.cpc)}</td>
              <td className="py-3 pr-4 text-right">{formatBRL(row.spend)}</td>
              <td className="py-3 pr-4 text-right font-bold">{formatNumber(row.conversions)}</td>
              <td className="py-3 text-right text-primary font-bold">{formatBRL(row.costPerConversion)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
