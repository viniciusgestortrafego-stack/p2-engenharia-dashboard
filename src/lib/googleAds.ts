export interface GoogleAdsRow {
  date: string;
  campaignId: string;
  campaignName: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionValue: number;
}

export interface GoogleAdsKeywordRow {
  date: string;
  keyword: string;
  matchType: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionValue: number;
}

export interface GoogleAdsConversionRow {
  date: string;
  conversionActionName: string;
  conversions: number;
  conversionValue: number;
}

export class GoogleAdsFetchError extends Error {}

export interface GoogleAdsData {
  rows: GoogleAdsRow[];
  keywords: GoogleAdsKeywordRow[];
  conversionBreakdown: GoogleAdsConversionRow[];
  conversionActionNames: string[];
  conversionActionCategories: Record<string, string>;
}

export async function fetchGoogleAdsData(): Promise<GoogleAdsData> {
  const response = await fetch("/api/google-ads/data");
  if (!response.ok) {
    throw new GoogleAdsFetchError("Erro ao buscar dados do Google Ads");
  }
  const data = await response.json();
  return {
    rows: (data.rows as GoogleAdsRow[]) || [],
    keywords: (data.keywords as GoogleAdsKeywordRow[]) || [],
    conversionBreakdown: (data.conversionBreakdown as GoogleAdsConversionRow[]) || [],
    conversionActionNames: (data.conversionActionNames as string[]) || [],
    conversionActionCategories: (data.conversionActionCategories as Record<string, string>) || {},
  };
}

function filterByDateRange<T extends { date: string }>(rows: T[], from: string, to: string): T[] {
  return rows.filter((row) => row.date >= from && row.date <= to);
}

export function filterGoogleAdsRowsByRange(rows: GoogleAdsRow[], from: string, to: string): GoogleAdsRow[] {
  return filterByDateRange(rows, from, to);
}

export interface GoogleAdsTotals {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionValue: number;
  cpc: number;
  cpm: number;
  ctr: number;
  costPerConversion: number;
  roas: number;
}

export function aggregateGoogleAdsRows(rows: GoogleAdsRow[]): GoogleAdsTotals {
  const spend = rows.reduce((acc, row) => acc + row.spend, 0);
  const impressions = rows.reduce((acc, row) => acc + row.impressions, 0);
  const clicks = rows.reduce((acc, row) => acc + row.clicks, 0);
  const conversions = rows.reduce((acc, row) => acc + row.conversions, 0);
  const conversionValue = rows.reduce((acc, row) => acc + row.conversionValue, 0);

  return {
    spend,
    impressions,
    clicks,
    conversions,
    conversionValue,
    cpc: clicks > 0 ? spend / clicks : 0,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    costPerConversion: conversions > 0 ? spend / conversions : 0,
    roas: spend > 0 ? conversionValue / spend : 0,
  };
}

export interface GoogleAdsCampaignRow {
  id: string;
  name: string;
  spend: number;
  impressions: number;
  clicks: number;
  cpc: number;
  cpm: number;
  conversions: number;
  costPerConversion: number;
  conversionValue: number;
  roas: number;
}

export function aggregateGoogleAdsByCampaign(rows: GoogleAdsRow[]): GoogleAdsCampaignRow[] {
  const byCampaign = new Map<string, { name: string; spend: number; impressions: number; clicks: number; conversions: number; conversionValue: number }>();

  for (const row of rows) {
    const entry = byCampaign.get(row.campaignId) || { name: row.campaignName, spend: 0, impressions: 0, clicks: 0, conversions: 0, conversionValue: 0 };
    entry.spend += row.spend;
    entry.impressions += row.impressions;
    entry.clicks += row.clicks;
    entry.conversions += row.conversions;
    entry.conversionValue += row.conversionValue;
    byCampaign.set(row.campaignId, entry);
  }

  return Array.from(byCampaign.entries())
    .map(([id, c]) => ({
      id,
      name: c.name,
      spend: c.spend,
      impressions: c.impressions,
      clicks: c.clicks,
      cpc: c.clicks > 0 ? c.spend / c.clicks : 0,
      cpm: c.impressions > 0 ? (c.spend / c.impressions) * 1000 : 0,
      conversions: c.conversions,
      costPerConversion: c.conversions > 0 ? c.spend / c.conversions : 0,
      conversionValue: c.conversionValue,
      roas: c.spend > 0 ? c.conversionValue / c.spend : 0,
    }))
    .sort((a, b) => b.spend - a.spend);
}

export interface GoogleAdsDailyPoint {
  date: string;
  spend: number;
}

export function aggregateGoogleAdsByDay(rows: GoogleAdsRow[]): GoogleAdsDailyPoint[] {
  const byDate = new Map<string, number>();
  for (const row of rows) {
    byDate.set(row.date, (byDate.get(row.date) || 0) + row.spend);
  }
  return Array.from(byDate.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, spend]) => ({ date, spend }));
}

export function filterKeywordsByRange(rows: GoogleAdsKeywordRow[], from: string, to: string): GoogleAdsKeywordRow[] {
  return filterByDateRange(rows, from, to);
}

export interface GoogleAdsKeywordSummary {
  keyword: string;
  matchType: string;
  spend: number;
  impressions: number;
  clicks: number;
  cpc: number;
  conversions: number;
  costPerConversion: number;
}

export function aggregateGoogleAdsByKeyword(rows: GoogleAdsKeywordRow[]): GoogleAdsKeywordSummary[] {
  const byKeyword = new Map<string, { matchType: string; spend: number; impressions: number; clicks: number; conversions: number }>();

  for (const row of rows) {
    const key = `${row.keyword}__${row.matchType}`;
    const entry = byKeyword.get(key) || { matchType: row.matchType, spend: 0, impressions: 0, clicks: 0, conversions: 0 };
    entry.spend += row.spend;
    entry.impressions += row.impressions;
    entry.clicks += row.clicks;
    entry.conversions += row.conversions;
    byKeyword.set(key, entry);
  }

  return Array.from(byKeyword.entries())
    .map(([key, k]) => ({
      keyword: key.split("__")[0],
      matchType: k.matchType,
      spend: k.spend,
      impressions: k.impressions,
      clicks: k.clicks,
      cpc: k.clicks > 0 ? k.spend / k.clicks : 0,
      conversions: k.conversions,
      costPerConversion: k.conversions > 0 ? k.spend / k.conversions : 0,
    }))
    .sort((a, b) => b.spend - a.spend);
}

export function filterConversionsByRange(rows: GoogleAdsConversionRow[], from: string, to: string): GoogleAdsConversionRow[] {
  return filterByDateRange(rows, from, to);
}

export interface GoogleAdsConversionSummary {
  name: string;
  conversions: number;
  conversionValue: number;
}

export function aggregateConversionBreakdown(rows: GoogleAdsConversionRow[]): GoogleAdsConversionSummary[] {
  const byAction = new Map<string, { conversions: number; conversionValue: number }>();
  for (const row of rows) {
    const entry = byAction.get(row.conversionActionName) || { conversions: 0, conversionValue: 0 };
    entry.conversions += row.conversions;
    entry.conversionValue += row.conversionValue;
    byAction.set(row.conversionActionName, entry);
  }
  return Array.from(byAction.entries())
    .map(([name, v]) => ({ name, conversions: v.conversions, conversionValue: v.conversionValue }))
    .sort((a, b) => b.conversions - a.conversions);
}
