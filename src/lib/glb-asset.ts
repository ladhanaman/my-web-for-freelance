import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import path from "node:path"

const GLB_ASSET_PATH = "/flintlock_pistol.glb"
const GLB_REVISION_LENGTH = 12

let glbRevisionPromise: Promise<string | null> | null = null

async function computeGlbAssetRevision(): Promise<string> {
  const assetPath = path.join(process.cwd(), "public", GLB_ASSET_PATH.replace(/^\//, ""))
  const buffer = await readFile(assetPath)

  return createHash("sha1")
    .update(buffer)
    .digest("hex")
    .slice(0, GLB_REVISION_LENGTH)
}

async function getGlbAssetRevision(): Promise<string | null> {
  if (!glbRevisionPromise) {
    glbRevisionPromise = computeGlbAssetRevision().catch((error: unknown) => {
      glbRevisionPromise = null
      console.error("Failed to compute GLB asset revision.", error)
      return null
    })
  }

  return glbRevisionPromise
}

export async function getGlbAssetSrc(): Promise<string> {
  const revision = await getGlbAssetRevision()
  if (!revision) return GLB_ASSET_PATH

  return `${GLB_ASSET_PATH}?v=${revision}`
}
