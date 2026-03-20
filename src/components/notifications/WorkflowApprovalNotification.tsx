"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, CheckSquare, X, Clock, Zap, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ApprovalNotification {
  id: string
  workflow_id: string
  workflow_name: string
  run_id: string
  step_name: string
  step_number: number
  total_steps: number
  approval_message: string
  required_role: string
  requested_at: string
  project_id?: string
  urgency: 'low' | 'medium' | 'high'
}

interface WorkflowApprovalNotificationProps {
  notification: ApprovalNotification
  onApprove?: (runId: string) => void
  onReject?: (runId: string) => void
  onDismiss?: (notificationId: string) => void
  showActions?: boolean
  compact?: boolean
}

export function WorkflowApprovalNotification({
  notification,
  onApprove,
  onReject,
  onDismiss,
  showActions = true,
  compact = false
}: WorkflowApprovalNotificationProps) {
  const router = useRouter()
  const [processing, setProcessing] = useState(false)

  const handleApprove = async () => {
    if (!onApprove) return
    
    setProcessing(true)
    try {
      await onApprove(notification.run_id)
      onDismiss?.(notification.id)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Approval failed:', error);
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!onReject) return
    
    setProcessing(true)
    try {
      await onReject(notification.run_id)
      onDismiss?.(notification.id)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Rejection failed:', error);
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleViewDetails = () => {
    router.push(`/dashboard/automations/${notification.workflow_id}/runs`)
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20'
      case 'medium': return 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20'
      case 'low': return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
      default: return 'border-l-gray-300 bg-gray-50/50 dark:bg-gray-950/20'
    }
  }

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">High Priority</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Medium Priority</Badge>
      case 'low':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Low Priority</Badge>
      default:
        return <Badge variant="outline">Normal</Badge>
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (compact) {
    return (
      <div className={`border-l-4 p-3 rounded-lg ${getUrgencyColor(notification.urgency)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span className="font-medium text-sm">
              {notification.workflow_name} needs approval
            </span>
            {getUrgencyBadge(notification.urgency)}
          </div>
          <div className="flex items-center space-x-1">
            {showActions && (
              <>
                <Button 
                  size="sm" 
                  className="h-6 text-xs bg-green-600 hover:bg-green-700"
                  onClick={handleApprove}
                  disabled={processing}
                >
                  <CheckSquare className="h-3 w-3" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-6 text-xs text-red-600 hover:text-red-700"
                  onClick={handleReject}
                  disabled={processing}
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            )}
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 text-xs"
              onClick={handleViewDetails}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Step {notification.step_number}/{notification.total_steps}: {notification.step_name}
        </p>
      </div>
    )
  }

  return (
    <Card className={`border-l-4 ${getUrgencyColor(notification.urgency)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center space-x-2">
                <span>⏸️ Workflow Approval Required</span>
                {getUrgencyBadge(notification.urgency)}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {notification.workflow_name} is waiting for your approval
              </p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {formatTimeAgo(notification.requested_at)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Workflow Progress */}
        <div className="flex items-center space-x-4 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-sm">{notification.workflow_name}</span>
          </div>
          <Badge variant="outline">
            Step {notification.step_number} of {notification.total_steps}
          </Badge>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((notification.step_number - 1) / notification.total_steps) * 100}%` }}
            />
          </div>
        </div>

        {/* Approval Step Details */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Current Step: {notification.step_name}</h4>
          <p className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded border-l-2 border-blue-200 dark:border-blue-800">
            {notification.approval_message}
          </p>
        </div>

        {/* Required Role */}
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-muted-foreground">Required role:</span>
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            {notification.required_role}
          </Badge>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center justify-between pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewDetails}
              className="flex items-center space-x-1"
            >
              <ExternalLink className="h-3 w-3" />
              <span>View Details</span>
            </Button>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReject}
                disabled={processing}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-3 w-3 mr-1" />
                Reject & Stop
              </Button>
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={processing}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckSquare className="h-3 w-3 mr-1" />
                {processing ? 'Processing...' : 'Approve & Continue'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

/**
 * Bell Icon Notification Indicator
 * Shows count of pending approvals
 */
interface NotificationBellProps {
  approvalCount?: number
  onClick?: () => void
}

export function WorkflowApprovalBell({ approvalCount = 0, onClick }: NotificationBellProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="relative"
      onClick={onClick}
    >
      <Bell className="h-4 w-4" />
      {approvalCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
          {approvalCount > 9 ? '9+' : approvalCount}
        </span>
      )}
    </Button>
  )
}

/**
 * Dashboard Card for Pending Approvals
 */
interface ApprovalDashboardCardProps {
  approvals: ApprovalNotification[]
  onApprove?: (runId: string) => void
  onReject?: (runId: string) => void
  onViewAll?: () => void
}

export function ApprovalDashboardCard({ 
  approvals, 
  onApprove, 
  onReject, 
  onViewAll 
}: ApprovalDashboardCardProps) {
  if (approvals.length === 0) {
    return null
  }

  return (
    <Card className="border-l-4 border-l-yellow-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Clock className="h-5 w-5 text-yellow-600" />
          <span>⏸️ Approval Needed</span>
          <Badge className="bg-yellow-100 text-yellow-800">
            {approvals.length} workflow{approvals.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {approvals.slice(0, 3).map((approval) => (
          <WorkflowApprovalNotification
            key={approval.id}
            notification={approval}
            onApprove={onApprove}
            onReject={onReject}
            compact={true}
          />
        ))}
        
        {approvals.length > 3 && (
          <Button variant="outline" size="sm" onClick={onViewAll} className="w-full">
            View All {approvals.length} Pending Approvals
          </Button>
        )}
      </CardContent>
    </Card>
  )
}