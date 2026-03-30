export const HDR_ASSET_PATH = "/env/dikhololo_night_1k.hdr"

const HDR_CACHE_KEY = HDR_ASSET_PATH
const HDR_CACHE_VERSION = "v1"
const HDR_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

const HDR_CACHE_DB_NAME = "kairos-hdr-cache"
const HDR_CACHE_DB_VERSION = 1
const HDR_CACHE_STORE_NAME = "assets"
const HDR_METADATA_STORAGE_KEY = "kairos-hdr-cache-meta"

interface HdrCacheMetadata {
  expiresAt: number
  key: string
  version: string
}

export interface ResolvedHdrAsset {
  kind: "cached" | "url"
  blob?: Blob
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
  return (
    candidate.key === HDR_CACHE_KEY &&
    candidate.version === HDR_CACHE_VERSION &&
    typeof candidate.expiresAt === "number"
  )
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

function writeMetadata(): void {
  try {
    const metadata: HdrCacheMetadata = {
      key: HDR_CACHE_KEY,
      version: HDR_CACHE_VERSION,
      expiresAt: Date.now() + HDR_CACHE_TTL_MS,
    }

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

function hasFreshMetadata(metadata: HdrCacheMetadata | null): metadata is HdrCacheMetadata {
  return metadata !== null && metadata.expiresAt > Date.now()
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

async function readCachedHdrAsset(): Promise<ResolvedHdrAsset | null> {
  const metadata = readMetadata()
  if (!hasFreshMetadata(metadata)) {
    clearMetadata()

    try {
      await deleteBlobFromIndexedDb(HDR_CACHE_KEY)
    } catch {
      // Ignore stale blob cleanup failures.
    }

    return null
  }

  try {
    const blob = await readBlobFromIndexedDb(HDR_CACHE_KEY)
    if (isValidHdrBlob(blob)) {
      return {
        kind: "cached",
        blob,
        src: HDR_ASSET_PATH,
      }
    }
  } catch {
    // Fall through to stale-cache cleanup below.
  }

  clearMetadata()

  try {
    await deleteBlobFromIndexedDb(HDR_CACHE_KEY)
  } catch {
    // Ignore stale blob cleanup failures.
  }

  return null
}

async function refreshHdrCache(): Promise<void> {
  const response = await window.fetch(HDR_ASSET_PATH)
  if (!response.ok) {
    throw new Error(`Failed to fetch HDR asset: ${response.status}`)
  }

  const blob = await response.blob()
  if (!isValidHdrBlob(blob)) {
    throw new Error("Fetched HDR asset blob is empty.")
  }

  try {
    await writeBlobToIndexedDb(HDR_CACHE_KEY, blob)
    writeMetadata()
  } catch {
    clearMetadata()
  }
}

export async function resolveHdrAsset(): Promise<ResolvedHdrAsset> {
  if (!isBrowserCacheAvailable()) {
    return { kind: "url", src: HDR_ASSET_PATH }
  }

  const cached = await readCachedHdrAsset()
  if (cached) return cached

  void refreshHdrCache().catch(() => {
    // Ignore background cache warm-up failures; the scene will use the direct HDR URL.
  })

  return { kind: "url", src: HDR_ASSET_PATH }
}
