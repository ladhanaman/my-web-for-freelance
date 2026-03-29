import { promises as fs } from "node:fs"
import path from "node:path"

import sharp from "sharp"

type OptimizationKind = "cover" | "gallery"
type OptimizationStatus = "generated" | "skipped" | "failed"

interface OptimizationTarget {
  sourcePath: string
  outputPath: string
  relativePath: string
  kind: OptimizationKind
  maxWidth: number
  originalBytes: number
  sourceMtimeMs: number
}

interface OptimizationResult {
  sourcePath: string
  outputPath: string
  relativePath: string
  kind: OptimizationKind
  status: OptimizationStatus
  originalBytes: number
  outputBytes: number
  reductionPercent: number | null
  errorMessage?: string
}

const SOURCE_ROOT = path.resolve(process.cwd(), "assets/photos-originals")
const OUTPUT_ROOT = path.resolve(process.cwd(), "public/photos")
const DRY_RUN_FLAG = "--dry-run"
const FORCE_FLAG = "--force"
const VALID_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"])
const COVER_MAX_WIDTH = 1600
const GALLERY_MAX_WIDTH = 2000
const WEBP_QUALITY = 82
const WEBP_EFFORT = 6

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"

  const units = ["B", "KB", "MB", "GB"]
  let value = bytes
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function getReductionPercent(originalBytes: number, outputBytes: number): number | null {
  if (originalBytes <= 0) return null
  return Number((((originalBytes - outputBytes) / originalBytes) * 100).toFixed(1))
}

function toWebpRelativePath(relativePath: string): string {
  const parsedPath = path.parse(relativePath)
  return path.join(parsedPath.dir, `${parsedPath.name}.webp`)
}

function getOptimizationKind(fileName: string): OptimizationKind {
  return /^cover\./i.test(fileName) ? "cover" : "gallery"
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

async function collectTargets(rootPath: string): Promise<OptimizationTarget[]> {
  const targets: OptimizationTarget[] = []

  async function walk(currentPath: string): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true })

    for (const entry of entries) {
      const absolutePath = path.join(currentPath, entry.name)

      if (entry.isDirectory()) {
        await walk(absolutePath)
        continue
      }

      if (!entry.isFile()) {
        continue
      }

      const extension = path.extname(entry.name).toLowerCase()
      if (!VALID_EXTENSIONS.has(extension)) {
        continue
      }

      const relativePath = path.relative(rootPath, absolutePath)
      const kind = getOptimizationKind(entry.name)
      const outputRelativePath = toWebpRelativePath(relativePath)
      const outputPath = path.join(OUTPUT_ROOT, outputRelativePath)
      const stat = await fs.stat(absolutePath)

      targets.push({
        sourcePath: absolutePath,
        outputPath,
        relativePath,
        kind,
        maxWidth: kind === "cover" ? COVER_MAX_WIDTH : GALLERY_MAX_WIDTH,
        originalBytes: stat.size,
        sourceMtimeMs: stat.mtimeMs,
      })
    }
  }

  await walk(rootPath)
  return targets.sort((a, b) => a.relativePath.localeCompare(b.relativePath))
}

async function optimizeTarget(
  target: OptimizationTarget,
  { dryRun, force }: { dryRun: boolean; force: boolean }
): Promise<OptimizationResult> {
  try {
    const outputExists = await pathExists(target.outputPath)

    if (!force && outputExists) {
      const outputStat = await fs.stat(target.outputPath)
      if (outputStat.mtimeMs >= target.sourceMtimeMs) {
        return {
          sourcePath: target.sourcePath,
          outputPath: target.outputPath,
          relativePath: target.relativePath,
          kind: target.kind,
          status: "skipped",
          originalBytes: target.originalBytes,
          outputBytes: outputStat.size,
          reductionPercent: getReductionPercent(target.originalBytes, outputStat.size),
        }
      }
    }

    if (dryRun) {
      return {
        sourcePath: target.sourcePath,
        outputPath: target.outputPath,
        relativePath: target.relativePath,
        kind: target.kind,
        status: "generated",
        originalBytes: target.originalBytes,
        outputBytes: 0,
        reductionPercent: null,
      }
    }

    await fs.mkdir(path.dirname(target.outputPath), { recursive: true })

    await sharp(target.sourcePath)
      .rotate()
      .resize({
        width: target.maxWidth,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: WEBP_QUALITY,
        effort: WEBP_EFFORT,
      })
      .toFile(target.outputPath)

    const outputStat = await fs.stat(target.outputPath)

    return {
      sourcePath: target.sourcePath,
      outputPath: target.outputPath,
      relativePath: target.relativePath,
      kind: target.kind,
      status: "generated",
      originalBytes: target.originalBytes,
      outputBytes: outputStat.size,
      reductionPercent: getReductionPercent(target.originalBytes, outputStat.size),
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown optimization error"

    return {
      sourcePath: target.sourcePath,
      outputPath: target.outputPath,
      relativePath: target.relativePath,
      kind: target.kind,
      status: "failed",
      originalBytes: target.originalBytes,
      outputBytes: 0,
      reductionPercent: null,
      errorMessage,
    }
  }
}

function printRunSummary(results: OptimizationResult[], dryRun: boolean): void {
  const rows = results.map((result) => ({
    file: result.relativePath,
    kind: result.kind,
    status: result.status,
    source: formatBytes(result.originalBytes),
    output: dryRun && result.status !== "skipped" ? "dry-run" : formatBytes(result.outputBytes),
    reduction:
      result.reductionPercent === null
        ? dryRun && result.status !== "skipped"
          ? "n/a"
          : "0%"
        : `${result.reductionPercent}%`,
    error: result.errorMessage ?? "",
  }))

  console.table(rows)

  const totals = results.reduce(
    (acc, result) => {
      acc.originalBytes += result.originalBytes
      acc.outputBytes += result.outputBytes
      acc[result.status] += 1
      return acc
    },
    {
      originalBytes: 0,
      outputBytes: 0,
      generated: 0,
      skipped: 0,
      failed: 0,
    }
  )

  const totalReduction =
    dryRun || totals.outputBytes === 0
      ? "n/a"
      : `${getReductionPercent(totals.originalBytes, totals.outputBytes) ?? 0}%`

  console.log("")
  console.log(`Targets: ${results.length}`)
  console.log(`Generated: ${totals.generated}`)
  console.log(`Skipped: ${totals.skipped}`)
  console.log(`Failed: ${totals.failed}`)
  console.log(`Source bytes: ${formatBytes(totals.originalBytes)}`)
  console.log(
    `Output bytes: ${dryRun ? "n/a" : formatBytes(totals.outputBytes)}`
  )
  console.log(`Reduction: ${totalReduction}`)
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2))
  const dryRun = args.has(DRY_RUN_FLAG)
  const force = args.has(FORCE_FLAG)

  if (!(await pathExists(SOURCE_ROOT))) {
    throw new Error(`Source root not found: ${SOURCE_ROOT}`)
  }

  const targets = await collectTargets(SOURCE_ROOT)
  if (targets.length === 0) {
    console.log(`No source images found in ${SOURCE_ROOT}`)
    return
  }

  console.log(
    `${dryRun ? "Planning" : "Optimizing"} ${targets.length} images from ${SOURCE_ROOT} to ${OUTPUT_ROOT}`
  )

  const results: OptimizationResult[] = []
  for (const target of targets) {
    const result = await optimizeTarget(target, { dryRun, force })
    results.push(result)
  }

  printRunSummary(results, dryRun)

  if (results.some((result) => result.status === "failed")) {
    process.exitCode = 1
  }
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown fatal error"
  console.error(`Photo optimization failed: ${message}`)
  process.exitCode = 1
})
