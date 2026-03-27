export const ADMIN_AUTH_COOKIE = "admin_console_auth";

export function isAdminGateEnabled(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function isValidAdminCookie(cookieValue: string | undefined): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return true;
  }

  return cookieValue === password;
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "";
}
