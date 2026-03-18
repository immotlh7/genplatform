const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Commander context handler
router.post('/context', async (req, res) => {
  try {
    const { 
      message, 
      project_id,
      user_id = 'system',
      context_type = 'arabic_command'
    } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Log the commander request
    const { data: logData, error: logError } = await supabase
      .from('chat_messages')
      .insert({
        user_id,
        message,
        message_type: 'commander_request',
        project_id,
        metadata: {
          context_type,
          original_message: message,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (logError) {
      console.error('Error logging commander request:', logError);
    }

    // Prepare commander context
    const commanderContext = {
      type: 'commander_translation',
      original_message: message,
      project_id,
      user_id,
      request_id: logData?.id || null,
      instructions: {
        task: 'Translate Arabic idea to detailed English command',
        format: 'structured_command',
        include: [
          'action_verb',
          'target_component',
          'specifications',
          'expected_outcome'
        ]
      }
    };

    // Return the context for OpenClaw to process
    res.json({
      success: true,
      context: commanderContext,
      message_id: logData?.id || null
    });

  } catch (error) {
    console.error('Commander context error:', error);
    res.status(500).json({ 
      error: 'Failed to process commander context',
      details: error.message 
    });
  }
});

// Save translated command
router.post('/save', async (req, res) => {
  try {
    const {
      original_message,
      translated_command,
      project_id,
      user_id = 'system',
      message_id
    } = req.body;

    // Save the translation
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id,
        message: translated_command.description || translated_command,
        message_type: 'commander_translation',
        project_id,
        metadata: {
          original_arabic: original_message,
          command_structure: translated_command,
          parent_message_id: message_id,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      translation_id: data.id,
      data
    });

  } catch (error) {
    console.error('Commander save error:', error);
    res.status(500).json({ 
      error: 'Failed to save commander translation',
      details: error.message 
    });
  }
});

// Get commander history
router.get('/history', async (req, res) => {
  try {
    const { project_id, limit = 10 } = req.query;

    let query = supabase
      .from('chat_messages')
      .select('*')
      .in('message_type', ['commander_request', 'commander_translation'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (project_id) {
      query = query.eq('project_id', project_id);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      history: data
    });

  } catch (error) {
    console.error('Commander history error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch commander history',
      details: error.message 
    });
  }
});

module.exports = router;