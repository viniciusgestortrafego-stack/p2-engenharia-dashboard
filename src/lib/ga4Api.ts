// Server-only — pulls data live from the Google Analytics Data API (GA4) using
// the agency's own OAuth app (same Cloud project as Google Ads, separate
// refresh token scoped to analytics.readonly). Never route this token through
// Composio or any other third-party platform.

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET || "",
      refresh_token: process.env.GOOGLE_ANALYTICS_REFRESH_TOKEN || "",
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error(`Google OAuth token exchange failed: ${response.status}`);
  }

  const data = await response.json();
  cachedToken = { accessToken: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.accessToken;
}

export interface RunReportParams {
  propertyId: string;
  dimensions: string[];
  metrics: string[];
  since: string; // YYYY-MM-DD
  until: string; // YYYY-MM-DD
  dimensionFilter?: Record<string, unknown>;
}

export interface RunReportResult {
  dimensionHeaders: { name: string }[];
  metricHeaders: { name: string }[];
  rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[];
}

export async function runReport({ propertyId, dimensions, metrics, since, until, dimensionFilter }: RunReportParams): Promise<RunReportResult> {
  const accessToken = await getAccessToken();

  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      dateRanges: [{ startDate: since, endDate: until }],
      dimensions: dimensions.map((name) => ({ name })),
      metrics: metrics.map((name) => ({ name })),
      dimensionFilter,
      limit: 100000,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GA4 Data API error (${response.status}): ${text}`);
  }

  return response.json();
}

export async function listConversionEventNames(propertyId: string): Promise<string[]> {
  const accessToken = await getAccessToken();
  const response = await fetch(`https://analyticsadmin.googleapis.com/v1beta/properties/${propertyId}/conversionEvents`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GA4 Admin API error (${response.status}): ${text}`);
  }
  const data = (await response.json()) as { conversionEvents?: { eventName: string }[] };
  return (data.conversionEvents || []).map((e) => e.eventName);
}

// Reads report rows into plain objects keyed by dimension/metric name, e.g.
// { date: "20260810", sessions: "42" } — GA4 always returns metric values as
// strings regardless of type, callers Number(...) what they need.
export function rowsToObjects(result: RunReportResult): Record<string, string>[] {
  const dimNames = result.dimensionHeaders.map((h) => h.name);
  const metricNames = result.metricHeaders.map((h) => h.name);
  return (result.rows || []).map((row) => {
    const obj: Record<string, string> = {};
    row.dimensionValues.forEach((v, i) => (obj[dimNames[i]] = v.value));
    row.metricValues.forEach((v, i) => (obj[metricNames[i]] = v.value));
    return obj;
  });
}

// GA4 dates come back as "YYYYMMDD" — the rest of the dashboard uses "YYYY-MM-DD".
export function formatGa4Date(raw: string): string {
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}
