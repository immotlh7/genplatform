import type { Report } from '@/components/reports/report-card'

/**
 * PDF Export utilities for reports
 * Uses browser's print API to generate PDFs from HTML content
 */

export interface PDFExportOptions {
  filename?: string
  includeCharts?: boolean
  includeMetrics?: boolean
  format?: 'A4' | 'Letter' | 'Legal'
  orientation?: 'portrait' | 'landscape'
}

export class PDFExporter {
  private static instance: PDFExporter
  
  public static getInstance(): PDFExporter {
    if (!PDFExporter.instance) {
      PDFExporter.instance = new PDFExporter()
    }
    return PDFExporter.instance
  }

  /**
   * Export report to PDF using browser's print API
   */
  async exportReportToPDF(report: Report, options: PDFExportOptions = {}): Promise<void> {
    const {
      filename = `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
      format = 'A4',
      orientation = 'portrait'
    } = options

    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      if (!printWindow) {
        throw new Error('Unable to open print window. Please allow popups and try again.')
      }

      // Generate HTML content for the report
      const htmlContent = this.generateReportHTML(report, options)
      
      // Write HTML to the new window
      printWindow.document.write(htmlContent)
      printWindow.document.close()

      // Wait for content to load
      await new Promise(resolve => {
        printWindow.onload = resolve
        setTimeout(resolve, 1000) // Fallback timeout
      })

      // Trigger print dialog
      printWindow.focus()
      printWindow.print()

      // Close the window after printing
      setTimeout(() => {
        printWindow.close()
      }, 1000)

    } catch (error) {
      console.error('Error exporting PDF:', error)
      throw error
    }
  }

  /**
   * Generate HTML content for PDF export
   */
  private generateReportHTML(report: Report, options: PDFExportOptions): string {
    const { includeCharts = true, includeMetrics = true, format, orientation } = options
    
    const styles = this.generatePDFStyles(format, orientation)
    const content = this.generateReportContent(report, { includeCharts, includeMetrics })
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${report.title}</title>
        <style>${styles}</style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `
  }

  /**
   * Generate PDF-optimized CSS styles
   */
  private generatePDFStyles(format?: string, orientation?: string): string {
    return `
      @page {
        size: ${format || 'A4'} ${orientation || 'portrait'};
        margin: 2cm;
      }
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 11pt;
        line-height: 1.5;
        color: #374151;
        background: white;
      }
      
      .header {
        text-align: center;
        margin-bottom: 2em;
        border-bottom: 2px solid #e5e7eb;
        padding-bottom: 1em;
      }
      
      .header h1 {
        font-size: 18pt;
        font-weight: bold;
        color: #111827;
        margin-bottom: 0.5em;
      }
      
      .header .meta {
        font-size: 10pt;
        color: #6b7280;
      }
      
      .section {
        margin-bottom: 2em;
        page-break-inside: avoid;
      }
      
      .section-title {
        font-size: 14pt;
        font-weight: bold;
        color: #111827;
        margin-bottom: 1em;
        padding-bottom: 0.5em;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1em;
        margin-bottom: 1.5em;
      }
      
      .metric-card {
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 1em;
        background: #f9fafb;
      }
      
      .metric-label {
        font-size: 9pt;
        color: #6b7280;
        margin-bottom: 0.25em;
      }
      
      .metric-value {
        font-size: 16pt;
        font-weight: bold;
        color: #111827;
      }
      
      .table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 1.5em;
      }
      
      .table th,
      .table td {
        text-align: left;
        padding: 0.5em;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .table th {
        background: #f3f4f6;
        font-weight: bold;
        font-size: 10pt;
      }
      
      .table td {
        font-size: 10pt;
      }
      
      .badge {
        display: inline-block;
        padding: 0.25em 0.5em;
        font-size: 8pt;
        font-weight: bold;
        border-radius: 4px;
        background: #e5e7eb;
        color: #374151;
      }
      
      .badge-success {
        background: #d1fae5;
        color: #065f46;
      }
      
      .badge-warning {
        background: #fef3c7;
        color: #92400e;
      }
      
      .badge-error {
        background: #fee2e2;
        color: #991b1b;
      }
      
      .footer {
        margin-top: 3em;
        padding-top: 1em;
        border-top: 1px solid #e5e7eb;
        font-size: 9pt;
        color: #6b7280;
        text-align: center;
      }
      
      .no-print {
        display: none !important;
      }
      
      .page-break {
        page-break-before: always;
      }
    `
  }

  /**
   * Generate report content HTML
   */
  private generateReportContent(report: Report, options: { includeCharts: boolean, includeMetrics: boolean }): string {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const getStatusBadge = (status: string) => {
      const statusConfig = {
        completed: 'badge-success',
        generating: 'badge-warning',
        failed: 'badge-error',
        scheduled: 'badge'
      }
      return statusConfig[status as keyof typeof statusConfig] || 'badge'
    }

    const content = `
      <div class="header">
        <h1>${report.title}</h1>
        <div class="meta">
          <div>Generated: ${formatDate(new Date().toISOString())}</div>
          <div>Report ID: ${report.id} | Type: ${report.type.toUpperCase()} | Status: ${report.status.toUpperCase()}</div>
          ${report.project ? `<div>Project: ${report.project}</div>` : ''}
        </div>
      </div>

      ${report.description ? `
        <div class="section">
          <h2 class="section-title">Description</h2>
          <p>${report.description}</p>
        </div>
      ` : ''}

      <div class="section">
        <h2 class="section-title">Report Information</h2>
        <table class="table">
          <tr>
            <td><strong>Report Type</strong></td>
            <td><span class="badge">${report.type.toUpperCase()}</span></td>
          </tr>
          <tr>
            <td><strong>Status</strong></td>
            <td><span class="badge ${getStatusBadge(report.status)}">${report.status.toUpperCase()}</span></td>
          </tr>
          <tr>
            <td><strong>Created</strong></td>
            <td>${formatDate(report.createdAt)}</td>
          </tr>
          ${report.updatedAt ? `
            <tr>
              <td><strong>Last Updated</strong></td>
              <td>${formatDate(report.updatedAt)}</td>
            </tr>
          ` : ''}
          ${report.size ? `
            <tr>
              <td><strong>File Size</strong></td>
              <td>${report.size}</td>
            </tr>
          ` : ''}
          ${report.insights ? `
            <tr>
              <td><strong>Insights Generated</strong></td>
              <td>${report.insights}</td>
            </tr>
          ` : ''}
          ${report.author ? `
            <tr>
              <td><strong>Author</strong></td>
              <td>${report.author}</td>
            </tr>
          ` : ''}
        </table>
      </div>

      ${options.includeMetrics && report.metrics && Object.keys(report.metrics).length > 0 ? `
        <div class="section">
          <h2 class="section-title">Key Metrics</h2>
          <div class="metrics-grid">
            ${Object.entries(report.metrics).map(([key, value]) => `
              <div class="metric-card">
                <div class="metric-label">${key.replace(/([A-Z])/g, ' $1').trim()}</div>
                <div class="metric-value">${value}${typeof value === 'number' && key.includes('Score') ? '%' : ''}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${report.tags && report.tags.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Tags</h2>
          <div>
            ${report.tags.map(tag => `<span class="badge">${tag}</span>`).join(' ')}
          </div>
        </div>
      ` : ''}

      <div class="section">
        <h2 class="section-title">Summary</h2>
        <p>
          This ${report.type} report was generated on ${formatDate(report.createdAt)} 
          ${report.project ? `for the ${report.project} project` : ''}. 
          ${report.status === 'completed' ? `The report contains ${report.insights || 0} AI-generated insights and covers key metrics for analysis.` : `The report is currently ${report.status}.`}
          ${report.description ? ` ${report.description}` : ''}
        </p>
        
        ${report.status === 'completed' && report.insights && report.insights > 0 ? `
          <p style="margin-top: 1em;">
            <strong>Insights:</strong> This report includes ${report.insights} automated insights and recommendations 
            generated by the AI analysis engine. These insights can help identify optimization opportunities, 
            performance improvements, and potential issues requiring attention.
          </p>
        ` : ''}
      </div>

      <div class="footer">
        <div>Generated by GenPlatform.ai Mission Control Dashboard</div>
        <div>Report exported on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
        <div style="margin-top: 0.5em; font-size: 8pt;">
          This is an automated report. For questions or support, contact your system administrator.
        </div>
      </div>
    `

    return content
  }

  /**
   * Batch export multiple reports
   */
  async batchExportReports(reports: Report[], options: PDFExportOptions = {}): Promise<void> {
    for (let i = 0; i < reports.length; i++) {
      const report = reports[i]
      const batchOptions = {
        ...options,
        filename: options.filename || `report_${report.id}_${Date.now()}.pdf`
      }
      
      try {
        await this.exportReportToPDF(report, batchOptions)
        
        // Add delay between exports to prevent browser issues
        if (i < reports.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error(`Error exporting report ${report.id}:`, error)
        // Continue with next report
      }
    }
  }

  /**
   * Check if PDF export is supported
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'print' in window
  }
}

// Export singleton instance
export const pdfExporter = PDFExporter.getInstance()

// Helper functions for common use cases
export const exportReportToPDF = (report: Report, options?: PDFExportOptions) => {
  return pdfExporter.exportReportToPDF(report, options)
}

export const exportMultipleReports = (reports: Report[], options?: PDFExportOptions) => {
  return pdfExporter.batchExportReports(reports, options)
}