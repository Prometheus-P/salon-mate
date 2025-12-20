'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Define a basic Material UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#111827', // Use ink color from the logo
    },
    secondary: {
      main: '#fecaca', // Use blush color from the logo
    },
    background: {
      default: '#f3f4f6', // A light gray for background
      paper: '#FFFFFF', // White for cards/paper
    },
  },
  typography: {
    fontFamily: ['Outfit', 'sans-serif'].join(','), // Use Outfit as primary font
  },
});

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
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

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
