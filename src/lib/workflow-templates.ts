// Workflow template definitions for automation system
// Tasks 7-05 through 7-09: Pre-built workflow templates

export interface WorkflowStep {
  id: string
  name: string
  type: 'action' | 'approval' | 'loop' | 'notification'
  description: string
  estimatedMinutes?: number
  config?: {
    role?: string
    command?: string
    approver?: 'owner' | 'admin'
    loopTarget?: string
    notificationMessage?: string
    requiresInput?: boolean
  }
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  template_type: string
  trigger_type: 'manual' | 'new_idea' | 'task_complete' | 'schedule'
  schedule?: string
  is_active: boolean
  steps: WorkflowStep[]
  config: {
    priority: 'low' | 'medium' | 'high'
    category: string
    estimatedTotalMinutes: number
  }
}

// Task 7-05: "Idea to MVP" template
export const ideaToMvpTemplate: WorkflowTemplate = {
  id: 'idea-to-mvp-template',
  name: 'Idea to MVP',
  description: 'Complete workflow to transform an idea into a working MVP with automated development pipeline',
  template_type: 'idea_to_mvp',
  trigger_type: 'new_idea',
  is_active: false,
  steps: [
    {
      id: 'research-analyze',
      name: 'Research & Analyze',
      type: 'action',
      description: 'Research market, competitors, and technical feasibility of the idea',
      estimatedMinutes: 60,
      config: {
        role: 'researcher',
        command: 'research_and_analyze_idea',
        requiresInput: true
      }
    },
    {
      id: 'generate-master-plan',
      name: 'Generate Master Plan',
      type: 'action',
      description: 'Create comprehensive project plan with technical architecture and roadmap',
      estimatedMinutes: 45,
      config: {
        role: 'architect',
        command: 'generate_master_plan',
        requiresInput: false
      }
    },
    {
      id: 'owner-approval',
      name: 'Owner Approval',
      type: 'approval',
      description: 'Wait for owner to approve the master plan before proceeding',
      estimatedMinutes: 0,
      config: {
        approver: 'owner',
        requiresInput: true
      }
    },
    {
      id: 'create-task-breakdown',
      name: 'Create Task Breakdown',
      type: 'action',
      description: 'Break down the master plan into specific, actionable development tasks',
      estimatedMinutes: 30,
      config: {
        role: 'architect',
        command: 'create_task_breakdown',
        requiresInput: false
      }
    },
    {
      id: 'development-loop',
      name: 'Development Loop',
      type: 'loop',
      description: 'For each task: Code implementation → Self-review → Quality check',
      estimatedMinutes: 240, // 4 hours estimate for MVP development
      config: {
        loopTarget: 'project_tasks',
        command: 'execute_development_cycle',
        requiresInput: false
      }
    },
    {
      id: 'security-scan',
      name: 'Final Security Scan',
      type: 'action',
      description: 'Comprehensive security audit of the completed MVP',
      estimatedMinutes: 20,
      config: {
        role: 'security',
        command: 'security_audit',
        requiresInput: false
      }
    },
    {
      id: 'deploy-preview',
      name: 'Deploy to Preview',
      type: 'action',
      description: 'Deploy the MVP to staging environment for testing',
      estimatedMinutes: 15,
      config: {
        role: 'devops',
        command: 'deploy_to_preview',
        requiresInput: false
      }
    },
    {
      id: 'notify-completion',
      name: 'Notify Owner',
      type: 'notification',
      description: 'Send completion notification to owner',
      estimatedMinutes: 1,
      config: {
        notificationMessage: 'Project ready for review! 🚀',
        requiresInput: false
      }
    }
  ],
  config: {
    priority: 'high',
    category: 'development',
    estimatedTotalMinutes: 411 // ~7 hours total
  }
}

// Task 7-06: "Bug Fix" template
export const bugFixTemplate: WorkflowTemplate = {
  id: 'bug-fix-template',
  name: 'Bug Fix',
  description: 'Systematic approach to identify, fix, and deploy bug fixes',
  template_type: 'bug_fix',
  trigger_type: 'manual',
  is_active: false,
  steps: [
    {
      id: 'reproduce-bug',
      name: 'Reproduce Bug',
      type: 'action',
      description: 'Investigate and confirm the bug, document steps to reproduce',
      estimatedMinutes: 30,
      config: {
        role: 'developer',
        command: 'reproduce_and_investigate_bug',
        requiresInput: true
      }
    },
    {
      id: 'find-root-cause',
      name: 'Find Root Cause',
      type: 'action',
      description: 'Analyze code and identify the root cause of the issue',
      estimatedMinutes: 45,
      config: {
        role: 'developer',
        command: 'find_root_cause',
        requiresInput: false
      }
    },
    {
      id: 'implement-fix',
      name: 'Implement Fix',
      type: 'action',
      description: 'Code the fix for the identified issue',
      estimatedMinutes: 60,
      config: {
        role: 'developer',
        command: 'implement_bug_fix',
        requiresInput: false
      }
    },
    {
      id: 'test-fix',
      name: 'Test Fix',
      type: 'action',
      description: 'Thoroughly test the fix to ensure it resolves the issue',
      estimatedMinutes: 30,
      config: {
        role: 'developer',
        command: 'test_bug_fix',
        requiresInput: false
      }
    },
    {
      id: 'deploy-fix',
      name: 'Deploy Fix',
      type: 'action',
      description: 'Deploy the fix to production environment',
      estimatedMinutes: 15,
      config: {
        role: 'devops',
        command: 'deploy_bug_fix',
        requiresInput: false
      }
    },
    {
      id: 'notify-completion',
      name: 'Notify Completion',
      type: 'notification',
      description: 'Send notification that bug has been fixed and deployed',
      estimatedMinutes: 1,
      config: {
        notificationMessage: 'Bug fixed and deployed ✅',
        requiresInput: false
      }
    }
  ],
  config: {
    priority: 'high',
    category: 'maintenance',
    estimatedTotalMinutes: 181 // ~3 hours
  }
}

// Task 7-07: "New Feature" template
export const newFeatureTemplate: WorkflowTemplate = {
  id: 'new-feature-template',
  name: 'New Feature',
  description: 'End-to-end feature development with approval gates and quality checks',
  template_type: 'new_feature',
  trigger_type: 'manual',
  is_active: false,
  steps: [
    {
      id: 'plan-feature',
      name: 'Plan Feature',
      type: 'action',
      description: 'Define feature requirements, design, and implementation approach',
      estimatedMinutes: 60,
      config: {
        role: 'architect',
        command: 'plan_new_feature',
        requiresInput: true
      }
    },
    {
      id: 'approval-gate',
      name: 'Wait for Approval',
      type: 'approval',
      description: 'Get approval for feature plan before implementation',
      estimatedMinutes: 0,
      config: {
        approver: 'owner',
        requiresInput: true
      }
    },
    {
      id: 'code-feature',
      name: 'Code Feature',
      type: 'action',
      description: 'Implement the feature according to the approved plan',
      estimatedMinutes: 120,
      config: {
        role: 'developer',
        command: 'implement_feature',
        requiresInput: false
      }
    },
    {
      id: 'code-review',
      name: 'Code Review',
      type: 'action',
      description: 'Thorough code review for quality and best practices',
      estimatedMinutes: 30,
      config: {
        role: 'reviewer',
        command: 'review_feature_code',
        requiresInput: false
      }
    },
    {
      id: 'security-check',
      name: 'Security Check',
      type: 'action',
      description: 'Security audit of the new feature',
      estimatedMinutes: 20,
      config: {
        role: 'security',
        command: 'security_check_feature',
        requiresInput: false
      }
    },
    {
      id: 'deploy-feature',
      name: 'Deploy',
      type: 'action',
      description: 'Deploy feature to production environment',
      estimatedMinutes: 15,
      config: {
        role: 'devops',
        command: 'deploy_feature',
        requiresInput: false
      }
    },
    {
      id: 'notify-live',
      name: 'Notify Live',
      type: 'notification',
      description: 'Announce feature is live',
      estimatedMinutes: 1,
      config: {
        notificationMessage: 'Feature live! 🎉',
        requiresInput: false
      }
    }
  ],
  config: {
    priority: 'medium',
    category: 'development',
    estimatedTotalMinutes: 246 // ~4 hours
  }
}

// Task 7-08: "Deploy Pipeline" template
export const deployPipelineTemplate: WorkflowTemplate = {
  id: 'deploy-pipeline-template',
  name: 'Deploy Pipeline',
  description: 'Comprehensive deployment pipeline with testing and approval gates',
  template_type: 'deploy_pipeline',
  trigger_type: 'manual',
  is_active: false,
  steps: [
    {
      id: 'build-project',
      name: 'Build Project',
      type: 'action',
      description: 'Compile and build the project for deployment',
      estimatedMinutes: 10,
      config: {
        role: 'devops',
        command: 'build_project',
        requiresInput: false
      }
    },
    {
      id: 'run-tests',
      name: 'Run Tests',
      type: 'action',
      description: 'Execute full test suite to ensure quality',
      estimatedMinutes: 15,
      config: {
        role: 'devops',
        command: 'run_test_suite',
        requiresInput: false
      }
    },
    {
      id: 'security-scan',
      name: 'Security Scan',
      type: 'action',
      description: 'Perform security vulnerability scan',
      estimatedMinutes: 10,
      config: {
        role: 'security',
        command: 'security_scan',
        requiresInput: false
      }
    },
    {
      id: 'staging-approval',
      name: 'Deploy to Staging Approval',
      type: 'approval',
      description: 'Approve deployment to staging environment',
      estimatedMinutes: 0,
      config: {
        approver: 'admin',
        requiresInput: true
      }
    },
    {
      id: 'deploy-staging',
      name: 'Deploy to Staging',
      type: 'action',
      description: 'Deploy to staging environment for final testing',
      estimatedMinutes: 10,
      config: {
        role: 'devops',
        command: 'deploy_to_staging',
        requiresInput: false
      }
    },
    {
      id: 'production-approval',
      name: 'Deploy to Production Approval',
      type: 'approval',
      description: 'Final approval for production deployment',
      estimatedMinutes: 0,
      config: {
        approver: 'owner',
        requiresInput: true
      }
    },
    {
      id: 'deploy-production',
      name: 'Deploy to Production',
      type: 'action',
      description: 'Deploy to production environment',
      estimatedMinutes: 15,
      config: {
        role: 'devops',
        command: 'deploy_to_production',
        requiresInput: false
      }
    },
    {
      id: 'notify-deployed',
      name: 'Notify Deployed',
      type: 'notification',
      description: 'Send notification of successful production deployment',
      estimatedMinutes: 1,
      config: {
        notificationMessage: 'Deployed to production! 🚀',
        requiresInput: false
      }
    }
  ],
  config: {
    priority: 'high',
    category: 'deployment',
    estimatedTotalMinutes: 61 // ~1 hour
  }
}

// Task 7-09: "Nightly Maintenance" template
export const nightlyMaintenanceTemplate: WorkflowTemplate = {
  id: 'nightly-maintenance-template',
  name: 'Nightly Maintenance',
  description: 'Automated nightly tasks for code review, security, and system maintenance',
  template_type: 'nightly_maintenance',
  trigger_type: 'schedule',
  schedule: 'daily 2 AM Africa/Casablanca',
  is_active: false,
  steps: [
    {
      id: 'review-daily-code',
      name: 'Review All Code Written Today',
      type: 'action',
      description: 'Analyze all code commits from the past day for quality and patterns',
      estimatedMinutes: 30,
      config: {
        role: 'reviewer',
        command: 'review_daily_code_changes',
        requiresInput: false
      }
    },
    {
      id: 'security-scan-all',
      name: 'Security Scan All Projects',
      type: 'action',
      description: 'Run comprehensive security audit on all active projects',
      estimatedMinutes: 45,
      config: {
        role: 'security',
        command: 'scan_all_projects',
        requiresInput: false
      }
    },
    {
      id: 'memory-cleanup',
      name: 'Memory Cleanup & Consolidation',
      type: 'action',
      description: 'Clean up temporary files, optimize databases, consolidate logs',
      estimatedMinutes: 20,
      config: {
        role: 'system',
        command: 'cleanup_and_consolidate',
        requiresInput: false
      }
    },
    {
      id: 'generate-daily-report',
      name: 'Generate Daily Report',
      type: 'action',
      description: 'Create comprehensive daily report of all activities and metrics',
      estimatedMinutes: 15,
      config: {
        role: 'reporter',
        command: 'generate_daily_report',
        requiresInput: false
      }
    }
  ],
  config: {
    priority: 'medium',
    category: 'maintenance',
    estimatedTotalMinutes: 110 // ~2 hours
  }
}

// Export all templates
export const workflowTemplates = [
  ideaToMvpTemplate,
  bugFixTemplate,
  newFeatureTemplate,
  deployPipelineTemplate,
  nightlyMaintenanceTemplate
]

// Helper functions
export const getTemplateById = (id: string): WorkflowTemplate | undefined => {
  return workflowTemplates.find(template => template.id === id)
}

export const getTemplatesByTriggerType = (triggerType: string): WorkflowTemplate[] => {
  return workflowTemplates.filter(template => template.trigger_type === triggerType)
}

export const getActiveTemplates = (): WorkflowTemplate[] => {
  return workflowTemplates.filter(template => template.is_active)
}