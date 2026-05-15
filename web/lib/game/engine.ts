import { LEVELS, TIER_SCORE } from './levels';
import type {
  Brick,
  BrickTier,
  GamePhase,
  GameSnapshot,
  LevelConfig,
  Particle,
} from './types';

const BASE_SPEED = 320;
const PADDLE_H_RATIO = 0.028;
const BALL_R_RATIO = 0.012;
const PADDLE_W_RATIO = 0.2;
const BRICK_TOP_RATIO = 0.12;
const PADDLE_Y_RATIO = 0.88;

export class BreakoutEngine {
  width = 400;
  height = 700;
  phase: GamePhase = 'ready';
  levelIndex = 0;
  score = 0;
  lives = 3;
  combo = 1;
  paddleX = 200;
  paddleW = 80;
  ballX = 200;
  ballY = 600;
  ballR = 8;
  ballVx = 0;
  ballVy = 0;
  ballDocked = true;
  bricks: Brick[] = [];
  particles: Particle[] = [];
  flash = 0;
  glitch = 0;
  targetPaddleX = 200;
  lifeLostTimer = 0;
  levelCompleteTimer = 0;
  private speedMul = 1;

  resize(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.paddleW = w * PADDLE_W_RATIO;
    this.ballR = w * BALL_R_RATIO;
    this.paddleX = w / 2;
    this.targetPaddleX = this.paddleX;
    if (this.ballDocked) this.resetBallOnPaddle();
    else this.clampBall();
  }

  loadLevel(index: number) {
    const cfg = LEVELS[Math.min(index, LEVELS.length - 1)];
    this.levelIndex = index;
    this.speedMul = cfg.speedMul;
    this.bricks = buildBricks(cfg, this.width, this.height);
    this.ballDocked = true;
    this.resetBallOnPaddle();
    this.phase = 'ready';
    this.combo = 1;
    this.lifeLostTimer = 0;
    this.levelCompleteTimer = 0;
  }

  restart() {
    this.score = 0;
    this.lives = 3;
    this.loadLevel(0);
  }

  handlePointer(clientX: number, canvasLeft: number) {
    const x = clientX - canvasLeft;
    this.targetPaddleX = clamp(
      x,
      this.paddleW / 2,
      this.width - this.paddleW / 2,
    );
    if (this.ballDocked && (this.phase === 'ready' || this.phase === 'playing')) {
      this.launch();
    }
  }

  launch() {
    if (!this.ballDocked) return;
    this.ballDocked = false;
    this.phase = 'playing';
    const hit = (this.ballX - this.paddleX) / (this.paddleW / 2);
    const angle = clamp(hit, -1, 1) * (Math.PI / 3);
    const speed = BASE_SPEED * this.speedMul;
    this.ballVx = Math.sin(angle) * speed;
    this.ballVy = -Math.cos(angle) * speed;
  }

  advanceLevel() {
    if (this.levelIndex >= LEVELS.length - 1) {
      this.loadLevel(0);
      this.score += 500;
      return;
    }
    this.loadLevel(this.levelIndex + 1);
    this.phase = 'ready';
  }

  dismissOverlay() {
    if (this.phase === 'levelComplete') {
      this.advanceLevel();
    } else if (this.phase === 'gameOver') {
      this.restart();
    } else if (this.phase === 'lifeLost' && this.lifeLostTimer <= 0) {
      this.phase = 'ready';
    }
  }

  tick(dt: number) {
    this.paddleX += (this.targetPaddleX - this.paddleX) * Math.min(1, dt * 12);

    if (this.flash > 0) this.flash -= dt;
    if (this.glitch > 0) this.glitch -= dt;

    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    if (this.phase === 'levelComplete') {
      this.levelCompleteTimer -= dt;
      return;
    }

    if (this.phase === 'lifeLost') {
      this.lifeLostTimer -= dt;
      if (this.lifeLostTimer <= 0) {
        this.phase = 'ready';
        this.ballDocked = true;
        this.resetBallOnPaddle();
      }
      return;
    }

    if (this.phase !== 'playing' || this.ballDocked) {
      if (this.ballDocked) this.resetBallOnPaddle();
      return;
    }

    this.ballX += this.ballVx * dt;
    this.ballY += this.ballVy * dt;

    if (this.ballX - this.ballR < 0) {
      this.ballX = this.ballR;
      this.ballVx = Math.abs(this.ballVx);
    }
    if (this.ballX + this.ballR > this.width) {
      this.ballX = this.width - this.ballR;
      this.ballVx = -Math.abs(this.ballVx);
    }
    if (this.ballY - this.ballR < 0) {
      this.ballY = this.ballR;
      this.ballVy = Math.abs(this.ballVy);
    }

    const paddleY = this.height * PADDLE_Y_RATIO;
    const paddleH = this.height * PADDLE_H_RATIO;
    if (
      this.ballVy > 0 &&
      circleRect(
        this.ballX,
        this.ballY,
        this.ballR,
        this.paddleX - this.paddleW / 2,
        paddleY,
        this.paddleW,
        paddleH,
      )
    ) {
      this.ballY = paddleY - this.ballR;
      const hit = (this.ballX - this.paddleX) / (this.paddleW / 2);
      const angle = clamp(hit, -1, 1) * (Math.PI / 2.8);
      const speed = Math.hypot(this.ballVx, this.ballVy) * 1.02;
      const capped = Math.min(speed, BASE_SPEED * this.speedMul * 1.35);
      this.ballVx = Math.sin(angle) * capped;
      this.ballVy = -Math.abs(Math.cos(angle) * capped);
    }

    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      if (
        circleRect(
          this.ballX,
          this.ballY,
          this.ballR,
          brick.x,
          brick.y,
          brick.w,
          brick.h,
        )
      ) {
        const overlapL = this.ballX + this.ballR - brick.x;
        const overlapR = brick.x + brick.w - (this.ballX - this.ballR);
        const overlapT = this.ballY + this.ballR - brick.y;
        const overlapB = brick.y + brick.h - (this.ballY - this.ballR);
        const minX = Math.min(overlapL, overlapR);
        const minY = Math.min(overlapT, overlapB);
        if (minX < minY) this.ballVx *= -1;
        else this.ballVy *= -1;

        brick.hp -= 1;
        if (brick.hp <= 0) {
          brick.alive = false;
          this.combo = Math.min(2, this.combo + 0.1);
          this.score += Math.floor(TIER_SCORE[brick.tier] * this.combo);
          spawnParticles(this.particles, brick, brick.tier);
        } else {
          this.score += 2;
        }
        break;
      }
    }

    if (this.ballY - this.ballR > this.height) {
      this.lives -= 1;
      this.combo = 1;
      this.flash = 0.25;
      if (this.lives <= 0) {
        this.phase = 'gameOver';
      } else {
        this.phase = 'lifeLost';
        this.lifeLostTimer = 1.2;
        this.ballDocked = true;
        this.resetBallOnPaddle();
      }
      return;
    }

    if (this.bricks.every((b) => !b.alive)) {
      this.phase = 'levelComplete';
      this.levelCompleteTimer = 0.3;
      this.glitch = 0.15;
      this.score += 100;
    }
  }

  getSnapshot(): GameSnapshot {
    const cfg = LEVELS[this.levelIndex];
    return {
      phase: this.phase,
      levelIndex: this.levelIndex,
      levelName: cfg.name,
      score: this.score,
      lives: this.lives,
      combo: this.combo,
      width: this.width,
      height: this.height,
      paddleX: this.paddleX,
      paddleW: this.paddleW,
      ballX: this.ballX,
      ballY: this.ballY,
      ballR: this.ballR,
      ballDocked: this.ballDocked,
      bricks: this.bricks,
      particles: this.particles,
      flash: this.flash,
      glitch: this.glitch,
    };
  }

  private resetBallOnPaddle() {
    const paddleY = this.height * PADDLE_Y_RATIO;
    this.ballX = this.paddleX;
    this.ballY = paddleY - this.ballR - 2;
    this.ballVx = 0;
    this.ballVy = 0;
  }

  private clampBall() {
    this.ballX = clamp(this.ballX, this.ballR, this.width - this.ballR);
    this.ballY = clamp(this.ballY, this.ballR, this.height - this.ballR);
  }
}

function buildBricks(cfg: LevelConfig, w: number, h: number): Brick[] {
  const bricks: Brick[] = [];
  const padX = w * 0.06;
  const padY = h * BRICK_TOP_RATIO;
  const usableW = w - padX * 2;
  const brickW = usableW / cfg.cols - 4;
  const brickH = brickW * 0.42;

  for (let row = 0; row < cfg.rows; row++) {
    for (let col = 0; col < cfg.cols; col++) {
      const tier = cfg.layout[row]?.[col] ?? 0;
      if (tier === 0) continue;
      const t = tier as BrickTier;
      bricks.push({
        x: padX + col * (brickW + 4),
        y: padY + row * (brickH + 4),
        w: brickW,
        h: brickH,
        hp: tier,
        maxHp: tier,
        tier: t,
        alive: true,
      });
    }
  }
  return bricks;
}

function spawnParticles(out: Particle[], brick: Brick, tier: number) {
  const colors = ['#00f5ff', '#ff00aa', '#b8ff00', '#7b2fff'];
  const color = colors[(tier - 1) % colors.length];
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 80 + Math.random() * 160;
    out.push({
      x: brick.x + brick.w / 2,
      y: brick.y + brick.h / 2,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 0.4 + Math.random() * 0.35,
      color,
    });
  }
}

function circleRect(
  cx: number,
  cy: number,
  r: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
): boolean {
  const closestX = clamp(cx, rx, rx + rw);
  const closestY = clamp(cy, ry, ry + rh);
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < r * r;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
