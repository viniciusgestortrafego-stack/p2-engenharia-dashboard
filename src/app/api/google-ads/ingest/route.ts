import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getStoredCredentials } from "@/lib/credentialsStore";
import { GoogleAdsConversionRow, GoogleAdsKeywordRow, GoogleAdsRow, saveGoogleAdsData } from "@/lib/googleAdsStore";

// Called by the Google Ads Script (server-to-server from Google's infra), not
// by a logged-in browser — so it's gated by a shared secret instead of the
// session cookie. Generate/rotate the secret in Settings.

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest, expectedSecret: string): boolean {
  if (!expectedSecret) return false;
  const provided = request.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(expectedSecret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function toArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

export async function POST(request: NextRequest) {
  const credentials = await getStoredCredentials();

  if (!isAuthorized(request, credentials.googleAdsWebhookSecret)) {
    return NextResponse.json({ error: "Chave inválida" }, { status: 401 });
  }

  const body = (await request.json()) as { rows?: unknown; keywords?: unknown; conversions?: unknown };
  if (!Array.isArray(body.rows)) {
    return NextResponse.json({ error: "Formato inválido: esperado { rows: [...] }" }, { status: 400 });
  }

  const rows: GoogleAdsRow[] = toArray(body.rows).map((r) => ({
    date: String(r.date ?? ""),
    campaignId: String(r.campaignId ?? ""),
    campaignName: String(r.campaignName ?? "Sem nome"),
    spend: Number(r.spend) || 0,
    impressions: Number(r.impressions) || 0,
    clicks: Number(r.clicks) || 0,
    conversions: Number(r.conversions) || 0,
    conversionValue: Number(r.conversionValue) || 0,
  }));

  const keywords: GoogleAdsKeywordRow[] = toArray(body.keywords).map((r) => ({
    date: String(r.date ?? ""),
    keyword: String(r.keyword ?? ""),
    matchType: String(r.matchType ?? ""),
    spend: Number(r.spend) || 0,
    impressions: Number(r.impressions) || 0,
    clicks: Number(r.clicks) || 0,
    conversions: Number(r.conversions) || 0,
    conversionValue: Number(r.conversionValue) || 0,
  }));

  const conversionBreakdown: GoogleAdsConversionRow[] = toArray(body.conversions).map((r) => ({
    date: String(r.date ?? ""),
    conversionActionName: String(r.conversionActionName ?? "Não identificado"),
    conversions: Number(r.conversions) || 0,
    conversionValue: Number(r.conversionValue) || 0,
  }));

  await saveGoogleAdsData({ rows, keywords, conversionBreakdown });

  return NextResponse.json({ ok: true, rowsSaved: rows.length, keywordsSaved: keywords.length, conversionsSaved: conversionBreakdown.length });
}
