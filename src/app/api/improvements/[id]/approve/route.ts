import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/access-control-server'

interface ApprovalRequest {
  comments?: string
  assignedTo?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  estimatedHours?: number
  targetVersion?: string
  dependencies?: string[]
  approvalNotes?: string
}

interface ApprovalResponse {
  success: boolean
  data?: {
    improvementId: string
    status: string
    approvedBy: {
      id: string
      name: string
    }
    approvedAt: string
    assignedTo?: {
      id: string
      name: string
    }
    comments?: string
    nextSteps?: string[]
  }
  error?: string
  message?: string
}

interface ImprovementUpdate {
  status: 'approved'
  approvedBy: {
    id: string
    name: string
  }
  approvedAt: string
  assignedTo?: {
    id: string
    name: string
  }
  updatedAt: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  estimatedHours?: number
  targetVersion?: string
  dependencies?: string[]
  approvalComments?: string
  workflowHistory: Array<{
    action: string
    performedBy: string
    performedAt: string
    comments?: string
  }>
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Check if user has approval permissions
    const canApprove = ['OWNER', 'ADMIN', 'MANAGER'].includes(currentUser.role)
    if (!canApprove) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient permissions. Only OWNER, ADMIN, or MANAGER roles can approve improvements.' 
        },
        { status: 403 }
      )
    }

    const improvementId = (await params).id
    if (!improvementId) {
      return NextResponse.json(
        { success: false, error: 'Improvement ID is required' },
        { status: 400 }
      )
    }

    // Parse request body
    const body: ApprovalRequest = await request.json()
    const { 
      comments, 
      assignedTo, 
      priority, 
      estimatedHours, 
      targetVersion,
      dependencies = [],
      approvalNotes 
    } = body

    // Validate assignedTo user if provided
    if (assignedTo) {
      // In a real implementation, this would validate the user exists
      const validUserIds = ['agent-1', 'user-1', 'user-2', 'dev-team', 'security-team']
      if (!validUserIds.includes(assignedTo)) {
        return NextResponse.json(
          { success: false, error: 'Invalid assignee user ID' },
          { status: 400 }
        )
      }
    }

    // Validate priority if provided
    if (priority && !['low', 'medium', 'high', 'critical'].includes(priority)) {
      return NextResponse.json(
        { success: false, error: 'Invalid priority level' },
        { status: 400 }
      )
    }

    // Validate estimated hours if provided
    if (estimatedHours && (estimatedHours < 1 || estimatedHours > 1000)) {
      return NextResponse.json(
        { success: false, error: 'Estimated hours must be between 1 and 1000' },
        { status: 400 }
      )
    }

    // Mock: Check if improvement exists and is in a state that can be approved
    // In a real implementation, this would query the database
    const mockImprovement = {
      id: improvementId,
      status: 'reviewing', // Only improvements in 'proposed' or 'reviewing' status can be approved
      title: 'Sample Improvement',
      submittedBy: { id: 'user-1', name: 'Med' }
    }

    if (!['proposed', 'reviewing'].includes(mockImprovement.status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Improvement cannot be approved. Current status: ${mockImprovement.status}` 
        },
        { status: 400 }
      )
    }

    // Prepare the update data
    const now = new Date().toISOString()
    const assigneeInfo = assignedTo ? {
      id: assignedTo,
      name: assignedTo === 'agent-1' ? 'Claude Agent' :
            assignedTo === 'user-1' ? 'Med' :
            assignedTo === 'user-2' ? 'Team Member' :
            assignedTo === 'dev-team' ? 'Development Team' :
            'Security Team'
    } : undefined

    const improvementUpdate: ImprovementUpdate = {
      status: 'approved',
      approvedBy: {
        id: currentUser.id,
        name: currentUser.name || 'User'
      },
      approvedAt: now,
      assignedTo: assigneeInfo,
      updatedAt: now,
      workflowHistory: [
        {
          action: 'approved',
          performedBy: currentUser.name || 'User',
          performedAt: now,
          comments: comments || approvalNotes
        }
      ]
    }

    // Add optional fields if provided
    if (priority) improvementUpdate.priority = priority
    if (estimatedHours) improvementUpdate.estimatedHours = estimatedHours
    if (targetVersion) improvementUpdate.targetVersion = targetVersion
    if (dependencies.length > 0) improvementUpdate.dependencies = dependencies
    if (comments || approvalNotes) improvementUpdate.approvalComments = comments || approvalNotes

    // Mock database update
    // In a real implementation, this would update the improvement in the database
    console.log(`Approving improvement ${improvementId}:`, improvementUpdate)

    // Generate next steps based on the approval
    const nextSteps = [
      'Improvement moved to approved status',
      assigneeInfo ? `Assigned to ${assigneeInfo.name}` : 'Ready for assignment',
      'Implementation can begin',
      estimatedHours ? `Estimated completion: ${estimatedHours} hours` : 'Estimate implementation time',
      targetVersion ? `Target for release: ${targetVersion}` : 'Determine target release version'
    ].filter(Boolean)

    // Prepare response
    const response: ApprovalResponse = {
      success: true,
      data: {
        improvementId,
        status: 'approved',
        approvedBy: {
          id: currentUser.id,
          name: currentUser.name || 'User'
        },
        approvedAt: now,
        assignedTo: assigneeInfo,
        comments: comments || approvalNotes,
        nextSteps
      },
      message: 'Improvement approved successfully'
    }

    // In a real implementation, this would also:
    // 1. Send notification to the submitter
    // 2. Send notification to the assignee (if assigned)
    // 3. Update project timelines and dependencies
    // 4. Log the approval in audit trail
    // 5. Trigger any automated workflows

    // Mock notification sending
    const notifications = []
    if (assigneeInfo) {
      notifications.push(`Notification sent to ${assigneeInfo.name} about new assignment`)
    }
    notifications.push(`Notification sent to ${mockImprovement.submittedBy.name} about approval`)

    console.log('Notifications would be sent:', notifications)

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Error approving improvement:', error)
    
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

// GET endpoint to check approval status and permissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const improvementId = (await params).id
    if (!improvementId) {
      return NextResponse.json(
        { success: false, error: 'Improvement ID is required' },
        { status: 400 }
      )
    }

    // Check permissions
    const canApprove = ['OWNER', 'ADMIN', 'MANAGER'].includes(currentUser.role)
    
    // Mock improvement data
    const mockImprovement = {
      id: improvementId,
      status: 'reviewing',
      title: 'Sample Improvement',
      submittedBy: { id: 'user-1', name: 'Med' },
      canBeApproved: true
    }

    // Check if improvement can be approved
    const canBeApproved = ['proposed', 'reviewing'].includes(mockImprovement.status)

    return NextResponse.json({
      success: true,
      data: {
        improvementId,
        currentStatus: mockImprovement.status,
        canApprove,
        canBeApproved,
        userRole: currentUser.role,
        approvalWorkflow: {
          requiredRoles: ['OWNER', 'ADMIN', 'MANAGER'],
          validStatuses: ['proposed', 'reviewing'],
          nextStatus: 'approved'
        }
      }
    })

  } catch (error) {
    console.error('Error checking approval status:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}