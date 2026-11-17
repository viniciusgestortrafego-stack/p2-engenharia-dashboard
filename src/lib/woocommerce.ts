export class WooFetchError extends Error {}

// Same validated categorical palette used across the dashboard's charts.
const PALETTE = ["#2a78d6", "#1baf7a", "#eda100", "#008300", "#4a3aa7", "#e34948", "#e87ba4", "#eb6834"];

// Orders in these statuses don't represent real/confirmed revenue.
const EXCLUDED_STATUSES = new Set(["cancelled", "failed", "trash"]);

interface WooOrderQueryParams {
  wooStoreUrl: string;
  since: string;
  until: string;
}

export interface UtmBreakdownItem {
  name: string;
  value: number;
  orders: number;
  color: string;
}

async function fetchOrders({ wooStoreUrl, since, until }: WooOrderQueryParams): Promise<Record<string, unknown>[]> {
  const after = new Date(`${since}T00:00:00`).toISOString();
  const before = new Date(`${until}T23:59:59`).toISOString();

  const orders: Record<string, unknown>[] = [];
  const MAX_PAGES = 10;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const params = new URLSearchParams({
      storeUrl: wooStoreUrl,
      endpoint: "orders",
      after,
      before,
      per_page: "100",
      page: String(page),
      orderby: "date",
      order: "desc",
    });

    const response = await fetch(`/api/woocommerce?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw new WooFetchError(data.error || "Erro ao buscar pedidos do WooCommerce");
    }

    const pageOrders: Record<string, unknown>[] = Array.isArray(data) ? data : [];
    orders.push(...pageOrders);
    if (pageOrders.length < 100) break;
  }

  return orders.filter((order) => !EXCLUDED_STATUSES.has(String(order.status ?? "")));
}

// WooCommerce's built-in "Order Attribution" feature (core since v8.5) stores UTM
// params as order meta_data. Plugin-based UTM trackers sometimes use slightly
// different keys, so we try a few known variants before giving up on a field.
function metaValue(order: Record<string, unknown>, keys: string[]): string {
  const meta = (order.meta_data as { key?: string; value?: unknown }[] | undefined) || [];
  for (const key of keys) {
    const entry = meta.find((item) => item.key === key);
    if (entry && entry.value) return String(entry.value);
  }
  return "";
}

function extractUtm(order: Record<string, unknown>): { source: string; campaign: string; content: string } {
  const source =
    metaValue(order, ["_wc_order_attribution_utm_source", "utm_source"]) ||
    metaValue(order, ["_wc_order_attribution_source_type"]) ||
    "Direto / Não identificado";
  const campaign = metaValue(order, ["_wc_order_attribution_utm_campaign", "utm_campaign"]) || "Não definida";
  // utm_content is the standard slot for identifying which ad/creative variation drove
  // the click (Meta's dynamic URL tags usually fill it with {{ad.name}} or {{ad.id}}).
  const content = metaValue(order, ["_wc_order_attribution_utm_content", "utm_content"]) || "Não definido";
  return { source, campaign, content };
}

type UtmDimension = "source" | "campaign" | "content";

function groupOrdersByUtm(orders: Record<string, unknown>[], groupBy: UtmDimension): UtmBreakdownItem[] {
  const totals = new Map<string, { revenue: number; orders: number }>();
  for (const order of orders) {
    const { source, campaign, content } = extractUtm(order);
    const label = groupBy === "source" ? source : groupBy === "campaign" ? campaign : content;
    const revenue = parseFloat(String(order.total ?? "0")) || 0;
    const entry = totals.get(label) || { revenue: 0, orders: 0 };
    entry.revenue += revenue;
    entry.orders += 1;
    totals.set(label, entry);
  }

  return Array.from(totals.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([name, { revenue, orders: orderCount }], index) => ({
      name,
      value: revenue,
      orders: orderCount,
      color: PALETTE[index % PALETTE.length],
    }));
}

interface FetchUtmBreakdownParams extends WooOrderQueryParams {
  groupBy: UtmDimension;
}

export async function fetchUtmBreakdown({ groupBy, ...queryParams }: FetchUtmBreakdownParams): Promise<UtmBreakdownItem[]> {
  const orders = await fetchOrders(queryParams);
  return groupOrdersByUtm(orders, groupBy);
}

interface FetchGoogleUtmBreakdownParams extends WooOrderQueryParams {
  groupBy: "campaign" | "content";
}

// Same as fetchUtmBreakdown, but scoped to orders whose utm_source looks like
// it came from Google Ads (the exact value depends on how the account's Final
// URL suffix / tracking template tags it — "google", "google_cpc", etc.).
export async function fetchGoogleUtmBreakdown({ groupBy, ...queryParams }: FetchGoogleUtmBreakdownParams): Promise<UtmBreakdownItem[]> {
  const orders = await fetchOrders(queryParams);
  const googleOrders = orders.filter((order) => extractUtm(order).source.toLowerCase().includes("google"));
  return groupOrdersByUtm(googleOrders, groupBy);
}
