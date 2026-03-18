#!/usr/bin/env node

// Script to create owner record in team_members table
// Usage: node scripts/setup-owner.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../api/.env' });

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupOwner() {
  console.log('🔐 Setting up owner record in team_members table...\n');

  try {
    // Owner details - customize these
    const ownerData = {
      email: 'medtlh1@example.com',  // Replace with actual email
      display_name: 'Med',           // Replace with actual name
      role: 'OWNER',
      is_active: true,
      invited_by: null,  // Owner wasn't invited by anyone
      invited_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    console.log('📝 Creating owner record with data:');
    console.log(`   Email: ${ownerData.email}`);
    console.log(`   Name: ${ownerData.display_name}`);
    console.log(`   Role: ${ownerData.role}\n`);

    // Check if owner already exists
    const { data: existingOwner, error: checkError } = await supabase
      .from('team_members')
      .select('*')
      .eq('role', 'OWNER')
      .single();

    if (existingOwner && !checkError) {
      console.log('⚠️  Owner record already exists:');
      console.log(`   ID: ${existingOwner.id}`);
      console.log(`   Email: ${existingOwner.email}`);
      console.log(`   Name: ${existingOwner.display_name}`);
      console.log(`   Created: ${new Date(existingOwner.created_at).toLocaleDateString()}\n`);
      
      // Update existing record
      const { data: updatedOwner, error: updateError } = await supabase
        .from('team_members')
        .update({
          display_name: ownerData.display_name,
          email: ownerData.email,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingOwner.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Failed to update owner record:', updateError);
        return false;
      }

      console.log('✅ Owner record updated successfully!');
      return true;
    }

    // Create new owner record
    const { data: newOwner, error: createError } = await supabase
      .from('team_members')
      .insert(ownerData)
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create owner record:', createError);
      return false;
    }

    console.log('✅ Owner record created successfully!');
    console.log(`   ID: ${newOwner.id}`);
    console.log(`   Email: ${newOwner.email}`);
    console.log(`   Name: ${newOwner.display_name}`);
    console.log(`   Role: ${newOwner.role}\n`);

    // Verify the record
    const { data: verification, error: verifyError } = await supabase
      .from('team_members')
      .select('*')
      .eq('role', 'OWNER');

    if (verifyError) {
      console.error('❌ Failed to verify owner record:', verifyError);
      return false;
    }

    console.log(`🔍 Verification: Found ${verification.length} owner record(s)`);
    
    if (verification.length === 1) {
      console.log('✅ Owner setup completed successfully!\n');
      
      console.log('📋 Next steps:');
      console.log('1. Verify Supabase Auth is configured');
      console.log('2. Update login page for dual authentication');
      console.log('3. Test owner login with existing cookie system');
      console.log('4. Test team member invitation flow');
      
      return true;
    } else {
      console.error(`❌ Verification failed: Expected 1 owner, found ${verification.length}`);
      return false;
    }

  } catch (error) {
    console.error('\n❌ Owner setup failed:', error.message);
    return false;
  }
}

// Run the setup
if (require.main === module) {
  setupOwner().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { setupOwner };