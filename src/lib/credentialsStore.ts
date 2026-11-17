// Only ever import this from route.ts handlers (server-only by nature in the
// App Router) — never from a "use client" component, since it touches the
// Blob read/write token.
import { get, put } from "@vercel/blob";
import { Credentials, emptyCredentials } from "./credentials";

const PATHNAME = "dashboard/credentials.json";

export async function getStoredCredentials(): Promise<Credentials> {
  try {
    const result = await get(PATHNAME, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200) return emptyCredentials;
    const text = await new Response(result.stream).text();
    return { ...emptyCredentials, ...JSON.parse(text) };
  } catch (error) {
    console.error("Failed to read stored credentials:", error);
    return emptyCredentials;
  }
}

export async function saveStoredCredentials(data: Credentials): Promise<void> {
  await put(PATHNAME, JSON.stringify(data), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function clearStoredCredentials(): Promise<void> {
  await saveStoredCredentials(emptyCredentials);
}
