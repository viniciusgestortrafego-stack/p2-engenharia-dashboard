// Server-only — pulls Google Ads data live from the real Google Ads API using
// the agency's own developer token (Basic access), instead of relying on the
// Google Ads Script webhook-ingest pipeline (see /api/google-ads/ingest).
// Never route this token through Composio or any other third-party platform —
// see the Google Ads API access memory for why.

const API_VERSION = "v23";

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
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN || "",
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

export async function runGaqlQuery<T = Record<string, unknown>>(customerId: string, query: string): Promise<T[]> {
  const accessToken = await getAccessToken();
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || "";
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "";

  const response = await fetch(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/googleAds:searchStream`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": developerToken,
      "login-customer-id": loginCustomerId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Ads API error (${response.status}): ${text}`);
  }

  const batches = (await response.json()) as { results?: T[] }[];
  return batches.flatMap((batch) => batch.results || []);
}

export function microsToUnits(micros: string | number | undefined): number {
  return Number(micros || 0) / 1_000_000;
}
