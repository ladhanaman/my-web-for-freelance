"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  AdminCatalog,
  UploadBatchResponse,
} from "@/lib/admin-catalogs-contract";
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_BATCH_BYTES,
  MAX_UPLOAD_FILE_BYTES,
  MAX_UPLOAD_FILES,
} from "@/lib/admin-catalogs-contract";

type LoadState = "idle" | "loading" | "error";
type QueueStatus = "ready" | "uploading" | "success" | "error";
type SessionState = "unknown" | "ready" | "error";

interface UploadQueueItem {
  id: string;
  file: File;
  status: QueueStatus;
  error?: string;
}

interface AdminCatalogsClientProps {
  backendBaseUrl: string;
}

function formatBytes(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function parseJsonSafely<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

async function getErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) {
    return `Request failed (${response.status})`;
  }

  const json = parseJsonSafely<{ error?: string; message?: string }>(text);
  if (json?.error) {
    return json.error;
  }

  if (json?.message) {
    return json.message;
  }

  return text;
}

function validateFile(file: File): string | null {
  if (!ALLOWED_UPLOAD_MIME_TYPES.includes(file.type as (typeof ALLOWED_UPLOAD_MIME_TYPES)[number])) {
    return "Only JPEG and PNG files are allowed.";
  }

  if (file.size > MAX_UPLOAD_FILE_BYTES) {
    return `Each file must be <= ${formatBytes(MAX_UPLOAD_FILE_BYTES)}.`;
  }

  return null;
}

function sortCatalogPhotos(catalog: AdminCatalog): AdminCatalog {
  return {
    ...catalog,
    photos: [...catalog.photos].sort((a, b) => {
      const first = new Date(a.createdAt).getTime();
      const second = new Date(b.createdAt).getTime();
      return first - second;
    }),
  };
}

export default function AdminCatalogsClient({ backendBaseUrl }: AdminCatalogsClientProps) {
  const [catalogs, setCatalogs] = useState<AdminCatalog[]>([]);
  const [activeSlug, setActiveSlug] = useState<string>("");
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [loadError, setLoadError] = useState<string>("");
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [saveError, setSaveError] = useState<string>("");
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");

  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [backendPassword, setBackendPassword] = useState("");
  const [backendSessionState, setBackendSessionState] = useState<SessionState>("unknown");
  const [backendSessionError, setBackendSessionError] = useState("");
  const [isSessionBusy, setIsSessionBusy] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeCatalog = useMemo(
    () => catalogs.find((catalog) => catalog.slug === activeSlug) ?? null,
    [activeSlug, catalogs]
  );

  const loadCatalogs = useCallback(async () => {
    setLoadState("loading");
    setLoadError("");

    try {
      const response = await fetch("/api/admin/catalogs", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const body = (await response.json()) as { catalogs: AdminCatalog[] };
      const nextCatalogs = body.catalogs.map(sortCatalogPhotos);
      setCatalogs(nextCatalogs);
      setActiveSlug((previousSlug) => {
        if (!previousSlug && nextCatalogs.length > 0) {
          return nextCatalogs[0].slug;
        }

        if (previousSlug && nextCatalogs.some((catalog) => catalog.slug === previousSlug)) {
          return previousSlug;
        }

        return nextCatalogs[0]?.slug ?? "";
      });

      setLoadState("idle");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load catalogs.");
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void loadCatalogs();
  }, [loadCatalogs]);

  useEffect(() => {
    if (!activeCatalog) {
      setTitleDraft("");
      setDescriptionDraft("");
      return;
    }

    setTitleDraft(activeCatalog.title);
    setDescriptionDraft(activeCatalog.description);
  }, [activeCatalog]);

  const uploadStats = useMemo(() => {
    const readyItems = uploadQueue.filter((item) => item.status === "ready");
    const failedItems = uploadQueue.filter((item) => item.status === "error");
    const totalReadyBytes = readyItems.reduce((sum, item) => sum + item.file.size, 0);

    return {
      readyItems,
      failedItems,
      totalReadyBytes,
    };
  }, [uploadQueue]);

  const handleFilesSelected = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    setUploadError("");
    setUploadMessage("");

    const currentReady = uploadQueue.filter((item) => item.status === "ready");
    const remainingSlots = MAX_UPLOAD_FILES - currentReady.length;

    if (remainingSlots <= 0) {
      setUploadError(`You can queue up to ${MAX_UPLOAD_FILES} files at once.`);
      return;
    }

    const pickedFiles = Array.from(files).slice(0, remainingSlots);
    let nextBatchBytes = currentReady.reduce((sum, item) => sum + item.file.size, 0);
    const accepted: UploadQueueItem[] = [];

    for (const file of pickedFiles) {
      const validationError = validateFile(file);
      if (validationError) {
        setUploadError(validationError);
        continue;
      }

      if (nextBatchBytes + file.size > MAX_UPLOAD_BATCH_BYTES) {
        setUploadError(`Batch size must stay <= ${formatBytes(MAX_UPLOAD_BATCH_BYTES)}.`);
        continue;
      }

      nextBatchBytes += file.size;
      accepted.push({
        id: crypto.randomUUID(),
        file,
        status: "ready",
      });
    }

    if (accepted.length > 0) {
      setUploadQueue((prev) => [...prev, ...accepted]);
    }
  }, [uploadQueue]);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      handleFilesSelected(event.dataTransfer.files);
    },
    [handleFilesSelected]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const saveMetadata = useCallback(async () => {
    if (!activeCatalog) {
      return;
    }

    setSaveError("");
    setSaveMessage("");
    setIsSavingMeta(true);

    try {
      const response = await fetch(`/api/admin/catalogs/${encodeURIComponent(activeCatalog.slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleDraft, description: descriptionDraft }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const body = (await response.json()) as { catalog: AdminCatalog };
      const updatedCatalog = sortCatalogPhotos(body.catalog);

      setCatalogs((prev) => prev.map((catalog) => (catalog.slug === updatedCatalog.slug ? updatedCatalog : catalog)));
      setSaveMessage("Catalog metadata saved.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save catalog metadata.");
    } finally {
      setIsSavingMeta(false);
    }
  }, [activeCatalog, descriptionDraft, titleDraft]);

  const setCover = useCallback(async (photoId: string) => {
    if (!activeCatalog) {
      return;
    }

    setSaveError("");
    setSaveMessage("");

    try {
      const response = await fetch(`/api/admin/catalogs/${encodeURIComponent(activeCatalog.slug)}/cover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const body = (await response.json()) as { catalog: AdminCatalog };
      const updatedCatalog = sortCatalogPhotos(body.catalog);
      setCatalogs((prev) => prev.map((catalog) => (catalog.slug === updatedCatalog.slug ? updatedCatalog : catalog)));
      setSaveMessage("Cover photo updated.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to update cover photo.");
    }
  }, [activeCatalog]);

  const deletePhoto = useCallback(async (photoId: string) => {
    if (!activeCatalog) {
      return;
    }

    const ok = window.confirm("Delete this photo permanently? This cannot be undone.");
    if (!ok) {
      return;
    }

    setSaveError("");
    setSaveMessage("");

    try {
      const response = await fetch(
        `/api/admin/catalogs/${encodeURIComponent(activeCatalog.slug)}/photos/${encodeURIComponent(photoId)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const body = (await response.json()) as { catalog: AdminCatalog };
      const updatedCatalog = sortCatalogPhotos(body.catalog);
      setCatalogs((prev) => prev.map((catalog) => (catalog.slug === updatedCatalog.slug ? updatedCatalog : catalog)));
      setSaveMessage("Photo deleted.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to delete photo.");
    }
  }, [activeCatalog]);

  const loginBackendSession = useCallback(async () => {
    if (!backendPassword.trim()) {
      setBackendSessionError("Enter the backend session password.");
      return;
    }

    setIsSessionBusy(true);
    setBackendSessionError("");

    try {
      const response = await fetch(`${backendBaseUrl}/admin/session/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: backendPassword }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      setBackendSessionState("ready");
      setBackendPassword("");
    } catch (error) {
      setBackendSessionState("error");
      setBackendSessionError(error instanceof Error ? error.message : "Failed to start backend session.");
    } finally {
      setIsSessionBusy(false);
    }
  }, [backendBaseUrl, backendPassword]);

  const logoutBackendSession = useCallback(async () => {
    setIsSessionBusy(true);
    setBackendSessionError("");

    try {
      const response = await fetch(`${backendBaseUrl}/admin/session/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      setBackendSessionState("unknown");
      setUploadMessage("Backend upload session ended.");
    } catch (error) {
      setBackendSessionState("error");
      setBackendSessionError(error instanceof Error ? error.message : "Failed to end backend session.");
    } finally {
      setIsSessionBusy(false);
    }
  }, [backendBaseUrl]);

  const uploadReadyFiles = useCallback(async () => {
    if (!activeCatalog) {
      setUploadError("Choose a catalog before uploading.");
      return;
    }

    if (uploadStats.readyItems.length === 0) {
      setUploadError("Add files to queue before uploading.");
      return;
    }

    setUploadError("");
    setUploadMessage("");
    setIsUploading(true);

    const readyIds = new Set(uploadStats.readyItems.map((item) => item.id));
    setUploadQueue((prev) =>
      prev.map((item) =>
        readyIds.has(item.id)
          ? {
              ...item,
              status: "uploading",
              error: undefined,
            }
          : item
      )
    );

    try {
      const formData = new FormData();
      for (const item of uploadStats.readyItems) {
        formData.append("photos", item.file);
      }

      const response = await fetch(
        `${backendBaseUrl}/admin/catalogs/${encodeURIComponent(activeCatalog.slug)}/photos/batch`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const body = (await response.json()) as UploadBatchResponse;
      const uploadResults = Array.isArray(body.results) ? body.results : [];

      if (uploadResults.length > 0) {
        setUploadQueue((prev) => {
          const nextResults = [...uploadResults];

          return prev.map((item) => {
            if (item.status !== "uploading") {
              return item;
            }

            const resultIndex = nextResults.findIndex((result) => result.fileName === item.file.name);
            if (resultIndex === -1) {
              return { ...item, status: "success", error: undefined };
            }

            const result = nextResults.splice(resultIndex, 1)[0];
            if (result?.success) {
              return { ...item, status: "success", error: undefined };
            }

            return {
              ...item,
              status: "error",
              error: result?.error ?? "Upload failed.",
            };
          });
        });
      } else {
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.status === "uploading"
              ? {
                  ...item,
                  status: "success",
                  error: undefined,
                }
              : item
          )
        );
      }

      setUploadMessage(`Upload complete. ${body.uploadedCount} files stored.`);
      await loadCatalogs();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed.";

      setUploadQueue((prev) =>
        prev.map((item) =>
          item.status === "uploading"
            ? {
                ...item,
                status: "error",
                error: message,
              }
            : item
        )
      );
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  }, [activeCatalog, backendBaseUrl, loadCatalogs, uploadStats.readyItems]);

  const retryFailedUploads = useCallback(() => {
    setUploadError("");
    setUploadMessage("");
    setUploadQueue((prev) =>
      prev.map((item) => (item.status === "error" ? { ...item, status: "ready", error: undefined } : item))
    );
  }, []);

  const clearCompletedQueue = useCallback(() => {
    setUploadQueue((prev) => prev.filter((item) => item.status !== "success"));
  }, []);

  return (
    <section className="space-y-6">
      <section className="rounded-2xl border border-[#2e2a25] bg-[#171310] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#8c7f74]">Backend Upload Session</p>
            <p className="mt-1 text-sm text-[#c8beb4]">
              Start backend session once to enable direct large-file uploads.
            </p>
          </div>

          <span
            className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.12em] ${
              backendSessionState === "ready"
                ? "border-emerald-400/40 text-emerald-200"
                : backendSessionState === "error"
                  ? "border-red-400/40 text-red-200"
                  : "border-[#2e2a25] text-[#8c7f74]"
            }`}
          >
            {backendSessionState === "ready"
              ? "Session active"
              : backendSessionState === "error"
                ? "Session error"
                : "Not verified"}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[250px] flex-1">
            <label htmlFor="backend-session-password" className="text-xs uppercase tracking-[0.12em] text-[#8c7f74]">
              Backend Password
            </label>
            <input
              id="backend-session-password"
              type="password"
              value={backendPassword}
              onChange={(event) => setBackendPassword(event.target.value)}
              className="mt-2 h-10 w-full rounded-lg border border-[#2e2a25] bg-[#110e0c] px-3 text-sm text-[#f2ede8] outline-none transition-colors placeholder:text-[#5f554c] focus:border-[#C07548]"
              placeholder="Password for /admin/session/login"
            />
          </div>

          <button
            type="button"
            disabled={isSessionBusy}
            onClick={() => void loginBackendSession()}
            className="inline-flex h-10 items-center rounded-lg border border-[#C07548]/50 bg-[#C07548]/15 px-4 text-sm font-medium text-[#f7e6d8] transition-colors hover:bg-[#C07548]/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSessionBusy ? "Working..." : "Start Session"}
          </button>

          <button
            type="button"
            disabled={isSessionBusy}
            onClick={() => void logoutBackendSession()}
            className="inline-flex h-10 items-center rounded-lg border border-[#2e2a25] px-4 text-sm text-[#c8beb4] transition-colors hover:text-[#f2ede8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            End Session
          </button>
        </div>

        {backendSessionError ? (
          <p className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {backendSessionError}
          </p>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <aside className="rounded-2xl border border-[#2e2a25] bg-[#171310] p-4 sm:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#c8beb4]">Catalogs</h2>
          <p className="mt-1 text-xs text-[#8c7f74]">Fixed 9 catalogs synced from backend seed.</p>

          <div className="mt-4 space-y-2">
            {loadState === "loading" ? <p className="text-sm text-[#8c7f74]">Loading catalogs...</p> : null}
            {loadError ? (
              <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {loadError}
              </p>
            ) : null}

            {catalogs.map((catalog) => {
              const active = catalog.slug === activeSlug;

              return (
                <button
                  key={catalog.slug}
                  type="button"
                  onClick={() => setActiveSlug(catalog.slug)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                    active
                      ? "border-[#C07548]/60 bg-[#2a1d15]"
                      : "border-[#2e2a25] bg-[#140f0d] hover:border-[#3a2f26]"
                  }`}
                >
                  <p className="text-sm font-medium text-[#f2ede8]">{catalog.title}</p>
                  <p className="mt-1 text-xs text-[#8c7f74]">{catalog.photoCount} photos</p>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="space-y-6">
          {!activeCatalog ? (
            <div className="rounded-2xl border border-[#2e2a25] bg-[#171310] p-6 text-sm text-[#8c7f74]">
              Select a catalog to start managing uploads.
            </div>
          ) : (
            <>
              <section className="rounded-2xl border border-[#2e2a25] bg-[#171310] p-5 sm:p-6">
                <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#c8beb4]">Catalog Metadata</h2>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-1">
                    <label htmlFor="catalog-title" className="text-xs uppercase tracking-[0.12em] text-[#8c7f74]">
                      Title
                    </label>
                    <input
                      id="catalog-title"
                      value={titleDraft}
                      onChange={(event) => setTitleDraft(event.target.value)}
                      className="h-11 w-full rounded-lg border border-[#2e2a25] bg-[#110e0c] px-3 text-sm text-[#f2ede8] outline-none transition-colors focus:border-[#C07548]"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-1">
                    <label className="text-xs uppercase tracking-[0.12em] text-[#8c7f74]">Slug</label>
                    <div className="flex h-11 items-center rounded-lg border border-[#2e2a25] bg-[#110e0c] px-3 text-sm text-[#a19386]">
                      {activeCatalog.slug}
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="catalog-description" className="text-xs uppercase tracking-[0.12em] text-[#8c7f74]">
                      Description
                    </label>
                    <textarea
                      id="catalog-description"
                      value={descriptionDraft}
                      onChange={(event) => setDescriptionDraft(event.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-[#2e2a25] bg-[#110e0c] px-3 py-2 text-sm text-[#f2ede8] outline-none transition-colors focus:border-[#C07548]"
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={isSavingMeta}
                    onClick={() => void saveMetadata()}
                    className="inline-flex h-10 items-center rounded-lg border border-[#C07548]/50 bg-[#C07548]/15 px-4 text-sm font-medium text-[#f7e6d8] transition-colors hover:bg-[#C07548]/25 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingMeta ? "Saving..." : "Save Metadata"}
                  </button>

                  {saveMessage ? <p className="text-sm text-emerald-200">{saveMessage}</p> : null}
                  {saveError ? <p className="text-sm text-red-200">{saveError}</p> : null}
                </div>
              </section>

              <section className="rounded-2xl border border-[#2e2a25] bg-[#171310] p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#c8beb4]">Upload Queue</h2>
                    <p className="mt-1 text-xs text-[#8c7f74]">
                      JPEG/PNG, max {MAX_UPLOAD_FILES} files, {formatBytes(MAX_UPLOAD_FILE_BYTES)} each, {formatBytes(MAX_UPLOAD_BATCH_BYTES)} total.
                    </p>
                  </div>

                  <div className="text-xs text-[#8c7f74]">
                    {uploadStats.readyItems.length} ready • {formatBytes(uploadStats.totalReadyBytes)}
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  className="mt-4 rounded-xl border border-dashed border-[#3b3028] bg-[#120f0d] px-4 py-8 text-center text-sm text-[#8c7f74] transition-colors hover:border-[#C07548]/50"
                >
                  Drag and drop photos here, or click to choose files.
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    handleFilesSelected(event.target.files);
                    event.target.value = "";
                  }}
                />

                {uploadQueue.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {uploadQueue.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#2e2a25] bg-[#140f0d] px-3 py-2"
                      >
                        <div>
                          <p className="text-sm text-[#f2ede8]">{item.file.name}</p>
                          <p className="text-xs text-[#8c7f74]">{formatBytes(item.file.size)}</p>
                          {item.error ? <p className="text-xs text-red-200">{item.error}</p> : null}
                        </div>
                        <span
                          className={`text-xs uppercase tracking-[0.1em] ${
                            item.status === "success"
                              ? "text-emerald-200"
                              : item.status === "error"
                                ? "text-red-200"
                                : item.status === "uploading"
                                  ? "text-[#f2ede8]"
                                  : "text-[#8c7f74]"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isUploading || uploadStats.readyItems.length === 0}
                    onClick={() => void uploadReadyFiles()}
                    className="inline-flex h-10 items-center rounded-lg border border-[#C07548]/50 bg-[#C07548]/15 px-4 text-sm font-medium text-[#f7e6d8] transition-colors hover:bg-[#C07548]/25 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUploading ? "Uploading..." : "Upload Ready Files"}
                  </button>

                  <button
                    type="button"
                    disabled={uploadStats.failedItems.length === 0 || isUploading}
                    onClick={retryFailedUploads}
                    className="inline-flex h-10 items-center rounded-lg border border-[#2e2a25] px-4 text-sm text-[#c8beb4] transition-colors hover:text-[#f2ede8] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Retry Failed
                  </button>

                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={clearCompletedQueue}
                    className="inline-flex h-10 items-center rounded-lg border border-[#2e2a25] px-4 text-sm text-[#c8beb4] transition-colors hover:text-[#f2ede8] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Clear Completed
                  </button>
                </div>

                {uploadError ? (
                  <p className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {uploadError}
                  </p>
                ) : null}
                {uploadMessage ? <p className="mt-3 text-sm text-emerald-200">{uploadMessage}</p> : null}
              </section>

              <section className="rounded-2xl border border-[#2e2a25] bg-[#171310] p-5 sm:p-6">
                <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#c8beb4]">Photos</h2>
                <p className="mt-1 text-xs text-[#8c7f74]">Ordered oldest-first. Cover can be selected from this list.</p>

                {activeCatalog.photos.length === 0 ? (
                  <p className="mt-4 text-sm text-[#8c7f74]">No photos uploaded yet.</p>
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {activeCatalog.photos.map((photo) => (
                      <article key={photo.id} className="overflow-hidden rounded-xl border border-[#2e2a25] bg-[#140f0d]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.assetUrl}
                          alt={photo.fileName}
                          className="h-40 w-full object-cover"
                          loading="lazy"
                        />

                        <div className="space-y-2 px-3 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-2 text-xs text-[#c8beb4]">{photo.fileName}</p>
                            {photo.isCover ? (
                              <span className="rounded-full border border-[#C07548]/50 bg-[#C07548]/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-[#f7e6d8]">
                                Cover
                              </span>
                            ) : null}
                          </div>

                          <p className="text-[11px] text-[#8c7f74]">{formatBytes(photo.sizeBytes)}</p>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              disabled={photo.isCover}
                              onClick={() => void setCover(photo.id)}
                              className="inline-flex h-8 items-center rounded-lg border border-[#2e2a25] px-3 text-xs text-[#c8beb4] transition-colors hover:text-[#f2ede8] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Set Cover
                            </button>
                            <button
                              type="button"
                              onClick={() => void deletePhoto(photo.id)}
                              className="inline-flex h-8 items-center rounded-lg border border-red-400/40 px-3 text-xs text-red-200 transition-colors hover:bg-red-500/10"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </section>
      </section>
    </section>
  );
}
