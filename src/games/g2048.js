// 2048 CYBER GLASS — Frosted Glass 2048 Sliding Puzzle
import { sound } from '../audio.js';

export function launch2048(container, onGameOver, onScoreUpdate) {
  let score = 0;
  let board = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ];

  container.innerHTML = `
    <div class="g2048-wrap">
      <div class="g2048-top">
        <div class="g2048-score-box">
          <span>OCHKO</span>
          <strong id="g2048-score">0</strong>
        </div>
        <div class="g2048-hint">Strelkalar yoki WASD bilan suring</div>
      </div>
      <div class="g2048-grid" id="g2048-board"></div>
    </div>
  `;

  const boardEl = container.querySelector('#g2048-board');
  const scoreEl = container.querySelector('#g2048-score');

  function spawnTile() {
    const empty = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (board[r][c] === 0) empty.push({ r, c });
      }
    }
    if (empty.length === 0) return false;
    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
    return true;
  }

  function render() {
    boardEl.innerHTML = '';
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = board[r][c];
        const cell = document.createElement('div');
        cell.className = `g2048-cell ${val > 0 ? 'tile-' + val : 'tile-empty'}`;
        cell.textContent = val > 0 ? val : '';
        boardEl.appendChild(cell);
      }
    }
    scoreEl.textContent = score;
    if (onScoreUpdate) onScoreUpdate(score);
  }

  function slide(row) {
    let arr = row.filter(val => val !== 0);
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) {
        arr[i] *= 2;
        score += arr[i];
        sound.playScore();
        arr.splice(i + 1, 1);
      }
    }
    while (arr.length < 4) arr.push(0);
    return arr;
  }

  function move(direction) {
    let changed = false;
    const oldBoard = JSON.stringify(board);

    if (direction === 'LEFT') {
      for (let r = 0; r < 4; r++) {
        board[r] = slide(board[r]);
      }
    } else if (direction === 'RIGHT') {
      for (let r = 0; r < 4; r++) {
        board[r] = slide(board[r].slice().reverse()).reverse();
      }
    } else if (direction === 'UP') {
      for (let c = 0; c < 4; c++) {
        let col = [board[0][c], board[1][c], board[2][c], board[3][c]];
        col = slide(col);
        for (let r = 0; r < 4; r++) board[r][c] = col[r];
      }
    } else if (direction === 'DOWN') {
      for (let c = 0; c < 4; c++) {
        let col = [board[0][c], board[1][c], board[2][c], board[3][c]].reverse();
        col = slide(col).reverse();
        for (let r = 0; r < 4; r++) board[r][c] = col[r];
      }
    }

    if (oldBoard !== JSON.stringify(board)) {
      spawnTile();
      sound.playClick();
      render();
      checkGameOver();
    }
  }

  function checkGameOver() {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (board[r][c] === 0) return;
        if (c < 3 && board[r][c] === board[r][c + 1]) return;
        if (r < 3 && board[r][c] === board[r + 1][c]) return;
      }
    }
    sound.playGameOver();
    if (onGameOver) onGameOver(score);
  }

  const onKey = (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') move('LEFT');
    if (e.code === 'ArrowRight' || e.code === 'KeyD') move('RIGHT');
    if (e.code === 'ArrowUp' || e.code === 'KeyW') move('UP');
    if (e.code === 'ArrowDown' || e.code === 'KeyS') move('DOWN');
  };
  window.addEventListener('keydown', onKey);

  // Swipe support
  let touchX = 0, touchY = 0;
  const onTouchStart = (e) => {
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
  };
  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30) move('RIGHT');
      else if (dx < -30) move('LEFT');
    } else {
      if (dy > 30) move('DOWN');
      else if (dy < -30) move('UP');
    }
  };
  container.addEventListener('touchstart', onTouchStart, { passive: true });
  container.addEventListener('touchend', onTouchEnd, { passive: true });

  // Init
  spawnTile();
  spawnTile();
  render();

  return {
    destroy: () => {
      window.removeEventListener('keydown', onKey);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchend', onTouchEnd);
      container.innerHTML = '';
    }
  };
}
