// CYBER FLAPPY — Futuristic Neon Flappy Flight
import { sound } from '../audio.js';

export function launchCyberFlappy(container, onGameOver, onScoreUpdate) {
  let isRunning = true;
  let score = 0;

  const width = Math.max(340, Math.min(500, container.clientWidth || 500));
  const height = Math.max(400, Math.min(520, container.clientHeight || 520));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let bird = { y: height / 2, vy: 0, r: 14 };
  let pipes = [];
  const gravity = 22;
  const flapPower = -7.5;
  const gap = 135;

  function spawnPipe() {
    if (!isRunning) return;
    const topHeight = Math.random() * (canvas.height - gap - 100) + 50;
    pipes.push({
      x: canvas.width,
      top: topHeight,
      bottom: topHeight + gap,
      passed: false
    });
  }

  const spawnTimer = setInterval(spawnPipe, 1400);

  function flap() {
    if (!isRunning) return;
    bird.vy = flapPower;
    sound.playClick();
  }

  const onKey = (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') flap();
  };
  window.addEventListener('keydown', onKey);
  canvas.addEventListener('mousedown', flap);
  canvas.addEventListener('touchstart', flap, { passive: true });

  let lastT = performance.now();

  function loop(t) {
    if (!isRunning) return;
    requestAnimationFrame(loop);

    const dt = Math.min((t - lastT) / 1000, 0.1);
    lastT = t;

    // Bird physics
    bird.vy += gravity * dt;
    bird.y += bird.vy;

    // Floor and ceiling bounds
    if (bird.y < bird.r || bird.y > canvas.height - bird.r) {
      gameOver();
      return;
    }

    // Move pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= 160 * dt;

      // Score
      if (!p.passed && p.x < 100) {
        p.passed = true;
        score += 10;
        sound.playScore();
        if (onScoreUpdate) onScoreUpdate(score);
      }

      // Collision check
      if (100 + bird.r > p.x && 100 - bird.r < p.x + 50) {
        if (bird.y - bird.r < p.top || bird.y + bird.r > p.bottom) {
          gameOver();
          return;
        }
      }

      if (p.x < -60) pipes.splice(i, 1);
    }

    // Render
    ctx.fillStyle = '#060914';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw pipes (Glowing Cyber Gate Columns)
    pipes.forEach(p => {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;

      // Top pipe
      ctx.fillRect(p.x, 0, 50, p.top);
      ctx.strokeRect(p.x, 0, 50, p.top);

      // Bottom pipe
      ctx.fillRect(p.x, p.bottom, 50, canvas.height - p.bottom);
      ctx.strokeRect(p.x, p.bottom, 50, canvas.height - p.bottom);
    });

    // Draw Bird (Cyber Drone)
    ctx.save();
    ctx.translate(100, bird.y);
    ctx.rotate(Math.min(Math.PI / 4, Math.max(-Math.PI / 4, bird.vy * 0.08)));

    ctx.beginPath();
    ctx.arc(0, 0, bird.r, 0, Math.PI * 2);
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 12;
    ctx.fill();

    // Eye
    ctx.beginPath();
    ctx.arc(6, -3, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
  }

  function gameOver() {
    isRunning = false;
    sound.playGameOver();
    if (onGameOver) onGameOver(score);
  }

  requestAnimationFrame(loop);

  return {
    destroy: () => {
      isRunning = false;
      clearInterval(spawnTimer);
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('mousedown', flap);
      canvas.removeEventListener('touchstart', flap);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };
}
