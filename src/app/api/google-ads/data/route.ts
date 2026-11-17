import { NextResponse } from "next/server";
import { microsToUnits, runGaqlQuery } from "@/lib/googleAdsApi";
import { getStoredCredentials } from "@/lib/credentialsStore";

// Public — same policy as the rest of the dashboard's data routes (only
// /api/credentials and the ingest webhook are gated). Pulls live from the
// Google Ads API (see src/lib/googleAdsApi.ts) instead of the Blob-stored
// data that /api/google-ads/ingest used to populate.

export const dynamic = "force-dynamic";

const WINDOW_DAYS = 90;

function dateWindow(): string {
  const until = new Date();
  const since = new Date();
  since.setDate(since.getDate() - (WINDOW_DAYS - 1));
  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  return `segments.date BETWEEN '${toISO(since)}' AND '${toISO(until)}'`;
}

interface CampaignApiRow {
  segments: { date: string };
  campaign: { id: string; name: string };
  metrics: { costMicros?: string; impressions?: string; clicks?: string; allConversions?: number; allConversionsValue?: number };
}

interface KeywordApiRow {
  segments: { date: string };
  adGroupCriterion: { keyword: { text: string; matchType: string } };
  metrics: { costMicros?: string; impressions?: string; clicks?: string; allConversions?: number; allConversionsValue?: number };
}

interface ConversionApiRow {
  segments: { date: string; conversionActionName?: string };
  metrics: { allConversions?: number; allConversionsValue?: number };
}

interface ConversionActionApiRow {
  conversionAction: { name: string; status: string; category: string };
}

export async function GET() {
  // Conta digitada em Configurações; sem ela, a variável do projeto.
  const salvas = await getStoredCredentials();
  const customerId = (salvas.googleAdsCustomerId || process.env.GOOGLE_ADS_CUSTOMER_ID || "").replace(/\D/g, "");
  if (!customerId) {
    return NextResponse.json({ rows: [], keywords: [], conversionBreakdown: [], conversionActionNames: [], conversionActionCategories: {} });
  }

  try {
    const [campaignResults, keywordResults, conversionResults, conversionActionResults] = await Promise.all([
      runGaqlQuery<CampaignApiRow>(
        customerId,
        `SELECT segments.date, campaign.id, campaign.name, metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.all_conversions, metrics.all_conversions_value
         FROM campaign WHERE ${dateWindow()}`
      ),
      runGaqlQuery<KeywordApiRow>(
        customerId,
        `SELECT segments.date, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.all_conversions, metrics.all_conversions_value
         FROM keyword_view WHERE ${dateWindow()}`
      ),
      // Segmenting by conversion_action_name breaks totals out per action (add to cart,
      // begin checkout, purchase, etc.) — all_conversions includes every action, not just
      // the ones counted toward the account's primary "Conversions" metric.
      runGaqlQuery<ConversionApiRow>(
        customerId,
        `SELECT segments.date, segments.conversion_action_name, metrics.all_conversions, metrics.all_conversions_value
         FROM campaign WHERE ${dateWindow()} AND metrics.all_conversions > 0`
      ),
      // Full catalog of tracked goals with their category (ADD_TO_CART, BEGIN_CHECKOUT,
      // PURCHASE, ...) so the dashboard can build a real e-commerce funnel instead of
      // guessing from action names.
      runGaqlQuery<ConversionActionApiRow>(
        customerId,
        `SELECT conversion_action.name, conversion_action.status, conversion_action.category FROM conversion_action WHERE conversion_action.status = 'ENABLED'`
      ),
    ]);

    const rows = campaignResults.map((r) => ({
      date: r.segments.date,
      campaignId: r.campaign.id,
      campaignName: r.campaign.name,
      spend: microsToUnits(r.metrics.costMicros),
      impressions: Number(r.metrics.impressions || 0),
      clicks: Number(r.metrics.clicks || 0),
      conversions: Number(r.metrics.allConversions || 0),
      conversionValue: Number(r.metrics.allConversionsValue || 0),
    }));

    const keywords = keywordResults.map((r) => ({
      date: r.segments.date,
      keyword: r.adGroupCriterion.keyword.text,
      matchType: r.adGroupCriterion.keyword.matchType,
      spend: microsToUnits(r.metrics.costMicros),
      impressions: Number(r.metrics.impressions || 0),
      clicks: Number(r.metrics.clicks || 0),
      conversions: Number(r.metrics.allConversions || 0),
      conversionValue: Number(r.metrics.allConversionsValue || 0),
    }));

    const conversionBreakdown = conversionResults.map((r) => ({
      date: r.segments.date,
      conversionActionName: r.segments.conversionActionName || "Outros",
      conversions: Number(r.metrics.allConversions || 0),
      conversionValue: Number(r.metrics.allConversionsValue || 0),
    }));

    const conversionActionNames = conversionActionResults.map((r) => r.conversionAction.name);
    const conversionActionCategories: Record<string, string> = {};
    for (const r of conversionActionResults) {
      conversionActionCategories[r.conversionAction.name] = r.conversionAction.category;
    }

    return NextResponse.json({ rows, keywords, conversionBreakdown, conversionActionNames, conversionActionCategories });
  } catch (error) {
    console.error("Google Ads API error:", error);
    return NextResponse.json({ error: "Erro ao buscar dados do Google Ads" }, { status: 500 });
  }
}
