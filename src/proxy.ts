import { NextRequest, NextResponse } from "next/server";
import { isValidSession } from "@/lib/session";

// Only /api/credentials is gated here — the /settings page itself always
// loads (it shows a login form client-side and calls /api/auth/login),
// which is friendlier than the browser's native Basic Auth popup.

export function proxy(request: NextRequest) {
  if (isValidSession(request)) {
    return NextResponse.next();
  }

  return NextResponse.json({ error: "Autenticação necessária" }, { status: 401 });
}

export const config = {
  matcher: "/api/credentials",
};
