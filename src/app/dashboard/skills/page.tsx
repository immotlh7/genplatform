"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { 
  Zap, 
  Search, 
  Plus, 
  Settings, 
  Download,
  Upload,
  MoreVertical,
  Package,
  Shield,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Code,
  RefreshCw,
  Play,
  Pause
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  type Skill, 
  skillsData,
  getSkillsStats,
  getSkillsByCategory
} from '@/lib/skills-data'

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSkills()
  }, [])

  const loadSkills = async () => {
    try {
      // Fetch real skills from Bridge API
      const response = await fetch('/api/bridge/skills')
      const data = await response.json()
      
      if (data.skills) {
        // Transform skills to match our Skill interface
        const transformedSkills = data.skills.map((skill: any) => ({
          id: skill.name,
          name: skill.displayName || skill.name,
          description: skill.description || '',
          category: skill.category || 'utility',
          status: skill.enabled ? 'active' : 'inactive',
          version: skill.version || '1.0.0',
          author: skill.author || 'OpenClaw',
          lastUsed: skill.lastUsed || null,
          usageCount: skill.usageCount || 0,
          permissions: skill.permissions || [],
          icon: skill.icon || '🔧'
        }))
        
        setSkills(transformedSkills)
      }
    } catch (error) {
      console.error('Failed to load skills:', error)
      // Fall back to demo data
      setSkills(skillsData)
    } finally {
      setLoading(false)
    }
  }

  const stats = getSkillsStats(skills)
  const categories = [
    { id: 'all', name: 'All' },
    { id: 'productivity', name: 'Productivity' },
    { id: 'development', name: 'Development' },
    { id: 'communication', name: 'Communication' },
    { id: 'analytics', name: 'Analytics' },
    { id: 'utility', name: 'Utility' }
  ]

  const filteredSkills = selectedCategory === 'all'
    ? skills.filter(skill => 
        !searchQuery || skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : skills.filter(skill => 
        skill.category === selectedCategory &&
        (!searchQuery || skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )

  const handleToggleSkill = async (skillId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      
      // Update local state optimistically
      setSkills(prev => prev.map(skill => 
        skill.id === skillId ? { ...skill, status: newStatus as 'active' | 'inactive' } : skill
      ))

      // Note: In production, this would call the actual Bridge API endpoint
      console.log(`Toggling skill ${skillId} to ${newStatus}`)
    } catch (error) {
      console.error('Failed to toggle skill:', error)
      // Revert on error
      setSkills(prev => prev.map(skill => 
        skill.id === skillId ? { ...skill, status: currentStatus as 'active' | 'inactive' } : skill
      ))
    }
  }

  const handleBulkAction = async (action: 'enable' | 'disable', skillIds: string[]) => {
    try {
      const newStatus = action === 'enable' ? 'active' : 'inactive'
      
      // Update local state
      setSkills(prev => prev.map(skill => 
        skillIds.includes(skill.id) ? { ...skill, status: newStatus } : skill
      ))

      // Note: In production, this would call the actual Bridge API endpoint
      console.log(`Bulk ${action} for skills:`, skillIds)
    } catch (error) {
      console.error('Failed to perform bulk action:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Skills</h1>
          <p className="text-muted-foreground">
            Manage and configure your AI assistant's capabilities
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Install Skill
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Skills</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.installed} installed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Skills</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.active / stats.total) * 100)}% enabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usage Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usageToday}</div>
            <p className="text-xs text-muted-foreground">
              executions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length - 1}</div>
            <p className="text-xs text-muted-foreground">
              skill types
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
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
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => loadSkills()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => handleBulkAction('enable', filteredSkills.map(s => s.id))}
              >
                Enable All
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleBulkAction('disable', filteredSkills.map(s => s.id))}
              >
                Disable All
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Export Configuration</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Skills Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          {categories.map(category => (
            <TabsTrigger 
              key={category.id} 
              value={category.id}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
              {category.id !== 'all' && (
                <Badge variant="secondary" className="ml-2">
                  {skills.filter(s => s.category === category.id).length}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map((skill) => (
              <Card key={skill.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="text-2xl">{skill.icon}</div>
                      <div>
                        <CardTitle className="text-base">{skill.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {skill.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            v{skill.version}
                          </span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Code className="h-4 w-4 mr-2" />
                          View Code
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          Uninstall
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{skill.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {skill.lastUsed ? (
                        <span>Last used: {new Date(skill.lastUsed).toLocaleDateString()}</span>
                      ) : (
                        <span>Never used</span>
                      )}
                    </div>
                    <Button
                      variant={skill.status === 'active' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleSkill(skill.id, skill.status)}
                    >
                      {skill.status === 'active' ? (
                        <>
                          <Pause className="h-3 w-3 mr-1" />
                          Enabled
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          Enable
                        </>
                      )}
                    </Button>
                  </div>

                  {skill.permissions.length > 0 && (
                    <div className="pt-2 border-t">
                      <div className="text-xs font-medium mb-1">Permissions:</div>
                      <div className="flex flex-wrap gap-1">
                        {skill.permissions.map(perm => (
                          <Badge key={perm} variant="secondary" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredSkills.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-lg">No skills found</h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? "Try adjusting your search terms" 
                  : "Install skills to extend your assistant's capabilities"}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}