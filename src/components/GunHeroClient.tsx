"use client"

// ssr: false must live inside a Client Component per Next.js 16
import dynamic from "next/dynamic"

const GunHero = dynamic(() => import("./GunHero"), { ssr: false })

interface GunHeroClientProps {
  hdrSrc: string
}

export default function GunHeroClient({ hdrSrc }: GunHeroClientProps) {
  return <GunHero hdrSrc={hdrSrc} />
}
