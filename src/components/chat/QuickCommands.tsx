"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { 
  Zap, 
  Plus, 
  FolderOpen, 
  Settings, 
  Activity, 
  HelpCircle,
  RefreshCw,
  BarChart3,
  Users,
  Clock,
  Save,
  Search,
  Archive,
  Star,
  ChevronDown,
  Languages,
  Sparkles
} from 'lucide-react'

interface QuickCommand {
  id: string
  arabicText: string
  englishText: string
  category: 'project' | 'system' | 'task' | 'help' | 'navigation'
  icon: React.ReactNode
  shortcut?: string
  description: string
  popularity: number
  isPremium?: boolean
}

interface QuickCommandsProps {
  onCommandSelect: (command: QuickCommand) => void
  className?: string
  variant?: 'compact' | 'full' | 'grid'
}

const quickCommands: QuickCommand[] = [
  // Project Commands
  {
    id: 'create-project',
    arabicText: 'انشئ مشروع جديد',
    englishText: 'Create a new project',
    category: 'project',
    icon: <Plus className="h-3 w-3" />,
    shortcut: 'Ctrl+N',
    description: 'Start a new project with initial setup',
    popularity: 95
  },
  {
    id: 'show-projects',
    arabicText: 'اظهر جميع المشاريع',
    englishText: 'Show all projects',
    category: 'project',
    icon: <FolderOpen className="h-3 w-3" />,
    shortcut: 'Ctrl+P',
    description: 'Display project list with status',
    popularity: 87
  },
  {
    id: 'archive-project',
    arabicText: 'ارشف المشروع الحالي',
    englishText: 'Archive current project',
    category: 'project',
    icon: <Archive className="h-3 w-3" />,
    description: 'Move project to archived status',
    popularity: 45
  },

  // Task Commands
  {
    id: 'create-task',
    arabicText: 'اضف مهمة جديدة',
    englishText: 'Add a new task',
    category: 'task',
    icon: <Plus className="h-3 w-3" />,
    shortcut: 'Ctrl+T',
    description: 'Create task in current project',
    popularity: 92
  },
  {
    id: 'show-tasks',
    arabicText: 'اظهر المهام المعلقة',
    englishText: 'Show pending tasks',
    category: 'task',
    icon: <Clock className="h-3 w-3" />,
    description: 'List all incomplete tasks',
    popularity: 78
  },
  {
    id: 'complete-task',
    arabicText: 'اكمل المهمة الحالية',
    englishText: 'Complete current task',
    category: 'task',
    icon: <Save className="h-3 w-3" />,
    description: 'Mark task as completed',
    popularity: 85
  },

  // System Commands
  {
    id: 'system-status',
    arabicText: 'حالة النظام',
    englishText: 'System status',
    category: 'system',
    icon: <Activity className="h-3 w-3" />,
    shortcut: 'Ctrl+S',
    description: 'Check system health and metrics',
    popularity: 65
  },
  {
    id: 'open-settings',
    arabicText: 'فتح الاعدادات',
    englishText: 'Open settings',
    category: 'system',
    icon: <Settings className="h-3 w-3" />,
    description: 'Access system configuration',
    popularity: 58
  },
  {
    id: 'generate-report',
    arabicText: 'انشئ تقرير',
    englishText: 'Generate report',
    category: 'system',
    icon: <BarChart3 className="h-3 w-3" />,
    description: 'Create progress report',
    popularity: 72,
    isPremium: true
  },

  // Navigation Commands
  {
    id: 'go-dashboard',
    arabicText: 'اذهب للوحة التحكم',
    englishText: 'Go to dashboard',
    category: 'navigation',
    icon: <BarChart3 className="h-3 w-3" />,
    description: 'Navigate to main dashboard',
    popularity: 88
  },
  {
    id: 'search-everything',
    arabicText: 'ابحث في كل شيء',
    englishText: 'Search everything',
    category: 'navigation',
    icon: <Search className="h-3 w-3" />,
    shortcut: 'Ctrl+K',
    description: 'Global search across platform',
    popularity: 76
  },
  {
    id: 'show-team',
    arabicText: 'اظهر الفريق',
    englishText: 'Show team members',
    category: 'navigation',
    icon: <Users className="h-3 w-3" />,
    description: 'View team and permissions',
    popularity: 54
  },

  // Help Commands
  {
    id: 'help',
    arabicText: 'مساعدة',
    englishText: 'Help',
    category: 'help',
    icon: <HelpCircle className="h-3 w-3" />,
    shortcut: 'F1',
    description: 'Get help and documentation',
    popularity: 83
  },
  {
    id: 'show-shortcuts',
    arabicText: 'اظهر الاختصارات',
    englishText: 'Show keyboard shortcuts',
    category: 'help',
    icon: <Zap className="h-3 w-3" />,
    description: 'Display all available shortcuts',
    popularity: 41
  }
]

export function QuickCommands({ 
  onCommandSelect, 
  className = "", 
  variant = 'full' 
}: QuickCommandsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = [
    { id: 'all', label: 'All', icon: <Sparkles className="h-3 w-3" /> },
    { id: 'project', label: 'Project', icon: <FolderOpen className="h-3 w-3" /> },
    { id: 'task', label: 'Tasks', icon: <Clock className="h-3 w-3" /> },
    { id: 'system', label: 'System', icon: <Activity className="h-3 w-3" /> },
    { id: 'navigation', label: 'Navigation', icon: <Search className="h-3 w-3" /> },
    { id: 'help', label: 'Help', icon: <HelpCircle className="h-3 w-3" /> }
  ]

  const filteredCommands = quickCommands.filter(cmd => 
    selectedCategory === 'all' || cmd.category === selectedCategory
  ).sort((a, b) => b.popularity - a.popularity)

  const popularCommands = quickCommands
    .filter(cmd => cmd.popularity >= 80)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 6)

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'project': return 'text-blue-600 bg-blue-100 hover:bg-blue-200'
      case 'task': return 'text-green-600 bg-green-100 hover:bg-green-200'
      case 'system': return 'text-red-600 bg-red-100 hover:bg-red-200'
      case 'navigation': return 'text-purple-600 bg-purple-100 hover:bg-purple-200'
      case 'help': return 'text-orange-600 bg-orange-100 hover:bg-orange-200'
      default: return 'text-gray-600 bg-gray-100 hover:bg-gray-200'
    }
  }

  if (variant === 'compact') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center space-x-2">
          <Zap className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">Quick Commands</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {popularCommands.slice(0, 4).map((command) => (
            <TooltipProvider key={command.id}>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCommandSelect(command)}
                    className="text-xs h-7 px-2"
                  >
                    {command.icon}
                    <span className="ml-1 hidden sm:inline font-arabic">
                      {command.arabicText}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <div className="text-center">
                    <div className="font-arabic text-right mb-1">{command.arabicText}</div>
                    <div className="text-xs">{command.englishText}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 px-2">
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {quickCommands.map((command) => (
                <DropdownMenuItem 
                  key={command.id}
                  onClick={() => onCommandSelect(command)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    {command.icon}
                    <span className="font-arabic text-right">{command.arabicText}</span>
                  </div>
                  {command.shortcut && (
                    <Badge variant="outline" className="text-xs">
                      {command.shortcut}
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
  }

  if (variant === 'grid') {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Languages className="h-5 w-5 text-amber-500" />
            <span>Quick Commands (أوامر سريعة)</span>
          </CardTitle>
          <CardDescription>
            Click any command to execute it instantly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {popularCommands.map((command) => (
              <TooltipProvider key={command.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => onCommandSelect(command)}
                      className="h-auto p-3 flex flex-col items-center space-y-2 hover:shadow-md transition-shadow"
                    >
                      <div className={`p-2 rounded-lg ${getCategoryColor(command.category)}`}>
                        {command.icon}
                      </div>
                      <div className="text-center">
                        <div className="font-arabic text-xs text-right" dir="rtl">
                          {command.arabicText}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {command.englishText}
                        </div>
                      </div>
                      {command.isPremium && (
                        <Badge className="bg-amber-500 text-white text-xs">
                          <Star className="h-2 w-2 mr-1" />
                          Pro
                        </Badge>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center max-w-48">
                      <div className="font-medium">{command.description}</div>
                      {command.shortcut && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Shortcut: {command.shortcut}
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Full variant (default)
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Languages className="h-5 w-5 text-amber-500" />
          <span>Quick Commands (أوامر سريعة)</span>
        </CardTitle>
        <CardDescription>
          Pre-built Arabic commands for common actions
        </CardDescription>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-1 pt-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="text-xs"
            >
              {category.icon}
              <span className="ml-1">{category.label}</span>
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {filteredCommands.map((command) => (
            <TooltipProvider key={command.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => onCommandSelect(command)}
                    className="justify-start text-left h-auto p-3 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center space-x-2 w-full">
                      <div className={`p-1.5 rounded ${getCategoryColor(command.category)}`}>
                        {command.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-arabic text-sm text-right" dir="rtl">
                          {command.arabicText}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {command.englishText}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <Badge variant="outline" className="text-xs">
                            {Math.round(command.popularity)}%
                          </Badge>
                          {command.shortcut && (
                            <span className="text-xs text-muted-foreground">
                              {command.shortcut}
                            </span>
                          )}
                          {command.isPremium && (
                            <Badge className="bg-amber-500 text-white text-xs">
                              <Star className="h-2 w-2 mr-1" />
                              Pro
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-64">
                  <div>
                    <div className="font-medium">{command.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Category: {command.category} • Popularity: {command.popularity}%
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>

        {filteredCommands.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Languages className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No commands found in this category</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}