"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { 
  Download,
  FileText,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Eye,
  Settings,
  Palette,
  Layout,
  Image as ImageIcon,
  BarChart3,
  Lock,
  Share2
} from 'lucide-react'

interface PDFExportOptions {
  format: 'A4' | 'Letter' | 'Legal'
  orientation: 'portrait' | 'landscape'
  includeCharts: boolean
  includeImages: boolean
  includeMetadata: boolean
  includeToc: boolean
  quality: 'low' | 'medium' | 'high'
  theme: 'light' | 'dark' | 'minimal'
  headerFooter: boolean
  pageNumbers: boolean
  watermark: boolean
  protection: {
    password: boolean
    printing: boolean
    copying: boolean
  }
}

interface PDFExportProps {
  reportId: string
  reportTitle: string
  reportType: string
  isOpen: boolean
  onClose: () => void
  onExportComplete?: (downloadUrl: string) => void
  className?: string
}

const DEFAULT_OPTIONS: PDFExportOptions = {
  format: 'A4',
  orientation: 'portrait',
  includeCharts: true,
  includeImages: true,
  includeMetadata: true,
  includeToc: true,
  quality: 'high',
  theme: 'light',
  headerFooter: true,
  pageNumbers: true,
  watermark: false,
  protection: {
    password: false,
    printing: true,
    copying: true
  }
}

export function PDFExport({
  reportId,
  reportTitle,
  reportType,
  isOpen,
  onClose,
  onExportComplete,
  className = ""
}: PDFExportProps) {
  const [options, setOptions] = useState<PDFExportOptions>(DEFAULT_OPTIONS)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportStage, setExportStage] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const updateOption = <K extends keyof PDFExportOptions>(
    key: K,
    value: PDFExportOptions[K]
  ) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const updateProtectionOption = <K extends keyof PDFExportOptions['protection']>(
    key: K,
    value: PDFExportOptions['protection'][K]
  ) => {
    setOptions(prev => ({
      ...prev,
      protection: {
        ...prev.protection,
        [key]: value
      }
    }))
  }

  const estimateFileSize = () => {
    let baseSize = 0.5 // Base PDF size in MB
    
    if (options.includeCharts) baseSize += 1.5
    if (options.includeImages) baseSize += 2.0
    if (options.quality === 'high') baseSize *= 1.5
    else if (options.quality === 'low') baseSize *= 0.7
    
    if (reportType === 'weekly') baseSize *= 2
    else if (reportType === 'monthly') baseSize *= 3
    
    return Math.round(baseSize * 10) / 10
  }

  const estimateGenerationTime = () => {
    let baseTime = 15 // Base time in seconds
    
    if (options.includeCharts) baseTime += 20
    if (options.includeImages) baseTime += 10
    if (options.quality === 'high') baseTime += 15
    if (options.protection.password) baseTime += 5
    
    if (reportType === 'weekly') baseTime += 20
    else if (reportType === 'monthly') baseTime += 40
    
    return Math.round(baseTime)
  }

  const simulateExport = async () => {
    setIsExporting(true)
    setError(null)
    setExportProgress(0)
    
    const stages = [
      { name: 'Preparing report data...', duration: 2000 },
      { name: 'Rendering content...', duration: 3000 },
      { name: 'Generating charts...', duration: options.includeCharts ? 4000 : 1000 },
      { name: 'Processing images...', duration: options.includeImages ? 3000 : 500 },
      { name: 'Applying formatting...', duration: 2000 },
      { name: 'Creating PDF...', duration: 3000 },
      { name: 'Finalizing document...', duration: 1000 }
    ]

    try {
      for (let i = 0; i < stages.length; i++) {
        setExportStage(stages[i].name)
        
        // Simulate stage processing
        const startProgress = (i / stages.length) * 100
        const endProgress = ((i + 1) / stages.length) * 100
        
        const steps = 10
        for (let step = 0; step <= steps; step++) {
          const progress = startProgress + (endProgress - startProgress) * (step / steps)
          setExportProgress(progress)
          await new Promise(resolve => setTimeout(resolve, stages[i].duration / steps))
        }
      }

      // Simulate final PDF generation
      const mockDownloadUrl = `/api/reports/${reportId}/download/pdf`
      setPreviewUrl(mockDownloadUrl)
      onExportComplete?.(mockDownloadUrl)
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExport = async () => {
    await simulateExport()
  }

  const getQualityDescription = (quality: string) => {
    switch (quality) {
      case 'low': return 'Smaller file, faster generation'
      case 'medium': return 'Balanced quality and size'
      case 'high': return 'Best quality, larger file'
      default: return ''
    }
  }

  const getThemeDescription = (theme: string) => {
    switch (theme) {
      case 'light': return 'Standard light theme with full colors'
      case 'dark': return 'Dark theme optimized for screens'
      case 'minimal': return 'Clean minimal design for printing'
      default: return ''
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-2xl ${className}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-blue-600" />
            <span>Export to PDF</span>
          </DialogTitle>
          <DialogDescription>
            Configure export options for "{reportTitle}"
          </DialogDescription>
        </DialogHeader>

        {!isExporting ? (
          <div className="grid gap-6 py-4">
            {/* Page Setup */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center space-x-2">
                  <Layout className="h-4 w-4" />
                  <span>Page Setup</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Format</Label>
                    <Select value={options.format} onValueChange={(value: any) => updateOption('format', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                        <SelectItem value="Letter">Letter (8.5 × 11 in)</SelectItem>
                        <SelectItem value="Legal">Legal (8.5 × 14 in)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Orientation</Label>
                    <Select value={options.orientation} onValueChange={(value: any) => updateOption('orientation', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Options */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Content Options</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeCharts"
                        checked={options.includeCharts}
                        onCheckedChange={(checked) => updateOption('includeCharts', checked as boolean)}
                      />
                      <Label htmlFor="includeCharts" className="flex items-center space-x-2 cursor-pointer">
                        <BarChart3 className="h-4 w-4" />
                        <span>Include Charts</span>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeImages"
                        checked={options.includeImages}
                        onCheckedChange={(checked) => updateOption('includeImages', checked as boolean)}
                      />
                      <Label htmlFor="includeImages" className="flex items-center space-x-2 cursor-pointer">
                        <ImageIcon className="h-4 w-4" />
                        <span>Include Images</span>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeMetadata"
                        checked={options.includeMetadata}
                        onCheckedChange={(checked) => updateOption('includeMetadata', checked as boolean)}
                      />
                      <Label htmlFor="includeMetadata" className="cursor-pointer">
                        Include Metadata
                      </Label>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeToc"
                        checked={options.includeToc}
                        onCheckedChange={(checked) => updateOption('includeToc', checked as boolean)}
                      />
                      <Label htmlFor="includeToc" className="cursor-pointer">
                        Table of Contents
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="headerFooter"
                        checked={options.headerFooter}
                        onCheckedChange={(checked) => updateOption('headerFooter', checked as boolean)}
                      />
                      <Label htmlFor="headerFooter" className="cursor-pointer">
                        Header & Footer
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="pageNumbers"
                        checked={options.pageNumbers}
                        onCheckedChange={(checked) => updateOption('pageNumbers', checked as boolean)}
                      />
                      <Label htmlFor="pageNumbers" className="cursor-pointer">
                        Page Numbers
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quality & Theme */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center space-x-2">
                  <Palette className="h-4 w-4" />
                  <span>Quality & Theme</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quality</Label>
                    <Select value={options.quality} onValueChange={(value: any) => updateOption('quality', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Quality</SelectItem>
                        <SelectItem value="medium">Medium Quality</SelectItem>
                        <SelectItem value="high">High Quality</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {getQualityDescription(options.quality)}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <Select value={options.theme} onValueChange={(value: any) => updateOption('theme', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light Theme</SelectItem>
                        <SelectItem value="dark">Dark Theme</SelectItem>
                        <SelectItem value="minimal">Minimal Theme</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {getThemeDescription(options.theme)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="watermark"
                    checked={options.watermark}
                    onCheckedChange={(checked) => updateOption('watermark', checked as boolean)}
                  />
                  <Label htmlFor="watermark" className="cursor-pointer">
                    Add GenPlatform.ai watermark
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Security Options */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>Security Options</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="passwordProtection"
                      checked={options.protection.password}
                      onCheckedChange={(checked) => updateProtectionOption('password', checked as boolean)}
                    />
                    <Label htmlFor="passwordProtection" className="cursor-pointer">
                      Password protection
                    </Label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="allowPrinting"
                        checked={options.protection.printing}
                        onCheckedChange={(checked) => updateProtectionOption('printing', checked as boolean)}
                      />
                      <Label htmlFor="allowPrinting" className="cursor-pointer">
                        Allow printing
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="allowCopying"
                        checked={options.protection.copying}
                        onCheckedChange={(checked) => updateProtectionOption('copying', checked as boolean)}
                      />
                      <Label htmlFor="allowCopying" className="cursor-pointer">
                        Allow copying
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Preview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Export Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">
                      ~{estimateFileSize()} MB
                    </div>
                    <div className="text-sm text-muted-foreground">Estimated Size</div>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      ~{estimateGenerationTime()}s
                    </div>
                    <div className="text-sm text-muted-foreground">Generation Time</div>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600 capitalize">
                      {options.format}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {options.orientation === 'portrait' ? 'Portrait' : 'Landscape'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Export Error</span>
                </div>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8">
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Generating PDF</h3>
                <p className="text-muted-foreground">{exportStage}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(exportProgress)}%</span>
                </div>
                <Progress value={exportProgress} className="h-3" />
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                This may take {estimateGenerationTime()} seconds depending on report complexity
              </div>
            </div>
          </div>
        )}

        {previewUrl && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Export Complete</span>
            </div>
            <p className="text-sm text-green-700 mb-3">
              Your PDF has been generated successfully and is ready for download.
            </p>
            <div className="flex items-center space-x-2">
              <Button size="sm" asChild>
                <a href={previewUrl} download>
                  <Download className="h-3 w-3 mr-1" />
                  Download PDF
                </a>
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="h-3 w-3 mr-1" />
                Preview
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-3 w-3 mr-1" />
                Share
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            {isExporting ? 'Generating...' : 'Cancel'}
          </Button>
          {!previewUrl && (
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate PDF
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}