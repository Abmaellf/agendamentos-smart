import type { ReactNode } from 'react'
import type { LinkProps } from 'react-router-dom'

export type NavLinkProps = LinkProps

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
