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

-- Task 7-06: "Bug Fix" Template
INSERT INTO workflows (
    id,
    name,
    description,
    template_type,
    is_active,
    trigger_type,
    config
) VALUES (
    'bug-fix-template',
    'Bug Fix',
    'Automatically reproduce, fix, and deploy bug fixes',
    'bug_fix',
    false, -- Start inactive, user can activate
    'manual',
    '{
        "steps": [
            {
                "id": "reproduce_bug",
                "name": "🐛 Reproduce Bug",
                "type": "action",
                "description": "Investigate and confirm the bug reproduction steps",
                "role": "qa_engineer",
                "command": "Investigate the reported bug. Reproduce it consistently and document the exact steps, environment, and conditions that trigger the issue.",
                "estimated_duration": "15-20 minutes",
                "outputs": ["reproduction_steps", "environment_details", "error_logs"],
                "success_criteria": "Bug can be reproduced consistently"
            },
            {
                "id": "find_root_cause",
                "name": "🔍 Find Root Cause",
                "type": "action",
                "description": "Analyze code and identify the underlying cause",
                "role": "senior_developer",
                "command": "Analyze the codebase to identify the root cause of the bug. Examine relevant code paths, dependencies, and potential side effects.",
                "estimated_duration": "20-30 minutes",
                "outputs": ["root_cause_analysis", "affected_components", "impact_assessment"],
                "dependencies": ["reproduce_bug"]
            },
            {
                "id": "implement_fix",
                "name": "💻 Implement Fix",
                "type": "action", 
                "description": "Code the solution to resolve the bug",
                "role": "developer",
                "command": "Implement a fix for the identified root cause. Ensure the solution is minimal, focused, and doesn\'t introduce new issues. Include appropriate error handling.",
                "estimated_duration": "30-45 minutes",
                "outputs": ["fix_implementation", "code_changes", "unit_tests"],
                "dependencies": ["find_root_cause"]
            },
            {
                "id": "test_fix",
                "name": "✅ Test Fix",
                "type": "action",
                "description": "Thoroughly test the fix and verify no regressions",
                "role": "qa_engineer",
                "command": "Test the bug fix thoroughly. Verify the original issue is resolved, run regression tests, and check for any unintended side effects.",
                "estimated_duration": "20-25 minutes",
                "outputs": ["test_results", "regression_test_status", "verification_report"],
                "dependencies": ["implement_fix"],
                "success_criteria": "Bug is fixed and no regressions introduced"
            },
            {
                "id": "deploy_fix",
                "name": "🚀 Deploy Fix",
                "type": "action",
                "description": "Deploy the bug fix to production",
                "role": "devops",
                "command": "Deploy the tested bug fix to production environment. Monitor deployment process and verify successful rollout.",
                "estimated_duration": "10-15 minutes",
                "outputs": ["deployment_status", "production_verification", "rollback_plan"],
                "dependencies": ["test_fix"]
            },
            {
                "id": "notify_fix_complete",
                "name": "🔔 Notify: Bug Fixed and Deployed",
                "type": "notification",
                "description": "Notify stakeholders that bug has been fixed",
                "message": "🐛 ➡️ ✅ Bug has been successfully fixed and deployed to production!",
                "notification_channels": ["dashboard", "email", "slack"],
                "include_outputs": ["fix_summary", "test_results", "deployment_status"],
                "dependencies": ["deploy_fix"]
            }
        ],
        "estimated_total_duration": "1.5-2 hours",
        "success_criteria": [
            "Bug is completely resolved",
            "Fix is tested and verified", 
            "No regressions introduced",
            "Successfully deployed to production"
        ],
        "failure_handling": {
            "max_retries": 2,
            "retry_steps": ["implement_fix", "test_fix"],
            "escalation_roles": ["ADMIN", "OWNER"],
            "rollback_on_failure": true,
            "notification_on_failure": true
        },
        "priority": "high",
        "tags": ["bug", "hotfix", "production"]
    }'::jsonb
);

-- Add workflow metadata and tracking
UPDATE workflows SET 
    created_at = now(),
    updated_at = now()
WHERE id IN ('idea-to-mvp-template', 'bug-fix-template');

-- Create index for quick template lookup
CREATE INDEX IF NOT EXISTS idx_workflows_template_lookup ON workflows(template_type, is_active);

-- Comments for the templates
COMMENT ON TABLE workflows IS 'Pre-built workflow templates for common automation scenarios';

-- Verification queries
-- SELECT name, template_type, trigger_type, is_active, 
--        jsonb_array_length(config->'steps') as step_count
-- FROM workflows 
-- WHERE template_type IN ('idea_to_mvp', 'bug_fix');