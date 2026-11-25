import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface DataTableCardProps {
  children: ReactNode
  footer?: ReactNode
  ariaLabel: string
  className?: string
}

export function DataTableCard({
  children,
  footer,
  ariaLabel,
  className,
}: DataTableCardProps) {
  return (
    <section
      aria-label={ariaLabel}
      className={cn(
        'overflow-hidden rounded-xl border bg-white shadow-sm',
        className,
      )}
    >
      {children}
      {footer}
    </section>
  )
}
