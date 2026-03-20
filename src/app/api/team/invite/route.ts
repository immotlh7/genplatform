import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const TEAM_FILE = '/root/genplatform/data/team-members.json'

async function getTeamMembers() {
  try {
    return JSON.parse(await fs.readFile(TEAM_FILE, 'utf-8'))
  } catch {
    return []
  }
}

async function saveTeamMembers(members: any[]) {
  await fs.mkdir(path.dirname(TEAM_FILE), { recursive: true })
  await fs.writeFile(TEAM_FILE, JSON.stringify(members, null, 2))
}

export async function POST(req: NextRequest) {
  try {
    // Require authentication (auth cookie must exist - middleware already checked)
    const authCookie = req.cookies.get('auth-token')?.value
    if (!authCookie) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()
    const { email, fullName, name, role, message } = body
    const memberName = fullName || name || email?.split('@')[0]

    if (!email || !role) {
      return NextResponse.json({ success: false, message: 'Email and role are required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: 'Invalid email format' }, { status: 400 })
    }

    if (!['ADMIN', 'MANAGER', 'VIEWER'].includes(role)) {
      return NextResponse.json({ success: false, message: 'Invalid role' }, { status: 400 })
    }

    const members = await getTeamMembers()

    // Check if already exists
    const exists = members.find((m: any) => m.email === email)
    if (exists) {
      return NextResponse.json({ success: false, message: 'User already invited or exists' }, { status: 409 })
    }

    // Add new member
    const newMember = {
      id: `member_${Date.now()}`,
      email,
      full_name: memberName,
      role,
      status: 'invited',
      invited_at: new Date().toISOString(),
      message: message || null,
    }

    members.push(newMember)
    await saveTeamMembers(members)

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}`,
      member: newMember,
    })
  } catch (error: any) {
    console.error('Invite error:', error)
    return NextResponse.json({ success: false, message: 'Failed to send invitation' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const members = await getTeamMembers()
    return NextResponse.json({ members })
  } catch {
    return NextResponse.json({ members: [] })
  }
}
