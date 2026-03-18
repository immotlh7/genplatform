// Workflow template definitions and database insertion utilities
import { supabaseHelpers } from './supabase'

export interface WorkflowStep {
  order: number
  name: string
  description: string
  type: 'action' | 'approval' | 'loop'
  icon: string
  command?: string
  approval_message?: string
}

export interface WorkflowTemplate {
  name: string
  description: string
  template_type: string
  trigger_type: 'manual' | 'new_idea' | 'task_complete' | 'schedule'
  is_active: boolean
  steps: WorkflowStep[]
  schedule?: string
}

export const ideaToMvpTemplate: WorkflowTemplate = {
  name: 'Idea to MVP',
  description: 'Complete pipeline from idea submission to deployed MVP with approval gates',
  template_type: 'idea_to_mvp',
  trigger_type: 'new_idea',
  is_active: false,
  steps: [
    {
      order: 1,
      name: 'Research & Analyze',
      description: 'Investigate market, competitors, and technical feasibility',
      type: 'action',
      icon: '🔬',
      command: 'trigger role-researcher with idea context'
    },
    {
      order: 2,
      name: 'Generate Master Plan',
      description: 'Create comprehensive project plan with architecture and timeline',
      type: 'action',
      icon: '📋',
      command: 'trigger role-architect with research results'
    },
    {
      order: 3,
      name: 'Wait for Owner Approval',
      description: 'Pause for owner review and approval of the master plan',
      type: 'approval',
      icon: '⏸️',
      approval_message: 'Master plan is ready for your review. Approve to proceed with task breakdown?'
    },
    {
      order: 4,
      name: 'Create Task Breakdown',
      description: 'Convert plan into detailed task list with time estimates',
      type: 'action',
      icon: '📊',
      command: 'create detailed task breakdown from approved plan'
    },
    {
      order: 5,
      name: 'Development Loop',
      description: 'For each task: Code → Self-Review → Next task',
      type: 'loop',
      icon: '🔄',
      command: 'loop: for each task { code implementation → self-review → commit }'
    },
    {
      order: 6,
      name: 'Final Security Scan',
      description: 'Comprehensive security audit before deployment',
      type: 'action',
      icon: '🛡️',
      command: 'run complete security audit on codebase'
    },
    {
      order: 7,
      name: 'Deploy to Preview',
      description: 'Deploy to staging environment for testing',
      type: 'action',
      icon: '🚀',
      command: 'deploy to vercel preview environment'
    },
    {
      order: 8,
      name: 'Notify Owner',
      description: 'Send completion notification with preview links',
      type: 'action',
      icon: '🔔',
      command: 'send notification: "Project ready for review!" with preview URL'
    }
  ]
}

export const bugFixTemplate: WorkflowTemplate = {
  name: 'Bug Fix',
  description: 'Automated bug reproduction, fix, and deployment pipeline',
  template_type: 'bug_fix',
  trigger_type: 'manual',
  is_active: false,
  steps: [
    {
      order: 1,
      name: 'Reproduce Bug',
      description: 'Investigate and confirm the reported bug',
      type: 'action',
      icon: '🐛',
      command: 'investigate and reproduce the reported bug'
    },
    {
      order: 2,
      name: 'Find Root Cause',
      description: 'Analyze code to identify the source of the issue',
      type: 'action',
      icon: '🔍',
      command: 'analyze codebase to find root cause of bug'
    },
    {
      order: 3,
      name: 'Implement Fix',
      description: 'Code and implement the bug fix',
      type: 'action',
      icon: '💻',
      command: 'implement fix for identified bug'
    },
    {
      order: 4,
      name: 'Test Fix',
      description: 'Verify the fix resolves the issue',
      type: 'action',
      icon: '✅',
      command: 'test the implemented fix thoroughly'
    },
    {
      order: 5,
      name: 'Deploy Fix',
      description: 'Deploy the fix to production',
      type: 'action',
      icon: '🚀',
      command: 'deploy fix to production environment'
    },
    {
      order: 6,
      name: 'Notify Completion',
      description: 'Confirm bug fix is deployed and working',
      type: 'action',
      icon: '🔔',
      command: 'send notification: "Bug fixed and deployed"'
    }
  ]
}

export const newFeatureTemplate: WorkflowTemplate = {
  name: 'New Feature',
  description: 'Plan, code, review, and deploy new features with approval gates',
  template_type: 'new_feature',
  trigger_type: 'manual',
  is_active: false,
  steps: [
    {
      order: 1,
      name: 'Plan Feature',
      description: 'Design and plan the new feature implementation',
      type: 'action',
      icon: '📋',
      command: 'plan and design new feature implementation'
    },
    {
      order: 2,
      name: 'Wait for Approval',
      description: 'Owner review and approval of feature plan',
      type: 'approval',
      icon: '⏸️',
      approval_message: 'Feature plan is ready. Approve to start development?'
    },
    {
      order: 3,
      name: 'Code Feature',
      description: 'Implement the new feature',
      type: 'action',
      icon: '💻',
      command: 'implement new feature according to approved plan'
    },
    {
      order: 4,
      name: 'Code Review',
      description: 'Self-review and optimize the implementation',
      type: 'action',
      icon: '🔍',
      command: 'perform code review and optimization'
    },
    {
      order: 5,
      name: 'Security Check',
      description: 'Security audit of new feature',
      type: 'action',
      icon: '🛡️',
      command: 'run security audit on new feature code'
    },
    {
      order: 6,
      name: 'Deploy',
      description: 'Deploy feature to production',
      type: 'action',
      icon: '🚀',
      command: 'deploy new feature to production'
    },
    {
      order: 7,
      name: 'Notify Completion',
      description: 'Announce feature is live',
      type: 'action',
      icon: '🔔',
      command: 'send notification: "Feature live!" with details'
    }
  ]
}

export const deployPipelineTemplate: WorkflowTemplate = {
  name: 'Deploy Pipeline',
  description: 'Build, test, and deploy with approval gates',
  template_type: 'deploy_pipeline',
  trigger_type: 'manual',
  is_active: false,
  steps: [
    {
      order: 1,
      name: 'Build Project',
      description: 'Compile and build the project',
      type: 'action',
      icon: '🔨',
      command: 'build project with latest changes'
    },
    {
      order: 2,
      name: 'Run Tests',
      description: 'Execute test suite',
      type: 'action',
      icon: '✅',
      command: 'run complete test suite'
    },
    {
      order: 3,
      name: 'Security Scan',
      description: 'Scan for security vulnerabilities',
      type: 'action',
      icon: '🛡️',
      command: 'run security vulnerability scan'
    },
    {
      order: 4,
      name: 'Deploy to Staging?',
      description: 'Approval gate for staging deployment',
      type: 'approval',
      icon: '⏸️',
      approval_message: 'Build and tests passed. Deploy to staging?'
    },
    {
      order: 5,
      name: 'Deploy to Staging',
      description: 'Deploy to staging environment',
      type: 'action',
      icon: '🚀',
      command: 'deploy to staging environment'
    },
    {
      order: 6,
      name: 'Deploy to Production?',
      description: 'Final approval for production deployment',
      type: 'approval',
      icon: '⏸️',
      approval_message: 'Staging deployment successful. Deploy to production?'
    },
    {
      order: 7,
      name: 'Deploy to Production',
      description: 'Deploy to production environment',
      type: 'action',
      icon: '🚀',
      command: 'deploy to production environment'
    },
    {
      order: 8,
      name: 'Notify Success',
      description: 'Confirm successful production deployment',
      type: 'action',
      icon: '🔔',
      command: 'send notification: "Deployed to production!"'
    }
  ]
}

export const nightlyMaintenanceTemplate: WorkflowTemplate = {
  name: 'Nightly Maintenance',
  description: 'Daily code review, security scan, and cleanup tasks',
  template_type: 'nightly_maintenance',
  trigger_type: 'schedule',
  schedule: '0 2 * * *', // Daily at 2 AM Africa/Casablanca
  is_active: false,
  steps: [
    {
      order: 1,
      name: 'Review All Code Written Today',
      description: 'Review all commits from the past 24 hours',
      type: 'action',
      icon: '🔍',
      command: 'review all code commits from past 24 hours'
    },
    {
      order: 2,
      name: 'Security Scan All Projects',
      description: 'Run security audit across all active projects',
      type: 'action',
      icon: '🛡️',
      command: 'run comprehensive security scan on all projects'
    },
    {
      order: 3,
      name: 'Memory Cleanup & Consolidation',
      description: 'Clean up temporary files and consolidate memory',
      type: 'action',
      icon: '🧹',
      command: 'cleanup temporary files and consolidate memory files'
    },
    {
      order: 4,
      name: 'Generate Daily Report',
      description: 'Create summary report of daily activities',
      type: 'action',
      icon: '📊',
      command: 'generate daily summary report with metrics'
    }
  ]
}

export const allWorkflowTemplates = [
  ideaToMvpTemplate,
  bugFixTemplate,
  newFeatureTemplate,
  deployPipelineTemplate,
  nightlyMaintenanceTemplate
]

export async function insertWorkflowTemplate(template: WorkflowTemplate) {
  try {
    const { data, error } = await supabaseHelpers.supabase
      .from('workflows')
      .insert({
        name: template.name,
        description: template.description,
        template_type: template.template_type,
        trigger_type: template.trigger_type,
        is_active: template.is_active,
        schedule: template.schedule,
        config: {
          steps: template.steps
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting workflow template:', error)
      return null
    }

    console.log(`Inserted workflow template: ${template.name}`)
    return data
  } catch (err) {
    console.error('Failed to insert workflow template:', err)
    return null
  }
}

export async function insertAllWorkflowTemplates() {
  console.log('Inserting workflow templates...')
  
  const results = []
  for (const template of allWorkflowTemplates) {
    const result = await insertWorkflowTemplate(template)
    results.push(result)
  }
  
  const successful = results.filter(r => r !== null).length
  console.log(`Successfully inserted ${successful}/${allWorkflowTemplates.length} workflow templates`)
  
  return results
}