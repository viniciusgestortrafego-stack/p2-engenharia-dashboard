import { NextRequest, NextResponse } from "next/server";
import { clearStoredCredentials, getStoredCredentials, saveStoredCredentials } from "@/lib/credentialsStore";
import { Credentials, emptyCredentials } from "@/lib/credentials";

// This route is only reachable after Basic Auth (see src/proxy.ts matcher) —
// it returns and accepts the real secret values, unlike /api/config-status.

export const dynamic = "force-dynamic";

export async function GET() {
  const credentials = await getStoredCredentials();
  return NextResponse.json(credentials);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<Credentials>;
  const credentials: Credentials = { ...emptyCredentials, ...body };
  await saveStoredCredentials(credentials);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearStoredCredentials();
  return NextResponse.json({ ok: true });
}
