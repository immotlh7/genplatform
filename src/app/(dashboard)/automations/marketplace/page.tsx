'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Store, 
  Download, 
  Upload, 
  Star, 
  Heart, 
  Eye, 
  Search,
  Filter,
  TrendingUp,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  Share2,
  BookOpen,
  Code,
  Zap,
  Target,
  Layers,
  Globe,
  Plus,
  ExternalLink,
  ThumbsUp,
  MessageSquare,
  Flag
} from 'lucide-react'

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  author: {
    id: string
    name: string
    avatar?: string
    verified: boolean
  }
  template_data: any
  usage_stats: {
    downloads: number
    installs: number
    likes: number
    views: number
    rating: number
    rating_count: number
  }
  pricing: {
    type: 'free' | 'paid' | 'freemium'
    price?: number
  }
  compatibility: {
    min_version: string
    max_version?: string
    dependencies: string[]
  }
  screenshots: string[]
  demo_url?: string
  documentation_url?: string
  source_url?: string
  license: string
  created_at: string
  updated_at: string
  featured: boolean
  verified: boolean
  status: 'published' | 'draft' | 'pending_review' | 'rejected'
}

interface Review {
  id: string
  template_id: string
  user: {
    id: string
    name: string
    avatar?: string
  }
  rating: number
  title: string
  content: string
  helpful_votes: number
  created_at: string
  updated_at: string
}

interface MarketplaceStats {
  total_templates: number
  total_downloads: number
  featured_templates: number
  new_this_week: number
  top_categories: { category: string; count: number }[]
}

export default function WorkflowMarketplace() {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<MarketplaceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('featured')
  const [isUploading, setIsUploading] = useState(false)

  // New template upload form
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: '',
    tags: '',
    license: 'MIT',
    pricing_type: 'free',
    price: 0
  })

  const categories = [
    'All',
    'Data Processing',
    'API Integration', 
    'Notifications',
    'Development',
    'DevOps',
    'Marketing',
    'Analytics',
    'Security',
    'Productivity',
    'AI/ML'
  ]

  useEffect(() => {
    fetchMarketplaceData()
  }, [])

  const fetchMarketplaceData = async () => {
    try {
      // Fetch templates
      const templatesResponse = await fetch('/api/workflows/marketplace/templates')
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json()
        setTemplates(templatesData.templates || [])
      } else {
        setTemplates(generateMockTemplates())
      }

      // Fetch marketplace stats
      const statsResponse = await fetch('/api/workflows/marketplace/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats)
      } else {
        setStats(generateMockStats())
      }
    } catch (error) {
      console.error('Error fetching marketplace data:', error)
      setTemplates(generateMockTemplates())
      setStats(generateMockStats())
    }
    setLoading(false)
  }

  const generateMockTemplates = (): WorkflowTemplate[] => {
    return [
      {
        id: 'template-1',
        name: 'GitHub Issue Automation',
        description: 'Automatically create, assign, and track GitHub issues from various triggers like user feedback, monitoring alerts, or manual inputs.',
        category: 'Development',
        tags: ['github', 'automation', 'issue-tracking', 'devops'],
        author: {
          id: 'user-1',
          name: 'Sarah Chen',
          avatar: '/avatars/sarah.jpg',
          verified: true
        },
        template_data: {
          steps: [],
          triggers: [],
          config: {}
        },
        usage_stats: {
          downloads: 2847,
          installs: 1923,
          likes: 456,
          views: 12543,
          rating: 4.8,
          rating_count: 187
        },
        pricing: {
          type: 'free'
        },
        compatibility: {
          min_version: '1.0.0',
          dependencies: ['github-api']
        },
        screenshots: ['/screenshots/github-automation-1.jpg'],
        demo_url: 'https://demo.example.com/github-automation',
        documentation_url: 'https://docs.example.com/github-automation',
        license: 'MIT',
        created_at: '2026-02-15T10:00:00Z',
        updated_at: '2026-03-10T14:30:00Z',
        featured: true,
        verified: true,
        status: 'published'
      },
      {
        id: 'template-2',
        name: 'Slack Notification Pipeline',
        description: 'Send intelligent notifications to Slack channels with smart routing, threading, and escalation based on priority levels.',
        category: 'Notifications',
        tags: ['slack', 'notifications', 'alerts', 'communication'],
        author: {
          id: 'user-2',
          name: 'Alex Rodriguez',
          avatar: '/avatars/alex.jpg',
          verified: false
        },
        template_data: {
          steps: [],
          triggers: [],
          config: {}
        },
        usage_stats: {
          downloads: 1567,
          installs: 1234,
          likes: 298,
          views: 8765,
          rating: 4.5,
          rating_count: 89
        },
        pricing: {
          type: 'freemium'
        },
        compatibility: {
          min_version: '1.0.0',
          dependencies: ['slack-api']
        },
        screenshots: ['/screenshots/slack-notifications-1.jpg'],
        license: 'Apache-2.0',
        created_at: '2026-03-01T16:20:00Z',
        updated_at: '2026-03-15T09:45:00Z',
        featured: false,
        verified: true,
        status: 'published'
      },
      {
        id: 'template-3',
        name: 'Data Sync & Transformation',
        description: 'Powerful ETL pipeline for syncing data between multiple sources with advanced transformation capabilities.',
        category: 'Data Processing',
        tags: ['etl', 'data-sync', 'transformation', 'analytics'],
        author: {
          id: 'user-3',
          name: 'DataFlow Inc',
          verified: true
        },
        template_data: {
          steps: [],
          triggers: [],
          config: {}
        },
        usage_stats: {
          downloads: 987,
          installs: 654,
          likes: 123,
          views: 4321,
          rating: 4.2,
          rating_count: 45
        },
        pricing: {
          type: 'paid',
          price: 29.99
        },
        compatibility: {
          min_version: '1.1.0',
          dependencies: ['data-connectors', 'transform-engine']
        },
        screenshots: ['/screenshots/data-sync-1.jpg'],
        license: 'Commercial',
        created_at: '2026-01-20T12:00:00Z',
        updated_at: '2026-03-08T11:15:00Z',
        featured: true,
        verified: true,
        status: 'published'
      }
    ]
  }

  const generateMockStats = (): MarketplaceStats => {
    return {
      total_templates: 1247,
      total_downloads: 45632,
      featured_templates: 23,
      new_this_week: 18,
      top_categories: [
        { category: 'Development', count: 287 },
        { category: 'API Integration', count: 234 },
        { category: 'Notifications', count: 198 },
        { category: 'Data Processing', count: 156 },
        { category: 'DevOps', count: 142 }
      ]
    }
  }

  const fetchTemplateReviews = async (templateId: string) => {
    try {
      const response = await fetch(`/api/workflows/marketplace/templates/${templateId}/reviews`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews || [])
      } else {
        setReviews(generateMockReviews(templateId))
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
      setReviews(generateMockReviews(templateId))
    }
  }

  const generateMockReviews = (templateId: string): Review[] => {
    return [
      {
        id: 'review-1',
        template_id: templateId,
        user: {
          id: 'user-4',
          name: 'John Doe',
          avatar: '/avatars/john.jpg'
        },
        rating: 5,
        title: 'Excellent workflow template!',
        content: 'This template saved me hours of setup time. Works perfectly out of the box and the documentation is great.',
        helpful_votes: 23,
        created_at: '2026-03-15T14:20:00Z',
        updated_at: '2026-03-15T14:20:00Z'
      },
      {
        id: 'review-2',
        template_id: templateId,
        user: {
          id: 'user-5',
          name: 'Jane Smith'
        },
        rating: 4,
        title: 'Good but needs improvement',
        content: 'The template works well but could use more customization options for advanced users.',
        helpful_votes: 12,
        created_at: '2026-03-12T10:30:00Z',
        updated_at: '2026-03-12T10:30:00Z'
      }
    ]
  }

  const handleTemplateSelect = (template: WorkflowTemplate) => {
    setSelectedTemplate(template)
    fetchTemplateReviews(template.id)
  }

  const installTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/workflows/marketplace/install/${templateId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        // Update install count
        setTemplates(prev => prev.map(template => 
          template.id === templateId 
            ? { ...template, usage_stats: { ...template.usage_stats, installs: template.usage_stats.installs + 1 }}
            : template
        ))
        
        // Show success message
        alert('Template installed successfully!')
      }
    } catch (error) {
      console.error('Error installing template:', error)
      alert('Failed to install template')
    }
  }

  const likeTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/workflows/marketplace/like/${templateId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        setTemplates(prev => prev.map(template => 
          template.id === templateId 
            ? { ...template, usage_stats: { ...template.usage_stats, likes: template.usage_stats.likes + 1 }}
            : template
        ))
      }
    } catch (error) {
      console.error('Error liking template:', error)
    }
  }

  const uploadTemplate = async () => {
    setIsUploading(true)
    try {
      const response = await fetch('/api/workflows/marketplace/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTemplate,
          tags: newTemplate.tags.split(',').map(tag => tag.trim()),
          template_data: {
            steps: [],
            triggers: [],
            config: {}
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        setTemplates(prev => [data.template, ...prev])
        setIsUploading(false)
        setNewTemplate({
          name: '',
          description: '',
          category: '',
          tags: '',
          license: 'MIT',
          pricing_type: 'free',
          price: 0
        })
        alert('Template uploaded successfully! It will be reviewed before being published.')
      }
    } catch (error) {
      console.error('Error uploading template:', error)
      setIsUploading(false)
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || template.category.toLowerCase() === selectedCategory.toLowerCase()
    
    return matchesSearch && matchesCategory
  })

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case 'featured':
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.usage_stats.downloads - a.usage_stats.downloads
      case 'popular':
        return b.usage_stats.downloads - a.usage_stats.downloads
      case 'rating':
        return b.usage_stats.rating - a.usage_stats.rating
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'updated':
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      default:
        return 0
    }
  })

  const renderStarRating = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} ${
            i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      )
    }
    return <div className="flex items-center gap-1">{stars}</div>
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <Store className="h-8 w-8 animate-pulse" />
          <span className="ml-2">Loading marketplace...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Store className="h-8 w-8" />
            Workflow Marketplace
          </h1>
          <p className="text-gray-600 mt-1">Discover, share, and install community-created workflow templates</p>
        </div>
        <Button onClick={() => setIsUploading(true)} className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload Template
        </Button>
      </div>

      {/* Marketplace Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_templates.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Available in marketplace</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Downloads</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_downloads.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total installs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Featured</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.featured_templates}</div>
              <p className="text-xs text-muted-foreground">Curated templates</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New This Week</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.new_this_week}</div>
              <p className="text-xs text-muted-foreground">Recently added</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search templates, tags, or authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            {categories.map(category => (
              <option key={category} value={category.toLowerCase()}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="featured">Featured</option>
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest</option>
            <option value="updated">Recently Updated</option>
          </select>
        </div>
      </div>

      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList>
          <TabsTrigger value="browse">Browse Templates</TabsTrigger>
          <TabsTrigger value="my-templates">My Templates</TabsTrigger>
          <TabsTrigger value="installed">Installed</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                        {template.name}
                        {template.featured && (
                          <Badge className="ml-2 bg-yellow-100 text-yellow-800">
                            Featured
                          </Badge>
                        )}
                        {template.verified && (
                          <CheckCircle className="ml-1 h-4 w-4 text-green-600 inline" />
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={template.author.avatar} />
                          <AvatarFallback>{template.author.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-600">
                          {template.author.name}
                          {template.author.verified && (
                            <CheckCircle className="ml-1 h-3 w-3 text-blue-600 inline" />
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {renderStarRating(template.usage_stats.rating)}
                      <div className="text-xs text-gray-500">
                        ({template.usage_stats.rating_count})
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <CardDescription className="text-sm mb-4 line-clamp-3">
                    {template.description}
                  </CardDescription>

                  <div className="flex flex-wrap gap-1 mb-4">
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                    {template.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{template.tags.length - 2}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        {template.usage_stats.downloads.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {template.usage_stats.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {template.usage_stats.views}
                      </span>
                    </div>
                    {template.pricing.type === 'paid' && (
                      <span className="font-semibold text-green-600">
                        ${template.pricing.price}
                      </span>
                    )}
                    {template.pricing.type === 'free' && (
                      <span className="text-green-600 font-semibold">Free</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => installTemplate(template.id)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Install
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => likeTemplate(template.id)}
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {sortedTemplates.length === 0 && (
            <Alert>
              <Search className="h-4 w-4" />
              <AlertDescription>
                No templates found matching your search criteria. Try adjusting your filters or search terms.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="my-templates">
          <Card>
            <CardHeader>
              <CardTitle>My Published Templates</CardTitle>
              <CardDescription>
                Templates you've created and shared with the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">No templates published yet. Upload your first template to get started!</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="installed">
          <Card>
            <CardHeader>
              <CardTitle>Installed Templates</CardTitle>
              <CardDescription>
                Templates you've installed and can use in your workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">No templates installed yet. Browse the marketplace to find useful templates!</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Detail Modal/Sidebar */}
      {selectedTemplate && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-50 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{selectedTemplate.name}</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(null)}>
                ×
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedTemplate.author.avatar} />
                  <AvatarFallback>{selectedTemplate.author.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold flex items-center gap-1">
                    {selectedTemplate.author.name}
                    {selectedTemplate.author.verified && (
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(selectedTemplate.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div>
                {renderStarRating(selectedTemplate.usage_stats.rating, 'lg')}
                <div className="text-sm text-gray-600 mt-1">
                  {selectedTemplate.usage_stats.rating_count} reviews
                </div>
              </div>

              <p className="text-gray-700">{selectedTemplate.description}</p>

              <div className="flex flex-wrap gap-2">
                {selectedTemplate.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Downloads:</span>
                  <span>{selectedTemplate.usage_stats.downloads.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>License:</span>
                  <span>{selectedTemplate.license}</span>
                </div>
                <div className="flex justify-between">
                  <span>Category:</span>
                  <span>{selectedTemplate.category}</span>
                </div>
                <div className="flex justify-between">
                  <span>Updated:</span>
                  <span>{new Date(selectedTemplate.updated_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => installTemplate(selectedTemplate.id)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Install
                </Button>
                <Button variant="outline" onClick={() => likeTemplate(selectedTemplate.id)}>
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="outline">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              {selectedTemplate.demo_url && (
                <a href={selectedTemplate.demo_url} target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Demo
                  </Button>
                </a>
              )}

              <div>
                <h3 className="font-semibold mb-2">Reviews</h3>
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={review.user.avatar} />
                            <AvatarFallback>{review.user.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{review.user.name}</span>
                        </div>
                        {renderStarRating(review.rating)}
                      </div>
                      <h4 className="font-medium text-sm">{review.title}</h4>
                      <p className="text-sm text-gray-600">{review.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button size="sm" variant="ghost">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          {review.helpful_votes}
                        </Button>
                        <span className="text-xs text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Template Modal */}
      {isUploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Upload New Template</CardTitle>
              <CardDescription>
                Share your workflow template with the community
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., GitHub Integration"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Select Category</option>
                    {categories.slice(1).map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what your template does and how to use it..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={newTemplate.tags}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="e.g., github, automation, api, integration"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="license">License</Label>
                  <select
                    id="license"
                    value={newTemplate.license}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, license: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="MIT">MIT</option>
                    <option value="Apache-2.0">Apache 2.0</option>
                    <option value="GPL-3.0">GPL 3.0</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="pricing">Pricing</Label>
                  <select
                    id="pricing"
                    value={newTemplate.pricing_type}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, pricing_type: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                    <option value="freemium">Freemium</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={uploadTemplate} disabled={!newTemplate.name || !newTemplate.category}>
                  <Upload className="h-4 w-4 mr-1" />
                  Upload Template
                </Button>
                <Button variant="outline" onClick={() => setIsUploading(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}