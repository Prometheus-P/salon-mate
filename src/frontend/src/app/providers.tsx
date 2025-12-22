'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import useMediaQuery from '@mui/material/useMediaQuery';

const LIGHT_THEME = {
  palette: {
    mode: 'light' as const,
    primary: {
      main: '#111827',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FFCCCC',
      contrastText: '#111827',
    },
    error: {
      main: '#D8402B',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#2D8A4B',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#B58103',
      contrastText: '#1C1B1F',
    },
    info: {
      main: '#3F72C8',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F6FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
    },
  },
};

const DARK_THEME = {
  palette: {
    mode: 'dark' as const,
    primary: {
      main: '#F9FAFB',
      contrastText: '#111827',
    },
    secondary: {
      main: '#F7A9B8',
      contrastText: '#111827',
    },
    error: {
      main: '#FF8A7A',
      contrastText: '#3A0F0A',
    },
    success: {
      main: '#7DE09C',
      contrastText: '#0F2615',
    },
    warning: {
      main: '#FFD77A',
      contrastText: '#2A1A00',
    },
    info: {
      main: '#8DB6FF',
      contrastText: '#0C1A2F',
    },
    background: {
      default: '#0F172A',
      paper: '#111827',
    },
    text: {
      primary: '#F3F4F6',
      secondary: '#CBD5F5',
    },
  },
};

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)', {
    defaultMatches: false,
    noSsr: true,
  });

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1분
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: prefersDarkMode ? DARK_THEME.palette : LIGHT_THEME.palette,
        typography: {
          fontFamily: [
            'var(--font-geist-sans)',
            'Outfit',
            'Inter',
            'sans-serif',
          ].join(','),
        },
        shape: {
          borderRadius: 16,
        },
      }),
    [prefersDarkMode]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
