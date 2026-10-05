// VOXEL DIGGER — Underground Mineral Mining Arcade
import { sound } from '../audio.js';

export function launchMiner(container, onGameOver, onScoreUpdate) {
  let isRunning = true;
  let score = 0;
  let oxygen = 100;
  let depth = 0;

  const canvas = document.createElement('canvas');
  canvas.width = Math.min(480, container.clientWidth || 480);
  canvas.height = Math.min(500, container.clientHeight || 500);
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const COLS = 8;
  const BLOCK_SIZE = canvas.width / COLS;
  const VISIBLE_ROWS = Math.ceil(canvas.height / BLOCK_SIZE) + 2;

  // Grid world: array of rows
  const grid = [];
  const ORE_TYPES = [
    { type: 'DIRT', color: '#4a3319', points: 5 },
    { type: 'STONE', color: '#64748b', points: 10 },
    { type: 'GOLD', color: '#ffd700', points: 50 },
    { type: 'GEM', color: '#00f0ff', points: 100 },
    { type: 'OXYGEN', color: '#00ff88', points: 20, oxygen: 35 },
    { type: 'LAVA', color: '#ff2200', danger: true }
  ];

  function generateRow(rIndex) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      const rand = Math.random();
      if (rand < 0.08) row.push({ ...ORE_TYPES[4] }); // Oxygen
      else if (rand < 0.16) row.push({ ...ORE_TYPES[3] }); // Gem
      else if (rand < 0.28) row.push({ ...ORE_TYPES[2] }); // Gold
      else if (rand < 0.35 && rIndex > 5) row.push({ ...ORE_TYPES[5] }); // Lava
      else if (rand < 0.65) row.push({ ...ORE_TYPES[1] }); // Stone
      else row.push({ ...ORE_TYPES[0] }); // Dirt
    }
    return row;
  }

  // Pre-generate 80 rows
  for (let r = 0; r < 80; r++) {
    grid.push(generateRow(r));
  }
  // Clear first row for player spawn
  for (let c = 0; c < COLS; c++) grid[0][c] = null;

  let player = { col: 3, row: 0 };

  function dig(dc, dr) {
    if (!isRunning) return;
    const targetCol = player.col + dc;
    const targetRow = player.row + dr;

    if (targetCol < 0 || targetCol >= COLS || targetRow < 0) return;

    // Expand grid downwards if reaching bottom
    while (grid.length <= targetRow + VISIBLE_ROWS) {
      grid.push(generateRow(grid.length));
    }

    const block = grid[targetRow][targetCol];
    if (block) {
      if (block.danger) {
        // Hit lava!
        gameOver();
        return;
      }

      score += block.points;
      if (block.oxygen) oxygen = Math.min(100, oxygen + block.oxygen);
      sound.playClick();
      if (onScoreUpdate) onScoreUpdate(score);
      grid[targetRow][targetCol] = null;
    }

    player.col = targetCol;
    player.row = targetRow;
    depth = Math.max(depth, player.row);
  }

  const onKey = (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') dig(-1, 0);
    if (e.code === 'ArrowRight' || e.code === 'KeyD') dig(1, 0);
    if (e.code === 'ArrowDown' || e.code === 'KeyS' || e.code === 'Space') dig(0, 1);
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
      if (dx > 20) dig(1, 0);
      else if (dx < -20) dig(-1, 0);
    } else {
      if (dy > 20) dig(0, 1);
    }
  }, { passive: true });

  let lastT = performance.now();

  function loop(t) {
    if (!isRunning) return;
    requestAnimationFrame(loop);

    const dt = Math.min((t - lastT) / 1000, 0.1);
    lastT = t;

    // Deplete oxygen slowly
    oxygen -= dt * 4.5;
    if (oxygen <= 0) {
      gameOver();
      return;
    }

    render();
  }

  function render() {
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Camera scroll with player row
    const scrollY = Math.max(0, (player.row - 3) * BLOCK_SIZE);

    for (let r = 0; r < grid.length; r++) {
      const y = r * BLOCK_SIZE - scrollY;
      if (y < -BLOCK_SIZE || y > canvas.height) continue;

      for (let c = 0; c < COLS; c++) {
        const block = grid[r][c];
        const x = c * BLOCK_SIZE;

        if (block) {
          ctx.fillStyle = block.color;
          ctx.fillRect(x + 2, y + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);

          // Ore sparkle
          if (block.type === 'GEM' || block.type === 'GOLD') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x + BLOCK_SIZE / 2 - 2, y + BLOCK_SIZE / 2 - 2, 4, 4);
          }
        }
      }
    }

    // Draw Player Miner
    const px = player.col * BLOCK_SIZE + 2;
    const py = player.row * BLOCK_SIZE - scrollY + 2;
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.fillRect(px, py, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
    ctx.shadowBlur = 0;

    // Draw Miner Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px + BLOCK_SIZE * 0.25, py + BLOCK_SIZE * 0.3, 6, 6);
    ctx.fillRect(px + BLOCK_SIZE * 0.6, py + BLOCK_SIZE * 0.3, 6, 6);

    // Oxygen Bar HUD
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(10, 10, canvas.width - 20, 16);
    ctx.fillStyle = oxygen > 30 ? '#00ff88' : '#ff0055';
    ctx.fillRect(10, 10, (canvas.width - 20) * (oxygen / 100), 16);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(10, 10, canvas.width - 20, 16);
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
      window.removeEventListener('keydown', onKey);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };
}
