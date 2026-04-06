'use client'

import { ReactNode } from 'react'
import { BlogProvider } from '@/context/BlogContext'
import { BlogTransition } from '@/components/BlogTransition'

export function RootClientProviders({ children }: { children: ReactNode }) {
  return (
    <BlogProvider>
      {children}
      <BlogTransition />
    </BlogProvider>
  )
}
