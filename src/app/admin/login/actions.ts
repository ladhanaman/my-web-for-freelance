"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_AUTH_COOKIE, getAdminPassword, isAdminGateEnabled } from "@/lib/admin-auth";

export interface AdminLoginState {
  error?: string;
}

function normalizeNextPath(nextPath: string): string {
  if (!nextPath.startsWith("/")) {
    return "/admin";
  }

  if (nextPath.startsWith("//")) {
    return "/admin";
  }

  return nextPath;
}

export async function adminLoginAction(
  nextPath: string,
  _prevState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const safeNextPath = normalizeNextPath(nextPath);

  if (!isAdminGateEnabled()) {
    redirect(safeNextPath);
  }

  const submittedPassword = String(formData.get("password") ?? "").trim();
  const expectedPassword = getAdminPassword();

  if (!submittedPassword) {
    return { error: "Enter the admin password." };
  }

  if (submittedPassword !== expectedPassword) {
    return { error: "Invalid admin password." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_AUTH_COOKIE, expectedPassword, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  redirect(safeNextPath);
}
