import { NextRequest, NextResponse } from "next/server";
import { getStoredCredentials } from "@/lib/credentialsStore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeUrl = searchParams.get("storeUrl");
    const endpoint = searchParams.get("endpoint");

    if (!storeUrl || !endpoint) {
      return NextResponse.json({ error: "Missing storeUrl or endpoint" }, { status: 400 });
    }

    const credentials = await getStoredCredentials();
    if (!credentials.wooConsumerKey || !credentials.wooConsumerSecret) {
      return NextResponse.json({ error: "WooCommerce não configurado" }, { status: 400 });
    }

    const wooUrl = new URL(`${storeUrl.replace(/\/$/, "")}/wp-json/wc/v3/${endpoint}`);

    searchParams.forEach((value, key) => {
      if (key !== "storeUrl" && key !== "endpoint") {
        wooUrl.searchParams.append(key, value);
      }
    });

    wooUrl.searchParams.append("consumer_key", credentials.wooConsumerKey);
    wooUrl.searchParams.append("consumer_secret", credentials.wooConsumerSecret);

    const response = await fetch(wooUrl.toString());
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.message || "Erro na API do WooCommerce" }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("WooCommerce API Proxy Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
