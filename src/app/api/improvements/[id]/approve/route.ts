import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { reviewedBy, notes } = body

    // Validate improvement exists (in production, check database)
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Improvement ID is required' },
        { status: 400 }
      )
    }

    // Mock approval process
    const approvedImprovement = {
      id,
      status: 'approved',
      reviewedBy: reviewedBy || 'System',
      reviewedAt: new Date().toISOString(),
      reviewNotes: notes,
      updatedAt: new Date().toISOString()
    }

    // In production: Update database record
    // await updateImprovement(id, approvedImprovement)

    // Log approval action for audit trail
    console.log(`Improvement ${id} approved by ${reviewedBy || 'System'}`)

    return NextResponse.json({
      success: true,
      data: approvedImprovement,
      message: 'Improvement approved successfully'
    })

  } catch (error) {
    console.error('Error approving improvement:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to approve improvement',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}