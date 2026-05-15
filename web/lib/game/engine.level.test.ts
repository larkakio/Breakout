import assert from 'node:assert/strict';
import { BreakoutEngine } from './engine';

function testLevelProgression() {
  const engine = new BreakoutEngine();
  engine.resize(400, 700);
  engine.loadLevel(0);
  assert.equal(engine.levelIndex, 0);

  engine.phase = 'playing';
  engine.ballDocked = false;
  for (const brick of engine.bricks) {
    brick.alive = false;
  }
  engine.tick(1 / 60);
  assert.equal(engine.phase, 'levelComplete');

  engine.dismissOverlay();
  assert.equal(engine.levelIndex, 1);
  assert.equal(engine.phase, 'ready');
  assert(engine.bricks.length > 0);
  console.log('level progression: OK');
}

testLevelProgression();
