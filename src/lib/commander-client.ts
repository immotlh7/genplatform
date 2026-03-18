// Commander Client - Handles Commander API communication and response processing

interface CommanderMessage {
  id?: string
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp?: string
  type?: 'message' | 'command' | 'commander'
  metadata?: {
    language?: string
    isArabic?: boolean
    originalText?: string
    translatedText?: string
    projectId?: string
    confidence?: number
  }
}

interface CommanderAction {
  type: 'send-to-project' | 'create-task' | 'edit-command' | 'new-idea' | 'quick-command'
  label: string
  data?: any
}

interface CommanderResponse {
  success: boolean
  message: CommanderMessage
  commanderResponse?: {
    command: string
    translation: string
    confidence: number
    suggestions?: string[]
    actions?: CommanderAction[]
  }
  type: 'commander-translation' | 'regular-message' | 'error-fallback'
  actions?: CommanderAction[]
  metadata?: {
    detectedLanguage: string
    confidence: number
    translationMethod: string
  }
  error?: string
}

interface BridgeRequest {
  message: CommanderMessage
  context?: {
    projectId?: string
    previousMessages?: CommanderMessage[]
    sessionId?: string
    userPreferences?: {
      language: string
      theme: string
      projectContext?: string
    }
  }
}

class CommanderClient {
  private baseUrl: string = '/api/bridge'
  private sessionId: string
  private messageHistory: CommanderMessage[] = []
  private currentProjectId?: string

  constructor(sessionId?: string) {
    this.sessionId = sessionId || `session-${Date.now()}`
  }

  // Send message to Bridge API and get Commander response
  async sendMessage(
    content: string, 
    options?: {
      projectId?: string
      forceCommanderMode?: boolean
      includeContext?: boolean
    }
  ): Promise<CommanderResponse> {
    try {
      const message: CommanderMessage = {
        id: Date.now().toString(),
        content,
        role: 'user',
        timestamp: new Date().toISOString(),
        type: this.detectArabic(content) || options?.forceCommanderMode ? 'commander' : 'message',
        metadata: {
          language: this.detectLanguage(content),
          isArabic: this.detectArabic(content),
          projectId: options?.projectId || this.currentProjectId
        }
      }

      // Add to message history
      this.messageHistory.push(message)

      const request: BridgeRequest = {
        message,
        context: {
          projectId: options?.projectId || this.currentProjectId,
          sessionId: this.sessionId,
          previousMessages: options?.includeContext ? this.messageHistory.slice(-5) : undefined
        }
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`Bridge API error: ${response.status} ${response.statusText}`)
      }

      const data: CommanderResponse = await response.json()

      if (data.success && data.message) {
        // Add response to history
        this.messageHistory.push(data.message)
      }

      return data

    } catch (error) {
      console.error('Commander Client error:', error)
      
      // Return error response
      return {
        success: false,
        message: {
          id: Date.now().toString(),
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          role: 'assistant',
          timestamp: new Date().toISOString(),
          type: 'message'
        },
        type: 'error-fallback',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Execute Commander action
  async executeAction(action: CommanderAction, context?: any): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      switch (action.type) {
        case 'send-to-project':
          return await this.sendToProject(action.data, context)
        
        case 'create-task':
          return await this.createTask(action.data, context)
        
        case 'edit-command':
          return { 
            success: true, 
            message: 'Edit mode activated',
            data: { 
              text: action.data?.translatedText || action.data?.originalText,
              action: 'edit'
            }
          }
        
        case 'new-idea':
          return await this.createIdea(action.data, context)
        
        case 'quick-command':
          return await this.executeQuickCommand(action.data, context)
        
        default:
          return {
            success: false,
            message: `Unknown action type: ${action.type}`
          }
      }
    } catch (error) {
      console.error('Action execution error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Send command/task to current project
  private async sendToProject(data: any, context?: any): Promise<{ success: boolean; message: string; data?: any }> {
    // Mock project integration - in real implementation, this would call project API
    const projectId = context?.projectId || this.currentProjectId || 'default-project'
    
    try {
      // Simulate API call to create project task
      const taskData = {
        title: data?.translatedText || data?.command || 'New Task from Commander',
        description: data?.originalText ? `Original: ${data.originalText}\nTranslated: ${data.translatedText}` : data?.description,
        projectId,
        createdBy: 'commander',
        status: 'todo',
        priority: data?.priority || 'medium',
        source: 'chat-commander'
      }

      // Mock delay for API call
      await new Promise(resolve => setTimeout(resolve, 500))

      return {
        success: true,
        message: `Task added to project: ${projectId}`,
        data: { taskId: `task-${Date.now()}`, projectId, ...taskData }
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to add task to project: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Create new task from command
  private async createTask(data: any, context?: any): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const taskData = {
        title: data?.title || data?.command || 'New Task',
        description: data?.description || data?.translatedText,
        projectId: context?.projectId || this.currentProjectId,
        status: 'todo',
        priority: data?.priority || 'medium',
        source: 'commander-chat'
      }

      // Mock task creation
      await new Promise(resolve => setTimeout(resolve, 300))

      return {
        success: true,
        message: 'Task created successfully',
        data: { taskId: `task-${Date.now()}`, ...taskData }
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Create new idea from command
  private async createIdea(data: any, context?: any): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const ideaData = {
        title: data?.title || data?.command || 'New Idea',
        content: data?.content || data?.translatedText,
        category: data?.category || 'general',
        source: 'commander-chat',
        projectId: context?.projectId
      }

      // Mock idea creation
      await new Promise(resolve => setTimeout(resolve, 200))

      return {
        success: true,
        message: 'Idea captured successfully',
        data: { ideaId: `idea-${Date.now()}`, ...ideaData }
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to create idea: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Execute quick commands
  private async executeQuickCommand(data: any, context?: any): Promise<{ success: boolean; message: string; data?: any }> {
    const commandType = data?.commandType || data?.type

    try {
      switch (commandType) {
        case 'system-status':
          return {
            success: true,
            message: 'System status retrieved',
            data: {
              cpu: '45%',
              memory: '62%',
              status: 'healthy',
              uptime: '2.5 days'
            }
          }
        
        case 'project-list':
          return {
            success: true,
            message: 'Project list retrieved',
            data: {
              projects: [
                { id: 'genplatform', name: 'GenPlatform.ai', status: 'active' },
                { id: 'skills-lib', name: 'Agent Skills Library', status: 'active' }
              ]
            }
          }
        
        case 'help':
          return {
            success: true,
            message: 'Help information retrieved',
            data: {
              commands: [
                'انشئ مشروع جديد - Create new project',
                'اظهر المشاريع - Show projects',
                'حالة النظام - System status',
                'مساعدة - Help'
              ]
            }
          }
        
        default:
          return {
            success: false,
            message: `Unknown quick command: ${commandType}`
          }
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to execute quick command: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Arabic detection helper
  private detectArabic(text: string): boolean {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/
    return arabicRegex.test(text)
  }

  // Language detection helper
  private detectLanguage(text: string): string {
    return this.detectArabic(text) ? 'ar' : 'en'
  }

  // Get message history
  getHistory(): CommanderMessage[] {
    return [...this.messageHistory]
  }

  // Clear message history
  clearHistory(): void {
    this.messageHistory = []
  }

  // Set current project context
  setProjectContext(projectId: string): void {
    this.currentProjectId = projectId
  }

  // Get current project context
  getProjectContext(): string | undefined {
    return this.currentProjectId
  }

  // Get Bridge API status
  async getStatus(): Promise<{ success: boolean; status: string; capabilities?: any }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      return {
        success: false,
        status: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

// Export singleton instance
export const commanderClient = new CommanderClient()
export { CommanderClient, type CommanderResponse, type CommanderAction, type CommanderMessage }