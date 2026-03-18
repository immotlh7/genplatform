"use client"

import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { logout } from '@/lib/auth'

export function Header() {
  const handleLogout = () => {
    logout()
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold hidden md:block">Mission Control Dashboard</h1>
        </div>
        
        <div className="ml-auto flex items-center space-x-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Avatar */}
          <Button 
            variant="ghost" 
            className="relative h-8 w-8 rounded-full p-0"
            onClick={handleLogout}
            title="Logout"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </div>
    </header>
  )
}