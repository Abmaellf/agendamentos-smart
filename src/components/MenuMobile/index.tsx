import { useEffect } from 'react'
import { X } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'

interface MenuVisibleProps {
  menuIsVisible: boolean
  setMenuIsVisible(data: boolean): void
}

const navigationItems = [
  { label: 'Agendamentos', to: '/appointments' },
  { label: 'Pacientes', to: '/paciente' },
  { label: 'Profissionais', to: '/doctor' },
  { label: 'Configurações', to: '/configuration' },
]

export function MenuMobile({
  menuIsVisible,
  setMenuIsVisible,
}: MenuVisibleProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflowY

    document.body.style.overflowY = menuIsVisible ? 'hidden' : previousOverflow

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuIsVisible(false)
      }
    }

    if (menuIsVisible) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.body.style.overflowY = previousOverflow
      document.removeEventListener('keydown', handleEscape)
    }
  }, [menuIsVisible, setMenuIsVisible])

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-label="Menu de navegação"
      aria-hidden={!menuIsVisible}
      className={cn(
        'fixed inset-0 z-[60] flex items-center justify-center bg-[#078a4b]/95 text-white backdrop-blur-sm transition-all duration-300 min-[981px]:hidden',
        menuIsVisible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-12 opacity-0',
      )}
    >
      <button
        type="button"
        aria-label="Fechar menu de navegação"
        tabIndex={menuIsVisible ? 0 : -1}
        onClick={() => setMenuIsVisible(false)}
        className="absolute top-4 right-4 rounded-md p-2 transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
      >
        <X className="size-8" />
      </button>

      <nav
        aria-label="Navegação móvel"
        className="flex flex-col items-center gap-6 text-2xl font-light"
      >
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            tabIndex={menuIsVisible ? 0 : -1}
            onClick={() => setMenuIsVisible(false)}
            className={({ isActive }) =>
              cn(
                'border-b border-transparent px-2 py-1 transition-colors hover:border-white/70 hover:text-white',
                isActive && 'border-white font-normal',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </section>
  )
}
