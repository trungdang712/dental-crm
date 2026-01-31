'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  ExternalLink,
  MoreHorizontal,
  UserCheck,
  Target,
  Download,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { Lead, Activity, LeadStatus, LeadPriority, ActivityType, User as UserType, Quotation } from '@/lib/types'
import { LeadImageUpload } from '@/components/leads/LeadImageUpload'
import { formatCurrency, formatCurrencyCompact } from '@/lib/format'

const statusOptions: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'new', label: 'Mới', color: '#3b82f6' },
  { value: 'contacted', label: 'Đã Liên Hệ', color: '#8b5cf6' },
  { value: 'qualified', label: 'Đủ Điều Kiện', color: '#06b6d4' },
  { value: 'quoted', label: 'Đã Báo Giá', color: '#f59e0b' },
  { value: 'negotiating', label: 'Đàm Phán', color: '#f97316' },
  { value: 'won', label: 'Thành Công', color: '#10b981' },
  { value: 'lost', label: 'Thất Bại', color: '#6b7280' },
]

const sourceLabels: Record<string, string> = {
  facebook: 'Facebook',
  google: 'Google',
  referral: 'Giới thiệu',
  walkin: 'Vãng lai',
  website: 'Website',
  chat: 'Chat',
}

const priorityLabels: Record<string, string> = {
  hot: 'Nóng',
  warm: 'Ấm',
  cold: 'Lạnh',
}

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
  const [selectedTab, setSelectedTab] = useState('overview')

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
        console.error('API error:', response.status, result)
        toast.error(result.error || 'Không thể tải thông tin lead')
        // Don't redirect immediately, let user see the error
        setTimeout(() => router.push('/leads'), 2000)
      }
    } catch (error) {
      console.error('Error fetching lead:', error)
      toast.error('Đã xảy ra lỗi kết nối')
      setTimeout(() => router.push('/leads'), 2000)
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
        fetchActivities()
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

  const handleCreateQuotation = () => {
    if (!lead) return

    const quotationToolUrl = process.env.NEXT_PUBLIC_QUOTATION_TOOL_URL || 'https://baogia.greenfield.clinic'
    const params = new URLSearchParams({
      crm_lead_id: lead.id,
      customer_name: `${lead.first_name} ${lead.last_name}`.trim(),
      customer_phone: lead.phone || '',
      customer_email: lead.email || '',
      customer_country: lead.country || 'VN',
    })

    window.open(`${quotationToolUrl}/quotations/new?${params.toString()}`, '_blank')
  }

  const getStatusBadge = (status: LeadStatus) => {
    const option = statusOptions.find((o) => o.value === status)
    return (
      <Badge style={{ backgroundColor: option?.color + '20', color: option?.color }}>
        {option?.label || status}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: LeadPriority) => {
    switch (priority) {
      case 'hot':
        return <Badge className="bg-red-100 text-red-700"><Flame className="w-3 h-3 mr-1" /> Nóng</Badge>
      case 'warm':
        return <Badge className="bg-orange-100 text-orange-700"><Wind className="w-3 h-3 mr-1" /> Ấm</Badge>
      case 'cold':
        return <Badge className="bg-blue-100 text-blue-700"><Snowflake className="w-3 h-3 mr-1" /> Lạnh</Badge>
    }
  }

  const getTimeInStage = (statusUpdatedAt?: string) => {
    if (!statusUpdatedAt) return 'Không rõ'

    const now = new Date()
    const updated = new Date(statusUpdatedAt)
    const diff = now.getTime() - updated.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (hours < 1) return 'Vừa mới'
    if (hours < 24) return `${hours} giờ`
    if (days === 1) return '1 ngày'
    return `${days} ngày`
  }

  const getLeadAge = (createdAt: string) => {
    if (!createdAt) return 'Không rõ'

    const now = new Date()
    const created = new Date(createdAt)
    const diff = now.getTime() - created.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Hôm nay'
    if (days === 1) return '1 ngày trước'
    if (days < 30) return `${days} ngày trước`
    const months = Math.floor(days / 30)
    if (months === 1) return '1 tháng trước'
    if (months < 12) return `${months} tháng trước`
    const years = Math.floor(days / 365)
    return years === 1 ? '1 năm trước' : `${years} năm trước`
  }

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: vi })
  }

  const formatDateTime = (dateStr: string) => {
    return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: vi })
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
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Button variant="ghost" asChild className="gap-2 w-fit">
            <Link href="/leads">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Quay Lại Danh Sách</span>
              <span className="sm:hidden">Quay Lại</span>
            </Link>
          </Button>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
              <Edit className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Chỉnh Sửa</span>
            </Button>
            <Button variant="default" size="sm" onClick={handleCreateQuotation}>
              <FileText className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Tạo Báo Giá</span>
            </Button>
            <Button variant="secondary" size="sm" className="hidden md:flex">
              <UserCheck className="w-4 h-4 mr-1" />
              Chuyển Thành Bệnh Nhân
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsDeleteDialogOpen(true)}>
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Lead Header Card */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary text-xl sm:text-2xl font-bold">
                  {lead.first_name?.[0]}{lead.last_name?.[0]}
                </span>
              </div>

              <div className="flex-1 text-center sm:text-left w-full">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                      {lead.first_name} {lead.last_name}
                    </h1>
                    <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4" />
                        <span>{lead.phone}</span>
                      </div>
                      {lead.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-4 h-4" />
                          <span className="truncate max-w-[200px]">{lead.email}</span>
                        </div>
                      )}
                      {lead.address && (
                        <div className="flex items-center gap-1.5 hidden sm:flex">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate max-w-[200px]">{lead.address}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-3 mt-3 text-sm text-muted-foreground">
                      <span>Nguồn: <span className="font-medium text-foreground">{sourceLabels[lead.source || ''] || lead.source || 'Không rõ'}</span></span>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline">Thêm vào: {formatDate(lead.created_at)}</span>
                    </div>
                  </div>

                  <div className="text-center sm:text-right">
                    {getStatusBadge(lead.status)}
                    <div className="text-sm text-muted-foreground mt-1">
                      Trạng thái
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
            <TabsTrigger value="overview" className="flex-shrink-0">Tổng Quan</TabsTrigger>
            <TabsTrigger value="activities" className="flex-shrink-0">Hoạt Động</TabsTrigger>
            <TabsTrigger value="quotations" className="flex-shrink-0">
              Báo Giá {quotations.length > 0 && `(${quotations.length})`}
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex-shrink-0">Ghi Chú</TabsTrigger>
            <TabsTrigger value="files" className="flex-shrink-0">Tệp</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Lead Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Thông Tin Khách Hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Quan tâm</label>
                        <p className="mt-1">{lead.interest || 'Chưa có'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Giá trị ước tính</label>
                        <p className="mt-1 font-semibold text-lg">
                          {lead.estimated_value ? formatCurrency(lead.estimated_value) : 'Chưa có'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Mức độ ưu tiên</label>
                        <div className="mt-1">
                          {getPriorityBadge(lead.priority)}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Nguồn</label>
                        <p className="mt-1">{sourceLabels[lead.source || ''] || lead.source || 'Không rõ'}</p>
                      </div>
                    </div>
                    {lead.notes && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Ghi chú</label>
                        <p className="mt-1 text-muted-foreground">{lead.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Activity Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Dòng Thời Gian Hoạt Động
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activities.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Chưa có hoạt động nào</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {activities.map((activity, index) => (
                          <div key={activity.id} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                activity.type === 'call' ? 'bg-purple-100 text-purple-600' :
                                activity.type === 'email' ? 'bg-cyan-100 text-cyan-600' :
                                activity.type === 'meeting' ? 'bg-amber-100 text-amber-600' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {activity.type === 'call' && <Phone className="w-4 h-4" />}
                                {activity.type === 'email' && <Mail className="w-4 h-4" />}
                                {activity.type === 'meeting' && <Calendar className="w-4 h-4" />}
                                {activity.type === 'note' && <MessageSquare className="w-4 h-4" />}
                                {activity.type === 'status_change' && <Clock className="w-4 h-4" />}
                              </div>
                              {index < activities.length - 1 && (
                                <div className="w-px h-full bg-border mt-2" />
                              )}
                            </div>
                            <div className="flex-1 pb-6">
                              <div className="flex items-start justify-between mb-1">
                                <div>
                                  <p className="font-medium">{activity.title}</p>
                                  <p className="text-sm text-muted-foreground">
                                    bởi {activity.creator?.name || activity.creator?.email || 'Hệ thống'}
                                  </p>
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatDateTime(activity.created_at)}
                                </span>
                              </div>
                              {activity.description && (
                                <p className="text-sm text-muted-foreground mt-2">{activity.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Quick Actions & Info */}
              <div className="space-y-6">
                {/* Timeline Info Card */}
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Clock className="w-5 h-5 text-primary" />
                      Thông Tin Thời Gian
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 rounded-lg bg-card border border-border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-muted-foreground">Thời gian ở stage hiện tại</span>
                      </div>
                      <p className="text-xl font-bold text-foreground">
                        {getTimeInStage(lead.status_updated_at)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ở trạng thái "{statusOptions.find(o => o.value === lead.status)?.label}"
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-card border border-border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-muted-foreground">Tuổi của lead</span>
                      </div>
                      <p className="text-xl font-bold text-foreground">
                        {getLeadAge(lead.created_at)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tạo ngày {formatDate(lead.created_at)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Hành Động Nhanh</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={() => {
                      setActivityFormData({ type: 'call', title: '', description: '' })
                      setIsActivityModalOpen(true)
                    }}>
                      <Phone className="w-4 h-4" />
                      Ghi Nhận Cuộc Gọi
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={() => {
                      setActivityFormData({ type: 'email', title: '', description: '' })
                      setIsActivityModalOpen(true)
                    }}>
                      <Mail className="w-4 h-4" />
                      Gửi Email
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={() => {
                      setActivityFormData({ type: 'meeting', title: '', description: '' })
                      setIsActivityModalOpen(true)
                    }}>
                      <Calendar className="w-4 h-4" />
                      Đặt Lịch Họp
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={() => {
                      setActivityFormData({ type: 'note', title: '', description: '' })
                      setIsActivityModalOpen(true)
                    }}>
                      <MessageSquare className="w-4 h-4" />
                      Thêm Ghi Chú
                    </Button>
                  </CardContent>
                </Card>

                {/* Upcoming */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Sắp Tới
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {lead.next_follow_up ? (
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <div className="flex items-center gap-2 text-sm font-medium mb-1">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span>Đã đặt lịch gọi</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(lead.next_follow_up)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Không có hoạt động sắp tới</p>
                    )}
                  </CardContent>
                </Card>

                {/* Quotations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Báo Giá Liên Kết
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {quotations.length > 0 ? (
                      <div className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{quotations[0].quotation_number}</span>
                          <Badge className="bg-yellow-100 text-yellow-700">
                            {quotations[0].status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{lead.interest}</p>
                        <p className="font-semibold text-lg">
                          {formatCurrency(quotations[0].total_amount || 0)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Chưa có báo giá</p>
                    )}
                  </CardContent>
                </Card>

                {/* Assigned To */}
                <Card>
                  <CardHeader>
                    <CardTitle>Phân Công Cho</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {lead.assigned_user?.name?.[0] || lead.assigned_user?.email?.[0] || '?'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{lead.assigned_user?.name || lead.assigned_user?.email || 'Chưa phân công'}</p>
                        <p className="text-sm text-muted-foreground">Nhân viên bán hàng</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => setIsEditModalOpen(true)}>
                      Phân Công Lại
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Tất Cả Hoạt Động</CardTitle>
                <Button size="sm" onClick={() => setIsActivityModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm hoạt động
                </Button>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Chưa có hoạt động nào</p>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex gap-4 pb-4 border-b border-border last:border-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          activity.type === 'call' ? 'bg-purple-100 text-purple-600' :
                          activity.type === 'email' ? 'bg-cyan-100 text-cyan-600' :
                          activity.type === 'meeting' ? 'bg-amber-100 text-amber-600' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {activity.type === 'call' && <Phone className="w-4 h-4" />}
                          {activity.type === 'email' && <Mail className="w-4 h-4" />}
                          {activity.type === 'meeting' && <Calendar className="w-4 h-4" />}
                          {activity.type === 'note' && <MessageSquare className="w-4 h-4" />}
                          {activity.type === 'status_change' && <Clock className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{activity.title}</p>
                              <p className="text-sm text-muted-foreground">
                                bởi {activity.creator?.name || activity.creator?.email || 'Hệ thống'}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground">{formatDateTime(activity.created_at)}</span>
                          </div>
                          {activity.description && (
                            <p className="text-sm text-muted-foreground mt-2">{activity.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quotations Tab */}
          <TabsContent value="quotations">
            <div className="space-y-4">
              <div className="flex items-center justify-end">
                <Button variant="default" onClick={handleCreateQuotation}>
                  <Plus className="w-4 h-4" />
                  Tạo Mới
                </Button>
              </div>

              {quotations.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <FileText className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
                    <p className="text-lg font-medium text-foreground mb-2">Chưa có báo giá nào</p>
                    <p className="text-sm text-muted-foreground mb-6">
                      Tạo báo giá đầu tiên cho khách hàng này
                    </p>
                    <Button variant="default" onClick={handleCreateQuotation}>
                      <Plus className="w-4 h-4" />
                      Tạo Báo Giá Mới
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {quotations.map((quotation) => (
                    <Card key={quotation.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                              {quotation.quotation_number}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Ngày tạo: {formatDate(quotation.created_at)}</span>
                              <span>•</span>
                              <Badge className={
                                quotation.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                quotation.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }>
                                {quotation.status}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-xl font-bold text-foreground">
                            Tổng giá trị: {formatCurrency(quotation.total_amount || 0)}
                          </p>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-border">
                          <Button variant="outline" size="sm" className="gap-2" asChild>
                            <a
                              href={`${process.env.NEXT_PUBLIC_QUOTATION_TOOL_URL || 'https://baogia.greenfield.clinic'}/quotations/${quotation.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Eye className="w-4 h-4" />
                              Xem Chi Tiết
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Download className="w-4 h-4" />
                            Tải PDF
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>Ghi Chú</CardTitle>
              </CardHeader>
              <CardContent>
                {lead.notes ? (
                  <p className="whitespace-pre-wrap">{lead.notes}</p>
                ) : (
                  <p className="text-muted-foreground">Chưa có ghi chú</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files">
            <Card>
              <CardHeader>
                <CardTitle>Tệp Đính Kèm</CardTitle>
              </CardHeader>
              <CardContent>
                <LeadImageUpload
                  patientPhotos={lead.patient_photos || []}
                  xrayPhotos={lead.xray_photos || []}
                  onPatientPhotosChange={() => {}}
                  onXrayPhotosChange={() => {}}
                  readOnly
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
                  onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tên</Label>
                <Input
                  value={editFormData.last_name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SĐT</Label>
                <Input
                  value={editFormData.phone || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dịch vụ quan tâm</Label>
              <Input
                value={editFormData.interest || ''}
                onChange={(e) => setEditFormData({ ...editFormData, interest: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Giá trị ước tính (VND)</Label>
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
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                rows={4}
              />
            </div>

            {/* Image Upload Section */}
            <div className="space-y-2 pt-4 border-t">
              <Label>Hình ảnh</Label>
              <LeadImageUpload
                patientPhotos={editFormData.patient_photos || []}
                xrayPhotos={editFormData.xray_photos || []}
                onPatientPhotosChange={(photos) =>
                  setEditFormData({ ...editFormData, patient_photos: photos })
                }
                onXrayPhotosChange={(xrays) =>
                  setEditFormData({ ...editFormData, xray_photos: xrays })
                }
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
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
                onChange={(e) => setActivityFormData({ ...activityFormData, title: e.target.value })}
                placeholder="VD: Gọi điện tư vấn về Implant"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={activityFormData.description}
                onChange={(e) => setActivityFormData({ ...activityFormData, description: e.target.value })}
                placeholder="Chi tiết về hoạt động..."
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsActivityModalOpen(false)}>
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
    </>
  )
}
