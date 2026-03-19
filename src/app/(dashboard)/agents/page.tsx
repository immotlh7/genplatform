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
  icon: string
  description: string
  skills?: string[]
  status: 'active' | 'idle'
  currentTask?: string
  lastAction?: { text: string; time: string }
  taskCount: number
  weeklyActivity?: number[]
}

// Icon mapping from emoji to component
const iconMap: { [key: string]: any } = {
  '🔬': FlaskConical,
  '📋': ClipboardList,
  '💻': Monitor,
  '⚙️': Cog,
  '🔍': Search,
  '🛡️': Shield,
  '📈': TrendingUp
}

// Default skills for each department (used for matrix view)
const departmentSkills: { [key: string]: string[] } = {
  'research': ['deep-research-pro', 'exa-search', 'tavily-search'],
  'architect': ['task-planner', 'project-architect'],
  'frontend': ['developer', 'senior-dev', 'coding-agent'],
  'backend': ['developer', 'api-builder'],
  'qa': ['critical-code-reviewer'],
  'security': ['security-scanner', 'security-audit-toolkit'],
  'improvement': ['self-improving-agent']
}

// Default weekly activity (used if not provided by API)
const defaultWeeklyActivity = {
  'research': [4, 7, 3, 9, 5, 8, 6],
  'architect': [6, 5, 8, 4, 7, 3, 9],
  'frontend': [12, 15, 9, 18, 14, 16, 20],
  'backend': [8, 10, 7, 11, 9, 13, 8],
  'qa': [5, 4, 6, 5, 7, 4, 6],
  'security': [2, 3, 2, 4, 3, 2, 3],
  'improvement': [3, 4, 5, 3, 4, 5, 4]
}

export default function AgentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [view, setView] = useState<'cards' | 'matrix'>('cards')
  const [totalActive, setTotalActive] = useState(0)
  const [loading, setLoading] = useState(true)

  // Fetch agent status from API
  useEffect(() => {
    const fetchAgentStatus = async () => {
      try {
        const response = await fetch('/api/bridge/agents')
        if (response.ok) {
          const data = await response.json()
          
          // Enhance departments with skills and weekly activity
          const enhancedDepts = data.departments.map((dept: Department) => ({
            ...dept,
            skills: departmentSkills[dept.id] || [],
            weeklyActivity: defaultWeeklyActivity[dept.id as keyof typeof defaultWeeklyActivity] || [0, 0, 0, 0, 0, 0, 0]
          }))
          
          setDepartments(enhancedDepts)
          setTotalActive(data.activeDepartments)
        }
      } catch (error) {
        console.error('Failed to fetch agent status:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAgentStatus()
    const interval = setInterval(fetchAgentStatus, 30000) // Poll every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Calculate total stats
  const totalTasks = departments.reduce((sum, d) => sum + d.taskCount, 0)
  const allSkills = Array.from(new Set(departments.flatMap(d => d.skills || []))).sort()
  const totalSkills = allSkills.length

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    )
  }

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
          {departments.map((dept) => {
            const Icon = iconMap[dept.icon] || Monitor
            const weeklyActivity = dept.weeklyActivity || [0, 0, 0, 0, 0, 0, 0]
            const maxActivity = Math.max(...weeklyActivity, 1)
            
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
                {dept.skills && dept.skills.length > 0 && (
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
                )}

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
                    {weeklyActivity.map((activity, index) => (
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
              {departments.map((dept) => {
                const Icon = iconMap[dept.icon] || Monitor
                return (
                  <tr key={dept.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {dept.name}
                        </span>
                      </div>
                    </td>
                    {allSkills.map((skill) => (
                      <td key={skill} className="px-3 py-4 text-center">
                        {dept.skills?.includes(skill) && (
                          <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}