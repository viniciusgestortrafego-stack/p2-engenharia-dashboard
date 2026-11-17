import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";

// Only ever import this from route.ts / proxy.ts (server-only by nature) —
// it derives a session token from the admin password without storing a
// separate session table.

export const SESSION_COOKIE_NAME = "genius_session";

function expectedToken(): string | null {
  const user = process.env.SETTINGS_AUTH_USER;
  const pass = process.env.SETTINGS_AUTH_PASSWORD;
  if (!user || !pass) return null;
  return createHmac("sha256", pass).update(user).digest("hex");
}

export function checkLogin(user: string, pass: string): boolean {
  const expectedUser = process.env.SETTINGS_AUTH_USER;
  const expectedPass = process.env.SETTINGS_AUTH_PASSWORD;
  if (!expectedUser || !expectedPass) return false;
  return user === expectedUser && pass === expectedPass;
}

export function issueSessionToken(): string | null {
  return expectedToken();
}

export function isValidSession(request: NextRequest): boolean {
  const token = expectedToken();
  if (!token) return false;

  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!cookieValue) return false;

  const a = Buffer.from(cookieValue);
  const b = Buffer.from(token);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
