"use client"

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  Play, 
  Square, 
  Settings,
  Download,
  Trash,
  Activity,
  Zap,
  Shield,
  Briefcase,
  Search as SearchIcon,
  Eye,
  Lock,
  Edit,
  AlertCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { skillsData, getSkillsStats, type Skill } from '@/lib/skills-data'
import { getCurrentUserClient } from '@/lib/access-control'
import type { User } from '@/lib/access-control'

export default function SkillsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [skills, setSkills] = useState<Skill[]>([])

  const stats = useMemo(() => getSkillsStats(), [])

  useEffect(() => {
    loadUserAndSkills()
  }, [])

  const loadUserAndSkills = async () => {
    try {
      // Get current user
      const user = await getCurrentUserClient()
      setCurrentUser(user)

      // Load skills (simulate delay)
      setTimeout(() => {
        fetch('/api/bridge/skills').then(r=>r.json()).then(d=>{if(d.skills)setSkills(d.skills.map((s:any)=>({id:s.name,name:s.name,description:s.description,category:'development',status:'active',isInstalled:true})));else setSkills(skillsData)}).catch(()=>setSkills(skillsData))
        setIsLoading(false)
      }, 500)
    } catch (error) {
      console.error('Error loading user and skills:', error)
      setIsLoading(false)
    }
  }

  const canUserModify = () => {
    if (!currentUser) return false
    return currentUser.role === 'OWNER' || currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER'
  }

  const canUserInstall = () => {
    if (!currentUser) return false
    return currentUser.role === 'OWNER' || currentUser.role === 'ADMIN'
  }

  const canUserDelete = () => {
    if (!currentUser) return false
    return currentUser.role === 'OWNER'
  }

  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          skill.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory
      const matchesStatus = selectedStatus === 'all' || skill.status === selectedStatus
      
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [skills, searchQuery, selectedCategory, selectedStatus])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'dev': return <Zap className="h-4 w-4" />
      case 'research': return <SearchIcon className="h-4 w-4" />
      case 'security': return <Shield className="h-4 w-4" />
      case 'productivity': return <Briefcase className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'dev': return 'bg-blue-500'
      case 'research': return 'bg-green-500'
      case 'security': return 'bg-red-500'
      case 'productivity': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const handleSkillToggle = async (skillId: string, currentStatus: string) => {
    if (!canUserModify()) {
      alert('You do not have permission to modify skills')
      return
    }

    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      
      // Update local state optimistically
      setSkills(prev => prev.map(skill => 
        skill.id === skillId ? { ...skill, status: newStatus as 'active' | 'inactive' } : skill
      ))

      const response = await fetch('/api/openclaw/skills/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId, enabled: newStatus === 'active' })
      })

      if (!response.ok) {
        // Revert on error
        setSkills(prev => prev.map(skill => 
          skill.id === skillId ? { ...skill, status: currentStatus as 'active' | 'inactive' } : skill
        ))
      }
    } catch (error) {
      console.error('Failed to toggle skill:', error)
      // Revert on error
      setSkills(prev => prev.map(skill => 
        skill.id === skillId ? { ...skill, status: currentStatus as 'active' | 'inactive' } : skill
      ))
    }
  }

  const handleBulkAction = async (action: string) => {
    if (!canUserModify()) {
      alert('You do not have permission to modify skills')
      return
    }

    if (selectedSkills.length === 0) return

    try {
      const response = await fetch('/api/openclaw/skills/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, skillIds: selectedSkills })
      })

      if (response.ok) {
        // Update local state based on action
        if (action === 'enable' || action === 'disable') {
          const newStatus = action === 'enable' ? 'active' : 'inactive'
          setSkills(prev => prev.map(skill => 
            selectedSkills.includes(skill.id) ? { ...skill, status: newStatus } : skill
          ))
        }
        setSelectedSkills([])
      }
    } catch (error) {
      console.error(`Failed to ${action} skills:`, error)
    }
  }

  const toggleSkillSelection = (skillId: string) => {
    if (!canUserModify()) return
    
    setSelectedSkills(prev => 
      prev.includes(skillId) 
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    )
  }

  const isReadOnly = !canUserModify()

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-2"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-muted rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Skills</h1>
          <p className="text-muted-foreground">
            {currentUser?.role === 'OWNER' || currentUser?.role === 'ADMIN' 
              ? 'Manage your AI agent capabilities and automations'
              : currentUser?.role === 'MANAGER' 
                ? 'Configure skills for your projects'
                : 'View available AI agent capabilities'
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {canUserInstall() && (
            <>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Install Skill
              </Button>
            </>
          )}
          {isReadOnly && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Eye className="h-3 w-3 mr-1" />
              View Only
            </Badge>
          )}
        </div>
      </div>

      {/* Access level indicator for non-owners */}
      {currentUser && currentUser.role !== 'OWNER' && (
        <div className={`border rounded-lg p-4 ${
          currentUser.role === 'VIEWER' 
            ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
            : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
        }`}>
          <div className="flex items-center space-x-2">
            <Badge className={
              currentUser.role === 'VIEWER' 
                ? 'bg-blue-500 text-white' 
                : currentUser.role === 'MANAGER'
                  ? 'bg-green-500 text-white'
                  : 'bg-orange-500 text-white'
            }>
              {currentUser.role}
            </Badge>
            <span className={`text-sm ${
              currentUser.role === 'VIEWER' 
                ? 'text-blue-900 dark:text-blue-100'
                : 'text-green-900 dark:text-green-100'
            }`}>
              {currentUser.role === 'VIEWER' 
                ? 'You can view skills but cannot modify them'
                : currentUser.role === 'MANAGER'
                  ? 'You can configure skills but cannot install/uninstall'
                  : 'You have administrative access to skills'
              }
            </span>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Skills</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Development</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories.dev}</div>
            <p className="text-xs text-muted-foreground">
              Coding & development
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Research</CardTitle>
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories.research}</div>
            <p className="text-xs text-muted-foreground">
              Search & analysis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories.security}</div>
            <p className="text-xs text-muted-foreground">
              Protection & audit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value || 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="dev">Development</SelectItem>
            <SelectItem value="research">Research</SelectItem>
            <SelectItem value="security">Security</SelectItem>
            <SelectItem value="productivity">Productivity</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value || 'all')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions - Only for users with modify permissions */}
      {selectedSkills.length > 0 && canUserModify() && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">
                  {selectedSkills.length} skill{selectedSkills.length > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleBulkAction('enable')}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Enable All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleBulkAction('disable')}
                >
                  <Square className="h-3 w-3 mr-1" />
                  Disable All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedSkills([])}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Read-only notice for viewers */}
      {isReadOnly && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">View-Only Mode</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                You can browse skills but cannot enable, disable, or install them. Contact your admin for modifications.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSkills.map((skill) => (
          <Card 
            key={skill.id} 
            className={`transition-all hover:shadow-md ${
              selectedSkills.includes(skill.id) ? 'ring-2 ring-blue-500' : ''
            } ${isReadOnly ? 'bg-gray-50/50 dark:bg-gray-950/50' : ''}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {canUserModify() && (
                    <input
                      type="checkbox"
                      checked={selectedSkills.includes(skill.id)}
                      onChange={() => toggleSkillSelection(skill.id)}
                      className="rounded"
                    />
                  )}
                  <div className={`p-2 rounded-lg text-white ${getCategoryColor(skill.category)} ${
                    isReadOnly ? 'opacity-70' : ''
                  }`}>
                    {getCategoryIcon(skill.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold truncate">
                      {skill.name}
                      {isReadOnly && <Lock className="h-3 w-3 ml-1 inline" />}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={skill.status === 'active' ? 'default' : 'secondary'}>
                        {skill.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {skill.category}
                      </Badge>
                    </div>
                  </div>
                </div>
                {!isReadOnly && (
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleSkillToggle(skill.id, skill.status)}
                      >
                        {skill.status === 'active' ? (
                          <>
                            <Square className="h-4 w-4 mr-2" />
                            Disable
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Enable
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </DropdownMenuItem>
                      {canUserDelete() && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash className="h-4 w-4 mr-2" />
                            Uninstall
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-sm line-clamp-3 mb-3">
                {skill.description}
              </CardDescription>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>v{skill.version || '1.0.0'}</span>
                <span>Used {skill.lastUsed || 'never'}</span>
              </div>
              {isReadOnly && (
                <div className="mt-2 text-xs text-blue-600 bg-blue-50 dark:bg-blue-950/30 p-2 rounded border border-blue-200 dark:border-blue-800">
                  <Eye className="h-3 w-3 inline mr-1" />
                  View-only access
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredSkills.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No skills found</h3>
            <p className="text-muted-foreground text-center mb-6">
              {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? "No skills match your current filters. Try adjusting your search criteria."
                : "You don't have any skills installed yet. Install your first skill to get started."
              }
            </p>
            <div className="flex items-center space-x-3">
              {(searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all') && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('all')
                    setSelectedStatus('all')
                  }}
                >
                  Clear Filters
                </Button>
              )}
              {canUserInstall() && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Browse Skills
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}