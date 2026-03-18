import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

interface ExportRequest {
  type: 'analytics' | 'memory' | 'skills' | 'cron' | 'system'
  format: 'csv' | 'json' | 'pdf' | 'xlsx'
  period?: string
  filters?: Record<string, any>
  includeMetadata?: boolean
}

interface ExportData {
  fileName: string
  filePath: string
  downloadUrl: string
  size: number
  generatedAt: string
  expiresAt: string
}

export async function POST(request: NextRequest) {
  try {
    const exportRequest: ExportRequest = await request.json()

    if (!exportRequest.type || !exportRequest.format) {
      return NextResponse.json(
        { error: 'Type and format are required' },
        { status: 400 }
      )
    }

    const exportData = await generateExport(exportRequest)

    return NextResponse.json({
      success: true,
      export: exportData,
      message: 'Export generated successfully'
    })

  } catch (error) {
    console.error('Export generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate export' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('file')

    if (!fileName) {
      return NextResponse.json(
        { error: 'File name is required' },
        { status: 400 }
      )
    }

    // In production, would serve the actual file
    // For demo, return file info
    return NextResponse.json({
      fileName,
      downloadUrl: `/downloads/${fileName}`,
      status: 'ready'
    })

  } catch (error) {
    console.error('Export download error:', error)
    return NextResponse.json(
      { error: 'Failed to download export' },
      { status: 500 }
    )
  }
}

async function generateExport(request: ExportRequest): Promise<ExportData> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const fileName = `${request.type}-export-${timestamp}.${request.format}`
  const filePath = join('/tmp', 'exports', fileName)
  const downloadUrl = `/api/downloads/${fileName}`

  // Ensure exports directory exists
  await mkdir(join('/tmp', 'exports'), { recursive: true })

  let data: any
  let content: string

  // Generate data based on type
  switch (request.type) {
    case 'analytics':
      data = await generateAnalyticsData(request)
      break
    case 'memory':
      data = await generateMemoryData(request)
      break
    case 'skills':
      data = await generateSkillsData(request)
      break
    case 'cron':
      data = await generateCronData(request)
      break
    case 'system':
      data = await generateSystemData(request)
      break
    default:
      throw new Error(`Unknown export type: ${request.type}`)
  }

  // Format data based on format
  switch (request.format) {
    case 'json':
      content = JSON.stringify(data, null, 2)
      break
    case 'csv':
      content = convertToCSV(data, request.type)
      break
    case 'pdf':
      content = await generatePDF(data, request.type)
      break
    case 'xlsx':
      content = await generateExcel(data, request.type)
      break
    default:
      throw new Error(`Unknown export format: ${request.format}`)
  }

  // Write file (in production, would use proper file storage)
  await writeFile(filePath, content, 'utf-8')

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // Expire in 7 days

  return {
    fileName,
    filePath,
    downloadUrl,
    size: content.length,
    generatedAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString()
  }
}

async function generateAnalyticsData(request: ExportRequest) {
  // Simulate analytics data generation
  const period = request.period || '7d'
  const baseMultiplier = getPeriodMultiplier(period)

  return {
    metadata: {
      exportType: 'analytics',
      period,
      generatedAt: new Date().toISOString(),
      filters: request.filters || {}
    },
    summary: {
      totalSessions: Math.floor(1000 * baseMultiplier),
      totalSkillExecutions: Math.floor(2500 * baseMultiplier),
      avgResponseTime: 1.8,
      errorRate: 2.3
    },
    timeSeries: generateTimeSeriesData(period),
    skills: {
      mostUsed: [
        { name: 'Weather', executions: Math.floor(300 * baseMultiplier), avgDuration: 1.2, successRate: 98.5 },
        { name: 'GitHub', executions: Math.floor(250 * baseMultiplier), avgDuration: 2.8, successRate: 95.2 },
        { name: 'Memory Search', executions: Math.floor(200 * baseMultiplier), avgDuration: 0.8, successRate: 99.1 }
      ]
    },
    performance: {
      responseTimeBuckets: {
        '0-1s': Math.floor(1500 * baseMultiplier),
        '1-2s': Math.floor(800 * baseMultiplier),
        '2-5s': Math.floor(200 * baseMultiplier),
        '5s+': Math.floor(50 * baseMultiplier)
      },
      errorsByType: {
        'timeout': Math.floor(20 * baseMultiplier),
        'permission': Math.floor(15 * baseMultiplier),
        'not_found': Math.floor(10 * baseMultiplier),
        'other': Math.floor(5 * baseMultiplier)
      }
    }
  }
}

async function generateMemoryData(request: ExportRequest) {
  return {
    metadata: {
      exportType: 'memory',
      generatedAt: new Date().toISOString()
    },
    files: [
      { path: 'projects/genplatform.md', size: 15420, lastModified: new Date().toISOString(), type: 'file' },
      { path: 'daily/2026-03-18.md', size: 8532, lastModified: new Date().toISOString(), type: 'file' },
      { path: 'areas/development/', size: 0, lastModified: new Date().toISOString(), type: 'directory' }
    ],
    statistics: {
      totalFiles: 156,
      totalSize: 1245678,
      avgFileSize: 7987,
      mostActiveDirectories: [
        { path: 'daily', fileCount: 89, totalSize: 456789 },
        { path: 'projects', fileCount: 34, totalSize: 234567 }
      ]
    },
    recentActivity: [
      { action: 'create', path: 'daily/2026-03-18.md', timestamp: new Date().toISOString() },
      { action: 'modify', path: 'projects/genplatform.md', timestamp: new Date(Date.now() - 60000).toISOString() }
    ]
  }
}

async function generateSkillsData(request: ExportRequest) {
  return {
    metadata: {
      exportType: 'skills',
      generatedAt: new Date().toISOString()
    },
    skills: [
      {
        name: 'Weather',
        category: 'Productivity',
        enabled: true,
        executions: 342,
        avgDuration: 1.2,
        successRate: 98.5,
        lastUsed: new Date(Date.now() - 3600000).toISOString()
      },
      {
        name: 'GitHub',
        category: 'Development',
        enabled: true,
        executions: 289,
        avgDuration: 2.8,
        successRate: 95.2,
        lastUsed: new Date(Date.now() - 1800000).toISOString()
      },
      {
        name: 'Memory Search',
        category: 'System',
        enabled: true,
        executions: 267,
        avgDuration: 0.8,
        successRate: 99.1,
        lastUsed: new Date(Date.now() - 600000).toISOString()
      }
    ],
    categories: {
      'Productivity': { skillCount: 12, totalExecutions: 1456 },
      'Development': { skillCount: 8, totalExecutions: 987 },
      'System': { skillCount: 6, totalExecutions: 654 },
      'Communication': { skillCount: 4, totalExecutions: 355 }
    },
    performance: {
      totalExecutions: 3452,
      avgExecutionTime: 2.1,
      overallSuccessRate: 96.8
    }
  }
}

async function generateCronData(request: ExportRequest) {
  return {
    metadata: {
      exportType: 'cron',
      generatedAt: new Date().toISOString()
    },
    jobs: [
      {
        id: 'memory-cleanup',
        name: 'Memory Cleanup',
        schedule: '0 2 * * *',
        enabled: true,
        lastRun: new Date(Date.now() - 7200000).toISOString(),
        nextRun: new Date(Date.now() + 64800000).toISOString(),
        status: 'idle',
        executionHistory: {
          total: 45,
          successful: 44,
          failed: 1,
          avgDuration: 120
        }
      },
      {
        id: 'skill-update',
        name: 'Skill Update Check',
        schedule: '0 */6 * * *',
        enabled: true,
        lastRun: new Date(Date.now() - 1800000).toISOString(),
        nextRun: new Date(Date.now() + 19800000).toISOString(),
        status: 'idle',
        executionHistory: {
          total: 124,
          successful: 121,
          failed: 3,
          avgDuration: 45
        }
      }
    ],
    statistics: {
      totalJobs: 5,
      enabledJobs: 4,
      avgSuccessRate: 97.2,
      totalExecutions: 1234,
      failedExecutions: 8
    }
  }
}

async function generateSystemData(request: ExportRequest) {
  return {
    metadata: {
      exportType: 'system',
      generatedAt: new Date().toISOString()
    },
    resources: {
      cpu: { usage: 45, cores: 4, model: 'Intel Xeon E5-2680 v3', frequency: 2500 },
      memory: { total: 8589934592, used: 3221225472, usage: 37.5 },
      disk: { total: 107374182400, used: 64424509440, usage: 60 },
      network: {
        interfaces: [
          { name: 'eth0', bytesReceived: 1234567890, bytesTransmitted: 987654321 }
        ]
      }
    },
    services: [
      { name: 'OpenClaw', status: 'active', pid: 1234, uptime: '2d 14h 30m' },
      { name: 'Gateway', status: 'active', pid: 5678, uptime: '2d 14h 25m' }
    ],
    performance: {
      avgResponseTime: 1.8,
      uptime: 216000, // seconds
      loadAverage: [0.85, 0.92, 1.1]
    },
    alerts: [
      {
        type: 'cpu',
        severity: 'medium',
        message: 'CPU usage above 80% for 5 minutes',
        timestamp: new Date(Date.now() - 900000).toISOString()
      }
    ]
  }
}

function getPeriodMultiplier(period: string): number {
  switch (period) {
    case '1h': return 0.04
    case '24h': return 1
    case '7d': return 7
    case '30d': return 30
    case '90d': return 90
    default: return 1
  }
}

function generateTimeSeriesData(period: string) {
  const data = []
  const now = new Date()
  const intervals = period === '1h' ? 12 : period === '24h' ? 24 : 7
  const stepMs = period === '1h' ? 5 * 60 * 1000 : 
                period === '24h' ? 60 * 60 * 1000 : 
                24 * 60 * 60 * 1000

  for (let i = intervals - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * stepMs)
    data.push({
      timestamp: timestamp.toISOString(),
      sessions: Math.floor(Math.random() * 50) + 10,
      skillExecutions: Math.floor(Math.random() * 200) + 50,
      avgResponseTime: Math.random() * 2 + 0.5,
      errorRate: Math.random() * 5
    })
  }

  return data
}

function convertToCSV(data: any, type: string): string {
  let rows: string[] = []

  switch (type) {
    case 'analytics':
      rows.push('timestamp,sessions,skillExecutions,avgResponseTime,errorRate')
      data.timeSeries.forEach((row: any) => {
        rows.push(`${row.timestamp},${row.sessions},${row.skillExecutions},${row.avgResponseTime},${row.errorRate}`)
      })
      break

    case 'skills':
      rows.push('name,category,enabled,executions,avgDuration,successRate,lastUsed')
      data.skills.forEach((skill: any) => {
        rows.push(`${skill.name},${skill.category},${skill.enabled},${skill.executions},${skill.avgDuration},${skill.successRate},${skill.lastUsed}`)
      })
      break

    case 'memory':
      rows.push('path,size,lastModified,type')
      data.files.forEach((file: any) => {
        rows.push(`${file.path},${file.size},${file.lastModified},${file.type}`)
      })
      break

    case 'cron':
      rows.push('id,name,schedule,enabled,status,lastRun,nextRun,totalExecutions,successfulExecutions')
      data.jobs.forEach((job: any) => {
        rows.push(`${job.id},${job.name},${job.schedule},${job.enabled},${job.status},${job.lastRun},${job.nextRun},${job.executionHistory.total},${job.executionHistory.successful}`)
      })
      break

    default:
      // Generic JSON to CSV conversion
      rows.push(Object.keys(data).join(','))
      rows.push(Object.values(data).join(','))
  }

  return rows.join('\n')
}

async function generatePDF(data: any, type: string): Promise<string> {
  // In production, would use a PDF library like jsPDF or Puppeteer
  // For demo, return HTML that could be converted to PDF
  return `
<!DOCTYPE html>
<html>
<head>
  <title>${type.toUpperCase()} Export Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 10px; }
    .section { margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${type.toUpperCase()} Export Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>
  <div class="section">
    <h2>Summary</h2>
    <pre>${JSON.stringify(data, null, 2)}</pre>
  </div>
</body>
</html>
`
}

async function generateExcel(data: any, type: string): Promise<string> {
  // In production, would use a library like SheetJS or Excel.js
  // For demo, return CSV data that can be opened in Excel
  return convertToCSV(data, type)
}