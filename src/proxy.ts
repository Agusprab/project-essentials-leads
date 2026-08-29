import { NextResponse, type NextRequest } from "next/server";

import {
  authCookieName,
  getAuthConfig,
  verifyAuthSessionValue,
} from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isServerAction = request.headers.has("next-action");

  if (pathname === "/login" && isServerAction) {
    return NextResponse.next();
  }

  const isLoginPage = pathname === "/login";
  const isAuthenticated = await verifyAuthSessionValue(
    request.cookies.get(authCookieName)?.value,
    getAuthConfig(),
  );

  if (isLoginPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isLoginPage && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
