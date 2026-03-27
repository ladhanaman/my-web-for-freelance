import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { ADMIN_AUTH_COOKIE, isValidAdminCookie } from "@/lib/admin-auth";

export function assertAdminApiAccess(request: NextRequest): NextResponse | null {
  const authCookie = request.cookies.get(ADMIN_AUTH_COOKIE)?.value;

  if (!isValidAdminCookie(authCookie)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
