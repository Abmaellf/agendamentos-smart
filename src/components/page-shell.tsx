import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function PageContainer({
  children,
  className,
  contentClassName,
}: PageContainerProps) {
  return (
    <main
      className={cn(
        'min-h-full overflow-x-hidden bg-slate-50/70 px-4 pt-20 pb-8 sm:px-6 lg:px-8',
        className,
      )}
    >
      <section
        className={cn('mx-auto w-full max-w-[2048px] space-y-6', contentClassName)}
      >
        {children}
      </section>
    </main>
  )
}

interface PageHeaderProps {
  title: string
  description?: string
  icon?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className={cn('flex items-center gap-4', !icon && 'gap-0')}>
        {icon ? (
          <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            {icon}
          </span>
        ) : null}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#20382d]">
            {title}
          </h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  )
}
