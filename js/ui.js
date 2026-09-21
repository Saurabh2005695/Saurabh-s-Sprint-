/**
 * Saurabh's Sprint - User Interface & Screen Manager
 */

class UIManager {
  constructor(game) {
    this.game = game;

    // DOM Elements
    this.hud = document.getElementById('hud');
    this.startScreen = document.getElementById('start-screen');
    this.gameoverScreen = document.getElementById('gameover-screen');
    this.pauseScreen = document.getElementById('pause-screen');
    this.reviveModal = document.getElementById('revive-modal');

    // Modals
    this.shopModal = document.getElementById('shop-modal');
    this.skinsModal = document.getElementById('skins-modal');
    this.missionsModal = document.getElementById('missions-modal');
    this.helpModal = document.getElementById('help-modal');
    this.installModal = document.getElementById('install-modal');

    // HUD Stats
    this.hudScore = document.getElementById('hud-score');
    this.hudHighscore = document.getElementById('hud-highscore');
    this.hudCoins = document.getElementById('hud-coins');
    this.multiplierBadge = document.getElementById('multiplier-badge');

    // Power-up bars
    this.magnetBar = document.getElementById('magnet-bar');
    this.magnetFill = document.getElementById('magnet-fill');
    this.multiplierBar = document.getElementById('multiplier-bar');
    this.multiplierFill = document.getElementById('multiplier-fill');
    this.hoverboardBar = document.getElementById('hoverboard-bar');
    this.hoverboardFill = document.getElementById('hoverboard-fill');
    this.jetpackBar = document.getElementById('jetpack-bar');
    this.jetpackFill = document.getElementById('jetpack-fill');

    // Revive elements
    this.reviveCountdown = document.getElementById('revive-countdown');
    this.reviveInterval = null;

    // PWA Install Elements
    this.deferredPrompt = null;
    this.pwaBanner = document.getElementById('pwa-install-container');
    this.btnInstallPwa = document.getElementById('btn-install-pwa');

    // Character Switcher State
    this.characterKeys = ['saurabh', 'rishav', 'jaishika', 'kashish', 'bhoomi', 'muskaan', 'nikhil', 'vicky', 'aditya'];
    const currentSkin = Storage.getSelectedSkin();
    this.currentCharIndex = Math.max(0, this.characterKeys.indexOf(currentSkin));

    this.initSoundUI();
    this.bindEvents();
    this.refreshMenuStats();
    this.updateHomeCharacterCard();
    this.setupPWAInstall();
  }

  initSoundUI() {
    const enabled = Storage.isSoundEnabled();
    const soundIcon = document.getElementById('sound-icon');
    const soundText = document.getElementById('sound-text');
    if (soundIcon && soundText) {
      soundIcon.textContent = enabled ? 'ON' : 'OFF';
      soundText.textContent = enabled ? 'SOUND ON' : 'MUTED';
    }
  }

  updateHomeCharacterCard() {
    const charKey = this.characterKeys[this.currentCharIndex] || 'saurabh';
    const charData = this.game.player.skins[charKey];
    if (!charData) return;

    const unlocked = Storage.getUnlockedSkins();
    const selected = Storage.getSelectedSkin();
    const isUnlocked = unlocked.includes(charKey);
    const isSelected = selected === charKey;

    const genderEl = document.getElementById('home-char-gender');
    const avatarEl = document.getElementById('home-char-avatar');
    const nameEl = document.getElementById('home-char-name');
    const btnEl = document.getElementById('home-char-btn');

    if (genderEl) {
      genderEl.textContent = charData.gender === 'female' ? 'GIRL' : 'BOY';
      genderEl.className = 'gender-tag ' + (charData.gender === 'female' ? 'gender-girl' : 'gender-boy');
    }
    if (avatarEl) avatarEl.textContent = charData.avatar || charData.name[0];
    if (nameEl) nameEl.textContent = charData.name.split(' ')[0]; // E.g. "Jaishika"

    if (btnEl) {
      if (isSelected) {
        btnEl.textContent = 'EQUIPPED';
        btnEl.className = 'btn-home-equip equipped';
      } else if (isUnlocked) {
        btnEl.textContent = 'EQUIP';
        btnEl.className = 'btn-home-equip can-equip';
      } else {
        btnEl.textContent = `${charData.cost} C UNLOCK`;
        btnEl.className = 'btn-home-equip unlock';
      }

      btnEl.onclick = () => {
        if (isUnlocked) {
          Storage.setSelectedSkin(charKey);
          this.game.player.applySkin(charKey);
          Audio.playButtonClick();
          this.updateHomeCharacterCard();
          this.renderSkins();
        } else {
          if (Storage.spendCoins(charData.cost)) {
            Storage.unlockSkin(charKey);
            Storage.setSelectedSkin(charKey);
            this.game.player.applySkin(charKey);
            Audio.playPowerUp();
            this.updateHomeCharacterCard();
            this.renderSkins();
            this.refreshMenuStats();
          } else {
            alert(`Need ${charData.cost} coins to unlock ${charData.name.split(' ')[0]}! Run and collect more coins!`);
          }
        }
      };
    }

    // Apply preview skin in 3D right away
    this.game.player.applySkin(charKey);
  }

  bindEvents() {
    // Character Quick Switcher Buttons
    const btnPrevChar = document.getElementById('btn-prev-char');
    if (btnPrevChar) {
      btnPrevChar.addEventListener('click', () => {
        Audio.playWhoosh();
        this.currentCharIndex = (this.currentCharIndex - 1 + this.characterKeys.length) % this.characterKeys.length;
        this.updateHomeCharacterCard();
      });
    }

    const btnNextChar = document.getElementById('btn-next-char');
    if (btnNextChar) {
      btnNextChar.addEventListener('click', () => {
        Audio.playWhoosh();
        this.currentCharIndex = (this.currentCharIndex + 1) % this.characterKeys.length;
        this.updateHomeCharacterCard();
      });
    }

    // Start Game Button
    document.getElementById('btn-start').addEventListener('click', () => {
      // Ensure the selected skin is equipped
      const charKey = this.characterKeys[this.currentCharIndex] || 'saurabh';
      const unlocked = Storage.getUnlockedSkins();
      if (unlocked.includes(charKey)) {
        Storage.setSelectedSkin(charKey);
      }
      Audio.playButtonClick();
      this.game.startGame();
    });

    // Pause & Resume
    document.getElementById('btn-pause').addEventListener('click', () => {
      Audio.playButtonClick();
      this.game.togglePause();
    });
    document.getElementById('btn-resume').addEventListener('click', () => {
      Audio.playButtonClick();
      this.game.togglePause();
    });
    document.getElementById('btn-quit-to-menu').addEventListener('click', () => {
      Audio.playButtonClick();
      this.game.quitToMenu();
    });

    // Game Over Buttons
    document.getElementById('btn-restart').addEventListener('click', () => {
      Audio.playButtonClick();
      this.game.startGame();
    });
    document.getElementById('btn-go-shop').addEventListener('click', () => {
      Audio.playButtonClick();
      this.showModal(this.shopModal);
      this.renderShop();
    });
    document.getElementById('btn-go-menu').addEventListener('click', () => {
      Audio.playButtonClick();
      this.game.quitToMenu();
    });

    // Main Menu Action Grid
    document.getElementById('btn-open-shop').addEventListener('click', () => {
      Audio.playButtonClick();
      this.showModal(this.shopModal);
      this.renderShop();
    });
    document.getElementById('btn-open-skins').addEventListener('click', () => {
      Audio.playButtonClick();
      this.showModal(this.skinsModal);
      this.renderSkins();
    });
    const btnMissions = document.getElementById('btn-open-missions');
    if (btnMissions) {
      btnMissions.addEventListener('click', () => {
        Audio.playButtonClick();
        this.showModal(this.missionsModal);
        this.renderMissions();
      });
    }
    const btnHelp = document.getElementById('btn-open-help');
    if (btnHelp) {
      btnHelp.addEventListener('click', () => {
        Audio.playButtonClick();
        this.showModal(this.helpModal);
      });
    }

    // Install App Buttons (Header, Grid Action, Banner)
    const btnOpenInstall = document.getElementById('btn-open-install');
    if (btnOpenInstall) {
      btnOpenInstall.addEventListener('click', () => {
        Audio.playButtonClick();
        this.openInstallModal();
      });
    }

    const btnHeaderInstall = document.getElementById('btn-header-install');
    if (btnHeaderInstall) {
      btnHeaderInstall.addEventListener('click', () => {
        Audio.playButtonClick();
        this.openInstallModal();
      });
    }

    // Sound Toggle
    const btnSound = document.getElementById('btn-toggle-sound');
    const soundIcon = document.getElementById('sound-icon');
    const soundText = document.getElementById('sound-text');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const enabled = Audio.toggleSound();
        soundIcon.textContent = enabled ? '🔊' : '🔇';
        soundText.textContent = enabled ? 'SOUND ON' : 'MUTED';
      });
    }

    // Close Modals
    document.getElementById('btn-close-shop')?.addEventListener('click', () => this.hideModal(this.shopModal));
    document.getElementById('btn-close-skins')?.addEventListener('click', () => this.hideModal(this.skinsModal));
    document.getElementById('btn-close-missions')?.addEventListener('click', () => this.hideModal(this.missionsModal));
    document.getElementById('btn-close-help')?.addEventListener('click', () => this.hideModal(this.helpModal));
    document.getElementById('btn-close-install')?.addEventListener('click', () => this.hideModal(this.installModal));

    // Install Modal Platform Tabs
    const tabButtons = document.querySelectorAll('.install-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.switchInstallTab(tab);
      });
    });

    // Android Modal Direct One-Click Install Button
    const btnModalInstallAction = document.getElementById('btn-modal-install-action');
    if (btnModalInstallAction) {
      btnModalInstallAction.addEventListener('click', () => {
        this.triggerNativeInstallPrompt();
      });
    }

    // Shop Upgrade Buttons
    const upgradeButtons = document.querySelectorAll('.btn-buy');
    upgradeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        this.handleUpgrade(type);
      });
    });

    // Revive Actions
    const btnReviveAction = document.getElementById('btn-revive-action');
    if (btnReviveAction) {
      btnReviveAction.addEventListener('click', () => {
        this.handleRevive();
      });
    }
    const btnReviveSkip = document.getElementById('btn-revive-skip');
    if (btnReviveSkip) {
      btnReviveSkip.addEventListener('click', () => {
        this.endReviveCountdown(false);
      });
    }
  }

  detectPlatform() {
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    return 'pc';
  }

  openInstallModal(preferredTab) {
    const platform = preferredTab || this.detectPlatform();
    this.switchInstallTab(platform);
    this.showModal(this.installModal);
  }

  switchInstallTab(tabName) {
    const tabButtons = document.querySelectorAll('.install-tab-btn');
    const tabContents = document.querySelectorAll('.install-tab-content');

    tabButtons.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    tabContents.forEach(content => {
      if (content.id === `tab-content-${tabName}`) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
  }

  async triggerNativeInstallPrompt() {
    if (this.deferredPrompt) {
      try {
        this.deferredPrompt.prompt();
        const choice = await this.deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          if (this.pwaBanner) this.pwaBanner.classList.add('hidden');
          const headerBtn = document.getElementById('btn-header-install');
          if (headerBtn) headerBtn.style.display = 'none';
          this.hideModal(this.installModal);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
      this.deferredPrompt = null;
    } else {
      alert('To Install on Android:\n1. Tap the 3-dot menu (⋮) at the top right of Chrome.\n2. Tap "Install App" or "Add to Home screen"!\n\nOnce installed, Saurabh\'s Sprint works completely offline with high speed!');
    }
  }

  setupPWAInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      if (this.pwaBanner) {
        this.pwaBanner.classList.remove('hidden');
      }
    });

    // Check if already running as installed standalone app
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
      if (this.pwaBanner) this.pwaBanner.classList.add('hidden');
      const headerBtn = document.getElementById('btn-header-install');
      if (headerBtn) headerBtn.style.display = 'none';
      const openInstallBtn = document.getElementById('btn-open-install');
      if (openInstallBtn) {
        openInstallBtn.innerHTML = '<span class="action-text-main" style="color:#059669">INSTALLED</span><span class="action-text">OFFLINE READY</span>';
      }
    } else {
      if (this.pwaBanner) this.pwaBanner.classList.remove('hidden');
    }

    if (this.btnInstallPwa) {
      this.btnInstallPwa.addEventListener('click', async () => {
        if (this.deferredPrompt) {
          await this.triggerNativeInstallPrompt();
        } else {
          this.openInstallModal();
        }
      });
    }
  }

  showScreen(screen) {
    [this.startScreen, this.gameoverScreen, this.pauseScreen, this.reviveModal].forEach(s => {
      if (s) {
        s.classList.remove('menu-active');
        s.classList.add('menu-hidden');
      }
    });

    if (screen) {
      screen.classList.remove('menu-hidden');
      screen.classList.add('menu-active');
    }
  }

  showHUD(show) {
    if (show) {
      this.hud.classList.remove('hud-hidden');
      this.hud.classList.add('menu-active');
    } else {
      this.hud.classList.remove('menu-active');
      this.hud.classList.add('hud-hidden');
    }
  }

  showModal(modal) {
    if (!modal) return;
    modal.classList.remove('menu-hidden');
    modal.classList.add('menu-active');
  }

  hideModal(modal) {
    if (!modal) return;
    modal.classList.remove('menu-active');
    modal.classList.add('menu-hidden');
    this.refreshMenuStats();
  }

  updateHUD(score, coins, multiplier, player) {
    this.hudScore.textContent = Math.floor(score);
    this.hudCoins.textContent = coins;
    this.hudHighscore.textContent = Storage.getHighScore();

    const effectiveMult = multiplier * (player.hasMultiplier ? 2 : 1);
    this.multiplierBadge.textContent = effectiveMult + 'X';
    if (player.hasMultiplier) {
      this.multiplierBadge.classList.add('multiplier-boosted');
    } else {
      this.multiplierBadge.classList.remove('multiplier-boosted');
    }

    // Power-Up Progress Bars
    this.updatePowerUpBar(this.magnetBar, this.magnetFill, player.hasMagnet, player.magnetTimer, Storage.getPowerUpDuration('magnet'));
    this.updatePowerUpBar(this.multiplierBar, this.multiplierFill, player.hasMultiplier, player.multiplierTimer, Storage.getPowerUpDuration('multiplier'));
    this.updatePowerUpBar(this.hoverboardBar, this.hoverboardFill, player.hasHoverboard, player.hoverboardTimer, Storage.getPowerUpDuration('hoverboard'));
    this.updatePowerUpBar(this.jetpackBar, this.jetpackFill, player.hasJetpack, player.jetpackTimer, Storage.getPowerUpDuration('jetpack'));
  }

  updatePowerUpBar(barElem, fillElem, active, timer, maxDuration) {
    if (!barElem || !fillElem) return;
    if (active && timer > 0) {
      barElem.classList.remove('hidden');
      const pct = Math.max(0, Math.min(100, (timer / maxDuration) * 100));
      fillElem.style.width = pct + '%';
    } else {
      barElem.classList.add('hidden');
    }
  }

  // --- REVIVE MODAL COUNTDOWN ---
  startReviveOffer(score, coins, distance, onRevive, onSkip) {
    this.onReviveCallback = onRevive;
    this.onSkipCallback = onSkip;

    let countdown = 3;
    if (this.reviveCountdown) this.reviveCountdown.textContent = countdown;

    this.showScreen(this.reviveModal);

    if (this.reviveInterval) clearInterval(this.reviveInterval);
    this.reviveInterval = setInterval(() => {
      countdown--;
      if (this.reviveCountdown) this.reviveCountdown.textContent = countdown;
      if (countdown <= 0) {
        this.endReviveCountdown(false);
      }
    }, 1000);
  }

  handleRevive() {
    const cost = 50;
    if (Storage.spendCoins(cost)) {
      if (this.reviveInterval) clearInterval(this.reviveInterval);
      this.showScreen(null);
      this.showHUD(true);
      Audio.playRevive();
      if (this.onReviveCallback) this.onReviveCallback();
    } else {
      alert('Need 50 coins to revive! Collect more in your next sprint');
      this.endReviveCountdown(false);
    }
  }

  endReviveCountdown(didRevive = false) {
    if (this.reviveInterval) {
      clearInterval(this.reviveInterval);
      this.reviveInterval = null;
    }
    if (!didRevive) {
      if (this.onSkipCallback) this.onSkipCallback();
    }
  }

  showGameOver(score, coinsEarned, distance) {
    const isNewHigh = Storage.setHighScore(score);
    Storage.addCoins(coinsEarned);

    // Increment lifetime stats
    Storage.incrementStat('totalRuns', 1);
    Storage.incrementStat('totalDistance', Math.floor(distance));

    document.getElementById('result-score').textContent = Math.floor(score);
    document.getElementById('result-coins').textContent = '+' + coinsEarned;
    document.getElementById('result-distance').textContent = Math.floor(distance) + 'm';
    document.getElementById('result-best').textContent = Storage.getHighScore();

    const newRecordEl = document.getElementById('new-record-alert');
    if (isNewHigh) {
      newRecordEl.classList.remove('hidden');
    } else {
      newRecordEl.classList.add('hidden');
    }

    this.showHUD(false);
    this.showScreen(this.gameoverScreen);
    this.refreshMenuStats();
  }

  refreshMenuStats() {
    document.getElementById('menu-highscore').textContent = Storage.getHighScore();
    document.getElementById('menu-coins').textContent = Storage.getTotalCoins();

    const missionsBadge = document.getElementById('missions-badge');
    if (missionsBadge && window.Missions) {
      const unclaimed = Missions.getUnclaimedCount();
      if (unclaimed > 0) {
        missionsBadge.classList.remove('hidden');
      } else {
        missionsBadge.classList.add('hidden');
      }
    }
  }

  // --- SHOP & UPGRADES RENDERER ---
  renderShop() {
    const totalCoins = Storage.getTotalCoins();
    document.getElementById('shop-coins-display').textContent = totalCoins;

    const types = ['magnet', 'multiplier', 'hoverboard', 'jetpack'];
    types.forEach(type => {
      const level = Storage.getUpgradeLevel(type);
      const dotsContainer = document.getElementById(type + '-level-dots');
      if (dotsContainer) {
        dotsContainer.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
          const dot = document.createElement('span');
          dot.className = 'dot' + (i <= level ? ' active' : '');
          dotsContainer.appendChild(dot);
        }
      }

      const btn = document.getElementById('btn-upgrade-' + type);
      if (btn) {
        if (level >= 5) {
          btn.classList.add('maxed');
          btn.innerHTML = '<span>MAX LEVEL</span>';
        } else {
          btn.classList.remove('maxed');
          const cost = Storage.getUpgradeCost(type, level);
          btn.innerHTML = `<span class="price-val">${cost} C</span><span class="buy-label">UPGRADE</span>`;
        }
      }
    });
  }

  handleUpgrade(type) {
    const level = Storage.getUpgradeLevel(type);
    if (level >= 5) return;

    const cost = Storage.getUpgradeCost(type, level);
    if (Storage.spendCoins(cost)) {
      Audio.playPowerUp();
      Storage.setUpgradeLevel(type, level + 1);
      this.renderShop();
    } else {
      alert('Not enough coins! Collect more during your sprint');
    }
  }

  // --- MISSIONS RENDERER ---
  renderMissions() {
    const totalCoins = Storage.getTotalCoins();
    const displayCoins = document.getElementById('missions-coins-display');
    if (displayCoins) displayCoins.textContent = totalCoins;

    const container = document.getElementById('missions-list-container');
    if (!container || !window.Missions) return;

    container.innerHTML = '';
    Missions.missions.forEach(mission => {
      const prog = Missions.getProgress(mission);
      const card = document.createElement('div');
      card.className = 'mission-card' + (prog.isClaimed ? ' claimed' : (prog.isCompleted ? ' completed' : ''));

      const pct = Math.min(100, Math.floor((prog.current / prog.target) * 100));

      let actionHtml = '';
      if (prog.isClaimed) {
        actionHtml = '<span class="mission-status claimed">CLAIMED ✔</span>';
      } else if (prog.isCompleted) {
        actionHtml = `<button class="btn-claim-mission pulse-anim" data-id="${mission.id}">CLAIM ${mission.reward} C</button>`;
      } else {
        actionHtml = `<span class="mission-reward-tag">${mission.reward} C</span>`;
      }

      card.innerHTML = `
        <div class="mission-icon-box">${mission.icon}</div>
        <div class="mission-info">
          <h4>${mission.title}</h4>
          <p>${mission.desc}</p>
          <div class="mission-progress-bar">
            <div class="mission-progress-fill" style="width: ${pct}%"></div>
          </div>
          <span class="mission-count-text">${prog.current} / ${prog.target}</span>
        </div>
        <div class="mission-action-box">
          ${actionHtml}
        </div>
      `;

      container.appendChild(card);
    });

    // Claim button clicks
    container.querySelectorAll('.btn-claim-mission').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (Missions.claim(id)) {
          this.renderMissions();
          this.refreshMenuStats();
        }
      });
    });
  }

  // --- SKINS RENDERER ---
  renderSkins() {
    const totalCoins = Storage.getTotalCoins();
    const displayCoins = document.getElementById('skins-coins-display');
    if (displayCoins) displayCoins.textContent = totalCoins;

    const unlocked = Storage.getUnlockedSkins();
    const selected = Storage.getSelectedSkin();
    const skinCards = document.querySelectorAll('.skin-card');

    skinCards.forEach(card => {
      const skinId = card.getAttribute('data-skin-id');
      const isUnlocked = unlocked.includes(skinId);
      const isSelected = selected === skinId;

      card.className = 'skin-card' + (isSelected ? ' selected' : '');

      const detailsContainer = card.querySelector('.skin-details');
      let actionBtn = detailsContainer.querySelector('.btn-skin-action') || detailsContainer.querySelector('.skin-badge');

      if (isSelected) {
        if (actionBtn) actionBtn.outerHTML = '<span class="skin-badge owned">EQUIPPED</span>';
      } else if (isUnlocked) {
        if (actionBtn) actionBtn.outerHTML = '<button class="btn-skin-action" style="background:#10b981;">EQUIP</button>';
      } else {
        const cost = card.getAttribute('data-cost') || '500';
        if (actionBtn) actionBtn.outerHTML = `<button class="btn-skin-action">${cost} C</button>`;
      }

      // Click to equip / buy
      card.onclick = () => {
        if (isUnlocked) {
          Storage.setSelectedSkin(skinId);
          this.game.player.applySkin(skinId);
          Audio.playButtonClick();
          this.renderSkins();
        } else {
          const cost = parseInt(card.getAttribute('data-cost') || '500', 10);
          if (Storage.spendCoins(cost)) {
            Storage.unlockSkin(skinId);
            Storage.setSelectedSkin(skinId);
            this.game.player.applySkin(skinId);
            Audio.playPowerUp();
            this.renderSkins();
            this.refreshMenuStats();
          } else {
            alert('Not enough coins to unlock this character! Keep sprinting to collect more.');
          }
        }
      };
    });
  }
}
