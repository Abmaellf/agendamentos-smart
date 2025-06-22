import { ThemeProvider } from "styled-components";
import { defaultTheme } from "./styles/themes/default";
import { Router } from "./Router";
import { BrowserRouter } from "react-router-dom";
import { GlobalStyle } from "./styles/global";
import { SchedulingProvider } from "./context/SchedulingContext";

export function App() {

  return(
    <ThemeProvider theme={defaultTheme}>
    <SchedulingProvider>
       <BrowserRouter>
        <Router />
      </BrowserRouter>
    </SchedulingProvider>
     <GlobalStyle />
    </ThemeProvider>
  )
}
