import { Menu } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { AppSidebar } from '@/components/AppSidebar'

export function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isCompactSidebarOpen, setIsCompactSidebarOpen] = useState(false)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)

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
    <div className="flex min-h-screen bg-[#f4f8f5] text-[#20382d]">
      <AppSidebar
        variant="desktop"
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
      />
      <div className="min-w-0 flex-1">
        <button
          ref={menuTriggerRef}
          type="button"
          aria-label="Abrir menu lateral"
          aria-expanded={isCompactSidebarOpen}
          aria-controls="app-sidebar-compact"
          onClick={() => setIsCompactSidebarOpen(true)}
          className="fixed top-3 left-3 z-30 rounded-xl bg-[#143f32] p-3 text-white shadow-lg transition-colors hover:bg-[#1d5946] focus-visible:ring-2 focus-visible:ring-[#78c85e] focus-visible:ring-offset-2 focus-visible:outline-none min-[981px]:hidden"
        >
          <Menu aria-hidden="true" className="size-5" />
        </button>
        <AppSidebar
          variant="compact"
          isOpen={isCompactSidebarOpen}
          onClose={closeCompactSidebar}
          onNavigate={closeCompactSidebar}
        />
        <main className="min-h-screen min-w-0 pt-16 min-[981px]:pt-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
