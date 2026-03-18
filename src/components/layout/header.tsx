"use client"

import { useState, useEffect } from 'react'
import { User, LogOut, Settings, Shield, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { MobileNav } from '@/components/layout/mobile-nav'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { getCurrentUserClient } from '@/lib/access-control'
import type { User as UserType } from '@/lib/access-control'
import { logout } from '@/lib/auth'

export function Header() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCurrentUser()
  }, [])

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUserClient()
      setCurrentUser(user)
    } catch (error) {
      console.error('Error loading user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      // Force reload to clear all client-side state
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback: force navigation to login
      window.location.href = '/login'
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'ADMIN': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER': return <Crown className="h-3 w-3" />
      case 'ADMIN': return <Shield className="h-3 w-3" />
      case 'MANAGER': return <Settings className="h-3 w-3" />
      default: return <User className="h-3 w-3" />
    }
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 lg:px-6">
        <div className="flex items-center space-x-4">
          <MobileNav />
          <h1 className="text-lg font-semibold hidden sm:block">Mission Control Dashboard</h1>
        </div>
        
        <div className="ml-auto flex items-center space-x-2 md:space-x-4">
          {/* User Role Badge - Only show if user is loaded */}
          {currentUser && !loading && (
            <Badge className={getRoleBadgeColor(currentUser.role)} variant="outline">
              <div className="flex items-center space-x-1">
                {getRoleIcon(currentUser.role)}
                <span className="hidden sm:inline">{currentUser.role}</span>
              </div>
            </Badge>
          )}

          {/* Notification Bell */}
          <NotificationBell />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Avatar with Dropdown */}
          {loading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                      {getInitials(currentUser.displayName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium leading-none">
                        {currentUser.displayName}
                      </p>
                      <Badge className={getRoleBadgeColor(currentUser.role)} variant="outline">
                        <div className="flex items-center space-x-1">
                          {getRoleIcon(currentUser.role)}
                          <span className="text-xs">{currentUser.role}</span>
                        </div>
                      </Badge>
                    </div>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser.email}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      {currentUser.userType === 'owner' ? '🏆 Platform Owner' : '👤 Team Member'}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.href = '/dashboard/profile'}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/dashboard/settings'}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                {(currentUser.role === 'OWNER' || currentUser.role === 'ADMIN') && (
                  <DropdownMenuItem onClick={() => window.location.href = '/dashboard/team'}>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Team Management</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              variant="ghost" 
              className="relative h-8 w-8 rounded-full p-0"
              onClick={() => window.location.href = '/login'}
              title="Sign In"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}