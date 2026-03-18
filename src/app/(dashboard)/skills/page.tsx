"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SkillDetailModal } from '@/components/skills/skill-detail-modal'
import { 
  Search, 
  Download, 
  Power, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Filter,
  Plus,
  RefreshCw,
  Settings,
  Trash2
} from 'lucide-react'

interface Skill {
  name: string
  description: string
  category: string
  active: boolean
  location: string
  lastModified: string
  size: number
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categories, setCategories] = useState<string[]>([])
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [installLoading, setInstallLoading] = useState(false)

  useEffect(() => {
    loadSkills()
  }, [])

  const loadSkills = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/openclaw/skills')
      const data = await response.json()
      
      if (data.skills) {
        setSkills(data.skills)
        setCategories(['all', ...data.categories])
      }
    } catch (error) {
      console.error('Failed to load skills:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSkill = async (skillName: string) => {
    try {
      // Make API call to actually toggle skill
      const response = await fetch('/api/openclaw/skills/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillName })
      })

      if (response.ok) {
        setSkills(prev => prev.map(skill => 
          skill.name === skillName 
            ? { ...skill, active: !skill.active }
            : skill
        ))
      }
    } catch (error) {
      console.error('Failed to toggle skill:', error)
      // Revert UI change on error
      loadSkills()
    }
  }

  const bulkToggle = async (enable: boolean) => {
    setBulkLoading(true)
    try {
      const response = await fetch('/api/openclaw/skills/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: enable ? 'enable_all' : 'disable_all' })
      })

      if (response.ok) {
        setSkills(prev => prev.map(skill => ({ ...skill, active: enable })))
      }
    } catch (error) {
      console.error('Failed to bulk toggle skills:', error)
    } finally {
      setBulkLoading(false)
    }
  }

  const installSkill = async () => {
    setInstallLoading(true)
    try {
      // Show skill selection dialog (simplified for demo)
      const skillName = prompt('Enter skill name to install from clawhub:')
      if (!skillName) return

      const response = await fetch('/api/openclaw/skills/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillName })
      })

      const data = await response.json()
      
      if (response.ok) {
        // Refresh skills list
        await loadSkills()
        alert(`Skill "${skillName}" installed successfully!`)
      } else {
        alert(`Failed to install skill: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to install skill:', error)
      alert('Failed to install skill. Please try again.')
    } finally {
      setInstallLoading(false)
    }
  }

  const uninstallSkill = async (skillName: string) => {
    if (!confirm(`Are you sure you want to uninstall "${skillName}"?`)) return

    try {
      const response = await fetch('/api/openclaw/skills/uninstall', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillName })
      })

      if (response.ok) {
        setSkills(prev => prev.filter(skill => skill.name !== skillName))
        alert(`Skill "${skillName}" uninstalled successfully!`)
      }
    } catch (error) {
      console.error('Failed to uninstall skill:', error)
    }
  }

  const handleSkillClick = (skill: Skill) => {
    setSelectedSkill(skill)
    setShowDetail(true)
  }

  // Advanced filtering logic
  const filteredSkills = skills.filter(skill => {
    const matchesSearch = 
      skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory
    
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && skill.active) ||
      (statusFilter === 'inactive' && !skill.active)
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStatusIcon = (active: boolean) => {
    return active ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    )
  }

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  const activeSkillsCount = skills.filter(s => s.active).length
  const filteredActiveCount = filteredSkills.filter(s => s.active).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Skills Management</h1>
          <p className="text-muted-foreground">
            Manage agent skills and capabilities ({activeSkillsCount}/{skills.length} active, {filteredSkills.length} visible)
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadSkills}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            onClick={() => bulkToggle(false)}
            disabled={bulkLoading}
          >
            <Power className="h-4 w-4 mr-2" />
            {bulkLoading ? 'Processing...' : 'Disable All'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => bulkToggle(true)}
            disabled={bulkLoading}
          >
            <Power className="h-4 w-4 mr-2" />
            {bulkLoading ? 'Processing...' : 'Enable All'}
          </Button>
          <Button 
            onClick={installSkill}
            disabled={installLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            {installLoading ? 'Installing...' : 'Install Skill'}
          </Button>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search skills by name, description, or category..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Skills</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{activeSkillsCount}</div>
            <div className="text-sm text-muted-foreground">Active Skills</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{skills.length - activeSkillsCount}</div>
            <div className="text-sm text-muted-foreground">Inactive Skills</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{categories.length - 1}</div>
            <div className="text-sm text-muted-foreground">Categories</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{filteredSkills.length}</div>
            <div className="text-sm text-muted-foreground">Filtered Results</div>
          </CardContent>
        </Card>
      </div>

      {/* Skills Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-2/3"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredSkills.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No skills found</h3>
          <p className="text-muted-foreground">
            {searchTerm || selectedCategory !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters or search terms'
              : 'No skills are currently installed'
            }
          </p>
          {searchTerm || selectedCategory !== 'all' || statusFilter !== 'all' ? (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
                setStatusFilter('all')
              }}
            >
              Clear Filters
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSkills.map((skill) => (
            <Card 
              key={skill.name} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleSkillClick(skill)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {skill.name}
                      {getStatusIcon(skill.active)}
                    </CardTitle>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {skill.category}
                    </Badge>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Switch 
                      checked={skill.active}
                      onCheckedChange={() => toggleSkill(skill.name)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {skill.description}
                </p>
                
                {/* Metadata */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Size: {formatFileSize(skill.size)}</div>
                  <div>
                    Modified: {new Date(skill.lastModified).toLocaleDateString()}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSkillClick(skill)
                    }}
                  >
                    Details
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => e.stopPropagation()}
                    title="Download/Update"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => e.stopPropagation()}
                    title="Configure"
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      uninstallSkill(skill.name)
                    }}
                    title="Uninstall"
                    className="hover:text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <SkillDetailModal 
        skill={selectedSkill}
        open={showDetail}
        onOpenChange={setShowDetail}
        onToggle={toggleSkill}
      />
    </div>
  )
}