// Supabase is DISABLED — all calls return empty results instantly (no network)
// Using local file-based data in /root/genplatform/data/ instead

const SUPABASE_ENABLED = false

// Chainable mock that resolves to empty data — supports await at any point
function mockChain() {
  const result = { data: [], error: null, count: 0 }
  const chain: any = {
    select: () => chain,
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => chain,
    upsert: () => Promise.resolve({ data: null, error: null }),
    delete: () => chain,
    eq: () => chain,
    neq: () => chain,
    gt: () => chain,
    lt: () => chain,
    gte: () => chain,
    lte: () => chain,
    in: () => chain,
    is: () => chain,
    like: () => chain,
    ilike: () => chain,
    or: () => chain,
    not: () => chain,
    order: () => chain,
    limit: () => chain,
    range: () => chain,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    match: () => chain,
    filter: () => chain,
    // Make chain thenable so `await supabase.from(...).select(...)...` works
    then: (resolve: any) => resolve(result),
    catch: () => chain,
  }
  return chain
}

const mockClient = {
  from: () => mockChain(),
  rpc: () => Promise.resolve({ data: null, error: null }),
  auth: {
    signUp: async () => ({ data: { user: null, session: null }, error: null }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
    signOut: async () => ({ error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    resetPasswordForEmail: async () => ({ error: null }),
    updateUser: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: null }),
      download: async () => ({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      list: async () => ({ data: [], error: null }),
      remove: async () => ({ data: null, error: null }),
    })
  }
} as any

export const supabase = mockClient
export const supabaseAdmin = mockClient

// Type definitions (kept for compatibility)
export interface Project {
  id: string; name: string; description?: string;
  status: 'planning' | 'active' | 'paused' | 'completed' | 'archived';
  github_repo?: string; vercel_url?: string; domain?: string;
  tech_stack: string[]; progress: number; priority: 'HIGH' | 'MEDIUM' | 'LOW';
  idea_id?: string; created_at: string; updated_at: string;
}
export interface ProjectTask {
  id: string; project_id: string; number: number; name: string;
  description?: string; status: 'planned' | 'in_progress' | 'review' | 'done' | 'blocked' | 'skipped';
  assigned_role?: string; estimated_minutes: number; actual_minutes?: number;
  sprint_number: number; started_at?: string; completed_at?: string;
  review_notes?: string; created_at: string;
}
export interface TeamMember {
  id: string; email: string; full_name: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'VIEWER';
  status: 'active' | 'invited' | 'disabled';
  invited_by?: string; joined_at?: string; last_active?: string; created_at: string;
}
export interface ProjectAssignment {
  id: string; project_id: string; team_member_id: string;
  role: 'lead' | 'member' | 'viewer'; assigned_at: string;
}
export interface SecurityEvent {
  id: string; event_type: string; severity: 'info' | 'warning' | 'critical';
  description: string; source_ip?: string; details: Record<string, any>;
  resolved: boolean; resolved_at?: string; created_at: string;
}
export interface TaskEvent {
  id: string; task_id: string; project_id: string; event_type: string;
  actor_role?: string; actor_user_id?: string; details: Record<string, any>; created_at: string;
}
export interface SystemMetrics {
  id: string; cpu_percent?: number; ram_percent?: number; disk_percent?: number;
  gateway_status?: string; active_sessions: number; recorded_at: string;
}
export interface ImprovementProposal {
  id: string; finding: string; impact: string; suggested_action: string;
  category?: string; status: string; implementation_notes?: string;
  created_at: string; resolved_at?: string;
}

export const authHelpers = {
  async signUp(email: string, password: string, userData?: { full_name?: string }) {
    return { user: null, session: null, error: null };
  },
  async signIn(email: string, password: string) {
    return { user: null, session: null, error: null };
  },
  async signOut() { return { error: null }; },
  async getCurrentUser() { return null; },
  async getCurrentSession() { return null; },
  async resetPassword(email: string) { return { error: null }; },
  async updatePassword(password: string) { return { error: null }; },
  async isAuthenticated(): Promise<boolean> { return false; }
}

export const supabaseHelpers = {
  async getProjectsCount(): Promise<number> { return 0; },
  async getActiveTasksCount(): Promise<number> { return 0; },
  async getCompletedTasksCount(): Promise<number> { return 0; },
  async getLatestSecurityStatus(): Promise<SecurityEvent | null> { return null; },
  async getRecentTaskEvents(limit: number = 20): Promise<TaskEvent[]> { return []; },
  async getLatestSystemMetrics(): Promise<SystemMetrics | null> { return null; },
  async getTeamMembers(): Promise<TeamMember[]> { return []; },
  async getTeamMemberByEmail(email: string): Promise<TeamMember | null> { return null; }
}
