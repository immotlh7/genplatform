"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { SkillDetailModal } from '@/components/skills/skill-detail-modal'
import { 
  Search, 
  Download, 
  Power, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Filter,
  Plus
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
  const [categories, setCategories] = useState<string[]>([])
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    loadSkills()
  }, [])

  const loadSkills = async () => {
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
    setSkills(prev => prev.map(skill => 
      skill.name === skillName 
        ? { ...skill, active: !skill.active }
        : skill
    ))
  }

  const bulkToggle = async (enable: boolean) => {
    setSkills(prev => prev.map(skill => ({ ...skill, active: enable })))
  }

  const handleSkillClick = (skill: Skill) => {
    setSelectedSkill(skill)
    setShowDetail(true)
  }

  const installSkill = async () => {
    // Demo - would integrate with clawhub install
    console.log('Installing new skill from clawhub')
  }

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         skill.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory
    return matchesSearch && matchesCategory
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Skills</h1>
          <p className="text-muted-foreground">
            Manage agent skills and capabilities ({activeSkillsCount}/{skills.length} active)
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => bulkToggle(false)}>
            <Power className="h-4 w-4 mr-2" />
            Disable All
          </Button>
          <Button variant="outline" onClick={() => bulkToggle(true)}>
            <Power className="h-4 w-4 mr-2" />
            Enable All
          </Button>
          <Button onClick={installSkill}>
            <Plus className="h-4 w-4 mr-2" />
            Install Skill
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search skills..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select 
            className="px-3 py-2 border rounded-md bg-background"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
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
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your filters'
              : 'No skills are currently installed'
            }
          </p>
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
                  <Switch 
                    checked={skill.active}
                    onCheckedChange={(e) => {
                      e.stopPropagation()
                      toggleSkill(skill.name)
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
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
                    View Details
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="h-3 w-3" />
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