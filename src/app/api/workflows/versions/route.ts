import { NextRequest, NextResponse } from 'next/server';

/**
 * Workflow Versioning API
 * Handles template version control, rollback capabilities, change tracking, and version comparison
 */

interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: string;
  name: string;
  description: string;
  template: any; // Workflow template object
  createdAt: Date;
  createdBy: string;
  status: 'draft' | 'active' | 'deprecated' | 'archived';
  changeLog: VersionChange[];
  tags: string[];
  metadata: {
    parentVersion?: string;
    branchName?: string;
    commitMessage?: string;
    isBackup?: boolean;
  };
}

interface VersionChange {
  id: string;
  type: 'created' | 'updated' | 'deleted' | 'renamed' | 'moved';
  component: 'workflow' | 'step' | 'connection' | 'variable' | 'trigger';
  componentId: string;
  description: string;
  oldValue?: any;
  newValue?: any;
  timestamp: Date;
  author: string;
}

interface VersionComparison {
  versionA: string;
  versionB: string;
  differences: VersionDifference[];
  compatibilityScore: number;
  migrationRequired: boolean;
  recommendations: string[];
}

interface VersionDifference {
  type: 'added' | 'removed' | 'modified' | 'moved';
  path: string;
  component: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'breaking';
  oldValue?: any;
  newValue?: any;
}

// Mock data for development
const mockVersions: WorkflowVersion[] = [
  {
    id: 'v1',
    workflowId: 'wf1',
    version: '1.0.0',
    name: 'Initial Version',
    description: 'First stable release of the data processing workflow',
    template: { steps: [], connections: [], variables: {} },
    createdAt: new Date('2026-03-10'),
    createdBy: 'user1',
    status: 'deprecated',
    changeLog: [],
    tags: ['stable', 'production'],
    metadata: { commitMessage: 'Initial workflow creation' }
  },
  {
    id: 'v2',
    workflowId: 'wf1',
    version: '1.1.0',
    name: 'Performance Improvements',
    description: 'Added caching and optimized database queries',
    template: { steps: [], connections: [], variables: {} },
    createdAt: new Date('2026-03-15'),
    createdBy: 'user1',
    status: 'active',
    changeLog: [
      {
        id: 'c1',
        type: 'updated',
        component: 'step',
        componentId: 'step1',
        description: 'Added caching mechanism',
        timestamp: new Date('2026-03-15'),
        author: 'user1'
      }
    ],
    tags: ['performance', 'production'],
    metadata: { 
      parentVersion: '1.0.0',
      commitMessage: 'Optimize performance with caching' 
    }
  }
];

// GET /api/workflows/versions?workflowId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');
    const version = searchParams.get('version');
    const includeArchived = searchParams.get('includeArchived') === 'true';

    if (version && workflowId) {
      // Get specific version
      const versionData = mockVersions.find(
        v => v.workflowId === workflowId && v.version === version
      );

      if (!versionData) {
        return NextResponse.json(
          { error: 'Version not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        version: versionData
      });
    }

    if (workflowId) {
      // Get all versions for a workflow
      let versions = mockVersions.filter(v => v.workflowId === workflowId);

      if (!includeArchived) {
        versions = versions.filter(v => v.status !== 'archived');
      }

      // Sort by version number (descending)
      versions.sort((a, b) => {
        const aVersion = parseVersion(a.version);
        const bVersion = parseVersion(b.version);
        return bVersion.major - aVersion.major || 
               bVersion.minor - aVersion.minor || 
               bVersion.patch - aVersion.patch;
      });

      return NextResponse.json({
        success: true,
        versions,
        total: versions.length,
        activeVersion: versions.find(v => v.status === 'active')?.version
      });
    }

    // Get all versions across all workflows
    const allVersions = includeArchived 
      ? mockVersions 
      : mockVersions.filter(v => v.status !== 'archived');

    return NextResponse.json({
      success: true,
      versions: allVersions,
      total: allVersions.length
    });

  } catch (error) {
    console.error('Error fetching workflow versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}

// POST /api/workflows/versions - Create new version
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      workflowId, 
      name, 
      description, 
      template, 
      tags = [], 
      metadata = {},
      versionType = 'minor' // major, minor, patch
    } = body;

    if (!workflowId || !name || !template) {
      return NextResponse.json(
        { error: 'Missing required fields: workflowId, name, template' },
        { status: 400 }
      );
    }

    // Get current versions for this workflow
    const existingVersions = mockVersions.filter(v => v.workflowId === workflowId);
    const currentVersion = existingVersions.find(v => v.status === 'active');

    // Generate new version number
    const newVersionNumber = generateNextVersion(
      existingVersions.map(v => v.version),
      versionType
    );

    // Detect changes from current version
    const changeLog: VersionChange[] = currentVersion 
      ? detectChanges(currentVersion.template, template, 'user1')
      : [];

    // Create new version
    const newVersion: WorkflowVersion = {
      id: `v${Date.now()}`,
      workflowId,
      version: newVersionNumber,
      name,
      description,
      template,
      createdAt: new Date(),
      createdBy: 'user1', // In real app, get from auth
      status: 'draft',
      changeLog,
      tags,
      metadata: {
        ...metadata,
        parentVersion: currentVersion?.version,
        commitMessage: metadata.commitMessage || `Version ${newVersionNumber}`
      }
    };

    // Add to mock data
    mockVersions.push(newVersion);

    console.log(`✅ Created workflow version ${newVersionNumber} for workflow ${workflowId}`);

    return NextResponse.json({
      success: true,
      version: newVersion,
      changesDetected: changeLog.length
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating workflow version:', error);
    return NextResponse.json(
      { error: 'Failed to create version' },
      { status: 500 }
    );
  }
}

// PUT /api/workflows/versions - Update version status or metadata
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflowId, version, status, tags, metadata } = body;

    if (!workflowId || !version) {
      return NextResponse.json(
        { error: 'Missing required fields: workflowId, version' },
        { status: 400 }
      );
    }

    const versionIndex = mockVersions.findIndex(
      v => v.workflowId === workflowId && v.version === version
    );

    if (versionIndex === -1) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    const oldVersion = mockVersions[versionIndex];

    // Update version
    if (status) {
      // If activating this version, deactivate others
      if (status === 'active') {
        mockVersions.forEach(v => {
          if (v.workflowId === workflowId && v.status === 'active') {
            v.status = 'deprecated';
          }
        });
      }
      mockVersions[versionIndex].status = status;
    }

    if (tags) {
      mockVersions[versionIndex].tags = tags;
    }

    if (metadata) {
      mockVersions[versionIndex].metadata = {
        ...mockVersions[versionIndex].metadata,
        ...metadata
      };
    }

    console.log(`✅ Updated workflow version ${version} for workflow ${workflowId}`);

    return NextResponse.json({
      success: true,
      version: mockVersions[versionIndex],
      changes: {
        status: oldVersion.status !== mockVersions[versionIndex].status,
        tags: JSON.stringify(oldVersion.tags) !== JSON.stringify(mockVersions[versionIndex].tags),
        metadata: JSON.stringify(oldVersion.metadata) !== JSON.stringify(mockVersions[versionIndex].metadata)
      }
    });

  } catch (error) {
    console.error('Error updating workflow version:', error);
    return NextResponse.json(
      { error: 'Failed to update version' },
      { status: 500 }
    );
  }
}

// DELETE /api/workflows/versions - Delete/archive version
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');
    const version = searchParams.get('version');
    const permanent = searchParams.get('permanent') === 'true';

    if (!workflowId || !version) {
      return NextResponse.json(
        { error: 'Missing required parameters: workflowId, version' },
        { status: 400 }
      );
    }

    const versionIndex = mockVersions.findIndex(
      v => v.workflowId === workflowId && v.version === version
    );

    if (versionIndex === -1) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    const targetVersion = mockVersions[versionIndex];

    // Prevent deletion of active versions
    if (targetVersion.status === 'active') {
      return NextResponse.json(
        { error: 'Cannot delete active version. Please activate another version first.' },
        { status: 400 }
      );
    }

    if (permanent) {
      // Permanently delete
      mockVersions.splice(versionIndex, 1);
      console.log(`🗑️ Permanently deleted workflow version ${version} for workflow ${workflowId}`);
    } else {
      // Archive
      mockVersions[versionIndex].status = 'archived';
      console.log(`📦 Archived workflow version ${version} for workflow ${workflowId}`);
    }

    return NextResponse.json({
      success: true,
      action: permanent ? 'deleted' : 'archived',
      version: permanent ? { id: targetVersion.id, version } : mockVersions[versionIndex]
    });

  } catch (error) {
    console.error('Error deleting/archiving workflow version:', error);
    return NextResponse.json(
      { error: 'Failed to delete/archive version' },
      { status: 500 }
    );
  }
}

/**
 * Helper functions
 */

function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const parts = version.split('.').map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0
  };
}

function generateNextVersion(existingVersions: string[], versionType: 'major' | 'minor' | 'patch'): string {
  if (existingVersions.length === 0) {
    return '1.0.0';
  }

  // Find the highest version
  const versions = existingVersions.map(parseVersion);
  const highest = versions.reduce((max, current) => {
    if (current.major > max.major) return current;
    if (current.major === max.major && current.minor > max.minor) return current;
    if (current.major === max.major && current.minor === max.minor && current.patch > max.patch) return current;
    return max;
  });

  switch (versionType) {
    case 'major':
      return `${highest.major + 1}.0.0`;
    case 'minor':
      return `${highest.major}.${highest.minor + 1}.0`;
    case 'patch':
      return `${highest.major}.${highest.minor}.${highest.patch + 1}`;
    default:
      return `${highest.major}.${highest.minor + 1}.0`;
  }
}

function detectChanges(oldTemplate: any, newTemplate: any, author: string): VersionChange[] {
  const changes: VersionChange[] = [];
  const timestamp = new Date();

  // Simple change detection (in real implementation, use deep diff algorithm)
  if (JSON.stringify(oldTemplate) !== JSON.stringify(newTemplate)) {
    changes.push({
      id: `change_${Date.now()}`,
      type: 'updated',
      component: 'workflow',
      componentId: 'workflow',
      description: 'Workflow template updated',
      oldValue: oldTemplate,
      newValue: newTemplate,
      timestamp,
      author
    });
  }

  return changes;
}