import type { Metadata, Viewport } from 'next';
import { DM_Sans, Fraunces, Caveat } from 'next/font/google';
import './globals.css';
import PwaRegistrar from '@/components/PwaRegistrar';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Catata. — Your Pocket. Your Space.',
  description:
    'Buku saku digital offline-first untuk catatan harian, agenda mingguan, dan arsip ide pribadi.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Catata.',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF7EF' },
    { media: '(prefers-color-scheme: dark)', color: '#22201D' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${dmSans.variable} ${fraunces.variable} ${caveat.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased selection:bg-[#B87561]/25">
        <PwaRegistrar />
        {children}
      </body>
    </html>
  );
}