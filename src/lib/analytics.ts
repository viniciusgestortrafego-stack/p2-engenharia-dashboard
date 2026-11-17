export interface AnalyticsDailyRow {
  date: string;
  sessions: number;
  activeUsers: number;
  engagementRate: number;
}

export interface AnalyticsChannelRow {
  date: string;
  channel: string;
  sessions: number;
  activeUsers: number;
  conversions: number;
}

export interface AnalyticsConversionRow {
  date: string;
  eventName: string;
  count: number;
}

export interface AnalyticsProductRow {
  date: string;
  itemName: string;
  itemsViewed: number;
  itemsAddedToCart: number;
  itemsPurchased: number;
  itemRevenue: number;
}

export interface AnalyticsUtmRow {
  date: string;
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
  sessions: number;
  conversions: number;
  revenue: number;
}

export class AnalyticsFetchError extends Error {}

export interface AnalyticsData {
  daily: AnalyticsDailyRow[];
  channels: AnalyticsChannelRow[];
  conversionBreakdown: AnalyticsConversionRow[];
  conversionEventNames: string[];
  products: AnalyticsProductRow[];
  utms: AnalyticsUtmRow[];
}

export async function fetchAnalyticsData(): Promise<AnalyticsData> {
  const response = await fetch("/api/analytics/data");
  if (!response.ok) {
    throw new AnalyticsFetchError("Erro ao buscar dados do Analytics");
  }
  const data = await response.json();
  return {
    daily: (data.daily as AnalyticsDailyRow[]) || [],
    channels: (data.channels as AnalyticsChannelRow[]) || [],
    conversionBreakdown: (data.conversionBreakdown as AnalyticsConversionRow[]) || [],
    conversionEventNames: (data.conversionEventNames as string[]) || [],
    products: (data.products as AnalyticsProductRow[]) || [],
    utms: (data.utms as AnalyticsUtmRow[]) || [],
  };
}

function filterByDateRange<T extends { date: string }>(rows: T[], from: string, to: string): T[] {
  return rows.filter((row) => row.date >= from && row.date <= to);
}

export function filterDailyByRange(rows: AnalyticsDailyRow[], from: string, to: string): AnalyticsDailyRow[] {
  return filterByDateRange(rows, from, to);
}

export function filterChannelsByRange(rows: AnalyticsChannelRow[], from: string, to: string): AnalyticsChannelRow[] {
  return filterByDateRange(rows, from, to);
}

export function filterConversionsByRange(rows: AnalyticsConversionRow[], from: string, to: string): AnalyticsConversionRow[] {
  return filterByDateRange(rows, from, to);
}

export function filterProductsByRange(rows: AnalyticsProductRow[], from: string, to: string): AnalyticsProductRow[] {
  return filterByDateRange(rows, from, to);
}

export function filterUtmsByRange(rows: AnalyticsUtmRow[], from: string, to: string): AnalyticsUtmRow[] {
  return filterByDateRange(rows, from, to);
}

export interface AnalyticsTotals {
  sessions: number;
  activeUsers: number;
  engagementRate: number;
}

export function aggregateDaily(rows: AnalyticsDailyRow[]): AnalyticsTotals {
  const sessions = rows.reduce((acc, r) => acc + r.sessions, 0);
  const activeUsers = rows.reduce((acc, r) => acc + r.activeUsers, 0);
  // engagementRate is already a rate per row (not additive) — weight by sessions for a
  // period average instead of a naive mean across days with very different traffic.
  const weightedEngagement = rows.reduce((acc, r) => acc + r.engagementRate * r.sessions, 0);
  return {
    sessions,
    activeUsers,
    engagementRate: sessions > 0 ? weightedEngagement / sessions : 0,
  };
}

export interface AnalyticsChannelSummary {
  channel: string;
  sessions: number;
  activeUsers: number;
  conversions: number;
}

export function aggregateByChannel(rows: AnalyticsChannelRow[]): AnalyticsChannelSummary[] {
  const byChannel = new Map<string, { sessions: number; activeUsers: number; conversions: number }>();
  for (const row of rows) {
    const entry = byChannel.get(row.channel) || { sessions: 0, activeUsers: 0, conversions: 0 };
    entry.sessions += row.sessions;
    entry.activeUsers += row.activeUsers;
    entry.conversions += row.conversions;
    byChannel.set(row.channel, entry);
  }
  return Array.from(byChannel.entries())
    .map(([channel, v]) => ({ channel, ...v }))
    .sort((a, b) => b.sessions - a.sessions);
}

export interface AnalyticsConversionSummary {
  eventName: string;
  count: number;
}

export function aggregateConversionBreakdown(rows: AnalyticsConversionRow[]): AnalyticsConversionSummary[] {
  const byEvent = new Map<string, number>();
  for (const row of rows) {
    byEvent.set(row.eventName, (byEvent.get(row.eventName) || 0) + row.count);
  }
  return Array.from(byEvent.entries())
    .map(([eventName, count]) => ({ eventName, count }))
    .sort((a, b) => b.count - a.count);
}

export function aggregateSessionsByDay(rows: AnalyticsDailyRow[]): { date: string; sessions: number }[] {
  return [...rows].sort((a, b) => a.date.localeCompare(b.date)).map((r) => ({ date: r.date, sessions: r.sessions }));
}

export interface AnalyticsProductSummary {
  itemName: string;
  itemsViewed: number;
  itemsAddedToCart: number;
  itemsPurchased: number;
  itemRevenue: number;
}

export function aggregateByProduct(rows: AnalyticsProductRow[]): AnalyticsProductSummary[] {
  const byProduct = new Map<string, { itemsViewed: number; itemsAddedToCart: number; itemsPurchased: number; itemRevenue: number }>();
  for (const row of rows) {
    const entry = byProduct.get(row.itemName) || { itemsViewed: 0, itemsAddedToCart: 0, itemsPurchased: 0, itemRevenue: 0 };
    entry.itemsViewed += row.itemsViewed;
    entry.itemsAddedToCart += row.itemsAddedToCart;
    entry.itemsPurchased += row.itemsPurchased;
    entry.itemRevenue += row.itemRevenue;
    byProduct.set(row.itemName, entry);
  }
  return Array.from(byProduct.entries())
    .map(([itemName, v]) => ({ itemName, ...v }))
    .sort((a, b) => b.itemsViewed - a.itemsViewed);
}

export interface AnalyticsUtmSummary {
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
  sessions: number;
  conversions: number;
  revenue: number;
}

export function aggregateByUtm(rows: AnalyticsUtmRow[]): AnalyticsUtmSummary[] {
  const byUtm = new Map<string, AnalyticsUtmSummary>();
  for (const row of rows) {
    const key = `${row.source}__${row.medium}__${row.campaign}__${row.term}__${row.content}`;
    const entry = byUtm.get(key) || { source: row.source, medium: row.medium, campaign: row.campaign, term: row.term, content: row.content, sessions: 0, conversions: 0, revenue: 0 };
    entry.sessions += row.sessions;
    entry.conversions += row.conversions;
    entry.revenue += row.revenue;
    byUtm.set(key, entry);
  }
  return Array.from(byUtm.values()).sort((a, b) => b.sessions - a.sessions);
}
