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
  Snowflake
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
        {/* Today's Follow-ups */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Follow-up Hôm Nay
            </CardTitle>
            <CardDescription>
              {todayFollowUps.length} cuộc hẹn cần thực hiện
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todayFollowUps.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Không có follow-up nào hôm nay
              </p>
            ) : (
              <div className="space-y-3">
                {todayFollowUps.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    className="block p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">
                        {lead.first_name} {lead.last_name}
                      </span>
                      {getPriorityIcon(lead.priority)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      {lead.phone}
                    </div>
                    {lead.next_follow_up && (
                      <p className="text-xs text-primary mt-1">
                        {format(new Date(lead.next_follow_up), 'HH:mm', { locale: vi })}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Leads Gần Đây</CardTitle>
              <CardDescription>
                Khách hàng tiềm năng mới nhất
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/leads">
                Xem tất cả
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Chưa có lead nào
              </p>
            ) : (
              <div className="space-y-3">
                {recentLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getPriorityIcon(lead.priority)}
                      <div>
                        <p className="font-medium">
                          {lead.first_name} {lead.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {lead.interest || lead.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {lead.estimated_value && (
                        <span className="text-sm font-medium">
                          {formatCurrency(lead.estimated_value)}
                        </span>
                      )}
                      {getStatusBadge(lead.status)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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
