import { fontFamily as _fontFamily } from 'tailwindcss/defaultTheme'

export const theme = {
    extend: {
        fontFamily: {
            sans: ['InterVariable', ..._fontFamily.sans],
        },
    },
}