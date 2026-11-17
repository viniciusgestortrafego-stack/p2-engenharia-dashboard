// Shared shape only — no "use client" here on purpose, so this file can be
// safely imported both by server routes (credentialsStore.ts) and by the
// Settings form (for its local form state). It holds no live values itself.

export interface Credentials {
  metaToken: string;
  adAccountId: string;
  instagramAccountId: string;
  wooStoreUrl: string;
  wooConsumerKey: string;
  wooConsumerSecret: string;
  googleAdsWebhookSecret: string;
  /** ID da conta Google Ads do cliente (só números). Sem ele, vale GOOGLE_ADS_CUSTOMER_ID. */
  googleAdsCustomerId: string;
  /** ID da propriedade do GA4. Sem ele, vale GOOGLE_ANALYTICS_PROPERTY_ID. */
  ga4PropertyId: string;
}

export const emptyCredentials: Credentials = {
  metaToken: "",
  adAccountId: "",
  instagramAccountId: "",
  wooStoreUrl: "",
  wooConsumerKey: "",
  wooConsumerSecret: "",
  googleAdsWebhookSecret: "",
  googleAdsCustomerId: "",
  ga4PropertyId: "",
};
