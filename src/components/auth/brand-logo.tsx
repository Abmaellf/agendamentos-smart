import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

interface BrandLogoProps extends HTMLAttributes<HTMLDivElement> {
  inverse?: boolean
  compact?: boolean
}

export function BrandLogo({
  inverse = false,
  compact = false,
  className,
  ...props
}: BrandLogoProps) {
  return (
    <div
      role="img"
      aria-label="Equilíbrio Fisioterapia & Pilates"
      className={cn(
        'flex items-center gap-3',
        compact ? 'gap-2' : 'gap-4',
        className,
      )}
      {...props}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 72 72"
        className={cn(compact ? 'size-12' : 'size-16', 'shrink-0')}
        fill="none"
      >
        <circle
          cx="36"
          cy="36"
          r="29"
          stroke={inverse ? '#31e86c' : '#16c95e'}
          strokeWidth="4"
        />
        <circle cx="36" cy="23" r="6" fill={inverse ? '#31e86c' : '#16c95e'} />
        <path
          d="M35.8 31c-7.9 0-13.7 4.7-17.1 11.9 5.5-1.1 10.4 1.1 14.2 6.4 1.3-5.7 1.6-11.2 2.9-18.3Z"
          fill={inverse ? '#31e86c' : '#16c95e'}
        />
        <path
          d="M36.2 31c7.9 0 13.7 4.7 17.1 11.9-5.5-1.1-10.4 1.1-14.2 6.4-1.3-5.7-1.6-11.2-2.9-18.3Z"
          fill={inverse ? '#31e86c' : '#16c95e'}
        />
        <path
          d="M36 31v25"
          stroke={inverse ? '#31e86c' : '#16c95e'}
          strokeLinecap="round"
          strokeWidth="3"
        />
      </svg>
      <span className="leading-none">
        <span
          className={cn(
            'block font-semibold tracking-[-0.06em]',
            compact ? 'text-3xl' : 'text-4xl',
            inverse ? 'text-white' : 'text-[#064d3d]',
          )}
        >
          Equilíbrio
        </span>
        <span
          className={cn(
            'mt-1 block font-medium',
            compact ? 'text-sm' : 'text-base',
            inverse ? 'text-white' : 'text-[#064d3d]',
          )}
        >
          Fisioterapia &amp; Pilates
        </span>
      </span>
    </div>
  )
}
