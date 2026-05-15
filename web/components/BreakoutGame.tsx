'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BreakoutEngine } from '@/lib/game/engine';
import { TIER_COLORS } from '@/lib/game/levels';
import type { GamePhase, GameSnapshot } from '@/lib/game/types';

type HudState = Pick<
  GameSnapshot,
  'score' | 'lives' | 'levelIndex' | 'levelName' | 'phase'
>;

export function BreakoutGame({
  onHudChange,
}: {
  onHudChange?: (hud: HudState) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BreakoutEngine | null>(null);
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);
  const rectRef = useRef<DOMRect | null>(null);
  const [hint, setHint] = useState('Swipe to move · tap to launch');
  const [overlay, setOverlay] = useState<{
    phase: GamePhase;
    levelIndex: number;
    lives: number;
  } | null>(null);

  const syncHud = useCallback(
    (snap: GameSnapshot) => {
      onHudChange?.({
        score: snap.score,
        lives: snap.lives,
        levelIndex: snap.levelIndex,
        levelName: snap.levelName,
        phase: snap.phase,
      });

      const show =
        snap.phase === 'levelComplete' ||
        snap.phase === 'gameOver' ||
        (snap.phase === 'lifeLost' && snap.lives > 0);

      setOverlay(
        show
          ? {
              phase: snap.phase,
              levelIndex: snap.levelIndex,
              lives: snap.lives,
            }
          : null,
      );
    },
    [onHudChange],
  );

  useEffect(() => {
    const engine = new BreakoutEngine();
    engineRef.current = engine;
    engine.loadLevel(0);
    syncHud(engine.getSnapshot());

    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (h < 1) return;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      engine.resize(w, h);
      rectRef.current = canvas.getBoundingClientRect();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    const loop = (t: number) => {
      if (!lastRef.current) lastRef.current = t;
      const dt = Math.min((t - lastRef.current) / 1000, 0.032);
      lastRef.current = t;
      engine.tick(dt);
      const snap = engine.getSnapshot();
      syncHud(snap);
      draw(canvas, snap, t / 1000);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    const onVis = () => {
      lastRef.current = 0;
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [syncHud]);

  const pointerX = (clientX: number) => {
    const rect = rectRef.current ?? canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    rectRef.current = rect;
    engineRef.current?.handlePointer(clientX, rect.left);
    setHint('');
  };

  const onOverlayTap = () => {
    engineRef.current?.dismissOverlay();
  };

  return (
    <GameShell
      canvasRef={canvasRef}
      hint={hint}
      overlay={overlay}
      onOverlayTap={onOverlayTap}
      onPointerX={pointerX}
    />
  );
}

function GameShell({
  canvasRef,
  hint,
  overlay,
  onOverlayTap,
  onPointerX,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  hint: string;
  overlay: { phase: GamePhase; levelIndex: number; lives: number } | null;
  onOverlayTap: () => void;
  onPointerX: (x: number) => void;
}) {
  return (
    <div className="game-shell relative flex h-full min-h-0 flex-1 flex-col">
      <canvas
        ref={canvasRef}
        className="game-canvas block h-full min-h-0 w-full flex-1 touch-none select-none"
        onTouchStart={(ev) => {
          ev.preventDefault();
          if (ev.touches[0]) onPointerX(ev.touches[0].clientX);
        }}
        onTouchMove={(ev) => {
          ev.preventDefault();
          if (ev.touches[0]) onPointerX(ev.touches[0].clientX);
        }}
        onMouseDown={(ev) => onPointerX(ev.clientX)}
        onMouseMove={(ev) => {
          if (ev.buttons === 1) onPointerX(ev.clientX);
        }}
      />
      <p className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-[10px] uppercase tracking-widest text-cyan-500/50">
        {hint}
      </p>
      {overlay && (
        <GameOverlay overlay={overlay} onTap={onOverlayTap} />
      )}
    </div>
  );
}

function GameOverlay({
  overlay,
  onTap,
}: {
  overlay: { phase: GamePhase; levelIndex: number; lives: number };
  onTap: () => void;
}) {
  let title = '';
  let sub = 'Tap to continue';
  if (overlay.phase === 'levelComplete') {
    const next = overlay.levelIndex + 2;
    title = 'Level Complete';
    sub =
      overlay.levelIndex >= 7
        ? 'Omega cleared! Tap to loop'
        : `Level ${next} — Tap to continue`;
  } else if (overlay.phase === 'gameOver') {
    title = 'Game Over';
    sub = 'Tap to restart';
  } else {
    title = 'Life Lost';
    sub = `${overlay.lives} lives left`;
  }

  return (
    <button
      type="button"
      className="overlay-tap absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[2px]"
      onClick={onTap}
    >
      <h3 className="font-display text-2xl text-cyan-300 drop-shadow-[0_0_12px_#00f5ff]">
        {title}
      </h3>
      <p className="mt-2 text-sm text-magenta-300">{sub}</p>
    </button>
  );
}

function draw(canvas: HTMLCanvasElement, snap: GameSnapshot, time: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width: w, height: h } = snap;
  const glitchX = snap.glitch > 0 ? (Math.random() - 0.5) * 6 : 0;

  ctx.save();
  ctx.translate(glitchX, 0);

  ctx.fillStyle = '#050508';
  ctx.fillRect(0, 0, w, h);

  drawGrid(ctx, w, h, time);

  for (const brick of snap.bricks) {
    if (!brick.alive) continue;
    const color = TIER_COLORS[brick.tier] ?? '#00f5ff';
    const pulse = 0.85 + Math.sin(time * 4 + brick.x) * 0.15;
    ctx.shadowBlur = 14;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.globalAlpha = pulse;
    roundRect(ctx, brick.x, brick.y, brick.w, brick.h, 4);
    ctx.fill();
    if (brick.hp < brick.maxHp) {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#fff';
      const inset = 3;
      roundRect(
        ctx,
        brick.x + inset,
        brick.y + inset,
        brick.w - inset * 2,
        (brick.h - inset * 2) * (brick.hp / brick.maxHp),
        2,
      );
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  for (const p of snap.particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  const paddleY = h * 0.88;
  const paddleH = h * 0.028;
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#7b2fff';
  const grad = ctx.createLinearGradient(
    snap.paddleX - snap.paddleW / 2,
    paddleY,
    snap.paddleX + snap.paddleW / 2,
    paddleY,
  );
  grad.addColorStop(0, '#7b2fff');
  grad.addColorStop(0.5, '#00f5ff');
  grad.addColorStop(1, '#ff00aa');
  ctx.fillStyle = grad;
  roundRect(
    ctx,
    snap.paddleX - snap.paddleW / 2,
    paddleY,
    snap.paddleW,
    paddleH,
    paddleH / 2,
  );
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.shadowBlur = 16;
  ctx.shadowColor = '#00f5ff';
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(snap.ballX, snap.ballY, snap.ballR, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  if (snap.flash > 0) {
    ctx.fillStyle = `rgba(255,0,170,${snap.flash * 0.35})`;
    ctx.fillRect(0, 0, w, h);
  }

  if (snap.ballDocked && snap.phase === 'ready') {
    ctx.font = '600 14px Rajdhani, sans-serif';
    ctx.fillStyle = `rgba(0,245,255,${0.6 + Math.sin(time * 3) * 0.2})`;
    ctx.textAlign = 'center';
    ctx.fillText('LAUNCH', snap.ballX, snap.ballY - snap.ballR - 12);
  }

  ctx.restore();
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
) {
  const offset = (time * 24) % 40;
  ctx.strokeStyle = 'rgba(26,26,46,0.9)';
  ctx.lineWidth = 1;
  for (let x = -offset; x < w; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = -offset; y < h; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  const horizon = h * 0.55;
  const hg = ctx.createLinearGradient(0, horizon, 0, h);
  hg.addColorStop(0, 'rgba(123,47,255,0.08)');
  hg.addColorStop(1, 'rgba(0,245,255,0.04)');
  ctx.fillStyle = hg;
  ctx.fillRect(0, horizon, w, h - horizon);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
