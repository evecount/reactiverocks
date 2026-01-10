"use client";

import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Game', href: '/' },
  { name: 'Leaderboard', href: '/leaderboard' },
  { name: 'About', href: '/about' },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 z-50 w-full bg-background/60 backdrop-blur-sm neon-glow border-none">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex items-baseline">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Gamepad2 className="h-6 w-6 text-primary" />
            <span className="font-headline text-lg sm:text-xl font-bold text-shadow-[0_0_10px_hsl(var(--primary))]">
              REACTIVE ROCKS
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'transition-colors hover:text-foreground/80',
                  pathname === item.href ? 'text-foreground' : 'text-foreground/60'
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex-1 flex justify-center items-center">
          <div className='digital-font text-2xl flex items-center gap-4 text-secondary'>
            <span className='text-primary'>YOU</span>
            <span className='text-4xl'>VS</span>
            <span className='text-accent'>AI</span>
          </div>
        </div>
        {/* Mobile menu could go here */}
      </div>
    </header>
  );
}
