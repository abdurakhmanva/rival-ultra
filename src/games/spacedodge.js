// SPACE DODGE — Bullet Hell Spaceship Dodger
import { sound } from '../audio.js';

export function launchSpaceDodge(container, onGameOver, onScoreUpdate) {
  let isRunning = true;
  let score = 0;
  let ship = { x: 200, y: 350, r: 14, speed: 6 };
  let bullets = [];
  let stars = [];
  let keys = {};

  const width = Math.max(340, Math.min(600, container.clientWidth || 560));
  const height = Math.max(400, Math.min(500, container.clientHeight || 500));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  ship.x = canvas.width / 2;
  ship.y = canvas.height - 60;

  // Starfield
  for (let i = 0; i < 60; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: Math.random() * 3 + 1,
      size: Math.random() * 2 + 1
    });
  }

  function spawnBullet() {
    if (!isRunning) return;
    const count = 2 + Math.floor(score / 500);
    for (let i = 0; i < count; i++) {
      bullets.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 3 + 3 + (score / 800),
        r: Math.random() * 4 + 4,
        color: Math.random() > 0.3 ? '#ff0055' : '#00ffff'
      });
    }
  }

  const spawnInterval = setInterval(spawnBullet, 600);

  // Controls
  const onKey = (e) => { keys[e.code] = e.type === 'keydown'; };
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);

  const onPointer = (e) => {
    const rect = canvas.getBoundingClientRect();
    ship.x = Math.max(ship.r, Math.min(canvas.width - ship.r, e.clientX - rect.left));
    ship.y = Math.max(ship.r, Math.min(canvas.height - ship.r, e.clientY - rect.top));
  };
  canvas.addEventListener('mousemove', onPointer);
  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) onPointer(e.touches[0]);
  }, { passive: true });

  let lastT = performance.now();

  function loop(t) {
    if (!isRunning) return;
    requestAnimationFrame(loop);

    const dt = Math.min((t - lastT) / 1000, 0.1);
    lastT = t;

    score += Math.floor(dt * 60);
    if (onScoreUpdate) onScoreUpdate(score);

    // Keyboard ship move
    if (keys['ArrowLeft'] || keys['KeyA']) ship.x -= ship.speed;
    if (keys['ArrowRight'] || keys['KeyD']) ship.x += ship.speed;
    if (keys['ArrowUp'] || keys['KeyW']) ship.y -= ship.speed;
    if (keys['ArrowDown'] || keys['KeyS']) ship.y += ship.speed;

    ship.x = Math.max(ship.r, Math.min(canvas.width - ship.r, ship.x));
    ship.y = Math.max(ship.r, Math.min(canvas.height - ship.r, ship.y));

    // Render Background
    ctx.fillStyle = '#080c16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Starfield
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y > canvas.height) s.y = 0;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Draw Ship (Glowing Cyber Triangle)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.moveTo(0, -ship.r);
    ctx.lineTo(ship.r * 0.8, ship.r);
    ctx.lineTo(-ship.r * 0.8, ship.r);
    ctx.closePath();
    ctx.fillStyle = '#00f0ff';
    ctx.fill();

    // Thruster flame
    ctx.beginPath();
    ctx.moveTo(-ship.r * 0.4, ship.r);
    ctx.lineTo(0, ship.r + 8 + Math.random() * 6);
    ctx.lineTo(ship.r * 0.4, ship.r);
    ctx.fillStyle = '#ffaa00';
    ctx.fill();

    ctx.restore();

    // Update & Draw Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx;
      b.y += b.vy;

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.fill();

      // Collision
      const dx = ship.x - b.x;
      const dy = ship.y - b.y;
      if (dx * dx + dy * dy < (ship.r * 0.7 + b.r) ** 2) {
        // Explode!
        isRunning = false;
        sound.playGameOver();
        if (onGameOver) onGameOver(score);
        return;
      }

      if (b.y > canvas.height + 20) {
        bullets.splice(i, 1);
      }
    }
  }

  requestAnimationFrame(loop);

  return {
    destroy: () => {
      isRunning = false;
      clearInterval(spawnInterval);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };
}
