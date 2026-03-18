"use client"

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface SidebarImprovementIndicatorProps {
  className?: string
}

export function SidebarImprovementIndicator({ className }: SidebarImprovementIndicatorProps) {
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchImprovements = async () => {
      try {
        const response = await fetch('/api/improvements?status=pending')
        if (response.ok) {
          const data = await response.json()
          setPendingCount(data.data?.length || 0)
        } else {
          // Fallback to mock data
          setPendingCount(2) // Mock pending improvements
        }
      } catch (error) {
        console.error('Error fetching improvements:', error)
        // Fallback to mock data
        setPendingCount(2)
      } finally {
        setLoading(false)
      }
    }

    fetchImprovements()
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchImprovements, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className={cn("w-4 h-4 bg-muted rounded-full animate-pulse", className)} />
    )
  }

  if (pendingCount === 0) {
    return null
  }

  return (
    <Badge 
      variant="destructive" 
      className={cn(
        "h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center",
        pendingCount > 9 ? "text-[10px]" : "",
        className
      )}
    >
      {pendingCount > 99 ? '99+' : pendingCount}
    </Badge>
  )
}