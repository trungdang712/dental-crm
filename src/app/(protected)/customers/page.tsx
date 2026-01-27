'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import type { Lead } from '@/lib/types'
import {
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  Loader2
} from 'lucide-react'

type FilterStatus = 'all' | 'new' | 'contacted' | 'qualified' | 'quoted' | 'negotiating' | 'won' | 'lost'
type FilterPriority = 'all' | 'hot' | 'warm' | 'cold'
type FilterSource = 'all' | 'facebook' | 'google' | 'referral' | 'walk_in' | 'website' | 'other'

export default function CustomersPage() {
  const router = useRouter()
  const supabase = createClient()

  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all')
  const [filterSource, setFilterSource] = useState<FilterSource>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Fetch leads
  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setLeads(data)
    }
    setLoading(false)
  }

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const fullName = `${lead.first_name} ${lead.last_name}`.toLowerCase()
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus
    const matchesPriority = filterPriority === 'all' || lead.priority === filterPriority
    const matchesSource = filterSource === 'all' || lead.source === filterSource

    return matchesSearch && matchesStatus && matchesPriority && matchesSource
  })

  // Stats
  const totalLeads = leads.length
  const hotLeads = leads.filter(l => l.priority === 'hot').length
  const wonLeads = leads.filter(l => l.status === 'won').length
  const totalValue = leads.reduce((sum, l) => sum + (l.estimated_value || 0), 0)

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + itemsPerPage)

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'new' | 'contacted' | 'qualified' | 'quoted' | 'negotiating' | 'won' | 'lost' | 'default' }> = {
      new: { label: 'Mới', variant: 'new' },
      contacted: { label: 'Đã Liên Hệ', variant: 'contacted' },
      qualified: { label: 'Đủ Điều Kiện', variant: 'qualified' },
      quoted: { label: 'Báo Giá', variant: 'quoted' },
      negotiating: { label: 'Thương Lượng', variant: 'negotiating' },
      won: { label: 'Thành Công', variant: 'won' },
      lost: { label: 'Thất Bại', variant: 'lost' },
    }
    const config = variants[status] || variants.new
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { label: string; variant: 'hot' | 'warm' | 'cold' }> = {
      hot: { label: '🔥 Nóng', variant: 'hot' },
      warm: { label: '💨 Ấm', variant: 'warm' },
      cold: { label: '❄️ Lạnh', variant: 'cold' },
    }
    const config = variants[priority] || variants.cold
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      facebook: 'Facebook',
      google: 'Google',
      referral: 'Giới Thiệu',
      walk_in: 'Vãng Lai',
      website: 'Website',
      other: 'Khác',
    }
    return labels[source] || source
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Chưa đặt'
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date))
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M VND`
    }
    return new Intl.NumberFormat('vi-VN').format(value) + ' VND'
  }

  const handleLeadClick = (lead: Lead) => {
    router.push(`/leads/${lead.id}`)
  }

  const handleExportExcel = () => {
    // TODO: Implement Excel export
    console.log('Export to Excel')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Thông Tin Khách Hàng</h1>
          <p className="text-muted-foreground mt-1">
            Cơ sở dữ liệu tổng hợp - Quản lý toàn bộ khách hàng và leads
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-primary">
          <Plus className="w-4 h-4 mr-2" />
          Thêm Khách Hàng
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tổng Khách Hàng</p>
              <p className="text-2xl font-bold text-foreground">{totalLeads}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Khách Hàng Nóng</p>
              <p className="text-2xl font-bold text-foreground">{hotLeads}</p>
            </div>
            <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
              <span className="text-2xl">🔥</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Đã Chốt Deal</p>
              <p className="text-2xl font-bold text-foreground">{wonLeads}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tổng Giá Trị</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalValue)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên, email, SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)}>
            <SelectTrigger>
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất Cả Trạng Thái</SelectItem>
              <SelectItem value="new">Mới</SelectItem>
              <SelectItem value="contacted">Đã Liên Hệ</SelectItem>
              <SelectItem value="qualified">Đủ Điều Kiện</SelectItem>
              <SelectItem value="quoted">Báo Giá</SelectItem>
              <SelectItem value="negotiating">Thương Lượng</SelectItem>
              <SelectItem value="won">Thành Công</SelectItem>
              <SelectItem value="lost">Thất Bại</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={(value) => setFilterPriority(value as FilterPriority)}>
            <SelectTrigger>
              <SelectValue placeholder="Độ ưu tiên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất Cả Độ Ưu Tiên</SelectItem>
              <SelectItem value="hot">🔥 Nóng</SelectItem>
              <SelectItem value="warm">💨 Ấm</SelectItem>
              <SelectItem value="cold">❄️ Lạnh</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterSource} onValueChange={(value) => setFilterSource(value as FilterSource)}>
            <SelectTrigger>
              <SelectValue placeholder="Nguồn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất Cả Nguồn</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="referral">Giới Thiệu</SelectItem>
              <SelectItem value="walk_in">Vãng Lai</SelectItem>
              <SelectItem value="website">Website</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Hiển thị {paginatedLeads.length} / {filteredLeads.length} khách hàng
          </p>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="w-4 h-4 mr-2" />
            Xuất Excel
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Khách Hàng</TableHead>
              <TableHead>Liên Hệ</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead>Độ Ưu Tiên</TableHead>
              <TableHead>Nguồn</TableHead>
              <TableHead>Dịch Vụ</TableHead>
              <TableHead>Giá Trị</TableHead>
              <TableHead>Phân Công</TableHead>
              <TableHead>Theo Dõi</TableHead>
              <TableHead className="text-right">Thao Tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  <Filter className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Không tìm thấy khách hàng nào</p>
                </TableCell>
              </TableRow>
            ) : (
              paginatedLeads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleLeadClick(lead)}
                >
                  <TableCell>
                    <div className="font-medium text-foreground">{lead.first_name} {lead.last_name}</div>
                    <div className="text-sm text-muted-foreground">ID: {lead.id.slice(0, 8)}</div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        <span>{lead.phone || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">{lead.email || '-'}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>{getStatusBadge(lead.status)}</TableCell>

                  <TableCell>{getPriorityBadge(lead.priority)}</TableCell>

                  <TableCell>
                    <span className="text-sm">{lead.source ? getSourceLabel(lead.source) : '-'}</span>
                  </TableCell>

                  <TableCell>
                    <span className="text-sm">{lead.interest || '-'}</span>
                  </TableCell>

                  <TableCell>
                    <span className="font-medium">{formatCurrency(lead.estimated_value || 0)}</span>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {lead.assigned_to ? lead.assigned_to.slice(0, 2).toUpperCase() : 'NA'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{lead.assigned_to || '-'}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    {lead.next_follow_up ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span>{formatDate(lead.next_follow_up)}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Chưa đặt</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleLeadClick(lead)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          // TODO: Assign staff modal
                        }}
                        title="Phân công nhân viên"
                      >
                        <Users className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/leads/${lead.id}?edit=true`)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          // TODO: Delete confirm dialog
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <p className="text-sm text-muted-foreground">
              Trang {currentPage} / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Sau
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false)
          fetchLeads()
        }}
      />
    </div>
  )
}
