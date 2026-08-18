import { QueryClientProvider } from '@tanstack/react-query'
import { CookiesProvider } from 'react-cookie'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'

import { PatientProvider } from './context/PatientContext'
import { queryClient } from './lib/react-query'
import { Router } from './Router'

import './globals.css'

export function App() {
  return (
    <CookiesProvider>
      <PatientProvider>
        <BrowserRouter>
          <HelmetProvider>
            <Helmet titleTemplate="%s | Fisioterapia e Pilates" />
            <Toaster richColors />
            <QueryClientProvider client={queryClient}>
              <Router />
            </QueryClientProvider>
          </HelmetProvider>
        </BrowserRouter>
      </PatientProvider>
    </CookiesProvider>
  )
}
