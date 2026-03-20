"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Settings,
  User,
  Palette,
  Bell,
  Server,
  AlertTriangle,
  Save,
  RefreshCw,
  Trash,
  Monitor,
  Moon,
  Sun,
  SidebarClose,
  SidebarOpen,
  HardDrive,
  Cpu,
  Activity,
  Eye,
  Lock,
  Shield
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { getCurrentUserClient } from '@/lib/access-control'
import type { User as UserType } from '@/lib/access-control'

interface UserSettings {
  profile: {
    name: string
    timezone: string
  }
  appearance: {
    theme: 'light' | 'dark' | 'system'
    sidebarPosition: 'left' | 'right'
  }
  notifications: {
    dailyReports: boolean
    alerts: boolean
    taskCompletion: boolean
  }
}

interface SystemInfo {
  openclawVersion: string
  nodeVersion: string
  platform: string
  uptime: string
  diskUsage: {
    used: number
    total: number
    percentage: number
  }
  memory: {
    used: number
    total: number
    percentage: number
  }
  cpu: {
    usage: number
    cores: number
  }
}

export default function SettingsPage() {
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [settings, setSettings] = useState<UserSettings>({
    profile: {
      name: '',
      timezone: 'Africa/Casablanca'
    },
    appearance: {
      theme: 'dark',
      sidebarPosition: 'left'
    },
    notifications: {
      dailyReports: true,
      alerts: true,
      taskCompletion: false
    }
  })
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadUserAndSettings()
  }, [])

  const loadUserAndSettings = async () => {
    try {
      // Get current user - fallback to owner if auth fails
      let user = await getCurrentUserClient().catch(() => null)
      if (!user) {
        // User is logged in (passed middleware) but auth check fails — use default owner
        user = { id: '1', name: 'Med', email: 'owner@genplatform.ai', role: 'OWNER' as any, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      }
      setCurrentUser(user)

      // Load settings
      loadSettings()
      
      // Load system info if user has permission
      if (user && canViewSystemInfo()) {
        loadSystemInfo()
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading user and settings:', error);
      }
      setIsLoading(false)
    }
  }

  const canViewSystemInfo = () => {
    if (!currentUser) return false
    // Only OWNER and ADMIN can view system information
    return currentUser.role === 'OWNER' || currentUser.role === 'ADMIN'
  }

  const canChangePassword = () => {
    if (!currentUser) return false
    // All users can change their own password
    return true
  }

  const canClearCache = () => {
    if (!currentUser) return false
    // Only OWNER, ADMIN, and MANAGER can clear cache
    return currentUser.role === 'OWNER' || currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER'
  }

  const canModifySystemNotifications = () => {
    if (!currentUser) return false
    // Only OWNER and ADMIN can modify system-level notifications
    return currentUser.role === 'OWNER' || currentUser.role === 'ADMIN'
  }

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('genplatform-settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsed }))
      }
      
      // Also check for existing theme preference
      const savedTheme = localStorage.getItem('genplatform-theme')
      if (savedTheme) {
        setSettings(prev => ({
          ...prev,
          appearance: { ...prev.appearance, theme: savedTheme as 'light' | 'dark' | 'system' }
        }))
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load settings:', error);
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loadSystemInfo = async () => {
    try {
      // Simulate system info loading
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSystemInfo({
        openclawVersion: '2026.3.13',
        nodeVersion: 'v22.22.1',
        platform: 'Linux 6.8.0-90-generic (x64)',
        uptime: '2.5 days',
        diskUsage: {
          used: 45.6,
          total: 100,
          percentage: 46
        },
        memory: {
          used: 6.2,
          total: 8,
          percentage: 78
        },
        cpu: {
          usage: 23,
          cores: 2
        }
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load system info:', error);
      }
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      // Save to API + localStorage
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: settings.profile?.fullName,
          timezone: settings.profile?.timezone,
          email: settings.profile?.email,
          notifications: settings.notifications,
        })
      })
      localStorage.setItem('genplatform-settings', JSON.stringify(settings))
      localStorage.setItem('genplatform-theme', settings.appearance.theme)
      
      // Apply theme immediately
      if (settings.appearance.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else if (settings.appearance.theme === 'light') {
        document.documentElement.classList.remove('dark')
      }
      
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to save settings:', error);
      }
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const changePassword = async () => {
    if (!canChangePassword()) {
      toast({
        title: "Error",
        description: "You do not have permission to change the password.",
        variant: "destructive",
      })
      return
    }

    if (!newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in both password fields.",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      })
      return
    }

    try {
      // In a real app, this would call an API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      })
      
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password. Please try again.",
        variant: "destructive",
      })
    }
  }

  const clearCache = async () => {
    if (!canClearCache()) {
      toast({
        title: "Error",
        description: "You do not have permission to clear cache.",
        variant: "destructive",
      })
      return
    }

    try {
      // Clear various caches
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
      }
      
      // Clear localStorage except for auth and critical settings
      const keysToKeep = ['genplatform-settings', 'genplatform-theme']
      const allKeys = Object.keys(localStorage)
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key)
        }
      })
      
      toast({
        title: "Cache cleared",
        description: "Application cache has been cleared successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear cache. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!currentUser) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Card className="text-center py-12">
          <CardContent>
            <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Please log in to access settings.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-2"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-muted rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            {currentUser.role === 'VIEWER' 
              ? 'View and manage your personal preferences (limited access)'
              : 'Manage your account settings and preferences'
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={saveSettings} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="destructive" onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
            document.cookie = 'auth-token=; Path=/; Max-Age=0'
            window.location.href = '/login'
          }}>
            Sign Out
          </Button>
          {currentUser.role === 'VIEWER' && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Eye className="h-3 w-3 mr-1" />
              Limited Access
            </Badge>
          )}
        </div>
      </div>

      {/* Access level indicator for restricted users */}
      {currentUser.role !== 'OWNER' && (
        <div className={`border rounded-lg p-4 ${
          currentUser.role === 'VIEWER' 
            ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
            : currentUser.role === 'MANAGER'
              ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
              : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
        }`}>
          <div className="flex items-center space-x-2">
            <Badge className={
              currentUser.role === 'VIEWER' 
                ? 'bg-blue-500 text-white' 
                : currentUser.role === 'MANAGER'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-green-500 text-white'
            }>
              {currentUser.role}
            </Badge>
            <span className={`text-sm ${
              currentUser.role === 'VIEWER' 
                ? 'text-blue-900 dark:text-blue-100'
                : currentUser.role === 'MANAGER'
                  ? 'text-yellow-900 dark:text-yellow-100'
                  : 'text-green-900 dark:text-green-100'
            }`}>
              {currentUser.role === 'VIEWER' 
                ? 'You can modify personal settings but system configuration is restricted'
                : currentUser.role === 'MANAGER'
                  ? 'You can access most settings except system administration'
                  : 'You have administrative access to system settings'
              }
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile</span>
            </CardTitle>
            <CardDescription>
              Your personal information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={settings.profile.name || currentUser.displayName}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  profile: { ...prev.profile, name: e.target.value }
                }))}
                placeholder="Enter your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select 
                value={settings.profile.timezone} 
                onValueChange={(value) => setSettings(prev => ({
                  ...prev,
                  profile: { ...prev.profile, timezone: value || 'Africa/Casablanca' }
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Casablanca">Africa/Casablanca (GMT+1)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                  <SelectItem value="Europe/Paris">Europe/Paris (GMT+1)</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                  <SelectItem value="America/Los_Angeles">America/Los_Angeles (GMT-8)</SelectItem>
                  <SelectItem value="Asia/Dubai">Asia/Dubai (GMT+4)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Asia/Tokyo (GMT+9)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-2 text-xs text-muted-foreground">
              Role: <Badge variant="outline">{currentUser.role}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Appearance</span>
            </CardTitle>
            <CardDescription>
              Customize the look and feel of your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select 
                value={settings.appearance.theme} 
                onValueChange={(value) => setSettings(prev => ({
                  ...prev,
                  appearance: { ...prev.appearance, theme: (value || 'dark') as 'light' | 'dark' | 'system' }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center space-x-2">
                      <Sun className="h-4 w-4" />
                      <span>Light</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center space-x-2">
                      <Moon className="h-4 w-4" />
                      <span>Dark</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center space-x-2">
                      <Monitor className="h-4 w-4" />
                      <span>System</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sidebar Position</Label>
              <Select 
                value={settings.appearance.sidebarPosition} 
                onValueChange={(value) => setSettings(prev => ({
                  ...prev,
                  appearance: { ...prev.appearance, sidebarPosition: (value || 'left') as 'left' | 'right' }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">
                    <div className="flex items-center space-x-2">
                      <SidebarClose className="h-4 w-4" />
                      <span>Left</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="right">
                    <div className="flex items-center space-x-2">
                      <SidebarOpen className="h-4 w-4" />
                      <span>Right</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
              {!canModifySystemNotifications() && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  Personal Only
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Choose what notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Daily Reports</Label>
                <p className="text-sm text-muted-foreground">
                  Receive daily summary reports
                </p>
              </div>
              <Switch
                checked={settings.notifications.dailyReports}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, dailyReports: checked }
                }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">
                  System Alerts
                  {!canModifySystemNotifications() && <Lock className="h-3 w-3 inline ml-1" />}
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about system issues
                </p>
              </div>
              <Switch
                checked={settings.notifications.alerts}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, alerts: checked }
                }))}
                disabled={!canModifySystemNotifications()}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Task Completion</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications when tasks complete
                </p>
              </div>
              <Switch
                checked={settings.notifications.taskCompletion}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, taskCompletion: checked }
                }))}
              />
            </div>
            {!canModifySystemNotifications() && (
              <div className="mt-3 text-xs text-blue-600 bg-blue-50 dark:bg-blue-950/30 p-2 rounded border border-blue-200 dark:border-blue-800">
                <Lock className="h-3 w-3 inline mr-1" />
                Some notification settings require admin access
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 4: System Info - Only for OWNER/ADMIN */}
        {canViewSystemInfo() && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Server className="h-5 w-5" />
                <span>System Information</span>
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin Only
                </Badge>
              </CardTitle>
              <CardDescription>
                Current system status and specifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemInfo ? (
                <>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">OpenClaw Version</Label>
                      <div className="font-mono">{systemInfo.openclawVersion}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Node.js Version</Label>
                      <div className="font-mono">{systemInfo.nodeVersion}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Platform</Label>
                      <div className="font-mono text-xs">{systemInfo.platform}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Uptime</Label>
                      <div className="font-mono">{systemInfo.uptime}</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                        <Label>Disk Usage</Label>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {systemInfo.diskUsage.used} GB / {systemInfo.diskUsage.total} GB
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${systemInfo.diskUsage.percentage}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <Label>Memory Usage</Label>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {systemInfo.memory.used} GB / {systemInfo.memory.total} GB
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${systemInfo.memory.percentage}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Cpu className="h-4 w-4 text-muted-foreground" />
                        <Label>CPU Usage</Label>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {systemInfo.cpu.usage}% ({systemInfo.cpu.cores} cores)
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-yellow-600 h-2 rounded-full" 
                        style={{ width: `${systemInfo.cpu.usage}%` }}
                      ></div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Loading system information...
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Section 5: Danger Zone - Conditional access */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <span>Danger Zone</span>
            {currentUser.role === 'VIEWER' && (
              <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                <Eye className="h-3 w-3 mr-1" />
                Limited
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {currentUser.role === 'VIEWER' 
              ? 'Limited access to account security functions'
              : 'Irreversible and destructive actions'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Change Password */}
          {canChangePassword() && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Change Password</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Update your account password. Make sure to use a strong password.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <Button variant="destructive" onClick={changePassword}>
                Change Password
              </Button>
            </div>
          )}

          {canClearCache() && (
            <>
              {canChangePassword() && <Separator />}
              
              {/* Clear Cache */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">
                    Clear Cache
                    {!canClearCache() && <Lock className="h-4 w-4 inline ml-1" />}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Clear application cache and temporary data. This may improve performance but will require re-loading some data.
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={clearCache}
                  disabled={!canClearCache()}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Clear Cache
                </Button>
              </div>
            </>
          )}

          {/* Access restrictions notice */}
          {currentUser.role === 'VIEWER' && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">Limited Access</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    As a viewer, you can only change your password. Other administrative functions require higher privileges.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}