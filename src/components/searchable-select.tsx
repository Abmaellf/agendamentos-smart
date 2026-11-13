import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Input } from './ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover'

export interface SearchableSelectOption {
  id: string
  label: string
}

export interface SearchableSelectProps {
  options: readonly SearchableSelectOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  noResultsLabel?: string
  emptyLabel?: string
  loading?: boolean
  loadingLabel?: string
  disabled?: boolean
  className?: string
  id?: string
  'aria-describedby'?: string
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim()
}

export const SearchableSelect = forwardRef<
  HTMLButtonElement,
  SearchableSelectProps
>(function SearchableSelect(
  {
    options,
    value,
    onValueChange,
    placeholder = 'Selecione',
    searchPlaceholder = 'Buscar opção',
    noResultsLabel = 'Nenhuma opção encontrada.',
    emptyLabel = 'Nenhuma opção disponível.',
    loading = false,
    loadingLabel = 'Carregando opções...',
    disabled = false,
    className,
    id,
    'aria-describedby': ariaDescribedBy,
  },
  forwardedRef,
) {
  const generatedId = useId()
  const triggerId = id ?? `searchable-select-${generatedId.replace(/:/g, '')}`
  const listboxId = `${triggerId}-listbox`
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const selectedOption = options.find((option) => option.id === value)
  const filteredOptions = useMemo(() => {
    const query = normalize(search)
    if (!query) return options

    return options.filter((option) => normalize(option.label).includes(query))
  }, [options, search])

  const selectedIndex = Math.max(
    options.findIndex((option) => option.id === value),
    0,
  )

  useEffect(() => {
    if (!open) {
      setSearch('')
      return
    }

    setActiveIndex(selectedIndex)
  }, [open, selectedIndex])

  function close() {
    setOpen(false)
    setSearch('')
  }

  function selectOption(option: SearchableSelectOption) {
    onValueChange(option.id)
    close()
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setOpen(true)
    }
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) =>
        filteredOptions.length === 0
          ? 0
          : Math.min(current + 1, filteredOptions.length - 1),
      )
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => Math.max(current - 1, 0))
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const option = filteredOptions[activeIndex]
      if (option) selectOption(option)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      close()
    }
  }

  const activeOption = filteredOptions[activeIndex]

  return (
    <Popover open={open} onOpenChange={(nextOpen) => (nextOpen ? setOpen(true) : close())}>
      <PopoverTrigger asChild>
        <button
          ref={forwardedRef}
          id={triggerId}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          aria-describedby={ariaDescribedBy}
          aria-activedescendant={
            open && activeOption ? `${listboxId}-option-${activeIndex}` : undefined
          }
          disabled={disabled}
          onKeyDown={handleTriggerKeyDown}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 text-left text-sm text-black disabled:bg-gray-100 disabled:text-gray-500',
            className,
          )}
        >
          <span className={cn(!selectedOption && 'text-gray-500')}>
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-56 p-2"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          searchInputRef.current?.focus()
        }}
      >
        <div className="relative">
          <Search
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          />
          <Input
            ref={searchInputRef}
            value={search}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-9 pl-9"
            onChange={(event) => {
              setSearch(event.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={handleSearchKeyDown}
          />
        </div>

        <div
          id={listboxId}
          role="listbox"
          aria-labelledby={triggerId}
          className="mt-2 max-h-56 overflow-y-auto"
        >
          {loading ? (
            <p role="status" className="px-2 py-3 text-sm text-gray-500">
              {loadingLabel}
            </p>
          ) : filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <button
                key={option.id || 'empty-option'}
                id={`${listboxId}-option-${index}`}
                type="button"
                role="option"
                aria-selected={option.id === value}
                className={cn(
                  'flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm outline-hidden',
                  index === activeIndex && 'bg-accent text-accent-foreground',
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectOption(option)}
              >
                <Check
                  aria-hidden="true"
                  className={cn(
                    'size-4 shrink-0',
                    option.id === value ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <span className="min-w-0 truncate">{option.label}</span>
              </button>
            ))
          ) : (
            <p className="px-2 py-3 text-sm text-gray-500">
              {search ? noResultsLabel : emptyLabel}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
})
