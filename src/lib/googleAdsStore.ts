// Only ever import this from route.ts handlers (server-only by nature in the
// App Router) — mirrors credentialsStore.ts's pattern for the same Blob store.
import { get, put } from "@vercel/blob";

const PATHNAME = "dashboard/google-ads-data.json";

export interface GoogleAdsRow {
  date: string; // YYYY-MM-DD
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

interface GoogleAdsData {
  updatedAt: string;
  rows: GoogleAdsRow[];
  keywords: GoogleAdsKeywordRow[];
  conversionBreakdown: GoogleAdsConversionRow[];
}

const emptyData: GoogleAdsData = { updatedAt: "", rows: [], keywords: [], conversionBreakdown: [] };

export async function getGoogleAdsData(): Promise<GoogleAdsData> {
  try {
    const result = await get(PATHNAME, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200) return emptyData;
    const text = await new Response(result.stream).text();
    return { ...emptyData, ...JSON.parse(text) };
  } catch (error) {
    console.error("Failed to read Google Ads data:", error);
    return emptyData;
  }
}

interface SaveGoogleAdsDataInput {
  rows: GoogleAdsRow[];
  keywords: GoogleAdsKeywordRow[];
  conversionBreakdown: GoogleAdsConversionRow[];
}

export async function saveGoogleAdsData({ rows, keywords, conversionBreakdown }: SaveGoogleAdsDataInput): Promise<void> {
  const data: GoogleAdsData = { updatedAt: new Date().toISOString(), rows, keywords, conversionBreakdown };
  await put(PATHNAME, JSON.stringify(data), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}
