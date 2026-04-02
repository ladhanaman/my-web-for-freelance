import { HDR_ASSET_PATH } from "@/lib/hdr-asset-config"

const HDR_CACHE_DB_NAME = "kairos-hdr-cache"
const HDR_CACHE_DB_VERSION = 1
const HDR_CACHE_STORE_NAME = "assets"
const HDR_METADATA_STORAGE_KEY = "kairos-hdr-cache-meta"
const LEGACY_HDR_CACHE_KEY = HDR_ASSET_PATH

interface HdrCacheMetadata {
  key: string
}

export type ResolvedHdrAsset =
  | {
      kind: "cached" | "fetched"
      blob: Blob
      src: string
    }
  | {
      kind: "url"
      src: string
    }

function isBrowserCacheAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.indexedDB !== "undefined" &&
    typeof window.localStorage !== "undefined" &&
    typeof window.fetch === "function"
  )
}

function isHdrCacheMetadata(value: unknown): value is HdrCacheMetadata {
  if (!value || typeof value !== "object") return false

  const candidate = value as Partial<HdrCacheMetadata>
  return typeof candidate.key === "string" && candidate.key.length > 0
}

function getCacheKey(src: string): string {
  return src
}

function readMetadata(): HdrCacheMetadata | null {
  try {
    const raw = window.localStorage.getItem(HDR_METADATA_STORAGE_KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    return isHdrCacheMetadata(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeMetadata(key: string): void {
  try {
    const metadata: HdrCacheMetadata = { key }
    window.localStorage.setItem(HDR_METADATA_STORAGE_KEY, JSON.stringify(metadata))
  } catch {
    // Ignore metadata write failures; the runtime will simply skip persistence.
  }
}

function clearMetadata(): void {
  try {
    window.localStorage.removeItem(HDR_METADATA_STORAGE_KEY)
  } catch {
    // Ignore metadata cleanup failures.
  }
}

function isValidHdrBlob(blob: Blob | null): blob is Blob {
  return blob instanceof Blob && blob.size > 0
}

function openHdrCacheDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(HDR_CACHE_DB_NAME, HDR_CACHE_DB_VERSION)

    request.onerror = () => {
      reject(request.error ?? new Error("Failed to open HDR cache database."))
    }

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains(HDR_CACHE_STORE_NAME)) {
        db.createObjectStore(HDR_CACHE_STORE_NAME)
      }
    }

    request.onsuccess = () => {
      resolve(request.result)
    }
  })
}

function readBlobFromIndexedDb(key: string): Promise<Blob | null> {
  return new Promise(async (resolve, reject) => {
    let db: IDBDatabase | null = null

    try {
      db = await openHdrCacheDatabase()
      const transaction = db.transaction(HDR_CACHE_STORE_NAME, "readonly")
      const store = transaction.objectStore(HDR_CACHE_STORE_NAME)
      const request = store.get(key)

      request.onerror = () => {
        reject(request.error ?? new Error("Failed to read HDR blob from IndexedDB."))
      }

      request.onsuccess = () => {
        const result = request.result
        resolve(result instanceof Blob ? result : null)
      }

      transaction.oncomplete = () => {
        db?.close()
      }

      transaction.onerror = () => {
        reject(transaction.error ?? new Error("HDR cache read transaction failed."))
      }
    } catch (error) {
      db?.close()
      reject(error)
    }
  })
}

function writeBlobToIndexedDb(key: string, blob: Blob): Promise<void> {
  return new Promise(async (resolve, reject) => {
    let db: IDBDatabase | null = null

    try {
      db = await openHdrCacheDatabase()
      const transaction = db.transaction(HDR_CACHE_STORE_NAME, "readwrite")
      const store = transaction.objectStore(HDR_CACHE_STORE_NAME)
      const request = store.put(blob, key)

      request.onerror = () => {
        reject(request.error ?? new Error("Failed to write HDR blob to IndexedDB."))
      }

      transaction.oncomplete = () => {
        db?.close()
        resolve()
      }

      transaction.onerror = () => {
        reject(transaction.error ?? new Error("HDR cache write transaction failed."))
      }
    } catch (error) {
      db?.close()
      reject(error)
    }
  })
}

function deleteBlobFromIndexedDb(key: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    let db: IDBDatabase | null = null

    try {
      db = await openHdrCacheDatabase()
      const transaction = db.transaction(HDR_CACHE_STORE_NAME, "readwrite")
      const store = transaction.objectStore(HDR_CACHE_STORE_NAME)
      const request = store.delete(key)

      request.onerror = () => {
        reject(request.error ?? new Error("Failed to delete HDR blob from IndexedDB."))
      }

      transaction.oncomplete = () => {
        db?.close()
        resolve()
      }

      transaction.onerror = () => {
        reject(transaction.error ?? new Error("HDR cache delete transaction failed."))
      }
    } catch (error) {
      db?.close()
      reject(error)
    }
  })
}

async function deleteCacheKeys(keys: string[]): Promise<void> {
  await Promise.all(
    [...new Set(keys.filter(Boolean))].map(async (key) => {
      try {
        await deleteBlobFromIndexedDb(key)
      } catch {
        // Ignore cache cleanup failures.
      }
    })
  )
}

async function syncCacheKey(expectedKey: string): Promise<void> {
  const metadata = readMetadata()
  const legacyKeys = expectedKey === LEGACY_HDR_CACHE_KEY ? [] : [LEGACY_HDR_CACHE_KEY]

  if (!metadata) {
    await deleteCacheKeys(legacyKeys)
    return
  }

  if (metadata.key === expectedKey) {
    await deleteCacheKeys(legacyKeys)
    return
  }

  clearMetadata()
  await deleteCacheKeys([metadata.key, ...legacyKeys])
}

async function readCachedHdrAsset(src: string): Promise<ResolvedHdrAsset | null> {
  const key = getCacheKey(src)

  await syncCacheKey(key)

  const metadata = readMetadata()
  if (!metadata || metadata.key !== key) return null

  try {
    const blob = await readBlobFromIndexedDb(key)
    if (isValidHdrBlob(blob)) {
      return {
        kind: "cached",
        blob,
        src,
      }
    }
  } catch {
    // Fall through to cache cleanup below.
  }

  clearMetadata()
  await deleteCacheKeys([key])
  return null
}

async function fetchHdrAsset(src: string): Promise<ResolvedHdrAsset> {
  const response = await window.fetch(src)
  if (!response.ok) {
    throw new Error(`Failed to fetch HDR asset: ${response.status}`)
  }

  const blob = await response.blob()
  if (!isValidHdrBlob(blob)) {
    throw new Error("Fetched HDR asset blob is empty.")
  }

  return {
    kind: "fetched",
    blob,
    src,
  }
}

export async function resolveHdrAsset(src: string): Promise<ResolvedHdrAsset> {
  if (!isBrowserCacheAvailable()) {
    return { kind: "url", src }
  }

  try {
    const cached = await readCachedHdrAsset(src)
    if (cached) return cached

    return await fetchHdrAsset(src)
  } catch {
    return { kind: "url", src }
  }
}

export async function persistHdrAsset(src: string, blob: Blob): Promise<void> {
  if (!isBrowserCacheAvailable() || !isValidHdrBlob(blob)) return

  const key = getCacheKey(src)
  const previousMetadata = readMetadata()

  try {
    await writeBlobToIndexedDb(key, blob)
    writeMetadata(key)

    if (previousMetadata && previousMetadata.key !== key) {
      await deleteCacheKeys([previousMetadata.key, LEGACY_HDR_CACHE_KEY])
    } else if (key !== LEGACY_HDR_CACHE_KEY) {
      await deleteCacheKeys([LEGACY_HDR_CACHE_KEY])
    }
  } catch {
    clearMetadata()
    await deleteCacheKeys([key])
  }
}

export async function invalidateHdrAsset(src: string): Promise<void> {
  if (!isBrowserCacheAvailable()) return

  const metadata = readMetadata()
  clearMetadata()

  await deleteCacheKeys([getCacheKey(src), metadata?.key ?? "", LEGACY_HDR_CACHE_KEY])
}
