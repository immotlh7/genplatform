"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { 
  Home, 
  FolderOpen, 
  Brain, 
  Database, 
  Clock, 
  BarChart3, 
  Settings 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Skills', href: '/skills', icon: Brain },
  { name: 'Memory', href: '/memory', icon: Database },
  { name: 'Cron Jobs', href: '/cron', icon: Clock },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button 
        variant="ghost" 
        size="sm" 
        className="md:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle navigation menu</span>
      </Button>
      
      <SheetContent side="left" className="w-64">
        <SheetHeader>
          <SheetTitle className="text-left">GenPlatform.ai</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive 
                    ? "bg-accent text-accent-foreground" 
                    : "text-muted-foreground"
                )}
                onClick={() => setOpen(false)}
              >
                <item.icon size={18} className="flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>System Online</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}