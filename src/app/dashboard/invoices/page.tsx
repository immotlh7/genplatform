"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  FileText,
  Upload,
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Receipt,
  DollarSign,
  Calendar,
  Building2,
  FileUp,
  X,
  Loader2,
  ArrowUpDown,
  RefreshCw
} from "lucide-react"

interface Invoice {
  id: string
  invoiceNumber: string
  vendor: string
  amount: number
  currency: string
  date: string
  dueDate: string
  status: "pending" | "approved" | "rejected" | "paid"
  category: string
  description: string
  fileName: string
  fileSize: string
  fileUrl: string
  uploadedAt: string
  uploadedBy: string
}

const CATEGORIES = [
  "خدمات",
  "أجهزة ومعدات",
  "برمجيات",
  "استضافة وسيرفرات",
  "تسويق",
  "استشارات",
  "مصاريف عامة",
  "رواتب",
  "إيجار",
  "أخرى"
]

const CURRENCIES = ["SAR", "USD", "EUR", "AED", "EGP"]

const STATUS_CONFIG = {
  pending: { label: "قيد المراجعة", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: Clock },
  approved: { label: "معتمدة", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle },
  rejected: { label: "مرفوضة", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
  paid: { label: "مدفوعة", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: DollarSign },
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("date-desc")
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [form, setForm] = useState({
    invoiceNumber: "",
    vendor: "",
    amount: "",
    currency: "SAR",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    category: "",
    description: "",
  })

  // Load invoices
  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/invoices")
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices || [])
      }
    } catch (err) {
      console.error("Failed to fetch invoices:", err)
    } finally {
      setLoading(false)
    }
  }

  // Drag & Drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (validateFile(file)) {
        setSelectedFile(file)
      }
    }
  }, [])

  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ]
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!allowedTypes.includes(file.type)) {
      alert("نوع الملف غير مدعوم. الأنواع المسموحة: PDF, JPG, PNG, WebP, Excel")
      return false
    }
    if (file.size > maxSize) {
      alert("حجم الملف كبير جداً. الحد الأقصى 10MB")
      return false
    }
    return true
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (validateFile(file)) {
        setSelectedFile(file)
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    if (!form.invoiceNumber || !form.vendor || !form.amount) {
      alert("يرجى ملء الحقول المطلوبة: رقم الفاتورة، المورد، والمبلغ")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("invoiceNumber", form.invoiceNumber)
      formData.append("vendor", form.vendor)
      formData.append("amount", form.amount)
      formData.append("currency", form.currency)
      formData.append("date", form.date)
      formData.append("dueDate", form.dueDate)
      formData.append("category", form.category)
      formData.append("description", form.description)

      const res = await fetch("/api/invoices", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setInvoices(prev => [data.invoice, ...prev])
        resetForm()
        setShowUploadDialog(false)
      } else {
        const error = await res.json()
        alert(error.message || "فشل رفع الفاتورة")
      }
    } catch (err) {
      console.error("Upload failed:", err)
      alert("حدث خطأ أثناء رفع الفاتورة")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الفاتورة؟")) return
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" })
      if (res.ok) {
        setInvoices(prev => prev.filter(inv => inv.id !== id))
      }
    } catch (err) {
      console.error("Delete failed:", err)
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setInvoices(prev =>
          prev.map(inv => (inv.id === id ? { ...inv, status: status as Invoice["status"] } : inv))
        )
      }
    } catch (err) {
      console.error("Status update failed:", err)
    }
  }

  const resetForm = () => {
    setForm({
      invoiceNumber: "",
      vendor: "",
      amount: "",
      currency: "SAR",
      date: new Date().toISOString().split("T")[0],
      dueDate: "",
      category: "",
      description: "",
    })
    setSelectedFile(null)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  // Filter & sort
  const filteredInvoices = invoices
    .filter(inv => {
      if (statusFilter !== "all" && inv.status !== statusFilter) return false
      if (categoryFilter !== "all" && inv.category !== categoryFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.vendor.toLowerCase().includes(q) ||
          inv.description.toLowerCase().includes(q)
        )
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return new Date(b.date).getTime() - new Date(a.date).getTime()
        case "date-asc": return new Date(a.date).getTime() - new Date(b.date).getTime()
        case "amount-desc": return b.amount - a.amount
        case "amount-asc": return a.amount - b.amount
        default: return 0
      }
    })

  // Stats
  const stats = {
    total: invoices.length,
    pending: invoices.filter(i => i.status === "pending").length,
    approved: invoices.filter(i => i.status === "approved").length,
    totalAmount: invoices.reduce((sum, i) => sum + i.amount, 0),
    paidAmount: invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + i.amount, 0),
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الفواتير</h1>
          <p className="text-muted-foreground mt-1">إدارة ورفع الفواتير والمستندات المالية</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchInvoices}>
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 ml-2" />
                رفع فاتورة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle>رفع فاتورة جديدة</DialogTitle>
                <DialogDescription>
                  ارفع ملف الفاتورة وأدخل البيانات المطلوبة
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* File Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : selectedFile
                      ? "border-green-500 bg-green-500/5"
                      : "border-muted-foreground/25 hover:border-primary/50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls"
                    onChange={handleFileSelect}
                  />
                  {selectedFile ? (
                    <div className="space-y-2">
                      <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedFile(null)
                        }}
                      >
                        <X className="h-4 w-4 ml-1" />
                        إزالة
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FileUp className="h-10 w-10 text-muted-foreground mx-auto" />
                      <p className="font-medium">اسحب الملف هنا أو اضغط للاختيار</p>
                      <p className="text-sm text-muted-foreground">
                        PDF, صور (JPG, PNG, WebP), Excel — حتى 10MB
                      </p>
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>رقم الفاتورة *</Label>
                    <Input
                      placeholder="INV-001"
                      value={form.invoiceNumber}
                      onChange={(e) => setForm(f => ({ ...f, invoiceNumber: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>المورد / الجهة *</Label>
                    <Input
                      placeholder="اسم المورد أو الشركة"
                      value={form.vendor}
                      onChange={(e) => setForm(f => ({ ...f, vendor: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>المبلغ *</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>العملة</Label>
                    <Select value={form.currency} onValueChange={(v) => setForm(f => ({ ...f, currency: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>تاريخ الفاتورة</Label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>تاريخ الاستحقاق</Label>
                    <Input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>التصنيف</Label>
                  <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Textarea
                    placeholder="أي ملاحظات إضافية..."
                    value={form.description}
                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => { resetForm(); setShowUploadDialog(false) }}>
                  إلغاء
                </Button>
                <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      جاري الرفع...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 ml-2" />
                      رفع الفاتورة
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الفواتير</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="h-10 w-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Receipt className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">قيد المراجعة</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <div className="h-10 w-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">معتمدة</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
              <div className="h-10 w-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المبالغ</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat("ar-SA").format(stats.totalAmount)}
                </p>
              </div>
              <div className="h-10 w-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث برقم الفاتورة، المورد، أو الوصف..."
                className="pr-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">قيد المراجعة</SelectItem>
                <SelectItem value="approved">معتمدة</SelectItem>
                <SelectItem value="rejected">مرفوضة</SelectItem>
                <SelectItem value="paid">مدفوعة</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="التصنيف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع التصنيفات</SelectItem>
                {CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <ArrowUpDown className="h-4 w-4 ml-2" />
                <SelectValue placeholder="الترتيب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">الأحدث أولاً</SelectItem>
                <SelectItem value="date-asc">الأقدم أولاً</SelectItem>
                <SelectItem value="amount-desc">الأعلى مبلغاً</SelectItem>
                <SelectItem value="amount-asc">الأقل مبلغاً</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            قائمة الفواتير
          </CardTitle>
          <CardDescription>
            {filteredInvoices.length} فاتورة {statusFilter !== "all" && `(${STATUS_CONFIG[statusFilter as keyof typeof STATUS_CONFIG]?.label})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-medium">لا توجد فواتير</h3>
              <p className="text-muted-foreground">
                {invoices.length === 0
                  ? "ابدأ برفع أول فاتورة"
                  : "لا توجد نتائج مطابقة للبحث"}
              </p>
              {invoices.length === 0 && (
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Upload className="h-4 w-4 ml-2" />
                  رفع فاتورة
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInvoices.map((invoice) => {
                const statusConf = STATUS_CONFIG[invoice.status]
                const StatusIcon = statusConf.icon
                return (
                  <div
                    key={invoice.id}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    {/* File Icon */}
                    <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{invoice.invoiceNumber}</span>
                        <Badge variant="outline" className={statusConf.color}>
                          <StatusIcon className="h-3 w-3 ml-1" />
                          {statusConf.label}
                        </Badge>
                        {invoice.category && (
                          <Badge variant="secondary" className="text-xs">
                            {invoice.category}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {invoice.vendor}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(invoice.date).toLocaleDateString("ar-SA")}
                        </span>
                        <span className="text-xs">{invoice.fileName} ({invoice.fileSize})</span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-left flex-shrink-0">
                      <p className="font-bold text-lg">
                        {formatAmount(invoice.amount, invoice.currency)}
                      </p>
                      {invoice.dueDate && (
                        <p className="text-xs text-muted-foreground">
                          استحقاق: {new Date(invoice.dueDate).toLocaleDateString("ar-SA")}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setPreviewInvoice(invoice)}>
                          <Eye className="h-4 w-4 ml-2" />
                          عرض التفاصيل
                        </DropdownMenuItem>
                        {invoice.fileUrl && (
                          <DropdownMenuItem asChild>
                            <a href={invoice.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 ml-2" />
                              تحميل الملف
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {invoice.status === "pending" && (
                          <>
                            <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, "approved")}>
                              <CheckCircle className="h-4 w-4 ml-2 text-green-500" />
                              اعتماد
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, "rejected")}>
                              <XCircle className="h-4 w-4 ml-2 text-red-500" />
                              رفض
                            </DropdownMenuItem>
                          </>
                        )}
                        {invoice.status === "approved" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, "paid")}>
                            <DollarSign className="h-4 w-4 ml-2 text-blue-500" />
                            تعيين كمدفوعة
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-500"
                          onClick={() => handleDelete(invoice.id)}
                        >
                          <Trash2 className="h-4 w-4 ml-2" />
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewInvoice} onOpenChange={() => setPreviewInvoice(null)}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          {previewInvoice && (
            <>
              <DialogHeader>
                <DialogTitle>تفاصيل الفاتورة {previewInvoice.invoiceNumber}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">المورد</p>
                    <p className="font-medium">{previewInvoice.vendor}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">المبلغ</p>
                    <p className="font-medium">{formatAmount(previewInvoice.amount, previewInvoice.currency)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">التاريخ</p>
                    <p className="font-medium">{new Date(previewInvoice.date).toLocaleDateString("ar-SA")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">تاريخ الاستحقاق</p>
                    <p className="font-medium">
                      {previewInvoice.dueDate
                        ? new Date(previewInvoice.dueDate).toLocaleDateString("ar-SA")
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">الحالة</p>
                    <Badge variant="outline" className={STATUS_CONFIG[previewInvoice.status].color}>
                      {STATUS_CONFIG[previewInvoice.status].label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">التصنيف</p>
                    <p className="font-medium">{previewInvoice.category || "—"}</p>
                  </div>
                </div>
                {previewInvoice.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">ملاحظات</p>
                    <p className="text-sm">{previewInvoice.description}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm flex-1">{previewInvoice.fileName}</span>
                  <span className="text-xs text-muted-foreground">{previewInvoice.fileSize}</span>
                </div>
              </div>
              <DialogFooter>
                {previewInvoice.fileUrl && (
                  <Button asChild>
                    <a href={previewInvoice.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 ml-2" />
                      تحميل الملف
                    </a>
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
