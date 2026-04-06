'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface BlogContextType {
  isBlogOpen: boolean
  toggleBlog: () => void
}

const BlogContext = createContext<BlogContextType | undefined>(undefined)

export function BlogProvider({ children }: { children: ReactNode }) {
  const [isBlogOpen, setIsBlogOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleBlog = () => {
    setIsBlogOpen(prev => !prev)
  }

  // Handle navigation when isBlogOpen changes
  useEffect(() => {
    if (!mounted) return
    if (isBlogOpen) {
      router.push('/blog')
    } else {
      router.push('/')
    }
  }, [isBlogOpen, mounted, router])

  // Listen for B key press
  useEffect(() => {
    if (!mounted) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger on 'B' or 'b' key
      if ((e.key === 'b' || e.key === 'B') && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        toggleBlog()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isBlogOpen, mounted])

  return (
    <BlogContext.Provider value={{ isBlogOpen, toggleBlog }}>
      {children}
    </BlogContext.Provider>
  )
}

export function useBlog() {
  const context = useContext(BlogContext)
  if (!context) {
    throw new Error('useBlog must be used within BlogProvider')
  }
  return context
}
