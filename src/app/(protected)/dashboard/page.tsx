'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  UserPlus,
  TrendingUp,
  DollarSign,
  Calendar,
  Phone,
  ArrowRight,
  Loader2,
  Flame,
  Wind,
  Snowflake,
  MessageSquare,
  FileText,
  Clock,
  ExternalLink,
  CheckCircle2
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { Lead, Activity, DashboardStats } from '@/lib/types'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentLeads, setRecentLeads] = useState<Lead[]>([])
  const [todayFollowUps, setTodayFollowUps] = useState<Lead[]>([])
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
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

      // Fetch all counts in parallel
      const [
        totalLeadsResult,
        newTodayResult,
        newWeekResult,
        wonMonthResult,
        pipelineValueResult,
        followUpsResult,
        recentLeadsResult,
        activitiesResult
      ] = await Promise.all([
        // Total leads
        supabase.from('crm_leads').select('id', { count: 'exact', head: true }),

        // New leads today
        supabase.from('crm_leads')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString()),

        // New leads this week
        supabase.from('crm_leads')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', startOfWeek.toISOString()),

        // Won this month
        supabase.from('crm_leads')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'won')
          .gte('status_updated_at', startOfMonth.toISOString()),

        // Pipeline value (exclude won/lost)
        supabase.from('crm_leads')
          .select('estimated_value')
          .not('status', 'in', '(won,lost)'),

        // Today's follow-ups
        supabase.from('crm_leads')
          .select('*, assigned_user:users!crm_leads_assigned_to_fkey(id, name, email)')
          .gte('next_follow_up', today.toISOString())
          .lt('next_follow_up', tomorrow.toISOString())
          .order('next_follow_up', { ascending: true })
          .limit(5),

        // Recent leads
        supabase.from('crm_leads')
          .select('*, assigned_user:users!crm_leads_assigned_to_fkey(id, name, email)')
          .order('created_at', { ascending: false })
          .limit(5),

        // Recent activities
        supabase.from('crm_activities')
          .select('*, creator:users!crm_activities_created_by_fkey(id, name, email)')
          .order('created_at', { ascending: false })
          .limit(10)
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
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value)
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
      won: 'bg-green-100 text-green-700',
      lost: 'bg-gray-100 text-gray-700'
    }
    const statusLabels: Record<string, string> = {
      new: 'Mới',
      contacted: 'Đã liên hệ',
      qualified: 'Đủ điều kiện',
      quoted: 'Đã báo giá',
      negotiating: 'Đàm phán',
      won: 'Thành công',
      lost: 'Thất bại'
    }
    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-700'}>
        {statusLabels[status] || status}
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tổng quan</h1>
          <p className="text-muted-foreground">
            Xin chào! Đây là tình hình CRM của bạn hôm nay.
          </p>
        </div>
        <Button asChild>
          <Link href="/leads">
            <UserPlus className="w-4 h-4 mr-2" />
            Thêm Lead Mới
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng Leads
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLeads || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.newLeadsThisWeek || 0} tuần này
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lead Mới Hôm Nay
            </CardTitle>
            <UserPlus className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.newLeadsToday || 0}</div>
            <p className="text-xs text-muted-foreground">
              Cần liên hệ ngay
            </p>
          </CardContent>
        </Card>

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

      {/* Main Content Grid */}
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
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">"{chat.message}"</p>
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
                  <Badge className="bg-yellow-500 text-white">5</Badge>
                </CardTitle>
                <Button variant="ghost" size="sm" disabled>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { id: "BG-2024-0159", customer: "Nguyễn Văn A", service: "Implant Straumann (x2)", value: 145000000, daysSince: 3 },
                  { id: "BG-2024-0160", customer: "Trần Thị B", service: "Tẩy trắng + Dán sứ Veneer", value: 87500000, daysSince: 1 },
                  { id: "BG-2024-0161", customer: "Lê Văn C", service: "Niềng răng Invisalign", value: 120000000, daysSince: 5 },
                ].map((quote) => (
                  <div key={quote.id} className="flex items-start gap-3 p-3 rounded-lg bg-white border border-border hover:shadow-sm transition-all cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{quote.customer}</p>
                            <Badge variant="outline" className="text-xs">{quote.id}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{quote.service}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">{(quote.value / 1000000).toFixed(0)}M VND</p>
                          <Badge className={`mt-1 ${quote.daysSince >= 5 ? "bg-red-500" : quote.daysSince >= 3 ? "bg-yellow-500" : "bg-green-500"} text-white`}>
                            {quote.daysSince} ngày
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Dữ liệu từ Quotation Tool
              </p>
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
                  { status: "new", label: "Mới", color: "bg-blue-500" },
                  { status: "contacted", label: "Đã liên hệ", color: "bg-purple-500" },
                  { status: "qualified", label: "Đủ điều kiện", color: "bg-cyan-500" },
                  { status: "quoted", label: "Đã báo giá", color: "bg-yellow-500" },
                  { status: "negotiating", label: "Đàm phán", color: "bg-orange-500" },
                ].map(item => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <span className="font-semibold">
                      {recentLeads.filter(l => l.status === item.status).length}
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
        </div>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Hoạt Động Gần Đây</CardTitle>
          <CardDescription>
            Lịch sử tương tác với khách hàng
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Chưa có hoạt động nào
            </p>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="font-medium">{activity.title}</p>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(activity.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                      {activity.creator && ` - ${activity.creator.name || activity.creator.email}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
