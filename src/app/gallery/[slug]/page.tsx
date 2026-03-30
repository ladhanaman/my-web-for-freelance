import { redirect } from "next/navigation"

import GalleryClient from "@/components/GalleryClient"
import { COLLECTIONS, getAdjacentCollections } from "@/lib/collections"
import { FRAMESCAPE_HREF } from "@/lib/home-entry"

interface GalleryPageProps {
  params: Promise<{
    slug: string
  }>
}

export function generateStaticParams() {
  return COLLECTIONS.map(({ slug }) => ({ slug }))
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { slug } = await params
  const collection = COLLECTIONS.find((item) => item.slug === slug)

  if (!collection) {
    redirect(FRAMESCAPE_HREF)
  }

  const { prev, next } = getAdjacentCollections(slug)

  return <GalleryClient collection={collection} prev={prev} next={next} />
}
