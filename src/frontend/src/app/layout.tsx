import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { Providers } from './providers';
import Header from '../components/common/Header';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SalonMate - AI 마케팅 자동화',
  description: '뷰티/살롱 사장님을 위한 AI 마케팅 자동화 플랫폼',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppRouterCacheProvider>
          <Providers>
            <Header /> {/* Add the Header component here */}
            {children}
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
