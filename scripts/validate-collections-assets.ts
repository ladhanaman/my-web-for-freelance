import { promises as fs } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

const PUBLIC_ROOT = path.resolve(process.cwd(), "public")
const SOURCE_ROOT = path.resolve(process.cwd(), "assets/photos-originals")
const KEBAB_CASE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

interface CollectionShape {
  slug: string
  name: string
  coverPhoto: string
  photos: string[]
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

function toPublicAssetPath(assetPath: string): string {
  return path.resolve(PUBLIC_ROOT, `.${assetPath}`)
}

function hasPathTraversal(assetPath: string): boolean {
  return assetPath.includes("..")
}

async function main(): Promise<void> {
  const moduleUrl = pathToFileURL(path.resolve(process.cwd(), "src/lib/collections.ts")).href
  const loaded = (await import(moduleUrl)) as {
    COLLECTIONS?: CollectionShape[]
  }
  const collections = Array.isArray(loaded.COLLECTIONS) ? loaded.COLLECTIONS : []

  if (collections.length === 0) {
    throw new Error("No collections were loaded from src/lib/collections.ts")
  }

  const errors: string[] = []
  const seenSlugs = new Set<string>()

  for (const collection of collections) {
    if (!KEBAB_CASE_SLUG.test(collection.slug)) {
      errors.push(
        `Collection "${collection.name}" has non-kebab-case slug "${collection.slug}".`
      )
    }

    if (seenSlugs.has(collection.slug)) {
      errors.push(`Duplicate collection slug "${collection.slug}".`)
    }
    seenSlugs.add(collection.slug)

    const sourceDir = path.join(SOURCE_ROOT, collection.slug)
    if (!(await pathExists(sourceDir))) {
      errors.push(`Missing source folder for slug "${collection.slug}": ${sourceDir}`)
    }

    const assetPaths = [collection.coverPhoto, ...collection.photos]
    for (const assetPath of assetPaths) {
      if (!assetPath.startsWith("/photos/")) {
        errors.push(
          `Collection "${collection.slug}" has non-photos asset path "${assetPath}".`
        )
        continue
      }

      if (hasPathTraversal(assetPath)) {
        errors.push(
          `Collection "${collection.slug}" has unsafe asset path "${assetPath}" (contains "..").`
        )
        continue
      }

      const fileName = path.posix.basename(assetPath)
      if (fileName.includes("..")) {
        errors.push(
          `Collection "${collection.slug}" has malformed file name "${assetPath}".`
        )
        continue
      }

      const absolutePublicPath = toPublicAssetPath(assetPath)
      if (!absolutePublicPath.startsWith(PUBLIC_ROOT)) {
        errors.push(
          `Collection "${collection.slug}" resolves outside public root: "${assetPath}".`
        )
        continue
      }

      if (!(await pathExists(absolutePublicPath))) {
        errors.push(
          `Collection "${collection.slug}" is missing public asset "${assetPath}".`
        )
      }
    }
  }

  if (errors.length > 0) {
    console.error("Collection asset validation failed:")
    for (const error of errors) {
      console.error(`- ${error}`)
    }
    process.exitCode = 1
    return
  }

  console.log(`Collection asset validation passed for ${collections.length} collections.`)
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown validation error"
  console.error(`Collection asset validation failed: ${message}`)
  process.exitCode = 1
})
