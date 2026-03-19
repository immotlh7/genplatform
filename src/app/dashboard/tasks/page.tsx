'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { 
  Search, 
  Plus, 
  Clock, 
  Timer,
  CheckCircle,
  ArrowRight,
  LayoutGrid,
  List,
  Play,
  Pause,
  RotateCcw,
  Ban,
  Calendar
} from 'lucide-react'

interface Task {
  id: string
  number: string
  name: string
  description: string
  status: 'backlog' | 'planned' | 'in_progress' | 'review' | 'done'
  assignedRole: Role
  estimatedTime: number // in hours
  actualTime?: number // in hours
  sprint: string
  priority: 'low' | 'medium' | 'high'
  startedAt?: string
  completedAt?: string
  blockedReason?: string
}

interface Role {
  id: string
  name: string
  icon: string
}

interface Column {
  id: string
  title: string
  color: string
  tasks: Task[]
}

const roles: Role[] = [
  { id: 'frontend', name: 'Frontend', icon: '💻' },
  { id: 'backend', name: 'Backend', icon: '⚙️' },
  { id: 'security', name: 'Security', icon: '🛡️' },
  { id: 'qa', name: 'QA', icon: '🔍' },
  { id: 'research', name: 'Research', icon: '🔬' },
  { id: 'planning', name: 'Planning', icon: '📋' },
  { id: 'improvement', name: 'Self-Improvement', icon: '📈' }
]

const initialTasks: Task[] = [
  // Done tasks
  {
    id: '1',
    number: 'T-01',
    name: 'Set up project repository',
    description: 'Initialize Git repository, set up branch protection rules, and create initial README',
    status: 'done',
    assignedRole: roles[1],
    estimatedTime: 2,
    actualTime: 1.5,
    sprint: 'Sprint 1',
    priority: 'high',
    completedAt: '2024-03-15T10:00:00Z'
  },
  {
    id: '2',
    number: 'T-02',
    name: 'Design system architecture',
    description: 'Create high-level system design and component architecture diagrams',
    status: 'done',
    assignedRole: roles[5],
    estimatedTime: 8,
    actualTime: 10,
    sprint: 'Sprint 1',
    priority: 'high',
    completedAt: '2024-03-16T15:30:00Z'
  },
  {
    id: '3',
    number: 'T-03',
    name: 'Implement authentication system',
    description: 'Set up JWT-based authentication with refresh tokens and secure session management',
    status: 'done',
    assignedRole: roles[1],
    estimatedTime: 16,
    actualTime: 14,
    sprint: 'Sprint 1',
    priority: 'high',
    completedAt: '2024-03-18T18:00:00Z'
  },
  
  // In Progress tasks
  {
    id: '4',
    number: 'T-04',
    name: 'Create dashboard layout',
    description: 'Implement responsive dashboard layout with sidebar navigation and header',
    status: 'in_progress',
    assignedRole: roles[0],
    estimatedTime: 12,
    sprint: 'Sprint 2',
    priority: 'medium',
    startedAt: '2024-03-19T09:00:00Z'
  },
  {
    id: '5',
    number: 'T-05',
    name: 'API rate limiting',
    description: 'Implement rate limiting for all API endpoints to prevent abuse',
    status: 'in_progress',
    assignedRole: roles[2],
    estimatedTime: 6,
    sprint: 'Sprint 2',
    priority: 'high',
    startedAt: '2024-03-19T08:00:00Z'
  },
  
  // Review tasks
  {
    id: '6',
    number: 'T-06',
    name: 'User profile management',
    description: 'Create user profile pages with edit functionality and avatar upload',
    status: 'review',
    assignedRole: roles[0],
    estimatedTime: 8,
    sprint: 'Sprint 2',
    priority: 'medium'
  },
  {
    id: '7',
    number: 'T-07',
    name: 'Database optimization',
    description: 'Optimize database queries and add proper indexing for performance',
    status: 'review',
    assignedRole: roles[1],
    estimatedTime: 10,
    sprint: 'Sprint 2',
    priority: 'medium'
  },
  
  // Planned tasks
  {
    id: '8',
    number: 'T-08',
    name: 'Real-time notifications',
    description: 'Implement WebSocket-based real-time notifications system',
    status: 'planned',
    assignedRole: roles[1],
    estimatedTime: 20,
    sprint: 'Sprint 3',
    priority: 'medium'
  },
  {
    id: '9',
    number: 'T-09',
    name: 'Security audit',
    description: 'Perform comprehensive security audit of the application',
    status: 'planned',
    assignedRole: roles[2],
    estimatedTime: 16,
    sprint: 'Sprint 3',
    priority: 'high'
  },
  {
    id: '10',
    number: 'T-10',
    name: 'Automated testing setup',
    description: 'Set up Jest, React Testing Library, and E2E tests with Playwright',
    status: 'planned',
    assignedRole: roles[3],
    estimatedTime: 24,
    sprint: 'Sprint 3',
    priority: 'high'
  },
  
  // Backlog tasks
  {
    id: '11',
    number: 'T-11',
    name: 'Performance monitoring',
    description: 'Integrate APM tools and set up performance monitoring dashboards',
    status: 'backlog',
    assignedRole: roles[6],
    estimatedTime: 12,
    sprint: 'Sprint 4',
    priority: 'low'
  },
  {
    id: '12',
    number: 'T-12',
    name: 'Multi-language support',
    description: 'Implement i18n with support for Arabic, English, and French',
    status: 'backlog',
    assignedRole: roles[0],
    estimatedTime: 30,
    sprint: 'Sprint 4',
    priority: 'medium'
  },
  {
    id: '13',
    number: 'T-13',
    name: 'Data export functionality',
    description: 'Allow users to export their data in CSV, JSON, and PDF formats',
    status: 'backlog',
    assignedRole: roles[1],
    estimatedTime: 15,
    sprint: 'Sprint 4',
    priority: 'low'
  },
  {
    id: '14',
    number: 'T-14',
    name: 'AI integration research',
    description: 'Research and prototype AI/ML features for intelligent task suggestions',
    status: 'backlog',
    assignedRole: roles[4],
    estimatedTime: 40,
    sprint: 'Sprint 5',
    priority: 'medium'
  },
  {
    id: '15',
    number: 'T-15',
    name: 'Mobile app planning',
    description: 'Create technical specification for React Native mobile app',
    status: 'backlog',
    assignedRole: roles[5],
    estimatedTime: 20,
    sprint: 'Sprint 5',
    priority: 'low'
  }
]

const columnOrder = ['backlog', 'planned', 'in_progress', 'review', 'done']

const columnConfig = {
  backlog: { title: 'Backlog', color: 'border-gray-500' },
  planned: { title: 'Planned', color: 'border-blue-500' },
  in_progress: { title: 'In Progress', color: 'border-amber-500' },
  review: { title: 'Review', color: 'border-purple-500' },
  done: { title: 'Done', color: 'border-green-500' }
}

function getElapsedTime(startedAt: string): string {
  const start = new Date(startedAt)
  const now = new Date()
  const hours = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60))
  return `${hours}h`
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [sprintFilter, setSprintFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Group tasks by status
  const columns: Record<string, Column> = {}
  columnOrder.forEach(status => {
    columns[status] = {
      id: status,
      title: columnConfig[status].title,
      color: columnConfig[status].color,
      tasks: tasks.filter(task => task.status === status)
    }
  })
  
  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || task.assignedRole.id === roleFilter
    const matchesSprint = sprintFilter === 'all' || task.sprint === sprintFilter
    return matchesSearch && matchesRole && matchesSprint
  })
  
  // Calculate progress
  const doneTasks = tasks.filter(task => task.status === 'done').length
  const totalTasks = tasks.length
  const progress = Math.round((doneTasks / totalTasks) * 100)
  
  // Get unique sprints
  const sprints = [...new Set(tasks.map(task => task.sprint))]
  
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    
    const sourceStatus = result.source.droppableId
    const destStatus = result.destination.droppableId
    
    if (sourceStatus === destStatus) {
      // Reorder within same column
      const column = columns[sourceStatus]
      const reorderedTasks = Array.from(column.tasks)
      const [movedTask] = reorderedTasks.splice(result.source.index, 1)
      reorderedTasks.splice(result.destination.index, 0, movedTask)
      
      // Update all tasks
      setTasks(prevTasks => {
        const otherTasks = prevTasks.filter(task => task.status !== sourceStatus)
        return [...otherTasks, ...reorderedTasks]
      })
    } else {
      // Move to different column
      setTasks(prevTasks => {
        return prevTasks.map(task => {
          if (task.id === result.draggableId) {
            const updatedTask = { ...task, status: destStatus as Task['status'] }
            
            // Update timestamps based on status change
            if (destStatus === 'in_progress' && !task.startedAt) {
              updatedTask.startedAt = new Date().toISOString()
            } else if (destStatus === 'done') {
              updatedTask.completedAt = new Date().toISOString()
              if (updatedTask.startedAt) {
                const hours = Math.floor((new Date().getTime() - new Date(updatedTask.startedAt).getTime()) / (1000 * 60 * 60))
                updatedTask.actualTime = hours || 1
              }
            }
            
            return updatedTask
          }
          return task
        })
      })
    }
  }
  
  const moveTaskToNext = (task: Task) => {
    const currentIndex = columnOrder.indexOf(task.status)
    if (currentIndex < columnOrder.length - 1) {
      const nextStatus = columnOrder[currentIndex + 1] as Task['status']
      handleDragEnd({
        draggableId: task.id,
        source: { droppableId: task.status, index: 0 },
        destination: { droppableId: nextStatus, index: 0 },
        type: 'DEFAULT'
      } as DropResult)
    }
  }
  
  const updateTaskStatus = (task: Task, newStatus: 'start' | 'complete' | 'return' | 'block') => {
    setTasks(prevTasks => {
      return prevTasks.map(t => {
        if (t.id === task.id) {
          switch (newStatus) {
            case 'start':
              return { ...t, status: 'in_progress', startedAt: new Date().toISOString() }
            case 'complete':
              return { 
                ...t, 
                status: 'done', 
                completedAt: new Date().toISOString(),
                actualTime: t.startedAt ? Math.floor((new Date().getTime() - new Date(t.startedAt).getTime()) / (1000 * 60 * 60)) || 1 : t.estimatedTime
              }
            case 'return':
              return { ...t, status: 'backlog', startedAt: undefined, completedAt: undefined, actualTime: undefined }
            case 'block':
              return { ...t, blockedReason: 'Blocked - awaiting dependencies' }
            default:
              return t
          }
        }
        return t
      })
    })
    setIsModalOpen(false)
  }
  
  const TaskCard = ({ task, isDragging }: { task: Task; isDragging: boolean }) => (
    <Card className={`mb-3 cursor-pointer transition-all ${isDragging ? 'opacity-50' : ''}`}>
      <CardContent className="p-3" onClick={() => { setSelectedTask(task); setIsModalOpen(true) }}>
        <div className="flex items-start justify-between mb-2">
          <Badge variant="outline" className="text-xs">
            {task.number}
          </Badge>
          <Badge 
            className={`text-xs ${
              task.priority === 'high' ? 'bg-red-100 text-red-700' :
              task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
              'bg-green-100 text-green-700'
            }`}
          >
            {task.priority}
          </Badge>
        </div>
        
        <h4 className="font-semibold text-sm mb-2 line-clamp-2">{task.name}</h4>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <span>{task.assignedRole.icon} {task.assignedRole.name}</span>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {task.estimatedTime}h
          </span>
          <Badge variant="outline" className="text-xs">
            {task.sprint}
          </Badge>
        </div>
        
        {task.status === 'in_progress' && task.startedAt && (
          <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
            <Timer className="w-3 h-3" />
            {getElapsedTime(task.startedAt)} elapsed
          </div>
        )}
        
        {task.status === 'done' && task.actualTime && (
          <div className="mt-2 text-xs">
            <span className={task.actualTime <= task.estimatedTime ? 'text-green-600' : 'text-red-600'}>
              {task.actualTime}h actual vs {task.estimatedTime}h estimated
            </span>
          </div>
        )}
        
        <Button 
          size="sm" 
          variant="ghost" 
          className="mt-2 w-full text-xs"
          onClick={(e) => { e.stopPropagation(); moveTaskToNext(task) }}
          disabled={task.status === 'done'}
        >
          <ArrowRight className="w-3 h-3 mr-1" />
          Move
        </Button>
      </CardContent>
    </Card>
  )
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage your project tasks</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Task
        </Button>
      </div>
      
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>{doneTasks} of {totalTasks} tasks done</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      {/* Filters and View Toggle */}
      <div className="flex items-center gap-4">
        <div className="flex-1 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map(role => (
                <SelectItem key={role.id} value={role.id}>
                  {role.icon} {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sprintFilter} onValueChange={setSprintFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Sprints" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sprints</SelectItem>
              {sprints.map(sprint => (
                <SelectItem key={sprint} value={sprint}>
                  {sprint}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-1 p-1 bg-muted rounded-md">
          <Button
            variant={viewMode === 'board' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('board')}
            className="gap-2"
          >
            <LayoutGrid className="w-4 h-4" />
            Board
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="gap-2"
          >
            <List className="w-4 h-4" />
            List
          </Button>
        </div>
      </div>
      
      {/* Kanban Board */}
      {viewMode === 'board' ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-5 gap-4">
            {columnOrder.map(columnId => {
              const column = columns[columnId]
              const columnTasks = column.tasks.filter(task => {
                const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                     task.description.toLowerCase().includes(searchQuery.toLowerCase())
                const matchesRole = roleFilter === 'all' || task.assignedRole.id === roleFilter
                const matchesSprint = sprintFilter === 'all' || task.sprint === sprintFilter
                return matchesSearch && matchesRole && matchesSprint
              })
              
              return (
                <div key={column.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className={`flex items-center justify-between mb-4 pb-2 border-b-2 ${column.color}`}>
                    <h3 className="font-semibold">{column.title}</h3>
                    <Badge variant="secondary">{columnTasks.length}</Badge>
                  </div>
                  
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[400px] ${snapshot.isDraggingOver ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                      >
                        {columnTasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <TaskCard task={task} isDragging={snapshot.isDragging} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        </DragDropContext>
      ) : (
        // List View
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="p-4">#</th>
                  <th className="p-4">Task</th>
                  <th className="p-4">Assigned To</th>
                  <th className="p-4">Sprint</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => (
                  <tr 
                    key={task.id} 
                    className="border-b hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                    onClick={() => { setSelectedTask(task); setIsModalOpen(true) }}
                  >
                    <td className="p-4">
                      <Badge variant="outline">{task.number}</Badge>
                    </td>
                    <td className="p-4 font-medium">{task.name}</td>
                    <td className="p-4">
                      <span>{task.assignedRole.icon} {task.assignedRole.name}</span>
                    </td>
                    <td className="p-4">{task.sprint}</td>
                    <td className="p-4">
                      <Badge variant="secondary">{columnConfig[task.status].title}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge 
                        className={`${
                          task.priority === 'high' ? 'bg-red-100 text-red-700' :
                          task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}
                      >
                        {task.priority}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {task.status === 'done' && task.actualTime ? (
                        <span className={task.actualTime <= task.estimatedTime ? 'text-green-600' : 'text-red-600'}>
                          {task.actualTime}h / {task.estimatedTime}h
                        </span>
                      ) : (
                        <span>{task.estimatedTime}h</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
      
      {/* Task Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {selectedTask && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl">
                  {selectedTask.number}: {selectedTask.name}
                </DialogTitle>
                <Badge 
                  className={`${
                    selectedTask.priority === 'high' ? 'bg-red-100 text-red-700' :
                    selectedTask.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}
                >
                  {selectedTask.priority} priority
                </Badge>
              </div>
              <DialogDescription className="mt-2">
                {selectedTask.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 my-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="secondary" className="mt-1">
                    {columnConfig[selectedTask.status].title}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assigned To</p>
                  <p className="mt-1">
                    {selectedTask.assignedRole.icon} {selectedTask.assignedRole.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sprint</p>
                  <p className="mt-1">{selectedTask.sprint}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time Estimate</p>
                  <p className="mt-1">{selectedTask.estimatedTime} hours</p>
                </div>
              </div>
              
              {selectedTask.status === 'in_progress' && selectedTask.startedAt && (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    In Progress
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">
                    Started {new Date(selectedTask.startedAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-300">
                    {getElapsedTime(selectedTask.startedAt)} elapsed
                  </p>
                </div>
              )}
              
              {selectedTask.status === 'done' && selectedTask.completedAt && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Completed
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                    Finished {new Date(selectedTask.completedAt).toLocaleString()}
                  </p>
                  {selectedTask.actualTime && (
                    <p className="text-sm text-green-600 dark:text-green-300">
                      Took {selectedTask.actualTime} hours (estimated {selectedTask.estimatedTime} hours)
                    </p>
                  )}
                </div>
              )}
              
              {selectedTask.blockedReason && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Blocked
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                    {selectedTask.blockedReason}
                  </p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <div className="flex gap-2">
                {selectedTask.status !== 'done' && selectedTask.status !== 'in_progress' && (
                  <Button onClick={() => updateTaskStatus(selectedTask, 'start')} className="gap-2">
                    <Play className="w-4 h-4" />
                    Start
                  </Button>
                )}
                {selectedTask.status === 'in_progress' && (
                  <Button onClick={() => updateTaskStatus(selectedTask, 'complete')} className="gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Complete
                  </Button>
                )}
                {selectedTask.status !== 'backlog' && (
                  <Button variant="outline" onClick={() => updateTaskStatus(selectedTask, 'return')} className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Return to Backlog
                  </Button>
                )}
                {selectedTask.status !== 'done' && !selectedTask.blockedReason && (
                  <Button variant="outline" onClick={() => updateTaskStatus(selectedTask, 'block')} className="gap-2">
                    <Ban className="w-4 h-4" />
                    Block
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}