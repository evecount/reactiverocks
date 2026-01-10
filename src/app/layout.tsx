import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import Header from '@/components/header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Shield, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'REACTIVE ROCKS',
  description: 'A human and an AI playing rock paper scissors, showing off reactive capabilities.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;600&family=Space+Grotesk:wght@400;500;700&family=Press+Start+2P&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background">
        <Header />
        <main>{children}</main>
        <Toaster />
        <footer className="fixed bottom-0 w-full p-2 flex justify-center items-center gap-4 text-xs text-foreground/50">
            <Link href="/about" className="hover:text-primary transition-colors">About</Link>
            <Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-use" className="hover:text-primary transition-colors">Terms of Use</Link>
        </footer>
      </body>
    </html>
  );
}
