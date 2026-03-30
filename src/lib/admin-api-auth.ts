import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  ADMIN_AUTH_COOKIE,
  getAdminAuthConfigurationError,
  isValidAdminCookie,
} from "@/lib/admin-auth";

export async function assertAdminApiAccess(request: NextRequest): Promise<NextResponse | null> {
  const configError = getAdminAuthConfigurationError();
  if (configError) {
    console.error("[admin-auth] misconfigured admin API access:", configError);
    return NextResponse.json({ error: "Admin auth is misconfigured." }, { status: 500 });
  }

  const authCookie = request.cookies.get(ADMIN_AUTH_COOKIE)?.value;

  if (!(await isValidAdminCookie(authCookie))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
