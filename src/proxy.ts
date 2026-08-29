import { NextResponse, type NextRequest } from "next/server";

import { authCookieName } from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isServerAction = request.headers.has("next-action");

  if (isServerAction) {
    return NextResponse.next();
  }

  const isLoginPage = pathname === "/login";
  const hasSessionCookie = Boolean(request.cookies.get(authCookieName)?.value);

  if (!isLoginPage && !hasSessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
