'use client'

import dynamic from 'next/dynamic'

// dynamic + ssr:false must live in a Client Component — not a Server Component
const LandingPage = dynamic(() => import('@/components/LandingPage'), { ssr: false })

export default function LandingPageWrapper() {
  return <LandingPage />
}
