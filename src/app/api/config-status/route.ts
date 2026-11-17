import { NextResponse } from "next/server";
import { getStoredCredentials } from "@/lib/credentialsStore";

// Public route — every dashboard page calls this to know whether to show real
// data or a "configure in Settings" message, and to get the non-secret
// identifiers (account IDs, store URL) needed to build API requests.
// The actual secrets (metaToken, wooConsumerKey, wooConsumerSecret) never
// leave the server — see /api/credentials for those, which is login-gated.

export const dynamic = "force-dynamic";

export async function GET() {
  const credentials = await getStoredCredentials();
  return NextResponse.json({
    adAccountId: credentials.adAccountId,
    instagramAccountId: credentials.instagramAccountId,
    wooStoreUrl: credentials.wooStoreUrl,
    googleAdsCustomerId: credentials.googleAdsCustomerId,
    ga4PropertyId: credentials.ga4PropertyId,
    hasMeta: Boolean(credentials.metaToken && credentials.adAccountId),
    hasInstagram: Boolean(credentials.metaToken && credentials.instagramAccountId),
    hasWoo: Boolean(credentials.wooStoreUrl && credentials.wooConsumerKey && credentials.wooConsumerSecret),
  });
}
