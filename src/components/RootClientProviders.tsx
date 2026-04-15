'use client'

import { ReactNode } from 'react'
import { ParallaxProvider } from '@/context/ParallaxContext'
import { ParallaxTransition } from '@/components/ParallaxTransition'

export function RootClientProviders({ children }: { children: ReactNode }) {
  return (
    <ParallaxProvider>
      {children}
      <ParallaxTransition />
    </ParallaxProvider>
  )
}
