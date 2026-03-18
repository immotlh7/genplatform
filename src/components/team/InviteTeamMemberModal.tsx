"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Mail, 
  UserPlus, 
  AlertCircle, 
  CheckCircle,
  Crown,
  Shield,
  Eye,
  Users
} from 'lucide-react'
import { Role } from '@/lib/rbac'

interface InviteTeamMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInviteSuccess?: () => void
}

export default function InviteTeamMemberModal({
  open,
  onOpenChange,
  onInviteSuccess
}: InviteTeamMemberModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    role: 'VIEWER' as Role,
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send invitation')
      }

      setSuccess(true)
      
      // Reset form after successful invite
      setTimeout(() => {
        setFormData({
          email: '',
          fullName: '',
          role: 'VIEWER',
          message: ''
        })
        setSuccess(false)
        onOpenChange(false)
        onInviteSuccess?.()
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      email: '',
      fullName: '',
      role: 'VIEWER',
      message: ''
    })
    setError('')
    setSuccess(false)
    onOpenChange(false)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Shield className="h-4 w-4" />
      case 'MANAGER': return <Users className="h-4 w-4" />
      case 'VIEWER': return <Eye className="h-4 w-4" />
      default: return <Eye className="h-4 w-4" />
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'ADMIN': 
        return 'Can manage team members, projects, and system settings'
      case 'MANAGER': 
        return 'Can create and manage projects, assign tasks, and view reports'
      case 'VIEWER': 
        return 'Can view projects, tasks, and participate in discussions'
      default: 
        return ''
    }
  }

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center space-y-4 py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <DialogTitle className="text-xl mb-2">Invitation Sent!</DialogTitle>
              <DialogDescription className="text-base">
                We've sent an invitation to <span className="font-medium">{formData.email}</span>.
                They'll receive an email with instructions to join the team.
              </DialogDescription>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Invite Team Member</span>
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join your GenPlatform.ai team
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="team.member@company.com"
                className="pl-10"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Full Name Input */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              placeholder="John Doe"
              required
              disabled={loading}
            />
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={formData.role}
              onValueChange={(value: Role) => setFormData(prev => ({ ...prev, role: value }))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIEWER">
                  <div className="flex items-center space-x-2">
                    {getRoleIcon('VIEWER')}
                    <span>Viewer</span>
                  </div>
                </SelectItem>
                <SelectItem value="MANAGER">
                  <div className="flex items-center space-x-2">
                    {getRoleIcon('MANAGER')}
                    <span>Manager</span>
                  </div>
                </SelectItem>
                <SelectItem value="ADMIN">
                  <div className="flex items-center space-x-2">
                    {getRoleIcon('ADMIN')}
                    <span>Admin</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* Role Description */}
            <div className="bg-muted/30 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {getRoleDescription(formData.role)}
              </p>
            </div>
          </div>

          {/* Personal Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Welcome to the team! Looking forward to working with you."
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.email || !formData.fullName}
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>

        {/* Help Text */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            💡 The invited user will receive an email with a secure link to set their password and join the team.
            You can change their role and project assignments later.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}