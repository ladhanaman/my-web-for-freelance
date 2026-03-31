import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  ADMIN_AUTH_COOKIE,
  getAdminAuthConfigurationError,
  isAdminGateEnabled,
  isValidAdminCookie,
} from "@/lib/admin-auth";

/**
 * Matches common mobile User-Agent tokens.
 * iPadOS 13+ intentionally identifies as desktop Safari — tablets pass through.
 */
const MOBILE_UA_RE =
  /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile Safari|CriOS/i;

/** Belt-and-suspenders guard for static asset extensions. */
const STATIC_EXT_RE =
  /\.(?:ico|svg|png|jpg|jpeg|webp|gif|woff2?|ttf|otf|glb|gltf|css|js|map|json|txt|xml|lottie)$/i;

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

  // Skip static asset extensions that slipped past the matcher
  if (STATIC_EXT_RE.test(pathname)) {
    return NextResponse.next();
  }

  // Mobile gate — API routes are excluded from the matcher so this only
  // runs for page routes; the pathname check is a belt-and-suspenders guard.
  if (!pathname.startsWith("/api/")) {
    const ua = request.headers.get("user-agent") ?? "";
    if (MOBILE_UA_RE.test(ua)) {
      const url = request.nextUrl.clone();
      url.pathname = "/mobile";
      return NextResponse.rewrite(url);
    }
  }

  // Admin auth gate — only applies to /admin and /api/admin paths
  const isAdminPath =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (!isAdminPath || !isAdminGateEnabled()) {
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
  matcher: [
    // All page routes except Next.js internals, the mobile page itself,
    // fonts, photos, favicon, and general API routes.
    "/((?!_next/static|_next/image|api/|mobile|fonts/|photos/|favicon\\.ico).*)",
    // Admin API routes are excluded from the broad matcher above (api/ prefix)
    // but still need the auth gate — match them explicitly here.
    "/api/admin/:path*",
  ],
};
