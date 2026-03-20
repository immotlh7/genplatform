'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
import { NotificationBell } from './NotificationBell'

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const getRoleBadge = () => (
    <Badge className="text-xs bg-purple-600 text-white" variant="secondary">
      Owner
    </Badge>
  )

  const isActive = (path: string) => {
    if (path === '/') return pathname === path
    return pathname.startsWith(path)
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/projects', label: 'Projects' },
    { href: '/automations', label: 'Automations' },
    { href: '/dashboard/reports', label: 'Reports' },
  ]

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {}
    document.cookie = 'auth-token=; Path=/; Max-Age=0'
    router.push('/login')
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Project Switcher */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold hover:text-primary transition-colors">
              <Activity className="h-6 w-6" />
              <span className="hidden sm:inline">GenPlatform</span>
            </Link>
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
                  isActive(item.href) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Real notification bell */}
            <NotificationBell />

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
                      <AvatarFallback>M</AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Med</span>
                      {getRoleBadge()}
                    </div>
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="p-2">
                    <p className="text-sm font-medium leading-none">Med</p>
                    <p className="text-xs text-muted-foreground mt-1">owner@genplatform.ai</p>
                    <div className="mt-2">{getRoleBadge()}</div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="cursor-pointer">
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
                  <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile menu button */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
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
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3 p-4 bg-accent rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarFallback>M</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">Med</p>
                <p className="text-xs text-muted-foreground">owner@genplatform.ai</p>
                <div className="mt-1">{getRoleBadge()}</div>
              </div>
            </div>
            <div className="px-2"><ProjectSwitcher /></div>
            <div className="border-t pt-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center px-4 py-3 text-sm font-medium rounded-md transition-all',
                    'hover:bg-accent hover:text-accent-foreground',
                    isActive(item.href) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="border-t pt-4 space-y-2">
              <Link href="/dashboard/settings" className="flex items-center px-4 py-3 text-sm font-medium rounded-md hover:bg-accent transition-all" onClick={() => setIsMobileMenuOpen(false)}>
                <User className="mr-3 h-4 w-4" />Profile & Settings
              </Link>
              <button
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-950 transition-all"
                onClick={handleSignOut}
              >
                <LogOut className="mr-3 h-4 w-4" />Sign out
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  )
}
