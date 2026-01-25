'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  User,
  Bell,
  Globe,
  Shield,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { user, profile } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: profile?.name || '',
    email: user?.email || '',
  })

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNewLead: true,
    emailStatusChange: true,
    emailFollowUp: true,
    browserNotifications: false,
  })

  // Preferences
  const [preferences, setPreferences] = useState({
    language: 'vi',
    timezone: 'Asia/Ho_Chi_Minh',
    dateFormat: 'dd/MM/yyyy',
  })

  const handleSaveProfile = async () => {
    setIsSubmitting(true)
    try {
      // In a real app, this would call an API to update the profile
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Đã lưu thông tin cá nhân')
    } catch (error) {
      toast.error('Không thể lưu thông tin')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveNotifications = async () => {
    setIsSubmitting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Đã lưu cài đặt thông báo')
    } catch (error) {
      toast.error('Không thể lưu cài đặt')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSavePreferences = async () => {
    setIsSubmitting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Đã lưu tùy chọn')
    } catch (error) {
      toast.error('Không thể lưu tùy chọn')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cài đặt</h1>
        <p className="text-muted-foreground">
          Quản lý tài khoản và tùy chọn cá nhân
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <CardTitle>Thông tin cá nhân</CardTitle>
          </div>
          <CardDescription>
            Cập nhật thông tin tài khoản của bạn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Họ tên</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) =>
                  setProfileData({ ...profileData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Lưu thay đổi
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <CardTitle>Thông báo</CardTitle>
          </div>
          <CardDescription>
            Tùy chỉnh cách bạn nhận thông báo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Lead mới</p>
              <p className="text-sm text-muted-foreground">
                Nhận email khi có lead mới được tạo
              </p>
            </div>
            <Switch
              checked={notifications.emailNewLead}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, emailNewLead: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Thay đổi trạng thái</p>
              <p className="text-sm text-muted-foreground">
                Nhận email khi lead chuyển trạng thái
              </p>
            </div>
            <Switch
              checked={notifications.emailStatusChange}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, emailStatusChange: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Nhắc follow-up</p>
              <p className="text-sm text-muted-foreground">
                Nhận nhắc nhở về lịch follow-up
              </p>
            </div>
            <Switch
              checked={notifications.emailFollowUp}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, emailFollowUp: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Thông báo trình duyệt</p>
              <p className="text-sm text-muted-foreground">
                Hiển thị thông báo trên trình duyệt
              </p>
            </div>
            <Switch
              checked={notifications.browserNotifications}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, browserNotifications: checked })
              }
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveNotifications} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Lưu cài đặt
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            <CardTitle>Tùy chọn</CardTitle>
          </div>
          <CardDescription>
            Cài đặt ngôn ngữ và định dạng
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ngôn ngữ</Label>
              <Select
                value={preferences.language}
                onValueChange={(value) =>
                  setPreferences({ ...preferences, language: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">Tiếng Việt</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Múi giờ</Label>
              <Select
                value={preferences.timezone}
                onValueChange={(value) =>
                  setPreferences({ ...preferences, timezone: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Ho_Chi_Minh">
                    (GMT+7) Hồ Chí Minh
                  </SelectItem>
                  <SelectItem value="Asia/Bangkok">
                    (GMT+7) Bangkok
                  </SelectItem>
                  <SelectItem value="Asia/Singapore">
                    (GMT+8) Singapore
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Định dạng ngày</Label>
            <Select
              value={preferences.dateFormat}
              onValueChange={(value) =>
                setPreferences({ ...preferences, dateFormat: value })
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={handleSavePreferences} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Lưu tùy chọn
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <CardTitle>Bảo mật</CardTitle>
          </div>
          <CardDescription>
            Thông tin bảo mật tài khoản
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">ID Tài khoản</p>
              <p className="font-mono text-sm">{user?.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vai trò</p>
              <p className="font-medium capitalize">{profile?.role || 'User'}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Để thay đổi mật khẩu hoặc cài đặt bảo mật khác, vui lòng liên hệ quản trị viên.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
