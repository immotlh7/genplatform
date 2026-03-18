const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// POST /api/tasks/update
// Receives: { taskId, status, notes }
// Updates Supabase project_tasks table
// Also inserts event into task_events table
// Returns: { success, task }
router.post('/update', async (req, res) => {
  try {
    const { taskId, status, notes, actorRole = 'system' } = req.body;

    if (!taskId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: taskId, status'
      });
    }

    // First, get the current task to check if it exists and get project_id
    const { data: currentTask, error: fetchError } = await supabase
      .from('project_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (fetchError) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Update the task status
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    // Add completion timestamp if status is 'done'
    if (status === 'done' && currentTask.status !== 'done') {
      updateData.completed_at = new Date().toISOString();
    }

    // Add start timestamp if status is 'in_progress' and not already started
    if (status === 'in_progress' && currentTask.status === 'planned') {
      updateData.started_at = new Date().toISOString();
    }

    // Add review notes if provided
    if (notes) {
      updateData.review_notes = notes;
    }

    const { data: updatedTask, error: updateError } = await supabase
      .from('project_tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update task'
      });
    }

    // Insert event into task_events table
    const eventType = getEventType(currentTask.status, status);
    const eventDetails = {
      old_status: currentTask.status,
      new_status: status,
      notes: notes || null
    };

    const { error: eventError } = await supabase
      .from('task_events')
      .insert({
        task_id: taskId,
        project_id: currentTask.project_id,
        event_type: eventType,
        actor_role: actorRole,
        details: eventDetails
      });

    if (eventError) {
      console.error('Failed to log task event:', eventError);
      // Don't fail the request if event logging fails
    }

    res.json({
      success: true,
      task: updatedTask,
      event_logged: !eventError
    });

  } catch (error) {
    console.error('Task update error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/tasks/:projectId
// Returns: all tasks for project from Supabase
// Includes: status counts (planned, in_progress, review, done, blocked)
// Includes: completion percentage
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    // Fetch all tasks for the project
    const { data: tasks, error: tasksError } = await supabase
      .from('project_tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('number', { ascending: true });

    if (tasksError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch tasks'
      });
    }

    // Calculate status counts
    const statusCounts = {
      planned: 0,
      in_progress: 0,
      review: 0,
      done: 0,
      blocked: 0,
      skipped: 0
    };

    tasks.forEach(task => {
      if (statusCounts.hasOwnProperty(task.status)) {
        statusCounts[task.status]++;
      }
    });

    // Calculate completion percentage
    const totalTasks = tasks.length;
    const completedTasks = statusCounts.done + statusCounts.skipped;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      success: true,
      tasks,
      statusCounts,
      totalTasks,
      completedTasks,
      completionPercentage
    });

  } catch (error) {
    console.error('Tasks fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

function getEventType(oldStatus, newStatus) {
  if (oldStatus === 'planned' && newStatus === 'in_progress') {
    return 'task_started';
  }
  if (newStatus === 'done') {
    return 'task_completed';
  }
  if (newStatus === 'blocked') {
    return 'task_blocked';
  }
  if (newStatus === 'review') {
    return 'task_review_requested';
  }
  return 'task_status_changed';
}

module.exports = router;