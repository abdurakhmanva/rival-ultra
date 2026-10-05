// User Profile, Authentication, Level & Stats Engine for RIVAL ULTRA
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'rival_ultra_profile_v1';

export const AVATARS = [
  { id: 'ninja', icon: '🥷', name: 'Neon Ninja' },
  { id: 'cyborg', icon: '🤖', name: 'Cyber Bot' },
  { id: 'wolf', icon: '🐺', name: 'Cyber Wolf' },
  { id: 'crown', icon: '👑', name: 'Apex King' },
  { id: 'bolt', icon: '⚡', name: 'Volt Rider' },
  { id: 'skull', icon: '💀', name: 'Ghost Hacker' }
];

export const RANKS = [
  { minLevel: 1, title: 'Novice Runner', badge: 'BRONZE' },
  { minLevel: 5, title: 'Cyber Striker', badge: 'SILVER' },
  { minLevel: 10, title: 'Arena Master', badge: 'GOLD' },
  { minLevel: 15, title: 'Matrix Legend', badge: 'PLATINUM' },
  { minLevel: 25, title: 'Grand Champion', badge: 'DIAMOND' }
];

export class AuthManager {
  constructor() {
    this.user = this.loadUser();
  }

  loadUser() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error('Error parsing user profile:', e);
      }
    }
    // Default guest profile
    return {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      username: 'Chempion_' + Math.floor(Math.random() * 899 + 100),
      avatar: '🥷',
      xp: 120,
      level: 2,
      coins: 450,
      stats: {
        matchesPlayed: 4,
        totalScore: 1250,
        highScores: {
          drift: 420,
          g2048: 512,
          reflex: 180,
          spacedodge: 350
        }
      },
      achievements: ['first_run', 'fast_learner']
    };
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.user));
  }

  updateProfile(username, avatar) {
    if (username && username.trim().length > 0) {
      this.user.username = username.trim().slice(0, 16);
    }
    if (avatar) {
      this.user.avatar = avatar;
    }
    this.save();
    return this.user;
  }

  addScore(gameId, score) {
    this.user.stats.matchesPlayed = (this.user.stats.matchesPlayed || 0) + 1;
    this.user.stats.totalScore = (this.user.stats.totalScore || 0) + score;

    if (!this.user.stats.highScores) this.user.stats.highScores = {};
    const prevBest = this.user.stats.highScores[gameId] || 0;
    const isNewBest = score > prevBest;
    if (isNewBest) {
      this.user.stats.highScores[gameId] = score;
    }

    // Award XP and Coins proportionally
    const xpEarned = Math.max(10, Math.floor(score * 0.15));
    const coinsEarned = Math.max(5, Math.floor(score * 0.08));

    const leveledUp = this.addXP(xpEarned);
    this.user.coins = (this.user.coins || 0) + coinsEarned;

    this.save();

    return {
      isNewBest,
      xpEarned,
      coinsEarned,
      leveledUp,
      newLevel: this.user.level
    };
  }

  addCoins(amount) {
    this.user.coins = (this.user.coins || 0) + amount;
    this.save();
    return this.user.coins;
  }

  addXP(amount) {
    this.user.xp = (this.user.xp || 0) + amount;
    const oldLevel = this.user.level || 1;
    const newLevel = this.calcLevel(this.user.xp);

    if (newLevel > oldLevel) {
      this.user.level = newLevel;
      // Trigger festive level-up confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
      return true;
    }
    return false;
  }

  calcLevel(xp) {
    // Level formula: Level = floor(sqrt(xp / 40)) + 1
    return Math.floor(Math.sqrt(xp / 40)) + 1;
  }

  getNextLevelXP() {
    const nextLvl = this.user.level;
    return (nextLvl * nextLvl) * 40;
  }

  getCurrentRankTitle() {
    const lvl = this.user.level || 1;
    let rank = RANKS[0];
    for (let r of RANKS) {
      if (lvl >= r.minLevel) rank = r;
    }
    return rank;
  }
}

export const auth = new AuthManager();
