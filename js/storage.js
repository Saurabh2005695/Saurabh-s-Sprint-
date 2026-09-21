/**
 * Saurabh's Sprint - Storage Manager
 * Handles persistent game state via LocalStorage
 */

const Storage = {
  KEYS: {
    HIGH_SCORE: 'ss_highscore',
    TOTAL_COINS: 'ss_total_coins',
    TOTAL_DISTANCE: 'ss_total_distance',
    TOTAL_RUNS: 'ss_total_runs',
    SOUND_ENABLED: 'ss_sound_enabled',
    SELECTED_SKIN: 'ss_selected_skin',
    UNLOCKED_SKINS: 'ss_unlocked_skins',
    UPGRADE_MAGNET: 'ss_upg_magnet',
    UPGRADE_MULTIPLIER: 'ss_upg_multiplier',
    UPGRADE_HOVERBOARD: 'ss_upg_hoverboard',
    UPGRADE_JETPACK: 'ss_upg_jetpack',
    MISSIONS_DATA: 'ss_missions_data',
    STATS_DATA: 'ss_lifetime_stats'
  },

  getHighScore() {
    return parseInt(localStorage.getItem(this.KEYS.HIGH_SCORE) || '0', 10);
  },

  setHighScore(val) {
    if (val > this.getHighScore()) {
      localStorage.setItem(this.KEYS.HIGH_SCORE, Math.floor(val).toString());
      return true; // New record
    }
    return false;
  },

  getTotalCoins() {
    return parseInt(localStorage.getItem(this.KEYS.TOTAL_COINS) || '0', 10);
  },

  addCoins(amount) {
    const current = this.getTotalCoins();
    const updated = current + Math.max(0, Math.floor(amount));
    localStorage.setItem(this.KEYS.TOTAL_COINS, updated.toString());
    this.incrementStat('totalCoinsCollected', amount);
    return updated;
  },

  spendCoins(amount) {
    const current = this.getTotalCoins();
    if (current >= amount) {
      const updated = current - amount;
      localStorage.setItem(this.KEYS.TOTAL_COINS, updated.toString());
      return true;
    }
    return false;
  },

  isSoundEnabled() {
    const val = localStorage.getItem(this.KEYS.SOUND_ENABLED);
    return val === null ? true : val === 'true';
  },

  setSoundEnabled(enabled) {
    localStorage.setItem(this.KEYS.SOUND_ENABLED, enabled.toString());
  },

  getUpgradeLevel(type) {
    const key = this.KEYS['UPGRADE_' + type.toUpperCase()];
    return parseInt(localStorage.getItem(key) || '1', 10);
  },

  setUpgradeLevel(type, level) {
    const key = this.KEYS['UPGRADE_' + type.toUpperCase()];
    localStorage.setItem(key, level.toString());
  },

  // Base duration in seconds + (level * bonus)
  getPowerUpDuration(type) {
    const level = this.getUpgradeLevel(type);
    const baseDurations = {
      magnet: 6,
      multiplier: 8,
      hoverboard: 10,
      jetpack: 6
    };
    const step = 2.0;
    return (baseDurations[type] || 6) + (level - 1) * step;
  },

  getUpgradeCost(type, currentLevel) {
    const baseCosts = {
      magnet: 100,
      multiplier: 150,
      hoverboard: 200,
      jetpack: 300
    };
    return (baseCosts[type] || 100) * currentLevel;
  },

  getSelectedSkin() {
    let skin = localStorage.getItem(this.KEYS.SELECTED_SKIN) || 'saurabh';
    if (skin === 'default') skin = 'saurabh';
    return skin;
  },

  setSelectedSkin(skinId) {
    localStorage.setItem(this.KEYS.SELECTED_SKIN, skinId);
  },

  getUnlockedSkins() {
    try {
      const raw = localStorage.getItem(this.KEYS.UNLOCKED_SKINS);
      let list = raw ? JSON.parse(raw) : ['saurabh'];
      if (!list.includes('saurabh')) list.push('saurabh');
      return list;
    } catch (e) {
      return ['saurabh'];
    }
  },

  unlockSkin(skinId) {
    const list = this.getUnlockedSkins();
    if (!list.includes(skinId)) {
      list.push(skinId);
      localStorage.setItem(this.KEYS.UNLOCKED_SKINS, JSON.stringify(list));
    }
  },

  // Lifetime Statistics
  getStats() {
    try {
      const raw = localStorage.getItem(this.KEYS.STATS_DATA);
      return raw ? JSON.parse(raw) : {
        totalRuns: 0,
        totalDistance: 0,
        totalCoinsCollected: 0,
        totalJumps: 0,
        totalSlides: 0,
        totalHoverboardsUsed: 0,
        totalPowerUpsCollected: 0
      };
    } catch (e) {
      return { totalRuns: 0, totalDistance: 0, totalCoinsCollected: 0, totalJumps: 0, totalSlides: 0, totalHoverboardsUsed: 0, totalPowerUpsCollected: 0 };
    }
  },

  incrementStat(key, amount = 1) {
    const stats = this.getStats();
    stats[key] = (stats[key] || 0) + amount;
    localStorage.setItem(this.KEYS.STATS_DATA, JSON.stringify(stats));
  },

  // Mission State Persistence
  getMissionsData() {
    try {
      const raw = localStorage.getItem(this.KEYS.MISSIONS_DATA);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  },

  saveMissionsData(data) {
    localStorage.setItem(this.KEYS.MISSIONS_DATA, JSON.stringify(data));
  }
};
