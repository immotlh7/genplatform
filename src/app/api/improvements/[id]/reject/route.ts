import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { reviewedBy, reason } = body

    // Validate improvement exists (in production, check database)
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Improvement ID is required' },
        { status: 400 }
      )
    }

    // Mock rejection process
    const rejectedImprovement = {
      id,
      status: 'rejected',
      reviewedBy: reviewedBy || 'System',
      reviewedAt: new Date().toISOString(),
      rejectionReason: reason,
      updatedAt: new Date().toISOString()
    }

    // In production: Update database record
    // await updateImprovement(id, rejectedImprovement)

    // Log rejection action for audit trail
    console.log(`Improvement ${id} rejected by ${reviewedBy || 'System'}: ${reason || 'No reason provided'}`)

    return NextResponse.json({
      success: true,
      data: rejectedImprovement,
      message: 'Improvement rejected successfully'
    })

  } catch (error) {
    console.error('Error rejecting improvement:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to reject improvement',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}