"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Download, 
  FileText, 
  Loader2,
  Settings
} from 'lucide-react'
import { exportReportToPDF, type PDFExportOptions } from '@/lib/pdf-export'
import type { Report } from '@/components/reports/report-card'

interface PDFExportButtonProps {
  report: Report
  variant?: 'button' | 'dropdown-item'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

export function PDFExportButton({ 
  report, 
  variant = 'button',
  size = 'md',
  disabled = false 
}: PDFExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [showAdvancedDialog, setShowAdvancedDialog] = useState(false)
  const [exportOptions, setExportOptions] = useState<PDFExportOptions>({
    format: 'A4',
    orientation: 'portrait',
    includeCharts: true,
    includeMetrics: true
  })

  const handleQuickExport = async () => {
    if (report.status !== 'completed' || disabled) return

    setIsExporting(true)
    try {
      await exportReportToPDF(report)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Export failed:', error);
      }
      // TODO: Show error notification
    } finally {
      setIsExporting(false)
    }
  }

  const handleAdvancedExport = async () => {
    if (report.status !== 'completed' || disabled) return

    setIsExporting(true)
    try {
      await exportReportToPDF(report, exportOptions)
      setShowAdvancedDialog(false)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Export failed:', error);
      }
      // TODO: Show error notification
    } finally {
      setIsExporting(false)
    }
  }

  const isDisabled = disabled || report.status !== 'completed' || isExporting

  if (variant === 'dropdown-item') {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <DropdownMenuItem disabled={isDisabled}>
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export PDF
            </DropdownMenuItem>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start">
            <DropdownMenuLabel>Export Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleQuickExport} disabled={isDisabled}>
              <FileText className="h-4 w-4 mr-2" />
              Quick Export
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowAdvancedDialog(true)} disabled={isDisabled}>
              <Settings className="h-4 w-4 mr-2" />
              Advanced Options
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ExportOptionsDialog 
          open={showAdvancedDialog}
          onClose={() => setShowAdvancedDialog(false)}
          options={exportOptions}
          onOptionsChange={setExportOptions}
          onExport={handleAdvancedExport}
          isExporting={isExporting}
          reportTitle={report.title}
        />
      </>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size={size}
            disabled={isDisabled}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export PDF
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Export Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleQuickExport} disabled={isDisabled}>
            <FileText className="h-4 w-4 mr-2" />
            Quick Export
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowAdvancedDialog(true)} disabled={isDisabled}>
            <Settings className="h-4 w-4 mr-2" />
            Advanced Options
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ExportOptionsDialog 
        open={showAdvancedDialog}
        onClose={() => setShowAdvancedDialog(false)}
        options={exportOptions}
        onOptionsChange={setExportOptions}
        onExport={handleAdvancedExport}
        isExporting={isExporting}
        reportTitle={report.title}
      />
    </>
  )
}

interface ExportOptionsDialogProps {
  open: boolean
  onClose: () => void
  options: PDFExportOptions
  onOptionsChange: (options: PDFExportOptions) => void
  onExport: () => void
  isExporting: boolean
  reportTitle: string
}

function ExportOptionsDialog({
  open,
  onClose,
  options,
  onOptionsChange,
  onExport,
  isExporting,
  reportTitle
}: ExportOptionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>PDF Export Options</DialogTitle>
          <DialogDescription>
            Customize the PDF export settings for "{reportTitle}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Paper Format */}
          <div className="space-y-2">
            <Label htmlFor="format">Paper Format</Label>
            <Select 
              value={options.format} 
              onValueChange={(value) => 
                onOptionsChange({ ...options, format: value as PDFExportOptions['format'] })
              }
            >
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4 (210 x 297 mm)</SelectItem>
                <SelectItem value="Letter">Letter (8.5 x 11 in)</SelectItem>
                <SelectItem value="Legal">Legal (8.5 x 14 in)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orientation */}
          <div className="space-y-2">
            <Label htmlFor="orientation">Orientation</Label>
            <Select 
              value={options.orientation} 
              onValueChange={(value) => 
                onOptionsChange({ ...options, orientation: value as PDFExportOptions['orientation'] })
              }
            >
              <SelectTrigger id="orientation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Portrait</SelectItem>
                <SelectItem value="landscape">Landscape</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Include Options */}
          <div className="space-y-3">
            <Label>Include in Export</Label>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeMetrics"
                  checked={options.includeMetrics}
                  onCheckedChange={(checked) =>
                    onOptionsChange({ ...options, includeMetrics: checked as boolean })
                  }
                />
                <Label htmlFor="includeMetrics" className="text-sm font-normal">
                  Key Metrics
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCharts"
                  checked={options.includeCharts}
                  onCheckedChange={(checked) =>
                    onOptionsChange({ ...options, includeCharts: checked as boolean })
                  }
                />
                <Label htmlFor="includeCharts" className="text-sm font-normal">
                  Charts and Visualizations
                </Label>
              </div>
            </div>
          </div>

          {/* Preview Info */}
          <div className="p-3 bg-muted rounded-lg">
            <h4 className="text-sm font-medium mb-2">Export Preview</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Format: {options.format} {options.orientation}</div>
              <div>
                Content: Report information
                {options.includeMetrics && ', Key metrics'}
                {options.includeCharts && ', Charts'}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={onExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}