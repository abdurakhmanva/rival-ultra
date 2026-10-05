// CANDY SODA CRUSH — Iconic Match-3 & Soda Bottle Physics Saga
import { sound } from '../audio.js';
import confetti from 'canvas-confetti';

export function launchSodaCrush(container, onGameOver, onScoreUpdate) {
  let isRunning = true;
  let score = 0;
  let movesLeft = 25;
  let sodaBottlesPopped = 0;
  const targetBottles = 5;
  let sodaLevel = 7; // starts at bottom row (rows 0..7)
  let comboCount = 0;
  let isProcessing = false;

  const COLS = 8;
  const ROWS = 8;
  const CANDY_TYPES = 6; // 0..5 are regular colors, 6 is SODA BOTTLE

  // Colors Palette matching Candy Crush Soda Saga:
  // 0: Red Bean, 1: Cyan Drop, 2: Green Square, 3: Yellow Drop, 4: Orange Lozenge, 5: Purple Heart, 6: Soda Bottle
  const CANDY_COLORS = [
    { main: '#ff2255', dark: '#aa0033', light: '#ff88aa', name: 'red' },
    { main: '#00e5ff', dark: '#0088cc', light: '#88ffff', name: 'blue' },
    { main: '#00e676', dark: '#009944', light: '#88ffaa', name: 'green' },
    { main: '#ffea00', dark: '#ccaa00', light: '#ffff99', name: 'yellow' },
    { main: '#ff7700', dark: '#bb4400', light: '#ffbb77', name: 'orange' },
    { main: '#d500f9', dark: '#8800bb', light: '#f488ff', name: 'purple' },
    { main: '#00f0ff', dark: '#004488', light: '#ffffff', name: 'bottle' }
  ];

  // DOM Container Setup
  container.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    position: relative;
    user-select: none;
    font-family: 'Space Grotesk', system-ui, sans-serif;
  `;

  // Top Glass HUD
  const hud = document.createElement('div');
  hud.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: min(92%, 480px);
    margin-bottom: 12px;
    padding: 8px 18px;
    background: rgba(15, 10, 30, 0.7);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 0, 128, 0.3);
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    z-index: 10;
  `;

  hud.innerHTML = `
    <div style="text-align: center;">
      <span style="font-size: 10px; color: #ff0077; font-weight: 700; letter-spacing: 1px;">URINISHLAR</span>
      <div id="sc-moves" style="font-size: 26px; font-weight: 900; color: #fff; line-height: 1;">25</div>
    </div>

    <div style="text-align: center; flex: 1; padding: 0 16px;">
      <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
        <span style="color: #00f0ff;">🍾 SODA: <strong id="sc-bottles">0/5</strong></span>
        <span id="sc-stars" style="color: #ffea00; letter-spacing: 2px;">☆☆☆</span>
      </div>
      <div style="height: 8px; width: 100%; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; border: 1px solid rgba(0,240,255,0.3);">
        <div id="sc-prog-bar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #ff0077, #00f0ff); transition: width 0.3s ease;"></div>
      </div>
    </div>

    <div style="text-align: center;">
      <span style="font-size: 10px; color: #00f0ff; font-weight: 700; letter-spacing: 1px;">OCHKO</span>
      <div id="sc-score" style="font-size: 24px; font-weight: 900; color: #ffea00; line-height: 1;">0</div>
    </div>
  `;
  wrapper.appendChild(hud);

  const movesEl = hud.querySelector('#sc-moves');
  const bottlesEl = hud.querySelector('#sc-bottles');
  const starsEl = hud.querySelector('#sc-stars');
  const progBar = hud.querySelector('#sc-prog-bar');
  const scoreEl = hud.querySelector('#sc-score');

  // Floating Toast Banner for Combos
  const toastBanner = document.createElement('div');
  toastBanner.style.cssText = `
    position: absolute;
    top: 45%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    padding: 12px 28px;
    background: linear-gradient(135deg, rgba(255,0,128,0.9), rgba(0,240,255,0.9));
    backdrop-filter: blur(12px);
    border-radius: 30px;
    color: #fff;
    font-size: 22px;
    font-weight: 900;
    letter-spacing: 2px;
    text-shadow: 0 2px 10px rgba(0,0,0,0.6);
    pointer-events: none;
    z-index: 20;
    transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease;
    opacity: 0;
  `;
  wrapper.appendChild(toastBanner);

  function showToast(text) {
    toastBanner.textContent = text;
    toastBanner.style.opacity = '1';
    toastBanner.style.transform = 'translate(-50%, -50%) scale(1.1)';
    sound.playLevelUp();
    setTimeout(() => {
      toastBanner.style.transform = 'translate(-50%, -50%) scale(0.8)';
      toastBanner.style.opacity = '0';
    }, 900);
  }

  // Canvas
  const canvas = document.createElement('canvas');
  canvas.style.cssText = `
    border-radius: 20px;
    box-shadow: 0 16px 40px rgba(0,0,0,0.6), 0 0 30px rgba(189, 0, 255, 0.2);
    border: 2px solid rgba(255,255,255,0.12);
    cursor: pointer;
    touch-action: none;
  `;
  wrapper.appendChild(canvas);
  container.appendChild(wrapper);

  const ctx = canvas.getContext('2d');

  // Sizing
  const maxBoardDim = Math.min(container.clientWidth - 32, container.clientHeight - 130, 480);
  const boardSize = Math.max(320, maxBoardDim);
  const cellSize = Math.floor(boardSize / COLS);
  const finalCanvasSize = cellSize * COLS;

  canvas.width = finalCanvasSize;
  canvas.height = finalCanvasSize;

  // Board Data Structure
  let grid = [];
  let selectedTile = null; // { r, c }
  let isDragging = false;
  let dragStartPos = null;

  // Animation & Particle Queues
  let particles = [];
  let flyingFish = [];
  let laserBeams = [];
  let shockwaves = [];

  function createTile(color, special = 'none') {
    return {
      color,
      special, // 'none', 'striped_h', 'striped_v', 'wrapped', 'fish', 'color_bomb'
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      scale: 1,
      alpha: 1,
      highlight: 0
    };
  }

  function initBoard() {
    grid = [];
    for (let r = 0; r < ROWS; r++) {
      grid[r] = [];
      for (let c = 0; c < COLS; c++) {
        // Guarantee no matches on initial board
        let color;
        do {
          // 8% chance to spawn a Soda Bottle (color: 6) on bottom half
          if (r >= 4 && Math.random() < 0.12) {
            color = 6;
          } else {
            color = Math.floor(Math.random() * CANDY_TYPES);
          }
        } while (
          (c >= 2 && grid[r][c - 1]?.color === color && grid[r][c - 2]?.color === color) ||
          (r >= 2 && grid[r - 1][c]?.color === color && grid[r - 2][c]?.color === color)
        );

        const tile = createTile(color);
        tile.x = c * cellSize;
        tile.y = r * cellSize;
        tile.targetX = tile.x;
        tile.targetY = tile.y;
        grid[r][c] = tile;
      }
    }
  }

  initBoard();

  // Match Finding Algorithm
  function findMatches() {
    const matchedTiles = new Set();
    const matchGroups = [];

    // 1. Horizontal Matches
    for (let r = 0; r < ROWS; r++) {
      let matchLen = 1;
      for (let c = 0; c < COLS; c++) {
        const current = grid[r][c];
        const next = c < COLS - 1 ? grid[r][c + 1] : null;

        if (current && next && current.color === next.color && current.color !== -1) {
          matchLen++;
        } else {
          if (matchLen >= 3) {
            const group = [];
            for (let i = c - matchLen + 1; i <= c; i++) {
              matchedTiles.add(`${r},${i}`);
              group.push({ r, c: i });
            }
            matchGroups.push({ type: 'h', len: matchLen, tiles: group, color: grid[r][c].color });
          }
          matchLen = 1;
        }
      }
    }

    // 2. Vertical Matches
    for (let c = 0; c < COLS; c++) {
      let matchLen = 1;
      for (let r = 0; r < ROWS; r++) {
        const current = grid[r][c];
        const next = r < ROWS - 1 ? grid[r + 1][c] : null;

        if (current && next && current.color === next.color && current.color !== -1) {
          matchLen++;
        } else {
          if (matchLen >= 3) {
            const group = [];
            for (let i = r - matchLen + 1; i <= r; i++) {
              matchedTiles.add(`${i},${c}`);
              group.push({ r: i, c });
            }
            matchGroups.push({ type: 'v', len: matchLen, tiles: group, color: grid[r][c].color });
          }
          matchLen = 1;
        }
      }
    }

    // 3. 2x2 Square Matches (produces Swedish Fish)
    for (let r = 0; r < ROWS - 1; r++) {
      for (let c = 0; c < COLS - 1; c++) {
        const color = grid[r][c]?.color;
        if (
          color !== undefined && color !== -1 && color !== 6 &&
          grid[r + 1][c]?.color === color &&
          grid[r][c + 1]?.color === color &&
          grid[r + 1][c + 1]?.color === color
        ) {
          matchedTiles.add(`${r},${c}`);
          matchedTiles.add(`${r + 1},${c}`);
          matchedTiles.add(`${r},${c + 1}`);
          matchedTiles.add(`${r + 1},${c + 1}`);
          matchGroups.push({
            type: 'square',
            len: 4,
            tiles: [{ r, c }, { r: r + 1, c }, { r, c: c + 1 }, { r: r + 1, c: c + 1 }],
            color
          });
        }
      }
    }

    return { matchedTiles, matchGroups };
  }

  // Swap Two Tiles & Animate
  async function swapTiles(r1, c1, r2, c2) {
    if (!isRunning || isProcessing || movesLeft <= 0) return;
    isProcessing = true;

    const t1 = grid[r1][c1];
    const t2 = grid[r2][c2];

    // Color Bomb Logic
    if (t1.special === 'color_bomb' || t2.special === 'color_bomb') {
      movesLeft = Math.max(0, movesLeft - 1);
      movesEl.textContent = movesLeft;
      if (movesLeft <= 0) movesEl.style.color = '#ff0055';
      await animateSwap(r1, c1, r2, c2);

      const bomb = t1.special === 'color_bomb' ? t1 : t2;
      const other = t1.special === 'color_bomb' ? t2 : t1;
      const bombR = t1.special === 'color_bomb' ? r1 : r2;
      const bombC = t1.special === 'color_bomb' ? c1 : c2;

      grid[bombR][bombC] = null;
      spawnShockwave(bombC * cellSize + cellSize / 2, bombR * cellSize + cellSize / 2, '#fff');

      // Explode all candies of the chosen color
      const targetColor = other.color;
      let count = 0;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (grid[r][c] && (grid[r][c].color === targetColor || targetColor === 6)) {
            triggerTileDestruction(r, c);
            count++;
          }
        }
      }
      addScore(count * 80 + 300);
      showToast('🌈 SODA COLOR BOMB!');
      await processBoard();

      if (sodaBottlesPopped >= targetBottles || sodaLevel <= 0) {
        await victorySugarRush();
      } else if (movesLeft <= 0) {
        await handleOutOfMoves();
      } else {
        isProcessing = false;
      }
      return;
    }

    // Normal Swap
    await animateSwap(r1, c1, r2, c2);
    grid[r1][c1] = t2;
    grid[r2][c2] = t1;

    const { matchedTiles, matchGroups } = findMatches();

    if (matchedTiles.size === 0) {
      // Invalid Swap - Shake & Swap Back
      sound.playClick();
      await animateSwap(r1, c1, r2, c2);
      grid[r1][c1] = t1;
      grid[r2][c2] = t2;
      isProcessing = false;
    } else {
      // Valid Move!
      movesLeft = Math.max(0, movesLeft - 1);
      movesEl.textContent = movesLeft;
      if (movesLeft <= 0) movesEl.style.color = '#ff0055';
      comboCount = 0;
      sound.playScore();

      await executeMatches(matchedTiles, matchGroups, { r: r2, c: c2 });
      await processBoard();

      // Check Game End Conditions
      if (sodaBottlesPopped >= targetBottles || sodaLevel <= 0) {
        await victorySugarRush();
      } else if (movesLeft <= 0) {
        await handleOutOfMoves();
      } else {
        isProcessing = false;
      }
    }
  }

  function animateSwap(r1, c1, r2, c2) {
    return new Promise(resolve => {
      const t1 = grid[r1][c1];
      const t2 = grid[r2][c2];
      const startTime = performance.now();
      const dur = 180;

      const startX1 = c1 * cellSize;
      const startY1 = r1 * cellSize;
      const startX2 = c2 * cellSize;
      const startY2 = r2 * cellSize;

      function step(now) {
        const elapsed = now - startTime;
        const p = Math.min(1, elapsed / dur);
        const ease = 0.5 - Math.cos(p * Math.PI) / 2;

        if (t1) {
          t1.x = startX1 + (startX2 - startX1) * ease;
          t1.y = startY1 + (startY2 - startY1) * ease;
        }
        if (t2) {
          t2.x = startX2 + (startX1 - startX2) * ease;
          t2.y = startY2 + (startY1 - startY2) * ease;
        }

        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          if (t1) { t1.x = startX2; t1.y = startY2; }
          if (t2) { t2.x = startX1; t2.y = startY1; }
          resolve();
        }
      }
      requestAnimationFrame(step);
    });
  }

  // Handle Destruction & Creation of Special Candies
  async function executeMatches(matchedTiles, matchGroups, focusPos) {
    comboCount++;
    let points = matchedTiles.size * 50;

    // Check for Special Candies to create
    let createdSpecial = false;

    matchGroups.forEach(group => {
      const targetPos = focusPos && group.tiles.some(t => t.r === focusPos.r && t.c === focusPos.c)
        ? focusPos
        : group.tiles[0];

      if (group.len >= 5 && (group.type === 'h' || group.type === 'v')) {
        // 5-in-a-row -> COLOR BOMB!
        grid[targetPos.r][targetPos.c] = createTile(6, 'color_bomb');
        matchedTiles.delete(`${targetPos.r},${targetPos.c}`);
        createdSpecial = true;
        showToast('⚡ COLOR BOMB!');
      } else if (group.type === 'square') {
        // 2x2 Square -> SWEDISH FISH!
        grid[targetPos.r][targetPos.c] = createTile(group.color, 'fish');
        matchedTiles.delete(`${targetPos.r},${targetPos.c}`);
        createdSpecial = true;
        showToast('🐟 SWEDISH FISH!');
      } else if (group.len === 4) {
        // 4-in-a-row -> STRIPED CANDY!
        const stripeType = group.type === 'h' ? 'striped_v' : 'striped_h';
        grid[targetPos.r][targetPos.c] = createTile(group.color, stripeType);
        matchedTiles.delete(`${targetPos.r},${targetPos.c}`);
        createdSpecial = true;
        showToast('✨ STRIPED BLAST!');
      }
    });

    if (comboCount === 2) showToast('SWEET!');
    if (comboCount === 3) showToast('TASTY!');
    if (comboCount >= 4) showToast('DIVINE!');

    // Destroy matched tiles
    matchedTiles.forEach(coord => {
      const [r, c] = coord.split(',').map(Number);
      triggerTileDestruction(r, c);
    });

    addScore(points * comboCount);
    await wait(220);
  }

  function triggerTileDestruction(r, c) {
    const tile = grid[r][c];
    if (!tile) return;

    const centerX = c * cellSize + cellSize / 2;
    const centerY = r * cellSize + cellSize / 2;

    // Spawn Candy Burst Particles
    const colorDef = CANDY_COLORS[tile.color] || CANDY_COLORS[0];
    spawnParticles(centerX, centerY, colorDef.main, 14);

    // Soda Bottle Pop Logic
    if (tile.color === 6 && tile.special === 'none') {
      sodaBottlesPopped++;
      sodaLevel = Math.max(0, sodaLevel - 1);
      bottlesEl.textContent = `${sodaBottlesPopped}/${targetBottles}`;
      spawnShockwave(centerX, centerY, '#00f0ff');
      showToast('🍾 SODA RISING!');
      sound.playLevelUp();
    }

    // Special Candies Activation
    if (tile.special === 'striped_h') {
      triggerLaserRow(r);
    } else if (tile.special === 'striped_v') {
      triggerLaserCol(c);
    } else if (tile.special === 'fish') {
      triggerFish(centerX, centerY);
    } else if (tile.special === 'wrapped') {
      triggerWrappedBomb(r, c);
    }

    grid[r][c] = null;
  }

  function triggerLaserRow(r) {
    laserBeams.push({ y: r * cellSize + cellSize / 2, isHorizontal: true, alpha: 1 });
    sound.playScore();
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c]) {
        spawnParticles(c * cellSize + cellSize / 2, r * cellSize + cellSize / 2, '#fff', 6);
        grid[r][c] = null;
      }
    }
  }

  function triggerLaserCol(c) {
    laserBeams.push({ x: c * cellSize + cellSize / 2, isHorizontal: false, alpha: 1 });
    sound.playScore();
    for (let r = 0; r < ROWS; r++) {
      if (grid[r][c]) {
        spawnParticles(c * cellSize + cellSize / 2, r * cellSize + cellSize / 2, '#fff', 6);
        grid[r][c] = null;
      }
    }
  }

  function triggerWrappedBomb(centerR, centerC) {
    spawnShockwave(centerC * cellSize + cellSize / 2, centerR * cellSize + cellSize / 2, '#ffea00');
    sound.playGameOver();
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = centerR + dr;
        const nc = centerC + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc]) {
          spawnParticles(nc * cellSize + cellSize / 2, nr * cellSize + cellSize / 2, '#ff0077', 8);
          grid[nr][nc] = null;
        }
      }
    }
  }

  function triggerFish(fromX, fromY) {
    // Find target (preferably a Soda Bottle or top row tile)
    let target = null;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c] && grid[r][c].color === 6) {
          target = { r, c, x: c * cellSize + cellSize / 2, y: r * cellSize + cellSize / 2 };
          break;
        }
      }
      if (target) break;
    }

    if (!target) {
      const candidates = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (grid[r][c]) candidates.push({ r, c, x: c * cellSize + cellSize / 2, y: r * cellSize + cellSize / 2 });
        }
      }
      target = candidates[Math.floor(Math.random() * candidates.length)];
    }

    if (target) {
      flyingFish.push({
        x: fromX,
        y: fromY,
        tx: target.x,
        ty: target.y,
        tr: target.r,
        tc: target.c,
        progress: 0
      });
    }
  }

  // Cascading Gravity & Refill Empty Cells
  async function processBoard() {
    let hadFalls = false;

    // Apply Gravity
    for (let c = 0; c < COLS; c++) {
      let emptyRow = -1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (!grid[r][c] && emptyRow === -1) {
          emptyRow = r;
        } else if (grid[r][c] && emptyRow !== -1) {
          grid[emptyRow][c] = grid[r][c];
          grid[emptyRow][c].targetY = emptyRow * cellSize;
          grid[r][c] = null;
          emptyRow--;
          hadFalls = true;
        }
      }

      // Fill remaining empty spots from above
      if (emptyRow !== -1) {
        for (let r = emptyRow; r >= 0; r--) {
          const isBottle = Math.random() < 0.1;
          const color = isBottle ? 6 : Math.floor(Math.random() * CANDY_TYPES);
          const tile = createTile(color);
          tile.x = c * cellSize;
          tile.y = (r - emptyRow - 1) * cellSize;
          tile.targetX = c * cellSize;
          tile.targetY = r * cellSize;
          grid[r][c] = tile;
          hadFalls = true;
        }
      }
    }

    if (hadFalls) {
      await animateFalling();
      // Check for cascading matches!
      const { matchedTiles, matchGroups } = findMatches();
      if (matchedTiles.size > 0) {
        await executeMatches(matchedTiles, matchGroups, null);
        await processBoard();
      }
    }
  }

  function animateFalling() {
    return new Promise(resolve => {
      const startTime = performance.now();
      const dur = 240;

      function step(now) {
        const p = Math.min(1, (now - startTime) / dur);
        const ease = p * p; // Gravity accelerate

        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const t = grid[r][c];
            if (t) {
              t.y += (t.targetY - t.y) * 0.45;
              t.x += (t.targetX - t.x) * 0.45;
            }
          }
        }

        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
              if (grid[r][c]) {
                grid[r][c].y = grid[r][c].targetY;
                grid[r][c].x = grid[r][c].targetX;
              }
            }
          }
          resolve();
        }
      }
      requestAnimationFrame(step);
    });
  }

  function addScore(pts) {
    score += pts;
    scoreEl.textContent = score.toLocaleString();
    if (onScoreUpdate) onScoreUpdate(score);

    // Stars Update (1500, 3500, 6000)
    let stars = '☆☆☆';
    let pct = Math.min(100, Math.floor((score / 6000) * 100));
    progBar.style.width = `${pct}%`;

    if (score >= 6000) stars = '⭐⭐⭐';
    else if (score >= 3500) stars = '⭐⭐☆';
    else if (score >= 1500) stars = '⭐☆☆';
    starsEl.textContent = stars;
  }

  function wait(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  // Out of Moves Game Over Sequence
  async function handleOutOfMoves() {
    if (!isRunning) return;
    isProcessing = true;
    showToast('❌ URINISHLAR TUGADI!');
    sound.playGameOver();
    await wait(1200);
    gameOver();
  }

  // Sugar Rush Victory Sequence
  async function victorySugarRush() {
    if (!isRunning) return;
    isProcessing = true;
    showToast('🎉 SODA CRUSH G‘ALABA!');
    try {
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    } catch (e) {}
    sound.playLevelUp();

    // Turn remaining moves into extra points
    const bonus = Math.max(0, movesLeft) * 250;
    addScore(bonus);

    await wait(1600);
    gameOver();
  }

  function gameOver() {
    if (!isRunning) return;
    isRunning = false;
    isProcessing = true;
    sound.playGameOver();
    if (onGameOver) onGameOver(score);
  }

  // Particles & Visual FX Emitters
  function spawnParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 6 + 2;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: Math.random() * 5 + 3,
        color,
        alpha: 1,
        life: 1
      });
    }
  }

  function spawnShockwave(x, y, color) {
    shockwaves.push({ x, y, r: 10, maxR: 70, color, alpha: 1 });
  }

  // Draw Loops
  function render(time) {
    if (!isRunning) return;
    requestAnimationFrame(render);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Board Background Tiles
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const isEven = (r + c) % 2 === 0;
        ctx.fillStyle = isEven ? 'rgba(25, 18, 48, 0.75)' : 'rgba(38, 26, 68, 0.75)';
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }

    // 2. Liquid Purple Soda Water Layer (Candy Crush Signature!)
    const sodaY = (sodaLevel + 0.3) * cellSize;
    if (sodaLevel < ROWS) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      ctx.lineTo(0, sodaY);

      // Wavy Water Surface
      for (let x = 0; x <= canvas.width; x += 10) {
        const wave = Math.sin(time * 0.003 + x * 0.04) * 4;
        ctx.lineTo(x, sodaY + wave);
      }

      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();

      const sodaGrad = ctx.createLinearGradient(0, sodaY, 0, canvas.height);
      sodaGrad.addColorStop(0, 'rgba(189, 0, 255, 0.45)');
      sodaGrad.addColorStop(1, 'rgba(100, 0, 180, 0.7)');
      ctx.fillStyle = sodaGrad;
      ctx.fill();

      // Glowing Waterline
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Rising Soda Bubbles
      for (let i = 0; i < 6; i++) {
        const bx = (Math.sin(time * 0.001 + i * 2) * 0.5 + 0.5) * canvas.width;
        const by = sodaY + ((time * 0.04 + i * 40) % (canvas.height - sodaY));
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fill();
      }

      ctx.restore();
    }

    // 3. Draw Candies
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = grid[r][c];
        if (tile) {
          drawCandy(tile, tile.x, tile.y, cellSize, time);
        }
      }
    }

    // 4. Highlight Selected Tile
    if (selectedTile) {
      const sx = selectedTile.c * cellSize;
      const sy = selectedTile.r * cellSize;
      ctx.save();
      ctx.strokeStyle = '#ffea00';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#ffea00';
      ctx.shadowBlur = 12;
      ctx.strokeRect(sx + 3, sy + 3, cellSize - 6, cellSize - 6);
      ctx.restore();
    }

    // 5. Flying Swedish Fish
    for (let i = flyingFish.length - 1; i >= 0; i--) {
      const f = flyingFish[i];
      f.progress += 0.045;

      const curX = f.x + (f.tx - f.x) * f.progress;
      // Arc trajectory
      const arc = Math.sin(f.progress * Math.PI) * -50;
      const curY = f.y + (f.ty - f.y) * f.progress + arc;

      // Draw Fish
      ctx.save();
      ctx.translate(curX, curY);
      ctx.fillStyle = '#ff7700';
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Tail
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(-18, -6);
      ctx.lineTo(-18, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      if (f.progress >= 1) {
        triggerTileDestruction(f.tr, f.tc);
        flyingFish.splice(i, 1);
      }
    }

    // 6. Laser Beams
    for (let i = laserBeams.length - 1; i >= 0; i--) {
      const b = laserBeams[i];
      b.alpha -= 0.06;
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${b.alpha})`;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 16;
      if (b.isHorizontal) {
        ctx.fillRect(0, b.y - 6, canvas.width, 12);
      } else {
        ctx.fillRect(b.x - 6, 0, 12, canvas.height);
      }
      ctx.restore();
      if (b.alpha <= 0) laserBeams.splice(i, 1);
    }

    // 7. Shockwaves
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.r += 3.5;
      sw.alpha -= 0.05;
      ctx.save();
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 4;
      ctx.globalAlpha = sw.alpha;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      if (sw.alpha <= 0) shockwaves.splice(i, 1);
    }

    // 8. Explosion Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.035;
      p.size = Math.max(0, p.size - 0.1);

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (p.alpha <= 0) particles.splice(i, 1);
    }
  }

  // Draw Specific Candies (3D Glossy Style)
  function drawCandy(tile, x, y, size, time) {
    const cx = x + size / 2;
    const cy = y + size / 2;
    const pad = size * 0.18;
    const r = (size - pad * 2) / 2;

    ctx.save();

    // Floating bobbing if submerged in purple soda
    const tileRow = Math.floor(y / size);
    if (tileRow >= sodaLevel) {
      const bob = Math.sin(time * 0.005 + x * 0.1) * 2;
      ctx.translate(0, bob);
    }

    // Color Bomb
    if (tile.special === 'color_bomb') {
      const donutR = r * 1.1;
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, donutR);
      grad.addColorStop(0, '#552200');
      grad.addColorStop(0.8, '#221100');
      grad.addColorStop(1, '#000000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, donutR, 0, Math.PI * 2);
      ctx.fill();

      // Rainbow Sprinkles
      const sprinkleColors = ['#ff0055', '#00f0ff', '#ffea00', '#00ff66', '#ffffff'];
      for (let i = 0; i < 10; i++) {
        const ang = (i / 10) * Math.PI * 2 + time * 0.002;
        const spDist = donutR * 0.55;
        const sx = cx + Math.cos(ang) * spDist;
        const sy = cy + Math.sin(ang) * spDist;
        ctx.fillStyle = sprinkleColors[i % sprinkleColors.length];
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    // Soda Bottle (Special target tile 🍾)
    if (tile.color === 6) {
      const bW = r * 1.0;
      const bH = r * 1.7;

      // Bottle Glass Body
      const bottleGrad = ctx.createLinearGradient(cx - bW / 2, cy, cx + bW / 2, cy);
      bottleGrad.addColorStop(0, 'rgba(0, 240, 255, 0.85)');
      bottleGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
      bottleGrad.addColorStop(1, 'rgba(0, 180, 255, 0.85)');

      ctx.fillStyle = bottleGrad;
      ctx.beginPath();
      // Body
      ctx.roundRect(cx - bW / 2, cy - bH * 0.2, bW, bH * 0.7, [6]);
      ctx.fill();

      // Neck
      ctx.fillRect(cx - bW * 0.22, cy - bH * 0.5, bW * 0.44, bH * 0.35);

      // Gold Cap
      ctx.fillStyle = '#ffea00';
      ctx.fillRect(cx - bW * 0.26, cy - bH * 0.55, bW * 0.52, bH * 0.1);

      // Label Ring
      ctx.fillStyle = '#ff0077';
      ctx.fillRect(cx - bW / 2, cy, bW, bH * 0.25);

      // Specular Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillRect(cx - bW * 0.35, cy - bH * 0.15, bW * 0.15, bH * 0.55);

      ctx.restore();
      return;
    }

    // Regular Candies with 3D Gloss
    const def = CANDY_COLORS[tile.color];
    const grad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
    grad.addColorStop(0, def.light);
    grad.addColorStop(0.6, def.main);
    grad.addColorStop(1, def.dark);

    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 6;

    // Geometric Shapes per color (like Candy Crush)
    if (tile.color === 0) {
      // Red Bean
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 1.15, r * 0.8, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (tile.color === 1) {
      // Blue Soda Drop / Teardrop
      ctx.beginPath();
      ctx.arc(cx, cy + r * 0.2, r * 0.85, 0, Math.PI);
      ctx.lineTo(cx, cy - r * 0.95);
      ctx.closePath();
      ctx.fill();
    } else if (tile.color === 2) {
      // Green Rounded Square
      ctx.beginPath();
      ctx.roundRect(cx - r * 0.85, cy - r * 0.85, r * 1.7, r * 1.7, [10]);
      ctx.fill();
    } else if (tile.color === 3) {
      // Yellow Lemon Drop
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 0.8, r * 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (tile.color === 4) {
      // Orange Diamond
      ctx.beginPath();
      ctx.moveTo(cx, cy - r * 1.05);
      ctx.lineTo(cx + r * 1.05, cy);
      ctx.lineTo(cx, cy + r * 1.05);
      ctx.lineTo(cx - r * 1.05, cy);
      ctx.closePath();
      ctx.fill();
    } else {
      // Purple Heart / Candy
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }

    // Specular Glint
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.35, cy - r * 0.35, r * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // Special Candies Markings: Striped, Wrapped, Fish
    if (tile.special === 'striped_h') {
      ctx.fillStyle = '#ffffff';
      for (let i = -2; i <= 2; i++) {
        ctx.fillRect(cx - r, cy + i * 6 - 2, r * 2, 3);
      }
    } else if (tile.special === 'striped_v') {
      ctx.fillStyle = '#ffffff';
      for (let i = -2; i <= 2; i++) {
        ctx.fillRect(cx + i * 6 - 2, cy - r, 3, r * 2);
      }
    } else if (tile.special === 'fish') {
      // Fish tail on candy
      ctx.fillStyle = '#ff7700';
      ctx.beginPath();
      ctx.moveTo(cx + r * 0.8, cy - r * 0.3);
      ctx.lineTo(cx + r * 1.3, cy - r * 0.7);
      ctx.lineTo(cx + r * 1.3, cy + r * 0.1);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  // Input Handlers: Click / Tap / Drag
  function getTilePos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    const c = Math.floor((clientX - rect.left) / (rect.width / COLS));
    const r = Math.floor((clientY - rect.top) / (rect.height / ROWS));

    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      return { r, c };
    }
    return null;
  }

  function handleStart(e) {
    if (!isRunning || isProcessing || movesLeft <= 0) return;
    const pos = getTilePos(e);
    if (!pos) return;

    isDragging = true;
    dragStartPos = pos;

    if (!selectedTile) {
      selectedTile = pos;
      sound.playClick();
    } else {
      const dr = Math.abs(selectedTile.r - pos.r);
      const dc = Math.abs(selectedTile.c - pos.c);

      if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        // Swap adjacent!
        const r1 = selectedTile.r;
        const c1 = selectedTile.c;
        const r2 = pos.r;
        const c2 = pos.c;
        selectedTile = null;
        swapTiles(r1, c1, r2, c2);
      } else {
        selectedTile = pos;
        sound.playClick();
      }
    }
  }

  function handleMove(e) {
    if (!isRunning || isProcessing || movesLeft <= 0 || !isDragging || !dragStartPos) return;
    const pos = getTilePos(e);
    if (!pos) return;

    const dr = pos.r - dragStartPos.r;
    const dc = pos.c - dragStartPos.c;

    if (Math.abs(dr) + Math.abs(dc) === 1) {
      isDragging = false;
      selectedTile = null;
      swapTiles(dragStartPos.r, dragStartPos.c, pos.r, pos.c);
    }
  }

  function handleEnd() {
    isDragging = false;
    dragStartPos = null;
  }

  canvas.addEventListener('mousedown', handleStart);
  canvas.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleEnd);

  canvas.addEventListener('touchstart', handleStart, { passive: true });
  canvas.addEventListener('touchmove', handleMove, { passive: true });
  window.addEventListener('touchend', handleEnd);

  // Start Animation Loop
  requestAnimationFrame(render);

  return {
    destroy: () => {
      isRunning = false;
      canvas.removeEventListener('mousedown', handleStart);
      canvas.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      canvas.removeEventListener('touchstart', handleStart);
      canvas.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
      wrapper.remove();
    }
  };
}
