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
import { createBrowserClient } from '@supabase/ssr'

export function Header() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadCurrentUser()
  }, [])

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUserClient()
      // TODO: Replace with actual role check
      // For now, hardcode role='OWNER' so the page works
      if (user) {
        setCurrentUser({
          ...user,
          displayName: 'Med',
          role: 'OWNER'
        })
      } else {
        // Fallback for development
        setCurrentUser({
          id: '1',
          email: 'med@genplatform.ai',
          displayName: 'Med',
          role: 'OWNER',
          userType: 'owner',
          isAuthenticated: true
        })
      }
    } catch (error) {
      console.error('Error loading user:', error)
      // Fallback for development
      setCurrentUser({
        id: '1',
        email: 'med@genplatform.ai',
        displayName: 'Med',
        role: 'OWNER',
        userType: 'owner',
        isAuthenticated: true
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      // Clear session cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      
      // Clear Supabase auth
      await supabase.auth.signOut()
      
      // Redirect to login
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

  const getRoleBadgeStyles = (role: string) => {
    switch (role) {
      case 'OWNER': 
        return 'bg-amber-500/20 text-amber-500 border-amber-500/30'
      case 'ADMIN': 
        return 'bg-blue-500/20 text-blue-500 border-blue-500/30'
      case 'MANAGER': 
        return 'bg-green-500/20 text-green-500 border-green-500/30'
      case 'VIEWER': 
      default:
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
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
          {/* Notification Bell */}
          <NotificationBell />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Avatar, Name, and Role Badge */}
          {!loading && currentUser && (
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-auto p-1.5 hover:bg-transparent flex items-center space-x-2">
                    {/* Avatar circle - 32x32px */}
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-zinc-700 text-white text-sm font-medium">
                        {getInitials(currentUser.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Display name - 14px medium */}
                    <span className="text-sm font-medium hidden sm:inline">
                      {currentUser.displayName}
                    </span>
                    
                    {/* Role badge - pill style with specified colors */}
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-2 py-0.5 ${getRoleBadgeStyles(currentUser.role)}`}
                    >
                      {currentUser.role}
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-2">
                      <p className="text-sm font-medium leading-none">
                        {currentUser.displayName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {currentUser.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Profile */}
                  <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
                    <span className="mr-2">👤</span>
                    Profile
                  </DropdownMenuItem>
                  
                  {/* Settings */}
                  <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
                    <span className="mr-2">⚙️</span>
                    Settings
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Logout */}
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <span className="mr-2">🚪</span>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          
          {/* Loading state */}
          {loading && (
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
              <div className="h-4 w-16 rounded bg-muted animate-pulse hidden sm:block" />
              <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}