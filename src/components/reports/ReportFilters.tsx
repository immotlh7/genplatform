"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Search,
  Calendar as CalendarIcon,
  Filter,
  X,
  SlidersHorizontal,
  Download,
  FileText,
  Clock,
  Star,
  Archive,
  RefreshCw,
  ChevronDown
} from 'lucide-react'
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

export interface ReportFilters {
  search: string
  type: string
  status: string
  dateRange: {
    start: Date | null
    end: Date | null
  }
  tags: string[]
  starred: boolean
  author: string
  size: {
    min: number | null
    max: number | null
  }
  generationTime: {
    min: number | null
    max: number | null
  }
}

interface ReportFiltersProps {
  filters: ReportFilters
  onFiltersChange: (filters: ReportFilters) => void
  totalResults?: number
  isLoading?: boolean
  onExportFiltered?: () => void
  className?: string
}

const DATE_PRESETS = [
  {
    label: 'Today',
    getValue: () => ({
      start: new Date(),
      end: new Date()
    })
  },
  {
    label: 'Yesterday',
    getValue: () => {
      const yesterday = subDays(new Date(), 1)
      return {
        start: yesterday,
        end: yesterday
      }
    }
  },
  {
    label: 'Last 7 days',
    getValue: () => ({
      start: subDays(new Date(), 7),
      end: new Date()
    })
  },
  {
    label: 'Last 30 days',
    getValue: () => ({
      start: subDays(new Date(), 30),
      end: new Date()
    })
  },
  {
    label: 'This week',
    getValue: () => ({
      start: startOfWeek(new Date()),
      end: endOfWeek(new Date())
    })
  },
  {
    label: 'This month',
    getValue: () => ({
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date())
    })
  },
  {
    label: 'Last month',
    getValue: () => {
      const lastMonth = subDays(startOfMonth(new Date()), 1)
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth)
      }
    }
  }
]

const COMMON_TAGS = [
  'automated', 'daily', 'weekly', 'monthly', 'system', 'team', 'performance',
  'security', 'audit', 'sprint', 'analysis', 'custom', 'business', 'compliance'
]

const REPORT_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'daily', label: 'Daily Reports' },
  { value: 'weekly', label: 'Weekly Reports' },
  { value: 'monthly', label: 'Monthly Reports' },
  { value: 'custom', label: 'Custom Reports' }
]

const REPORT_STATUSES = [
  { value: 'all', label: 'All Status' },
  { value: 'completed', label: 'Completed' },
  { value: 'generating', label: 'Generating' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'failed', label: 'Failed' }
]

const AUTHORS = [
  { value: 'all', label: 'All Authors' },
  { value: 'system', label: 'System Generated' },
  { value: 'user', label: 'User Created' },
  { value: 'scheduled', label: 'Scheduled Reports' }
]

export function ReportFilters({ 
  filters, 
  onFiltersChange, 
  totalResults = 0, 
  isLoading = false,
  onExportFiltered,
  className = "" 
}: ReportFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [tempDateRange, setTempDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: filters.dateRange.start,
    end: filters.dateRange.end
  })

  // Count active filters
  const activeFilterCount = [
    filters.search.length > 0,
    filters.type !== 'all',
    filters.status !== 'all',
    filters.dateRange.start || filters.dateRange.end,
    filters.tags.length > 0,
    filters.starred,
    filters.author !== 'all',
    filters.size.min !== null || filters.size.max !== null,
    filters.generationTime.min !== null || filters.generationTime.max !== null
  ].filter(Boolean).length

  const updateFilter = <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      type: 'all',
      status: 'all',
      dateRange: { start: null, end: null },
      tags: [],
      starred: false,
      author: 'all',
      size: { min: null, max: null },
      generationTime: { min: null, max: null }
    })
    setTempDateRange({ start: null, end: null })
  }

  const applyDateRange = () => {
    updateFilter('dateRange', tempDateRange)
  }

  const applyDatePreset = (preset: typeof DATE_PRESETS[0]) => {
    const range = preset.getValue()
    setTempDateRange(range)
    updateFilter('dateRange', range)
  }

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag]
    updateFilter('tags', newTags)
  }

  const removeTag = (tag: string) => {
    updateFilter('tags', filters.tags.filter(t => t !== tag))
  }

  const formatDateRange = () => {
    if (!filters.dateRange.start && !filters.dateRange.end) return 'All dates'
    if (filters.dateRange.start && filters.dateRange.end) {
      if (filters.dateRange.start.toDateString() === filters.dateRange.end.toDateString()) {
        return format(filters.dateRange.start, 'MMM dd, yyyy')
      }
      return `${format(filters.dateRange.start, 'MMM dd')} - ${format(filters.dateRange.end, 'MMM dd, yyyy')}`
    }
    if (filters.dateRange.start) return `From ${format(filters.dateRange.start, 'MMM dd, yyyy')}`
    if (filters.dateRange.end) return `Until ${format(filters.dateRange.end, 'MMM dd, yyyy')}`
    return 'All dates'
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Filter Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports by title, description, or tags..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10 pr-4"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-6 w-6 p-0"
              onClick={() => updateFilter('search', '')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Type Filter */}
        <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {REPORT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {REPORT_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-56 justify-start text-left">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDateRange()}
              <ChevronDown className="ml-auto h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="flex">
              {/* Date Presets */}
              <div className="border-r">
                <div className="p-3 border-b">
                  <h4 className="font-medium text-sm">Quick Select</h4>
                </div>
                <div className="p-2 space-y-1">
                  {DATE_PRESETS.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => applyDatePreset(preset)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Calendar */}
              <div className="p-3">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm">Start Date</Label>
                    <Calendar
                      mode="single"
                      selected={tempDateRange.start || undefined}
                      onSelect={(date) => setTempDateRange(prev => ({ ...prev, start: date || null }))}
                      initialFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">End Date</Label>
                    <Calendar
                      mode="single"
                      selected={tempDateRange.end || undefined}
                      onSelect={(date) => setTempDateRange(prev => ({ ...prev, end: date || null }))}
                    />
                  </div>
                  <div className="flex justify-between pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTempDateRange({ start: null, end: null })
                        updateFilter('dateRange', { start: null, end: null })
                      }}
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      onClick={applyDateRange}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowAdvancedFilters(true)}
          className="flex-shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
          
          {filters.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              Search: "{filters.search}"
              <X 
                className="h-3 w-3 cursor-pointer hover:bg-gray-200 rounded" 
                onClick={() => updateFilter('search', '')}
              />
            </Badge>
          )}
          
          {filters.type !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {REPORT_TYPES.find(t => t.value === filters.type)?.label}
              <X 
                className="h-3 w-3 cursor-pointer hover:bg-gray-200 rounded" 
                onClick={() => updateFilter('type', 'all')}
              />
            </Badge>
          )}
          
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {REPORT_STATUSES.find(s => s.value === filters.status)?.label}
              <X 
                className="h-3 w-3 cursor-pointer hover:bg-gray-200 rounded" 
                onClick={() => updateFilter('status', 'all')}
              />
            </Badge>
          )}
          
          {(filters.dateRange.start || filters.dateRange.end) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              {formatDateRange()}
              <X 
                className="h-3 w-3 cursor-pointer hover:bg-gray-200 rounded" 
                onClick={() => updateFilter('dateRange', { start: null, end: null })}
              />
            </Badge>
          )}
          
          {filters.starred && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              Starred only
              <X 
                className="h-3 w-3 cursor-pointer hover:bg-gray-200 rounded" 
                onClick={() => updateFilter('starred', false)}
              />
            </Badge>
          )}
          
          {filters.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              #{tag}
              <X 
                className="h-3 w-3 cursor-pointer hover:bg-gray-200 rounded" 
                onClick={() => removeTag(tag)}
              />
            </Badge>
          ))}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center space-x-2">
          {isLoading ? (
            <>
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Searching reports...</span>
            </>
          ) : (
            <span>
              {totalResults} {totalResults === 1 ? 'report' : 'reports'} found
              {activeFilterCount > 0 && ` with ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''}`}
            </span>
          )}
        </div>
        
        {onExportFiltered && totalResults > 0 && (
          <Button variant="ghost" size="sm" onClick={onExportFiltered}>
            <Download className="h-3 w-3 mr-1" />
            Export filtered
          </Button>
        )}
      </div>

      {/* Advanced Filters Dialog */}
      <Dialog open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Advanced Filters</span>
            </DialogTitle>
            <DialogDescription>
              Configure detailed filtering options for your reports
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* Tags */}
            <div className="space-y-3">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {COMMON_TAGS.map((tag) => (
                  <Button
                    key={tag}
                    variant={filters.tags.includes(tag) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTag(tag)}
                    className="text-xs"
                  >
                    #{tag}
                  </Button>
                ))}
              </div>
              {filters.tags.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Selected: {filters.tags.join(', ')}
                </div>
              )}
            </div>

            {/* Author */}
            <div className="space-y-2">
              <Label>Author</Label>
              <Select value={filters.author} onValueChange={(value) => updateFilter('author', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUTHORS.map((author) => (
                    <SelectItem key={author.value} value={author.value}>
                      {author.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <Label>Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="starred"
                    checked={filters.starred}
                    onCheckedChange={(checked) => updateFilter('starred', checked as boolean)}
                  />
                  <Label htmlFor="starred" className="flex items-center space-x-2 cursor-pointer">
                    <Star className="h-4 w-4" />
                    <span>Show starred reports only</span>
                  </Label>
                </div>
              </div>
            </div>

            {/* Size Range */}
            <div className="space-y-3">
              <Label>File Size (MB)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Min Size</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.size.min || ''}
                    onChange={(e) => updateFilter('size', {
                      ...filters.size,
                      min: e.target.value ? parseFloat(e.target.value) : null
                    })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Max Size</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={filters.size.max || ''}
                    onChange={(e) => updateFilter('size', {
                      ...filters.size,
                      max: e.target.value ? parseFloat(e.target.value) : null
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Generation Time Range */}
            <div className="space-y-3">
              <Label>Generation Time (minutes)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Min Time</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.generationTime.min || ''}
                    onChange={(e) => updateFilter('generationTime', {
                      ...filters.generationTime,
                      min: e.target.value ? parseFloat(e.target.value) : null
                    })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Max Time</Label>
                  <Input
                    type="number"
                    placeholder="60"
                    value={filters.generationTime.max || ''}
                    onChange={(e) => updateFilter('generationTime', {
                      ...filters.generationTime,
                      max: e.target.value ? parseFloat(e.target.value) : null
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={clearAllFilters}>
              Clear All
            </Button>
            <Button onClick={() => setShowAdvancedFilters(false)}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}