# Sprint 7: Simplified Automation System

## Overview
Sprint 7 focuses on creating a comprehensive automation system with pre-built templates. This sprint contains 18 tasks that need to be completed systematically.

## Tasks List

### Task 7-01: Create automations page
- **File**: `src/app/(dashboard)/automations/page.tsx`
- **Requirements**:
  - Header: "⚡ Automations" + "Active: X/Y workflows"
  - Grid of workflow template cards
  - Only OWNER and ADMIN can manage automations
- **Time**: 10 min

### Task 7-02: Create Supabase table: workflows
- **SQL**:
```sql
CREATE TABLE workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  trigger_type TEXT CHECK (trigger_type IN ('manual','new_idea','task_complete','schedule')),
  schedule TEXT,
  config JSONB DEFAULT '{}',
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
- **Time**: 5 min

### Task 7-03: Create Supabase table: workflow_runs
- **SQL**:
```sql
CREATE TABLE workflow_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  status TEXT DEFAULT 'running' CHECK (status IN ('running','completed','failed','waiting_approval')),
  current_step TEXT,
  steps_completed INT DEFAULT 0,
  steps_total INT,
  logs JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```
- **Time**: 5 min

### Task 7-04: Create workflow template card component
- **File**: `src/components/automations/WorkflowCard.tsx`
- **Requirements**:
  - Shows: icon, name, description, trigger type badge, active/inactive toggle
  - Status line: "Last run: 2h ago" or "Never run"
  - Buttons: "Run Now" | "Configure" | "View Runs"
  - Active toggle: green when active, gray when inactive
- **Time**: 15 min

### Task 7-05: Create "Idea to MVP" template
- **Requirements**:
  - Pre-built workflow with ordered steps:
    1. Research & Analyze (triggers role-researcher)
    2. Generate Master Plan (triggers role-architect)
    3. Wait for Owner Approval
    4. Create Task Breakdown
    5. Loop: For each task → { Code → Self-Review }
    6. Final Security Scan
    7. Deploy to Preview
    8. Notify Owner: "Project ready for review!"
  - Insert into Supabase workflows table
- **Time**: 15 min

### Task 7-06: Create "Bug Fix" template
- **Steps**:
  1. Reproduce Bug (investigate and confirm)
  2. Find Root Cause
  3. Implement Fix
  4. Test Fix
  5. Deploy Fix
  6. Notify: "Bug fixed and deployed"
- **Time**: 10 min

### Task 7-07: Create "New Feature" template
- **Steps**:
  1. Plan Feature
  2. Wait for Approval
  3. Code Feature
  4. Code Review
  5. Security Check
  6. Deploy
  7. Notify: "Feature live!"
- **Time**: 10 min

### Task 7-08: Create "Deploy Pipeline" template
- **Steps**:
  1. Build Project
  2. Run Tests
  3. Security Scan
  4. Approval: Deploy to Staging?
  5. Deploy to Staging
  6. Final Approval: Deploy to Production?
  7. Deploy to Production
  8. Notify: "Deployed to production!"
- **Time**: 10 min

### Task 7-09: Create "Nightly Maintenance" template
- **Steps**:
  1. Review All Code Written Today
  2. Security Scan All Projects
  3. Memory Cleanup & Consolidation
  4. Generate Daily Report
- **Trigger**: schedule (daily 2 AM Africa/Casablanca)
- **Time**: 10 min

### Task 7-10: Create workflow execution engine in Bridge API
- **File**: `/root/genplatform-api/engine/workflow-runner.js`
- **Requirements**:
  - Reads workflow template steps from Supabase
  - Executes steps in order:
    - Action steps: sends command to OpenClaw, waits for completion
    - Approval steps: pauses workflow, notifies owner, waits for approval
    - Loop steps: iterates over project tasks
  - Logs each step result to workflow_runs.logs
  - Updates: current_step, steps_completed, status
  - On failure: logs error, marks step as failed, notifies owner
- **Time**: 15 min

### Task 7-11: Create workflow run detail page
- **Page**: `/automations/[id]/runs` or modal
- **Requirements**:
  - Shows ordered list of steps with status:
    - Step 1: Research — completed (3m 22s)
    - Step 2: Plan — completed (5m 10s)
    - Step 3: Approval — waiting for owner
    - Step 4: Tasks — pending
    - Step 5: Code — pending
  - Click on completed step → shows logs/output
  - Approval step: "Approve" / "Reject" buttons
- **Time**: 15 min

### Task 7-12: Create workflow approval notification
- **Requirements**:
  - When workflow hits an approval step:
    - Bell notification: "Workflow [name] needs your approval at Step [N]"
    - Dashboard card: "Approval needed: [workflow name]"
    - Click either → go to workflow run detail → approval step
    - Buttons: "Approve & Continue" | "Reject & Stop"
- **Time**: 10 min

### Task 7-13: Create Bridge API endpoint: POST /api/workflows/run
- **Requirements**:
  - Receives: `{ workflowId, projectId }`
  - Validates: user has permission, workflow exists
  - Starts the workflow execution engine (async — returns immediately)
  - Creates workflow_runs entry
  - Returns: `{ success, runId }`
- **Time**: 10 min

### Task 7-14: Create Bridge API endpoint: POST /api/workflows/approve
- **Requirements**:
  - Receives: `{ runId }`
  - Validates: only OWNER/ADMIN can approve
  - Updates workflow_runs: resumes from paused step
  - Triggers execution engine to continue
  - Returns: `{ success }`
- **Time**: 5 min

### Task 7-15: Create Bridge API endpoint: GET /api/workflows
- **Requirements**:
  - Returns: all workflows with last run info
  - Includes: isActive, lastRunAt, lastRunStatus, triggerType
- **Time**: 5 min

### Task 7-16: Create Bridge API endpoint: GET /api/workflows/[id]/runs
- **Requirements**:
  - Returns: run history for a workflow
  - Each run: id, status, startedAt, completedAt, stepsCompleted/stepsTotal
- **Time**: 5 min

### Task 7-17: Wire "New Idea" submission to trigger workflow
- **Requirements**:
  - When new idea is created in /api/ideas:
    - Check if "Idea to MVP" workflow is active
    - If active → automatically start it with this idea as context
    - Show in Ideas Lab: "Automated pipeline started..."
- **Time**: 10 min

### Task 7-18: Wire task completion to trigger workflow
- **Requirements**:
  - When a task is marked 'done' in /api/tasks/update:
    - Check for workflows with trigger_type='task_complete'
    - If found and active → start them
- **Time**: 10 min

## Total Time Estimate: 185 minutes (3 hours 5 minutes)

## Status: Ready to Begin
- [ ] All 18 tasks defined and documented
- [ ] Time estimates provided for each task
- [ ] Technical requirements specified
- [ ] Ready for systematic implementation

**Next**: Start with Task 7-01 and proceed sequentially through all 18 tasks.