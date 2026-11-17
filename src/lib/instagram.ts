export class InstagramFetchError extends Error {}

async function callGraphApi(endpoint: string, params: Record<string, string>): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const searchParams = new URLSearchParams({ endpoint, ...params });
  const response = await fetch(`/api/meta?${searchParams.toString()}`);
  const data = await response.json();
  return { ok: response.ok, data };
}

interface FetchInstagramMetricsParams {
  instagramAccountId: string;
  since: string;
  until: string;
}

export interface InstagramMetrics {
  views: number;
  followerChange: number;
  interactions: number;
  reach: number;
  profileViews: number;
}

function toUnixSeconds(dateStr: string, endOfDay: boolean): number {
  return Math.floor(new Date(`${dateStr}T${endOfDay ? "23:59:59" : "00:00:00"}`).getTime() / 1000);
}

async function fetchInsights(instagramAccountId: string, params: Record<string, string>): Promise<Record<string, unknown>[]> {
  const { ok, data } = await callGraphApi(`${instagramAccountId}/insights`, params);
  if (!ok) {
    throw new InstagramFetchError((data.error as string) || "Erro ao buscar dados do Instagram");
  }
  return (data.data as Record<string, unknown>[]) || [];
}

function totalValueFor(rows: Record<string, unknown>[], metric: string): number {
  const row = rows.find((item) => item.name === metric);
  const totalValue = row?.total_value as { value?: number } | undefined;
  return totalValue?.value ?? 0;
}

// The Graph API rejects metric_type=total_value requests whose since/until span
// is 30 days or more ("date range... cannot be more than 30 days"), so a plain
// "last 30 days" selection (inclusive) trips it. Split into <=29-day windows and
// sum the results instead of capping what the user can select.
const MAX_WINDOW_DAYS = 29;

function splitIntoWindows(sinceUnix: number, untilUnix: number): { since: number; until: number }[] {
  const maxSpanSeconds = MAX_WINDOW_DAYS * 86400;
  const windows: { since: number; until: number }[] = [];
  let windowStart = sinceUnix;
  while (windowStart <= untilUnix) {
    const windowEnd = Math.min(windowStart + maxSpanSeconds, untilUnix);
    windows.push({ since: windowStart, until: windowEnd });
    windowStart = windowEnd + 1;
  }
  return windows;
}

export async function fetchInstagramMetrics({ instagramAccountId, since, until }: FetchInstagramMetricsParams): Promise<InstagramMetrics> {
  const sinceUnix = toUnixSeconds(since, false);
  const untilUnix = toUnixSeconds(until, true);
  const windows = splitIntoWindows(sinceUnix, untilUnix);

  const [aggregateRowsPerWindow, followerRowsPerWindow] = await Promise.all([
    Promise.all(
      windows.map((window) =>
        fetchInsights(instagramAccountId, {
          metric: "reach,profile_views,total_interactions,views",
          period: "day",
          metric_type: "total_value",
          since: String(window.since),
          until: String(window.until),
        })
      )
    ),
    Promise.all(
      windows.map((window) =>
        fetchInsights(instagramAccountId, {
          metric: "follower_count",
          period: "day",
          since: String(window.since),
          until: String(window.until),
        })
      )
    ),
  ]);

  const followerChange = followerRowsPerWindow.reduce((acc, followerRows) => {
    const followerSeries = (followerRows[0]?.values as { value?: number }[] | undefined) || [];
    return acc + followerSeries.reduce((sum, entry) => sum + (entry.value || 0), 0);
  }, 0);

  const sumAcrossWindows = (metric: string) =>
    aggregateRowsPerWindow.reduce((acc, rows) => acc + totalValueFor(rows, metric), 0);

  return {
    views: sumAcrossWindows("views"),
    followerChange,
    interactions: sumAcrossWindows("total_interactions"),
    reach: sumAcrossWindows("reach"),
    profileViews: sumAcrossWindows("profile_views"),
  };
}

interface FetchRecentMediaParams {
  instagramAccountId: string;
}

export interface MediaPerformance {
  id: string;
  caption: string;
  thumbnailUrl?: string;
  permalink: string;
  timestamp: string;
  reach: number;
  views: number;
  follows: number;
}

function singleValueFor(rows: Record<string, unknown>[], metric: string): number {
  const row = rows.find((item) => item.name === metric);
  const values = row?.values as { value?: number }[] | undefined;
  return values?.[0]?.value ?? 0;
}

export async function fetchRecentMedia({ instagramAccountId }: FetchRecentMediaParams): Promise<MediaPerformance[]> {
  const { ok, data } = await callGraphApi(`${instagramAccountId}/media`, {
    fields: "id,caption,thumbnail_url,media_url,permalink,timestamp",
    limit: "10",
  });
  if (!ok) {
    throw new InstagramFetchError((data.error as string) || "Erro ao buscar conteúdos do Instagram");
  }
  const mediaList = (data.data as Record<string, unknown>[]) || [];

  return Promise.all(
    mediaList.map(async (media) => {
      const id = String(media.id ?? "");

      // Not every media type/API version supports "views" and "follows" (e.g. static
      // images vs reels), so we try the full set first and fall back to just "reach"
      // (near-universally supported) rather than losing the whole row on one bad metric.
      let insightRows: Record<string, unknown>[] = [];
      const primary = await callGraphApi(`${id}/insights`, { metric: "reach,views,follows" });
      if (primary.ok) {
        insightRows = (primary.data.data as Record<string, unknown>[]) || [];
      } else {
        const fallback = await callGraphApi(`${id}/insights`, { metric: "reach" });
        if (fallback.ok) insightRows = (fallback.data.data as Record<string, unknown>[]) || [];
      }

      return {
        id,
        caption: String(media.caption ?? ""),
        thumbnailUrl: (media.thumbnail_url as string) || (media.media_url as string) || undefined,
        permalink: String(media.permalink ?? "#"),
        timestamp: String(media.timestamp ?? ""),
        reach: singleValueFor(insightRows, "reach"),
        views: singleValueFor(insightRows, "views"),
        follows: singleValueFor(insightRows, "follows"),
      };
    })
  );
}
