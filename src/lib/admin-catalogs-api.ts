import "server-only";

import type {
  AdminCatalog,
  SetCoverInput,
  UpdateCatalogInput,
} from "@/lib/admin-catalogs-contract";

const REQUEST_TIMEOUT_MS = 12000;

interface BackendErrorBody {
  error?: string;
  message?: string;
  details?: unknown;
}

export class AdminCatalogApiError extends Error {
  status: number;

  constructor(message: string, status: number, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "AdminCatalogApiError";
    this.status = status;
  }
}

function getBackendBaseUrl(): string {
  const raw = process.env.BACKEND_API_BASE_URL?.trim();

  if (!raw) {
    throw new AdminCatalogApiError("BACKEND_API_BASE_URL is not configured.", 500);
  }

  return raw.replace(/\/+$/, "");
}

export function getBackendBaseUrlForClient(): string {
  return getBackendBaseUrl();
}

function getBackendBearerToken(): string {
  const token = process.env.BACKEND_API_BEARER_TOKEN?.trim();

  if (!token) {
    throw new AdminCatalogApiError("BACKEND_API_BEARER_TOKEN is not configured.", 500);
  }

  return token;
}

function withTimeoutSignal(timeoutMs: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller;
}

async function parseBackendError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as BackendErrorBody;
    if (body.message && typeof body.message === "string") {
      return body.message;
    }

    if (body.error && typeof body.error === "string") {
      return body.error;
    }
  } catch {
    // fallback below
  }

  return `Backend request failed with status ${response.status}.`;
}

async function requestBackend<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = withTimeoutSignal(REQUEST_TIMEOUT_MS);
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${getBackendBearerToken()}`);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getBackendBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
    signal: controller.signal,
  });

  if (!response.ok) {
    const message = await parseBackendError(response);
    throw new AdminCatalogApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function seedCatalogs(): Promise<void> {
  await requestBackend("/admin/catalogs/seed", { method: "POST" });
}

export async function getCatalogs(): Promise<AdminCatalog[]> {
  const response = await requestBackend<{ catalogs: AdminCatalog[] }>("/admin/catalogs", {
    method: "GET",
  });

  return response.catalogs;
}

export async function updateCatalog(slug: string, input: UpdateCatalogInput): Promise<AdminCatalog> {
  const response = await requestBackend<{ catalog: AdminCatalog }>(`/admin/catalogs/${encodeURIComponent(slug)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return response.catalog;
}

export async function setCatalogCover(slug: string, input: SetCoverInput): Promise<AdminCatalog> {
  const response = await requestBackend<{ catalog: AdminCatalog }>(
    `/admin/catalogs/${encodeURIComponent(slug)}/cover`,
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );

  return response.catalog;
}

export async function deleteCatalogPhoto(slug: string, photoId: string): Promise<AdminCatalog> {
  const response = await requestBackend<{ catalog: AdminCatalog }>(
    `/admin/catalogs/${encodeURIComponent(slug)}/photos/${encodeURIComponent(photoId)}`,
    {
      method: "DELETE",
    }
  );

  return response.catalog;
}
