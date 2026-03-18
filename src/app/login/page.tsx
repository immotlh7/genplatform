"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, Crown } from 'lucide-react'

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
        setError(data.error || 'Authentication failed')
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: teamEmail,
        password: teamPassword
      })

      if (error) {
        setTeamError(error.message)
        return
      }

      if (data.user) {
        // Verify user is in team_members table
        const { data: teamMember, error: memberError } = await supabase
          .from('team_members')
          .select('id, email, display_name, role, is_active')
          .eq('email', data.user.email)
          .eq('is_active', true)
          .single()

        if (memberError || !teamMember) {
          setTeamError('You are not authorized to access this platform')
          await supabase.auth.signOut()
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
                <div className="text-sm text-red-600 dark:text-red-400">
                  {error}
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
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={teamPassword}
                    onChange={(e) => setTeamPassword(e.target.value)}
                    disabled={teamLoading}
                  />
                </div>
                {teamError && (
                  <div className="text-sm text-red-600 dark:text-red-400">
                    {teamError}
                  </div>
                )}
                <Button 
                  type="submit" 
                  variant="outline"
                  className="w-full" 
                  disabled={teamLoading || !teamEmail || !teamPassword}
                >
                  {teamLoading ? 'Signing in...' : 'Sign In'}
                </Button>
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