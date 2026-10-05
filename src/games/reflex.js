// REFLEX MATRIX — Precision Reaction Time & Speed Click Game
import { sound } from '../audio.js';

export function launchReflex(container, onGameOver, onScoreUpdate) {
  let score = 0;
  let combo = 0;
  let lives = 3;
  let activeIndex = -1;
  let spawnTime = 0;
  let timeoutId = null;
  let isRunning = true;
  let difficultyTime = 1200; // ms

  container.innerHTML = `
    <div class="reflex-wrap">
      <div class="reflex-header">
        <div class="reflex-stat">OCHKO: <strong id="rf-score">0</strong></div>
        <div class="reflex-stat">KOMBO: <strong id="rf-combo" class="accent-cyan">x1</strong></div>
        <div class="reflex-stat">JONLAR: <strong id="rf-lives" class="accent-red">❤️❤️❤️</strong></div>
      </div>
      <div class="reflex-grid" id="rf-grid"></div>
      <div class="reflex-timer-bar-wrap">
        <div class="reflex-timer-bar" id="rf-bar"></div>
      </div>
    </div>
  `;

  const gridEl = container.querySelector('#rf-grid');
  const scoreEl = container.querySelector('#rf-score');
  const comboEl = container.querySelector('#rf-combo');
  const livesEl = container.querySelector('#rf-lives');
  const barEl = container.querySelector('#rf-bar');

  // Create 12 Nodes (4x3 grid)
  const nodes = [];
  for (let i = 0; i < 12; i++) {
    const btn = document.createElement('button');
    btn.className = 'reflex-node';
    btn.dataset.index = i;
    btn.addEventListener('click', () => handleNodeClick(i));
    gridEl.appendChild(btn);
    nodes.push(btn);
  }

  function nextTarget() {
    if (!isRunning) return;

    // Reset old node
    if (activeIndex !== -1) {
      nodes[activeIndex].classList.remove('active', 'hot');
    }

    // Pick new random node
    let next = Math.floor(Math.random() * 12);
    while (next === activeIndex) next = Math.floor(Math.random() * 12);
    activeIndex = next;

    const node = nodes[activeIndex];
    node.classList.add('active');
    if (Math.random() > 0.6) node.classList.add('hot'); // Bonus node

    spawnTime = performance.now();
    difficultyTime = Math.max(450, 1100 - score * 0.4);

    // Animate countdown bar
    barEl.style.transition = 'none';
    barEl.style.width = '100%';
    setTimeout(() => {
      barEl.style.transition = `width ${difficultyTime}ms linear`;
      barEl.style.width = '0%';
    }, 20);

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      // Missed!
      handleMiss();
    }, difficultyTime);
  }

  function handleNodeClick(index) {
    if (!isRunning) return;

    if (index === activeIndex) {
      clearTimeout(timeoutId);
      const reactionMs = Math.round(performance.now() - spawnTime);
      combo++;
      const isHot = nodes[index].classList.contains('hot');
      const points = Math.max(10, Math.floor((1200 - reactionMs) * 0.1)) * (isHot ? 2 : 1) * Math.min(5, combo);
      score += points;

      sound.playClick();
      scoreEl.textContent = score;
      comboEl.textContent = `x${combo}`;
      if (onScoreUpdate) onScoreUpdate(score);

      nextTarget();
    } else {
      handleMiss();
    }
  }

  function handleMiss() {
    if (!isRunning) return;
    lives--;
    combo = 0;
    comboEl.textContent = 'x1';
    livesEl.textContent = '❤️'.repeat(Math.max(0, lives));
    sound.playGameOver();

    if (lives <= 0) {
      isRunning = false;
      clearTimeout(timeoutId);
      if (onGameOver) onGameOver(score);
    } else {
      nextTarget();
    }
  }

  nextTarget();

  return {
    destroy: () => {
      isRunning = false;
      clearTimeout(timeoutId);
      container.innerHTML = '';
    }
  };
}
