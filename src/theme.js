import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#181c23',
      paper: '#232a36',
    },
    primary: {
      main: '#5ca0fa',
      dark: '#388be0',
      light: '#7ec3ff',
      contrastText: '#fff'
    },
    text: {
      primary: '#fff',
      secondary: '#b0b8c1'
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#181c23',
        },
        html: {
          backgroundColor: '#181c23',
        }
      }
    }
  }
});

export default theme; 