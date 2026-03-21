import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'invoices')
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'invoices')
const INDEX_FILE = path.join(DATA_DIR, 'index.json')

interface Invoice {
  id: string
  invoiceNumber: string
  vendor: string
  amount: number
  currency: string
  date: string
  dueDate: string
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  category: string
  description: string
  fileName: string
  fileSize: string
  fileUrl: string
  uploadedAt: string
  uploadedBy: string
}

async function readInvoices(): Promise<Invoice[]> {
  try {
    const data = await fs.readFile(INDEX_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function writeInvoices(invoices: Invoice[]) {
  await fs.writeFile(INDEX_FILE, JSON.stringify(invoices, null, 2))
}

// GET /api/invoices/[id] — get single invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const invoices = await readInvoices()
  const invoice = invoices.find(inv => inv.id === id)
  
  if (!invoice) {
    return NextResponse.json({ message: 'الفاتورة غير موجودة' }, { status: 404 })
  }
  
  return NextResponse.json({ invoice })
}

// PATCH /api/invoices/[id] — update invoice (status, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const invoices = await readInvoices()
    const index = invoices.findIndex(inv => inv.id === id)
    
    if (index === -1) {
      return NextResponse.json({ message: 'الفاتورة غير موجودة' }, { status: 404 })
    }
    
    // Update allowed fields
    const allowedFields = ['status', 'category', 'description', 'vendor', 'amount', 'dueDate']
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        (invoices[index] as any)[field] = body[field]
      }
    }
    
    await writeInvoices(invoices)
    
    return NextResponse.json({ invoice: invoices[index], message: 'تم تحديث الفاتورة' })
  } catch (error) {
    console.error('Update failed:', error)
    return NextResponse.json({ message: 'فشل تحديث الفاتورة' }, { status: 500 })
  }
}

// DELETE /api/invoices/[id] — delete invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const invoices = await readInvoices()
    const invoice = invoices.find(inv => inv.id === id)
    
    if (!invoice) {
      return NextResponse.json({ message: 'الفاتورة غير موجودة' }, { status: 404 })
    }
    
    // Delete the file
    try {
      const filePath = path.join(UPLOAD_DIR, path.basename(invoice.fileUrl))
      await fs.unlink(filePath)
    } catch {
      // File might already be deleted
    }
    
    const updatedInvoices = invoices.filter(inv => inv.id !== id)
    await writeInvoices(updatedInvoices)
    
    return NextResponse.json({ message: 'تم حذف الفاتورة' })
  } catch (error) {
    console.error('Delete failed:', error)
    return NextResponse.json({ message: 'فشل حذف الفاتورة' }, { status: 500 })
  }
}
