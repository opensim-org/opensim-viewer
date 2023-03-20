import { createTheme, responsiveFontSizes } from "@mui/material";

const lightTheme = createTheme({
    spacing: 15,
    palette: {
      mode: "light",
        primary: {
            main: "#2C579E"
        },
        secondary: {
          main: '#E8F0FE'
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                }
            }
        }
    }
  });

export default responsiveFontSizes(lightTheme);
