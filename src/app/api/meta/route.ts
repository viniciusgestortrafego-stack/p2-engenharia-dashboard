import { NextRequest, NextResponse } from "next/server";
import { getStoredCredentials } from "@/lib/credentialsStore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");
    const fields = searchParams.get("fields");

    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    }

    const credentials = await getStoredCredentials();
    if (!credentials.metaToken) {
      return NextResponse.json({ error: "Meta Ads não configurado" }, { status: 400 });
    }

    const metaUrl = new URL(`https://graph.facebook.com/v19.0/${endpoint}`);
    if (fields) metaUrl.searchParams.append("fields", fields);

    // Pass other params
    searchParams.forEach((value, key) => {
      if (key !== "endpoint" && key !== "fields") {
        metaUrl.searchParams.append(key, value);
      }
    });

    metaUrl.searchParams.append("access_token", credentials.metaToken);

    const response = await fetch(metaUrl.toString());
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || "Erro no Meta API" }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Meta API Proxy Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
