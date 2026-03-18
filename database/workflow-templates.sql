-- Workflow Templates: Pre-built workflow definitions
-- Created: 2026-03-18 for Tasks 7-05 through 7-09
-- Purpose: Insert standard workflow templates into workflows table

-- Task 7-05: "Idea to MVP" Template
INSERT INTO workflows (
    id,
    name,
    description,
    template_type,
    is_active,
    trigger_type,
    config
) VALUES (
    'idea-to-mvp-template',
    'Idea to MVP',
    'Transform ideas into working prototypes automatically',
    'idea_to_mvp',
    false, -- Start inactive, user can activate
    'new_idea',
    '{
        "steps": [
            {
                "id": "research_analyze",
                "name": "🔬 Research & Analyze",
                "type": "action",
                "description": "Analyze the idea and research market/technical requirements",
                "role": "researcher",
                "command": "Research and analyze this idea thoroughly. Provide market analysis, technical feasibility, and competitive landscape.",
                "estimated_duration": "10-15 minutes",
                "outputs": ["research_report", "feasibility_analysis"]
            },
            {
                "id": "generate_master_plan",
                "name": "📋 Generate Master Plan",
                "type": "action", 
                "description": "Create comprehensive project plan and architecture",
                "role": "architect",
                "command": "Based on the research, create a detailed master plan including: architecture, tech stack, timeline, milestones, and implementation strategy.",
                "estimated_duration": "15-20 minutes",
                "outputs": ["master_plan", "architecture_diagram", "tech_stack"]
            },
            {
                "id": "wait_owner_approval",
                "name": "⏸️ Wait for Owner Approval",
                "type": "approval",
                "description": "Owner review and approval before proceeding with development",
                "approval_message": "Review the research and master plan. Approve to proceed with MVP development?",
                "required_role": "OWNER"
            },
            {
                "id": "create_task_breakdown",
                "name": "📊 Create Task Breakdown",
                "type": "action",
                "description": "Break down the master plan into specific development tasks",
                "role": "project_manager", 
                "command": "Break down the approved master plan into specific, actionable development tasks. Create task list with priorities and dependencies.",
                "estimated_duration": "10 minutes",
                "outputs": ["task_breakdown", "project_timeline"]
            },
            {
                "id": "development_loop",
                "name": "🔄 Loop: Development Cycle",
                "type": "loop",
                "description": "For each task: Code → Self-Review → Integration",
                "loop_target": "tasks",
                "loop_steps": [
                    {
                        "id": "code_task",
                        "name": "💻 Code Task",
                        "type": "action",
                        "role": "developer",
                        "command": "Implement this specific task following the master plan and architecture guidelines. Write clean, documented code.",
                        "estimated_duration": "30-60 minutes"
                    },
                    {
                        "id": "self_review",
                        "name": "🔍 Self-Review",
                        "type": "action", 
                        "role": "reviewer",
                        "command": "Review the implemented code for: functionality, code quality, security, performance, and adherence to architecture.",
                        "estimated_duration": "10-15 minutes"
                    }
                ]
            },
            {
                "id": "final_security_scan",
                "name": "🛡️ Final Security Scan",
                "type": "action",
                "description": "Comprehensive security audit of the complete MVP",
                "role": "security_specialist",
                "command": "Perform comprehensive security scan of the completed MVP. Check for vulnerabilities, security best practices, and potential risks.",
                "estimated_duration": "15-20 minutes",
                "outputs": ["security_report", "vulnerability_assessment"]
            },
            {
                "id": "deploy_preview", 
                "name": "🚀 Deploy to Preview",
                "type": "action",
                "description": "Deploy MVP to staging/preview environment",
                "role": "devops",
                "command": "Deploy the completed MVP to preview environment. Ensure all services are running and accessible.",
                "estimated_duration": "10-15 minutes",
                "outputs": ["preview_url", "deployment_status"]
            },
            {
                "id": "notify_owner_complete",
                "name": "🔔 Notify Owner: Project Ready",
                "type": "notification",
                "description": "Notify owner that MVP is complete and ready for review",
                "message": "🎉 Your idea has been transformed into a working MVP! The project is deployed and ready for review.",
                "notification_channels": ["dashboard", "email"],
                "include_outputs": ["preview_url", "security_report", "project_summary"]
            }
        ],
        "estimated_total_duration": "2-3 hours",
        "success_criteria": [
            "Working MVP deployed to preview environment",
            "All security checks passed", 
            "Code quality standards met",
            "Documentation complete"
        ],
        "failure_handling": {
            "max_retries": 2,
            "retry_steps": ["code_task", "self_review"],
            "escalation_roles": ["OWNER", "ADMIN"],
            "notification_on_failure": true
        }
    }'::jsonb
);

-- Add workflow metadata and tracking
UPDATE workflows SET 
    created_at = now(),
    updated_at = now()
WHERE id = 'idea-to-mvp-template';

-- Create index for quick template lookup
CREATE INDEX IF NOT EXISTS idx_workflows_template_lookup ON workflows(template_type, is_active);

-- Comments for the Idea to MVP template
COMMENT ON TABLE workflows IS 'Pre-built workflow templates for common automation scenarios';

-- Verification query
-- SELECT name, template_type, trigger_type, is_active, 
--        jsonb_array_length(config->'steps') as step_count
-- FROM workflows 
-- WHERE template_type = 'idea_to_mvp';