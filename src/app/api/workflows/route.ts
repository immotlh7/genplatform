import { NextResponse } from 'next/server';

export async function GET() {
  // Return demo workflows data so automations page loads
  return NextResponse.json({
    workflows: [
      {
        id: 'wf-1',
        name: 'Idea to MVP',
        description: 'Transform ideas into minimum viable products',
        status: 'active',
        steps: 8,
        completedSteps: 3,
        lastRun: new Date().toISOString(),
        totalRuns: 15,
        successRate: 85,
        trigger: 'manual',
        category: 'development'
      },
      {
        id: 'wf-2',
        name: 'Bug Fix Pipeline',
        description: 'Automated bug detection and fix workflow',
        status: 'active',
        steps: 5,
        completedSteps: 2,
        lastRun: new Date().toISOString(),
        totalRuns: 30,
        successRate: 92,
        trigger: 'automatic',
        category: 'maintenance'
      },
      {
        id: 'wf-3',
        name: 'Deploy Pipeline',
        description: 'Build, test, and deploy to production',
        status: 'completed',
        steps: 6,
        completedSteps: 6,
        lastRun: new Date().toISOString(),
        totalRuns: 45,
        successRate: 95,
        trigger: 'git-push',
        category: 'deployment'
      }
    ],
    total: 3,
    active: 2
  });
}
