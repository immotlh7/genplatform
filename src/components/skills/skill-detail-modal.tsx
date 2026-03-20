"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Settings, 
  Activity,
  Download,
  Trash2,
  ExternalLink
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

interface SkillDetailModalProps {
  skill: Skill | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onToggle: (skillName: string) => void
}

export function SkillDetailModal({ skill, open, onOpenChange, onToggle }: SkillDetailModalProps) {
  const [skillContent, setSkillContent] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (skill && open) {
      loadSkillContent()
    }
  }, [skill, open])

  const loadSkillContent = async () => {
    if (!skill) return
    
    setLoading(true)
    try {
      // Demo skill content - in production would read from skill's SKILL.md
      const demoContent = `# ${skill.name}

${skill.description}

## Description

This skill provides advanced capabilities for ${skill.category.toLowerCase()} operations within the OpenClaw framework.

## Features

- Advanced automation capabilities
- Integration with external APIs
- Robust error handling
- Configurable parameters

## Usage

\`\`\`bash
openclaw skill run ${skill.name}
\`\`\`

## Configuration

The skill accepts the following configuration parameters:

- \`enabled\`: Boolean to enable/disable the skill
- \`timeout\`: Timeout in seconds for operations
- \`retries\`: Number of retry attempts

## Examples

### Basic Usage

\`\`\`javascript
const result = await skill.execute({
  input: "example input",
  options: {
    timeout: 30,
    retries: 3
  }
});
\`\`\`

### Advanced Configuration

\`\`\`yaml
skill:
  name: ${skill.name}
  enabled: true
  config:
    timeout: 60
    retries: 5
    verbose: true
\`\`\`

## Dependencies

- Node.js >= 16.0.0
- OpenClaw Framework
- Additional packages as needed

## Troubleshooting

Common issues and solutions:

1. **Skill not responding**
   - Check if the skill is enabled
   - Verify configuration parameters
   - Check system logs for errors

2. **Performance issues**
   - Increase timeout values
   - Reduce retry attempts
   - Check system resources

## Support

For issues and questions, refer to the OpenClaw documentation or community forums.`

      setSkillContent(demoContent)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load skill content:', error);
      }
      setSkillContent('Failed to load skill documentation.')
    } finally {
      setLoading(false)
    }
  }

  if (!skill) return null

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DialogTitle className="text-2xl">{skill.name}</DialogTitle>
              <Badge variant="outline">{skill.category}</Badge>
              <Badge variant={skill.active ? "default" : "destructive"}>
                {skill.active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                checked={skill.active}
                onCheckedChange={() => onToggle(skill.name)}
              />
            </div>
          </div>
          <p className="text-muted-foreground">{skill.description}</p>
        </DialogHeader>

        <Tabs defaultValue="documentation" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="documentation" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-[500px] w-full rounded-md border p-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-muted-foreground">Loading documentation...</div>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap text-sm">
                  {skillContent}
                </pre>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium mb-2">Location</div>
                <p className="text-sm text-muted-foreground break-all">
                  {skill.location}
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium mb-2">Size</div>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(skill.size)}
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium mb-2">Last Modified</div>
                <p className="text-sm text-muted-foreground">
                  {new Date(skill.lastModified).toLocaleString()}
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium mb-2">Status</div>
                <Badge variant={skill.active ? "default" : "secondary"}>
                  {skill.active ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Skill Settings</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Auto-start</span>
                  <Switch defaultChecked={skill.active} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Debug mode</span>
                  <Switch />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Verbose logging</span>
                  <Switch />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Skill Enabled</span>
                  <span className="text-sm text-muted-foreground">2 hours ago</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Skill was enabled by system administrator
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Configuration Updated</span>
                  <span className="text-sm text-muted-foreground">1 day ago</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Timeout settings were adjusted to 60 seconds
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Skill Installed</span>
                  <span className="text-sm text-muted-foreground">3 days ago</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Skill was installed from the skill repository
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              View Source
            </Button>
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Documentation
            </Button>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Update
            </Button>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Uninstall
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}