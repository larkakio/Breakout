export type GamePhase =
  | 'ready'
  | 'playing'
  | 'levelComplete'
  | 'lifeLost'
  | 'gameOver';

export type BrickTier = 1 | 2 | 3;

export interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  tier: BrickTier;
  alive: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface LevelConfig {
  name: string;
  cols: number;
  rows: number;
  /** 0 = empty, 1-3 = brick tier */
  layout: number[][];
  speedMul: number;
}

export interface GameSnapshot {
  phase: GamePhase;
  levelIndex: number;
  levelName: string;
  score: number;
  lives: number;
  combo: number;
  width: number;
  height: number;
  paddleX: number;
  paddleW: number;
  ballX: number;
  ballY: number;
  ballR: number;
  ballDocked: boolean;
  bricks: Brick[];
  particles: Particle[];
  flash: number;
  glitch: number;
}
