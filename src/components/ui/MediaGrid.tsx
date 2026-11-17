import { MediaPerformance } from "@/lib/instagram";
import { formatNumber } from "@/lib/format";

interface MediaGridProps {
  items: MediaPerformance[];
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function MediaGrid({ items }: MediaGridProps) {
  if (items.length === 0) {
    return <div className="h-48 flex items-center justify-center text-gray-500">Nenhum conteúdo encontrado</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {items.map((item) => (
        <a
          key={item.id}
          href={item.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-card border border-card-border rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/50 transition-all"
        >
          {item.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.thumbnailUrl} alt={item.caption || "Conteúdo do Instagram"} className="w-full aspect-square object-cover bg-black/10" />
          ) : (
            <div className="w-full aspect-square bg-black/10 dark:bg-white/10" />
          )}
          <div className="p-3 space-y-2">
            <p className="text-xs text-gray-500">{formatDate(item.timestamp)}</p>
            {item.caption && <p className="text-xs text-gray-400 line-clamp-2">{item.caption}</p>}
            <div className="grid grid-cols-3 gap-1 pt-2 border-t border-card-border text-center">
              <div>
                <p className="text-sm font-bold text-foreground">{formatNumber(item.reach)}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Alcance</p>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{formatNumber(item.views)}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Views</p>
              </div>
              <div>
                <p className="text-sm font-bold text-primary">{formatNumber(item.follows)}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Seguidores</p>
              </div>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
