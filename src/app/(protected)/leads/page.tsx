'use client'

import { useEffect, useState, useCallback } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  RefreshCw
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

      {/* Interest */}
      {lead.interest && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
          {lead.interest}
        </p>
      )}

      {/* Value & Assigned */}
      <div className="flex items-center justify-between text-xs mb-2 pb-2 border-b border-border">
        {lead.estimated_value ? (
          <div className="flex items-center gap-1 font-semibold text-foreground">
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

      {/* Next Follow-up */}
      {lead.next_follow_up && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3 text-primary" />
          <span>
            {format(new Date(lead.next_follow_up), 'dd/MM HH:mm', { locale: vi })}
          </span>
        </div>
      )}
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
}

function PipelineColumn({ status, label, color, leads, onDrop, onLeadClick }: PipelineColumnProps) {
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
  const [users, setUsers] = useState<UserType[]>([])

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    source: '' as LeadSource | '',
    interest: '',
    estimated_value: '',
    priority: 'warm' as LeadPriority,
    assigned_to: '',
    notes: '',
    next_follow_up: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        const error = await response.json()
        toast.error(error.message || 'Không thể thêm lead')
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
      source: '',
      interest: '',
      estimated_value: '',
      priority: 'warm',
      assigned_to: '',
      notes: '',
      next_follow_up: '',
    })
  }

  const filteredLeads = leads.filter(
    (lead) =>
      lead.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      (lead.interest?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  )

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
              Quản lý và theo dõi khách hàng tiềm năng
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchLeads}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm Lead
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm kiếm theo tên, SĐT, dịch vụ quan tâm..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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
        </Card>

        {/* Pipeline View */}
        {viewMode === 'pipeline' && (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {statusColumns.map((column) => (
                <PipelineColumn
                  key={column.status}
                  status={column.status}
                  label={column.label}
                  color={column.color}
                  leads={filteredLeads.filter((lead) => lead.status === column.status)}
                  onDrop={handleStatusChange}
                  onLeadClick={(lead) => setSelectedLead(lead)}
                />
              ))}
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
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-border hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <td className="p-4">
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
                      <td className="p-4">{lead.phone}</td>
                      <td className="p-4 text-muted-foreground">
                        {lead.interest || '-'}
                      </td>
                      <td className="p-4">
                        {lead.estimated_value
                          ? `$${lead.estimated_value.toLocaleString()}`
                          : '-'}
                      </td>
                      <td className="p-4">{getStatusBadge(lead.status)}</td>
                      <td className="p-4 text-muted-foreground">
                        {lead.assigned_user?.name || '-'}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {format(new Date(lead.created_at), 'dd/MM/yyyy', {
                          locale: vi,
                        })}
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
              <DialogFooter>
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Thêm Khách Hàng Tiềm Năng</DialogTitle>
              <DialogDescription>
                Điền thông tin khách hàng. Các trường * là bắt buộc.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddLead} className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
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
              </div>

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
      </div>
    </DndProvider>
  )
}
