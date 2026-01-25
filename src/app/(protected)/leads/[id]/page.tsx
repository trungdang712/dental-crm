'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Edit,
  Trash2,
  Plus,
  FileText,
  MessageSquare,
  Clock,
  Flame,
  Wind,
  Snowflake,
  Loader2,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { Lead, Activity, LeadStatus, LeadPriority, ActivityType, User as UserType, Quotation } from '@/lib/types'

const statusOptions: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'new', label: 'Mới', color: '#3b82f6' },
  { value: 'contacted', label: 'Đã Liên Hệ', color: '#8b5cf6' },
  { value: 'qualified', label: 'Đủ Điều Kiện', color: '#06b6d4' },
  { value: 'quoted', label: 'Đã Báo Giá', color: '#f59e0b' },
  { value: 'negotiating', label: 'Đàm Phán', color: '#f97316' },
  { value: 'won', label: 'Thành Công', color: '#10b981' },
  { value: 'lost', label: 'Thất Bại', color: '#6b7280' },
]

const activityTypeOptions: { value: ActivityType; label: string; icon: React.ElementType }[] = [
  { value: 'call', label: 'Cuộc gọi', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'meeting', label: 'Cuộc hẹn', icon: Calendar },
  { value: 'note', label: 'Ghi chú', icon: MessageSquare },
]

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [lead, setLead] = useState<Lead | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states
  const [editFormData, setEditFormData] = useState<Partial<Lead>>({})
  const [activityFormData, setActivityFormData] = useState({
    type: 'note' as ActivityType,
    title: '',
    description: '',
  })

  useEffect(() => {
    fetchLead()
    fetchActivities()
    fetchQuotations()
    fetchUsers()
  }, [id])

  const fetchLead = async () => {
    try {
      const response = await fetch(`/api/leads/${id}`)
      const result = await response.json()

      if (response.ok) {
        setLead(result.data)
        setEditFormData(result.data)
      } else {
        toast.error('Không thể tải thông tin lead')
        router.push('/leads')
      }
    } catch (error) {
      console.error('Error fetching lead:', error)
      toast.error('Đã xảy ra lỗi')
      router.push('/leads')
    } finally {
      setLoading(false)
    }
  }

  const fetchActivities = async () => {
    try {
      const response = await fetch(`/api/leads/${id}/activities`)
      const result = await response.json()

      if (response.ok) {
        setActivities(result.data)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  const fetchQuotations = async () => {
    try {
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .eq('crm_lead_id', id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setQuotations(data)
      }
    } catch (error) {
      console.error('Error fetching quotations:', error)
    }
  }

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

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      })

      if (response.ok) {
        const result = await response.json()
        setLead(result.data)
        setIsEditModalOpen(false)
        toast.success('Đã cập nhật thông tin')
        fetchActivities() // Refresh activities in case status changed
      } else {
        toast.error('Không thể cập nhật thông tin')
      }
    } catch (error) {
      console.error('Error updating lead:', error)
      toast.error('Đã xảy ra lỗi')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteLead = async () => {
    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Đã xóa lead')
        router.push('/leads')
      } else {
        toast.error('Không thể xóa lead')
      }
    } catch (error) {
      console.error('Error deleting lead:', error)
      toast.error('Đã xảy ra lỗi')
    }
  }

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/leads/${id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityFormData),
      })

      if (response.ok) {
        const result = await response.json()
        setActivities((prev) => [result.data, ...prev])
        setIsActivityModalOpen(false)
        setActivityFormData({ type: 'note', title: '', description: '' })
        toast.success('Đã thêm hoạt động')
      } else {
        toast.error('Không thể thêm hoạt động')
      }
    } catch (error) {
      console.error('Error adding activity:', error)
      toast.error('Đã xảy ra lỗi')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusChange = async (newStatus: LeadStatus) => {
    try {
      const response = await fetch(`/api/leads/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        const result = await response.json()
        setLead(result.data)
        fetchActivities()
        toast.success('Đã cập nhật trạng thái')
      } else {
        toast.error('Không thể cập nhật trạng thái')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Đã xảy ra lỗi')
    }
  }

  const getStatusBadge = (status: LeadStatus) => {
    const option = statusOptions.find((o) => o.value === status)
    return (
      <Badge style={{ backgroundColor: option?.color + '30', color: option?.color }}>
        {option?.label || status}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: LeadPriority) => {
    switch (priority) {
      case 'hot':
        return (
          <Badge className="bg-red-100 text-red-700">
            <Flame className="w-3 h-3 mr-1" /> Nóng
          </Badge>
        )
      case 'warm':
        return (
          <Badge className="bg-orange-100 text-orange-700">
            <Wind className="w-3 h-3 mr-1" /> Ấm
          </Badge>
        )
      case 'cold':
        return (
          <Badge className="bg-blue-100 text-blue-700">
            <Snowflake className="w-3 h-3 mr-1" /> Lạnh
          </Badge>
        )
    }
  }

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4" />
      case 'email':
        return <Mail className="w-4 h-4" />
      case 'meeting':
        return <Calendar className="w-4 h-4" />
      case 'status_change':
        return <Clock className="w-4 h-4" />
      default:
        return <MessageSquare className="w-4 h-4" />
    }
  }

  const handleCreateQuotation = () => {
    if (!lead) return

    const quotationToolUrl = process.env.NEXT_PUBLIC_QUOTATION_TOOL_URL || 'http://localhost:3001'
    const params = new URLSearchParams({
      source: 'crm',
      leadId: lead.id,
      patient_name: `${lead.first_name} ${lead.last_name}`,
      phone: lead.phone,
      email: lead.email || '',
    })

    window.open(`${quotationToolUrl}/quotations/new?${params.toString()}`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Không tìm thấy lead</p>
        <Button asChild className="mt-4">
          <Link href="/leads">Quay lại</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/leads">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {lead.first_name} {lead.last_name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(lead.status)}
              {getPriorityBadge(lead.priority)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Sửa
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Xóa
          </Button>
        </div>
      </div>

      {/* Quick Status Change */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Cập nhật trạng thái:</span>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                variant={lead.status === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange(option.value)}
                style={
                  lead.status === option.value
                    ? { backgroundColor: option.color }
                    : { borderColor: option.color, color: option.color }
                }
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Lead Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thông tin liên hệ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{lead.phone}</span>
              </div>
              {lead.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{lead.email}</span>
                </div>
              )}
              {lead.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{lead.address}</span>
                </div>
              )}
              {lead.date_of_birth && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {format(new Date(lead.date_of_birth), 'dd/MM/yyyy', { locale: vi })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lead Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Chi tiết</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lead.interest && (
                <div>
                  <p className="text-sm text-muted-foreground">Dịch vụ quan tâm</p>
                  <p className="font-medium">{lead.interest}</p>
                </div>
              )}
              {lead.estimated_value && (
                <div>
                  <p className="text-sm text-muted-foreground">Giá trị ước tính</p>
                  <p className="font-medium flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {lead.estimated_value.toLocaleString()}
                  </p>
                </div>
              )}
              {lead.source && (
                <div>
                  <p className="text-sm text-muted-foreground">Nguồn</p>
                  <p className="font-medium capitalize">{lead.source}</p>
                </div>
              )}
              {lead.assigned_user && (
                <div>
                  <p className="text-sm text-muted-foreground">Người phụ trách</p>
                  <p className="font-medium flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {lead.assigned_user.name || lead.assigned_user.email}
                  </p>
                </div>
              )}
              {lead.next_follow_up && (
                <div>
                  <p className="text-sm text-muted-foreground">Follow-up tiếp theo</p>
                  <p className="font-medium text-primary">
                    {format(new Date(lead.next_follow_up), 'dd/MM/yyyy HH:mm', {
                      locale: vi,
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {lead.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ghi chú</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="overview">Hoạt động</TabsTrigger>
                <TabsTrigger value="quotations">Báo giá ({quotations.length})</TabsTrigger>
              </TabsList>
              {activeTab === 'overview' && (
                <Button size="sm" onClick={() => setIsActivityModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm hoạt động
                </Button>
              )}
              {activeTab === 'quotations' && (
                <Button size="sm" onClick={handleCreateQuotation}>
                  <FileText className="w-4 h-4 mr-2" />
                  Tạo báo giá
                </Button>
              )}
            </div>

            <TabsContent value="overview" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Lịch sử hoạt động</CardTitle>
                  <CardDescription>
                    Tất cả hoạt động liên quan đến lead này
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activities.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Chưa có hoạt động nào
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex gap-4 pb-4 border-b border-border last:border-0"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{activity.title}</p>
                            {activity.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {activity.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(
                                new Date(activity.created_at),
                                'dd/MM/yyyy HH:mm',
                                { locale: vi }
                              )}
                              {activity.creator &&
                                ` - ${activity.creator.name || activity.creator.email}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quotations" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Báo giá</CardTitle>
                  <CardDescription>
                    Các báo giá đã tạo cho lead này
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {quotations.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        Chưa có báo giá nào
                      </p>
                      <Button onClick={handleCreateQuotation}>
                        <FileText className="w-4 h-4 mr-2" />
                        Tạo báo giá đầu tiên
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {quotations.map((quotation) => (
                        <div
                          key={quotation.id}
                          className="flex items-center justify-between p-4 border border-border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{quotation.quotation_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(
                                new Date(quotation.created_at),
                                'dd/MM/yyyy',
                                { locale: vi }
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold">
                              ${quotation.total_amount?.toLocaleString() || 0}
                            </span>
                            <Badge
                              className={
                                quotation.status === 'accepted'
                                  ? 'bg-green-100 text-green-700'
                                  : quotation.status === 'rejected'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }
                            >
                              {quotation.status}
                            </Badge>
                            <Button variant="ghost" size="sm" asChild>
                              <a
                                href={`${
                                  process.env.NEXT_PUBLIC_QUOTATION_TOOL_URL ||
                                  'http://localhost:3001'
                                }/quotations/${quotation.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateLead} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Họ</Label>
                <Input
                  value={editFormData.first_name || ''}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, first_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tên</Label>
                <Input
                  value={editFormData.last_name || ''}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, last_name: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SĐT</Label>
                <Input
                  value={editFormData.phone || ''}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, phone: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dịch vụ quan tâm</Label>
              <Input
                value={editFormData.interest || ''}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, interest: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Giá trị ước tính ($)</Label>
                <Input
                  type="number"
                  value={editFormData.estimated_value || ''}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      estimated_value: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Mức độ ưu tiên</Label>
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
                <Label>Người phụ trách</Label>
                <Select
                  value={editFormData.assigned_to || ''}
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
              <div className="space-y-2">
                <Label>Follow-up tiếp theo</Label>
                <Input
                  type="datetime-local"
                  value={
                    editFormData.next_follow_up
                      ? format(new Date(editFormData.next_follow_up), "yyyy-MM-dd'T'HH:mm")
                      : ''
                  }
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      next_follow_up: e.target.value || undefined,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                value={editFormData.notes || ''}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, notes: e.target.value })
                }
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Lưu
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Activity Modal */}
      <Dialog open={isActivityModalOpen} onOpenChange={setIsActivityModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm hoạt động</DialogTitle>
            <DialogDescription>
              Ghi lại cuộc gọi, email, cuộc hẹn hoặc ghi chú
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddActivity} className="space-y-4">
            <div className="space-y-2">
              <Label>Loại hoạt động</Label>
              <Select
                value={activityFormData.type}
                onValueChange={(value) =>
                  setActivityFormData({ ...activityFormData, type: value as ActivityType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activityTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="w-4 h-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tiêu đề</Label>
              <Input
                value={activityFormData.title}
                onChange={(e) =>
                  setActivityFormData({ ...activityFormData, title: e.target.value })
                }
                placeholder="VD: Gọi điện tư vấn về Implant"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={activityFormData.description}
                onChange={(e) =>
                  setActivityFormData({
                    ...activityFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Chi tiết về hoạt động..."
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsActivityModalOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Lưu
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa lead này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLead}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
