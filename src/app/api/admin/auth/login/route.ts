import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_AUTH_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionToken,
  getAdminAuthConfigurationError,
  isAdminGateEnabled,
  isAdminPasswordMatch,
} from "@/lib/admin-auth";

interface LoginBody {
  password?: string;
}

export async function POST(request: NextRequest) {
  if (!isAdminGateEnabled()) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  const configError = getAdminAuthConfigurationError();
  if (configError) {
    console.error("[admin-auth] misconfigured login route:", configError);
    return NextResponse.json({ error: "Admin auth is misconfigured." }, { status: 500 });
  }

  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const submittedPassword = body.password?.trim();

  if (!submittedPassword || !isAdminPasswordMatch(submittedPassword)) {
    return NextResponse.json({ error: "Invalid admin password." }, { status: 401 });
  }

  const sessionToken = await createAdminSessionToken();
  const response = NextResponse.json({ success: true }, { status: 200 });
  response.cookies.set(ADMIN_AUTH_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
