import type { ReactElement, ReactNode } from 'react'
import type { LinkProps } from 'react-router-dom'

import type { Appointment, AppointmentSession } from './appointment'

export type NavLinkProps = LinkProps

export interface PaginationProps {
  pageIndex: number
  perPage: number
  totalCount: number
}

export interface MenuVisibilityControls {
  setMenuIsVisible(isVisible: boolean): void
}

export type HeaderProps = MenuVisibilityControls

export interface MenuMobileProps extends MenuVisibilityControls {
  menuIsVisible: boolean
}

export interface CardDayProps {
  date: string
  isToday: boolean
  dayWeek: number
}

export interface CardPatientProps {
  appointment: Appointment
  isToday: boolean
}

export interface StatusPresentation {
  label: string
  className: string
}

export interface WeekDatesProps {
  date: Date
}

export type Theme = 'dark' | 'light' | 'system'

export interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export interface ThemeProviderState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export interface CreateAppointmentDialogProps {
  session: AppointmentSession
  defaultDate?: string
  triggerLabel?: string
  triggerAriaLabel?: string
}

export interface AppointmentFormState {
  patientId: string
  unitId: string
  serviceId: string
  professionalId: string
  date: string
  time: string
  durationMinutes: number | string
  price: string
}

export interface AppointmentFieldProps {
  label: string
  error?: string
  children: ReactElement<{ id?: string; 'aria-describedby'?: string }>
}

export interface PatientTableRowsProps {
  patientObj: {
    name: string
  }
}

export interface CreatePatientFormValues {
  name: string
}

export interface PatientTableFilterFormValues {
  name: string
}

export interface SignInFormValues {
  login: string
  password: string
}
