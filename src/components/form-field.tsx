import { cloneElement, type ReactElement } from 'react'

import { cn } from '@/lib/utils'

export interface FormFieldProps {
  label: string
  error?: string
  className?: string
  labelClassName?: string
  children: ReactElement<{
    id?: string
    'aria-describedby'?: string
  }>
}

function fieldId(label: string) {
  return label.toLowerCase().replace(/\W+/g, '-') || 'field'
}

export function FormField({
  label,
  error,
  className,
  labelClassName,
  children,
}: FormFieldProps) {
  const id = children.props.id ?? fieldId(label)
  const errorId = `${id}-error`
  const describedBy = [children.props['aria-describedby'], error && errorId]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cn('grid gap-1', className)}>
      <label
        htmlFor={id}
        className={cn('text-sm font-medium', labelClassName)}
      >
        {label}
      </label>
      {cloneElement(children, {
        id,
        'aria-describedby': describedBy || undefined,
      })}
      {error ? (
        <p id={errorId} className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}
