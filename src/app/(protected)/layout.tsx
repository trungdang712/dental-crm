'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Users,
  UserCircle,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Loader2,
  Menu,
  X,
  MessageSquare
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  badge?: number
  badgeColor?: string
  disabled?: boolean
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '#', label: 'Chat Inbox', icon: MessageSquare, badge: 3, badgeColor: 'bg-red-500 text-white', disabled: true },
  { href: '/leads', label: 'Leads', icon: Users, badge: 12, badgeColor: 'bg-blue-500 text-white' },
  { href: '/customers', label: 'Khách Hàng', icon: UserCircle },
  { href: process.env.NEXT_PUBLIC_QUOTATION_TOOL_URL || '#', label: 'Báo Giá', icon: FileText, badge: 5, badgeColor: 'bg-yellow-500 text-white' },
  { href: '/reports', label: 'Báo cáo', icon: BarChart3 },
  { href: '/settings', label: 'Cài đặt', icon: Settings },
]

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, loading, signOut } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      {/* Sidebar - Force light theme */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-[#f8fafc] border-r border-[#e2e8f0] transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#e2e8f0]">
          {sidebarOpen && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src="/assets/greenfield-logo.png"
                alt="Greenfield"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <div>
                <h1 className="font-bold text-[#1e293b]">CRM Nha Khoa</h1>
                <p className="text-xs text-[#64748b]">Quản lý Bán hàng</p>
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

              if (item.disabled) {
                return (
                  <li key={item.label}>
                    <div
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#94a3b8] cursor-not-allowed"
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {sidebarOpen && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full opacity-50", item.badgeColor || "bg-primary")}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </li>
                )
              }

              const isExternal = item.href.startsWith('http')

              return (
                <li key={item.href}>
                  {isExternal ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                        "text-[#1e293b] hover:bg-[#f1f5f9]"
                      )}
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {sidebarOpen && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", item.badgeColor || "bg-primary")}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                        isActive
                          ? "bg-[#2563eb] text-white"
                          : "text-[#1e293b] hover:bg-[#f1f5f9]"
                      )}
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {sidebarOpen && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", item.badgeColor || "bg-primary")}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Menu */}
        {sidebarOpen && (
          <div className="p-4 border-t border-[#e2e8f0]">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#f1f5f9] rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#dbeafe] flex items-center justify-center">
                  <span className="text-[#2563eb] text-sm font-semibold">
                    {profile?.name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-[#1e293b] truncate">
                    {profile?.name || user.email}
                  </p>
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded",
                      profile?.role === 'admin' ? 'bg-red-100 text-red-700' :
                      profile?.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    )}>
                      {profile?.role === 'admin' ? 'Admin' :
                       profile?.role === 'manager' ? 'Manager' : 'Sales'}
                    </span>
                  </div>
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 text-[#64748b] transition-transform",
                  showUserMenu && "rotate-180"
                )} />
              </button>

              {/* Dropdown */}
              {showUserMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-[#e2e8f0] rounded-lg shadow-lg overflow-hidden z-50">
                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#f1f5f9] transition-colors text-[#1e293b]"
                  >
                    <Settings className="w-4 h-4 text-[#64748b]" />
                    <span className="text-sm">Cài đặt</span>
                  </Link>
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      handleSignOut()
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f1f5f9] transition-colors border-t border-[#e2e8f0]"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-500">Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-300",
        sidebarOpen ? "ml-64" : "ml-16"
      )}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
