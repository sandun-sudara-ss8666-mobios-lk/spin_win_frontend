import { createTheme, alpha } from '@mui/material/styles';

export const tokens = {
  background: '#000000',
  surface: '#181818',
  cardBg: '#111111',
  cardBackground: '#111111',
  primary: '#FF2600',
  primaryHover: '#E62300',
  heading: '#FFFFFF',
  body: '#E5E5E5',
  secondary: '#9999A1',
  border: '#383838',
  borderSubtle: '#222222',
  accentGlow: '#661A0D',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
  error: '#EF4444',
};

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: tokens.primary,
      dark: tokens.primaryHover,
      light: '#FF5C39',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: tokens.secondary,
      contrastText: '#FFFFFF',
    },
    background: {
      default: tokens.background,
      paper: tokens.surface,
    },
    text: {
      primary: tokens.body,
      secondary: tokens.secondary,
    },
    divider: tokens.border,
    success: {
      main: tokens.success,
    },
    warning: {
      main: tokens.warning,
    },
    info: {
      main: tokens.info,
    },
    error: {
      main: tokens.error,
    },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h1: {
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      fontWeight: 800,
      color: tokens.heading,
      letterSpacing: '-0.03em',
    },
    h2: {
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      fontWeight: 700,
      color: tokens.heading,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      fontWeight: 700,
      color: tokens.heading,
      letterSpacing: '-0.02em',
    },
    h4: {
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      fontWeight: 700,
      color: tokens.heading,
      letterSpacing: '-0.015em',
    },
    h5: {
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      fontWeight: 600,
      color: tokens.heading,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      fontWeight: 600,
      color: tokens.heading,
    },
    subtitle1: {
      color: tokens.secondary,
      fontWeight: 400,
    },
    subtitle2: {
      color: tokens.secondary,
      fontWeight: 500,
    },
    button: {
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: tokens.background,
          color: tokens.body,
          scrollbarWidth: 'thin',
          scrollbarColor: `${tokens.border} ${tokens.background}`,
          '&::-webkit-scrollbar': {
            width: 8,
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            background: tokens.background,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: tokens.border,
            borderRadius: 4,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.cardBg,
          backgroundImage: 'none',
          border: `1px solid ${tokens.border}`,
          borderRadius: 12,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.cardBg,
          backgroundImage: 'none',
          border: `1px solid ${tokens.border}`,
          borderRadius: 12,
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            borderColor: alpha(tokens.primary, 0.4),
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 18px',
          boxShadow: 'none',
          transition: 'all 0.18s ease-in-out',
          '&:hover': {
            boxShadow: `0 0 14px ${alpha(tokens.primary, 0.4)}`,
          },
        },
        containedPrimary: {
          backgroundColor: tokens.primary,
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: tokens.primaryHover,
          },
        },
        outlined: {
          borderColor: tokens.border,
          color: tokens.body,
          '&:hover': {
            borderColor: tokens.heading,
            backgroundColor: alpha('#FFFFFF', 0.04),
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: alpha('#FFFFFF', 0.02),
            borderRadius: 8,
            '& fieldset': {
              borderColor: tokens.border,
            },
            '&:hover fieldset': {
              borderColor: tokens.secondary,
            },
            '&.Mui-focused fieldset': {
              borderColor: tokens.primary,
              boxShadow: `0 0 0 2px ${alpha(tokens.primary, 0.2)}`,
            },
          },
          '& .MuiInputLabel-root': {
            color: tokens.secondary,
            '&.Mui-focused': {
              color: tokens.primary,
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.border}`,
          borderRadius: 16,
          boxShadow: `0 20px 40px rgba(0,0,0,0.8), 0 0 30px ${tokens.accentGlow}`,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${tokens.borderSubtle}`,
          padding: '12px 16px',
          color: tokens.body,
        },
        head: {
          color: tokens.secondary,
          fontWeight: 600,
          fontSize: '0.8125rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          backgroundColor: tokens.surface,
          borderBottom: `1px solid ${tokens.border}`,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },
  },
});
