import {
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  CircleHelp,
  Home,
  Settings,
  Stethoscope,
  UsersRound,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { useGetProfileQuery } from '@/api/get-profile'

type AvailableNavigationItem = {
  label: string
  icon: LucideIcon
  to: string
  availability: 'available'
}

type UnavailableNavigationItem = {
  label: string
  icon: LucideIcon
  availability: 'unavailable'
}

export type SidebarNavigationItem =
  | AvailableNavigationItem
  | UnavailableNavigationItem

export const sidebarNavigationItems: SidebarNavigationItem[] = [
  { label: 'Início', icon: Home, to: '/', availability: 'available' },
  {
    label: 'Agenda',
    icon: CalendarDays,
    to: '/appointments',
    availability: 'available',
  },
  {
    label: 'Pacientes',
    icon: UsersRound,
    to: '/paciente',
    availability: 'available',
  },
  {
    label: 'Profissionais',
    icon: Stethoscope,
    to: '/doctor',
    availability: 'available',
  },
  {
    label: 'Configurações',
    icon: Settings,
    to: '/configuration',
    availability: 'available',
  },
  {
    label: 'Serviços',
    icon: CircleHelp,
    to: '/services/packages',
    availability: 'available',
  },
  {
    label: 'Relatórios',
    icon: ChartNoAxesCombined,
    availability: 'unavailable',
  },
  {
    label: 'Financeiro',
    icon: CircleDollarSign,
    availability: 'unavailable',
  },
]

export interface AppSidebarProps {
  variant: 'desktop' | 'compact'
  isOpen?: boolean
  isCollapsed?: boolean
  onClose?: () => void
  onNavigate?: () => void
}

const sidebarSurfaceClassName =
  'bg-[#143f32] text-white shadow-[0_18px_42px_rgb(11_43_33_/_22%)]'

function Brand({ isCollapsed }: { isCollapsed: boolean }) {
  const { data: profile } = useGetProfileQuery()
  const clinicName = profile?.clinicName ?? profile?.clinic?.name
  const unitName = profile?.unitName ?? profile?.activeUnitName
  return (
    <div
      className={cn(
        'border-b border-white/10 px-5 pt-6 pb-5',
        isCollapsed && 'px-3',
      )}
    >
      <div className={cn('flex items-center gap-3', isCollapsed && 'justify-center')}>
        <span
          aria-hidden="true"
          title={clinicName && unitName ? `${clinicName} — ${unitName}` : undefined}
          className="grid size-10 place-items-center rounded-xl bg-[#78c85e] text-lg font-bold text-[#143f32] shadow-sm"
        >
          E
        </span>
        {!isCollapsed ? (
          <div>
            <p className="text-base font-semibold tracking-tight">{clinicName ?? 'Clínica indisponível'}</p>
            <p className="text-xs text-white/65">{unitName ?? 'Unidade indisponível'}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function NavigationItems({
  isCollapsed,
  onNavigate,
}: {
  isCollapsed: boolean
  onNavigate?: () => void
}) {
  const [unavailableMessage, setUnavailableMessage] = useState('')

  return (
    <nav aria-label="Navegação principal" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-5">
      {sidebarNavigationItems.map((item) => {
        const Icon = item.icon

        if (item.availability === 'unavailable') {
          return (
            <button
              key={item.label}
              type="button"
              aria-disabled="true"
              aria-label={isCollapsed ? `${item.label} — Em breve` : undefined}
              onClick={() =>
                setUnavailableMessage(`${item.label} ainda não está disponível.`)
              }
              title={isCollapsed ? `${item.label} — Em breve` : undefined}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-white/55 transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[#a8df81] focus-visible:outline-none',
                isCollapsed && 'justify-center px-2',
              )}
            >
              <Icon aria-hidden="true" className="size-5 shrink-0" />
              <span className={cn('flex-1', isCollapsed && 'sr-only')}>
                {item.label}
              </span>
              {!isCollapsed ? (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-white/75 uppercase">
                  Em breve
                </span>
              ) : null}
            </button>
          )
        }

        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-[#a8df81] focus-visible:outline-none',
                isActive && 'bg-[#78c85e] text-[#143f32] shadow-sm hover:bg-[#93d978] hover:text-[#143f32]',
                isCollapsed && 'justify-center px-2',
              )
            }
          >
            <Icon aria-hidden="true" className="size-5 shrink-0" />
            <span className={isCollapsed ? 'sr-only' : undefined}>{item.label}</span>
          </NavLink>
        )
      })}
      <p role="status" aria-live="polite" className="sr-only">
        {unavailableMessage}
      </p>
    </nav>
  )
}

function InformationCard({ isCollapsed }: { isCollapsed: boolean }) {
  if (isCollapsed) return null

  return (
    <section
      aria-label="Informação da clínica"
      className="m-4 rounded-2xl border border-white/10 bg-white/8 p-4"
    >
      <p className="text-sm font-semibold">Cuidar começa com organização.</p>
      <p className="mt-1 text-xs leading-relaxed text-white/65">
        Centralize a rotina da clínica e acompanhe os atendimentos.
      </p>
    </section>
  )
}

export function AppSidebar({
  variant,
  isOpen = true,
  isCollapsed = false,
  onClose,
  onNavigate,
}: AppSidebarProps) {
  if (variant === 'compact' && !isOpen) return null

  const isCompact = variant === 'compact'

  return (
    <>
      {isCompact ? (
        <div aria-hidden="true" className="fixed inset-0 z-40 bg-[#071d16]/45 min-[981px]:hidden" />
      ) : null}
      <aside
        id={isCompact ? 'app-sidebar-compact' : 'app-sidebar-desktop'}
        aria-label="Menu lateral"
        role={isCompact ? 'dialog' : undefined}
        aria-modal={isCompact || undefined}
        className={cn(
          sidebarSurfaceClassName,
          isCompact
            ? 'fixed inset-y-0 left-0 z-50 flex w-[min(20rem,calc(100vw-2.5rem))] flex-col min-[981px]:hidden'
            : cn(
                'sticky top-0 hidden h-screen shrink-0 flex-col min-[981px]:flex',
                isCollapsed ? 'w-[4.5rem]' : 'w-72',
              ),
        )}
      >
        <Brand
          isCollapsed={!isCompact && isCollapsed}
        />
        {isCompact ? (
          <button
            type="button"
            aria-label="Fechar menu lateral"
            onClick={onClose}
            className="absolute top-5 right-4 rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-[#a8df81] focus-visible:outline-none"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        ) : null}
        <NavigationItems isCollapsed={!isCompact && isCollapsed} onNavigate={onNavigate} />
        <InformationCard isCollapsed={!isCompact && isCollapsed} />
      </aside>
    </>
  )
}
