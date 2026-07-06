import type { Metadata } from 'next';
import { Caveat, Patrick_Hand, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from '@/components/header';
import { defaultLocale, type Locale } from '@/lib/i18n';

const caveat = Caveat({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const patrickHand = Patrick_Hand({
  variable: '--font-handwritten',
  subsets: ['latin'],
  weight: '400',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-data',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Alpha Gold Signals',
  description: 'AI-powered gold trading signals with SMC, Wyckoff & Multi-Timeframe analysis',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale: Locale = defaultLocale;

  return (
    <html
      lang={locale}
      className={`${caveat.variable} ${patrickHand.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#D4A843" />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider defaultTheme="light" storageKey="alpha-gold-theme">
          <Header locale={locale} />
          <main className="flex-1">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
