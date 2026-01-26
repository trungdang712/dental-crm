'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Bell,
  Globe,
  Shield,
  Loader2,
  Users,
  Plug,
  Building,
  Upload,
  Check,
  X,
  ExternalLink,
  Settings2,
  GripVertical,
  Plus,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { user, profile } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: profile?.name || '',
    email: user?.email || '',
    phone: '',
    avatar: null as File | null,
  })

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNewLead: true,
    emailStatusChange: true,
    emailFollowUp: true,
    browserNotifications: false,
    emailDigest: 'daily',
  })

  // Preferences
  const [preferences, setPreferences] = useState({
    language: 'vi',
    timezone: 'Asia/Ho_Chi_Minh',
    dateFormat: 'dd/MM/yyyy',
    currency: 'VND',
  })

  // Company settings (admin only)
  const [companySettings, setCompanySettings] = useState({
    companyName: 'Nha Khoa ABC',
    address: '123 Nguyen Van Linh, Q7, TP.HCM',
    phone: '028 1234 5678',
    email: 'contact@nhakhoaabc.com',
    website: 'https://nhakhoaabc.com',
  })

  // Integration settings
  const [integrations, setIntegrations] = useState({
    zalo: { connected: true, phone: '0901234567' },
    messenger: { connected: false, pageId: '' },
    whatsapp: { connected: true, phone: '+84901234567' },
    googleCalendar: { connected: false, email: '' },
  })

  // CRM Settings (admin only)
  const [pipelineStages, setPipelineStages] = useState([
    { id: '1', name: 'Mới', color: '#3b82f6', order: 1 },
    { id: '2', name: 'Đã Liên Hệ', color: '#8b5cf6', order: 2 },
    { id: '3', name: 'Đủ Điều Kiện', color: '#06b6d4', order: 3 },
    { id: '4', name: 'Đã Báo Giá', color: '#f59e0b', order: 4 },
    { id: '5', name: 'Đàm Phán', color: '#f97316', order: 5 },
    { id: '6', name: 'Thành Công', color: '#10b981', order: 6 },
    { id: '7', name: 'Thất Bại', color: '#6b7280', order: 7 },
  ])
  const [leadSources, setLeadSources] = useState([
    { id: '1', name: 'Facebook', icon: 'facebook' },
    { id: '2', name: 'Google', icon: 'google' },
    { id: '3', name: 'Giới thiệu', icon: 'referral' },
    { id: '4', name: 'Khách vãng lai', icon: 'walkin' },
    { id: '5', name: 'Website', icon: 'website' },
    { id: '6', name: 'Chat', icon: 'chat' },
  ])

  const handleSaveProfile = async () => {
    setIsSubmitting(true)
    try {
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

  const handleSaveCompany = async () => {
    setIsSubmitting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Đã lưu thông tin công ty')
    } catch (error) {
      toast.error('Không thể lưu thông tin')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConnectIntegration = (service: string) => {
    toast.info(`Đang kết nối với ${service}...`)
  }

  const handleDisconnectIntegration = (service: string) => {
    toast.success(`Đã ngắt kết nối ${service}`)
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cài đặt</h1>
        <p className="text-muted-foreground">
          Quản lý tài khoản và tùy chọn hệ thống
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-6' : 'grid-cols-4'} lg:w-auto lg:inline-grid`}>
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Cá nhân</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Thông báo</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Tùy chọn</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Plug className="w-4 h-4" />
            <span className="hidden sm:inline">Tích hợp</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="crm" className="gap-2">
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">CRM</span>
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="company" className="gap-2">
              <Building className="w-4 h-4" />
              <span className="hidden sm:inline">Công ty</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
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
            <CardContent className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary text-2xl font-semibold">
                    {profile?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Tải ảnh lên
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG. Tối đa 2MB
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phone: e.target.value })
                    }
                    placeholder="0901234567"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vai trò</Label>
                  <div className="flex items-center h-10">
                    <Badge className={
                      profile?.role === 'admin' ? 'bg-red-100 text-red-700' :
                      profile?.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }>
                      {profile?.role === 'admin' ? 'Admin' :
                       profile?.role === 'manager' ? 'Manager' : 'Sales'}
                    </Badge>
                  </div>
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

          {/* Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <CardTitle>Bảo mật</CardTitle>
              </div>
              <CardDescription>
                Quản lý mật khẩu và bảo mật tài khoản
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Đổi mật khẩu</p>
                  <p className="text-sm text-muted-foreground">
                    Cập nhật mật khẩu định kỳ để bảo vệ tài khoản
                  </p>
                </div>
                <Button variant="outline">Đổi mật khẩu</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Xác thực 2 lớp</p>
                  <p className="text-sm text-muted-foreground">
                    Thêm một lớp bảo mật cho tài khoản
                  </p>
                </div>
                <Switch />
              </div>
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">ID Tài khoản:</span>{' '}
                  <span className="font-mono">{user?.id}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
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
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Email</h3>
                <div className="space-y-4 pl-4">
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
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Tần suất email tổng hợp</h3>
                <Select
                  value={notifications.emailDigest}
                  onValueChange={(value) =>
                    setNotifications({ ...notifications, emailDigest: value })
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Ngay lập tức</SelectItem>
                    <SelectItem value="daily">Hàng ngày</SelectItem>
                    <SelectItem value="weekly">Hàng tuần</SelectItem>
                    <SelectItem value="never">Không bao giờ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Trình duyệt</h3>
                <div className="flex items-center justify-between pl-4">
                  <div>
                    <p className="font-medium">Thông báo push</p>
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
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveNotifications} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Lưu cài đặt
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                <CardTitle>Tùy chọn</CardTitle>
              </div>
              <CardDescription>
                Cài đặt ngôn ngữ và định dạng hiển thị
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label>Định dạng ngày</Label>
                  <Select
                    value={preferences.dateFormat}
                    onValueChange={(value) =>
                      setPreferences({ ...preferences, dateFormat: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Đơn vị tiền tệ</Label>
                  <Select
                    value={preferences.currency}
                    onValueChange={(value) =>
                      setPreferences({ ...preferences, currency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VND">VND - Việt Nam Đồng</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={handleSavePreferences} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Lưu tùy chọn
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Plug className="w-5 h-5" />
                <CardTitle>Tích hợp</CardTitle>
              </div>
              <CardDescription>
                Kết nối với các dịch vụ bên ngoài
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Zalo */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">Zalo</span>
                  </div>
                  <div>
                    <p className="font-medium">Zalo OA</p>
                    {integrations.zalo.connected ? (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Đã kết nối: {integrations.zalo.phone}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Chưa kết nối</p>
                    )}
                  </div>
                </div>
                {integrations.zalo.connected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnectIntegration('Zalo')}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Ngắt kết nối
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => handleConnectIntegration('Zalo')}>
                    Kết nối
                  </Button>
                )}
              </div>

              {/* WhatsApp */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">WA</span>
                  </div>
                  <div>
                    <p className="font-medium">WhatsApp Business</p>
                    {integrations.whatsapp.connected ? (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Đã kết nối: {integrations.whatsapp.phone}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Chưa kết nối</p>
                    )}
                  </div>
                </div>
                {integrations.whatsapp.connected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnectIntegration('WhatsApp')}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Ngắt kết nối
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => handleConnectIntegration('WhatsApp')}>
                    Kết nối
                  </Button>
                )}
              </div>

              {/* Messenger */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">M</span>
                  </div>
                  <div>
                    <p className="font-medium">Facebook Messenger</p>
                    {integrations.messenger.connected ? (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Đã kết nối
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Chưa kết nối</p>
                    )}
                  </div>
                </div>
                {integrations.messenger.connected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnectIntegration('Messenger')}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Ngắt kết nối
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => handleConnectIntegration('Messenger')}>
                    Kết nối
                  </Button>
                )}
              </div>

              {/* Google Calendar */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <span className="text-red-600 font-bold text-lg">G</span>
                  </div>
                  <div>
                    <p className="font-medium">Google Calendar</p>
                    {integrations.googleCalendar.connected ? (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Đã kết nối
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Đồng bộ lịch follow-up với Google Calendar
                      </p>
                    )}
                  </div>
                </div>
                {integrations.googleCalendar.connected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnectIntegration('Google Calendar')}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Ngắt kết nối
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => handleConnectIntegration('Google Calendar')}>
                    Kết nối
                  </Button>
                )}
              </div>

              {/* Quotation Tool */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">QT</span>
                  </div>
                  <div>
                    <p className="font-medium">Quotation Tool</p>
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Đã tích hợp
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={process.env.NEXT_PUBLIC_QUOTATION_TOOL_URL || '#'} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Mở
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CRM Settings Tab (Admin only) */}
        {isAdmin && (
          <TabsContent value="crm" className="space-y-6">
            {/* Pipeline Stages */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5" />
                  <CardTitle>Giai đoạn Pipeline</CardTitle>
                </div>
                <CardDescription>
                  Tùy chỉnh các giai đoạn trong quy trình bán hàng
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {pipelineStages.map((stage, index) => (
                    <div
                      key={stage.id}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: stage.color }}
                      />
                      <input
                        type="text"
                        value={stage.name}
                        onChange={(e) => {
                          const updated = [...pipelineStages]
                          updated[index].name = e.target.value
                          setPipelineStages(updated)
                        }}
                        className="flex-1 bg-transparent border-none focus:outline-none font-medium"
                      />
                      <input
                        type="color"
                        value={stage.color}
                        onChange={(e) => {
                          const updated = [...pipelineStages]
                          updated[index].color = e.target.value
                          setPipelineStages(updated)
                        }}
                        className="w-8 h-8 rounded cursor-pointer border-0"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        disabled={pipelineStages.length <= 2}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm giai đoạn
                </Button>
                <p className="text-xs text-muted-foreground">
                  Kéo thả để sắp xếp lại thứ tự. Thay đổi sẽ ảnh hưởng đến tất cả leads.
                </p>
              </CardContent>
            </Card>

            {/* Lead Sources */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5" />
                  <CardTitle>Nguồn Lead</CardTitle>
                </div>
                <CardDescription>
                  Quản lý các nguồn khách hàng tiềm năng
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {leadSources.map((source, index) => (
                    <div
                      key={source.id}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                      <input
                        type="text"
                        value={source.name}
                        onChange={(e) => {
                          const updated = [...leadSources]
                          updated[index].name = e.target.value
                          setLeadSources(updated)
                        }}
                        className="flex-1 bg-transparent border-none focus:outline-none font-medium"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        disabled={leadSources.length <= 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm nguồn
                </Button>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={() => toast.success('Đã lưu cài đặt CRM')} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Lưu cài đặt CRM
              </Button>
            </div>
          </TabsContent>
        )}

        {/* Company Tab (Admin only) */}
        {isAdmin && (
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  <CardTitle>Thông tin công ty</CardTitle>
                </div>
                <CardDescription>
                  Cài đặt dành cho quản trị viên
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Tên công ty</Label>
                    <Input
                      value={companySettings.companyName}
                      onChange={(e) =>
                        setCompanySettings({ ...companySettings, companyName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Địa chỉ</Label>
                    <Input
                      value={companySettings.address}
                      onChange={(e) =>
                        setCompanySettings({ ...companySettings, address: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Số điện thoại</Label>
                    <Input
                      value={companySettings.phone}
                      onChange={(e) =>
                        setCompanySettings({ ...companySettings, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={companySettings.email}
                      onChange={(e) =>
                        setCompanySettings({ ...companySettings, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Website</Label>
                    <Input
                      value={companySettings.website}
                      onChange={(e) =>
                        setCompanySettings({ ...companySettings, website: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveCompany} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Lưu thông tin
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Team Management */}
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <CardTitle>Quản lý nhân viên</CardTitle>
                </div>
                <CardDescription>
                  Quản lý tài khoản và phân quyền
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Tính năng quản lý nhân viên sẽ được cập nhật sớm</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
