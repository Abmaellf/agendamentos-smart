import { ThemeProvider } from 'styled-components'
import { defaultTheme } from './styles/themes/default'
import { Router } from './Router'

import { BrowserRouter } from 'react-router-dom'

import { GlobalStyle } from './styles/global'
import { SchedulingProvider } from './context/SchedulingContext'
import { Helmet, HelmetProvider } from 'react-helmet-async'

export function App() {
  return (
    <ThemeProvider theme={defaultTheme}>
      <SchedulingProvider>
        <BrowserRouter>
          <HelmetProvider>
            <Helmet titleTemplate="%s | Fisioterapia e Pilates" />
            <Router />
          </HelmetProvider>
        </BrowserRouter>
      </SchedulingProvider>
      <GlobalStyle />
    </ThemeProvider>
  )
}
