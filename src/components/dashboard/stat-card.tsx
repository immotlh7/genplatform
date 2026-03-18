"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  description: string
  icon: LucideIcon
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
  status?: 'online' | 'offline' | 'warning' | 'error'
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  status 
}: StatCardProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online': return 'text-green-600'
      case 'offline': return 'text-red-600'
      case 'warning': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-muted-foreground'
    }
  }

  const getTrendColor = (direction?: string) => {
    switch (direction) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-muted-foreground'
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${getStatusColor(status)}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        
        {status && (
          <Badge 
            variant={status === 'online' ? 'default' : 'destructive'} 
            className="mt-2 text-xs"
          >
            {status}
          </Badge>
        )}
        
        {trend && (
          <div className={`text-xs mt-2 ${getTrendColor(trend.direction)}`}>
            {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'} 
            {Math.abs(trend.value)}%
          </div>
        )}
      </CardContent>
    </Card>
  )
}