// NEON RETRO SNAKE — Cyber Grid Snake
import { sound } from '../audio.js';

export function launchSnake(container, onGameOver, onScoreUpdate) {
  let isRunning = true;
  let score = 0;

  const width = Math.max(340, Math.min(500, container.clientWidth || 480));
  const height = Math.max(340, Math.min(500, container.clientHeight || 480));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const GRID = 20;
  const COLS = Math.max(12, Math.floor(width / GRID));
  const ROWS = Math.max(12, Math.floor(height / GRID));

  let snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ];
  let dir = { x: 1, y: 0 };
  let nextDir = { x: 1, y: 0 };
  let food = { x: 15, y: 10, color: '#00ffcc' };

  function spawnFood() {
    food.x = Math.floor(Math.random() * COLS);
    food.y = Math.floor(Math.random() * ROWS);
  }

  const onKey = (e) => {
    if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && dir.x === 0) nextDir = { x: -1, y: 0 };
    if ((e.code === 'ArrowRight' || e.code === 'KeyD') && dir.x === 0) nextDir = { x: 1, y: 0 };
    if ((e.code === 'ArrowUp' || e.code === 'KeyW') && dir.y === 0) nextDir = { x: 0, y: -1 };
    if ((e.code === 'ArrowDown' || e.code === 'KeyS') && dir.y === 0) nextDir = { x: 0, y: 1 };
  };
  window.addEventListener('keydown', onKey);

  // Swipe support
  let tX = 0, tY = 0;
  canvas.addEventListener('touchstart', (e) => {
    tX = e.touches[0].clientX;
    tY = e.touches[0].clientY;
  }, { passive: true });
  canvas.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - tX;
    const dy = e.changedTouches[0].clientY - tY;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 20 && dir.x === 0) nextDir = { x: 1, y: 0 };
      else if (dx < -20 && dir.x === 0) nextDir = { x: -1, y: 0 };
    } else {
      if (dy > 20 && dir.y === 0) nextDir = { x: 0, y: 1 };
      else if (dy < -20 && dir.y === 0) nextDir = { x: 0, y: -1 };
    }
  }, { passive: true });

  let tickTimer = 0;

  function loop(t) {
    if (!isRunning) return;
    requestAnimationFrame(loop);

    tickTimer++;
    if (tickTimer >= 6) {
      tickTimer = 0;
      dir = nextDir;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

      // Wall collision (wrap or die — let's wrap!)
      if (head.x < 0) head.x = COLS - 1;
      if (head.x >= COLS) head.x = 0;
      if (head.y < 0) head.y = ROWS - 1;
      if (head.y >= ROWS) head.y = 0;

      // Self collision
      for (let s of snake) {
        if (s.x === head.x && s.y === head.y) {
          isRunning = false;
          sound.playGameOver();
          if (onGameOver) onGameOver(score);
          return;
        }
      }

      snake.unshift(head);

      // Eat food
      if (head.x === food.x && head.y === food.y) {
        score += 30;
        sound.playClick();
        if (onScoreUpdate) onScoreUpdate(score);
        spawnFood();
      } else {
        snake.pop();
      }
    }

    render();
  }

  function render() {
    ctx.fillStyle = '#0a0d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw food
    ctx.beginPath();
    ctx.arc(food.x * GRID + GRID / 2, food.y * GRID + GRID / 2, GRID * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#00ffcc';
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw snake
    snake.forEach((s, idx) => {
      ctx.fillStyle = idx === 0 ? '#ff007f' : '#00e5ff';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = idx === 0 ? 10 : 4;
      ctx.fillRect(s.x * GRID + 1, s.y * GRID + 1, GRID - 2, GRID - 2);
      ctx.shadowBlur = 0;
    });
  }

  requestAnimationFrame(loop);

  return {
    destroy: () => {
      isRunning = false;
      window.removeEventListener('keydown', onKey);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };
}
