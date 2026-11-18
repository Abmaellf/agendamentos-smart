import { render, type RenderOptions } from '@testing-library/react'
import type { PropsWithChildren, ReactElement } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { Toaster } from 'sonner'

import { baseApi } from '@/lib/base-api'
import { createAppStore, type AppStore } from '@/lib/store'

const testStores = new Set<AppStore>()

interface TestRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string
  store?: AppStore
}

export function resetTestApiCache() {
  testStores.forEach((store) => {
    store.dispatch(baseApi.util.resetApiState())
  })
  testStores.clear()
}

export function createTestStore() {
  const store = createAppStore()
  testStores.add(store)
  return store
}

export function renderWithProviders(
  ui: ReactElement,
  options: TestRenderOptions = {},
) {
  const {
    route = '/appointments',
    store = createTestStore(),
    ...renderOptions
  } = options

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <HelmetProvider>
          <Provider store={store}>
            {children}
            <Toaster richColors />
          </Provider>
        </HelmetProvider>
      </MemoryRouter>
    )
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}
