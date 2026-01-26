'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  Calendar,
  Download
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
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

const STATUS_COLORS: Record<string, string> = {
  new: '#3b82f6',
  contacted: '#8b5cf6',
  qualified: '#06b6d4',
  quoted: '#f59e0b',
  negotiating: '#f97316',
  won: '#10b981',
  lost: '#6b7280',
}

const SOURCE_COLORS: Record<string, string> = {
  facebook: '#3b82f6',
  google: '#10b981',
  referral: '#f59e0b',
  walkin: '#8b5cf6',
  website: '#06b6d4',
  chat: '#ec4899',
  unknown: '#6b7280',
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('last_6_months')
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [funnelData, setFunnelData] = useState<any[]>([])
  const [sourceData, setSourceData] = useState<any[]>([])
  const [monthlyData, setMonthlyData] = useState<any[]>([])

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
        start = startOfMonth(subMonths(now, 5))
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

      // Prepare chart data
      const funnel = [
        { stage: 'Mới', count: byStatus['new'] || 0, fill: STATUS_COLORS.new },
        { stage: 'Đã liên hệ', count: byStatus['contacted'] || 0, fill: STATUS_COLORS.contacted },
        { stage: 'Đủ điều kiện', count: byStatus['qualified'] || 0, fill: STATUS_COLORS.qualified },
        { stage: 'Đã báo giá', count: byStatus['quoted'] || 0, fill: STATUS_COLORS.quoted },
        { stage: 'Đàm phán', count: byStatus['negotiating'] || 0, fill: STATUS_COLORS.negotiating },
        { stage: 'Thành công', count: byStatus['won'] || 0, fill: STATUS_COLORS.won },
      ]

      const source = Object.entries(bySource).map(([name, value]) => ({
        name: sourceLabels[name] || name,
        value,
        fill: SOURCE_COLORS[name] || '#6b7280',
      }))

      // Calculate monthly data
      const monthly: Record<string, { newLeads: number; conversions: number }> = {}
      leads?.forEach(lead => {
        const month = format(new Date(lead.created_at), 'MMM', { locale: vi })
        if (!monthly[month]) {
          monthly[month] = { newLeads: 0, conversions: 0 }
        }
        monthly[month].newLeads++
        if (lead.status === 'won') {
          monthly[month].conversions++
        }
      })

      const monthlyArr = Object.entries(monthly).map(([month, data]) => ({
        month,
        ...data,
      }))

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
      setFunnelData(funnel)
      setSourceData(source)
      setMonthlyData(monthlyArr)
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
          <h1 className="text-2xl font-bold text-[#1e293b]">Báo Cáo & Phân Tích</h1>
          <p className="text-[#64748b]">
            Thống kê hiệu suất bán hàng
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48">
              <Calendar className="w-4 h-4 mr-2" />
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
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Xuất Báo Cáo
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748b]">
              Tổng Leads
            </CardTitle>
            <Users className="w-4 h-4 text-[#64748b]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1e293b]">{stats?.totalLeads || 0}</div>
            <p className="text-xs text-[#64748b]">
              trong {periodLabels[period].toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748b]">
              Tỷ Lệ Chuyển Đổi
            </CardTitle>
            <Target className="w-4 h-4 text-[#64748b]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1e293b]">
              {(stats?.conversionRate || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-[#64748b]">
              {stats?.leadsWon || 0} thành công / {stats?.leadsLost || 0} thất bại
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748b]">
              Doanh Thu
            </CardTitle>
            <DollarSign className="w-4 h-4 text-[#64748b]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1e293b]">
              {formatCurrency(stats?.totalValue || 0)}
            </div>
            <p className="text-xs text-[#64748b]">
              từ leads thành công
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748b]">
              Giá Trị TB/Deal
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-[#64748b]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1e293b]">
              {formatCurrency(stats?.avgDealSize || 0)}
            </div>
            <p className="text-xs text-[#64748b]">
              trung bình mỗi deal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-[#1e293b]">Phễu Chuyển Đổi</CardTitle>
            <CardDescription>Số lượng leads theo từng giai đoạn</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="count" name="Số lượng" radius={[4, 4, 0, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leads by Source */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-[#1e293b]">Nguồn Leads</CardTitle>
            <CardDescription>Phân bố leads theo nguồn</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-[#1e293b]">Xu Hướng Theo Tháng</CardTitle>
          <CardDescription>Leads mới và chuyển đổi theo thời gian</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="newLeads"
                name="Leads mới"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6' }}
              />
              <Line
                type="monotone"
                dataKey="conversions"
                name="Chuyển đổi"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* By Status */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-[#1e293b]">Theo Trạng Thái</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats?.byStatus || {}).map(([status, count]) => {
                const percentage = stats?.totalLeads
                  ? ((count / stats.totalLeads) * 100).toFixed(1)
                  : '0'
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[status] || '#6b7280' }}
                      />
                      <span className="text-sm text-[#1e293b]">
                        {statusLabels[status] || status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#1e293b]">{count}</span>
                      <Badge variant="outline" className="text-xs">{percentage}%</Badge>
                    </div>
                  </div>
                )
              })}
              {Object.keys(stats?.byStatus || {}).length === 0 && (
                <p className="text-sm text-[#64748b] text-center py-4">
                  Không có dữ liệu
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* By Source */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-[#1e293b]">Theo Nguồn</CardTitle>
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
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: SOURCE_COLORS[source] || '#6b7280' }}
                        />
                        <span className="text-sm text-[#1e293b]">
                          {sourceLabels[source] || source}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#1e293b]">{count}</span>
                        <Badge variant="outline" className="text-xs">{percentage}%</Badge>
                      </div>
                    </div>
                  )
                })}
              {Object.keys(stats?.bySource || {}).length === 0 && (
                <p className="text-sm text-[#64748b] text-center py-4">
                  Không có dữ liệu
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* By Priority */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-[#1e293b]">Theo Mức Độ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { key: 'hot', label: 'Nóng', color: '#ef4444' },
                { key: 'warm', label: 'Ấm', color: '#f97316' },
                { key: 'cold', label: 'Lạnh', color: '#3b82f6' },
              ].map(({ key, label, color }) => {
                const count = stats?.byPriority[key] || 0
                const percentage = stats?.totalLeads
                  ? ((count / stats.totalLeads) * 100).toFixed(1)
                  : '0'
                return (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm text-[#1e293b]">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#1e293b]">{count}</span>
                      <Badge variant="outline" className="text-xs">{percentage}%</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
