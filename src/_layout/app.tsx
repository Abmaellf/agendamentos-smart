import { useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { AppSidebar } from '@/components/AppSidebar'
import { AppTopbar } from '@/components/AppTopbar'

import { AppShellDateProvider } from './app-shell-context'

function isCompactViewport() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(max-width: 980px)').matches
  )
}

export function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isCompactSidebarOpen, setIsCompactSidebarOpen] = useState(false)
  const [compactViewport, setCompactViewport] = useState(isCompactViewport)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia('(max-width: 980px)')
    const updateViewport = () => setCompactViewport(mediaQuery.matches)
    updateViewport()
    mediaQuery.addEventListener?.('change', updateViewport)

    return () => mediaQuery.removeEventListener?.('change', updateViewport)
  }, [])

  function closeCompactSidebar() {
    setIsCompactSidebarOpen(false)
  }

  useEffect(() => {
    if (!isCompactSidebarOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') closeCompactSidebar()
    }

    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
      menuTriggerRef.current?.focus()
    }
  }, [isCompactSidebarOpen])

  return (
    <AppShellDateProvider>
      <div className="flex min-h-screen bg-[#f4f8f5] text-[#20382d]">
        <AppSidebar variant="desktop" isCollapsed={isSidebarCollapsed} />
        <div className="min-w-0 flex-1">
          <AppTopbar
            isSidebarCollapsed={isSidebarCollapsed}
            isCompactSidebarOpen={isCompactSidebarOpen}
            isCompactViewport={compactViewport}
            onToggleSidebar={() =>
              setIsSidebarCollapsed((collapsed) => !collapsed)
            }
            onOpenCompactSidebar={() => setIsCompactSidebarOpen(true)}
          />
          <AppSidebar
            variant="compact"
            isOpen={isCompactSidebarOpen}
            onClose={closeCompactSidebar}
            onNavigate={closeCompactSidebar}
          />
          <main className="min-h-[calc(100vh-5rem)] min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </AppShellDateProvider>
  )
}
