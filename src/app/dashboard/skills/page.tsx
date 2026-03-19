"use client"

import { CardGridSkeleton } from "@/components/ui/page-skeleton"
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
  Pause,
  X,
  BookOpen,
  Filter
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getDepartmentsForSkill, getCategoryForSkill } from '@/lib/skill-department-mapping'
import { 
  type Skill, 
  skillsData,
  getSkillsStats,
  getSkillsByCategory
} from '@/lib/skills-data'

interface SkillDetail {
  name: string
  description: string
  content: string
  path: string
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [selectedSkill, setSelectedSkill] = useState<SkillDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  useEffect(() => {
    loadSkills()
  }, [])

  const loadSkills = async () => {
    try {
      setLoading(true)
      // Fetch real skills from Bridge API
      const response = await fetch('/api/bridge/skills')
      const data = await response.json()
      
      if (data.skills) {
        // Transform skills to match our Skill interface
        const transformedSkills = data.skills.map((skill: any) => ({
          id: skill.name,
          name: skill.displayName || skill.name,
          description: skill.description || '',
          category: getCategoryForSkill(skill.name),
          status: skill.status === 'active' ? 'active' : 'inactive',
          version: skill.version || '1.0.0',
          author: skill.author || 'OpenClaw',
          lastUsed: skill.lastUsed || null,
          usageCount: skill.usageCount || 0,
          permissions: skill.permissions || [],
          icon: skill.icon || '🔧'
        }))
        
        setSkills(transformedSkills)
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error('Failed to load skills:', error)
      // Fall back to demo data
      setSkills(skillsData)
    } finally {
      setLoading(false)
    }
  }

  const loadSkillDetail = async (skillName: string) => {
    try {
      setLoadingDetail(true)
      const response = await fetch(`/api/bridge/skills/${encodeURIComponent(skillName)}`)
      const data = await response.json()
      
      if (data.content) {
        setSelectedSkill(data)
      } else {
        throw new Error('No content found')
      }
    } catch (error) {
      console.error('Failed to load skill detail:', error)
      setSelectedSkill({
        name: skillName,
        description: 'Failed to load skill details',
        content: 'Error loading skill markdown content',
        path: ''
      })
    } finally {
      setLoadingDetail(false)
    }
  }

  // Calculate stats with category breakdown
  const stats = getSkillsStats(skills)
  const categoryStats = {
    development: skills.filter(s => s.category === 'development').length,
    research: skills.filter(s => s.category === 'research').length,
    security: skills.filter(s => s.category === 'security').length,
    productivity: skills.filter(s => s.category === 'productivity').length
  }

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'development', name: 'Development' },
    { id: 'research', name: 'Research' },
    { id: 'security', name: 'Security' },
    { id: 'productivity', name: 'Productivity' },
    { id: 'utility', name: 'Utility' }
  ]

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = !searchQuery || 
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const toggleSkill = async (skillId: string) => {
    // In real implementation, this would call the API
    setSkills(skills.map(skill =>
      skill.id === skillId
        ? { ...skill, status: skill.status === 'active' ? 'inactive' : 'active' }
        : skill
    ))
  }

  const formatLastRefresh = () => {
    if (!lastRefresh) return 'Never'
    const now = new Date()
    const diff = Math.floor((now.getTime() - lastRefresh.getTime()) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`
    return `${Math.floor(diff / 3600)} hours ago`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Skills Library</h1>
          <p className="text-muted-foreground">
            35 skills installed from OpenClaw workspace
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last refresh: {formatLastRefresh()}
          </div>
          <Button onClick={loadSkills} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh Skills
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Skill
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Skills</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
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
            <Code className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryStats.development}</div>
            <p className="text-xs text-muted-foreground">
              coding & tools
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Research</CardTitle>
            <Search className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryStats.research}</div>
            <p className="text-xs text-muted-foreground">
              search & analysis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryStats.security}</div>
            <p className="text-xs text-muted-foreground">
              audit & protection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryStats.productivity}</div>
            <p className="text-xs text-muted-foreground">
              automation & tools
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Skills Grid */}
      <Tabs defaultValue="grid">
        <TabsList className="mb-4">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
        </TabsList>

        {loading ? (
          <CardGridSkeleton count={9} />
        ) : (
          <>
            <TabsContent value="grid">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSkills.map((skill) => {
                  const departments = getDepartmentsForSkill(skill.id)
                  
                  return (
                    <Card 
                      key={skill.id} 
                      className={`cursor-pointer hover:shadow-lg transition-shadow ${
                        skill.status === 'inactive' ? 'opacity-60' : ''
                      }`}
                      onClick={() => loadSkillDetail(skill.id)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{skill.icon}</div>
                            <div className="flex-1">
                              <CardTitle className="text-lg">{skill.name}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={skill.status === 'active' ? 'default' : 'secondary'}>
                                  {skill.status}
                                </Badge>
                                <Badge variant="outline">{skill.category}</Badge>
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleSkill(skill.id); }}>
                                {skill.status === 'active' ? (
                                  <>
                                    <Pause className="w-4 h-4 mr-2" />
                                    Disable
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4 mr-2" />
                                    Enable
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                <Settings className="w-4 h-4 mr-2" />
                                Configure
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={(e) => e.stopPropagation()}>
                                <XCircle className="w-4 h-4 mr-2" />
                                Uninstall
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <CardDescription className="mt-2 line-clamp-2">
                          {skill.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {/* Department badges */}
                        {departments.length > 0 && (
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm text-muted-foreground">Used by:</span>
                            <div className="flex gap-1">
                              {departments.map(dept => (
                                <Badge 
                                  key={dept.id} 
                                  variant="outline" 
                                  className="text-xs px-2 py-0"
                                >
                                  {dept.icon} {dept.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            v{skill.version} • {skill.author}
                          </span>
                          {skill.usageCount > 0 && (
                            <span className="text-muted-foreground">
                              {skill.usageCount} uses
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="list">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left font-medium">Skill</th>
                          <th className="px-4 py-3 text-left font-medium">Category</th>
                          <th className="px-4 py-3 text-left font-medium">Departments</th>
                          <th className="px-4 py-3 text-left font-medium">Status</th>
                          <th className="px-4 py-3 text-left font-medium">Version</th>
                          <th className="px-4 py-3 text-left font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSkills.map((skill) => {
                          const departments = getDepartmentsForSkill(skill.id)
                          
                          return (
                            <tr key={skill.id} className="border-b hover:bg-muted/50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <span className="text-xl">{skill.icon}</span>
                                  <div>
                                    <div 
                                      className="font-medium hover:underline cursor-pointer"
                                      onClick={() => loadSkillDetail(skill.id)}
                                    >
                                      {skill.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground line-clamp-1 max-w-md">
                                      {skill.description}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant="outline">{skill.category}</Badge>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1 flex-wrap">
                                  {departments.map(dept => (
                                    <span key={dept.id} className="text-sm">
                                      {dept.icon}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  variant={skill.status === 'active' ? 'default' : 'secondary'}
                                >
                                  {skill.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                v{skill.version}
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleSkill(skill.id)}
                                >
                                  {skill.status === 'active' ? 'Disable' : 'Enable'}
                                </Button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories">
              <div className="space-y-6">
                {categories.filter(cat => cat.id !== 'all').map(category => {
                  const categorySkills = filteredSkills.filter(skill => skill.category === category.id)
                  
                  if (categorySkills.length === 0) return null
                  
                  return (
                    <div key={category.id}>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        {category.name}
                        <Badge variant="secondary">{categorySkills.length}</Badge>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categorySkills.map((skill) => {
                          const departments = getDepartmentsForSkill(skill.id)
                          
                          return (
                            <Card 
                              key={skill.id}
                              className="cursor-pointer hover:shadow-lg transition-shadow"
                              onClick={() => loadSkillDetail(skill.id)}
                            >
                              <CardHeader>
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{skill.icon}</span>
                                  <div className="flex-1">
                                    <CardTitle className="text-lg">{skill.name}</CardTitle>
                                    <CardDescription className="line-clamp-2 mt-1">
                                      {skill.description}
                                    </CardDescription>
                                  </div>
                                </div>
                              </CardHeader>
                              {departments.length > 0 && (
                                <CardContent className="pt-0">
                                  <div className="flex gap-1">
                                    {departments.map(dept => (
                                      <Badge key={dept.id} variant="outline" className="text-xs">
                                        {dept.icon}
                                      </Badge>
                                    ))}
                                  </div>
                                </CardContent>
                              )}
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Skill Detail Modal */}
      <Dialog open={!!selectedSkill} onOpenChange={() => setSelectedSkill(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="text-xl">{selectedSkill?.name}</span>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSelectedSkill(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
            <DialogDescription>
              {selectedSkill?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[60vh] mt-4">
            {loadingDetail ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedSkill?.path && (
                  <div className="text-sm text-muted-foreground">
                    Path: {selectedSkill.path}
                  </div>
                )}
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
                  {selectedSkill?.content}
                </pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}