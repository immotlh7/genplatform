import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
)

// Database types (to be generated from Supabase)
export interface Project {
  id: string
  name: string
  description?: string
  status: 'planning' | 'active' | 'paused' | 'completed' | 'archived'
  github_repo?: string
  vercel_url?: string
  domain?: string
  tech_stack: string[]
  progress: number
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  idea_id?: string
  created_at: string
  updated_at: string
}

export interface ProjectTask {
  id: string
  project_id: string
  number: number
  name: string
  description?: string
  status: 'planned' | 'in_progress' | 'review' | 'done' | 'blocked' | 'skipped'
  assigned_role?: string
  estimated_minutes: number
  actual_minutes?: number
  sprint_number: number
  started_at?: string
  completed_at?: string
  review_notes?: string
  created_at: string
}

export interface SecurityEvent {
  id: string
  event_type: 'login' | 'failed_login' | 'threat' | 'audit' | 'health_check' | 'alert'
  severity: 'info' | 'warning' | 'critical'
  description: string
  source_ip?: string
  details: Record<string, any>
  resolved: boolean
  resolved_at?: string
  created_at: string
}

export interface TaskEvent {
  id: string
  task_id: string
  project_id: string
  event_type: string
  actor_role?: string
  actor_user_id?: string
  details: Record<string, any>
  created_at: string
}

export interface SystemMetrics {
  id: string
  cpu_percent?: number
  ram_percent?: number
  disk_percent?: number
  gateway_status?: string
  active_sessions: number
  recorded_at: string
}

export interface ImprovementProposal {
  id: string
  finding: string
  impact: string
  suggested_action: string
  category?: 'performance' | 'security' | 'ux' | 'code_quality' | 'workflow' | 'skills'
  status: 'proposed' | 'approved' | 'implemented' | 'rejected'
  implementation_notes?: string
  created_at: string
  resolved_at?: string
}

// Helper functions for common queries
export const supabaseHelpers = {
  // Get projects count
  async getProjectsCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
      
      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error fetching projects count:', error)
      return 0
    }
  },

  // Get active tasks count
  async getActiveTasksCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('project_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress')
      
      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error fetching active tasks count:', error)
      return 0
    }
  },

  // Get completed tasks count
  async getCompletedTasksCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('project_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'done')
      
      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error fetching completed tasks count:', error)
      return 0
    }
  },

  // Get latest security status
  async getLatestSecurityStatus(): Promise<SecurityEvent | null> {
    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching latest security status:', error)
      return null
    }
  },

  // Get recent task events
  async getRecentTaskEvents(limit: number = 20): Promise<TaskEvent[]> {
    try {
      const { data, error } = await supabase
        .from('task_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching recent task events:', error)
      return []
    }
  },

  // Get latest system metrics
  async getLatestSystemMetrics(): Promise<SystemMetrics | null> {
    try {
      const { data, error } = await supabase
        .from('system_metrics')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching latest system metrics:', error)
      return null
    }
  }
}