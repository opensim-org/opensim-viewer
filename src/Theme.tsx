import { createTheme, responsiveFontSizes } from "@mui/material";

const appTheme = createTheme({
    spacing: 15,
    palette: {
      mode: "dark",
        primary: {
            main: "#E8F0FE"
        },
        secondary: {
          main: '#2C579E'
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

export default responsiveFontSizes(appTheme);
