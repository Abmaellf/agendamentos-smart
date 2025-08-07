import { ThemeProvider } from 'styled-components'
import { defaultTheme } from './styles/themes/default'
import { Router } from './Router'
import { Toaster } from 'sonner'

import { BrowserRouter } from 'react-router-dom'
import './globals.css';
// import { GlobalStyle } from './styles/global'
import { SchedulingProvider } from './context/SchedulingContext'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { GlobalContextProvider } from './context/useGlobalContext'
// import { ThemeProvider } from './components/theme/theme-provider';

export function App() {
  return (
    <ThemeProvider theme={defaultTheme} >
        {/* // <ThemeProvider defaultTheme="dark" storageKey="agendamentos"> */}
        <SchedulingProvider>
        <BrowserRouter>
          <HelmetProvider>
            <Helmet titleTemplate="%s | Fisioterapia e Pilates" />
            <Toaster richColors />
             <GlobalContextProvider>
              <Router />
             </GlobalContextProvider>
          </HelmetProvider>
        </BrowserRouter>
      </SchedulingProvider>
      {/* <GlobalStyle /> */}
      {/* </ThemeProvider> */}
     </ThemeProvider>
  )
}
