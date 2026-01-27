'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { CountrySelector } from '@/components/ui/country-selector'
import { FileUpload } from '@/components/ui/file-upload'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { LeadSource, LeadPriority, User as UserType } from '@/lib/types'

interface AddLeadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (lead: unknown) => void
}

export function AddLeadModal({ isOpen, onClose, onSuccess }: AddLeadModalProps) {
  const [users, setUsers] = useState<UserType[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [xrayFiles, setXrayFiles] = useState<File[]>([])
  const [patientPhotos, setPatientPhotos] = useState<File[]>([])

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

  const supabase = createClient()

  useEffect(() => {
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

    if (isOpen) {
      fetchUsers()
    }
  }, [isOpen, supabase])

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

  const handleSubmit = async (e: React.FormEvent) => {
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
        onSuccess(result.data)
        handleClose()
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

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm Khách Hàng Tiềm Năng</DialogTitle>
          <DialogDescription>
            Điền thông tin khách hàng. Các trường * là bắt buộc.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
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
                <Label htmlFor="estimated_value">Giá trị ước tính (VND)</Label>
                <Input
                  id="estimated_value"
                  type="number"
                  value={formData.estimated_value}
                  onChange={(e) =>
                    setFormData({ ...formData, estimated_value: e.target.value })
                  }
                  placeholder="VD: 15000000"
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
              onClick={handleClose}
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
  )
}
