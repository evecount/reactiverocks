"use client";

import dynamic from 'next/dynamic';
import { Loader } from 'lucide-react';

const GameUI = dynamic(() => import('@/components/game-ui'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 w-full h-full bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader className="w-16 h-16 animate-spin text-primary"/>
        <p className="text-primary font-headline">Loading Reactive Interface...</p>
      </div>
    </div>
  ),
});

export default function GameClientLoader() {
  return <GameUI />;
}
