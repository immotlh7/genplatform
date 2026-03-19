/**
 * Workflow Backup and Restore API
 * 
 * Provides endpoints for:
 * - Automated workflow backups
 * - Point-in-time restoration
 * - Backup scheduling
 * - Cross-environment migration
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { z } from 'zod';
import crypto from 'crypto';
import { Readable } from 'stream';

// Validation schemas
const backupRequestSchema = z.object({
  workflowIds: z.array(z.string()).optional(),
  includeExecutions: z.boolean().optional().default(false),
  includeSchedules: z.boolean().optional().default(true),
  compress: z.boolean().optional().default(true),
  encrypt: z.boolean().optional().default(false),
  encryptionKey: z.string().optional()
});

const restoreRequestSchema = z.object({
  backupId: z.string().optional(),
  backupData: z.any().optional(),
  targetEnvironment: z.string().optional(),
  overwrite: z.boolean().optional().default(false),
  dryRun: z.boolean().optional().default(false)
});

const scheduleBackupSchema = z.object({
  workflowIds: z.array(z.string()).optional(),
  schedule: z.string(), // cron expression
  retentionDays: z.number().min(1).max(365).default(30),
  destination: z.enum(['local', 'cloud', 's3']).default('local'),
  compress: z.boolean().default(true),
  encrypt: z.boolean().default(true)
});

// Types
interface BackupMetadata {
  id: string;
  timestamp: Date;
  version: string;
  workflowCount: number;
  size: number;
  compressed: boolean;
  encrypted: boolean;
  checksum: string;
}

interface BackupData {
  metadata: BackupMetadata;
  workflows: any[];
  schedules?: any[];
  executions?: any[];
}

interface RestoreResult {
  success: boolean;
  restoredWorkflows: string[];
  errors: string[];
  warnings: string[];
}

// POST /api/workflows/backup - Create backup
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = backupRequestSchema.parse(body);

    // Fetch workflows to backup
    let workflowsQuery = supabase.from('workflows').select('*');
    if (validatedData.workflowIds && validatedData.workflowIds.length > 0) {
      workflowsQuery = workflowsQuery.in('id', validatedData.workflowIds);
    }

    const { data: workflows, error: workflowError } = await workflowsQuery;
    if (workflowError) throw workflowError;

    if (!workflows || workflows.length === 0) {
      return NextResponse.json(
        { error: 'No workflows found to backup' },
        { status: 404 }
      );
    }

    // Prepare backup data
    let backupData: BackupData = {
      metadata: {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        version: '1.0.0',
        workflowCount: workflows.length,
        size: 0,
        compressed: validatedData.compress,
        encrypted: validatedData.encrypt,
        checksum: ''
      },
      workflows
    };

    // Include schedules if requested
    if (validatedData.includeSchedules) {
      const workflowIds = workflows.map(w => w.id);
      const { data: schedules } = await supabase
        .from('workflow_schedules')
        .select('*')
        .in('workflow_id', workflowIds);
      
      if (schedules) {
        backupData.schedules = schedules;
      }
    }

    // Include execution history if requested
    if (validatedData.includeExecutions) {
      const workflowIds = workflows.map(w => w.id);
      const { data: executions } = await supabase
        .from('workflow_executions')
        .select('*')
        .in('workflow_id', workflowIds)
        .order('created_at', { ascending: false })
        .limit(1000); // Limit to recent executions
      
      if (executions) {
        backupData.executions = executions;
      }
    }

    // Process backup data
    let processedData: string | Buffer = JSON.stringify(backupData, null, 2);
    
    // Compress if requested
    if (validatedData.compress) {
      const zlib = await import('zlib');
      processedData = await new Promise<Buffer>((resolve, reject) => {
        zlib.gzip(Buffer.from(processedData), (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    }

    // Encrypt if requested
    if (validatedData.encrypt) {
      if (!validatedData.encryptionKey) {
        return NextResponse.json(
          { error: 'Encryption key required when encryption is enabled' },
          { status: 400 }
        );
      }

      const cipher = crypto.createCipher('aes-256-gcm', validatedData.encryptionKey);
      const encrypted = Buffer.concat([
        cipher.update(processedData),
        cipher.final()
      ]);
      const authTag = cipher.getAuthTag();
      
      processedData = Buffer.concat([authTag, encrypted]);
    }

    // Calculate checksum
    const checksum = crypto
      .createHash('sha256')
      .update(processedData)
      .digest('hex');

    backupData.metadata.checksum = checksum;
    backupData.metadata.size = Buffer.byteLength(processedData);

    // Store backup metadata in database
    const { error: insertError } = await supabase
      .from('workflow_backups')
      .insert({
        id: backupData.metadata.id,
        workflow_ids: workflows.map(w => w.id),
        metadata: backupData.metadata,
        created_at: new Date()
      });

    if (insertError) {
      console.error('Error storing backup metadata:', insertError);
    }

    // Return backup data
    const response = new NextResponse(processedData);
    response.headers.set('Content-Type', validatedData.compress ? 'application/gzip' : 'application/json');
    response.headers.set('Content-Disposition', `attachment; filename="workflow-backup-${backupData.metadata.id}.${validatedData.compress ? 'gz' : 'json'}"`);
    response.headers.set('X-Backup-ID', backupData.metadata.id);
    response.headers.set('X-Backup-Checksum', checksum);

    return response;

  } catch (error) {
    console.error('Backup error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}

// PUT /api/workflows/backup - Restore from backup
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = restoreRequestSchema.parse(body);

    let backupData: BackupData;

    // Load backup data
    if (validatedData.backupId) {
      // Fetch from database
      const { data: backupRecord, error } = await supabase
        .from('workflow_backups')
        .select('*')
        .eq('id', validatedData.backupId)
        .single();

      if (error || !backupRecord) {
        return NextResponse.json(
          { error: 'Backup not found' },
          { status: 404 }
        );
      }

      // In a real implementation, backup data would be fetched from storage
      // For now, we'll use the metadata
      return NextResponse.json(
        { error: 'Backup restoration from ID not yet implemented' },
        { status: 501 }
      );
    } else if (validatedData.backupData) {
      backupData = validatedData.backupData;
    } else {
      return NextResponse.json(
        { error: 'Either backupId or backupData must be provided' },
        { status: 400 }
      );
    }

    // Validate backup data structure
    if (!backupData.metadata || !backupData.workflows) {
      return NextResponse.json(
        { error: 'Invalid backup data structure' },
        { status: 400 }
      );
    }

    const result: RestoreResult = {
      success: true,
      restoredWorkflows: [],
      errors: [],
      warnings: []
    };

    // Dry run mode - validate without making changes
    if (validatedData.dryRun) {
      for (const workflow of backupData.workflows) {
        // Check if workflow already exists
        const { data: existing } = await supabase
          .from('workflows')
          .select('id, name')
          .eq('id', workflow.id)
          .single();

        if (existing && !validatedData.overwrite) {
          result.warnings.push(`Workflow ${workflow.name} (${workflow.id}) already exists`);
        } else {
          result.restoredWorkflows.push(workflow.id);
        }
      }

      return NextResponse.json({
        ...result,
        message: 'Dry run completed - no changes made'
      });
    }

    // Restore workflows
    for (const workflow of backupData.workflows) {
      try {
        // Check if workflow exists
        const { data: existing } = await supabase
          .from('workflows')
          .select('id')
          .eq('id', workflow.id)
          .single();

        if (existing) {
          if (validatedData.overwrite) {
            // Update existing workflow
            const { error: updateError } = await supabase
              .from('workflows')
              .update(workflow)
              .eq('id', workflow.id);

            if (updateError) {
              result.errors.push(`Failed to update workflow ${workflow.id}: ${updateError.message}`);
            } else {
              result.restoredWorkflows.push(workflow.id);
            }
          } else {
            result.warnings.push(`Skipped existing workflow ${workflow.id}`);
          }
        } else {
          // Insert new workflow
          const { error: insertError } = await supabase
            .from('workflows')
            .insert(workflow);

          if (insertError) {
            result.errors.push(`Failed to restore workflow ${workflow.id}: ${insertError.message}`);
          } else {
            result.restoredWorkflows.push(workflow.id);
          }
        }
      } catch (error) {
        result.errors.push(`Error restoring workflow ${workflow.id}: ${error}`);
      }
    }

    // Restore schedules if included
    if (backupData.schedules) {
      for (const schedule of backupData.schedules) {
        try {
          // Only restore if workflow was restored
          if (result.restoredWorkflows.includes(schedule.workflow_id)) {
            const { error } = await supabase
              .from('workflow_schedules')
              .upsert(schedule);
            
            if (error) {
              result.warnings.push(`Failed to restore schedule for workflow ${schedule.workflow_id}`);
            }
          }
        } catch (error) {
          result.warnings.push(`Error restoring schedule: ${error}`);
        }
      }
    }

    // Log restore operation
    await supabase.from('workflow_restore_logs').insert({
      backup_id: backupData.metadata.id,
      restored_at: new Date(),
      restored_workflows: result.restoredWorkflows,
      errors: result.errors,
      warnings: result.warnings
    });

    result.success = result.errors.length === 0;

    return NextResponse.json(result);

  } catch (error) {
    console.error('Restore error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to restore backup' },
      { status: 500 }
    );
  }
}

// GET /api/workflows/backup - List backups or download specific backup
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const backupId = searchParams.get('id');

  try {
    if (backupId) {
      // Get specific backup
      const { data, error } = await supabase
        .from('workflow_backups')
        .select('*')
        .eq('id', backupId)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: 'Backup not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(data);
    } else {
      // List all backups
      const limit = parseInt(searchParams.get('limit') || '20');
      const offset = parseInt(searchParams.get('offset') || '0');

      const { data, error, count } = await supabase
        .from('workflow_backups')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return NextResponse.json({
        backups: data || [],
        total: count || 0,
        limit,
        offset
      });
    }
  } catch (error) {
    console.error('Error fetching backups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch backups' },
      { status: 500 }
    );
  }
}

// DELETE /api/workflows/backup - Delete backup
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const backupId = searchParams.get('id');

  if (!backupId) {
    return NextResponse.json(
      { error: 'Backup ID required' },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabase
      .from('workflow_backups')
      .delete()
      .eq('id', backupId);

    if (error) throw error;

    return NextResponse.json({
      message: 'Backup deleted successfully',
      backupId
    });
  } catch (error) {
    console.error('Error deleting backup:', error);
    return NextResponse.json(
      { error: 'Failed to delete backup' },
      { status: 500 }
    );
  }
}

// PATCH /api/workflows/backup - Schedule automatic backups
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = scheduleBackupSchema.parse(body);

    const scheduleId = crypto.randomUUID();

    // Store backup schedule
    const { error } = await supabase
      .from('workflow_backup_schedules')
      .insert({
        id: scheduleId,
        workflow_ids: validatedData.workflowIds,
        schedule: validatedData.schedule,
        retention_days: validatedData.retentionDays,
        destination: validatedData.destination,
        compress: validatedData.compress,
        encrypt: validatedData.encrypt,
        created_at: new Date(),
        active: true
      });

    if (error) throw error;

    return NextResponse.json({
      message: 'Backup schedule created successfully',
      scheduleId
    });

  } catch (error) {
    console.error('Schedule error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid schedule data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create backup schedule' },
      { status: 500 }
    );
  }
}