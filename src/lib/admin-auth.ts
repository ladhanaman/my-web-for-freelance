export const ADMIN_AUTH_COOKIE = "admin_console_auth";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

const ADMIN_SESSION_SECRET_MIN_LENGTH = 32;
const ADMIN_SESSION_VERSION = 1;
const ADMIN_SESSION_SUBJECT = "admin";

interface AdminSessionPayload {
  exp: number;
  iat: number;
  sub: string;
  v: number;
}

function normalizeAdminEnvValue(value: string | undefined): string {
  const trimmedValue = (value ?? "").trim();
  const firstChar = trimmedValue.at(0);
  const lastChar = trimmedValue.at(-1);

  if (
    trimmedValue.length >= 2 &&
    firstChar === lastChar &&
    (firstChar === '"' || firstChar === "'")
  ) {
    return trimmedValue.slice(1, -1);
  }

  return trimmedValue;
}

function getAdminSessionSecret(): string {
  return normalizeAdminEnvValue(process.env.ADMIN_SESSION_SECRET);
}

function isAdminSessionPayload(value: unknown): value is AdminSessionPayload {
  if (!value || typeof value !== "object") return false;

  const payload = value as Partial<AdminSessionPayload>;
  return (
    payload.sub === ADMIN_SESSION_SUBJECT &&
    payload.v === ADMIN_SESSION_VERSION &&
    typeof payload.iat === "number" &&
    typeof payload.exp === "number"
  );
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function encodeText(value: string): ArrayBuffer {
  return toArrayBuffer(new TextEncoder().encode(value));
}

async function importHmacKey(): Promise<CryptoKey> {
  const secret = getAdminSessionSecret();
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not configured.");
  }

  return crypto.subtle.importKey(
    "raw",
    encodeText(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signValue(value: string): Promise<string> {
  const key = await importHmacKey();
  const signature = await crypto.subtle.sign("HMAC", key, encodeText(value));

  return bytesToBase64Url(new Uint8Array(signature));
}

async function verifyValue(value: string, signature: string): Promise<boolean> {
  try {
    const key = await importHmacKey();

    return await crypto.subtle.verify(
      "HMAC",
      key,
      toArrayBuffer(base64UrlToBytes(signature)),
      encodeText(value)
    );
  } catch {
    return false;
  }
}

export function isAdminGateEnabled(): boolean {
  return Boolean(getAdminPassword());
}

export function isAdminSessionConfigured(): boolean {
  const secret = getAdminSessionSecret();
  return secret.length >= ADMIN_SESSION_SECRET_MIN_LENGTH;
}

export function getAdminAuthConfigurationError(): string | null {
  if (!isAdminGateEnabled()) return null;

  if (!isAdminSessionConfigured()) {
    return "ADMIN_SESSION_SECRET must be set to a strong value with at least 32 characters.";
  }

  return null;
}

export function getAdminPassword(): string {
  return normalizeAdminEnvValue(process.env.ADMIN_PASSWORD);
}

export function isAdminPasswordMatch(submittedPassword: string): boolean {
  return submittedPassword === getAdminPassword();
}

export async function createAdminSessionToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    sub: ADMIN_SESSION_SUBJECT,
    iat: now,
    exp: now + ADMIN_SESSION_MAX_AGE_SECONDS,
    v: ADMIN_SESSION_VERSION,
  };

  const payloadSegment = bytesToBase64Url(new Uint8Array(encodeText(JSON.stringify(payload))));
  const signatureSegment = await signValue(payloadSegment);

  return `${payloadSegment}.${signatureSegment}`;
}

export async function isValidAdminCookie(cookieValue: string | undefined): Promise<boolean> {
  if (!isAdminGateEnabled()) {
    return true;
  }

  if (!cookieValue || !isAdminSessionConfigured()) {
    return false;
  }

  const [payloadSegment, signatureSegment, ...rest] = cookieValue.split(".");
  if (!payloadSegment || !signatureSegment || rest.length > 0) {
    return false;
  }

  const isSignatureValid = await verifyValue(payloadSegment, signatureSegment);
  if (!isSignatureValid) {
    return false;
  }

  try {
    const payloadJson = new TextDecoder().decode(base64UrlToBytes(payloadSegment));
    const payload: unknown = JSON.parse(payloadJson);

    if (!isAdminSessionPayload(payload)) {
      return false;
    }

    return payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
