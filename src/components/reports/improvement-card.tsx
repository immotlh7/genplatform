"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  CheckCircle,
  X,
  Clock,
  TrendingUp,
  Zap,
  Shield,
  Users,
  Bug,
  Lightbulb,
  AlertTriangle
} from 'lucide-react'

export interface Improvement {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'approved' | 'rejected' | 'implemented'
  estimatedImpact: 'high' | 'medium' | 'low'
  estimatedEffort: 'high' | 'medium' | 'low'
  category: 'performance' | 'security' | 'usability' | 'feature' | 'bug'
  createdAt: string
  updatedAt: string
  reviewedBy?: string
  reviewedAt?: string
  implementedAt?: string
}

interface ImprovementCardProps {
  improvement: Improvement
  onApprove?: (id: string, notes: string) => void
  onReject?: (id: string, reason: string) => void
  showActions?: boolean
  compact?: boolean
}

export function ImprovementCard({ 
  improvement, 
  onApprove, 
  onReject, 
  showActions = true,
  compact = false 
}: ImprovementCardProps) {
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [approvalNotes, setApprovalNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-500 border-red-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
      case 'low': return 'bg-green-500/20 text-green-500 border-green-500/30'
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-500'
      case 'rejected': return 'bg-red-500/20 text-red-500'
      case 'implemented': return 'bg-blue-500/20 text-blue-500'
      case 'pending': return 'bg-yellow-500/20 text-yellow-500'
      default: return 'bg-zinc-500/20 text-zinc-400'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-zinc-600'
    }
  }

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-zinc-600'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return TrendingUp
      case 'security': return Shield
      case 'usability': return Users
      case 'feature': return Zap
      case 'bug': return Bug
      default: return Lightbulb
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'performance': return 'text-blue-600'
      case 'security': return 'text-red-600'
      case 'usability': return 'text-green-600'
      case 'feature': return 'text-purple-600'
      case 'bug': return 'text-orange-600'
      default: return 'text-zinc-600'
    }
  }

  const handleApprove = async () => {
    setApproving(true)
    try {
      await onApprove?.(improvement.id, approvalNotes)
    } catch (error) {
      console.error('Error approving improvement:', error)
    } finally {
      setApproving(false)
      setApprovalNotes('')
    }
  }

  const handleReject = async () => {
    setRejecting(true)
    try {
      await onReject?.(improvement.id, rejectionReason)
    } catch (error) {
      console.error('Error rejecting improvement:', error)
    } finally {
      setRejecting(false)
      setRejectionReason('')
    }
  }

  const CategoryIcon = getCategoryIcon(improvement.category)

  if (compact) {
    return (
      <Card className="hover:shadow-sm transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <CategoryIcon className={`h-4 w-4 ${getCategoryColor(improvement.category)}`} />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-medium truncate">{improvement.title}</h4>
                <p className="text-xs text-muted-foreground truncate">{improvement.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={`text-xs ${getPriorityColor(improvement.priority)}`}>
                {improvement.priority}
              </Badge>
              <Badge variant="outline" className={`text-xs ${getStatusColor(improvement.status)}`}>
                {improvement.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center space-x-2">
              <CategoryIcon className={`h-4 w-4 ${getCategoryColor(improvement.category)}`} />
              <Badge variant="outline" className={`text-xs ${getPriorityColor(improvement.priority)}`}>
                {improvement.priority} priority
              </Badge>
              <Badge variant="outline" className={`text-xs ${getStatusColor(improvement.status)}`}>
                {improvement.status}
              </Badge>
            </div>
            <CardTitle className="text-base leading-tight">{improvement.title}</CardTitle>
            <CardDescription className="text-sm">{improvement.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-muted-foreground">Impact</div>
            <div className={`font-medium ${getImpactColor(improvement.estimatedImpact)}`}>
              {improvement.estimatedImpact}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Effort</div>
            <div className={`font-medium ${getEffortColor(improvement.estimatedEffort)}`}>
              {improvement.estimatedEffort}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Category</div>
            <div className={`font-medium capitalize ${getCategoryColor(improvement.category)}`}>
              {improvement.category}
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="space-y-1 text-xs text-muted-foreground border-t pt-3">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>Created: {formatDate(improvement.createdAt)}</span>
          </div>
          {improvement.reviewedAt && improvement.reviewedBy && (
            <div className="flex items-center space-x-1">
              {improvement.status === 'approved' ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <X className="h-3 w-3 text-red-500" />
              )}
              <span>
                {improvement.status === 'approved' ? 'Approved' : 'Rejected'} by {improvement.reviewedBy} on {formatDate(improvement.reviewedAt)}
              </span>
            </div>
          )}
          {improvement.implementedAt && (
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-3 w-3 text-blue-500" />
              <span>Implemented: {formatDate(improvement.implementedAt)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && improvement.status === 'pending' && (
          <div className="flex space-x-2 pt-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <X className="h-3 w-3 mr-1" />
                  Reject
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reject Improvement</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to reject this improvement suggestion?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="rejection-reason">Reason for rejection (optional)</Label>
                  <Textarea
                    id="rejection-reason"
                    placeholder="Explain why this improvement is being rejected..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleReject}
                    disabled={rejecting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {rejecting ? 'Rejecting...' : 'Reject'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" className="flex-1">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Approve
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Approve Improvement</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will approve the improvement suggestion for implementation.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="approval-notes">Approval notes (optional)</Label>
                  <Textarea
                    id="approval-notes"
                    placeholder="Add any notes or instructions for implementation..."
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleApprove}
                    disabled={approving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {approving ? 'Approving...' : 'Approve'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {improvement.status === 'approved' && (
          <div className="bg-green-500/10 border border-green-500/20 rounded p-2 text-xs">
            <div className="font-medium text-green-700">✅ Approved for implementation</div>
            <div className="text-green-600">Ready to be added to development backlog</div>
          </div>
        )}

        {improvement.status === 'rejected' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded p-2 text-xs">
            <div className="font-medium text-red-700">❌ Improvement rejected</div>
            <div className="text-red-600">This suggestion will not be implemented</div>
          </div>
        )}

        {improvement.status === 'implemented' && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2 text-xs">
            <div className="font-medium text-blue-700">🚀 Successfully implemented</div>
            <div className="text-blue-600">This improvement is now live in production</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}