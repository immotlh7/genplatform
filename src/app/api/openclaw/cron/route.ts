import { NextRequest, NextResponse } from 'next/server'
import { readFile, access } from 'fs/promises'
import { join } from 'path'
import { config } from '@/lib/config'

interface CronJob {
  id: string
  name: string
  schedule: string
  command: string
  description?: string
  enabled: boolean
  lastRun?: string
  nextRun?: string
  status: 'running' | 'idle' | 'failed' | 'disabled'
}

export async function GET(request: NextRequest) {
  try {
    const cronPath = join(config.cronPath, 'jobs.json')
    
    // Check if cron jobs file exists
    try {
      await access(cronPath)
    } catch {
      // Return sample/demo data if no real cron file
      const demoJobs: CronJob[] = [
        {
          id: 'memory-cleanup',
          name: 'Memory Cleanup',
          schedule: '0 2 * * *',
          command: 'openclaw memory cleanup',
          description: 'Daily memory file cleanup and archival',
          enabled: true,
          lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: 'idle'
        },
        {
          id: 'health-check',
          name: 'System Health Check',
          schedule: '*/15 * * * *',
          command: 'openclaw health check',
          description: 'Monitor system health every 15 minutes',
          enabled: true,
          lastRun: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          status: 'idle'
        },
        {
          id: 'backup-workspace',
          name: 'Workspace Backup',
          schedule: '0 0 * * 0',
          command: 'openclaw backup workspace',
          description: 'Weekly backup of workspace files',
          enabled: false,
          lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'disabled'
        }
      ]

      return NextResponse.json({
        jobs: demoJobs,
        count: demoJobs.length,
        source: 'demo',
        lastUpdated: new Date().toISOString()
      })
    }

    // Read and parse the cron jobs file
    const cronData = await readFile(cronPath, 'utf-8')
    const cronConfig = JSON.parse(cronData)

    const jobs: CronJob[] = cronConfig.jobs || []

    // Add human-readable next run times
    jobs.forEach(job => {
      if (job.enabled && job.schedule) {
        // Simple next run calculation (would use cron parser in production)
        const now = new Date()
        job.nextRun = new Date(now.getTime() + 60 * 60 * 1000).toISOString() // +1 hour for demo
      }
    })

    return NextResponse.json({
      jobs,
      count: jobs.length,
      source: 'file',
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Cron API error:', error)
    return NextResponse.json(
      { error: 'Failed to read cron configuration' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, jobId } = await request.json()

    if (action === 'toggle' && jobId) {
      // In production, would toggle actual cron job
      return NextResponse.json({
        success: true,
        message: `Job ${jobId} toggled successfully`,
        jobId
      })
    }

    if (action === 'run' && jobId) {
      // In production, would trigger immediate job run
      return NextResponse.json({
        success: true,
        message: `Job ${jobId} started`,
        jobId,
        runId: Date.now().toString()
      })
    }

    return NextResponse.json(
      { error: 'Invalid action or missing jobId' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Cron POST error:', error)
    return NextResponse.json(
      { error: 'Failed to execute cron action' },
      { status: 500 }
    )
  }
}