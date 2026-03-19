'use client'

import dynamic from 'next/dynamic'
const TasksPage = dynamic(() => import('@/app/dashboard/tasks/page'), { ssr: false })

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar-simple'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  ExternalLink, 
  RefreshCw,
  GitBranch,
  Users,
  Clock,
  CheckCircle,
  PlayCircle,
  Github,
  Save,
  Archive,
  Activity,
  Settings,
  MessageSquare,
  Eye,
  Clipboard,
  Send,
  Bot,
  User,
  Globe
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'paused' | 'completed'
  priority: 'low' | 'medium' | 'high'
  progress: number
  githubUrl?: string
  previewUrl?: string
  techStack?: string[]
  createdAt: string
  updatedAt: string
  teamSize?: number
  tasksCompleted?: number
  totalTasks?: number
  lastDeployedAt?: string
}

interface Message {
  id: string
  content: string
  sender: 'user' | 'agent' | 'system'
  timestamp: Date
  projectName?: string
}

type DeviceSize = 'desktop' | 'tablet' | 'mobile'

const deviceSizes: Record<DeviceSize, number> = {
  desktop: 1440,
  tablet: 768,
  mobile: 375
}

function hasArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text)
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [deviceSize, setDeviceSize] = useState<DeviceSize>('desktop')
  const [iframeKey, setIframeKey] = useState(0)
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showThinking, setShowThinking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Form state for settings
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    githubUrl: '',
    previewUrl: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'active' as 'active' | 'paused' | 'completed'
  })

  useEffect(() => {
    fetchProject()
  }, [params.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`)
      if (!response.ok) throw new Error('Project not found')
      const data = await response.json()
      setProject(data)
      setFormData({
        name: data.name,
        description: data.description,
        githubUrl: data.githubUrl || '',
        previewUrl: data.previewUrl || '',
        priority: data.priority,
        status: data.status
      })
      
      // Add welcome message
      setMessages([{
        id: 'welcome',
        content: `Welcome to ${data.name} chat! I'm here to help with your project.`,
        sender: 'system',
        timestamp: new Date()
      }])
    } catch (error) {
      console.error('Error fetching project:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || sending) return
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      projectName: project?.name
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setSending(true)
    setShowThinking(true)
    
    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          projectId: project?.id
        })
      })
      
      if (!response.ok) throw new Error('Failed to send message')
      
      const result = await response.json()
      
      // Simulate agent thinking for 2-3 seconds
      setTimeout(() => {
        const agentMessage: Message = {
          id: `agent-${Date.now()}`,
          content: 'Message sent to OpenClaw via Telegram. The agent will process your request.',
          sender: 'agent',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, agentMessage])
        setShowThinking(false)
      }, 2000)
      
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: 'Failed to send message. Please try again.',
        sender: 'system',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setShowThinking(false)
    } finally {
      setSending(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/projects/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!response.ok) throw new Error('Failed to save')
      const updated = await response.json()
      setProject(updated)
      alert('Project updated successfully')
    } catch (error) {
      console.error('Error saving project:', error)
      alert('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this project?')) return
    try {
      const response = await fetch(`/api/projects/${params.id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to archive')
      router.push('/projects')
    } catch (error) {
      console.error('Error archiving project:', error)
      alert('Failed to archive project')
    }
  }

  const refreshIframe = () => {
    setIframeKey(prev => prev + 1)
  }

  if (loading) return <div>Loading...</div>
  if (!project) return <div>Project not found</div>

  const statusColors = {
    active: 'bg-green-500/10 text-green-500',
    paused: 'bg-yellow-500/10 text-yellow-500',
    completed: 'bg-blue-500/10 text-blue-500'
  }

  const priorityColors = {
    low: 'bg-gray-500/10 text-gray-500',
    medium: 'bg-blue-500/10 text-blue-500',
    high: 'bg-red-500/10 text-red-500'
  }

  // Mock activity data
  const recentActivity = [
    { id: 1, action: 'deployed to production', user: 'System', time: '2 hours ago', icon: PlayCircle },
    { id: 2, action: 'completed task: API migration', user: 'Claude', time: '4 hours ago', icon: CheckCircle },
    { id: 3, action: 'pushed 3 commits', user: 'Med', time: '6 hours ago', icon: GitBranch },
    { id: 4, action: 'created pull request #42', user: 'Claude', time: '8 hours ago', icon: Github },
    { id: 5, action: 'updated project settings', user: 'Med', time: '12 hours ago', icon: Settings },
    { id: 6, action: 'ran tests (all passed)', user: 'CI/CD', time: '1 day ago', icon: CheckCircle },
    { id: 7, action: 'merged PR: Fix build errors', user: 'Med', time: '1 day ago', icon: GitBranch },
    { id: 8, action: 'started sprint planning', user: 'Team', time: '2 days ago', icon: Activity },
    { id: 9, action: 'deployed to staging', user: 'System', time: '2 days ago', icon: PlayCircle },
    { id: 10, action: 'created issue: Phase 2 planning', user: 'Med', time: '3 days ago', icon: Clipboard }
  ]

  const isArabic = hasArabic(inputMessage)

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Project Header */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <div className="flex items-center gap-4">
              <Badge className={statusColors[project.status]}>{project.status}</Badge>
              <div className="flex-1 max-w-xs">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Tasks</p>
                  <p className="text-xl font-semibold">
                    {project.tasksCompleted || 12}/{project.totalTasks || 16}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Team Members</p>
                  <p className="text-xl font-semibold">{project.teamSize || 4}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Last Deploy</p>
                  <p className="text-xl font-semibold">
                    {project.lastDeployedAt ? '2 hours ago' : 'Never'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <activity.icon className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span>{' '}
                        {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="flex gap-3">
            <Button size="lg" className="gap-2">
              <PlayCircle className="w-4 h-4" />
              Deploy
            </Button>
            <Button variant="outline" size="lg" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Run Tests
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="gap-2"
              onClick={() => window.open(project.githubUrl || '#', '_blank')}
            >
              <Github className="w-4 h-4" />
              Open GitHub
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Tasks functionality coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="h-[calc(100vh-12rem)]">
          <Card className="h-full flex flex-col">
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Commander Mode Banner */}
              {isArabic && (
                <Alert className="m-4 mb-0 bg-blue-50 dark:bg-blue-950 border-blue-200">
                  <Globe className="h-4 w-4" />
                  <AlertDescription>
                    Commander Mode — Message will be translated to English command
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 ${
                        message.sender === 'user' ? 'flex-row-reverse' : ''
                      } ${message.sender === 'system' ? 'justify-center' : ''}`}
                    >
                      {message.sender !== 'system' && (
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
                            {message.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[70%] ${
                          message.sender === 'user'
                            ? 'bg-blue-500 text-white rounded-l-lg rounded-br-lg px-4 py-2'
                            : message.sender === 'agent'
                            ? 'bg-gray-100 dark:bg-gray-800 rounded-r-lg rounded-bl-lg px-4 py-2'
                            : 'text-sm text-muted-foreground'
                        }`}
                      >
                        {message.projectName && message.sender === 'user' && (
                          <p className="text-xs opacity-80 mb-1">[Project: {message.projectName}]</p>
                        )}
                        <p className={message.sender === 'system' ? 'text-center' : ''}>
                          {message.content}
                        </p>
                        {message.sender !== 'system' && (
                          <p className={`text-xs mt-1 ${
                            message.sender === 'user' ? 'text-blue-100' : 'text-muted-foreground'
                          }`}>
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {showThinking && (
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-r-lg rounded-bl-lg px-4 py-2">
                        <p className="text-sm">
                          <span className="animate-pulse">Thinking...</span>
                        </p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              {/* Input Area */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type your message..."
                    disabled={sending}
                    dir={isArabic ? 'rtl' : 'ltr'}
                    className="flex-1"
                    maxLength={4000}
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={sending || !inputMessage.trim()}
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Messages are sent to OpenClaw via Telegram
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          {/* Device Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={deviceSize === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDeviceSize('desktop')}
                className="gap-2"
              >
                <Monitor className="w-4 h-4" />
                Desktop
              </Button>
              <Button
                variant={deviceSize === 'tablet' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDeviceSize('tablet')}
                className="gap-2"
              >
                <Tablet className="w-4 h-4" />
                Tablet
              </Button>
              <Button
                variant={deviceSize === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDeviceSize('mobile')}
                className="gap-2"
              >
                <Smartphone className="w-4 h-4" />
                Mobile
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshIframe}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(project.previewUrl || '#', '_blank')}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open in new tab
              </Button>
            </div>
          </div>

          {/* Preview Container */}
          <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
            {project.previewUrl ? (
              <div 
                className="mx-auto transition-all duration-300 bg-white rounded-lg overflow-hidden shadow-lg"
                style={{ width: `${deviceSizes[deviceSize]}px`, maxWidth: '100%' }}
              >
                <iframe
                  key={iframeKey}
                  src={project.previewUrl}
                  className="w-full h-[800px] border-0"
                  title="Project Preview"
                />
              </div>
            ) : (
              <Card className="max-w-md mx-auto">
                <CardContent className="p-6 text-center">
                  <Eye className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-semibold mb-2">No preview URL configured</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add a preview URL in the Settings tab to see your project live.
                  </p>
                  <Button onClick={() => setActiveTab('settings')}>
                    Go to Settings
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter project name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter project description"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">GitHub URL</label>
                <Input
                  value={formData.githubUrl}
                  onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                  placeholder="https://github.com/..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Preview URL</label>
                <Input
                  value={formData.previewUrl}
                  onChange={(e) => setFormData({ ...formData, previewUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="destructive"
                  onClick={handleArchive}
                  className="gap-2"
                >
                  <Archive className="w-4 h-4" />
                  Archive Project
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}