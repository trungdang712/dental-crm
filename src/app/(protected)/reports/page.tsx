'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  TrendingUp,
  DollarSign,
  Target,
  Loader2,
  Calendar
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { Lead, LeadStatus } from '@/lib/types'

interface ReportStats {
  totalLeads: number
  leadsWon: number
  leadsLost: number
  conversionRate: number
  totalValue: number
  avgDealSize: number
  byStatus: Record<LeadStatus, number>
  bySource: Record<string, number>
  byPriority: Record<string, number>
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('this_month')
  const [stats, setStats] = useState<ReportStats | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchReportData()
  }, [period])

  const getDateRange = () => {
    const now = new Date()
    let start: Date
    let end: Date = now

    switch (period) {
      case 'this_month':
        start = startOfMonth(now)
        end = endOfMonth(now)
        break
      case 'last_month':
        start = startOfMonth(subMonths(now, 1))
        end = endOfMonth(subMonths(now, 1))
        break
      case 'last_3_months':
        start = startOfMonth(subMonths(now, 2))
        end = endOfMonth(now)
        break
      case 'last_6_months':
        start = startOfMonth(subMonths(now, 5))
        end = endOfMonth(now)
        break
      case 'this_year':
        start = new Date(now.getFullYear(), 0, 1)
        end = new Date(now.getFullYear(), 11, 31)
        break
      default:
        start = startOfMonth(now)
        end = endOfMonth(now)
    }

    return { start, end }
  }

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const { start, end } = getDateRange()

      const { data: leads, error } = await supabase
        .from('crm_leads')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())

      if (error) {
        console.error('Error fetching leads:', error)
        return
      }

      // Calculate stats
      const totalLeads = leads?.length || 0
      const leadsWon = leads?.filter(l => l.status === 'won').length || 0
      const leadsLost = leads?.filter(l => l.status === 'lost').length || 0
      const conversionRate = totalLeads > 0 ? (leadsWon / totalLeads) * 100 : 0

      const wonLeads = leads?.filter(l => l.status === 'won') || []
      const totalValue = wonLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0)
      const avgDealSize = wonLeads.length > 0 ? totalValue / wonLeads.length : 0

      // Group by status
      const byStatus: Record<string, number> = {}
      leads?.forEach(lead => {
        byStatus[lead.status] = (byStatus[lead.status] || 0) + 1
      })

      // Group by source
      const bySource: Record<string, number> = {}
      leads?.forEach(lead => {
        const source = lead.source || 'unknown'
        bySource[source] = (bySource[source] || 0) + 1
      })

      // Group by priority
      const byPriority: Record<string, number> = {}
      leads?.forEach(lead => {
        byPriority[lead.priority] = (byPriority[lead.priority] || 0) + 1
      })

      setStats({
        totalLeads,
        leadsWon,
        leadsLost,
        conversionRate,
        totalValue,
        avgDealSize,
        byStatus: byStatus as Record<LeadStatus, number>,
        bySource,
        byPriority,
      })
    } catch (error) {
      console.error('Error fetching report data:', error)
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

  const statusLabels: Record<string, string> = {
    new: 'Mới',
    contacted: 'Đã liên hệ',
    qualified: 'Đủ điều kiện',
    quoted: 'Đã báo giá',
    negotiating: 'Đàm phán',
    won: 'Thành công',
    lost: 'Thất bại',
  }

  const sourceLabels: Record<string, string> = {
    facebook: 'Facebook',
    google: 'Google',
    referral: 'Giới thiệu',
    walkin: 'Khách vãng lai',
    website: 'Website',
    chat: 'Chat',
    unknown: 'Không xác định',
  }

  const priorityLabels: Record<string, string> = {
    hot: 'Nóng',
    warm: 'Ấm',
    cold: 'Lạnh',
  }

  const periodLabels: Record<string, string> = {
    this_month: 'Tháng này',
    last_month: 'Tháng trước',
    last_3_months: '3 tháng gần đây',
    last_6_months: '6 tháng gần đây',
    this_year: 'Năm nay',
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Báo cáo</h1>
          <p className="text-muted-foreground">
            Phân tích hiệu suất bán hàng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">Tháng này</SelectItem>
              <SelectItem value="last_month">Tháng trước</SelectItem>
              <SelectItem value="last_3_months">3 tháng gần đây</SelectItem>
              <SelectItem value="last_6_months">6 tháng gần đây</SelectItem>
              <SelectItem value="this_year">Năm nay</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
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
              trong {periodLabels[period].toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tỷ Lệ Chuyển Đổi
            </CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.conversionRate || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.leadsWon || 0} thành công / {stats?.leadsLost || 0} thất bại
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Doanh Thu
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              từ leads thành công
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Giá Trị TB/Deal
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.avgDealSize || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              trung bình mỗi deal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* By Status */}
        <Card>
          <CardHeader>
            <CardTitle>Theo Trạng Thái</CardTitle>
            <CardDescription>Phân bố leads theo giai đoạn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats?.byStatus || {}).map(([status, count]) => {
                const percentage = stats?.totalLeads
                  ? ((count / stats.totalLeads) * 100).toFixed(1)
                  : '0'
                return (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm">
                      {statusLabels[status] || status}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{count}</span>
                      <Badge variant="outline">{percentage}%</Badge>
                    </div>
                  </div>
                )
              })}
              {Object.keys(stats?.byStatus || {}).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Không có dữ liệu
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* By Source */}
        <Card>
          <CardHeader>
            <CardTitle>Theo Nguồn</CardTitle>
            <CardDescription>Nguồn leads hiệu quả nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats?.bySource || {})
                .sort((a, b) => b[1] - a[1])
                .map(([source, count]) => {
                  const percentage = stats?.totalLeads
                    ? ((count / stats.totalLeads) * 100).toFixed(1)
                    : '0'
                  return (
                    <div key={source} className="flex items-center justify-between">
                      <span className="text-sm">
                        {sourceLabels[source] || source}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{count}</span>
                        <Badge variant="outline">{percentage}%</Badge>
                      </div>
                    </div>
                  )
                })}
              {Object.keys(stats?.bySource || {}).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Không có dữ liệu
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* By Priority */}
        <Card>
          <CardHeader>
            <CardTitle>Theo Mức Độ</CardTitle>
            <CardDescription>Phân bố leads theo độ ưu tiên</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats?.byPriority || {})
                .sort((a, b) => {
                  const order = { hot: 0, warm: 1, cold: 2 }
                  return (order[a[0] as keyof typeof order] || 3) - (order[b[0] as keyof typeof order] || 3)
                })
                .map(([priority, count]) => {
                  const percentage = stats?.totalLeads
                    ? ((count / stats.totalLeads) * 100).toFixed(1)
                    : '0'
                  return (
                    <div key={priority} className="flex items-center justify-between">
                      <span className="text-sm">
                        {priorityLabels[priority] || priority}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{count}</span>
                        <Badge variant="outline">{percentage}%</Badge>
                      </div>
                    </div>
                  )
                })}
              {Object.keys(stats?.byPriority || {}).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Không có dữ liệu
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
