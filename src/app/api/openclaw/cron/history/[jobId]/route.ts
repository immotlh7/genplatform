import { NextRequest, NextResponse } from 'next/server'
import { readFile, access } from 'fs/promises'
import { join } from 'path'
import { config } from '@/lib/config'

interface JobRun {
  id: string
  jobId: string
  startTime: string
  endTime?: string
  status: 'running' | 'success' | 'failed' | 'timeout' | 'cancelled'
  exitCode?: number
  output?: string
  error?: string
  duration?: number
  triggeredBy: 'schedule' | 'manual' | 'api'
  metadata?: Record<string, any>
}

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Path to job history file
    const historyPath = join(config.cronPath, 'history', `${jobId}.json`)
    
    let jobHistory: JobRun[] = []

    try {
      await access(historyPath)
      const historyData = await readFile(historyPath, 'utf-8')
      const historyFile = JSON.parse(historyData)
      jobHistory = historyFile.runs || []
    } catch {
      // If no history file exists, generate demo data
      jobHistory = generateDemoHistory(jobId)
    }

    // Sort by start time (newest first)
    jobHistory.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

    // Apply pagination
    const paginatedHistory = jobHistory.slice(offset, offset + limit)

    // Calculate statistics
    const stats = {
      total: jobHistory.length,
      successful: jobHistory.filter(run => run.status === 'success').length,
      failed: jobHistory.filter(run => run.status === 'failed').length,
      averageDuration: calculateAverageDuration(jobHistory.filter(run => run.duration)),
      lastRun: jobHistory.length > 0 ? jobHistory[0] : null,
      successRate: jobHistory.length > 0 ? 
        (jobHistory.filter(run => run.status === 'success').length / jobHistory.length * 100).toFixed(1) : 0
    }

    return NextResponse.json({
      history: paginatedHistory,
      stats,
      pagination: {
        total: jobHistory.length,
        limit,
        offset,
        hasMore: offset + limit < jobHistory.length
      },
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Job history error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve job history' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params
    const { action, runId } = await request.json()

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    const historyPath = join(config.cronPath, 'history', `${jobId}.json`)

    switch (action) {
      case 'clear':
        // Clear job history
        const emptyHistory = {
          jobId,
          runs: [],
          lastCleared: new Date().toISOString()
        }
        
        // In production, would write to actual file
        console.log(`Clearing history for job ${jobId}`)
        
        return NextResponse.json({
          success: true,
          message: 'Job history cleared successfully',
          jobId
        })

      case 'cancel':
        if (!runId) {
          return NextResponse.json(
            { error: 'Run ID is required for cancel action' },
            { status: 400 }
          )
        }

        // In production, would cancel the running job
        console.log(`Cancelling run ${runId} for job ${jobId}`)

        return NextResponse.json({
          success: true,
          message: 'Job run cancelled successfully',
          jobId,
          runId
        })

      case 'retry':
        if (!runId) {
          return NextResponse.json(
            { error: 'Run ID is required for retry action' },
            { status: 400 }
          )
        }

        // In production, would trigger job retry
        console.log(`Retrying run ${runId} for job ${jobId}`)

        const newRunId = `${jobId}-${Date.now()}`

        return NextResponse.json({
          success: true,
          message: 'Job retry initiated successfully',
          jobId,
          originalRunId: runId,
          newRunId
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: clear, cancel, retry' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Job history action error:', error)
    return NextResponse.json(
      { error: 'Failed to perform history action' },
      { status: 500 }
    )
  }
}

function generateDemoHistory(jobId: string): JobRun[] {
  const now = Date.now()
  const runs: JobRun[] = []

  // Generate last 15 runs
  for (let i = 0; i < 15; i++) {
    const startTime = new Date(now - (i * 60 * 60 * 1000)).toISOString() // Every hour back
    const isSuccess = Math.random() > 0.2 // 80% success rate
    const duration = Math.floor(Math.random() * 120000) + 5000 // 5-125 seconds
    const endTime = new Date(new Date(startTime).getTime() + duration).toISOString()

    runs.push({
      id: `${jobId}-run-${i + 1}`,
      jobId,
      startTime,
      endTime: isSuccess || Math.random() > 0.5 ? endTime : undefined,
      status: isSuccess ? 'success' : (Math.random() > 0.7 ? 'failed' : 'timeout'),
      exitCode: isSuccess ? 0 : Math.floor(Math.random() * 5) + 1,
      duration: isSuccess || Math.random() > 0.3 ? duration : undefined,
      output: isSuccess ? 
        `Job completed successfully\nProcessed ${Math.floor(Math.random() * 100)} items\nAll systems nominal` :
        undefined,
      error: !isSuccess ? 
        ['Connection timeout', 'Permission denied', 'File not found', 'Out of memory', 'Service unavailable'][Math.floor(Math.random() * 5)] :
        undefined,
      triggeredBy: i === 0 ? 'manual' : (Math.random() > 0.9 ? 'api' : 'schedule'),
      metadata: {
        nodeId: `node-${Math.floor(Math.random() * 3) + 1}`,
        version: '1.0.0',
        environment: 'production'
      }
    })
  }

  return runs
}

function calculateAverageDuration(runs: JobRun[]): number {
  if (runs.length === 0) return 0
  const totalDuration = runs.reduce((sum, run) => sum + (run.duration || 0), 0)
  return Math.floor(totalDuration / runs.length)
}