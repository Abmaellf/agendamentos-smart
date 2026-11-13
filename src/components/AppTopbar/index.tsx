import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Menu,
  Search,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useGetAppointmentSessionQuery } from '@/features/appointments/api/appointments'
import { CreateAppointmentDialog } from '@/features/appointments/components/create-appointment-dialog'
import { useAppShellDate } from '@/_layout/app-shell-context'

import AccountMenu from '../account-menu'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { cn } from '@/lib/utils'

export interface AppTopbarProps {
  isSidebarCollapsed: boolean
  isCompactSidebarOpen: boolean
  isCompactViewport: boolean
  onToggleSidebar: () => void
  onOpenCompactSidebar: () => void
  notificationCount?: number
}

function formatHeaderDate(date: Date) {
  const day = format(date, 'dd')
  const month = format(date, 'MMMM', { locale: ptBR })
  const year = format(date, 'yyyy')
  const capitalizedMonth = month.charAt(0).toLocaleUpperCase('pt-BR') + month.slice(1)
  return `${day} de ${capitalizedMonth} de ${year}`
}

function parseDateValue(value: string) {
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export function AppTopbar({
  isSidebarCollapsed,
  isCompactSidebarOpen,
  isCompactViewport,
  onToggleSidebar,
  onOpenCompactSidebar,
  notificationCount,
}: AppTopbarProps) {
  const searchInputId = 'app-shell-search'
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const { selectedDate, setSelectedDate, goToToday, moveByWeek } =
    useAppShellDate()
  const { data: session } = useGetAppointmentSessionQuery()

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', focusSearch)
    return () => document.removeEventListener('keydown', focusSearch)
  }, [])

  function handleMenuClick() {
    if (isCompactViewport) {
      onOpenCompactSidebar()
      return
    }
    onToggleSidebar()
  }

  const menuLabel = isCompactViewport
    ? 'Abrir menu lateral'
    : isSidebarCollapsed
      ? 'Expandir menu lateral'
      : 'Recolher menu lateral'
  const menuControls = isCompactViewport
    ? 'app-sidebar-compact'
    : 'app-sidebar-desktop'
  const menuExpanded = isCompactViewport
    ? isCompactSidebarOpen
    : !isSidebarCollapsed
  const dateValue = format(selectedDate, 'yyyy-MM-dd')
  const hasNotificationCount =
    typeof notificationCount === 'number' && notificationCount > 0

  return (
    <header
      aria-label="Cabeçalho da aplicação"
      className="sticky top-0 z-30 flex min-h-20 flex-wrap items-center gap-3 border-b border-[#dce8e1] bg-white/95 px-4 py-3 shadow-[0_4px_18px_rgb(24_61_45_/_8%)] backdrop-blur md:px-6"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={menuLabel}
        aria-expanded={menuExpanded}
        aria-controls={menuControls}
        onClick={handleMenuClick}
        className="size-11 shrink-0 rounded-xl text-[#143f32] hover:bg-[#edf8f2] hover:text-[#143f32] focus-visible:ring-[#78c85e]"
      >
        <Menu aria-hidden="true" className="size-6" />
      </Button>

      <div className="relative min-w-48 flex-1 basis-full md:basis-auto">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-[#71877b]"
        />
        <Input
          ref={searchInputRef}
          id={searchInputId}
          type="search"
          aria-label="Buscar na aplicação"
          placeholder="Buscar paciente, serviço ou horário..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="h-11 rounded-xl border-[#dce8e1] bg-[#f7faf8] pr-16 pl-10 text-sm text-[#20382d] shadow-none placeholder:text-[#71877b] focus-visible:border-[#78c85e] focus-visible:ring-[#78c85e]/30"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-md border border-[#dce8e1] bg-white px-2 py-1 text-xs font-medium text-[#71877b]">
          ⌘ K
        </kbd>
      </div>

      <div className="flex min-w-0 items-center gap-2 max-[720px]:order-3 max-[720px]:w-full max-[720px]:justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={goToToday}
          className="h-11 rounded-xl border-[#dce8e1] bg-white px-3 text-[#20382d] shadow-sm hover:bg-[#edf8f2] hover:text-[#143f32]"
        >
          <CalendarDays aria-hidden="true" className="size-4" />
          <span>Hoje</span>
        </Button>

        <nav
          aria-label="Navegação de data da agenda"
          className="flex min-w-0 items-center rounded-xl border border-[#dce8e1] bg-white shadow-sm"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Semana anterior"
            onClick={() => moveByWeek(-1)}
            className="size-11 shrink-0 rounded-xl text-[#355746] hover:bg-[#edf8f2] hover:text-[#143f32]"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <div className="relative grid min-w-48 place-items-center px-2 max-[720px]:min-w-0">
            <Input
              type="date"
              aria-label="Selecionar data da agenda"
              value={dateValue}
              onClick={(event) => event.currentTarget.showPicker?.()}
              onChange={(event) => {
                const nextDate = parseDateValue(event.target.value)
                if (nextDate) setSelectedDate(nextDate)
              }}
              className="peer absolute inset-0 z-10 h-full w-full cursor-pointer border-0 p-0 opacity-0 shadow-none focus-visible:border-0 focus-visible:ring-0"
            />
            <time
              dateTime={dateValue}
              className="pointer-events-none whitespace-nowrap text-center text-sm font-semibold text-[#20382d] peer-focus-visible:rounded-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#78c85e] max-[720px]:text-xs"
            >
              {formatHeaderDate(selectedDate)}
            </time>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Próxima semana"
            onClick={() => moveByWeek(1)}
            className="size-11 shrink-0 rounded-xl text-[#355746] hover:bg-[#edf8f2] hover:text-[#143f32]"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </nav>
      </div>

      <div className="ml-auto flex items-center gap-2 max-[720px]:order-2">
        {session ? (
          <div className="hidden items-center gap-2 sm:flex">
            <CreateAppointmentDialog
              session={session}
              defaultDate={dateValue}
              triggerLabel="Agendar"
              triggerAriaLabel="Novo agendamento"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => toast.info('Agendamento de Pacotes estará disponível após a SPEC 02.')}
            >
              Agendamento de Pacotes
            </Button>
          </div>
        ) : null}

        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Notificações"
          className="relative size-11 rounded-xl border-[#dce8e1] bg-white text-[#20382d] shadow-sm hover:bg-[#edf8f2] hover:text-[#143f32]"
        >
          <Bell aria-hidden="true" className="size-5" />
          {hasNotificationCount ? (
            <span
              aria-label={`${notificationCount} notificações não lidas`}
              className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-[#e53935] px-1 text-[0.65rem] font-bold leading-5 text-white"
            >
              {notificationCount}
            </span>
          ) : null}
        </Button>

        <div
          className={cn(
            'rounded-full',
            'focus-within:ring-2 focus-within:ring-[#78c85e]/40',
          )}
        >
          <AccountMenu />
        </div>
      </div>
    </header>
  )
}
