import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

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

async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
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
  await ensureDirs()
  await fs.writeFile(INDEX_FILE, JSON.stringify(invoices, null, 2))
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// GET /api/invoices — list all invoices
export async function GET() {
  try {
    const invoices = await readInvoices()
    return NextResponse.json({ invoices })
  } catch (error) {
    console.error('Failed to read invoices:', error)
    return NextResponse.json({ invoices: [] })
  }
}

// POST /api/invoices — upload new invoice
export async function POST(request: NextRequest) {
  try {
    await ensureDirs()

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ message: 'لم يتم اختيار ملف' }, { status: 400 })
    }

    // Validate file
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ]
    const maxSize = 10 * 1024 * 1024

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: 'نوع الملف غير مدعوم' }, { status: 400 })
    }
    if (file.size > maxSize) {
      return NextResponse.json({ message: 'حجم الملف أكبر من 10MB' }, { status: 400 })
    }

    // Save file
    const id = randomUUID()
    const ext = path.extname(file.name) || '.pdf'
    const savedFileName = `${id}${ext}`
    const filePath = path.join(UPLOAD_DIR, savedFileName)

    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filePath, buffer)

    // Read form fields
    const invoiceNumber = formData.get('invoiceNumber') as string || ''
    const vendor = formData.get('vendor') as string || ''
    const amount = parseFloat(formData.get('amount') as string || '0')
    const currency = formData.get('currency') as string || 'SAR'
    const date = formData.get('date') as string || new Date().toISOString().split('T')[0]
    const dueDate = formData.get('dueDate') as string || ''
    const category = formData.get('category') as string || ''
    const description = formData.get('description') as string || ''

    if (!invoiceNumber || !vendor || !amount) {
      return NextResponse.json({ message: 'يرجى ملء الحقول المطلوبة' }, { status: 400 })
    }

    const invoice: Invoice = {
      id,
      invoiceNumber,
      vendor,
      amount,
      currency,
      date,
      dueDate,
      status: 'pending',
      category,
      description,
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      fileUrl: `/uploads/invoices/${savedFileName}`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'admin',
    }

    const invoices = await readInvoices()
    invoices.unshift(invoice)
    await writeInvoices(invoices)

    return NextResponse.json({ invoice, message: 'تم رفع الفاتورة بنجاح' })
  } catch (error) {
    console.error('Upload failed:', error)
    return NextResponse.json({ message: 'فشل رفع الفاتورة' }, { status: 500 })
  }
}
