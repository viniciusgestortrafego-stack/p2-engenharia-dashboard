import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, checkLogin, issueSessionToken } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { user, password } = (await request.json()) as { user?: string; password?: string };

  if (!user || !password || !checkLogin(user, password)) {
    return NextResponse.json({ error: "Usuário ou senha inválidos" }, { status: 401 });
  }

  const token = issueSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Login não configurado no servidor" }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return response;
}
