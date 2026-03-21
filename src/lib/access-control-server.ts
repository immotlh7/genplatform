import { headers } from 'next/headers'
import { supabase } from '@/lib/supabase';

// User interface for type safety
export interface User {
  id: string
  email: string
  displayName: string
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'VIEWER'
  isOwner: boolean
  authMethod?: 'cookie' | 'supabase'
}

// Server-side function to get current user (for API routes)
export async function getCurrentUser(): Promise<User | null> {
  try {
    const headersList = await headers()
    const userHeader = headersList.get('x-user-info')
    
    if (userHeader) {
      const userData = JSON.parse(userHeader)
      return {
        id: userData.id,
        email: userData.email,
        displayName: userData.displayName || userData.email,
        role: userData.role,
        isOwner: userData.role === 'OWNER',
        authMethod: userData.authMethod || 'cookie'
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Middleware helper to attach user info to request
export function attachUserToRequest(user: User) {
  return {
    'x-user-info': JSON.stringify(user)
  }
}