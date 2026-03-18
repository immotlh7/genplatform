#!/usr/bin/env node

/**
 * End-to-End Workflow Test: "Idea to MVP"
 * Tests the complete workflow from idea submission to MVP deployment
 * Created: 2026-03-18 for Task 7-20
 */

import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'
import { readFileSync } from 'fs'
import path from 'path'

// Test configuration
const TEST_CONFIG = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  API_BASE_URL: 'http://localhost:3000',
  TEST_TIMEOUT: 300000, // 5 minutes
  POLL_INTERVAL: 2000,   // 2 seconds
}

if (!TEST_CONFIG.SUPABASE_URL || !TEST_CONFIG.SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase configuration for testing')
  process.exit(1)
}

const supabase = createClient(TEST_CONFIG.SUPABASE_URL, TEST_CONFIG.SUPABASE_SERVICE_KEY)

/**
 * Test Results Tracker
 */
class TestResults {
  constructor() {
    this.tests = []
    this.startTime = Date.now()
  }

  addTest(name, passed, duration, details = {}) {
    this.tests.push({
      name,
      passed,
      duration,
      details,
      timestamp: new Date().toISOString()
    })
    
    const status = passed ? '✅' : '❌'
    console.log(`${status} ${name} (${duration}ms)`)
    
    if (!passed && details.error) {
      console.log(`   Error: ${details.error}`)
    }
  }

  generateReport() {
    const totalDuration = Date.now() - this.startTime
    const passed = this.tests.filter(t => t.passed).length
    const failed = this.tests.filter(t => !t.passed).length
    
    console.log('\n' + '='.repeat(60))
    console.log('🧪 WORKFLOW E2E TEST RESULTS')
    console.log('='.repeat(60))
    console.log(`Total Tests: ${this.tests.length}`)
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏱️ Total Duration: ${Math.round(totalDuration / 1000)}s`)
    console.log('='.repeat(60))
    
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:')
      this.tests.filter(t => !t.passed).forEach(test => {
        console.log(`   - ${test.name}: ${test.details.error || 'Unknown error'}`)
      })
      console.log('')
    }

    return { passed, failed, totalDuration }
  }
}

/**
 * Main E2E Test Runner
 */
class WorkflowE2ETest {
  constructor() {
    this.results = new TestResults()
    this.testData = {
      workflowId: null,
      runId: null,
      ideaId: null,
      projectId: null
    }
  }

  async runAllTests() {
    console.log('🚀 Starting "Idea to MVP" Workflow E2E Test')
    console.log(`📋 Test Configuration:`)
    console.log(`   - API Base URL: ${TEST_CONFIG.API_BASE_URL}`)
    console.log(`   - Timeout: ${TEST_CONFIG.TEST_TIMEOUT / 1000}s`)
    console.log(`   - Poll Interval: ${TEST_CONFIG.POLL_INTERVAL / 1000}s\n`)

    try {
      // Phase 1: Setup and Validation
      await this.testWorkflowExists()
      await this.testDatabaseSetup()
      
      // Phase 2: Workflow Execution
      await this.testTriggerWorkflow()
      await this.testWorkflowExecution()
      
      // Phase 3: Approval Flow
      await this.testApprovalSystem()
      
      // Phase 4: Completion and Cleanup
      await this.testWorkflowCompletion()
      await this.testCleanup()

    } catch (error) {
      console.error('🔥 Test suite failed with error:', error)
      this.results.addTest('Test Suite', false, 0, { error: error.message })
    }

    return this.results.generateReport()
  }

  /**
   * Test 1: Verify "Idea to MVP" workflow exists and is configured
   */
  async testWorkflowExists() {
    const startTime = Date.now()
    
    try {
      const { data: workflows, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('name', 'Idea to MVP')
        .eq('is_active', true)
        .single()

      if (error) {
        throw new Error(`Failed to find workflow: ${error.message}`)
      }

      if (!workflows) {
        throw new Error('Idea to MVP workflow not found')
      }

      // Validate workflow configuration
      const config = workflows.config || {}
      const steps = config.steps || []
      
      if (steps.length === 0) {
        throw new Error('Workflow has no steps configured')
      }

      this.testData.workflowId = workflows.id
      
      this.results.addTest(
        'Workflow Exists and Configured',
        true,
        Date.now() - startTime,
        { 
          workflowId: workflows.id, 
          stepCount: steps.length,
          templateType: workflows.template_type
        }
      )

    } catch (error) {
      this.results.addTest('Workflow Exists and Configured', false, Date.now() - startTime, { error: error.message })
      throw error
    }
  }

  /**
   * Test 2: Verify database tables are properly set up
   */
  async testDatabaseSetup() {
    const startTime = Date.now()
    
    try {
      // Test workflows table
      const { error: workflowError } = await supabase
        .from('workflows')
        .select('id')
        .limit(1)

      if (workflowError) {
        throw new Error(`Workflows table error: ${workflowError.message}`)
      }

      // Test workflow_runs table
      const { error: runsError } = await supabase
        .from('workflow_runs')
        .select('id')
        .limit(1)

      if (runsError) {
        throw new Error(`Workflow_runs table error: ${runsError.message}`)
      }

      this.results.addTest('Database Setup', true, Date.now() - startTime)

    } catch (error) {
      this.results.addTest('Database Setup', false, Date.now() - startTime, { error: error.message })
      throw error
    }
  }

  /**
   * Test 3: Trigger workflow execution
   */
  async testTriggerWorkflow() {
    const startTime = Date.now()
    
    try {
      // Create test idea (simulating idea submission)
      this.testData.ideaId = `test-idea-${Date.now()}`
      
      const response = await fetch(`${TEST_CONFIG.API_BASE_URL}/api/workflows/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId: this.testData.workflowId,
          projectId: this.testData.projectId,
          triggerContext: {
            ideaId: this.testData.ideaId,
            ideaTitle: 'E2E Test Idea',
            ideaDescription: 'Automated test idea for workflow validation'
          },
          priority: 'high'
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API request failed: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(`Workflow trigger failed: ${result.message}`)
      }

      this.testData.runId = result.data.runId
      
      this.results.addTest(
        'Trigger Workflow',
        true,
        Date.now() - startTime,
        { runId: result.data.runId, workflowName: result.data.workflowName }
      )

    } catch (error) {
      this.results.addTest('Trigger Workflow', false, Date.now() - startTime, { error: error.message })
      throw error
    }
  }

  /**
   * Test 4: Monitor workflow execution progress
   */
  async testWorkflowExecution() {
    const startTime = Date.now()
    const timeout = Date.now() + TEST_CONFIG.TEST_TIMEOUT
    
    try {
      console.log(`⏳ Monitoring workflow execution: ${this.testData.runId}`)
      
      let lastStatus = null
      let stepsProgressed = false
      
      while (Date.now() < timeout) {
        const { data: run, error } = await supabase
          .from('workflow_runs')
          .select('*')
          .eq('id', this.testData.runId)
          .single()

        if (error) {
          throw new Error(`Failed to fetch run status: ${error.message}`)
        }

        console.log(`   Status: ${run.status} | Step: ${run.current_step} | Progress: ${run.steps_completed}/${run.steps_total}`)

        // Check if status changed
        if (lastStatus !== run.status) {
          lastStatus = run.status
          
          if (run.status === 'failed') {
            throw new Error(`Workflow failed: ${run.error_message}`)
          }
          
          if (run.status === 'waiting_approval') {
            console.log(`⏸️ Workflow waiting for approval at step: ${run.current_step}`)
            break // This is expected behavior
          }
          
          if (run.status === 'completed') {
            console.log(`✅ Workflow completed successfully`)
            break
          }
        }

        // Check if steps progressed
        if (run.steps_completed > 0) {
          stepsProgressed = true
        }

        await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.POLL_INTERVAL))
      }

      if (Date.now() >= timeout) {
        throw new Error('Workflow execution timeout - no progress detected')
      }

      if (!stepsProgressed) {
        throw new Error('Workflow did not progress through any steps')
      }

      this.results.addTest(
        'Workflow Execution Progress',
        true,
        Date.now() - startTime,
        { finalStatus: lastStatus, stepsProgressed: stepsProgressed }
      )

    } catch (error) {
      this.results.addTest('Workflow Execution Progress', false, Date.now() - startTime, { error: error.message })
      throw error
    }
  }

  /**
   * Test 5: Test approval system
   */
  async testApprovalSystem() {
    const startTime = Date.now()
    
    try {
      // Check if workflow is waiting for approval
      const { data: run, error } = await supabase
        .from('workflow_runs')
        .select('*')
        .eq('id', this.testData.runId)
        .single()

      if (error) {
        throw new Error(`Failed to fetch run for approval: ${error.message}`)
      }

      if (run.status !== 'waiting_approval') {
        // If not waiting for approval, that's also a valid test result
        this.results.addTest(
          'Approval System (Not Required)',
          true,
          Date.now() - startTime,
          { status: run.status, note: 'Workflow did not require approval' }
        )
        return
      }

      // Test approval API
      const approvalResponse = await fetch(`${TEST_CONFIG.API_BASE_URL}/api/workflows/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          runId: this.testData.runId,
          approvalNotes: 'E2E Test Auto-Approval'
        })
      })

      if (!approvalResponse.ok) {
        const errorText = await approvalResponse.text()
        throw new Error(`Approval API failed: ${approvalResponse.status} - ${errorText}`)
      }

      const approvalResult = await approvalResponse.json()
      
      if (!approvalResult.success) {
        throw new Error(`Approval failed: ${approvalResult.message}`)
      }

      // Wait a moment for the approval to take effect
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Verify workflow resumed
      const { data: updatedRun } = await supabase
        .from('workflow_runs')
        .select('status, approved_by, approved_at')
        .eq('id', this.testData.runId)
        .single()

      if (updatedRun?.status === 'waiting_approval') {
        throw new Error('Workflow still waiting for approval after approval was granted')
      }

      this.results.addTest(
        'Approval System',
        true,
        Date.now() - startTime,
        { 
          approvedBy: updatedRun?.approved_by,
          newStatus: updatedRun?.status
        }
      )

    } catch (error) {
      this.results.addTest('Approval System', false, Date.now() - startTime, { error: error.message })
      // Don't throw - approval failure shouldn't stop the entire test
    }
  }

  /**
   * Test 6: Wait for workflow completion
   */
  async testWorkflowCompletion() {
    const startTime = Date.now()
    const timeout = Date.now() + TEST_CONFIG.TEST_TIMEOUT
    
    try {
      console.log(`⏳ Waiting for workflow completion...`)
      
      while (Date.now() < timeout) {
        const { data: run, error } = await supabase
          .from('workflow_runs')
          .select('*')
          .eq('id', this.testData.runId)
          .single()

        if (error) {
          throw new Error(`Failed to fetch final run status: ${error.message}`)
        }

        console.log(`   Final Status Check: ${run.status} | Progress: ${run.steps_completed}/${run.steps_total}`)

        if (run.status === 'completed') {
          console.log(`🎉 Workflow completed successfully!`)
          
          this.results.addTest(
            'Workflow Completion',
            true,
            Date.now() - startTime,
            {
              finalStatus: run.status,
              stepsCompleted: run.steps_completed,
              totalSteps: run.steps_total,
              completedAt: run.completed_at
            }
          )
          return
        }

        if (run.status === 'failed') {
          throw new Error(`Workflow failed during execution: ${run.error_message}`)
        }

        await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.POLL_INTERVAL))
      }

      throw new Error('Workflow completion timeout')

    } catch (error) {
      this.results.addTest('Workflow Completion', false, Date.now() - startTime, { error: error.message })
      // Don't throw - let cleanup run
    }
  }

  /**
   * Test 7: Cleanup test data
   */
  async testCleanup() {
    const startTime = Date.now()
    
    try {
      // Clean up test workflow run
      if (this.testData.runId) {
        const { error: deleteError } = await supabase
          .from('workflow_runs')
          .delete()
          .eq('id', this.testData.runId)

        if (deleteError) {
          console.warn(`⚠️ Failed to cleanup workflow run: ${deleteError.message}`)
        }
      }

      this.results.addTest('Cleanup', true, Date.now() - startTime)

    } catch (error) {
      this.results.addTest('Cleanup', false, Date.now() - startTime, { error: error.message })
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const tester = new WorkflowE2ETest()
  const results = await tester.runAllTests()
  
  // Exit with proper code
  process.exit(results.failed > 0 ? 1 : 0)
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Test suite crashed:', error)
    process.exit(1)
  })
}

export default WorkflowE2ETest