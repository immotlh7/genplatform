import jwt from 'jsonwebtoken'
import { config } from './config'

export interface AuthToken {
  authenticated: boolean
  timestamp: number
  iat: number
  exp: number
}

export function verifyToken(token: string): AuthToken | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthToken
    return decoded
  } catch (error) {
    return null
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  
  const token = localStorage.getItem('auth-token')
  if (!token) return false
  
  const decoded = verifyToken(token)
  return decoded?.authenticated === true
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth-token')
}

export function removeAuthToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('auth-token')
}

export async function logout(): Promise<void> {
  removeAuthToken()
  window.location.href = '/login'
}