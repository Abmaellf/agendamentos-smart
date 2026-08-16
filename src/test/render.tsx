import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'sonner'
import { ThemeProvider } from 'styled-components'
import type { PropsWithChildren, ReactElement } from 'react'

import { defaultTheme } from '@/styles/themes/default'
import { SchedulingProvider } from '@/context/SchedulingContext'

interface TestRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string
  queryClient?: QueryClient
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  })
}

export function renderWithProviders(
  ui: ReactElement,
  options: TestRenderOptions = {},
) {
  const {
    route = '/agendamento',
    queryClient = createTestQueryClient(),
    ...renderOptions
  } = options

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <ThemeProvider theme={defaultTheme}>
        <MemoryRouter initialEntries={[route]}>
          <HelmetProvider>
            <SchedulingProvider>
              <QueryClientProvider client={queryClient}>
                {children}
                <Toaster richColors />
              </QueryClientProvider>
            </SchedulingProvider>
          </HelmetProvider>
        </MemoryRouter>
      </ThemeProvider>
    )
  }

  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}
