'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface WorkflowApproval {
  runId: string
  workflowName: string
  stepName: string
  stepNumber: number
  totalSteps: number
  approver: 'owner' | 'admin'
  requestedAt: string
  description?: string
}

interface WorkflowApprovalNotificationProps {
  className?: string
  onApprovalAction?: (runId: string, approved: boolean) => void
}

export default function WorkflowApprovalNotification({ 
  className, 
  onApprovalAction 
}: WorkflowApprovalNotificationProps) {
  const [pendingApprovals, setPendingApprovals] = useState<WorkflowApproval[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingApprovals()
    
    // Poll for new approvals every 30 seconds
    const interval = setInterval(fetchPendingApprovals, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchPendingApprovals = async () => {
    try {
      const response = await fetch('/api/workflows/approvals/pending')
      
      if (response.ok) {
        const data = await response.json()
        setPendingApprovals(data.approvals || [])
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error)
    }
  }

  const handleApproval = async (runId: string, approved: boolean) => {
    try {
      setProcessing(runId)
      
      const response = await fetch('/api/workflows/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId, approved })
      })

      if (!response.ok) {
        throw new Error('Failed to process approval')
      }

      // Remove from pending list
      setPendingApprovals(prev => prev.filter(approval => approval.runId !== runId))
      
      // Notify parent component
      onApprovalAction?.(runId, approved)

      // Show success message (in real app, use toast)
      console.log(`Workflow ${approved ? 'approved' : 'rejected'}: ${runId}`)

    } catch (error) {
      console.error('Error processing approval:', error)
    } finally {
      setProcessing(null)
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  if (pendingApprovals.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-orange-500" />
        <h3 className="font-semibold text-orange-700">
          Workflow Approvals Needed ({pendingApprovals.length})
        </h3>
      </div>

      <div className="space-y-3">
        {pendingApprovals.map((approval) => (
          <Card key={approval.runId} className="border-orange-200 bg-orange-50/50">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium text-orange-900">
                      {approval.workflowName}
                    </h4>
                    <p className="text-sm text-orange-700">
                      Step {approval.stepNumber}/{approval.totalSteps}: {approval.stepName}
                    </p>
                    {approval.description && (
                      <p className="text-sm text-muted-foreground">
                        {approval.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      {approval.approver.toUpperCase()}
                    </Badge>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getTimeAgo(approval.requestedAt)}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(approval.stepNumber / approval.totalSteps) * 100}%` 
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Workflow is {Math.round((approval.stepNumber / approval.totalSteps) * 100)}% complete
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <Link 
                    href={`/automations/${approval.runId}/runs`}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    View Details
                    <ExternalLink className="h-3 w-3" />
                  </Link>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleApproval(approval.runId, false)}
                      disabled={processing === approval.runId}
                      className="h-8"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Reject & Stop
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleApproval(approval.runId, true)}
                      disabled={processing === approval.runId}
                      className="h-8 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approve & Continue
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Dashboard card version for main dashboard
export function WorkflowApprovalCard({ className }: { className?: string }) {
  const [approvalCount, setApprovalCount] = useState(0)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch('/api/workflows/approvals/pending')
        
        if (response.ok) {
          const data = await response.json()
          setApprovalCount(data.approvals?.length || 0)
        }
      } catch (error) {
        console.error('Error fetching approval count:', error)
      }
    }

    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  if (approvalCount === 0) {
    return null
  }

  return (
    <Link href="/automations?tab=approvals">
      <Card className={cn('cursor-pointer hover:shadow-md transition-shadow border-orange-200 bg-orange-50/30', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Bell className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium text-orange-900">Approval Needed</h3>
                <p className="text-sm text-orange-700">
                  {approvalCount} workflow{approvalCount > 1 ? 's' : ''} waiting
                </p>
              </div>
            </div>

            <Badge className="bg-orange-600 hover:bg-orange-700">
              {approvalCount}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// Bell notification for header
export function WorkflowApprovalBell({ className }: { className?: string }) {
  const [hasApprovals, setHasApprovals] = useState(false)

  useEffect(() => {
    const checkApprovals = async () => {
      try {
        const response = await fetch('/api/workflows/approvals/pending')
        
        if (response.ok) {
          const data = await response.json()
          setHasApprovals((data.approvals?.length || 0) > 0)
        }
      } catch (error) {
        console.error('Error checking approvals:', error)
      }
    }

    checkApprovals()
    const interval = setInterval(checkApprovals, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Link href="/automations?tab=approvals">
      <Button 
        variant="ghost" 
        size="sm"
        className={cn('relative', className)}
      >
        <Bell className="h-5 w-5" />
        {hasApprovals && (
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-orange-500 rounded-full animate-pulse" />
        )}
      </Button>
    </Link>
  )
}