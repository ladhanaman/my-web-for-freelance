import { NextRequest, NextResponse } from "next/server";

import { ADMIN_AUTH_COOKIE, getAdminPassword, isAdminGateEnabled } from "@/lib/admin-auth";

interface LoginBody {
  password?: string;
}

export async function POST(request: NextRequest) {
  if (!isAdminGateEnabled()) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const expectedPassword = getAdminPassword();
  const submittedPassword = body.password?.trim();

  if (!submittedPassword || submittedPassword !== expectedPassword) {
    return NextResponse.json({ error: "Invalid admin password." }, { status: 401 });
  }

  const response = NextResponse.json({ success: true }, { status: 200 });
  response.cookies.set(ADMIN_AUTH_COOKIE, expectedPassword, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return response;
}
