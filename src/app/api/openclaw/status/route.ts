import { NextRequest, NextResponse } from 'next/server'
import { readFile, access } from 'fs/promises'
import { join } from 'path'
import { config } from '@/lib/config'

export async function GET(request: NextRequest) {
  try {
    const configPath = join(config.openclawPath, 'openclaw.json')
    
    // Check if openclaw.json exists
    try {
      await access(configPath)
    } catch {
      return NextResponse.json({
        error: 'OpenClaw configuration not found',
        status: 'not_installed',
        path: configPath
      }, { status: 404 })
    }

    // Read and parse the config
    const configData = await readFile(configPath, 'utf-8')
    const openclawConfig = JSON.parse(configData)

    // Get system uptime
    const uptimeData = await readFile('/proc/uptime', 'utf-8').catch(() => '0 0')
    const [uptime] = uptimeData.trim().split(' ')
    const uptimeHours = Math.floor(parseFloat(uptime) / 3600)

    // Get memory info
    const meminfo = await readFile('/proc/meminfo', 'utf-8').catch(() => '')
    const memMatch = meminfo.match(/MemTotal:\s+(\d+)\s+kB/)
    const totalMem = memMatch ? parseInt(memMatch[1]) : 0

    // Get disk usage for workspace
    const workspaceSize = await getDirSize(config.workspacePath).catch(() => 0)

    const systemInfo = {
      gateway: {
        status: 'unknown', // Would need to check actual process
        version: openclawConfig.version || 'unknown',
        model: openclawConfig.ai?.model || 'unknown',
        uptime: uptimeHours
      },
      system: {
        uptime: uptimeHours,
        memory: {
          total: Math.round(totalMem / 1024), // MB
          used: 0 // Would need more detailed calc
        },
        disk: {
          workspace: workspaceSize
        }
      },
      workspace: {
        path: config.workspacePath,
        lastModified: new Date().toISOString()
      }
    }

    return NextResponse.json(systemInfo)

  } catch (error) {
    console.error('Status API error:', error)
    return NextResponse.json(
      { error: 'Failed to get system status' },
      { status: 500 }
    )
  }
}

async function getDirSize(path: string): Promise<number> {
  // Simplified - in production would recursively calculate
  try {
    const { exec } = require('child_process')
    return new Promise((resolve) => {
      exec(`du -sb ${path}`, (error: any, stdout: string) => {
        if (error) resolve(0)
        const size = parseInt(stdout.split('\t')[0] || '0')
        resolve(size)
      })
    })
  } catch {
    return 0
  }
}