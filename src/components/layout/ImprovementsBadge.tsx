"use client"

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { TrendingUp } from 'lucide-react'

interface ImprovementBadgeData {
  pending: number
  newThisWeek: number
  needsReview: number
  approved: number
  lastUpdated: string
}

interface ImprovementsBadgeProps {
  className?: string
  showTooltip?: boolean
  variant?: 'count' | 'status' | 'minimal'
}

export function ImprovementsBadge({ 
  className = "", 
  showTooltip = true,
  variant = 'count'
}: ImprovementsBadgeProps) {
  const [badgeData, setBadgeData] = useState<ImprovementBadgeData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadImprovementBadgeData()
  }, [])

  const loadImprovementBadgeData = async () => {
    setLoading(true)
    try {
      // Mock API call - in real app, this would call /api/improvements/badge or similar
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const mockData: ImprovementBadgeData = {
        pending: 3, // Proposed + Reviewing
        newThisWeek: 2,
        needsReview: 1, // Only reviewing status
        approved: 1,
        lastUpdated: new Date().toISOString()
      }
      
      setBadgeData(mockData)
    } catch (error) {
      console.error('Error loading improvement badge data:', error)
      // Set default values on error
      setBadgeData({
        pending: 0,
        newThisWeek: 0,
        needsReview: 0,
        approved: 0,
        lastUpdated: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading || !badgeData) {
    return null // Don't show badge while loading
  }

  const getBadgeVariant = () => {
    if (badgeData.needsReview > 0) return 'destructive' // Red for urgent review needed
    if (badgeData.pending > 0) return 'default' // Blue for pending items
    if (badgeData.approved > 0) return 'secondary' // Gray for approved items
    return 'outline' // Default for no items
  }

  const getBadgeContent = () => {
    switch (variant) {
      case 'status':
        if (badgeData.needsReview > 0) return 'Review'
        if (badgeData.pending > 0) return 'Pending'
        if (badgeData.approved > 0) return 'New'
        return null
      case 'minimal':
        return badgeData.pending > 0 ? '•' : null
      case 'count':
      default:
        return badgeData.pending > 0 ? badgeData.pending : null
    }
  }

  const getTooltipContent = () => (
    <div className="space-y-2">
      <div className="font-semibold text-sm">Improvement Proposals</div>
      <div className="space-y-1 text-xs">
        {badgeData.needsReview > 0 && (
          <div className="flex justify-between">
            <span>Needs Review:</span>
            <span className="font-medium text-red-400">{badgeData.needsReview}</span>
          </div>
        )}
        {badgeData.pending > 0 && (
          <div className="flex justify-between">
            <span>Total Pending:</span>
            <span className="font-medium">{badgeData.pending}</span>
          </div>
        )}
        {badgeData.newThisWeek > 0 && (
          <div className="flex justify-between">
            <span>New This Week:</span>
            <span className="font-medium text-blue-400">{badgeData.newThisWeek}</span>
          </div>
        )}
        {badgeData.approved > 0 && (
          <div className="flex justify-between">
            <span>Recently Approved:</span>
            <span className="font-medium text-green-400">{badgeData.approved}</span>
          </div>
        )}
      </div>
      <div className="text-xs text-muted-foreground pt-1 border-t">
        Last updated: {new Date(badgeData.lastUpdated).toLocaleTimeString()}
      </div>
    </div>
  )

  const badgeContent = getBadgeContent()
  
  if (!badgeContent) {
    return null // Don't show badge if no content
  }

  const badgeElement = (
    <Badge 
      variant={getBadgeVariant()} 
      className={`animate-pulse-slow ${variant === 'minimal' ? 'px-1.5 py-0.5 text-xs' : ''} ${className}`}
    >
      {badgeContent}
    </Badge>
  )

  if (!showTooltip) {
    return badgeElement
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          {badgeElement}
        </TooltipTrigger>
        <TooltipContent side="right" className="w-64">
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Hook for getting improvement badge data
export function useImprovementsBadgeData() {
  const [data, setData] = useState<ImprovementBadgeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 300))
        
        setData({
          pending: 3,
          newThisWeek: 2,
          needsReview: 1,
          approved: 1,
          lastUpdated: new Date().toISOString()
        })
      } catch (error) {
        console.error('Error loading badge data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return { data, loading }
}

// Helper component for sidebar integration
interface SidebarImprovementIndicatorProps {
  className?: string
}

export function SidebarImprovementIndicator({ className = "" }: SidebarImprovementIndicatorProps) {
  const { data, loading } = useImprovementsBadgeData()
  
  if (loading || !data || data.pending === 0) {
    return null
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <ImprovementsBadge variant="count" showTooltip={true} />
      {data.needsReview > 0 && (
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      )}
    </div>
  )
}

// Notification badge for urgent improvements
export function UrgentImprovementsBadge() {
  const { data, loading } = useImprovementsBadgeData()
  
  if (loading || !data || data.needsReview === 0) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="destructive" className="animate-pulse">
            <TrendingUp className="h-3 w-3 mr-1" />
            {data.needsReview} Need{data.needsReview > 1 ? '' : 's'} Review
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {data.needsReview} improvement proposal{data.needsReview > 1 ? 's' : ''} 
            {data.needsReview > 1 ? ' need' : ' needs'} immediate review
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}