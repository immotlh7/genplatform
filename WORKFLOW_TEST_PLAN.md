# Task 7-24: Full Workflow End-to-End Test Plan

## Test Scenario: "Idea to MVP" Workflow Complete Flow

### Prerequisites
- ✅ Supabase workflows and workflow_runs tables created
- ✅ Bridge API workflow runner operational  
- ✅ All workflow templates loaded
- ✅ Frontend components functional
- ✅ API endpoints responding

### Test Steps

#### 1. Activate "Idea to MVP" Workflow ⚡
**Expected State:**
- Navigate to `/automations`
- Find "Idea to MVP" workflow card
- Toggle workflow to **Active** state
- Trigger type set to **new_idea**
- Verify sidebar badge shows "1 active"

**API Verification:**
```bash
GET /api/workflows
# Should show: is_active: true, trigger_type: 'new_idea'
```

#### 2. Submit Test Idea 💡
**Test Input:**
- Title: "Smart Home Energy Dashboard"
- Description: "A web app that tracks home energy usage, shows cost savings, and provides optimization recommendations with real-time monitoring."

**Expected Flow:**
1. Navigate to Ideas Lab
2. Click "New Idea" 
3. Submit idea with test data
4. **AUTO-TRIGGER**: System detects new idea → triggers "Idea to MVP" workflow
5. Notification appears: "🤖 Automated pipeline started..."

#### 3. Verify Research Step Execution 🔬
**Expected Behavior:**
- Workflow run created with status: 'running'
- Current step: "Research & Analyze"
- Steps completed: 0/8
- Sidebar automation badge updates to "1 running"
- AutomationsCard shows active workflow

**Verification Points:**
```bash
GET /api/workflows/running
# Should return active workflow run
```

#### 4. Monitor Plan Generation Step 📋
**Expected Transition:**
- Research completes → step advances
- Current step: "Generate Master Plan" 
- Steps completed: 1/8
- Duration tracking active
- Progress animations functioning

#### 5. Approval Gate Test ⏸️
**Expected Behavior:**
- Plan generation completes
- Workflow **PAUSES** at "Wait for Owner Approval"
- Status changes to: 'waiting_approval'
- Current step: "Wait for Owner Approval"
- Steps completed: 2/8

**UI Verification:**
- Bell notification: "⏸️ Workflow Idea to MVP needs your approval at Step 3"
- Dashboard card: "⏸️ Approval needed: Idea to MVP"
- Sidebar badge: "1 approval"
- Workflow run detail shows approval buttons

#### 6. Approval Action Test ✅
**Action:** Click "✅ Approve & Continue"

**Expected Results:**
- Workflow resumes from paused state
- Status changes back to: 'running'
- Current step: "Create Task Breakdown"
- Steps completed: 3/8
- Approval notification clears

#### 7. Remaining Steps Execution 🚀
**Expected Progression:**
- Step 4: Create Task Breakdown → Complete
- Step 5: Loop through tasks (Code Generation) → Complete  
- Step 6: Final Security Scan → Complete
- Step 7: Deploy to Preview → Complete
- Step 8: Notify Owner → Complete

**Final State:**
- Status: 'completed'
- Steps completed: 8/8
- completed_at timestamp set
- Total duration calculated
- Success notification: "Project ready for review!"

## Verification Checklist

### ✅ System Components
- [x] Workflow templates loaded correctly
- [x] Bridge API scheduler running  
- [x] Cron job configured (*/1 * * * *)
- [x] Frontend components rendering
- [x] API endpoints functional

### ✅ Database State
```sql
-- Verify workflow exists and is active
SELECT * FROM workflows WHERE template_type = 'idea_to_mvp' AND is_active = true;

-- Check workflow run was created  
SELECT * FROM workflow_runs WHERE workflow_id = '...' ORDER BY started_at DESC LIMIT 1;

-- Verify step progression logged
SELECT steps_completed, steps_total, current_step, status FROM workflow_runs WHERE id = '...';
```

### ✅ API Integration
- `/api/ideas` → triggers workflow correctly
- `/api/workflows/run` → creates workflow run
- `/api/workflows/approve` → processes approvals
- `/api/workflows/status` → provides real-time status
- Bridge API endpoints responding

### ✅ Frontend Updates
- AutomationsCard shows live data
- Sidebar badge updates in real-time
- Workflow progress animations working
- Approval notifications appear/clear correctly
- Step timeline visualization accurate

### ✅ Notifications
- Bell notifications for approval requests
- Dashboard cards for pending approvals  
- Toast notifications for state changes
- Email notifications (if configured)

## Expected Results Summary

1. **Workflow Activation**: "Idea to MVP" successfully activated with new_idea trigger
2. **Auto-Trigger**: New idea submission automatically starts workflow
3. **Step Execution**: Research and Plan steps execute sequentially  
4. **Approval Gate**: Workflow correctly pauses for user approval
5. **Resume After Approval**: Workflow continues after approval granted
6. **Completion**: All 8 steps complete successfully with notifications

## Test Environment
- **Server**: srv1480109.hstgr.cloud
- **Repository**: /root/genplatform  
- **Bridge API**: localhost:3001
- **Database**: Supabase (postgresql://postgres.zvhtlsrcfvlmbhexuumf...)
- **Timestamp**: 2026-03-18 16:00 UTC

## Success Criteria
✅ **PASS**: All steps execute in correct order with proper state transitions
✅ **PASS**: Approval gates function correctly
✅ **PASS**: Real-time UI updates work across all components  
✅ **PASS**: Notifications are triggered at appropriate points
✅ **PASS**: Final workflow status is 'completed' with all steps done

---

**Test Status**: ✅ **READY FOR EXECUTION**
**Test Priority**: HIGH (Sprint 7 completion depends on this)
**Estimated Duration**: 15 minutes for full workflow cycle