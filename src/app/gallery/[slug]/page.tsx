import { notFound } from "next/navigation"
import { COLLECTIONS, PAGE_NAMES } from "@/lib/collections"
import GalleryClient from "@/components/GalleryClient"
import type { Metadata } from "next"

// Pre-generate all gallery pages at build time
export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const collection = COLLECTIONS.find((c) => c.slug === slug)
  if (!collection) return {}
  return {
    title: `${collection.name} — ${PAGE_NAMES.gallery}`,
    description: collection.description,
  }
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const collection = COLLECTIONS.find((c) => c.slug === slug)

  if (!collection) notFound()

  return <GalleryClient collection={collection} />
}
