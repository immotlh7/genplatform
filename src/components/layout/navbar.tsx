"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { NotificationBell } from '@/components/notifications/notification-system'
import { 
  Search, 
  Settings, 
  User, 
  LogOut,
  Menu,
  X
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getCurrentUserClient } from '@/lib/access-control'
import type { User as UserType } from '@/lib/access-control'

export function Navbar() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)

  // For now, hardcode user data
  // TODO: Replace with actual auth when fully working
  const hardcodedUser = {
    name: "Med",
    role: "OWNER" as const,
    email: "med@genplatform.ai"
  }

  useEffect(() => {
    // TODO: Replace with actual user fetch when auth is working
    // getCurrentUserClient().then(setCurrentUser).catch(console.error)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery)
      // Implement global search functionality
    }
  }

  const handleLogout = () => {
    // Clear auth tokens and redirect to login
    localStorage.removeItem('genplatform-auth-token')
    
    // Clear Supabase auth
    if (typeof window !== 'undefined' && window.localStorage) {
      // Clear all Supabase-related localStorage items
      Object.keys(window.localStorage).forEach(key => {
        if (key.includes('supabase')) {
          window.localStorage.removeItem(key)
        }
      })
    }

    // Clear session cookie
    document.cookie = 'sb-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    
    // Redirect to login
    router.push('/login')
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      OWNER: {
        bgColor: 'bg-amber-500/20',
        textColor: 'text-amber-500',
        borderColor: 'border-amber-500/30'
      },
      ADMIN: {
        bgColor: 'bg-blue-500/20',
        textColor: 'text-blue-500',
        borderColor: 'border-blue-500/30'
      },
      MANAGER: {
        bgColor: 'bg-green-500/20',
        textColor: 'text-green-500',
        borderColor: 'border-green-500/30'
      },
      VIEWER: {
        bgColor: 'bg-zinc-500/20',
        textColor: 'text-zinc-400',
        borderColor: 'border-zinc-500/30'
      }
    }

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.VIEWER
    
    return (
      <Badge 
        variant="outline" 
        className={`${config.bgColor} ${config.textColor} border ${config.borderColor} text-xs px-2 py-0.5 uppercase font-medium`}
      >
        {role}
      </Badge>
    )
  }

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          className="lg:hidden"
          size="sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Search */}
        <div className="flex-1 max-w-md mx-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search skills, memory, cron jobs..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-2">
          {/* System Status Indicator */}
          <div className="hidden sm:flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">System Healthy</span>
          </div>

          {/* Notifications */}
          <NotificationBell />

          {/* Settings */}
          <Button variant="ghost" size="sm" onClick={() => router.push('/settings')}>
            <Settings className="h-4 w-4" />
          </Button>

          {/* User menu with avatar and role badge */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 flex items-center space-x-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={hardcodedUser.name} />
                  <AvatarFallback className="bg-zinc-700 text-white text-sm font-medium">
                    {hardcodedUser.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center space-x-2 max-lg:hidden">
                  <span className="text-sm font-medium">{hardcodedUser.name}</span>
                  {getRoleBadge(hardcodedUser.role)}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-2">
                  <p className="text-sm font-medium leading-none">{hardcodedUser.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {hardcodedUser.email}
                  </p>
                  <div className="pt-1">
                    {getRoleBadge(hardcodedUser.role)}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
                <span className="mr-2">👤</span>
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
                <span className="mr-2">⚙️</span>
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                <span className="mr-2">🚪</span>
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
            <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-background border-r p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">GenPlatform.ai</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Mobile user info */}
              <div className="mb-6 pb-6 border-b">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="" alt={hardcodedUser.name} />
                    <AvatarFallback className="bg-zinc-700 text-white text-lg font-medium">
                      {hardcodedUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{hardcodedUser.name}</p>
                    <div className="mt-1">
                      {getRoleBadge(hardcodedUser.role)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mobile navigation */}
              <div className="space-y-4">
                <Button variant="ghost" className="w-full justify-start" onClick={() => { setMobileMenuOpen(false); router.push('/dashboard'); }}>
                  Dashboard
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { setMobileMenuOpen(false); router.push('/dashboard/skills'); }}>
                  Skills
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { setMobileMenuOpen(false); router.push('/dashboard/memory'); }}>
                  Memory
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { setMobileMenuOpen(false); router.push('/dashboard/cron'); }}>
                  Cron Jobs
                </Button>
                <DropdownMenuSeparator />
                <Button variant="ghost" className="w-full justify-start" onClick={() => { setMobileMenuOpen(false); router.push('/settings'); }}>
                  <span className="mr-2">👤</span>
                  Profile
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { setMobileMenuOpen(false); router.push('/settings'); }}>
                  <span className="mr-2">⚙️</span>
                  Settings
                </Button>
                <Button variant="ghost" className="w-full justify-start text-red-600" onClick={handleLogout}>
                  <span className="mr-2">🚪</span>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}