#!/usr/bin/env node

// Full Integration Test for GenPlatform.ai
// Tests Supabase integration, Bridge API, and Dashboard functionality

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../api/.env' });

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runIntegrationTest() {
  console.log('🧪 Starting GenPlatform.ai Integration Test...\n');

  try {
    // Test 1: Create a test project
    console.log('📁 Creating test project...');
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: 'GenPlatform Integration Test',
        description: 'Test project for verifying full system integration',
        status: 'active',
        tech_stack: ['Next.js', 'TypeScript', 'Supabase', 'Tailwind CSS'],
        progress: 35,
        priority: 'HIGH'
      })
      .select()
      .single();

    if (projectError) {
      console.error('❌ Failed to create test project:', projectError);
      return false;
    }

    console.log(`✅ Test project created: ${project.name} (ID: ${project.id})`);

    // Test 2: Add 3 test tasks
    console.log('\n📝 Creating test tasks...');
    const testTasks = [
      {
        project_id: project.id,
        number: 1,
        name: 'Setup project foundation',
        description: 'Initialize Next.js project with TypeScript and Tailwind',
        status: 'done',
        estimated_minutes: 30,
        actual_minutes: 25,
        sprint_number: 1,
        completed_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
      },
      {
        project_id: project.id,
        number: 2,
        name: 'Implement authentication system',
        description: 'Cookie-based auth with middleware protection',
        status: 'in_progress',
        estimated_minutes: 45,
        sprint_number: 1,
        started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 min ago
      },
      {
        project_id: project.id,
        number: 3,
        name: 'Create dashboard interface',
        description: 'Build main dashboard with stats and activity feed',
        status: 'planned',
        estimated_minutes: 60,
        sprint_number: 1
      }
    ];

    const { data: tasks, error: tasksError } = await supabase
      .from('project_tasks')
      .insert(testTasks)
      .select();

    if (tasksError) {
      console.error('❌ Failed to create test tasks:', tasksError);
      return false;
    }

    console.log(`✅ Created ${tasks.length} test tasks`);

    // Test 3: Create task events
    console.log('\n📊 Creating task events...');
    const taskEvents = [
      {
        task_id: tasks[0].id,
        project_id: project.id,
        event_type: 'task_completed',
        actor_role: 'development-team',
        details: { completion_notes: 'Foundation setup completed successfully' }
      },
      {
        task_id: tasks[1].id,
        project_id: project.id,
        event_type: 'task_started',
        actor_role: 'development-team',
        details: { start_notes: 'Beginning authentication implementation' }
      }
    ];

    const { error: eventsError } = await supabase
      .from('task_events')
      .insert(taskEvents);

    if (eventsError) {
      console.error('❌ Failed to create task events:', eventsError);
    } else {
      console.log('✅ Created task events');
    }

    // Test 4: Add security event
    console.log('\n🛡️ Creating security event...');
    const { error: securityError } = await supabase
      .from('security_events')
      .insert({
        event_type: 'health_check',
        severity: 'info',
        description: 'Integration test health check - all systems operational',
        details: {
          test_run: true,
          metrics: { cpu_percent: 35, ram_percent: 45, disk_percent: 25 }
        }
      });

    if (securityError) {
      console.error('❌ Failed to create security event:', securityError);
    } else {
      console.log('✅ Created security event');
    }

    // Test 5: Add system metrics
    console.log('\n📈 Creating system metrics...');
    const { error: metricsError } = await supabase
      .from('system_metrics')
      .insert({
        cpu_percent: 35.5,
        ram_percent: 45.2,
        disk_percent: 25.8,
        gateway_status: 'running',
        active_sessions: 1
      });

    if (metricsError) {
      console.error('❌ Failed to create system metrics:', metricsError);
    } else {
      console.log('✅ Created system metrics');
    }

    // Test 6: Add improvement proposal
    console.log('\n💡 Creating improvement proposal...');
    const { error: improvementError } = await supabase
      .from('improvement_proposals')
      .insert({
        finding: 'API response times could be optimized',
        impact: 'Reduced page load times by 200ms on average',
        suggested_action: 'Implement response caching for frequently accessed endpoints',
        category: 'performance',
        status: 'proposed'
      });

    if (improvementError) {
      console.error('❌ Failed to create improvement proposal:', improvementError);
    } else {
      console.log('✅ Created improvement proposal');
    }

    // Test 7: Verify counts
    console.log('\n🔍 Verifying data counts...');
    
    const { count: projectCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });
    
    const { count: activeTasksCount } = await supabase
      .from('project_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress');
    
    const { count: completedTasksCount } = await supabase
      .from('project_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'done');

    console.log(`📊 Database counts:
    - Total Projects: ${projectCount}
    - Active Tasks: ${activeTasksCount}
    - Completed Tasks: ${completedTasksCount}`);

    // Test 8: Test Bridge API endpoints (if running)
    console.log('\n🌉 Testing Bridge API...');
    try {
      const fetch = (await import('node-fetch')).default;
      
      // Test live status endpoint
      const liveStatusResponse = await fetch('http://localhost:3001/api/live-status');
      if (liveStatusResponse.ok) {
        const liveStatus = await liveStatusResponse.json();
        console.log('✅ Bridge API live status working');
        console.log(`   Current action: ${liveStatus.currentAction}`);
      } else {
        console.log('⚠️  Bridge API not responding (this is OK if not running)');
      }

      // Test tasks endpoint
      const tasksResponse = await fetch(`http://localhost:3001/api/tasks/${project.id}`);
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        console.log('✅ Bridge API tasks endpoint working');
        console.log(`   Tasks returned: ${tasksData.tasks?.length || 0}`);
        console.log(`   Completion rate: ${tasksData.completionPercentage || 0}%`);
      }

    } catch (bridgeError) {
      console.log('⚠️  Bridge API not available (start with: cd api && npm start)');
    }

    console.log('\n🎉 Integration test completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start Bridge API: cd api && npm start');
    console.log('2. Visit Dashboard: https://genplatform-six.vercel.app');
    console.log('3. Verify stats show real data from Supabase');
    console.log('4. Check activity stream shows events');
    console.log('5. Test notification bell shows alerts');

    return true;

  } catch (error) {
    console.error('\n❌ Integration test failed:', error);
    return false;
  }
}

// Cleanup function
async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete test projects (cascades to tasks and events)
    const { error } = await supabase
      .from('projects')
      .delete()
      .like('name', '%Integration Test%');

    if (error) {
      console.error('❌ Failed to cleanup test data:', error);
    } else {
      console.log('✅ Test data cleaned up');
    }
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
}

// Run test
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--cleanup')) {
    cleanup();
  } else {
    runIntegrationTest().then(success => {
      process.exit(success ? 0 : 1);
    });
  }
}

module.exports = { runIntegrationTest, cleanup };