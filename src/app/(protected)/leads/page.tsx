'use client'

import { useEffect, useState, useCallback } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { CountrySelector } from '@/components/ui/country-selector'
import { FileUpload } from '@/components/ui/file-upload'
import { StaffMultiSelector } from '@/components/ui/staff-multi-selector'
import {
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  User,
  Flame,
  Wind,
  Snowflake,
  FileText,
  Loader2,
  Kanban,
  List,
  RefreshCw,
  MessageSquare,
  ChevronLeft,
  Edit,
  Trash2,
  Download,
  Filter,
  MoreHorizontal,
  CheckSquare,
  X,
  UserPlus,
  ArrowUpDown
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { Lead, LeadStatus, LeadPriority, LeadSource, User as UserType } from '@/lib/types'

const ITEM_TYPE = 'LEAD_CARD'

const statusColumns: { status: LeadStatus; label: string; color: string }[] = [
  { status: 'new', label: 'Mới', color: '#3b82f6' },
  { status: 'contacted', label: 'Đã Liên Hệ', color: '#8b5cf6' },
  { status: 'qualified', label: 'Đủ Điều Kiện', color: '#06b6d4' },
  { status: 'quoted', label: 'Đã Báo Giá', color: '#f59e0b' },
  { status: 'negotiating', label: 'Đàm Phán', color: '#f97316' },
  { status: 'won', label: 'Thành Công', color: '#10b981' },
  { status: 'lost', label: 'Thất Bại', color: '#6b7280' },
]

interface LeadCardProps {
  lead: Lead
  onClick: () => void
}

function LeadCard({ lead, onClick }: LeadCardProps) {
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { id: lead.id, currentStatus: lead.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const dragRef = (el: HTMLDivElement | null) => {
    drag(el)
  }

  const getTimeInStage = (statusUpdatedAt?: string) => {
    if (!statusUpdatedAt) return ''
    const now = new Date()
    const updated = new Date(statusUpdatedAt)
    const diff = now.getTime() - updated.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    if (hours < 1) return 'Vừa mới'
    if (hours < 24) return `${hours}h`
    return `${days}d`
  }

  const getPriorityIcon = (priority: LeadPriority) => {
    switch (priority) {
      case 'hot':
        return <Flame className="w-3.5 h-3.5 text-red-500" />
      case 'warm':
        return <Wind className="w-3.5 h-3.5 text-orange-500" />
      case 'cold':
        return <Snowflake className="w-3.5 h-3.5 text-blue-500" />
    }
  }

  return (
    <div
      ref={dragRef}
      onClick={onClick}
      className={`bg-card border border-border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {getPriorityIcon(lead.priority)}
        </div>
        <span className="text-[10px] text-muted-foreground">
          {getTimeInStage(lead.status_updated_at)}
        </span>
      </div>

      {/* Name & Phone */}
      <div className="mb-2">
        <h4 className="font-semibold text-sm text-foreground mb-1">
          {lead.first_name} {lead.last_name}
        </h4>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Phone className="w-3 h-3" />
          <span>{lead.phone}</span>
        </div>
      </div>

      {/* Chat Channel Badge & Preview */}
      {lead.chat_channel && (
        <div className="mb-2 p-2 rounded bg-muted/50 border border-border">
          <div className="flex items-center gap-1.5 mb-1">
            <MessageSquare className="w-3 h-3 text-primary" />
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {lead.chat_channel === 'zalo' ? 'Zalo' :
               lead.chat_channel === 'whatsapp' ? 'WhatsApp' :
               lead.chat_channel === 'messenger' ? 'Messenger' :
               lead.chat_channel === 'phone' ? 'Phone' : lead.chat_channel}
            </Badge>
          </div>
          {lead.last_chat_message && (
            <p className="text-[10px] text-muted-foreground line-clamp-1 italic">
              "{lead.last_chat_message}"
            </p>
          )}
        </div>
      )}

      {/* Interest */}
      {lead.interest && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
          {lead.interest}
        </p>
      )}

      {/* Value & Assigned */}
      <div className="flex items-center justify-between text-xs mb-2 pb-2 border-b border-border">
        {lead.estimated_value ? (
          <div className="flex items-center gap-1 font-semibold text-green-600">
            <DollarSign className="w-3.5 h-3.5" />
            <span>${lead.estimated_value.toLocaleString()}</span>
          </div>
        ) : (
          <span />
        )}
        {lead.assigned_user && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <User className="w-3 h-3" />
            <span className="truncate max-w-[60px]">
              {lead.assigned_user.name?.split(' ')[0] || lead.assigned_user.email}
            </span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-1 mb-2">
        <Button size="sm" variant="ghost" className="h-7 px-1" title="Gọi điện" onClick={(e) => e.stopPropagation()}>
          <Phone className="w-3 h-3" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-1" title="Email" onClick={(e) => e.stopPropagation()}>
          <Mail className="w-3 h-3" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-1" title="Chat" onClick={(e) => e.stopPropagation()} disabled>
          <MessageSquare className="w-3 h-3" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-1" title="Tạo báo giá" onClick={(e) => e.stopPropagation()}>
          <FileText className="w-3 h-3" />
        </Button>
      </div>

      {/* Next Follow-up */}
      {lead.next_follow_up && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t border-border">
          <Calendar className="w-3 h-3 text-primary" />
          <span>
            {format(new Date(lead.next_follow_up), 'dd/MM HH:mm', { locale: vi })}
          </span>
        </div>
      )}
    </div>
  )
}

interface CollapsedColumnProps {
  status: LeadStatus
  label: string
  color: string
  leads: Lead[]
  onDrop: (leadId: string, newStatus: LeadStatus) => void
  onExpand: () => void
}

function CollapsedColumn({ status, label, color, leads, onDrop, onExpand }: CollapsedColumnProps) {
  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE,
    drop: (item: { id: string; currentStatus: LeadStatus }) => {
      if (item.currentStatus !== status) {
        onDrop(item.id, status)
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  })

  const dropRef = (el: HTMLDivElement | null) => {
    drop(el)
  }

  const totalValue = leads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0)

  return (
    <div
      ref={dropRef}
      onClick={onExpand}
      className={`flex-shrink-0 w-16 rounded-lg border-2 cursor-pointer transition-all ${
        isOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'
      }`}
      style={{ backgroundColor: isOver ? undefined : color + '10' }}
    >
      <div className="h-full flex flex-col items-center py-4 px-2">
        <div
          className="w-3 h-3 rounded-full mb-2"
          style={{ backgroundColor: color }}
        />
        <span
          className="text-xs font-semibold mb-1 writing-mode-vertical"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          {label}
        </span>
        <Badge className="text-[10px] px-1.5 py-0 mt-2" style={{ backgroundColor: color + '30', color: color }}>
          {leads.length}
        </Badge>
        <span className="text-[10px] text-muted-foreground mt-2 writing-mode-vertical" style={{ writingMode: 'vertical-rl' }}>
          ${(totalValue / 1000).toFixed(0)}k
        </span>
      </div>
    </div>
  )
}

interface PipelineColumnProps {
  status: LeadStatus
  label: string
  color: string
  leads: Lead[]
  onDrop: (leadId: string, newStatus: LeadStatus) => void
  onLeadClick: (lead: Lead) => void
  onCollapse?: () => void
}

function PipelineColumn({ status, label, color, leads, onDrop, onLeadClick, onCollapse }: PipelineColumnProps) {
  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE,
    drop: (item: { id: string; currentStatus: LeadStatus }) => {
      if (item.currentStatus !== status) {
        onDrop(item.id, status)
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  })

  const dropRef = (el: HTMLDivElement | null) => {
    drop(el)
  }

  const totalValue = leads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0)

  return (
    <div className="flex-shrink-0 w-72">
      <div
        className={`rounded-lg border-2 ${
          isOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'
        } h-full transition-colors`}
      >
        {/* Column Header */}
        <div
          className="p-3 border-b border-border"
          style={{ backgroundColor: color + '20' }}
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              {label}
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-background text-xs font-bold">
                {leads.length}
              </span>
            </h3>
            {onCollapse && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                  onCollapse()
                }}
                title="Thu gọn cột"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            ${totalValue.toLocaleString()}
          </p>
        </div>

        {/* Column Body */}
        <div
          ref={dropRef}
          className="p-2 space-y-2 min-h-[400px] max-h-[calc(100vh-320px)] overflow-y-auto"
        >
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={() => onLeadClick(lead)}
            />
          ))}
          {leads.length === 0 && (
            <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
              Kéo lead vào đây
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [users, setUsers] = useState<UserType[]>([])
  const [expandedColumns, setExpandedColumns] = useState<Set<LeadStatus>>(new Set())

  // Bulk selection state
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set())
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false)
  const [bulkAssignees, setBulkAssignees] = useState<string[]>([])

  // Advanced filter state
  const [showFilters, setShowFilters] = useState(false)
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<LeadPriority | 'all'>('all')
  const [filterSource, setFilterSource] = useState<LeadSource | 'all'>('all')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')

  // Form state with new fields
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    country: 'VN',
    address: '',
    source: '' as LeadSource | '',
    source_detail: '',
    interest: '',
    estimated_value: '',
    priority: 'warm' as LeadPriority,
    assigned_to: '',
    notes: '',
    next_follow_up: '',
  })
  const [xrayFiles, setXrayFiles] = useState<File[]>([])
  const [patientPhotos, setPatientPhotos] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit form state with new fields
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    country: 'VN',
    address: '',
    source: '' as LeadSource | '',
    source_detail: '',
    interest: '',
    estimated_value: '',
    priority: 'warm' as LeadPriority,
    status: 'new' as LeadStatus,
    assigned_to: '',
    notes: '',
    next_follow_up: '',
  })

  const supabase = createClient()

  const fetchLeads = useCallback(async () => {
    try {
      const response = await fetch(`/api/leads?search=${encodeURIComponent(searchQuery)}`)
      const result = await response.json()

      if (response.ok) {
        setLeads(result.data)
      } else {
        toast.error('Không thể tải danh sách lead')
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
      toast.error('Đã xảy ra lỗi khi tải danh sách lead')
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .order('name')

      if (!error && data) {
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  useEffect(() => {
    fetchLeads()
    fetchUsers()
  }, [fetchLeads])

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        const result = await response.json()
        setLeads((prev) =>
          prev.map((lead) => (lead.id === leadId ? result.data : lead))
        )
        toast.success('Đã cập nhật trạng thái')
      } else {
        toast.error('Không thể cập nhật trạng thái')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Đã xảy ra lỗi')
    }
  }

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          estimated_value: formData.estimated_value
            ? parseFloat(formData.estimated_value)
            : null,
          source: formData.source || null,
          assigned_to: formData.assigned_to || null,
          next_follow_up: formData.next_follow_up || null,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setLeads((prev) => [result.data, ...prev])
        setIsAddModalOpen(false)
        resetForm()
        toast.success('Đã thêm lead mới')
      } else {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        toast.error(errorData.error || 'Không thể thêm lead')
      }
    } catch (error) {
      console.error('Error adding lead:', error)
      toast.error('Đã xảy ra lỗi')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      date_of_birth: '',
      gender: '',
      country: 'VN',
      address: '',
      source: '',
      source_detail: '',
      interest: '',
      estimated_value: '',
      priority: 'warm',
      assigned_to: '',
      notes: '',
      next_follow_up: '',
    })
    setXrayFiles([])
    setPatientPhotos([])
  }

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead)
    setEditFormData({
      first_name: lead.first_name,
      last_name: lead.last_name,
      phone: lead.phone,
      email: lead.email || '',
      date_of_birth: lead.date_of_birth || '',
      gender: lead.gender || '',
      country: lead.country || 'VN',
      address: lead.address || '',
      source: lead.source || '',
      source_detail: lead.source_detail || '',
      interest: lead.interest || '',
      estimated_value: lead.estimated_value?.toString() || '',
      priority: lead.priority,
      status: lead.status,
      assigned_to: lead.assigned_to || '',
      notes: lead.notes || '',
      next_follow_up: lead.next_follow_up ? new Date(lead.next_follow_up).toISOString().slice(0, 16) : '',
    })
    setIsEditModalOpen(true)
    setSelectedLead(null)
  }

  const handleEditLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLead) return
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/leads/${editingLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          estimated_value: editFormData.estimated_value
            ? parseFloat(editFormData.estimated_value)
            : null,
          source: editFormData.source || null,
          assigned_to: editFormData.assigned_to || null,
          next_follow_up: editFormData.next_follow_up || null,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setLeads((prev) =>
          prev.map((lead) => (lead.id === editingLead.id ? result.data : lead))
        )
        setIsEditModalOpen(false)
        setEditingLead(null)
        toast.success('Đã cập nhật lead')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Không thể cập nhật lead')
      }
    } catch (error) {
      console.error('Error updating lead:', error)
      toast.error('Đã xảy ra lỗi')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Bạn có chắc muốn xóa lead này?')) return

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setLeads((prev) => prev.filter((lead) => lead.id !== leadId))
        setSelectedLead(null)
        toast.success('Đã xóa lead')
      } else {
        toast.error('Không thể xóa lead')
      }
    } catch (error) {
      console.error('Error deleting lead:', error)
      toast.error('Đã xảy ra lỗi')
    }
  }

  // Bulk selection handlers
  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev)
      if (next.has(leadId)) {
        next.delete(leadId)
      } else {
        next.add(leadId)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedLeadIds.size === filteredLeads.length) {
      setSelectedLeadIds(new Set())
    } else {
      setSelectedLeadIds(new Set(filteredLeads.map((l) => l.id)))
    }
  }

  const clearSelection = () => {
    setSelectedLeadIds(new Set())
  }

  // Bulk operations
  const handleBulkDelete = async () => {
    if (!confirm(`Bạn có chắc muốn xóa ${selectedLeadIds.size} lead đã chọn?`)) return

    try {
      const deletePromises = Array.from(selectedLeadIds).map((id) =>
        fetch(`/api/leads/${id}`, { method: 'DELETE' })
      )
      await Promise.all(deletePromises)
      setLeads((prev) => prev.filter((lead) => !selectedLeadIds.has(lead.id)))
      clearSelection()
      toast.success(`Đã xóa ${selectedLeadIds.size} lead`)
    } catch (error) {
      console.error('Error bulk deleting:', error)
      toast.error('Đã xảy ra lỗi khi xóa')
    }
  }

  const handleBulkStatusChange = async (newStatus: LeadStatus) => {
    try {
      const updatePromises = Array.from(selectedLeadIds).map((id) =>
        fetch(`/api/leads/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })
      )
      const results = await Promise.all(updatePromises)
      const updatedLeads = await Promise.all(results.map((r) => r.json()))

      setLeads((prev) =>
        prev.map((lead) => {
          const updated = updatedLeads.find((u) => u.data?.id === lead.id)
          return updated?.data || lead
        })
      )
      clearSelection()
      toast.success(`Đã cập nhật trạng thái ${selectedLeadIds.size} lead`)
    } catch (error) {
      console.error('Error bulk status change:', error)
      toast.error('Đã xảy ra lỗi')
    }
  }

  const handleBulkAssign = async () => {
    if (bulkAssignees.length === 0) {
      toast.error('Vui lòng chọn ít nhất một nhân viên')
      return
    }

    try {
      // Assign the first selected user (or could implement round-robin)
      const assigneeId = bulkAssignees[0]
      const updatePromises = Array.from(selectedLeadIds).map((id) =>
        fetch(`/api/leads/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assigned_to: assigneeId }),
        })
      )
      await Promise.all(updatePromises)

      // Refresh leads
      fetchLeads()
      clearSelection()
      setIsBulkAssignModalOpen(false)
      setBulkAssignees([])
      toast.success(`Đã phân công ${selectedLeadIds.size} lead`)
    } catch (error) {
      console.error('Error bulk assign:', error)
      toast.error('Đã xảy ra lỗi')
    }
  }

  // Export functionality
  const exportToCSV = () => {
    const headers = [
      'Họ',
      'Tên',
      'SĐT',
      'Email',
      'Ngày sinh',
      'Giới tính',
      'Quốc gia',
      'Địa chỉ',
      'Nguồn',
      'Chi tiết nguồn',
      'Dịch vụ quan tâm',
      'Giá trị ước tính',
      'Mức độ ưu tiên',
      'Trạng thái',
      'Người phụ trách',
      'Ghi chú',
      'Ngày tạo',
    ]

    const rows = filteredLeads.map((lead) => [
      lead.first_name,
      lead.last_name,
      lead.phone,
      lead.email || '',
      lead.date_of_birth || '',
      lead.gender === 'male' ? 'Nam' : lead.gender === 'female' ? 'Nữ' : lead.gender || '',
      lead.country || '',
      lead.address || '',
      lead.source || '',
      lead.source_detail || '',
      lead.interest || '',
      lead.estimated_value?.toString() || '',
      lead.priority === 'hot' ? 'Nóng' : lead.priority === 'warm' ? 'Ấm' : 'Lạnh',
      statusColumns.find((c) => c.status === lead.status)?.label || lead.status,
      lead.assigned_user?.name || lead.assigned_user?.email || '',
      lead.notes || '',
      format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm'),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `leads_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`
    link.click()
    toast.success('Đã xuất file CSV')
  }

  const filteredLeads = leads.filter((lead) => {
    // Search filter
    const matchesSearch =
      lead.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      (lead.interest?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)

    // Status filter
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus

    // Priority filter
    const matchesPriority = filterPriority === 'all' || lead.priority === filterPriority

    // Source filter
    const matchesSource = filterSource === 'all' || lead.source === filterSource

    // Assignee filter
    const matchesAssignee = filterAssignee === 'all' || lead.assigned_to === filterAssignee

    return matchesSearch && matchesStatus && matchesPriority && matchesSource && matchesAssignee
  })

  const getStatusBadge = (status: LeadStatus) => {
    const column = statusColumns.find((c) => c.status === status)
    return (
      <Badge style={{ backgroundColor: column?.color + '30', color: column?.color }}>
        {column?.label || status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Khách Hàng Tiềm Năng
            </h1>
            <p className="text-muted-foreground">
              Quản lý và theo dõi khách hàng tiềm năng ({filteredLeads.length} lead)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchLeads} title="Làm mới">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={exportToCSV} title="Xuất CSV">
              <Download className="w-4 h-4 mr-2" />
              Xuất
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm Lead
            </Button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedLeadIds.size > 0 && (
          <Card className="p-3 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-sm">
                  {selectedLeadIds.size} đã chọn
                </Badge>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  <X className="w-4 h-4 mr-1" />
                  Bỏ chọn
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBulkAssignModalOpen(true)}
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Phân công
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <ArrowUpDown className="w-4 h-4 mr-1" />
                      Đổi trạng thái
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {statusColumns.map((col) => (
                      <DropdownMenuItem
                        key={col.status}
                        onClick={() => handleBulkStatusChange(col.status)}
                      >
                        <div
                          className="w-2 h-2 rounded-full mr-2"
                          style={{ backgroundColor: col.color }}
                        />
                        {col.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Xóa
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Filters */}
        <Card className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm kiếm theo tên, SĐT, dịch vụ quan tâm..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-1" />
              Bộ lọc
              {(filterStatus !== 'all' || filterPriority !== 'all' || filterSource !== 'all' || filterAssignee !== 'all') && (
                <Badge className="ml-1 h-5 w-5 p-0 justify-center">
                  {[filterStatus, filterPriority, filterSource, filterAssignee].filter(f => f !== 'all').length}
                </Badge>
              )}
            </Button>
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'pipeline' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('pipeline')}
              >
                <Kanban className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Trạng thái</Label>
                <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as LeadStatus | 'all')}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {statusColumns.map((col) => (
                      <SelectItem key={col.status} value={col.status}>
                        {col.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mức độ ưu tiên</Label>
                <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as LeadPriority | 'all')}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="hot">Nóng</SelectItem>
                    <SelectItem value="warm">Ấm</SelectItem>
                    <SelectItem value="cold">Lạnh</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nguồn</Label>
                <Select value={filterSource} onValueChange={(v) => setFilterSource(v as LeadSource | 'all')}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="referral">Giới thiệu</SelectItem>
                    <SelectItem value="walkin">Khách vãng lai</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="chat">Chat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Người phụ trách</Label>
                <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </Card>

        {/* Pipeline View */}
        {viewMode === 'pipeline' && (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {statusColumns.map((column) => {
                const columnLeads = filteredLeads.filter((lead) => lead.status === column.status)
                const isCollapsible = column.status === 'won' || column.status === 'lost'
                const isExpanded = expandedColumns.has(column.status)

                if (isCollapsible && !isExpanded) {
                  return (
                    <CollapsedColumn
                      key={column.status}
                      status={column.status}
                      label={column.label}
                      color={column.color}
                      leads={columnLeads}
                      onDrop={handleStatusChange}
                      onExpand={() => setExpandedColumns(prev => new Set([...prev, column.status]))}
                    />
                  )
                }

                return (
                  <PipelineColumn
                    key={column.status}
                    status={column.status}
                    label={column.label}
                    color={column.color}
                    leads={columnLeads}
                    onDrop={handleStatusChange}
                    onLeadClick={(lead) => setSelectedLead(lead)}
                    onCollapse={isCollapsible ? () => setExpandedColumns(prev => {
                      const next = new Set(prev)
                      next.delete(column.status)
                      return next
                    }) : undefined}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="w-12 p-4">
                      <Checkbox
                        checked={selectedLeadIds.size === filteredLeads.length && filteredLeads.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      Tên
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      SĐT
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      Quan tâm
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      Giá trị
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      Trạng thái
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      Phụ trách
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      Ngày tạo
                    </th>
                    <th className="w-12 p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className={`border-b border-border hover:bg-muted/50 cursor-pointer ${
                        selectedLeadIds.has(lead.id) ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedLeadIds.has(lead.id)}
                          onCheckedChange={() => toggleLeadSelection(lead.id)}
                        />
                      </td>
                      <td className="p-4" onClick={() => setSelectedLead(lead)}>
                        <div className="flex items-center gap-2">
                          {lead.priority === 'hot' && (
                            <Flame className="w-4 h-4 text-red-500" />
                          )}
                          {lead.priority === 'warm' && (
                            <Wind className="w-4 h-4 text-orange-500" />
                          )}
                          {lead.priority === 'cold' && (
                            <Snowflake className="w-4 h-4 text-blue-500" />
                          )}
                          <span className="font-medium">
                            {lead.first_name} {lead.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="p-4" onClick={() => setSelectedLead(lead)}>{lead.phone}</td>
                      <td className="p-4 text-muted-foreground" onClick={() => setSelectedLead(lead)}>
                        {lead.interest || '-'}
                      </td>
                      <td className="p-4" onClick={() => setSelectedLead(lead)}>
                        {lead.estimated_value
                          ? `$${lead.estimated_value.toLocaleString()}`
                          : '-'}
                      </td>
                      <td className="p-4" onClick={() => setSelectedLead(lead)}>{getStatusBadge(lead.status)}</td>
                      <td className="p-4 text-muted-foreground" onClick={() => setSelectedLead(lead)}>
                        {lead.assigned_user?.name || '-'}
                      </td>
                      <td className="p-4 text-muted-foreground" onClick={() => setSelectedLead(lead)}>
                        {format(new Date(lead.created_at), 'dd/MM/yyyy', {
                          locale: vi,
                        })}
                      </td>
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedLead(lead)}>
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditModal(lead)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteLead(lead.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredLeads.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Không tìm thấy lead nào
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Lead Quick View Dialog */}
        {selectedLead && (
          <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {selectedLead.first_name} {selectedLead.last_name}
                </DialogTitle>
                <DialogDescription>
                  {getStatusBadge(selectedLead.status)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">SĐT</p>
                    <p className="font-medium">{selectedLead.phone}</p>
                  </div>
                  {selectedLead.email && (
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedLead.email}</p>
                    </div>
                  )}
                  {selectedLead.interest && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Quan tâm</p>
                      <p className="font-medium">{selectedLead.interest}</p>
                    </div>
                  )}
                  {selectedLead.estimated_value && (
                    <div>
                      <p className="text-muted-foreground">Giá trị ước tính</p>
                      <p className="font-medium">
                        ${selectedLead.estimated_value.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {selectedLead.assigned_user && (
                    <div>
                      <p className="text-muted-foreground">Phụ trách</p>
                      <p className="font-medium">
                        {selectedLead.assigned_user.name || selectedLead.assigned_user.email}
                      </p>
                    </div>
                  )}
                </div>
                {selectedLead.notes && (
                  <div>
                    <p className="text-muted-foreground text-sm">Ghi chú</p>
                    <p className="text-sm">{selectedLead.notes}</p>
                  </div>
                )}
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <div className="flex gap-2 mr-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(selectedLead)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Sửa
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteLead(selectedLead.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Xóa
                  </Button>
                </div>
                <Button variant="outline" onClick={() => setSelectedLead(null)}>
                  Đóng
                </Button>
                <Button asChild>
                  <Link href={`/leads/${selectedLead.id}`}>Xem chi tiết</Link>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Add Lead Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Thêm Khách Hàng Tiềm Năng</DialogTitle>
              <DialogDescription>
                Điền thông tin khách hàng. Các trường * là bắt buộc.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddLead} className="space-y-6">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground border-b pb-2">Thông tin cá nhân</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">
                      Họ <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">
                      Tên <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      SĐT <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Ngày sinh</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) =>
                        setFormData({ ...formData, date_of_birth: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Giới tính</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) =>
                        setFormData({ ...formData, gender: value as 'male' | 'female' | 'other' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Nam</SelectItem>
                        <SelectItem value="female">Nữ</SelectItem>
                        <SelectItem value="other">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="country">Quốc gia</Label>
                    <CountrySelector
                      value={formData.country}
                      onChange={(value) => setFormData({ ...formData, country: value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Số nhà, đường, quận/huyện, thành phố"
                  />
                </div>
              </div>

              {/* Lead Information Section */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground border-b pb-2">Thông tin lead</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="source">Nguồn</Label>
                    <Select
                      value={formData.source}
                      onValueChange={(value) =>
                        setFormData({ ...formData, source: value as LeadSource })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn nguồn" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="referral">Giới thiệu</SelectItem>
                        <SelectItem value="walkin">Khách vãng lai</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="chat">Chat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="source_detail">Chi tiết nguồn</Label>
                    <Input
                      id="source_detail"
                      value={formData.source_detail}
                      onChange={(e) =>
                        setFormData({ ...formData, source_detail: e.target.value })
                      }
                      placeholder="VD: FB Ads Campaign A, Google Search..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Mức độ ưu tiên</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) =>
                        setFormData({ ...formData, priority: value as LeadPriority })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hot">Nóng</SelectItem>
                        <SelectItem value="warm">Ấm</SelectItem>
                        <SelectItem value="cold">Lạnh</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interest">Dịch vụ quan tâm</Label>
                    <Input
                      id="interest"
                      value={formData.interest}
                      onChange={(e) =>
                        setFormData({ ...formData, interest: e.target.value })
                      }
                      placeholder="VD: Implant, Niềng răng..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estimated_value">Giá trị ước tính ($)</Label>
                    <Input
                      id="estimated_value"
                      type="number"
                      value={formData.estimated_value}
                      onChange={(e) =>
                        setFormData({ ...formData, estimated_value: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assigned_to">Phân công cho</Label>
                    <Select
                      value={formData.assigned_to}
                      onValueChange={(value) =>
                        setFormData({ ...formData, assigned_to: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn nhân viên" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="next_follow_up">Lịch follow-up</Label>
                  <Input
                    id="next_follow_up"
                    type="datetime-local"
                    value={formData.next_follow_up}
                    onChange={(e) =>
                      setFormData({ ...formData, next_follow_up: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Ghi chú</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              </div>

              {/* File Uploads Section */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground border-b pb-2">Tệp đính kèm</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ảnh X-Ray</Label>
                    <FileUpload
                      value={xrayFiles}
                      onChange={setXrayFiles}
                      accept="image/*"
                      maxFiles={5}
                      maxSize={10}
                      label="Tải ảnh X-Ray"
                      description="Ảnh X-Ray răng, hàm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ảnh bệnh nhân</Label>
                    <FileUpload
                      value={patientPhotos}
                      onChange={setPatientPhotos}
                      accept="image/*"
                      maxFiles={5}
                      maxSize={10}
                      label="Tải ảnh bệnh nhân"
                      description="Ảnh khuôn mặt, răng"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddModalOpen(false)
                    resetForm()
                  }}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Lưu Lead
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Lead Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={(open) => {
          setIsEditModalOpen(open)
          if (!open) setEditingLead(null)
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chỉnh Sửa Lead</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin khách hàng.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_first_name">
                    Họ <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit_first_name"
                    value={editFormData.first_name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, first_name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_last_name">
                    Tên <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit_last_name"
                    value={editFormData.last_name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, last_name: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_phone">
                    SĐT <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit_phone"
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, phone: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_email">Email</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_status">Trạng thái</Label>
                  <Select
                    value={editFormData.status}
                    onValueChange={(value) =>
                      setEditFormData({ ...editFormData, status: value as LeadStatus })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusColumns.map((col) => (
                        <SelectItem key={col.status} value={col.status}>
                          {col.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_priority">Mức độ ưu tiên</Label>
                  <Select
                    value={editFormData.priority}
                    onValueChange={(value) =>
                      setEditFormData({ ...editFormData, priority: value as LeadPriority })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hot">Nóng</SelectItem>
                      <SelectItem value="warm">Ấm</SelectItem>
                      <SelectItem value="cold">Lạnh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_source">Nguồn</Label>
                  <Select
                    value={editFormData.source}
                    onValueChange={(value) =>
                      setEditFormData({ ...editFormData, source: value as LeadSource })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn nguồn" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="google">Google</SelectItem>
                      <SelectItem value="referral">Giới thiệu</SelectItem>
                      <SelectItem value="walkin">Khách vãng lai</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="chat">Chat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_assigned_to">Phân công cho</Label>
                  <Select
                    value={editFormData.assigned_to}
                    onValueChange={(value) =>
                      setEditFormData({ ...editFormData, assigned_to: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn nhân viên" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_interest">Dịch vụ quan tâm</Label>
                <Input
                  id="edit_interest"
                  value={editFormData.interest}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, interest: e.target.value })
                  }
                  placeholder="VD: Implant, Niềng răng..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_estimated_value">Giá trị ước tính ($)</Label>
                  <Input
                    id="edit_estimated_value"
                    type="number"
                    value={editFormData.estimated_value}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, estimated_value: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_next_follow_up">Lịch follow-up</Label>
                  <Input
                    id="edit_next_follow_up"
                    type="datetime-local"
                    value={editFormData.next_follow_up}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, next_follow_up: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_notes">Ghi chú</Label>
                <Textarea
                  id="edit_notes"
                  value={editFormData.notes}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setEditingLead(null)
                  }}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Lưu thay đổi
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Bulk Assign Modal */}
        <Dialog open={isBulkAssignModalOpen} onOpenChange={setIsBulkAssignModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Phân công hàng loạt</DialogTitle>
              <DialogDescription>
                Chọn nhân viên để phân công cho {selectedLeadIds.size} lead đã chọn.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Chọn nhân viên</Label>
                <StaffMultiSelector
                  staff={users}
                  value={bulkAssignees}
                  onChange={setBulkAssignees}
                  maxSelected={1}
                  placeholder="Chọn nhân viên phụ trách"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsBulkAssignModalOpen(false)
                  setBulkAssignees([])
                }}
              >
                Hủy
              </Button>
              <Button onClick={handleBulkAssign} disabled={bulkAssignees.length === 0}>
                Phân công
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  )
}
