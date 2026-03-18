"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Calendar,
} from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Search,
  Filter,
  X,
  Calendar as CalendarIcon,
  FileText,
  Clock,
  User
} from 'lucide-react'

export interface ReportFilters {
  search: string
  type: string
  status: string
  author: string
  project: string
  dateRange: {
    from: Date | null
    to: Date | null
    preset: string
  }
}

interface ReportFiltersProps {
  filters: ReportFilters
  onFiltersChange: (filters: ReportFilters) => void
  totalResults: number
  projects?: Array<{ id: string; name: string }>
  authors?: string[]
  onClearFilters: () => void
}

export function ReportFilters({
  filters,
  onFiltersChange,
  totalResults,
  projects = [],
  authors = [],
  onClearFilters
}: ReportFiltersProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  const datePresets = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'This Week' },
    { value: 'lastWeek', label: 'Last Week' },
    { value: 'month', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'custom', label: 'Custom Range' }
  ]

  const reportTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'custom', label: 'Custom' }
  ]

  const reportStatuses = [
    { value: 'all', label: 'All Status' },
    { value: 'completed', label: 'Completed' },
    { value: 'generating', label: 'Generating' },
    { value: 'failed', label: 'Failed' },
    { value: 'scheduled', label: 'Scheduled' }
  ]

  const updateFilters = (updates: Partial<ReportFilters>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const handleDatePresetChange = (preset: string) => {
    const now = new Date()
    let from: Date | null = null
    let to: Date | null = null

    switch (preset) {
      case 'today':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        break
      case 'yesterday':
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        from = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
        to = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)
        break
      case 'week':
        const weekStart = new Date(now)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        from = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate())
        to = now
        break
      case 'lastWeek':
        const lastWeekEnd = new Date(now)
        lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay() - 1)
        const lastWeekStart = new Date(lastWeekEnd)
        lastWeekStart.setDate(lastWeekStart.getDate() - 6)
        from = new Date(lastWeekStart.getFullYear(), lastWeekStart.getMonth(), lastWeekStart.getDate())
        to = new Date(lastWeekEnd.getFullYear(), lastWeekEnd.getMonth(), lastWeekEnd.getDate(), 23, 59, 59)
        break
      case 'month':
        from = new Date(now.getFullYear(), now.getMonth(), 1)
        to = now
        break
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
        from = lastMonth
        to = new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), lastMonthEnd.getDate(), 23, 59, 59)
        break
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
        from = quarterStart
        to = now
        break
      case 'all':
      default:
        from = null
        to = null
        break
    }

    updateFilters({
      dateRange: {
        from,
        to,
        preset
      }
    })
  }

  const formatDateRange = () => {
    const { from, to, preset } = filters.dateRange
    
    if (preset !== 'custom' && preset !== 'all') {
      return datePresets.find(p => p.value === preset)?.label || 'Custom'
    }
    
    if (!from && !to) return 'All Time'
    
    if (from && to) {
      return `${from.toLocaleDateString()} - ${to.toLocaleDateString()}`
    }
    
    if (from) return `From ${from.toLocaleDateString()}`
    if (to) return `Until ${to.toLocaleDateString()}`
    
    return 'Custom Range'
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.type !== 'all') count++
    if (filters.status !== 'all') count++
    if (filters.author !== 'all') count++
    if (filters.project !== 'all') count++
    if (filters.dateRange.preset !== 'all') count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            className="pl-10"
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
          />
        </div>
        
        <Button
          variant="outline"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="flex items-center space-x-2"
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
        
        {activeFiltersCount > 0 && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {isAdvancedOpen && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Advanced Filters</CardTitle>
            <CardDescription>
              Narrow down your search with specific criteria
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Type Filter */}
              <div className="space-y-2">
                <Label htmlFor="type-filter">Report Type</Label>
                <Select value={filters.type} onValueChange={(value) => updateFilters({ type: value })}>
                  <SelectTrigger id="type-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select value={filters.status} onValueChange={(value) => updateFilters({ status: value })}>
                  <SelectTrigger id="status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reportStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Project Filter */}
              <div className="space-y-2">
                <Label htmlFor="project-filter">Project</Label>
                <Select value={filters.project} onValueChange={(value) => updateFilters({ project: value })}>
                  <SelectTrigger id="project-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Author Filter */}
              {authors.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="author-filter">Author</Label>
                  <Select value={filters.author} onValueChange={(value) => updateFilters({ author: value })}>
                    <SelectTrigger id="author-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Authors</SelectItem>
                      {authors.map((author) => (
                        <SelectItem key={author} value={author}>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>{author}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDateRange()}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-4 space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Quick Ranges</Label>
                        <div className="grid grid-cols-2 gap-1 mt-1">
                          {datePresets.filter(p => p.value !== 'custom').map((preset) => (
                            <Button
                              key={preset.value}
                              variant={filters.dateRange.preset === preset.value ? "default" : "ghost"}
                              size="sm"
                              className="justify-start text-xs h-7"
                              onClick={() => {
                                handleDatePresetChange(preset.value)
                                if (preset.value !== 'custom') {
                                  setIsDatePickerOpen(false)
                                }
                              }}
                            >
                              {preset.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {filters.dateRange.preset === 'custom' && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Custom Range</Label>
                          <div className="grid gap-2">
                            <Calendar
                              mode="range"
                              defaultMonth={filters.dateRange.from || undefined}
                              selected={{
                                from: filters.dateRange.from || undefined,
                                to: filters.dateRange.to || undefined,
                              }}
                              onSelect={(range) => {
                                updateFilters({
                                  dateRange: {
                                    from: range?.from || null,
                                    to: range?.to || null,
                                    preset: 'custom'
                                  }
                                })
                              }}
                              numberOfMonths={2}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <span>Showing {totalResults} results with {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center space-x-2">
            {filters.search && (
              <Badge variant="secondary" className="text-xs">
                Search: "{filters.search}"
              </Badge>
            )}
            {filters.type !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                Type: {reportTypes.find(t => t.value === filters.type)?.label}
              </Badge>
            )}
            {filters.status !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                Status: {reportStatuses.find(s => s.value === filters.status)?.label}
              </Badge>
            )}
            {filters.dateRange.preset !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {formatDateRange()}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )
}