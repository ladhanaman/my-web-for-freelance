import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  ADMIN_AUTH_COOKIE,
  getAdminAuthConfigurationError,
  isAdminGateEnabled,
  isValidAdminCookie,
} from "@/lib/admin-auth";

function buildLoginRedirect(request: NextRequest): NextResponse {
  const loginUrl = new URL("/admin/login", request.url);
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  if (nextPath && nextPath !== "/admin/login") {
    loginUrl.searchParams.set("next", nextPath);
  }

  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isAdminGateEnabled()) {
    return NextResponse.next();
  }

  if (pathname === "/admin/login" || pathname === "/api/admin/auth/login") {
    return NextResponse.next();
  }

  const configError = getAdminAuthConfigurationError();
  if (configError) {
    console.error("[admin-auth] misconfigured proxy:", configError);

    if (pathname.startsWith("/api/admin/")) {
      return NextResponse.json({ error: "Admin auth is misconfigured." }, { status: 500 });
    }

    return buildLoginRedirect(request);
  }

  const authCookie = request.cookies.get(ADMIN_AUTH_COOKIE)?.value;
  if (await isValidAdminCookie(authCookie)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return buildLoginRedirect(request);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
