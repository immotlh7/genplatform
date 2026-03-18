/**
 * Owner setup utilities
 * Sets up the initial owner record in the team_members table
 */

import { supabaseAdmin } from './supabase'

const OWNER_EMAIL = 'medthedev@gmail.com'
const OWNER_NAME = 'Med'

export async function setupOwner() {
  if (!supabaseAdmin) {
    console.warn('Supabase admin client not available - skipping owner setup')
    return null
  }

  try {
    // Check if owner already exists
    const { data: existingOwner, error: checkError } = await supabaseAdmin
      .from('team_members')
      .select('*')
      .eq('email', OWNER_EMAIL)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    if (existingOwner) {
      console.log('Owner record already exists')
      return existingOwner
    }

    // Create owner record
    const { data: owner, error: createError } = await supabaseAdmin
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

    // Log security event
    await supabaseAdmin
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

    console.log('Owner record created successfully')
    return owner

  } catch (error) {
    console.error('Error setting up owner record:', error)
    return null
  }
}

export async function getOwnerRecord() {
  if (!supabaseAdmin) {
    return null
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('team_members')
      .select('*')
      .eq('email', OWNER_EMAIL)
      .single()

    if (error) {
      console.error('Error fetching owner record:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching owner record:', error)
    return null
  }
}

export const OWNER_CONFIG = {
  email: OWNER_EMAIL,
  name: OWNER_NAME,
  role: 'OWNER' as const
}