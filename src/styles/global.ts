import { createGlobalStyle } from 'styled-components'
import 'tailwindcss';


export const GlobalStyle = createGlobalStyle`
    *{
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    body {
        background: #333;
        /* color: #fff;
        font-family: Roboto; */
    }
`
