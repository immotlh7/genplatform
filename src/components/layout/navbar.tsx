'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Menu, 
  Bell, 
  Settings, 
  LogOut, 
  User,
  ChevronDown,
  Activity,
  X
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { ProjectSwitcher } from './ProjectSwitcher'
import type { UserRole, AuthUser } from '@/types/auth'

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    // Fetch user data from Bridge API
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/bridge/auth/user')
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch user data:', error);
        }
      }
    }

    fetchUser()
  }, [])

  const getRoleBadge = (role: UserRole) => {
    const roleStyles = {
      OWNER: { label: 'Owner', className: 'bg-purple-600 text-white' },
      ADMIN: { label: 'Admin', className: 'bg-blue-600 text-white' },
      MEMBER: { label: 'Member', className: 'bg-gray-600 text-white' },
      VIEWER: { label: 'Viewer', className: 'bg-gray-500 text-white' }
    }

    const style = roleStyles[role]
    return (
      <Badge className={cn('text-xs', style.className)} variant="secondary">
        {style.label}
      </Badge>
    )
  }

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === path
    }
    return pathname.startsWith(path)
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/projects', label: 'Projects' },
    { href: '/automations', label: 'Automations' },
    { href: '/reports', label: 'Reports' },
  ]

  // Default values if user not loaded
  const displayUser = user || {
    id: '1',
    email: 'user@example.com',
    name: 'User',
    role: 'MEMBER' as UserRole,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Project Switcher */}
          <div className="flex items-center gap-6">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-lg font-semibold hover:text-primary transition-colors"
            >
              <Activity className="h-6 w-6" />
              <span className="hidden sm:inline">GenPlatform</span>
            </Link>

            {/* Project Switcher (desktop only) */}
            <div className="hidden lg:block">
              <ProjectSwitcher />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md transition-all',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive(item.href) 
                    ? 'bg-accent text-accent-foreground' 
                    : 'text-muted-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" />
            </Button>

            {/* Settings */}
            <Link href="/dashboard/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>

            {/* User Menu - Desktop */}
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={displayUser.name} />
                      <AvatarFallback>
                        {displayUser.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{displayUser.name}</span>
                      {getRoleBadge(displayUser.role)}
                    </div>
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="p-2">
                    <p className="text-sm font-medium leading-none">{displayUser.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {displayUser.email}
                    </p>
                    <div className="mt-2">
                      {getRoleBadge(displayUser.role)}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span>Menu</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* User info */}
            <div className="flex items-center gap-3 p-4 bg-accent rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage src="" alt={displayUser.name} />
                <AvatarFallback>
                  {displayUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{displayUser.name}</p>
                <p className="text-xs text-muted-foreground">{displayUser.email}</p>
                <div className="mt-1">
                  {getRoleBadge(displayUser.role)}
                </div>
              </div>
            </div>

            {/* Project Switcher (mobile) */}
            <div className="px-2">
              <ProjectSwitcher />
            </div>

            <div className="border-t pt-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center px-4 py-3 text-sm font-medium rounded-md transition-all',
                    'hover:bg-accent hover:text-accent-foreground',
                    isActive(item.href) 
                      ? 'bg-accent text-accent-foreground' 
                      : 'text-muted-foreground'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <Link
                href="/profile"
                className="flex items-center px-4 py-3 text-sm font-medium rounded-md hover:bg-accent transition-all"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <User className="mr-3 h-4 w-4" />
                Profile
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex items-center px-4 py-3 text-sm font-medium rounded-md hover:bg-accent transition-all"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Settings className="mr-3 h-4 w-4" />
                Settings
              </Link>
              <button
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-950 transition-all"
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  // Handle sign out
                }}
              >
                <LogOut className="mr-3 h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  )
}