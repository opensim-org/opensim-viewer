import { createTheme, responsiveFontSizes } from '@mui/material'

const appTheme = createTheme({
    spacing: 15,
    palette: {
        mode: 'dark',
        primary: {
            main: '#E8F0FE',
        },
        secondary: {
            main: '#E8F0FE',
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                },
            },
        },
    },
})

export default responsiveFontSizes(appTheme)
