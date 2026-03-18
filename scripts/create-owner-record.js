#!/usr/bin/env node

/**
 * Script to create owner record in team_members table
 * Run this once to set up the initial owner account
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  console.error('Required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const OWNER_EMAIL = 'medthedev@gmail.com' // Owner email
const OWNER_NAME = 'Med' // Owner full name

async function createOwnerRecord() {
  try {
    console.log('🔍 Checking if owner record exists...')

    // Check if owner already exists
    const { data: existingOwner, error: checkError } = await supabase
      .from('team_members')
      .select('*')
      .eq('email', OWNER_EMAIL)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    if (existingOwner) {
      console.log('✅ Owner record already exists:', existingOwner)
      return existingOwner
    }

    console.log('📝 Creating owner record...')

    // Create owner record
    const { data: owner, error: createError } = await supabase
      .from('team_members')
      .insert({
        email: OWNER_EMAIL,
        full_name: OWNER_NAME,
        role: 'OWNER',
        status: 'active',
        joined_at: new Date().toISOString(),
        last_active: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      throw createError
    }

    console.log('✅ Owner record created successfully:')
    console.log(owner)

    // Create a security event for this action
    const { error: logError } = await supabase
      .from('security_events')
      .insert({
        event_type: 'audit',
        severity: 'info',
        description: 'Owner record created in team_members table',
        details: {
          owner_email: OWNER_EMAIL,
          owner_name: OWNER_NAME,
          created_by: 'setup_script'
        },
        resolved: true
      })

    if (logError) {
      console.warn('⚠️ Failed to log security event:', logError.message)
    }

    return owner

  } catch (error) {
    console.error('❌ Error creating owner record:', error)
    process.exit(1)
  }
}

async function main() {
  console.log('🚀 Setting up owner record in team_members table')
  console.log('=====================================')
  
  await createOwnerRecord()
  
  console.log('')
  console.log('✅ Owner setup completed successfully!')
  console.log('📋 Next steps:')
  console.log('  1. Update login page for dual auth (Task 0E-03)')
  console.log('  2. Update middleware for dual auth (Task 0E-04)')
  console.log('  3. Continue with Sprint 0E tasks')
}

// Run the script
main().catch(console.error)