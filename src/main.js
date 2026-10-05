import './style.css';
import { Hero3DScene } from './hero3d.js';
import { sound } from './audio.js';
import { auth, AVATARS } from './auth.js';
import { leaderboard } from './leaderboard.js';
import { GAMES_CATALOG } from './games/index.js';
import confetti from 'canvas-confetti';

// 1. Initialize 3D Hero Scene
const heroContainer = document.getElementById('hero-3d-container');
new Hero3DScene(heroContainer);

// 2. DOM Elements
const topAvatar = document.getElementById('top-avatar');
const topUsername = document.getElementById('top-username');
const topLevel = document.getElementById('top-level');
const topCoins = document.getElementById('top-coins');
const btnSound = document.getElementById('btn-sound');
const topUserPill = document.getElementById('top-user-pill');

// Views
const navPills = document.querySelectorAll('.nav-pill');
const appViews = document.querySelectorAll('.app-view');

// Game Modal Elements
const gameModal = document.getElementById('game-modal');
const activeGameContainer = document.getElementById('active-game-container');
const gmTitle = document.getElementById('gm-title');
const gmIcon = document.getElementById('gm-icon');
const gmCategory = document.getElementById('gm-category');
const gmLiveScore = document.getElementById('gm-live-score');
const btnCloseGame = document.getElementById('btn-close-game');

// Game Result Elements
const inGameOverOverlay = document.getElementById('in-gameover-overlay');
const resScore = document.getElementById('res-score');
const resBestBanner = document.getElementById('res-best-banner');
const resXP = document.getElementById('res-xp');
const resCoins = document.getElementById('res-coins');
const btnRetryGame = document.getElementById('btn-retry-game');
const btnQuitGame = document.getElementById('btn-quit-game');

// Profile Elements
const profileAvatarDisplay = document.getElementById('profile-avatar-display');
const profileNameDisplay = document.getElementById('profile-name-display');
const profileTierBadge = document.getElementById('profile-tier-badge');
const profileLevelDisplay = document.getElementById('profile-level-display');
const profileXpDisplay = document.getElementById('profile-xp-display');
const profileXpBar = document.getElementById('profile-xp-bar');
const profileCoinsDisplay = document.getElementById('profile-coins-display');
const statTotalMatches = document.getElementById('stat-total-matches');
const statTotalScore = document.getElementById('stat-total-score');
const profileRecordsList = document.getElementById('profile-records-list');

// Profile Edit Modal
const editProfileModal = document.getElementById('edit-profile-modal');
const avatarOptionsGrid = document.getElementById('avatar-options-grid');
const editUsernameInput = document.getElementById('edit-username-input');
const btnSaveProfile = document.getElementById('btn-save-profile');
const btnCloseEditModal = document.getElementById('btn-close-edit-modal');
const btnEditAvatar = document.getElementById('btn-edit-avatar');
const btnEditUsername = document.getElementById('btn-edit-username');

// Leaderboard Elements
const podiumCards = document.getElementById('podium-cards');
const leaderboardTbody = document.getElementById('leaderboard-tbody');
const lbFilterPills = document.querySelectorAll('.filter-pill');

// Rewards
const btnClaimReward = document.getElementById('btn-claim-reward');

// Active Game Tracker
let currentGame = null;
let currentGameDef = null;

// ==========================================
// 3. UI SYNC & PROFILE
// ==========================================

function syncUserUI() {
  const user = auth.user;
  const rank = auth.getCurrentRankTitle();

  topAvatar.textContent = user.avatar;
  topUsername.textContent = user.username;
  topLevel.textContent = `LVL ${user.level}`;
  topCoins.textContent = (user.coins || 0).toLocaleString();

  // Profile View
  profileAvatarDisplay.textContent = user.avatar;
  profileNameDisplay.textContent = user.username;
  profileTierBadge.textContent = `${rank.badge} • ${rank.title.toUpperCase()}`;
  profileTierBadge.className = `tier-pill tier-${rank.badge}`;

  profileLevelDisplay.textContent = `DARAJA ${user.level}`;
  const nextXP = auth.getNextLevelXP();
  profileXpDisplay.textContent = `${user.xp} / ${nextXP} XP`;
  const pct = Math.min(100, Math.floor((user.xp / nextXP) * 100));
  profileXpBar.style.width = `${pct}%`;

  profileCoinsDisplay.textContent = (user.coins || 0).toLocaleString();
  statTotalMatches.textContent = user.stats.matchesPlayed || 0;
  statTotalScore.textContent = (user.stats.totalScore || 0).toLocaleString();

  // Records Grid
  renderProfileRecords();
}

function renderProfileRecords() {
  const user = auth.user;
  const highs = user.stats.highScores || {};
  let html = '';

  GAMES_CATALOG.forEach(g => {
    const s = highs[g.id] || 0;
    html += `
      <div class="record-pill">
        <span class="rec-title">${g.icon} ${g.title}</span>
        <strong class="rec-score">${s.toLocaleString()}</strong>
      </div>
    `;
  });

  profileRecordsList.innerHTML = html;
}

// ==========================================
// 4. NAVIGATION
// ==========================================

navPills.forEach(pill => {
  pill.addEventListener('click', () => {
    sound.playClick();
    const target = pill.dataset.view;

    navPills.forEach(p => p.classList.remove('is-active'));
    pill.classList.add('is-active');

    appViews.forEach(v => {
      if (v.id === `view-${target}`) {
        v.classList.add('active');
      } else {
        v.classList.remove('active');
      }
    });

    if (target === 'leaderboard') {
      renderLeaderboard('all');
    } else if (target === 'profile') {
      syncUserUI();
    }
  });
});

// ==========================================
// 5. CARTRIDGE RACK RENDERING
// ==========================================

const cartridgeGrid = document.getElementById('cartridge-grid');

function renderCartridges() {
  const user = auth.user;
  const highs = user.stats.highScores || {};
  let html = '';

  GAMES_CATALOG.forEach(g => {
    const best = highs[g.id] || 0;
    html += `
      <div class="cartridge-card" data-id="${g.id}">
        <div class="cart-top">
          <div class="cart-icon-wrap" style="color: ${g.accent};">
            ${g.icon}
          </div>
          <span class="cart-badge">${g.badge}</span>
        </div>

        <div class="cart-info">
          <h3 class="cart-title">${g.title}</h3>
          <span class="cart-cat">${g.category}</span>
          <p class="cart-desc">${g.desc}</p>
        </div>

        <div class="cart-bottom">
          <div class="cart-best">
            <span class="cart-best-lbl">ENG YAXSHI REKORD</span>
            <strong class="cart-best-val">${best.toLocaleString()}</strong>
          </div>
          <button class="btn-play-cart" data-play="${g.id}">O‘YNASh</button>
        </div>
      </div>
    `;
  });

  cartridgeGrid.innerHTML = html;

  // Add click handlers
  cartridgeGrid.querySelectorAll('.btn-play-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const gameId = btn.dataset.play;
      openGame(gameId);
    });
  });

  // Card 3D tilt effect on hover
  cartridgeGrid.querySelectorAll('.cartridge-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      card.style.transform = `perspective(1000px) rotateX(${-y * 0.04}deg) rotateY(${x * 0.04}deg) translateY(-8px) scale(1.02)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ==========================================
// 6. GAME LAUNCHER & CONTROLLER
// ==========================================

function openGame(gameId) {
  const gDef = GAMES_CATALOG.find(g => g.id === gameId);
  if (!gDef) return;

  sound.playLaunch();
  currentGameDef = gDef;

  gmTitle.textContent = gDef.title;
  gmIcon.textContent = gDef.icon;
  gmCategory.textContent = gDef.category;
  gmLiveScore.textContent = '0';

  if (currentGame) {
    try { currentGame.destroy(); } catch (e) {}
    currentGame = null;
  }
  activeGameContainer.innerHTML = '';

  inGameOverOverlay.classList.add('hidden');
  gameModal.classList.remove('hidden');

  // Force layout reflow
  void gameModal.offsetHeight;
  void activeGameContainer.offsetHeight;

  // Launch game on next frame
  requestAnimationFrame(() => {
    try {
      currentGame = gDef.launcher(
        activeGameContainer,
        (finalScore) => handleGameOver(finalScore),
        (liveScore) => {
          gmLiveScore.textContent = liveScore.toLocaleString();
        }
      );
    } catch (err) {
      console.error('Error launching game:', err);
    }
  });
}

function handleGameOver(finalScore) {
  sound.playGameOver();
  const res = auth.addScore(currentGameDef.id, finalScore);
  syncUserUI();

  resScore.textContent = finalScore.toLocaleString();
  resXP.textContent = `+${res.xpEarned} XP`;
  resCoins.textContent = `+${res.coinsEarned} 🪙`;

  if (res.isNewBest) {
    resBestBanner.classList.remove('hidden');
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.5 } });
  } else {
    resBestBanner.classList.add('hidden');
  }

  if (res.leveledUp) {
    sound.playLevelUp();
  }

  inGameOverOverlay.classList.remove('hidden');
  renderCartridges();
}

function closeGame() {
  if (currentGame) {
    currentGame.destroy();
    currentGame = null;
  }
  activeGameContainer.innerHTML = '';
  gameModal.classList.add('hidden');
  inGameOverOverlay.classList.add('hidden');
}

btnCloseGame.addEventListener('click', closeGame);
btnQuitGame.addEventListener('click', closeGame);

btnRetryGame.addEventListener('click', () => {
  if (currentGameDef) {
    openGame(currentGameDef.id);
  }
});

// ESC key to close game
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !gameModal.classList.contains('hidden')) {
    closeGame();
  }
});

// ==========================================
// 7. LEADERBOARD SYSTEM
// ==========================================

function renderLeaderboard(category = 'all') {
  const data = leaderboard.getRankings(category);

  // 1. Top 3 Podium
  const top3 = data.list.slice(0, 3);
  let podHtml = '';
  const medals = ['🥇', '🥈', '🥉'];

  top3.forEach((item, idx) => {
    podHtml += `
      <div class="podium-card rank-${idx + 1}">
        <span class="podium-crown">${medals[idx]}</span>
        <div class="podium-avatar">${item.avatar}</div>
        <strong class="podium-name">${item.name}</strong>
        <span class="tier-tag tier-${item.badge}">${item.badge}</span>
        <span class="podium-score">${item.score.toLocaleString()}</span>
      </div>
    `;
  });
  podiumCards.innerHTML = podHtml;

  // 2. Full Table
  let tbHtml = '';
  data.list.forEach((item, idx) => {
    const isMe = item.isCurrentUser;
    tbHtml += `
      <tr class="${isMe ? 'current-user-row' : ''}">
        <td><strong>#${idx + 1}</strong></td>
        <td>
          <div class="player-cell">
            <span class="player-avatar-mini">${item.avatar}</span>
            <div>
              <strong>${item.name}</strong> ${isMe ? '<span class="tier-tag tier-GOLD">SIZ</span>' : ''}
            </div>
          </div>
        </td>
        <td><span class="tier-tag tier-${item.badge}">${item.badge}</span></td>
        <td>LVL ${item.level}</td>
        <td class="text-right"><strong class="accent-gold">${item.score.toLocaleString()}</strong></td>
      </tr>
    `;
  });
  leaderboardTbody.innerHTML = tbHtml;
}

lbFilterPills.forEach(pill => {
  pill.addEventListener('click', () => {
    sound.playClick();
    lbFilterPills.forEach(p => p.classList.remove('is-active'));
    pill.classList.add('is-active');
    renderLeaderboard(pill.dataset.cat);
  });
});

// ==========================================
// 8. PROFILE EDIT MODAL
// ==========================================

let selectedAvatar = auth.user.avatar;

function openEditModal() {
  sound.playClick();
  selectedAvatar = auth.user.avatar;
  editUsernameInput.value = auth.user.username;

  let avHtml = '';
  AVATARS.forEach(a => {
    const isSel = a.icon === selectedAvatar;
    avHtml += `
      <button class="avatar-opt-btn ${isSel ? 'selected' : ''}" data-icon="${a.icon}">
        ${a.icon}
      </button>
    `;
  });
  avatarOptionsGrid.innerHTML = avHtml;

  avatarOptionsGrid.querySelectorAll('.avatar-opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      avatarOptionsGrid.querySelectorAll('.avatar-opt-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedAvatar = btn.dataset.icon;
    });
  });

  editProfileModal.classList.remove('hidden');
}

topUserPill.addEventListener('click', openEditModal);
btnEditAvatar.addEventListener('click', openEditModal);
btnEditUsername.addEventListener('click', openEditModal);

btnCloseEditModal.addEventListener('click', () => {
  editProfileModal.classList.add('hidden');
});

btnSaveProfile.addEventListener('click', () => {
  sound.playScore();
  const newName = editUsernameInput.value.trim();
  auth.updateProfile(newName, selectedAvatar);
  syncUserUI();
  renderLeaderboard();
  editProfileModal.classList.add('hidden');
});

// ==========================================
// 9. DAILY REWARD CLAIM
// ==========================================

btnClaimReward.addEventListener('click', () => {
  sound.playLevelUp();
  auth.addCoins(200);
  auth.addXP(100);
  syncUserUI();
  btnClaimReward.textContent = 'OLINDI ✓';
  btnClaimReward.disabled = true;
  btnClaimReward.classList.remove('pulse-glow');
  confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
});

// 10. Sound Toggle
btnSound.addEventListener('click', () => {
  const isMuted = sound.toggleMute();
  btnSound.textContent = isMuted ? '🔇' : '🔊';
});

// ==========================================
// 11. BOOTSTRAP
// ==========================================

syncUserUI();
renderCartridges();
