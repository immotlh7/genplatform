"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Plus, 
  Bug, 
  Rocket, 
  Settings, 
  Folder,
  CheckCircle,
  Code,
  Database,
  Globe,
  Zap,
  Languages,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface QuickCommand {
  id: string
  label: string
  arabicText: string
  englishText: string
  description: string
  icon: React.ReactNode
  category: 'project' | 'development' | 'system' | 'general'
  confidence: number
  shortcut?: string
}

interface QuickCommandsProps {
  onCommandSelect: (command: QuickCommand) => void
  selectedProjectId?: string
  userPermissions?: {
    canCreateProjects?: boolean
    canManageTasks?: boolean
    canExecuteCommands?: boolean
    canUseCommander?: boolean
  }
  className?: string
}

export function QuickCommands({
  onCommandSelect,
  selectedProjectId,
  userPermissions = {},
  className = ''
}: QuickCommandsProps) {
  const { toast } = useToast()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Pre-defined quick commands with Arabic and English equivalents
  const quickCommands: QuickCommand[] = [
    // Project Management
    {
      id: 'create-project',
      label: 'Create Project',
      arabicText: 'أنشئ مشروع جديد',
      englishText: 'Create new project',
      description: 'Start a new project with initial setup',
      icon: <Plus className="h-4 w-4" />,
      category: 'project',
      confidence: 0.95,
      shortcut: 'Ctrl+N'
    },
    {
      id: 'add-task',
      label: 'Add Task',
      arabicText: 'أضف مهمة جديدة للمشروع الحالي',
      englishText: 'Add new task to current project',
      description: 'Create a new task in the selected project',
      icon: <CheckCircle className="h-4 w-4" />,
      category: 'project',
      confidence: 0.92
    },
    {
      id: 'open-project',
      label: 'Open Project',
      arabicText: 'افتح المشروع',
      englishText: 'Open project',
      description: 'Navigate to project workspace',
      icon: <Folder className="h-4 w-4" />,
      category: 'project',
      confidence: 0.89
    },

    // Development Commands
    {
      id: 'fix-bug',
      label: 'Fix Bug',
      arabicText: 'إصلاح الخطأ في الكود',
      englishText: 'Fix bug in code',
      description: 'Report and track bug resolution',
      icon: <Bug className="h-4 w-4" />,
      category: 'development',
      confidence: 0.91
    },
    {
      id: 'deploy-app',
      label: 'Deploy App',
      arabicText: 'انشر التطبيق إلى الإنتاج',
      englishText: 'Deploy application to production',
      description: 'Start deployment workflow',
      icon: <Rocket className="h-4 w-4" />,
      category: 'development',
      confidence: 0.94
    },
    {
      id: 'run-tests',
      label: 'Run Tests',
      arabicText: 'شغل الاختبارات',
      englishText: 'Run automated tests',
      description: 'Execute test suite',
      icon: <Code className="h-4 w-4" />,
      category: 'development',
      confidence: 0.88
    },
    {
      id: 'build-project',
      label: 'Build Project',
      arabicText: 'ابني المشروع',
      englishText: 'Build project',
      description: 'Compile and build the application',
      icon: <Settings className="h-4 w-4" />,
      category: 'development',
      confidence: 0.93
    },

    // System Commands
    {
      id: 'backup-data',
      label: 'Backup Data',
      arabicText: 'انشئ نسخة احتياطية من البيانات',
      englishText: 'Create data backup',
      description: 'Backup database and files',
      icon: <Database className="h-4 w-4" />,
      category: 'system',
      confidence: 0.87
    },
    {
      id: 'check-status',
      label: 'Check Status',
      arabicText: 'تحقق من حالة النظام',
      englishText: 'Check system status',
      description: 'View system health and metrics',
      icon: <RefreshCw className="h-4 w-4" />,
      category: 'system',
      confidence: 0.85
    },
    {
      id: 'update-system',
      label: 'Update System',
      arabicText: 'حدث النظام',
      englishText: 'Update system',
      description: 'Apply system updates and patches',
      icon: <Zap className="h-4 w-4" />,
      category: 'system',
      confidence: 0.90
    },

    // General Commands
    {
      id: 'show-help',
      label: 'Show Help',
      arabicText: 'اعرض المساعدة',
      englishText: 'Show help documentation',
      description: 'Display help and documentation',
      icon: <Globe className="h-4 w-4" />,
      category: 'general',
      confidence: 0.96
    },
    {
      id: 'generate-report',
      label: 'Generate Report',
      arabicText: 'أنشئ تقرير',
      englishText: 'Generate project report',
      description: 'Create comprehensive project report',
      icon: <Globe className="h-4 w-4" />,
      category: 'general',
      confidence: 0.89
    }
  ]

  const categories = [
    { id: 'all', label: 'All Commands', icon: <Zap className="h-3 w-3" /> },
    { id: 'project', label: 'Project', icon: <Folder className="h-3 w-3" /> },
    { id: 'development', label: 'Development', icon: <Code className="h-3 w-3" /> },
    { id: 'system', label: 'System', icon: <Settings className="h-3 w-3" /> },
    { id: 'general', label: 'General', icon: <Globe className="h-3 w-3" /> }
  ]

  // Filter commands based on category and permissions
  const filteredCommands = quickCommands.filter(command => {
    // Category filter
    if (selectedCategory !== 'all' && command.category !== selectedCategory) {
      return false
    }

    // Permission filter
    if (command.category === 'project' && !userPermissions.canCreateProjects) {
      return false
    }

    if (command.category === 'development' && !userPermissions.canExecuteCommands) {
      return false
    }

    if (command.category === 'system' && !userPermissions.canExecuteCommands) {
      return false
    }

    return true
  })

  const handleCommandClick = (command: QuickCommand) => {
    if (!userPermissions.canUseCommander) {
      toast({
        title: "Permission Required",
        description: "You need Commander access to use quick commands.",
        variant: "destructive",
      })
      return
    }

    // Special handling for project-specific commands
    if (command.id === 'add-task' && !selectedProjectId) {
      toast({
        title: "No Project Selected",
        description: "Please select a project first to add tasks.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Command Selected",
      description: `Using command: ${command.label}`,
    })

    onCommandSelect(command)
  }

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.id === category)
    return cat?.icon || <Zap className="h-3 w-3" />
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'project':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'development':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'system':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'general':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Languages className="h-5 w-5 text-blue-600" />
            <span>Quick Commands</span>
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
              Arabic → English
            </Badge>
          </div>
          {!userPermissions.canUseCommander && (
            <Badge variant="outline" className="text-xs text-red-600 border-red-200">
              Access Required
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center space-x-1"
            >
              {category.icon}
              <span>{category.label}</span>
            </Button>
          ))}
        </div>

        {/* Commands Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredCommands.map((command) => (
            <div
              key={command.id}
              className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                userPermissions.canUseCommander 
                  ? 'hover:border-blue-300 hover:bg-blue-50/50' 
                  : 'opacity-60 cursor-not-allowed'
              }`}
              onClick={() => handleCommandClick(command)}
            >
              <div className="space-y-2">
                {/* Command Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 bg-blue-100 rounded">
                      {command.icon}
                    </div>
                    <span className="font-medium text-sm">{command.label}</span>
                  </div>
                  <Badge className={`text-xs ${getCategoryColor(command.category)}`}>
                    {command.category}
                  </Badge>
                </div>

                {/* Arabic Text */}
                <div className="text-xs bg-orange-50 border border-orange-200 rounded p-2 text-right" dir="rtl">
                  {command.arabicText}
                </div>

                {/* English Translation */}
                <div className="text-xs bg-blue-50 border border-blue-200 rounded p-2">
                  {command.englishText}
                </div>

                {/* Command Info */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{command.description}</span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(command.confidence * 100)}%
                  </Badge>
                </div>

                {/* Shortcut */}
                {command.shortcut && (
                  <div className="text-xs text-muted-foreground">
                    Shortcut: <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">{command.shortcut}</kbd>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* No Commands Message */}
        {filteredCommands.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Languages className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No commands available for the selected category.</p>
            <p className="text-xs mt-1">Try selecting a different category or check your permissions.</p>
          </div>
        )}

        {/* Usage Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="font-medium text-blue-900 text-sm mb-2">💡 Quick Tips:</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Click any command to use it in your chat</li>
            <li>• Commands are automatically translated from Arabic</li>
            <li>• Use keyboard shortcuts when available</li>
            <li>• Project commands require a selected project</li>
            <li>• Higher confidence scores = better translations</li>
          </ul>
        </div>

        {/* Permission Notice */}
        {!userPermissions.canUseCommander && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Commander Access Required</p>
                <p className="text-xs text-red-700 mt-1">
                  You need MANAGER level access or higher to use Commander quick commands. 
                  Contact your administrator for access.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Project Context Notice */}
        {userPermissions.canUseCommander && !selectedProjectId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Folder className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">No Project Selected</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Select a project to enable project-specific commands like "Add Task".
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default QuickCommands