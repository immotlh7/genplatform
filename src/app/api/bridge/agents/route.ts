import { NextResponse } from 'next/server'

const BRIDGE_URL = process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:3001'

// Default departments data as fallback
const defaultDepartments = [
  {
    id: 'research',
    name: 'Research Analyst',
    icon: '🔬',
    description: 'Conducts market research and competitive analysis',
    status: 'idle',
    taskCount: 127,
    lastAction: { text: 'Service unavailable', time: 'Unknown' }
  },
  {
    id: 'architect',
    name: 'Architecture & Planning',
    icon: '📋',
    description: 'Designs system architecture and sprint roadmaps',
    status: 'idle',
    taskCount: 89,
    lastAction: { text: 'Service unavailable', time: 'Unknown' }
  },
  {
    id: 'frontend',
    name: 'Frontend Development',
    icon: '💻',
    description: 'Builds React components and UI features',
    status: 'idle',
    taskCount: 234,
    lastAction: { text: 'Service unavailable', time: 'Unknown' }
  },
  {
    id: 'backend',
    name: 'Backend Development',
    icon: '⚙️',
    description: 'Creates API endpoints and server logic',
    status: 'idle',
    taskCount: 156,
    lastAction: { text: 'Service unavailable', time: 'Unknown' }
  },
  {
    id: 'qa',
    name: 'Quality Assurance',
    icon: '🔍',
    description: 'Reviews code quality and runs tests',
    status: 'idle',
    taskCount: 98,
    lastAction: { text: 'Service unavailable', time: 'Unknown' }
  },
  {
    id: 'security',
    name: 'Security',
    icon: '🛡️',
    description: 'Scans vulnerabilities and audits code',
    status: 'idle',
    taskCount: 45,
    lastAction: { text: 'Service unavailable', time: 'Unknown' }
  },
  {
    id: 'improvement',
    name: 'Self-Improvement',
    icon: '📈',
    description: 'Analyzes performance and suggests improvements',
    status: 'idle',
    taskCount: 67,
    lastAction: { text: 'Service unavailable', time: 'Unknown' }
  }
]

export async function GET() {
  try {
    const response = await fetch(`${BRIDGE_URL}/api/agents/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      // Return default data if API fails
      return NextResponse.json({
        departments: defaultDepartments,
        activeDepartments: 0,
        lastCheck: new Date().toISOString()
      })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to fetch agent status:', error)
    
    // Return default data on error
    return NextResponse.json({
      departments: defaultDepartments,
      activeDepartments: 0,
      lastCheck: new Date().toISOString()
    })
  }
}