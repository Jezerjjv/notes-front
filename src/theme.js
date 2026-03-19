import { createTheme } from '@mui/material/styles';

const baseTypography = {
  fontFamily: '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  h1: { fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.15 },
  h2: { fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.18 },
  h3: { fontWeight: 600, letterSpacing: '0', lineHeight: 1.2 },
  h4: { fontWeight: 600, letterSpacing: '0', lineHeight: 1.22 },
  h5: { fontWeight: 600, letterSpacing: '0', lineHeight: 1.24 },
  h6: { fontWeight: 600, letterSpacing: '0', lineHeight: 1.26 },
  button: { fontWeight: 600, letterSpacing: '0', textTransform: 'none' },
};

const baseComponents = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 10,
        boxShadow: 'none',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
    },
  },
  MuiAccordion: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
    },
  },
};

const palette = {
  mode: 'dark',
  background: { default: '#0d1117', paper: '#161b22' },
  primary: { main: '#2f81f7', dark: '#1f6feb', light: '#58a6ff', contrastText: '#f0f6fc' },
  secondary: { main: '#8b949e', dark: '#6e7681', light: '#b1bac4', contrastText: '#f0f6fc' },
  success: { main: '#238636', dark: '#1f6f2e', light: '#2ea043', contrastText: '#f0f6fc' },
  error: { main: '#da3633', dark: '#b62324', light: '#f85149', contrastText: '#f0f6fc' },
  text: { primary: '#c9d1d9', secondary: '#8b949e' },
  divider: '#30363d',
  action: {
    hover: 'rgba(177, 186, 196, 0.12)',
    selected: 'rgba(177, 186, 196, 0.16)',
  },
};

export const createAppTheme = () => {
  return createTheme({
    typography: baseTypography,
    palette,
    components: {
      ...baseComponents,
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundColor: palette.background.default },
          html: { backgroundColor: palette.background.default },
        },
      },
    },
  });
};

const theme = createAppTheme();
export default theme;