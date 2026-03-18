"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { 
  Bell,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Settings,
  Eye,
  MoreHorizontal,
  Loader2
} from 'lucide-react'

interface PendingApproval {
  id: string
  workflowRunId: string
  workflowName: string
  stepName: string
  message: string
  projectName?: string
  createdAt: string
  priority: 'low' | 'medium' | 'high'
}

interface WorkflowApprovalNotificationProps {
  className?: string
  onApprove?: (runId: string) => Promise<void>
  onReject?: (runId: string) => Promise<void>
  onViewDetails?: (runId: string) => void
}

export function WorkflowApprovalNotification({ 
  className = "",
  onApprove,
  onReject,
  onViewDetails 
}: WorkflowApprovalNotificationProps) {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    loadPendingApprovals()
    
    // Poll for new approvals every 30 seconds
    const interval = setInterval(loadPendingApprovals, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadPendingApprovals = async () => {
    try {
      // Mock API call - replace with real API
      const mockApprovals: PendingApproval[] = [
        {
          id: 'approval-1',
          workflowRunId: 'run-123',
          workflowName: 'Idea to MVP',
          stepName: 'Wait for Owner Approval',
          message: 'Master plan is ready for your review. Approve to proceed with task breakdown?',
          projectName: 'E-commerce Platform',
          createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          priority: 'high'
        },
        {
          id: 'approval-2',
          workflowRunId: 'run-456',
          workflowName: 'Deploy Pipeline',
          stepName: 'Deploy to Production?',
          message: 'Staging deployment successful. Deploy to production?',
          projectName: 'Blog CMS',
          createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          priority: 'medium'
        }
      ]
      
      setPendingApprovals(mockApprovals)
    } catch (error) {
      console.error('Failed to load pending approvals:', error)
    }
  }

  const handleApprove = async (approval: PendingApproval) => {
    if (!onApprove) return
    
    setActionLoading(approval.id)
    try {
      await onApprove(approval.workflowRunId)
      setPendingApprovals(prev => prev.filter(a => a.id !== approval.id))
      setSelectedApproval(null)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to approve workflow:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (approval: PendingApproval) => {
    if (!onReject) return
    
    setActionLoading(approval.id)
    try {
      await onReject(approval.workflowRunId)
      setPendingApprovals(prev => prev.filter(a => a.id !== approval.id))
      setSelectedApproval(null)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to reject workflow:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200'
      default: return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    const hours = Math.floor(diffInMinutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const urgentApprovals = pendingApprovals.filter(a => a.priority === 'high')
  const hasUrgentApprovals = urgentApprovals.length > 0

  return (
    <>
      {/* Bell Notification Icon */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`relative ${className}`}
          >
            <Bell className="h-4 w-4" />
            {pendingApprovals.length > 0 && (
              <>
                <Badge
                  variant={hasUrgentApprovals ? "destructive" : "default"}
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                >
                  {pendingApprovals.length > 9 ? '9+' : pendingApprovals.length}
                </Badge>
                {hasUrgentApprovals && (
                  <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-96">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>⏸️ Workflow Approvals</span>
            {pendingApprovals.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {pendingApprovals.length} pending
              </Badge>
            )}
          </DropdownMenuLabel>
          
          {pendingApprovals.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No pending approvals</p>
            </div>
          ) : (
            <>
              {pendingApprovals.map((approval) => (
                <DropdownMenuItem
                  key={approval.id}
                  className="p-3 cursor-pointer focus:bg-muted"
                  onClick={() => {
                    setSelectedApproval(approval)
                    setShowDetails(true)
                  }}
                >
                  <div className="flex items-start space-x-3 w-full">
                    <AlertCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                      approval.priority === 'high' ? 'text-red-600' : 'text-amber-600'
                    }`} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {approval.workflowName}
                        </h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getPriorityColor(approval.priority)}`}
                        >
                          {approval.priority}
                        </Badge>
                      </div>
                      
                      {approval.projectName && (
                        <p className="text-xs text-muted-foreground mb-1">
                          Project: {approval.projectName}
                        </p>
                      )}
                      
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {approval.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(approval.createdAt)}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              onViewDetails?.(approval.workflowRunId)
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                onClick={() => {
                  setIsOpen(false)
                  // Navigate to full approvals page
                }}
                className="text-center text-muted-foreground text-xs"
              >
                View all workflows →
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dashboard Card for Approval Needed */}
      {pendingApprovals.length > 0 && (
        <Card className={`border-amber-500 bg-amber-50 ${className}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2 text-amber-800">
              <AlertCircle className="h-5 w-5" />
              <span>⏸️ Approval needed: {pendingApprovals[0].workflowName}</span>
            </CardTitle>
            <CardDescription className="text-amber-700">
              {pendingApprovals[0].stepName} • {pendingApprovals[0].projectName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-amber-800 mb-3">
                {pendingApprovals[0].message}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                size="sm"
                onClick={() => handleApprove(pendingApprovals[0])}
                disabled={actionLoading === pendingApprovals[0].id}
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading === pendingApprovals[0].id ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <CheckCircle className="h-3 w-3 mr-1" />
                )}
                ✅ Approve & Continue
              </Button>
              <Button 
                size="sm"
                variant="destructive"
                onClick={() => handleReject(pendingApprovals[0])}
                disabled={actionLoading === pendingApprovals[0].id}
              >
                {actionLoading === pendingApprovals[0].id ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <XCircle className="h-3 w-3 mr-1" />
                )}
                ❌ Reject & Stop
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => onViewDetails?.(pendingApprovals[0].workflowRunId)}
              >
                <Eye className="h-3 w-3 mr-1" />
                View Details
              </Button>
            </div>
            
            {pendingApprovals.length > 1 && (
              <div className="mt-3 pt-3 border-t border-amber-200">
                <p className="text-xs text-amber-700">
                  + {pendingApprovals.length - 1} more workflow{pendingApprovals.length > 2 ? 's' : ''} waiting for approval
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detailed Approval Dialog */}
      <Dialog open={showDetails && selectedApproval !== null} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          {selectedApproval && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <span>Workflow Approval Required</span>
                </DialogTitle>
                <DialogDescription>
                  {selectedApproval.workflowName} • {selectedApproval.stepName}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-medium text-amber-800 mb-2">Approval Message</h4>
                  <p className="text-amber-700">{selectedApproval.message}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Workflow:</span> {selectedApproval.workflowName}
                  </div>
                  <div>
                    <span className="font-medium">Project:</span> {selectedApproval.projectName || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Step:</span> {selectedApproval.stepName}
                  </div>
                  <div>
                    <span className="font-medium">Waiting:</span> {formatTimeAgo(selectedApproval.createdAt)}
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <div className="flex items-center space-x-2 w-full">
                  <Button
                    variant="outline"
                    onClick={() => onViewDetails?.(selectedApproval.workflowRunId)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Full Details
                  </Button>
                  <Button 
                    onClick={() => handleReject(selectedApproval)}
                    disabled={actionLoading === selectedApproval.id}
                    variant="destructive"
                  >
                    {actionLoading === selectedApproval.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Reject
                  </Button>
                  <Button 
                    onClick={() => handleApprove(selectedApproval)}
                    disabled={actionLoading === selectedApproval.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {actionLoading === selectedApproval.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Approve
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}