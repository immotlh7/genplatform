# Workflow API Documentation

Complete API reference for GenPlatform.ai Workflow Automation System

## Overview

The Workflow API provides comprehensive automation capabilities with 25 pre-built workflow templates, real-time execution monitoring, approval systems, and detailed analytics. All endpoints require authentication and proper permissions.

## Base URL

```
https://your-domain.com/api/workflows
```

## Authentication

All workflow endpoints require authentication via:
- **Owner**: Cookie-based authentication (`auth-token`)
- **Team Members**: Supabase JWT tokens

**Required Permissions**: OWNER or ADMIN role for most operations.

---

## Endpoints

### 1. List All Workflows

Get all available workflows with statistics and run information.

```http
GET /api/workflows
```

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `include_inactive` | boolean | `false` | Include inactive workflows |
| `template_type` | string | - | Filter by template type |
| `trigger_type` | string | - | Filter by trigger type (`auto`, `manual`) |
| `limit` | integer | `50` | Maximum workflows to return |
| `offset` | integer | `0` | Number of workflows to skip |

#### Response

```json
{
  "success": true,
  "data": {
    "workflows": [
      {
        "id": "wf-001",
        "name": "Idea to MVP",
        "description": "Transform ideas into complete MVPs",
        "template_type": "development",
        "is_active": true,
        "trigger_type": "auto",
        "schedule": null,
        "config": {
          "steps": [/* workflow steps */],
          "estimated_total_duration": "2 hours"
        },
        "last_run_at": "2026-03-18T16:30:00Z",
        "last_run_status": "completed",
        "created_at": "2026-03-15T10:00:00Z",
        "updated_at": "2026-03-18T14:20:00Z",
        "runStatistics": {
          "totalRuns": 15,
          "runningRuns": 1,
          "completedRuns": 12,
          "failedRuns": 1,
          "waitingApprovalRuns": 1,
          "successRate": 85
        },
        "latestRun": {
          "id": "run-001",
          "status": "running",
          "started_at": "2026-03-18T16:30:00Z",
          "steps_completed": 3,
          "steps_total": 8
        },
        "estimatedDuration": "2 hours",
        "stepCount": 8
      }
    ],
    "pagination": {
      "limit": 50,
      "offset": 0,
      "total": 5,
      "hasMore": false
    },
    "statistics": {
      "totalWorkflows": 5,
      "activeWorkflows": 5,
      "totalRuns": 45,
      "runningRuns": 2,
      "completedRuns": 38,
      "failedRuns": 3,
      "waitingApprovalRuns": 2,
      "successRate": 87
    }
  }
}
```

---

### 2. Start Workflow Execution

Trigger a workflow to start running.

```http
POST /api/workflows/run
```

#### Request Body

```json
{
  "workflowId": "wf-001",
  "projectId": "proj-123", // Optional
  "triggerContext": {      // Optional
    "ideaId": "idea-456",
    "ideaTitle": "New Feature Request",
    "priority": "high"
  },
  "priority": "medium"     // Optional: low, medium, high
}
```

#### Response

```json
{
  "success": true,
  "message": "Workflow started successfully",
  "data": {
    "runId": "run-789",
    "workflowId": "wf-001",
    "workflowName": "Idea to MVP",
    "status": "running",
    "stepsTotal": 8,
    "estimatedDuration": "2 hours",
    "startedAt": "2026-03-18T17:00:00Z",
    "startedBy": "owner@example.com"
  }
}
```

---

### 3. Approve Workflow

Approve a workflow that is waiting for manual approval.

```http
POST /api/workflows/approve
```

#### Request Body

```json
{
  "runId": "run-789",
  "approvalNotes": "Approved after review" // Optional
}
```

#### Response

```json
{
  "success": true,
  "message": "Workflow approved and execution resumed",
  "data": {
    "runId": "run-789",
    "workflowId": "wf-001",
    "workflowName": "Idea to MVP",
    "approvedBy": "admin@example.com",
    "approvedAt": "2026-03-18T17:15:00Z",
    "status": "running",
    "nextStep": "Resuming execution..."
  }
}
```

#### Get Pending Approvals

```http
GET /api/workflows/approve
```

#### Response

```json
{
  "success": true,
  "data": {
    "pendingApprovals": [
      {
        "id": "run-789",
        "workflow_id": "wf-001",
        "status": "waiting_approval",
        "current_step": "Wait for Owner Approval",
        "started_at": "2026-03-18T16:30:00Z",
        "workflows": {
          "id": "wf-001",
          "name": "Idea to MVP",
          "template_type": "development"
        }
      }
    ],
    "count": 1
  }
}
```

---

### 4. Get Workflow Run History

Get execution history for a specific workflow.

```http
GET /api/workflows/{workflowId}/runs
```

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | - | Filter by status (`running`, `completed`, `failed`, `waiting_approval`) |
| `limit` | integer | `20` | Maximum runs to return |
| `offset` | integer | `0` | Number of runs to skip |
| `include_details` | boolean | `false` | Include detailed logs |

#### Response

```json
{
  "success": true,
  "data": {
    "workflow": {
      "id": "wf-001",
      "name": "Idea to MVP",
      "templateType": "development",
      "isActive": true
    },
    "runs": [
      {
        "id": "run-789",
        "status": "completed",
        "currentStep": null,
        "stepsCompleted": 8,
        "stepsTotal": 8,
        "progress": 100,
        "startedAt": "2026-03-18T16:30:00Z",
        "completedAt": "2026-03-18T18:15:00Z",
        "duration": "1h 45m",
        "durationMs": 6300000,
        "startedBy": "auto-trigger",
        "approvedBy": "admin@example.com",
        "approvedAt": "2026-03-18T17:00:00Z",
        "errorMessage": null,
        "project": {
          "id": "proj-123",
          "name": "Sample Project"
        }
      }
    ],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "total": 15,
      "hasMore": false
    },
    "statistics": {
      "total": 15,
      "running": 1,
      "completed": 12,
      "failed": 1,
      "waitingApproval": 1,
      "successRate": 85,
      "averageDuration": "1h 30m",
      "averageDurationMs": 5400000
    }
  }
}
```

---

### 5. Get Workflow Analytics & Metrics

Get comprehensive analytics and performance metrics for workflows.

```http
GET /api/workflows/metrics
```

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `timeRange` | string | `24h` | Time range (`1h`, `24h`, `7d`, `30d`) |
| `workflowId` | string | - | Specific workflow to analyze |
| `templateType` | string | - | Filter by template type |
| `groupBy` | string | `hour` | Group trend data by (`hour`, `day`, `week`) |
| `includeDetails` | boolean | `false` | Include detailed analysis |

#### Response

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalRuns": 150,
      "successfulRuns": 128,
      "failedRuns": 12,
      "runningRuns": 8,
      "waitingApprovalRuns": 2,
      "successRate": 85,
      "averageDuration": 5400000,
      "totalDuration": 810000000
    },
    "trends": {
      "timeRange": "24h",
      "groupBy": "hour",
      "dataPoints": [
        {
          "timestamp": "2026-03-18T16:00:00Z",
          "period": "16:00",
          "runs": 5,
          "successes": 4,
          "failures": 1,
          "successRate": 80,
          "averageDuration": 5400000
        }
      ]
    },
    "workflows": [
      {
        "id": "wf-001",
        "name": "Idea to MVP",
        "templateType": "development",
        "totalRuns": 45,
        "successRate": 87,
        "averageDuration": 6300000,
        "lastRun": "2026-03-18T16:30:00Z",
        "status": "active"
      }
    ],
    "performance": {
      "fastestWorkflow": {
        "name": "Bug Fix",
        "duration": 900
      },
      "slowestWorkflow": {
        "name": "Deploy Pipeline",
        "duration": 1800
      },
      "mostReliableWorkflow": {
        "name": "Nightly Maintenance",
        "successRate": 98
      },
      "leastReliableWorkflow": {
        "name": "New Feature",
        "successRate": 75
      },
      "busyHours": [
        { "hour": 14, "count": 25 },
        { "hour": 15, "count": 22 }
      ],
      "peakDay": {
        "day": "Mon Mar 18 2026",
        "count": 45
      }
    },
    "issues": {
      "failureReasons": [
        {
          "reason": "Timeout",
          "count": 5,
          "percentage": 42
        },
        {
          "reason": "Permission Denied",
          "count": 3,
          "percentage": 25
        }
      ],
      "bottleneckSteps": [
        {
          "step": "Wait for Owner Approval",
          "averageDuration": 3600000,
          "workflow": "Idea to MVP"
        }
      ],
      "timeoutRuns": 5,
      "retryCount": 8
    }
  },
  "metadata": {
    "timeRange": "24h",
    "groupBy": "hour",
    "workflowId": null,
    "templateType": null,
    "includeDetails": false,
    "generatedAt": "2026-03-18T17:30:00Z",
    "runCount": 150
  }
}
```

---

## Workflow Templates

### Available Templates

| Template | Description | Trigger Events | Estimated Duration |
|----------|-------------|----------------|-------------------|
| **Idea to MVP** | Transform ideas into complete MVPs | `idea_submitted` | 2-4 hours |
| **Bug Fix** | Automated bug detection and resolution | `bug_reported`, `task_failed` | 30-60 minutes |
| **New Feature** | End-to-end feature development | `feature_requested` | 1-3 hours |
| **Deploy Pipeline** | Automated deployment and testing | `deployment_requested` | 15-30 minutes |
| **Nightly Maintenance** | System maintenance and optimization | `scheduled_maintenance` | 20-45 minutes |

### Workflow Step Types

| Type | Description | Example |
|------|-------------|---------|
| `action` | Executes commands via OpenClaw | Code generation, testing, deployment |
| `approval` | Pauses for manual approval | Owner review before production deploy |
| `loop` | Iterates over multiple items | Process each task in project |
| `notification` | Sends alerts and updates | Email/Slack notifications |

---

## Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `400` | Bad Request - Invalid parameters | Check request format and parameters |
| `403` | Forbidden - Insufficient permissions | Requires OWNER or ADMIN role |
| `404` | Not Found - Workflow/run not found | Verify workflow/run ID exists |
| `500` | Internal Server Error | Contact support if persistent |
| `503` | Service Unavailable | Workflow service temporarily down |

---

## Auto-Trigger Events

Workflows can be automatically triggered by platform events:

### Event Types

| Event | Description | Triggered Workflows |
|-------|-------------|-------------------|
| `idea_submitted` | New idea created | Idea to MVP |
| `task_failed` | Task execution failed | Bug Fix |
| `bug_reported` | Bug report submitted | Bug Fix |
| `feature_requested` | Feature request created | New Feature |
| `deployment_requested` | Deployment initiated | Deploy Pipeline |
| `scheduled_maintenance` | Nightly maintenance | Nightly Maintenance |

### Trigger Configuration

```javascript
import { onIdeaSubmitted, onTaskFailed } from '@/lib/workflow-triggers'

// Auto-trigger on idea submission
await onIdeaSubmitted('idea-123', 'user-456', {
  title: 'Mobile App Feature',
  complexity: 'medium',
  priority: 'high'
})

// Auto-trigger on task failure
await onTaskFailed('task-789', 'Compilation failed: syntax error', 'user-456', 'proj-123')
```

---

## Rate Limits

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| `GET /workflows` | 100 requests | 1 minute |
| `POST /workflows/run` | 10 requests | 1 minute |
| `POST /workflows/approve` | 50 requests | 1 minute |
| `GET /workflows/metrics` | 20 requests | 1 minute |

---

## Security

- All endpoints require authentication
- Workflow execution requires ADMIN+ permissions
- All actions are logged in security events
- Approval workflows have audit trails
- Rate limiting prevents abuse

---

## Integration Examples

### JavaScript/TypeScript

```javascript
// Start a workflow
async function startWorkflow(workflowId, context) {
  const response = await fetch('/api/workflows/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      workflowId,
      triggerContext: context,
      priority: 'medium'
    })
  })
  
  return await response.json()
}

// Check for pending approvals
async function getPendingApprovals() {
  const response = await fetch('/api/workflows/approve', {
    credentials: 'include'
  })
  
  const data = await response.json()
  return data.data.pendingApprovals
}

// Get workflow metrics
async function getWorkflowMetrics(timeRange = '24h') {
  const response = await fetch(`/api/workflows/metrics?timeRange=${timeRange}`, {
    credentials: 'include'
  })
  
  return await response.json()
}
```

### cURL Examples

```bash
# Get all workflows
curl -X GET "https://your-domain.com/api/workflows" \
  -H "Cookie: auth-token=your-token"

# Start workflow
curl -X POST "https://your-domain.com/api/workflows/run" \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=your-token" \
  -d '{
    "workflowId": "wf-001",
    "priority": "high",
    "triggerContext": {
      "ideaTitle": "New Feature",
      "priority": "high"
    }
  }'

# Approve workflow
curl -X POST "https://your-domain.com/api/workflows/approve" \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=your-token" \
  -d '{
    "runId": "run-789",
    "approvalNotes": "Approved for production"
  }'

# Get metrics
curl -X GET "https://your-domain.com/api/workflows/metrics?timeRange=7d&groupBy=day" \
  -H "Cookie: auth-token=your-token"
```

---

## Troubleshooting

### Common Issues

1. **Workflow Not Starting**
   - Check workflow is active: `is_active: true`
   - Verify sufficient permissions (ADMIN+)
   - Ensure workflow has valid step configuration

2. **Approval Timeout**
   - Check for pending approvals: `GET /api/workflows/approve`
   - Verify approver has sufficient permissions
   - Review workflow logs for approval step details

3. **Failed Executions**
   - Review workflow run logs: `include_details: true`
   - Check OpenClaw API connectivity
   - Verify workflow step configuration

4. **Performance Issues**
   - Use metrics API to identify bottlenecks
   - Review peak usage times
   - Check workflow step durations

### Support

For additional support:
- Check workflow run logs for detailed error information
- Review security events for authentication issues
- Contact platform administrators for permission issues

---

*Last Updated: 2026-03-18*  
*API Version: 1.0*