'use client'

import { useState, useEffect } from 'react'
import { 
  FlaskConical, 
  ClipboardList, 
  Monitor, 
  Cog, 
  Search, 
  Shield, 
  TrendingUp,
  ToggleLeft,
  ToggleRight,
  Circle,
  Clock,
  CheckCircle
} from 'lucide-react'

interface Department {
  id: string
  name: string
  icon: any
  description: string
  skills: string[]
  status: 'active' | 'idle'
  currentTask?: string
  lastAction?: { text: string; time: string }
  taskCount: number
  weeklyActivity: number[]
}

const departments: Department[] = [
  {
    id: 'research',
    name: 'Research Analyst',
    icon: FlaskConical,
    description: 'Conducts market research and competitive analysis',
    skills: ['deep-research-pro', 'exa-search', 'tavily-search'],
    status: 'idle',
    taskCount: 127,
    weeklyActivity: [4, 7, 3, 9, 5, 8, 6],
    lastAction: { text: 'Completed market analysis', time: '2 hours ago' }
  },
  {
    id: 'architect',
    name: 'Architecture & Planning',
    icon: ClipboardList,
    description: 'Designs system architecture and sprint roadmaps',
    skills: ['task-planner', 'project-architect'],
    status: 'idle',
    taskCount: 89,
    weeklyActivity: [6, 5, 8, 4, 7, 3, 9],
    lastAction: { text: 'Updated Phase 3 roadmap', time: '4 hours ago' }
  },
  {
    id: 'frontend',
    name: 'Frontend Development',
    icon: Monitor,
    description: 'Builds React components and UI features',
    skills: ['developer', 'senior-dev', 'coding-agent'],
    status: 'idle',
    taskCount: 234,
    weeklyActivity: [12, 15, 9, 18, 14, 16, 20],
    lastAction: { text: 'Deployed Agents page', time: 'Just now' }
  },
  {
    id: 'backend',
    name: 'Backend Development',
    icon: Cog,
    description: 'Creates API endpoints and server logic',
    skills: ['developer', 'api-builder'],
    status: 'idle',
    taskCount: 156,
    weeklyActivity: [8, 10, 7, 11, 9, 13, 8],
    lastAction: { text: 'Created /api/agents endpoint', time: '1 hour ago' }
  },
  {
    id: 'qa',
    name: 'Quality Assurance',
    icon: Search,
    description: 'Reviews code quality and runs tests',
    skills: ['critical-code-reviewer'],
    status: 'idle',
    taskCount: 98,
    weeklyActivity: [5, 4, 6, 5, 7, 4, 6],
    lastAction: { text: 'Reviewed PR #42', time: '3 hours ago' }
  },
  {
    id: 'security',
    name: 'Security',
    icon: Shield,
    description: 'Scans vulnerabilities and audits code',
    skills: ['security-scanner', 'security-audit-toolkit'],
    status: 'idle',
    taskCount: 45,
    weeklyActivity: [2, 3, 2, 4, 3, 2, 3],
    lastAction: { text: 'Completed security audit', time: '6 hours ago' }
  },
  {
    id: 'improvement',
    name: 'Self-Improvement',
    icon: TrendingUp,
    description: 'Analyzes performance and suggests improvements',
    skills: ['self-improving-agent'],
    status: 'idle',
    taskCount: 67,
    weeklyActivity: [3, 4, 5, 3, 4, 5, 4],
    lastAction: { text: 'Generated performance report', time: '5 hours ago' }
  }
]

// All unique skills for the matrix view
const allSkills = Array.from(new Set(departments.flatMap(d => d.skills))).sort()

export default function AgentsPage() {
  const [depts, setDepts] = useState(departments)
  const [view, setView] = useState<'cards' | 'matrix'>('cards')
  const [totalActive, setTotalActive] = useState(0)

  // Check Bridge API status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/bridge/status')
        if (response.ok) {
          const data = await response.json()
          if (data.status === 'ok') {
            // Set frontend development as active when gateway is running
            setDepts(prev => prev.map(dept => ({
              ...dept,
              status: dept.id === 'frontend' ? 'active' : 'idle',
              currentTask: dept.id === 'frontend' ? 'Building UI components...' : undefined
            })))
          }
        }
      } catch (error) {
        console.error('Failed to fetch Bridge status:', error)
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 30000) // Poll every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Count active departments
  useEffect(() => {
    setTotalActive(depts.filter(d => d.status === 'active').length)
  }, [depts])

  // Calculate total stats
  const totalTasks = depts.reduce((sum, d) => sum + d.taskCount, 0)
  const totalSkills = allSkills.length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Agent Teams</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">AI-powered departments working on your projects</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Departments</div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-1">7</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-600 dark:text-gray-400">Currently Active</div>
          <div className="text-2xl font-semibold text-green-600 mt-1">{totalActive}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-600 dark:text-gray-400">Tasks Completed</div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-1">{totalTasks}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-600 dark:text-gray-400">Skills Available</div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-1">{totalSkills}</div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Cards</span>
        <button
          onClick={() => setView(view === 'cards' ? 'matrix' : 'cards')}
          className="p-1"
        >
          {view === 'cards' ? (
            <ToggleLeft className="h-8 w-8 text-gray-600 dark:text-gray-400" />
          ) : (
            <ToggleRight className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          )}
        </button>
        <span className="text-sm text-gray-600 dark:text-gray-400">Skills Matrix</span>
      </div>

      {/* Cards View */}
      {view === 'cards' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {depts.map((dept) => {
            const Icon = dept.icon
            const maxActivity = Math.max(...dept.weeklyActivity)
            
            return (
              <div key={dept.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <Icon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{dept.name}</h3>
                      {dept.status === 'active' ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Circle className="h-3 w-3 fill-green-500 text-green-500 animate-pulse" />
                          <span className="text-sm text-green-600">Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <Circle className="h-3 w-3 fill-gray-400 text-gray-400" />
                          <span className="text-sm text-gray-500">Idle</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Tasks</div>
                    <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">{dept.taskCount}</div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{dept.description}</p>

                {dept.currentTask && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-sm font-medium text-blue-800 dark:text-blue-300">Current Task</div>
                    <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">{dept.currentTask}</div>
                  </div>
                )}

                {/* Skills */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {dept.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Last Action */}
                {dept.lastAction && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <Clock className="h-3 w-3" />
                    <span>{dept.lastAction.text}</span>
                    <span className="text-gray-500">• {dept.lastAction.time}</span>
                  </div>
                )}

                {/* Weekly Activity Chart */}
                <div className="mt-4">
                  <div className="text-xs text-gray-500 mb-2">Activity (last 7 days)</div>
                  <div className="flex items-end gap-1 h-12">
                    {dept.weeklyActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex-1 bg-blue-500 dark:bg-blue-600 rounded-t"
                        style={{ height: `${(activity / maxActivity) * 100}%` }}
                        title={`${activity} tasks`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Skills Matrix View */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                {allSkills.map((skill) => (
                  <th
                    key={skill}
                    className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                  >
                    <div className="transform -rotate-45 origin-center whitespace-nowrap">
                      {skill}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {depts.map((dept) => (
                <tr key={dept.id} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <dept.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {dept.name}
                      </span>
                    </div>
                  </td>
                  {allSkills.map((skill) => (
                    <td key={skill} className="px-3 py-4 text-center">
                      {dept.skills.includes(skill) && (
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}