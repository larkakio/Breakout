'use client';

import { useState } from 'react';
import { BreakoutGame } from '@/components/BreakoutGame';
import { CheckInPanel } from '@/components/CheckInPanel';
import { WalletBar } from '@/components/WalletBar';
import type { GamePhase } from '@/lib/game/types';

export default function Home() {
  const [hud, setHud] = useState({
    score: 0,
    lives: 3,
    levelIndex: 0,
    levelName: 'Grid Alpha',
    phase: 'ready' as GamePhase,
  });

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-[#050508] text-white">
      <header className="safe-top flex shrink-0 items-center justify-between gap-2 border-b border-cyan-500/20 px-4 py-2">
        <div>
          <h1 className="font-display text-base font-bold tracking-wider text-cyan-300 neon-flicker sm:text-lg">
            NEON BREAKOUT
          </h1>
          <p className="text-[10px] uppercase tracking-[0.25em] text-violet-400/80">
            {hud.levelName}
          </p>
        </div>
        <div className="flex gap-3 text-right font-mono text-sm">
          <div>
            <p className="text-[10px] uppercase text-zinc-500">Level</p>
            <p className="text-lime-400">{hud.levelIndex + 1}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-zinc-500">Score</p>
            <p className="text-cyan-300">{hud.score}</p>
          </div>
          <LivesHud lives={hud.lives} />
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <BreakoutGame onHudChange={setHud} />
        <div className="app-dock shrink-0">
          <CheckInPanel />
          <WalletBar />
        </div>
      </main>
    </div>
  );
}

function LivesHud({ lives }: { lives: number }) {
  return (
    <div>
      <p className="text-[10px] uppercase text-zinc-500">Lives</p>
      <p className="text-magenta-400">{'♥'.repeat(Math.max(0, lives))}</p>
    </div>
  );
}
