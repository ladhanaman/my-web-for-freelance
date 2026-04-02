import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { HDR_ASSET_PATH } from "@/lib/hdr-asset-config"

const HDR_REVISION_LENGTH = 12

let hdrRevisionPromise: Promise<string | null> | null = null

async function computeHdrAssetRevision(): Promise<string> {
  const assetPath = path.join(process.cwd(), "public", HDR_ASSET_PATH.replace(/^\//, ""))
  const buffer = await readFile(assetPath)

  return createHash("sha1")
    .update(buffer)
    .digest("hex")
    .slice(0, HDR_REVISION_LENGTH)
}

async function getHdrAssetRevision(): Promise<string | null> {
  if (!hdrRevisionPromise) {
    hdrRevisionPromise = computeHdrAssetRevision().catch((error: unknown) => {
      hdrRevisionPromise = null
      console.error("Failed to compute HDR asset revision.", error)
      return null
    })
  }

  return hdrRevisionPromise
}

export async function getHdrAssetSrc(): Promise<string> {
  const revision = await getHdrAssetRevision()
  if (!revision) return HDR_ASSET_PATH

  return `${HDR_ASSET_PATH}?v=${revision}`
}
