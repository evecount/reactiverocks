"use client";

import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Header() {
  return (
    <header className="fixed top-0 z-50 w-full bg-background/60 backdrop-blur-sm neon-glow border-none">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <div className="flex-1 flex justify-start">
            {/* Placeholder for left-aligned content if needed */}
        </div>
        <div className="flex flex-col items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className={cn(
              "font-headline text-3xl sm:text-4xl font-bold animated-gradient-text",
              "text-shadow-[0_0_10px_hsl(var(--primary))]"
            )}>
              REACTIVE <Gamepad2 className="h-8 w-8 text-primary inline-block" /> ROCKS
            </span>
          </Link>
        </div>
        <div className="flex-1 flex justify-end items-center">
            {/* "YOU vs AI" text removed as per request */}
        </div>
      </div>
    </header>
  );
}
