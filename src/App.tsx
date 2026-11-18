import { CookiesProvider } from 'react-cookie'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'

import { store } from './lib/store'
import { Router } from './Router'

import './globals.css'

export function App() {
  return (
    <CookiesProvider>
      <BrowserRouter>
        <HelmetProvider>
          <Helmet titleTemplate="%s | Fisioterapia e Pilates" />
          <Toaster richColors />
          <Provider store={store}>
            <Router />
          </Provider>
        </HelmetProvider>
      </BrowserRouter>
    </CookiesProvider>
  )
}
