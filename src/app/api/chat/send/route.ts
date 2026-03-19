import { NextRequest, NextResponse } from 'next/server'

const BOT_TOKEN = '8635233052:AAGsuMzqhTHwQsFg4qGYPfUEyZPiLsAceA4'
const CHAT_ID = '510906393'

interface ChatSendRequest {
  message: string
  projectId?: string
}

interface Project {
  id: string
  name: string
}

// Helper to get project name
async function getProjectName(projectId: string): Promise<string | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/projects/${projectId}`)
    if (response.ok) {
      const project: Project = await response.json()
      return project.name
    }
  } catch (error) {
    console.error('Error fetching project:', error)
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatSendRequest = await request.json()
    const { message, projectId } = body

    // Validate message
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (message.length > 4000) {
      return NextResponse.json(
        { error: 'Message must be less than 4000 characters' },
        { status: 400 }
      )
    }

    // Prepare message text
    let telegramMessage = message
    if (projectId) {
      const projectName = await getProjectName(projectId)
      if (projectName) {
        telegramMessage = `[Project: ${projectName}] ${message}`
      }
    }

    // Send to Telegram
    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`
    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: telegramMessage,
        parse_mode: 'HTML'
      })
    })

    if (!telegramResponse.ok) {
      const error = await telegramResponse.json()
      console.error('Telegram API error:', error)
      throw new Error('Failed to send message to Telegram')
    }

    const telegramData = await telegramResponse.json()

    return NextResponse.json({
      success: true,
      messageId: telegramData.result.message_id
    })

  } catch (error) {
    console.error('Chat send error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 })
}