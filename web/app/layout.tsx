import type { Metadata } from 'next';
import { Orbitron, Rajdhani } from 'next/font/google';
import { Providers } from '@/components/Providers';
import './globals.css';

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '700', '900'],
});

const rajdhani = Rajdhani({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
});

const baseAppId =
  process.env.NEXT_PUBLIC_BASE_APP_ID ?? '6a06c69b036192ebadae2851';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://breakout-tau-black.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Neon Breakout',
  description:
    'Cyberpunk Breakout on Base — swipe controls, neon bricks, daily on-chain sync.',
  icons: { icon: '/app-icon.jpg', apple: '/app-icon.jpg' },
  openGraph: {
    title: 'Neon Breakout',
    images: [{ url: '/app-thumbnail.jpg', width: 1200, height: 628 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${rajdhani.variable} h-full antialiased`}
    >
      <head>
        <meta name="base:app_id" content={baseAppId} />
      </head>
      <body className="h-full overflow-hidden bg-[#050508] font-[family-name:var(--font-body)] text-white">
        <Providers>{children}</Providers>
        <div className="scanlines pointer-events-none fixed inset-0 z-[100]" aria-hidden />
      </body>
    </html>
  );
}
