import type { LevelConfig } from './types';

const L1: number[][] = [
  [1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1],
];

const L2: number[][] = [
  [1, 1, 2, 2, 1, 1, 1],
  [1, 2, 2, 2, 2, 1, 1],
  [2, 2, 1, 1, 2, 2, 2],
  [1, 2, 2, 2, 2, 1, 1],
  [1, 1, 2, 2, 1, 1, 1],
];

const L3: number[][] = [
  [2, 2, 2, 2, 2, 2, 2],
  [2, 0, 2, 2, 2, 0, 2],
  [2, 2, 3, 3, 3, 2, 2],
  [2, 0, 2, 2, 2, 0, 2],
  [2, 2, 2, 2, 2, 2, 2],
];

const L4: number[][] = [
  [3, 3, 3, 3, 3, 3, 3, 3],
  [3, 2, 2, 2, 2, 2, 2, 3],
  [3, 2, 1, 1, 1, 1, 2, 3],
  [3, 2, 1, 0, 0, 1, 2, 3],
  [3, 2, 1, 1, 1, 1, 2, 3],
  [3, 2, 2, 2, 2, 2, 2, 3],
];

const L5: number[][] = [
  [1, 2, 3, 3, 3, 2, 1],
  [2, 3, 2, 2, 2, 3, 2],
  [3, 2, 1, 0, 1, 2, 3],
  [2, 3, 2, 2, 2, 3, 2],
  [1, 2, 3, 3, 3, 2, 1],
  [2, 2, 2, 2, 2, 2, 2],
];

const L6: number[][] = [
  [3, 3, 0, 3, 3, 0, 3, 3],
  [3, 2, 2, 2, 2, 2, 2, 3],
  [0, 2, 1, 1, 1, 1, 2, 0],
  [3, 2, 1, 3, 3, 1, 2, 3],
  [3, 2, 1, 1, 1, 1, 2, 3],
  [3, 2, 2, 2, 2, 2, 2, 3],
];

const L7: number[][] = [
  [2, 2, 2, 3, 3, 2, 2, 2],
  [2, 3, 3, 3, 3, 3, 3, 2],
  [2, 3, 1, 2, 2, 1, 3, 2],
  [3, 3, 1, 0, 0, 1, 3, 3],
  [2, 3, 1, 2, 2, 1, 3, 2],
  [2, 3, 3, 3, 3, 3, 3, 2],
  [2, 2, 2, 3, 3, 2, 2, 2],
];

const L8: number[][] = [
  [3, 3, 3, 3, 3, 3, 3, 3, 3],
  [3, 2, 3, 2, 3, 2, 3, 2, 3],
  [3, 3, 2, 3, 2, 3, 2, 3, 3],
  [3, 2, 3, 1, 1, 1, 3, 2, 3],
  [3, 3, 2, 1, 0, 1, 2, 3, 3],
  [3, 2, 3, 1, 1, 1, 3, 2, 3],
  [3, 3, 2, 3, 2, 3, 2, 3, 3],
  [3, 2, 3, 2, 3, 2, 3, 2, 3],
];

export const LEVELS: LevelConfig[] = [
  { name: 'Grid Alpha', cols: 6, rows: 4, layout: L1, speedMul: 1.0 },
  { name: 'Pulse Ring', cols: 7, rows: 5, layout: L2, speedMul: 1.08 },
  { name: 'Void Gate', cols: 7, rows: 5, layout: L3, speedMul: 1.16 },
  { name: 'Core Fortress', cols: 8, rows: 6, layout: L4, speedMul: 1.24 },
  { name: 'Neon Crown', cols: 7, rows: 6, layout: L5, speedMul: 1.32 },
  { name: 'Shard Matrix', cols: 8, rows: 6, layout: L6, speedMul: 1.4 },
  { name: 'Hyper Lattice', cols: 8, rows: 7, layout: L7, speedMul: 1.48 },
  { name: 'Omega Grid', cols: 9, rows: 8, layout: L8, speedMul: 1.56 },
];

export const TIER_COLORS: Record<number, string> = {
  1: '#00f5ff',
  2: '#ff00aa',
  3: '#b8ff00',
};

export const TIER_SCORE: Record<number, number> = {
  1: 10,
  2: 20,
  3: 30,
};
