// Global Leaderboard & Tournament Ladder for RIVAL ULTRA
import { auth } from './auth.js';

const STORAGE_KEY = 'rival_ultra_leaderboard_v1';

const INITIAL_RIVALS = [
  { id: 'bot_1', name: 'ZeroCool', avatar: '👑', score: 14820, drift: 3200, g2048: 8192, reflex: 450, spacedodge: 2980, level: 28, badge: 'DIAMOND' },
  { id: 'bot_2', name: 'CyberValkyrie', avatar: '⚡', score: 12450, drift: 2850, g2048: 4096, reflex: 510, spacedodge: 3100, level: 24, badge: 'PLATINUM' },
  { id: 'bot_3', name: 'ShadowRunner', avatar: '🐺', score: 9800, drift: 2400, g2048: 2048, reflex: 480, spacedodge: 2450, level: 19, badge: 'PLATINUM' },
  { id: 'bot_4', name: 'AeroBlade', avatar: '🥷', score: 8150, drift: 2100, g2048: 2048, reflex: 390, spacedodge: 1850, level: 16, badge: 'GOLD' },
  { id: 'bot_5', name: 'QuantumByte', avatar: '🤖', score: 6900, drift: 1650, g2048: 1024, reflex: 420, spacedodge: 1720, level: 14, badge: 'GOLD' },
  { id: 'bot_6', name: 'MatrixGlitch', avatar: '💀', score: 5400, drift: 1400, g2048: 1024, reflex: 360, spacedodge: 1250, level: 11, badge: 'GOLD' },
  { id: 'bot_7', name: 'NeonPulse', avatar: '⚡', score: 4100, drift: 950, g2048: 512, reflex: 310, spacedodge: 980, level: 8, badge: 'SILVER' },
  { id: 'bot_8', name: 'VoltStriker', avatar: '🤖', score: 3250, drift: 800, g2048: 512, reflex: 280, spacedodge: 750, level: 6, badge: 'SILVER' },
  { id: 'bot_9', name: 'EchoPhantom', avatar: '🥷', score: 2100, drift: 550, g2048: 256, reflex: 240, spacedodge: 520, level: 4, badge: 'BRONZE' }
];

export class LeaderboardManager {
  constructor() {
    this.rivals = this.loadRivals();
  }

  loadRivals() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {}
    }
    this.saveRivals(INITIAL_RIVALS);
    return INITIAL_RIVALS;
  }

  saveRivals(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  getRankings(category = 'all') {
    const user = auth.user;
    const userRankInfo = auth.getCurrentRankTitle();

    let userScore = 0;
    if (category === 'all') {
      userScore = user.stats.totalScore || 0;
    } else {
      userScore = (user.stats.highScores && user.stats.highScores[category]) || 0;
    }

    const userEntry = {
      id: user.id,
      name: user.username,
      avatar: user.avatar,
      score: userScore,
      level: user.level,
      badge: userRankInfo.badge,
      isCurrentUser: true
    };

    // Combine rivals and current user
    const list = this.rivals.map(r => {
      let rScore = 0;
      if (category === 'all') {
        rScore = r.score;
      } else {
        rScore = r[category] || Math.floor(r.score * 0.25);
      }
      return {
        id: r.id,
        name: r.name,
        avatar: r.avatar,
        score: rScore,
        level: r.level,
        badge: r.badge,
        isCurrentUser: false
      };
    });

    list.push(userEntry);

    // Sort by score descending
    list.sort((a, b) => b.score - a.score);

    // Find user's index
    const userRank = list.findIndex(item => item.isCurrentUser) + 1;

    return {
      category,
      list,
      userRank,
      totalPlayers: list.length
    };
  }
}

export const leaderboard = new LeaderboardManager();
