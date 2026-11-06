import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Provider } from 'react-redux'
import { Toaster } from 'sonner'
import type { PropsWithChildren, ReactElement } from 'react'

import { PatientProvider } from '@/context/PatientContext'
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
          <PatientProvider>
            <Provider store={store}>
              {children}
              <Toaster richColors />
            </Provider>
          </PatientProvider>
        </HelmetProvider>
      </MemoryRouter>
    )
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}
