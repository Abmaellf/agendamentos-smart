import type { VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import type { Button, buttonVariants } from '@/components/ui/button'

export type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

export type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ComponentProps<typeof Button>, 'size'> &
  ComponentProps<'a'>
