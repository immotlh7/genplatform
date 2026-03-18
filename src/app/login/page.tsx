"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { authHelpers, supabaseHelpers } from '@/lib/supabase'
import { Mail, Lock, Crown, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [ownerPassword, setOwnerPassword] = useState('')
  const [teamEmail, setTeamEmail] = useState('')
  const [teamPassword, setTeamPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [teamLoading, setTeamLoading] = useState(false)
  const [error, setError] = useState('')
  const [teamError, setTeamError] = useState('')
  const [showTeamLogin, setShowTeamLogin] = useState(false)
  const router = useRouter()

  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: ownerPassword })
      })

      const data = await response.json()

      if (data.success) {
        // Cookie is set by the server, redirect to dashboard
        router.push('/dashboard')
      } else {
        setError(data.message || 'Authentication failed')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleTeamLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setTeamLoading(true)
    setTeamError('')

    try {
      const { user, session, error } = await authHelpers.signIn(teamEmail, teamPassword)

      if (error) {
        setTeamError(error.message)
        return
      }

      if (user && session) {
        // Verify user is in team_members table and active
        const teamMember = await supabaseHelpers.getTeamMemberByEmail(teamEmail)

        if (!teamMember) {
          setTeamError('You are not authorized to access this platform')
          await authHelpers.signOut()
          return
        }

        if (teamMember.status !== 'active') {
          let statusMessage = 'Your account is not active'
          if (teamMember.status === 'invited') {
            statusMessage = 'Please check your email and complete the signup process'
          } else if (teamMember.status === 'disabled') {
            statusMessage = 'Your account has been disabled. Contact the platform owner.'
          }
          setTeamError(statusMessage)
          await authHelpers.signOut()
          return
        }

        // Success - redirect to dashboard
        router.push('/dashboard')
      }
    } catch (err) {
      setTeamError('Network error occurred')
    } finally {
      setTeamLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!teamEmail) {
      setTeamError('Please enter your email address first')
      return
    }

    try {
      const { error } = await authHelpers.resetPassword(teamEmail)
      if (error) {
        setTeamError(error.message)
      } else {
        setTeamError('')
        alert('Password reset email sent! Check your inbox.')
      }
    } catch (err) {
      setTeamError('Failed to send reset email')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">GenPlatform.ai</CardTitle>
          <CardDescription>Mission Control Dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Owner Login - Primary */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Crown className="h-5 w-5 text-yellow-600" />
              <h3 className="font-semibold text-lg">Platform Owner</h3>
            </div>
            <form onSubmit={handleOwnerLogin} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Owner password"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>
              {error && (
                <div className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !ownerPassword}
              >
                {loading ? 'Signing in...' : 'Sign In as Owner'}
              </Button>
            </form>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Team Member Login Toggle */}
          {!showTeamLogin ? (
            <Button 
              type="button"
              variant="outline"
              className="w-full flex items-center space-x-2"
              onClick={() => setShowTeamLogin(true)}
            >
              <Mail className="h-4 w-4" />
              <span>Team Member? Sign in with email</span>
            </Button>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-lg">Team Member</h3>
                </div>
                <Button 
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowTeamLogin(false)
                    setTeamEmail('')
                    setTeamPassword('')
                    setTeamError('')
                  }}
                >
                  Cancel
                </Button>
              </div>
              <form onSubmit={handleTeamLogin} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={teamEmail}
                    onChange={(e) => setTeamEmail(e.target.value)}
                    disabled={teamLoading}
                    autoComplete="email"
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={teamPassword}
                    onChange={(e) => setTeamPassword(e.target.value)}
                    disabled={teamLoading}
                    autoComplete="current-password"
                  />
                </div>
                {teamError && (
                  <div className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>{teamError}</span>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <Button 
                    type="submit" 
                    variant="outline"
                    className="flex-1" 
                    disabled={teamLoading || !teamEmail || !teamPassword}
                  >
                    {teamLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={teamLoading}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Forgot your password?
                  </button>
                </div>
              </form>

              {/* Help Text */}
              <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground text-center">
                  Don't have an account? Contact the platform owner to get invited as a team member.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}