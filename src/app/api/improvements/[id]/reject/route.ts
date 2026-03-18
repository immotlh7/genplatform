import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/access-control-server'

interface RejectionRequest {
  reason: 'duplicate' | 'out-of-scope' | 'low-priority' | 'insufficient-detail' | 'technical-constraints' | 'business-decision' | 'other'
  comments: string
  feedbackForSubmitter?: string
  suggestedAlternatives?: string
  canResubmit?: boolean
  relatedImprovements?: string[]
}

interface RejectionResponse {
  success: boolean
  data?: {
    improvementId: string
    status: string
    rejectedBy: {
      id: string
      name: string
    }
    rejectedAt: string
    reason: string
    comments: string
    feedbackForSubmitter?: string
    canResubmit: boolean
    nextSteps?: string[]
  }
  error?: string
  message?: string
}

interface ImprovementRejectionUpdate {
  status: 'rejected'
  rejectedBy: {
    id: string
    name: string
  }
  rejectedAt: string
  rejectionReason: string
  rejectionComments: string
  feedbackForSubmitter?: string
  canResubmit: boolean
  suggestedAlternatives?: string
  relatedImprovements?: string[]
  updatedAt: string
  workflowHistory: Array<{
    action: string
    performedBy: string
    performedAt: string
    comments?: string
    reason?: string
  }>
}

const REJECTION_REASONS = {
  duplicate: 'Duplicate - Similar improvement already exists or is in progress',
  'out-of-scope': 'Out of Scope - Does not align with current project goals',
  'low-priority': 'Low Priority - Not a priority for current development cycle',
  'insufficient-detail': 'Insufficient Detail - Needs more information to evaluate',
  'technical-constraints': 'Technical Constraints - Not feasible with current technology stack',
  'business-decision': 'Business Decision - Does not align with business strategy',
  other: 'Other - See comments for specific details'
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has rejection permissions
    const canReject = ['OWNER', 'ADMIN', 'MANAGER'].includes(currentUser.role)
    if (!canReject) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient permissions. Only OWNER, ADMIN, or MANAGER roles can reject improvements.' 
        },
        { status: 403 }
      )
    }

    const improvementId = params.id
    if (!improvementId) {
      return NextResponse.json(
        { success: false, error: 'Improvement ID is required' },
        { status: 400 }
      )
    }

    // Parse request body
    const body: RejectionRequest = await request.json()
    const { 
      reason,
      comments,
      feedbackForSubmitter,
      suggestedAlternatives,
      canResubmit = false,
      relatedImprovements = []
    } = body

    // Validate required fields
    if (!reason || !comments) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason and comments are required' },
        { status: 400 }
      )
    }

    // Validate rejection reason
    if (!Object.keys(REJECTION_REASONS).includes(reason)) {
      return NextResponse.json(
        { success: false, error: 'Invalid rejection reason' },
        { status: 400 }
      )
    }

    // Validate comments length
    if (comments.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'Rejection comments must be at least 10 characters' },
        { status: 400 }
      )
    }

    // Validate related improvements if provided
    if (relatedImprovements.length > 0) {
      const validImprovementIds = relatedImprovements.every(id => 
        typeof id === 'string' && id.startsWith('imp-')
      )
      if (!validImprovementIds) {
        return NextResponse.json(
          { success: false, error: 'Invalid related improvement IDs' },
          { status: 400 }
        )
      }
    }

    // Mock: Check if improvement exists and is in a state that can be rejected
    // In a real implementation, this would query the database
    const mockImprovement = {
      id: improvementId,
      status: 'reviewing', // Only improvements in 'proposed', 'reviewing', or 'approved' status can be rejected
      title: 'Sample Improvement',
      submittedBy: { id: 'user-1', name: 'Med' }
    }

    // Check if improvement can be rejected
    const rejectableStatuses = ['proposed', 'reviewing', 'approved']
    if (!rejectableStatuses.includes(mockImprovement.status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Improvement cannot be rejected. Current status: ${mockImprovement.status}` 
        },
        { status: 400 }
      )
    }

    // Prepare the update data
    const now = new Date().toISOString()
    
    const rejectionUpdate: ImprovementRejectionUpdate = {
      status: 'rejected',
      rejectedBy: {
        id: currentUser.id,
        name: currentUser.name || 'User'
      },
      rejectedAt: now,
      rejectionReason: reason,
      rejectionComments: comments,
      canResubmit,
      updatedAt: now,
      workflowHistory: [
        {
          action: 'rejected',
          performedBy: currentUser.name || 'User',
          performedAt: now,
          comments,
          reason
        }
      ]
    }

    // Add optional fields if provided
    if (feedbackForSubmitter) rejectionUpdate.feedbackForSubmitter = feedbackForSubmitter
    if (suggestedAlternatives) rejectionUpdate.suggestedAlternatives = suggestedAlternatives
    if (relatedImprovements.length > 0) rejectionUpdate.relatedImprovements = relatedImprovements

    // Mock database update
    // In a real implementation, this would update the improvement in the database
    console.log(`Rejecting improvement ${improvementId}:`, rejectionUpdate)

    // Generate next steps based on the rejection
    const nextSteps = [
      `Improvement rejected: ${REJECTION_REASONS[reason as keyof typeof REJECTION_REASONS]}`,
      `Submitter (${mockImprovement.submittedBy.name}) will be notified`,
      canResubmit 
        ? 'Improvement can be resubmitted with requested changes'
        : 'Improvement cannot be resubmitted',
      feedbackForSubmitter 
        ? 'Detailed feedback provided for improvement'
        : 'Consider providing feedback for future submissions',
      suggestedAlternatives
        ? 'Alternative solutions suggested'
        : undefined,
      relatedImprovements.length > 0
        ? `Related improvements: ${relatedImprovements.join(', ')}`
        : undefined
    ].filter(Boolean) as string[]

    // Prepare response
    const response: RejectionResponse = {
      success: true,
      data: {
        improvementId,
        status: 'rejected',
        rejectedBy: {
          id: currentUser.id,
          name: currentUser.name || 'User'
        },
        rejectedAt: now,
        reason: REJECTION_REASONS[reason as keyof typeof REJECTION_REASONS],
        comments,
        feedbackForSubmitter,
        canResubmit,
        nextSteps
      },
      message: 'Improvement rejected successfully'
    }

    // In a real implementation, this would also:
    // 1. Send notification to the submitter with feedback
    // 2. Update analytics and rejection statistics
    // 3. Log the rejection in audit trail
    // 4. Close any related tasks or dependencies
    // 5. Update project timelines

    // Mock notification sending
    const notifications = [
      `Notification sent to ${mockImprovement.submittedBy.name} about rejection`,
      feedbackForSubmitter ? 'Detailed feedback included in notification' : 'Basic rejection notification sent',
      canResubmit ? 'Resubmission guidelines included' : 'Marked as final rejection'
    ]

    console.log('Notifications would be sent:', notifications)

    // Log rejection statistics (mock)
    console.log('Rejection statistics updated:', {
      reason,
      rejectedBy: currentUser.id,
      canResubmit,
      hasFeedback: !!feedbackForSubmitter
    })

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Error rejecting improvement:', error)
    
    // Handle specific error types
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check rejection options and reasons
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const improvementId = params.id
    if (!improvementId) {
      return NextResponse.json(
        { success: false, error: 'Improvement ID is required' },
        { status: 400 }
      )
    }

    // Check permissions
    const canReject = ['OWNER', 'ADMIN', 'MANAGER'].includes(currentUser.role)
    
    // Mock improvement data
    const mockImprovement = {
      id: improvementId,
      status: 'reviewing',
      title: 'Sample Improvement',
      submittedBy: { id: 'user-1', name: 'Med' }
    }

    // Check if improvement can be rejected
    const rejectableStatuses = ['proposed', 'reviewing', 'approved']
    const canBeRejected = rejectableStatuses.includes(mockImprovement.status)

    return NextResponse.json({
      success: true,
      data: {
        improvementId,
        currentStatus: mockImprovement.status,
        canReject,
        canBeRejected,
        userRole: currentUser.role,
        rejectionOptions: {
          reasons: Object.entries(REJECTION_REASONS).map(([key, description]) => ({
            value: key,
            label: key.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            description
          })),
          requiredFields: ['reason', 'comments'],
          optionalFields: ['feedbackForSubmitter', 'suggestedAlternatives', 'canResubmit', 'relatedImprovements'],
          minimumCommentLength: 10
        },
        workflow: {
          requiredRoles: ['OWNER', 'ADMIN', 'MANAGER'],
          validStatuses: rejectableStatuses,
          nextStatus: 'rejected'
        }
      }
    })

  } catch (error) {
    console.error('Error checking rejection options:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}