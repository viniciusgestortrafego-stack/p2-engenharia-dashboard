import { getStoredCredentials } from "@/lib/credentialsStore";
import { NextResponse } from "next/server";
import { formatGa4Date, listConversionEventNames, rowsToObjects, runReport } from "@/lib/ga4Api";

// Public — same policy as the rest of the dashboard's data routes.
// Pulls live from the Google Analytics Data API (GA4) — see src/lib/ga4Api.ts.

export const dynamic = "force-dynamic";

const WINDOW_DAYS = 90;

function dateWindow(): { since: string; until: string } {
  const until = new Date();
  const since = new Date();
  since.setDate(since.getDate() - (WINDOW_DAYS - 1));
  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  return { since: toISO(since), until: toISO(until) };
}

export async function GET() {
  // Propriedade digitada em Configurações; sem ela, a variável do projeto.
  const propertyId = (await getStoredCredentials()).ga4PropertyId.trim() || process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
  if (!propertyId) {
    return NextResponse.json({ daily: [], channels: [], conversionBreakdown: [], conversionEventNames: [], products: [], utms: [] });
  }

  try {
    const { since, until } = dateWindow();

    const [dailyResult, channelResult, conversionEventNames, productResult, utmResult] = await Promise.all([
      runReport({
        propertyId,
        dimensions: ["date"],
        metrics: ["sessions", "activeUsers", "engagementRate"],
        since,
        until,
      }),
      runReport({
        propertyId,
        dimensions: ["date", "sessionDefaultChannelGroup"],
        metrics: ["sessions", "activeUsers", "conversions"],
        since,
        until,
      }),
      listConversionEventNames(propertyId),
      // Ecommerce item report — which products people actually looked at, added to
      // cart, and bought (e-commerce only; not meaningful for a lead-gen account).
      runReport({
        propertyId,
        dimensions: ["date", "itemName"],
        metrics: ["itemsViewed", "itemsAddedToCart", "itemsPurchased", "itemRevenue"],
        since,
        until,
      }),
      // Raw UTM parameters (not the bucketed channel group above) — source, medium,
      // campaign, term, content — so traffic can be traced back to the exact ad/post.
      runReport({
        propertyId,
        dimensions: ["date", "sessionSource", "sessionMedium", "sessionCampaignName", "sessionManualTerm", "sessionManualAdContent"],
        metrics: ["sessions", "conversions", "purchaseRevenue"],
        since,
        until,
      }),
    ]);

    const conversionResult =
      conversionEventNames.length > 0
        ? await runReport({
            propertyId,
            dimensions: ["date", "eventName"],
            metrics: ["eventCount"],
            since,
            until,
            dimensionFilter: {
              filter: {
                fieldName: "eventName",
                inListFilter: { values: conversionEventNames },
              },
            },
          })
        : { dimensionHeaders: [], metricHeaders: [] };

    const daily = rowsToObjects(dailyResult).map((r) => ({
      date: formatGa4Date(r.date),
      sessions: Number(r.sessions || 0),
      activeUsers: Number(r.activeUsers || 0),
      engagementRate: Number(r.engagementRate || 0),
    }));

    const channels = rowsToObjects(channelResult).map((r) => ({
      date: formatGa4Date(r.date),
      channel: r.sessionDefaultChannelGroup || "Outro",
      sessions: Number(r.sessions || 0),
      activeUsers: Number(r.activeUsers || 0),
      conversions: Number(r.conversions || 0),
    }));

    const conversionBreakdown = rowsToObjects(conversionResult).map((r) => ({
      date: formatGa4Date(r.date),
      eventName: r.eventName,
      count: Number(r.eventCount || 0),
    }));

    const products = rowsToObjects(productResult).map((r) => ({
      date: formatGa4Date(r.date),
      itemName: r.itemName || "(sem nome)",
      itemsViewed: Number(r.itemsViewed || 0),
      itemsAddedToCart: Number(r.itemsAddedToCart || 0),
      itemsPurchased: Number(r.itemsPurchased || 0),
      itemRevenue: Number(r.itemRevenue || 0),
    }));

    const utms = rowsToObjects(utmResult).map((r) => ({
      date: formatGa4Date(r.date),
      source: r.sessionSource || "(direct)",
      medium: r.sessionMedium || "(none)",
      campaign: r.sessionCampaignName || "(not set)",
      term: r.sessionManualTerm || "(not set)",
      content: r.sessionManualAdContent || "(not set)",
      sessions: Number(r.sessions || 0),
      conversions: Number(r.conversions || 0),
      revenue: Number(r.purchaseRevenue || 0),
    }));

    return NextResponse.json({ daily, channels, conversionBreakdown, conversionEventNames, products, utms });
  } catch (error) {
    console.error("GA4 API error:", error);
    return NextResponse.json({ error: "Erro ao buscar dados do Analytics" }, { status: 500 });
  }
}
