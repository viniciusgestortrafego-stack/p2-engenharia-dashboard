import { SalesBaseMetrics, SalesRow, deriveSalesMetrics } from "./sales";

// Validated categorical palette (fixed hue order, CVD-safe adjacent pairs) — see the
// data-viz palette reference. Never reorder or cycle; slots are assigned in sequence.
const PALETTE = ["#2a78d6", "#1baf7a", "#eda100", "#008300", "#4a3aa7", "#e34948", "#e87ba4", "#eb6834"];

export class MetaFetchError extends Error {}

interface FetchBreakdownParams {
  adAccountId: string;
  breakdowns: string[];
  since: string;
  until: string;
  formatLabel?: (row: Record<string, unknown>) => string;
}

export interface BreakdownItem {
  name: string;
  value: number;
  color: string;
}

function normalizeAccountId(id: string): string {
  return id.startsWith("act_") ? id : `act_${id}`;
}

function labelForRow(row: Record<string, unknown>, breakdowns: string[]): string {
  const parts = breakdowns.map((key) => row[key]).filter((value): value is string => Boolean(value));
  return parts.length > 0 ? parts.join(" - ") : "Não identificado";
}

const GENDER_LABELS: Record<string, string> = { male: "Masculino", female: "Feminino", unknown: "Não informado" };
const DEVICE_LABELS: Record<string, string> = { mobile_app: "App Mobile", mobile_web: "Web Mobile", desktop: "Desktop" };

export function formatAgeGenderLabel(row: Record<string, unknown>): string {
  const age = String(row.age ?? "");
  const gender = String(row.gender ?? "");
  const genderLabel = GENDER_LABELS[gender] ?? gender;
  if (age && genderLabel) return `${age} anos • ${genderLabel}`;
  return age || genderLabel || "Não identificado";
}

export function formatDeviceLabel(row: Record<string, unknown>): string {
  const device = String(row.device_platform ?? "");
  return DEVICE_LABELS[device] ?? (device || "Não identificado");
}

// Meta reports the SAME conversion under several overlapping action_type entries
// (e.g. "omni_purchase", "offsite_conversion.fb_pixel_purchase", "purchase" can all
// appear for one purchase event). Summing every match double/triple-counts the same
// sale, so we pick exactly one entry per metric, preferring the most reliable type.
const PURCHASE_ACTION_TYPES = ["omni_purchase", "offsite_conversion.fb_pixel_purchase", "purchase", "onsite_web_purchase", "web_in_store_purchase"];
const LANDING_PAGE_VIEW_ACTION_TYPES = ["landing_page_view", "omni_landing_page_view"];
const INITIATE_CHECKOUT_ACTION_TYPES = ["omni_initiated_checkout", "offsite_conversion.fb_pixel_initiate_checkout", "initiate_checkout", "onsite_web_initiate_checkout"];
// "offsite_conversion.fb_pixel_custom" is listed last: this account's site fires
// Contact via a custom pixel event rather than Meta's standard "Contact" event, so
// Meta buckets it under the generic custom-conversion action_type instead of
// fb_pixel_contact. Only queried within [LEAD]-filtered campaigns, where it's the
// account's sole custom conversion, so it's safe to treat as the contact count here.
const CONTACT_ACTION_TYPES = ["omni_contact", "offsite_conversion.fb_pixel_contact", "contact", "onsite_web_contact", "on_facebook_contact", "offsite_conversion.fb_pixel_custom"];

function pickActionValue(actions: unknown, candidates: string[], fallbackKeyword: string): number {
  if (!Array.isArray(actions)) return 0;
  for (const type of candidates) {
    const match = actions.find((action) => action?.action_type === type);
    if (match) return parseFloat(match.value) || 0;
  }
  // Last-resort fuzzy match, still picking only ONE entry (never summed) to avoid
  // double-counting if the account uses an action_type not in our known list.
  const fallback = actions.find((action) => typeof action?.action_type === "string" && action.action_type.includes(fallbackKeyword));
  return fallback ? parseFloat(fallback.value) || 0 : 0;
}

function sumPurchaseActions(actions: unknown): number {
  return pickActionValue(actions, PURCHASE_ACTION_TYPES, "purchase");
}

// action_values has the same shape as actions, but "value" holds the monetary total instead of a count.
function sumPurchaseValues(actionValues: unknown): number {
  return pickActionValue(actionValues, PURCHASE_ACTION_TYPES, "purchase");
}

function sumLandingPageViews(actions: unknown): number {
  return pickActionValue(actions, LANDING_PAGE_VIEW_ACTION_TYPES, "landing_page_view");
}

function sumInitiatedCheckouts(actions: unknown): number {
  return pickActionValue(actions, INITIATE_CHECKOUT_ACTION_TYPES, "initiate_checkout");
}

function sumContactActions(actions: unknown): number {
  return pickActionValue(actions, CONTACT_ACTION_TYPES, "contact");
}

function sumContactValues(actionValues: unknown): number {
  return pickActionValue(actionValues, CONTACT_ACTION_TYPES, "contact");
}

// Every campaign that belongs to lead-generation efforts is tagged "[LEAD]" in its
// name by convention, so every lead-focused query is scoped to just those campaigns
// instead of the whole ad account (which also runs e-commerce/sales campaigns).
const LEAD_CAMPAIGN_FILTERING = JSON.stringify([{ field: "campaign.name", operator: "CONTAIN", value: "[LEAD]" }]);

export async function fetchPurchaseBreakdown({ adAccountId, breakdowns, since, until, formatLabel }: FetchBreakdownParams): Promise<BreakdownItem[]> {
  const params = new URLSearchParams({
    endpoint: `${normalizeAccountId(adAccountId)}/insights`,
    fields: "spend,actions",
    breakdowns: breakdowns.join(","),
    level: "account",
    time_range: JSON.stringify({ since, until }),
    limit: "500",
  });

  const response = await fetch(`/api/meta?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new MetaFetchError(data.error || "Erro ao buscar dados do Meta Ads");
  }

  const rows: Record<string, unknown>[] = data.data || [];

  const totals = new Map<string, number>();
  for (const row of rows) {
    const label = formatLabel ? formatLabel(row) : labelForRow(row, breakdowns);
    const purchases = sumPurchaseActions(row.actions);
    totals.set(label, (totals.get(label) || 0) + purchases);
  }

  return Array.from(totals.entries())
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], index) => ({ name, value, color: PALETTE[index % PALETTE.length] }));
}

interface FetchEntityPerformanceParams {
  adAccountId: string;
  level: "ad" | "adset";
  since: string;
  until: string;
}

export interface EntityPerformanceRow {
  id: string;
  name: string;
  spend: number;
  purchases: number;
  cpa: number;
  revenue: number;
  roas: number;
  managerUrl: string;
  thumbnailUrl?: string;
  permalinkUrl?: string;
}

function buildManagerUrl(accountId: string, level: "ad" | "adset", id: string): string {
  const bareAccountId = accountId.replace(/^act_/, "");
  const section = level === "ad" ? "ads" : "adsets";
  const idParam = level === "ad" ? "selected_ad_ids" : "selected_adset_ids";
  return `https://www.facebook.com/adsmanager/manage/${section}?act=${bareAccountId}&${idParam}=${id}`;
}

interface CreativeInfo {
  thumbnailUrl?: string;
  permalinkUrl?: string;
}

async function fetchCreativeInfoMap(adAccountId: string): Promise<Map<string, CreativeInfo>> {
  const params = new URLSearchParams({
    endpoint: `${normalizeAccountId(adAccountId)}/ads`,
    fields: "id,creative{thumbnail_url,image_url,instagram_permalink_url}",
    limit: "500",
  });

  const response = await fetch(`/api/meta?${params.toString()}`);
  const data = await response.json();
  if (!response.ok) return new Map();

  const map = new Map<string, CreativeInfo>();
  const ads: Record<string, unknown>[] = data.data || [];
  for (const ad of ads) {
    const creative = ad.creative as Record<string, unknown> | undefined;
    if (!creative) continue;
    map.set(String(ad.id), {
      thumbnailUrl: (creative.thumbnail_url as string) || (creative.image_url as string) || undefined,
      permalinkUrl: (creative.instagram_permalink_url as string) || undefined,
    });
  }
  return map;
}

export async function fetchEntityPerformance({ adAccountId, level, since, until }: FetchEntityPerformanceParams): Promise<EntityPerformanceRow[]> {
  const idField = level === "ad" ? "ad_id" : "adset_id";
  const nameField = level === "ad" ? "ad_name" : "adset_name";

  const params = new URLSearchParams({
    endpoint: `${normalizeAccountId(adAccountId)}/insights`,
    fields: `${idField},${nameField},spend,actions,action_values`,
    level,
    time_range: JSON.stringify({ since, until }),
    limit: "500",
  });

  const [insightsResponse, creativeMap] = await Promise.all([
    fetch(`/api/meta?${params.toString()}`),
    level === "ad" ? fetchCreativeInfoMap(adAccountId) : Promise.resolve(new Map<string, CreativeInfo>()),
  ]);
  const data = await insightsResponse.json();

  if (!insightsResponse.ok) {
    throw new MetaFetchError(data.error || "Erro ao buscar dados do Meta Ads");
  }

  const rows: Record<string, unknown>[] = data.data || [];

  return rows
    .map((row) => {
      const id = String(row[idField] ?? "");
      const name = String(row[nameField] ?? "Sem nome");
      const spend = parseFloat(String(row.spend ?? "0")) || 0;
      const purchases = sumPurchaseActions(row.actions);
      const revenue = sumPurchaseValues(row.action_values);
      const creative = creativeMap.get(id);
      return {
        id,
        name,
        spend,
        purchases,
        cpa: purchases > 0 ? spend / purchases : 0,
        revenue,
        roas: spend > 0 ? revenue / spend : 0,
        managerUrl: buildManagerUrl(adAccountId, level, id),
        thumbnailUrl: creative?.thumbnailUrl,
        permalinkUrl: creative?.permalinkUrl,
      };
    })
    .sort((a, b) => b.spend - a.spend);
}

// Same shape as fetchEntityPerformance, but scoped to [LEAD]-tagged campaigns and
// counting "contact" conversions (purchases/revenue fields carry contact count/value here).
export async function fetchLeadEntityPerformance({ adAccountId, level, since, until }: FetchEntityPerformanceParams): Promise<EntityPerformanceRow[]> {
  const idField = level === "ad" ? "ad_id" : "adset_id";
  const nameField = level === "ad" ? "ad_name" : "adset_name";

  const params = new URLSearchParams({
    endpoint: `${normalizeAccountId(adAccountId)}/insights`,
    fields: `${idField},${nameField},spend,actions,action_values`,
    level,
    time_range: JSON.stringify({ since, until }),
    filtering: LEAD_CAMPAIGN_FILTERING,
    limit: "500",
  });

  const [insightsResponse, creativeMap] = await Promise.all([
    fetch(`/api/meta?${params.toString()}`),
    level === "ad" ? fetchCreativeInfoMap(adAccountId) : Promise.resolve(new Map<string, CreativeInfo>()),
  ]);
  const data = await insightsResponse.json();

  if (!insightsResponse.ok) {
    throw new MetaFetchError(data.error || "Erro ao buscar dados do Meta Ads");
  }

  const rows: Record<string, unknown>[] = data.data || [];

  return rows
    .map((row) => {
      const id = String(row[idField] ?? "");
      const name = String(row[nameField] ?? "Sem nome");
      const spend = parseFloat(String(row.spend ?? "0")) || 0;
      const contacts = sumContactActions(row.actions);
      const revenue = sumContactValues(row.action_values);
      const creative = creativeMap.get(id);
      return {
        id,
        name,
        spend,
        purchases: contacts,
        cpa: contacts > 0 ? spend / contacts : 0,
        revenue,
        roas: spend > 0 ? revenue / spend : 0,
        managerUrl: buildManagerUrl(adAccountId, level, id),
        thumbnailUrl: creative?.thumbnailUrl,
        permalinkUrl: creative?.permalinkUrl,
      };
    })
    .sort((a, b) => b.purchases - a.purchases);
}

interface FetchDailySalesRowsParams {
  adAccountId: string;
  since: string;
  until: string;
}

export async function fetchDailySalesRows({ adAccountId, since, until }: FetchDailySalesRowsParams): Promise<SalesRow[]> {
  const params = new URLSearchParams({
    endpoint: `${normalizeAccountId(adAccountId)}/insights`,
    fields: "spend,clicks,impressions,actions,action_values",
    level: "account",
    time_increment: "1",
    time_range: JSON.stringify({ since, until }),
    limit: "500",
  });

  const response = await fetch(`/api/meta?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new MetaFetchError(data.error || "Erro ao buscar dados do Meta Ads");
  }

  const rows: Record<string, unknown>[] = data.data || [];

  return rows.map((row) => {
    const dateRaw = String(row.date_start ?? "");
    const base = {
      investimento: parseFloat(String(row.spend ?? "0")) || 0,
      compras: sumPurchaseActions(row.actions),
      receita: sumPurchaseValues(row.action_values),
      impressoes: parseFloat(String(row.impressions ?? "0")) || 0,
      cliques: parseFloat(String(row.clicks ?? "0")) || 0,
      visitasLP: sumLandingPageViews(row.actions),
      checkoutsIniciados: sumInitiatedCheckouts(row.actions),
    };
    return {
      date: dateRaw,
      dateObj: dateRaw ? new Date(`${dateRaw}T00:00:00`) : null,
      ...base,
      ...deriveSalesMetrics(base),
    };
  });
}

export async function fetchDailyLeadRows({ adAccountId, since, until }: FetchDailySalesRowsParams): Promise<SalesRow[]> {
  const params = new URLSearchParams({
    endpoint: `${normalizeAccountId(adAccountId)}/insights`,
    fields: "spend,clicks,impressions,actions,action_values",
    level: "campaign",
    time_increment: "1",
    time_range: JSON.stringify({ since, until }),
    filtering: LEAD_CAMPAIGN_FILTERING,
    limit: "500",
  });

  const response = await fetch(`/api/meta?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new MetaFetchError(data.error || "Erro ao buscar dados do Meta Ads");
  }

  const rows: Record<string, unknown>[] = data.data || [];

  // level=campaign can return several [LEAD] campaigns per day; group and sum
  // them into one row per date so the funnel reflects the whole tag, not one campaign.
  const byDate = new Map<string, SalesBaseMetrics>();
  for (const row of rows) {
    const dateRaw = String(row.date_start ?? "");
    const existing = byDate.get(dateRaw) || { investimento: 0, compras: 0, receita: 0, impressoes: 0, cliques: 0, visitasLP: 0, checkoutsIniciados: 0 };
    existing.investimento += parseFloat(String(row.spend ?? "0")) || 0;
    existing.compras += sumContactActions(row.actions);
    existing.receita += sumContactValues(row.action_values);
    existing.impressoes += parseFloat(String(row.impressions ?? "0")) || 0;
    existing.cliques += parseFloat(String(row.clicks ?? "0")) || 0;
    existing.visitasLP += sumLandingPageViews(row.actions);
    existing.checkoutsIniciados += sumInitiatedCheckouts(row.actions);
    byDate.set(dateRaw, existing);
  }

  return Array.from(byDate.entries()).map(([dateRaw, base]) => ({
    date: dateRaw,
    dateObj: dateRaw ? new Date(`${dateRaw}T00:00:00`) : null,
    ...base,
    ...deriveSalesMetrics(base),
  }));
}

interface FetchCampaignPerformanceParams {
  adAccountId: string;
  since: string;
  until: string;
}

export interface CampaignPerformanceRow {
  id: string;
  name: string;
  impressions: number;
  clicks: number;
  cpc: number;
  cpm: number;
  checkoutsIniciados: number;
  custoPorCheckout: number;
  purchases: number;
  cpa: number;
  spend: number;
  revenue: number;
  grossProfit: number;
}

export async function fetchCampaignPerformance({ adAccountId, since, until }: FetchCampaignPerformanceParams): Promise<CampaignPerformanceRow[]> {
  const params = new URLSearchParams({
    endpoint: `${normalizeAccountId(adAccountId)}/insights`,
    fields: "campaign_id,campaign_name,spend,impressions,clicks,actions,action_values",
    level: "campaign",
    time_range: JSON.stringify({ since, until }),
    limit: "500",
  });

  const response = await fetch(`/api/meta?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new MetaFetchError(data.error || "Erro ao buscar dados do Meta Ads");
  }

  const rows: Record<string, unknown>[] = data.data || [];

  return rows
    .map((row) => {
      const spend = parseFloat(String(row.spend ?? "0")) || 0;
      const impressions = parseFloat(String(row.impressions ?? "0")) || 0;
      const clicks = parseFloat(String(row.clicks ?? "0")) || 0;
      const checkoutsIniciados = sumInitiatedCheckouts(row.actions);
      const purchases = sumPurchaseActions(row.actions);
      const revenue = sumPurchaseValues(row.action_values);
      return {
        id: String(row.campaign_id ?? ""),
        name: String(row.campaign_name ?? "Sem nome"),
        impressions,
        clicks,
        cpc: clicks > 0 ? spend / clicks : 0,
        cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
        checkoutsIniciados,
        custoPorCheckout: checkoutsIniciados > 0 ? spend / checkoutsIniciados : 0,
        purchases,
        cpa: purchases > 0 ? spend / purchases : 0,
        spend,
        revenue,
        grossProfit: revenue - spend,
      };
    })
    .sort((a, b) => b.spend - a.spend);
}
