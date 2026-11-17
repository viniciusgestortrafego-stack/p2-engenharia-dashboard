import { AnalyticsChannelSummary } from "@/lib/analytics";
import { formatNumber, formatPercent } from "@/lib/format";

interface ChannelTableProps {
  rows: AnalyticsChannelSummary[];
}

const CHANNEL_LABELS: Record<string, string> = {
  "Paid Search": "Busca Paga",
  "Organic Search": "Busca Orgânica",
  Direct: "Direto",
  Referral: "Referência",
  "Organic Social": "Social Orgânico",
  "Paid Social": "Social Pago",
  Email: "E-mail",
  Display: "Display",
  "Cross-network": "Rede Cruzada",
  Unassigned: "Não atribuído",
};

export function ChannelTable({ rows }: ChannelTableProps) {
  if (rows.length === 0) {
    return <div className="h-48 flex items-center justify-center text-gray-500">Sem dados no período selecionado</div>;
  }

  const totalSessions = rows.reduce((acc, r) => acc + r.sessions, 0) || 1;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-card-border">
            <th className="py-3 pr-4">Canal</th>
            <th className="py-3 pr-4 text-right">Sessões</th>
            <th className="py-3 pr-4 text-right">% do Total</th>
            <th className="py-3 pr-4 text-right">Usuários</th>
            <th className="py-3 text-right">Conversões</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.channel} className="border-b border-card-border last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <td className="py-3 pr-4 font-medium">{CHANNEL_LABELS[row.channel] ?? row.channel}</td>
              <td className="py-3 pr-4 text-right">{formatNumber(row.sessions)}</td>
              <td className="py-3 pr-4 text-right text-gray-400">{formatPercent((row.sessions / totalSessions) * 100)}</td>
              <td className="py-3 pr-4 text-right">{formatNumber(row.activeUsers)}</td>
              <td className="py-3 text-right text-primary font-bold">{formatNumber(row.conversions)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
