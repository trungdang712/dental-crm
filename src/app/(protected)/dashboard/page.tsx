'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  Users,
  UserPlus,
  TrendingUp,
  DollarSign,
  Phone,
  Mail,
  Loader2,
  Flame,
  Wind,
  Snowflake,
  MessageSquare,
  FileText,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Calendar,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { Lead, Activity as ActivityType, DashboardStats, Quotation } from '@/lib/types'
import { formatCurrency } from '@/lib/format'
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import { useToast } from '@/hooks/use-toast'

interface PendingQuotation {
  id: string;
  quotation_number: string;
  patient_name: string;
  created_at: string;
  items?: {
    quantity?: number;
    unit_price_vnd?: number;
    custom_name?: string;
    service?: { name: string } | { name: string }[] | null
  }[];
}

interface PipelineCounts {
  new: number
  contacted: number
  qualified: number
  quoted: number
  negotiating: number
  scheduled: number
  won: number
  cold: number
  lost: number
}

// Helper function to get greeting based on time of day
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Chào buổi sáng'
  if (hour < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

// Format date in Vietnamese
function formatVietnameseDate(date: Date): string {
  return format(date, "EEEE, 'ngày' d 'tháng' M 'năm' yyyy", { locale: vi })
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentLeads, setRecentLeads] = useState<Lead[]>([])
  const [todayFollowUps, setTodayFollowUps] = useState<Lead[]>([])
  const [recentActivities, setRecentActivities] = useState<ActivityType[]>([])
  const [readyToConvert, setReadyToConvert] = useState<Lead[]>([])
  const [overdueFollowUps, setOverdueFollowUps] = useState<Lead[]>([])
  const [pendingQuotations, setPendingQuotations] = useState<PendingQuotation[]>([])
  const [pipelineCounts, setPipelineCounts] = useState<PipelineCounts>({
    new: 0, contacted: 0, qualified: 0, quoted: 0, negotiating: 0, scheduled: 0, won: 0, cold: 0, lost: 0
  })
  const [loading, setLoading] = useState(true)
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false)
  const [userName, setUserName] = useState<string>('')
  const [convertingLeadId, setConvertingLeadId] = useState<string | null>(null)
  const [showConvertDialog, setShowConvertDialog] = useState(false)

  const supabase = createClient()
  const { toast } = useToast()

  // Fetch current user name
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single()
        if (userData?.name) {
          setUserName(userData.name.split(' ')[0])
        } else {
          setUserName(user.email?.split('@')[0] || 'User')
        }
      }
    }
    fetchUser()
  }, [])

  // Fetch pending quotations with realtime subscription
  const fetchPendingQuotations = async () => {
    const { data, error } = await supabase
      .from('quotations')
      .select(`
        id,
        quotation_number,
        patient_name,
        created_at,
        items:quotation_items(
          quantity,
          unit_price_vnd,
          custom_name,
          service:services(name)
        )
      `)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(5)

    if (!error && data) {
      setPendingQuotations(data)
    }
  }

  useEffect(() => {
    fetchDashboardData()

    // Subscribe to realtime changes on quotations table
    const quotationsChannel = supabase
      .channel('quotations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotations',
        },
        () => {
          // Refetch pending quotations when any change occurs
          fetchPendingQuotations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(quotationsChannel)
    }
  }, [])

  const fetchDashboardData = async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

      // Helper to add timeout to queries
      const withTimeout = <T,>(promise: PromiseLike<T>, ms = 10000): Promise<T> => {
        return Promise.race([
          Promise.resolve(promise),
          new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), ms)
          )
        ])
      }

      // Fetch all counts in parallel with timeout
      const [
        totalLeadsResult,
        newTodayResult,
        newWeekResult,
        wonMonthResult,
        pipelineValueResult,
        followUpsResult,
        recentLeadsResult,
        activitiesResult,
        readyToConvertResult,
        overdueFollowUpsResult,
        pendingQuotationsResult,
        pipelineNewResult,
        pipelineContactedResult,
        pipelineQualifiedResult,
        pipelineQuotedResult,
        pipelineNegotiatingResult,
        pipelineScheduledResult,
        pipelineWonResult,
        pipelineColdResult,
        pipelineLostResult
      ] = await Promise.all([
        // Total leads
        withTimeout(supabase.from('crm_leads').select('id', { count: 'exact', head: true })),

        // New leads today
        withTimeout(supabase.from('crm_leads')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString())),

        // New leads this week
        withTimeout(supabase.from('crm_leads')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', startOfWeek.toISOString())),

        // Won this month
        withTimeout(supabase.from('crm_leads')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'won')
          .gte('status_updated_at', startOfMonth.toISOString())),

        // Pipeline value (exclude won/lost)
        withTimeout(supabase.from('crm_leads')
          .select('estimated_value')
          .not('status', 'in', '(won,lost)')),

        // Today's follow-ups
        withTimeout(supabase.from('crm_leads')
          .select('*, assigned_user:users!crm_leads_assigned_to_fkey(id, name, email)')
          .gte('next_follow_up', today.toISOString())
          .lt('next_follow_up', tomorrow.toISOString())
          .order('next_follow_up', { ascending: true })
          .limit(5)),

        // Recent leads
        withTimeout(supabase.from('crm_leads')
          .select('*, assigned_user:users!crm_leads_assigned_to_fkey(id, name, email)')
          .order('created_at', { ascending: false })
          .limit(5)),

        // Recent activities
        withTimeout(supabase.from('crm_activities')
          .select('*, creator:users!crm_activities_created_by_fkey(id, name, email)')
          .order('created_at', { ascending: false })
          .limit(10)),

        // Ready to convert (scheduled or won leads)
        withTimeout(supabase.from('crm_leads')
          .select('*, assigned_user:users!crm_leads_assigned_to_fkey(id, name, email)')
          .in('status', ['scheduled', 'won'])
          .order('estimated_value', { ascending: false })
          .limit(5)),

        // Overdue follow-ups
        withTimeout(supabase.from('crm_leads')
          .select('*, assigned_user:users!crm_leads_assigned_to_fkey(id, name, email)')
          .lt('next_follow_up', today.toISOString())
          .not('status', 'in', '(won,lost)')
          .order('next_follow_up', { ascending: true })
          .limit(5)),

        // Pending quotations (completed status = sent to customer, waiting for response)
        withTimeout(supabase.from('quotations')
          .select(`
            id,
            quotation_number,
            patient_name,
            created_at,
            items:quotation_items(
              quantity,
              unit_price_vnd,
              custom_name,
              service:services(name)
            )
          `)
          .eq('status', 'in_progress')
          .order('created_at', { ascending: false })
          .limit(5)),

        // Pipeline counts by status
        withTimeout(supabase.from('crm_leads').select('id', { count: 'exact', head: true }).eq('status', 'new')),
        withTimeout(supabase.from('crm_leads').select('id', { count: 'exact', head: true }).eq('status', 'contacted')),
        withTimeout(supabase.from('crm_leads').select('id', { count: 'exact', head: true }).eq('status', 'qualified')),
        withTimeout(supabase.from('crm_leads').select('id', { count: 'exact', head: true }).eq('status', 'quoted')),
        withTimeout(supabase.from('crm_leads').select('id', { count: 'exact', head: true }).eq('status', 'negotiating')),
        withTimeout(supabase.from('crm_leads').select('id', { count: 'exact', head: true }).eq('status', 'scheduled')),
        withTimeout(supabase.from('crm_leads').select('id', { count: 'exact', head: true }).eq('status', 'won')),
        withTimeout(supabase.from('crm_leads').select('id', { count: 'exact', head: true }).eq('status', 'cold')),
        withTimeout(supabase.from('crm_leads').select('id', { count: 'exact', head: true }).eq('status', 'lost'))
      ])

      // Calculate pipeline value
      const pipelineValue = pipelineValueResult.data?.reduce(
        (sum, lead) => sum + (lead.estimated_value || 0),
        0
      ) || 0

      // Calculate conversion rate
      const totalLeads = totalLeadsResult.count || 0
      const wonLeads = wonMonthResult.count || 0
      const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0

      setStats({
        totalLeads,
        newLeadsToday: newTodayResult.count || 0,
        newLeadsThisWeek: newWeekResult.count || 0,
        leadsWonThisMonth: wonMonthResult.count || 0,
        conversionRate,
        totalPipelineValue: pipelineValue,
        followUpsToday: followUpsResult.data?.length || 0
      })

      setTodayFollowUps(followUpsResult.data || [])
      setRecentLeads(recentLeadsResult.data || [])
      setRecentActivities(activitiesResult.data || [])
      setReadyToConvert(readyToConvertResult.data || [])
      setOverdueFollowUps(overdueFollowUpsResult.data || [])
      setPendingQuotations(pendingQuotationsResult.data || [])
      setPipelineCounts({
        new: pipelineNewResult.count || 0,
        contacted: pipelineContactedResult.count || 0,
        qualified: pipelineQualifiedResult.count || 0,
        quoted: pipelineQuotedResult.count || 0,
        negotiating: pipelineNegotiatingResult.count || 0,
        scheduled: pipelineScheduledResult.count || 0,
        won: pipelineWonResult.count || 0,
        cold: pipelineColdResult.count || 0,
        lost: pipelineLostResult.count || 0
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle convert to patient
  const handleConvertToPatient = async () => {
    if (!convertingLeadId) return

    try {
      // Add activity log for conversion
      const { error: activityError } = await supabase
        .from('crm_activities')
        .insert({
          lead_id: convertingLeadId,
          type: 'note',
          title: 'Chuyển thành bệnh nhân',
          description: 'Lead đã được chuyển thành bệnh nhân',
          created_by: (await supabase.auth.getUser()).data.user?.id
        })

      if (activityError) throw activityError

      // Update lead status to won if not already
      await supabase
        .from('crm_leads')
        .update({ status: 'won', status_updated_at: new Date().toISOString() })
        .eq('id', convertingLeadId)

      toast({
        title: 'Chuyển đổi thành công',
        description: 'Lead đã được chuyển thành bệnh nhân',
      })

      // Refresh data
      await fetchDashboardData()
      setShowConvertDialog(false)
      setConvertingLeadId(null)
    } catch (error) {
      console.error('Failed to convert lead:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể chuyển đổi lead. Vui lòng thử lại.',
        variant: 'destructive',
      })
    }
  }

  const openConvertDialog = (leadId: string) => {
    setConvertingLeadId(leadId)
    setShowConvertDialog(true)
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'hot':
        return <Flame className="w-4 h-4 text-red-500" />
      case 'warm':
        return <Wind className="w-4 h-4 text-orange-500" />
      case 'cold':
        return <Snowflake className="w-4 h-4 text-blue-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-700',
      contacted: 'bg-purple-100 text-purple-700',
      qualified: 'bg-yellow-100 text-yellow-700',
      quoted: 'bg-cyan-100 text-cyan-700',
      negotiating: 'bg-orange-100 text-orange-700',
      scheduled: 'bg-violet-100 text-violet-700',
      won: 'bg-green-100 text-green-700',
      cold: 'bg-slate-100 text-slate-700',
      lost: 'bg-gray-100 text-gray-700'
    }
    const statusLabels: Record<string, string> = {
      new: 'Mới',
      contacted: 'Đã liên hệ',
      qualified: 'Đủ điều kiện',
      quoted: 'Đã báo giá',
      negotiating: 'Đàm phán',
      scheduled: 'Đã đặt lịch',
      won: 'Thành công',
      cold: 'Cold Lead',
      lost: 'Thất bại'
    }
    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-700'}>
        {statusLabels[status] || status}
      </Badge>
    )
  }

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 60) return `${diffMinutes} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    if (diffDays === 1) return 'Hôm qua'
    if (diffDays < 7) return `${diffDays} ngày trước`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`
    return `${Math.floor(diffDays / 30)} tháng trước`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const today = new Date()

  return (
    <div className="space-y-6">
      {/* Page Header - Updated with greeting and date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {getGreeting()}, {userName || 'User'}!
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground capitalize">
            {formatVietnameseDate(today)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="w-full sm:w-auto">
            <Calendar className="w-4 h-4 mr-2" />
            Đặt Lịch Họp
          </Button>
          <Button
            onClick={() => setIsAddLeadModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Thêm Lead
          </Button>
        </div>
      </div>

      {/* Stats Cards - Reordered */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Theo Dõi Hôm Nay */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Theo Dõi Hôm Nay
            </CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.followUpsToday || 0}</div>
            {overdueFollowUps.length > 0 && (
              <p className="text-xs text-red-500">
                {overdueFollowUps.length} quá hạn
              </p>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Khách Hàng Mới Tuần Này */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Khách Hàng Mới Tuần Này
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.newLeadsThisWeek || 0}</div>
            <p className="text-xs text-muted-foreground">
              từ đầu tuần
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Giá Trị Pipeline */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Giá Trị Pipeline
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalPipelineValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Đang theo đuổi
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Tỷ Lệ Chuyển Đổi */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tỷ Lệ Chuyển Đổi
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.conversionRate || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.leadsWonThisMonth || 0} thành công tháng này
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid - Restructured */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Widgets */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chat Inbox Widget */}
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-red-600" />
                  Chat Inbox
                  <Badge className="bg-red-500 text-white">3</Badge>
                </CardTitle>
                <Button variant="ghost" size="sm" disabled>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { id: 1, customer: "Phạm Thị Mai", channel: "Zalo", message: "Tôi muốn tư vấn về implant răng...", time: "10 phút trước", unread: 2 },
                  { id: 2, customer: "Trần Văn Dũng", channel: "WhatsApp", message: "Báo giá dán sứ veneer bao nhiêu?", time: "1 giờ trước", unread: 1 },
                  { id: 3, customer: "Nguyễn Thị Lan", channel: "Messenger", message: "Phòng khám có làm việc ngày chủ nhật không?", time: "2 giờ trước", unread: 1 },
                ].map((chat) => (
                  <div key={chat.id} className="flex items-start gap-3 p-3 rounded-lg bg-white border border-border hover:shadow-sm transition-all cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-sm font-semibold">
                        {chat.customer.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{chat.customer}</p>
                            <Badge variant="outline" className="text-xs">{chat.channel}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">&quot;{chat.message}&quot;</p>
                          <p className="text-xs text-muted-foreground mt-1">{chat.time}</p>
                        </div>
                        {chat.unread > 0 && (
                          <Badge className="bg-red-500 text-white">{chat.unread}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Chat Tool sẽ được tích hợp sớm
              </p>
            </CardContent>
          </Card>

          {/* Pending Quotations Widget */}
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-yellow-600" />
                  Báo Giá Đang Chờ
                  <Badge className="bg-yellow-500 text-white">{pendingQuotations.length}</Badge>
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <a href={process.env.NEXT_PUBLIC_QUOTATION_TOOL_URL || '#'} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pendingQuotations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-yellow-400" />
                  <p className="font-medium">Không có báo giá đang chờ</p>
                  <p className="text-sm">Tất cả báo giá đã được xử lý</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingQuotations.map((quote) => {
                    const daysSince = Math.floor((new Date().getTime() - new Date(quote.created_at).getTime()) / (1000 * 60 * 60 * 24))
                    const firstItem = quote.items?.[0]
                    const serviceObj = firstItem?.service
                    const serviceName = firstItem?.custom_name ||
                      (Array.isArray(serviceObj) ? serviceObj[0]?.name : serviceObj?.name) ||
                      'Dịch vụ'
                    const serviceCount = quote.items?.length || 0
                    const serviceDisplay = serviceCount > 1 ? `${serviceName} (+${serviceCount - 1})` : serviceName
                    // Calculate total from items
                    const totalAmount = quote.items?.reduce((sum, item) => {
                      return sum + ((item.quantity || 1) * (item.unit_price_vnd || 0))
                    }, 0) || 0
                    const quotationUrl = process.env.NEXT_PUBLIC_QUOTATION_TOOL_URL || '#'
                    return (
                      <a
                        key={quote.id}
                        href={`${quotationUrl}/quotations/${quote.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-3 rounded-lg bg-white border border-border hover:shadow-sm transition-all cursor-pointer"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{quote.patient_name || 'Chưa có tên'}</p>
                                <Badge variant="outline" className="text-xs">{quote.quotation_number}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{serviceDisplay}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-sm">{(totalAmount / 1000000).toFixed(0)}M VND</p>
                              <Badge className={`mt-1 ${daysSince >= 5 ? "bg-red-500" : daysSince >= 3 ? "bg-yellow-500" : "bg-green-500"} text-white`}>
                                {daysSince} ngày
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </a>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ready to Convert Widget - MOVED FROM RIGHT COLUMN */}
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-green-600" />
                  Sẵn Sàng Chuyển Đổi
                </CardTitle>
                <Badge className="bg-green-500 text-white">
                  {readyToConvert.length}
                </Badge>
              </div>
              <CardDescription>
                Lead đã đặt lịch / đã tới phòng khám
              </CardDescription>
            </CardHeader>
            <CardContent>
              {readyToConvert.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="w-12 h-12 mx-auto mb-3 text-green-400" />
                  <p className="font-medium">Chưa có lead sẵn sàng</p>
                  <p className="text-sm">Các lead đã đặt lịch sẽ hiển thị ở đây</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {readyToConvert.map(lead => (
                    <div
                      key={lead.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border bg-white hover:shadow-sm transition-all"
                    >
                      <Link href={`/leads/${lead.id}`} className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-green-600 text-sm font-semibold">
                            {lead.first_name?.[0]}{lead.last_name?.[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {lead.priority === 'hot' && <Flame className="w-3.5 h-3.5 text-red-500" />}
                            <p className="font-medium text-sm truncate">{lead.first_name} {lead.last_name}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">{lead.phone}</p>
                          <p className="text-xs text-muted-foreground truncate mt-1">{lead.interest}</p>
                          <div className="mt-2">
                            {getStatusBadge(lead.status)}
                          </div>
                        </div>
                      </Link>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
                        onClick={() => openConvertDialog(lead.id)}
                      >
                        Chuyển Thành Bệnh Nhân
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Follow-ups */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Theo Dõi Hôm Nay
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/leads">Xem Tất Cả</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {todayFollowUps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p className="font-medium">Đã xong hết!</p>
                  <p className="text-sm">Không có lịch theo dõi cho hôm nay</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayFollowUps.map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/leads/${lead.id}`}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary text-sm font-semibold">
                          {lead.first_name?.[0]}{lead.last_name?.[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{lead.first_name} {lead.last_name}</p>
                            <p className="text-sm text-muted-foreground">{lead.phone}</p>
                            <p className="text-sm text-muted-foreground mt-1">{lead.interest}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {getPriorityIcon(lead.priority)}
                            {getStatusBadge(lead.status)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Button size="sm" variant="outline" className="h-7">
                            <Phone className="w-3 h-3 mr-1" />
                            Gọi
                          </Button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activities - MOVED FROM BOTTOM */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-500" />
                Hoạt Động Gần Đây
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Chưa có hoạt động nào
                </p>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((activity) => {
                    const getActivityIcon = () => {
                      switch (activity.type) {
                        case 'call':
                          return (
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                              <Phone className="w-4 h-4 text-purple-600" />
                            </div>
                          )
                        case 'email':
                          return (
                            <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                              <Mail className="w-4 h-4 text-cyan-600" />
                            </div>
                          )
                        case 'meeting':
                          return (
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                              <Users className="w-4 h-4 text-amber-600" />
                            </div>
                          )
                        case 'note':
                          return (
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                          )
                        default:
                          return (
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Clock className="w-4 h-4 text-gray-600" />
                            </div>
                          )
                      }
                    }

                    return (
                      <div key={activity.id} className="flex items-start gap-3">
                        {getActivityIcon()}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground">{activity.title}</p>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {activity.creator?.name || activity.creator?.email || 'Hệ thống'}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                              {getTimeAgo(activity.created_at)}
                            </span>
                          </div>
                          {activity.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {activity.description}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Pipeline Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Tóm Tắt Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { status: "new" as const, label: "Mới", color: "bg-blue-500" },
                  { status: "contacted" as const, label: "Đã liên hệ", color: "bg-purple-500" },
                  { status: "qualified" as const, label: "Đủ điều kiện", color: "bg-cyan-500" },
                  { status: "quoted" as const, label: "Đã báo giá", color: "bg-yellow-500" },
                  { status: "negotiating" as const, label: "Đàm phán", color: "bg-orange-500" },
                  { status: "scheduled" as const, label: "Đã đặt lịch", color: "bg-violet-500" },
                  { status: "won" as const, label: "Thành công", color: "bg-green-500" },
                  { status: "cold" as const, label: "Cold Lead", color: "bg-slate-400" },
                  { status: "lost" as const, label: "Thất bại", color: "bg-gray-500" },
                ].map(item => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <span className="font-semibold">
                      {pipelineCounts[item.status]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hot Leads */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-500" />
                  Khách Hàng Nóng
                </CardTitle>
                <Badge className="bg-red-500 text-white">
                  {recentLeads.filter(l => l.priority === 'hot').length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentLeads.filter(l => l.priority === 'hot').slice(0, 5).map(lead => (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    className="block p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{lead.first_name} {lead.last_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{lead.interest}</p>
                      </div>
                      {getStatusBadge(lead.status)}
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className="text-muted-foreground">{lead.phone}</span>
                      {lead.estimated_value && (
                        <span className="font-semibold">{formatCurrency(lead.estimated_value)}</span>
                      )}
                    </div>
                  </Link>
                ))}
                {recentLeads.filter(l => l.priority === 'hot').length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Không có lead nóng
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Overdue Follow-ups Alert */}
          {overdueFollowUps.length > 0 && (
            <Card className="border-red-300 bg-red-50/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="w-5 h-5" />
                    Follow-up Quá Hạn
                  </CardTitle>
                  <Badge className="bg-red-500 text-white">
                    {overdueFollowUps.length}
                  </Badge>
                </div>
                <CardDescription className="text-red-600">
                  Cần liên hệ ngay!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overdueFollowUps.map(lead => {
                    const overdueDays = lead.next_follow_up
                      ? Math.floor((new Date().getTime() - new Date(lead.next_follow_up).getTime()) / (1000 * 60 * 60 * 24))
                      : 0
                    return (
                      <Link
                        key={lead.id}
                        href={`/leads/${lead.id}`}
                        className="flex items-center justify-between p-2 rounded-lg border border-red-200 bg-white hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-red-600 text-xs font-semibold">
                              {lead.first_name?.[0]}{lead.last_name?.[0]}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {lead.first_name} {lead.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{lead.phone}</p>
                          </div>
                        </div>
                        <Badge className="bg-red-500 text-white flex-shrink-0">
                          -{overdueDays}d
                        </Badge>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={isAddLeadModalOpen}
        onClose={() => setIsAddLeadModalOpen(false)}
        onSuccess={() => {
          fetchDashboardData()
        }}
      />

      {/* Convert to Patient Dialog */}
      <AlertDialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Chuyển Thành Bệnh Nhân</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn chuyển lead này thành bệnh nhân?
              Hành động này sẽ tạo hồ sơ bệnh nhân mới và ghi nhận hoạt động chuyển đổi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConvertingLeadId(null)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConvertToPatient}
              className="bg-green-600 hover:bg-green-700"
            >
              Xác Nhận Chuyển Đổi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
