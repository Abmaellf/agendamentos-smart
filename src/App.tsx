import { ThemeProvider } from 'styled-components'
import { defaultTheme } from './styles/themes/default'
import { Router } from './Router'
import { Toaster } from 'sonner'

import { BrowserRouter } from 'react-router-dom'
import './globals.css';
// import { GlobalStyle } from './styles/global'
import { PatientProvider } from './context/PatientContext'
import { Helmet, HelmetProvider } from 'react-helmet-async'
// import { GlobalContextProvider } from './context/useGlobalContext'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/react-query'
import { CookiesProvider } from 'react-cookie'
// import { ThemeProvider } from './components/theme/theme-provider';

export function App() {
  return (
    <ThemeProvider theme={defaultTheme} >
        {/* // <ThemeProvider defaultTheme="dark" storageKey="agendamentos"> */}
        <CookiesProvider>
        <PatientProvider>
        <BrowserRouter>
          <HelmetProvider>
            <Helmet titleTemplate="%s | Fisioterapia e Pilates" />
            <Toaster richColors />
             {/* <GlobalContextProvider> */}
              <QueryClientProvider client={queryClient}>
                <Router />
              </QueryClientProvider>
             {/* </GlobalContextProvider> */}
          </HelmetProvider>
        </BrowserRouter>
      </PatientProvider>
      </CookiesProvider>
      {/* <GlobalStyle /> */}
      {/* </ThemeProvider> */}
     </ThemeProvider>
  )
}
