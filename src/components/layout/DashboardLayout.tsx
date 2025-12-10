'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  XMarkIcon, HomeIcon, BeakerIcon, CalendarIcon, BookOpenIcon, Cog6ToothIcon, 
  ChartBarIcon, Bars3Icon
} from '@heroicons/react/24/outline'
import Skeleton from '../ui/Skeleton'
import { ThemeToggle } from '../ui/theme-toggle'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Products', href: '/dashboard/products', icon: BeakerIcon },
  { name: 'Modalities', href: '/dashboard/modalities', icon: CalendarIcon },
  { name: 'Progress', href: '/dashboard/progress', icon: ChartBarIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname() || ''

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  // Helper function to check if a path is active
  const isPathActive = (path: string): boolean => {
    if (path === '/dashboard' && pathname === '/dashboard') {
      return true;
    }
    return path !== '/dashboard' && pathname.startsWith(path);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex h-screen">
          <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
            <div className="flex-1 flex flex-col min-h-0 bg-card border-r border-border">
              <Skeleton className="h-16 w-full" />
              <div className="flex-1 flex flex-col p-4 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </div>
          </div>
          <div className="lg:pl-64 flex flex-col flex-1">
            <Skeleton className="h-16 w-full" />
            <main className="flex-1 p-6">
              <Skeleton className="h-96 w-full" />
            </main>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar for mobile */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-border">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-foreground font-bold">BR</span>
              </div>
              <span className="text-lg font-medium">BioRegen</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md hover:bg-muted"
              aria-label="Close sidebar menu"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = isPathActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Mobile header */}
        <header className="sticky top-0 z-40 lg:hidden">
          <div className="h-16 px-4 bg-card/80 backdrop-blur-sm border-b border-border flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md hover:bg-muted"
              aria-label="Open sidebar menu"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
