import { AnalyticsConversionSummary } from "@/lib/analytics";
import { formatNumber } from "@/lib/format";

const PALETTE = ["#2a78d6", "#1baf7a", "#eda100", "#008300", "#4a3aa7", "#e34948", "#e87ba4", "#eb6834"];

const EVENT_LABELS: Record<string, string> = {
  purchase: "Compra",
  close_convert_lead: "Fechar lead (convertido)",
  qualify_lead: "Qualificar lead",
  view_item: "Visualização de item",
};

interface EventBreakdownListProps {
  items: AnalyticsConversionSummary[];
}

export function EventBreakdownList({ items }: EventBreakdownListProps) {
  if (items.length === 0) {
    return <div className="h-32 flex items-center justify-center text-gray-500">Sem conversões no período selecionado</div>;
  }

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={item.eventName} className="flex justify-between items-center text-sm border-b border-card-border pb-2 last:border-0">
          <span className="font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }}></span>
            {EVENT_LABELS[item.eventName] ?? item.eventName}
          </span>
          <span className="font-bold text-primary">{formatNumber(item.count)}</span>
        </div>
      ))}
    </div>
  );
}
