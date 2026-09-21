/**
 * Saurabh's Sprint - Main Engine & Game Loop
 * Includes Dynamic Environmental Transitions & Camera FOV Speed Warping
 */

class Game {
  constructor() {
    this.STATE = {
      MENU: 'MENU',
      PLAYING: 'PLAYING',
      PAUSED: 'PAUSED',
      GAMEOVER: 'GAMEOVER'
    };
    this.currentState = this.STATE.MENU;

    // Game Metrics
    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.multiplier = 1;

    this.baseSpeed = 22;
    this.maxSpeed = 50;
    this.currentSpeed = this.baseSpeed;
    this.speedAcceleration = 0.35;

    this.clock = new THREE.Clock();

    this.initThree();
    this.initSubsystems();
    this.initSpeedLines();
    this.setupInputs();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThree() {
    this.container = document.getElementById('game-container');

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x70a1ff);

    // 2. Camera (Third person follower with dynamic FOV)
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 300);
    this.targetFOV = 65;
    this.cameraOffset = new THREE.Vector3(0, 3.2, 5.8);
    this.cameraLookOffset = new THREE.Vector3(0, 1.4, -4);
    this.camera.position.set(0, 1.2, -2.5);
    this.camera.lookAt(0, 0.85, 0);
    this.camera.fov = 48;
    this.camera.updateProjectionMatrix();

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lights
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xfff275, 1.1);
    this.dirLight.position.set(10, 25, 15);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 80;
    this.dirLight.shadow.camera.left = -10;
    this.dirLight.shadow.camera.right = 10;
    this.dirLight.shadow.camera.top = 10;
    this.dirLight.shadow.camera.bottom = -10;
    this.scene.add(this.dirLight);

    window.addEventListener('resize', () => this.onWindowResize());
  }

  initSubsystems() {
    this.collectibles = new CollectibleManager(this.scene);
    this.world = new WorldManager(this.scene, this.collectibles);
    this.player = new Player(this.scene);
    this.input = new InputManager();
    this.ui = new UIManager(this);

    const savedSkin = Storage.getSelectedSkin();
    this.player.applySkin(savedSkin);
  }

  initSpeedLines() {
    this.speedLineCount = 70;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.speedLineCount * 3);

    for (let i = 0; i < this.speedLineCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = Math.random() * 8 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x00d2d3,
      size: 0.16,
      transparent: true,
      opacity: 0.7
    });

    this.speedLines = new THREE.Points(geo, mat);
    this.scene.add(this.speedLines);
  }

  updateSpeedLines(delta) {
    const positions = this.speedLines.geometry.attributes.position.array;
    const pZ = this.player.mesh.position.z;

    for (let i = 0; i < this.speedLineCount; i++) {
      let z = positions[i * 3 + 2];
      z += this.currentSpeed * delta * 1.6;
      if (z > pZ + 10) {
        z = pZ - 35 - Math.random() * 10;
        positions[i * 3] = (Math.random() - 0.5) * 16;
        positions[i * 3 + 1] = Math.random() * 7 + 0.5;
      }
      positions[i * 3 + 2] = z;
    }
    this.speedLines.geometry.attributes.position.needsUpdate = true;
  }

  setupInputs() {
    this.input.onSwipeLeft = () => {
      if (this.currentState === this.STATE.PLAYING) this.player.moveLeft();
    };
    this.input.onSwipeRight = () => {
      if (this.currentState === this.STATE.PLAYING) this.player.moveRight();
    };
    this.input.onSwipeUp = () => {
      if (this.currentState === this.STATE.PLAYING) this.player.jump();
      else if (this.currentState === this.STATE.MENU) this.startGame();
    };
    this.input.onSwipeDown = () => {
      if (this.currentState === this.STATE.PLAYING) this.player.slide();
    };
    this.input.onDoubleTap = () => {
      if (this.currentState === this.STATE.PLAYING) {
        this.player.activateHoverboard();
      }
    };
    this.input.onPauseToggle = () => {
      if (this.currentState === this.STATE.PLAYING || this.currentState === this.STATE.PAUSED) {
        this.togglePause();
      }
    };
  }

  startGame() {
    this.currentState = this.STATE.PLAYING;
    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.currentSpeed = this.baseSpeed;

    this.player.reset();
    this.collectibles.clear();
    this.world.clear();

    this.ui.showScreen(null);
    this.ui.showHUD(true);
    Audio.startBGM();
  }

  togglePause() {
    if (this.currentState === this.STATE.PLAYING) {
      this.currentState = this.STATE.PAUSED;
      this.ui.showScreen(this.ui.pauseScreen);
      document.getElementById('pause-score').textContent = Math.floor(this.score);
      document.getElementById('pause-coins').textContent = '🪙 ' + this.coins;
      Audio.stopBGM();
    } else if (this.currentState === this.STATE.PAUSED) {
      this.currentState = this.STATE.PLAYING;
      this.ui.showScreen(null);
      Audio.startBGM();
    }
  }

  quitToMenu() {
    this.currentState = this.STATE.MENU;
    this.player.reset();
    this.collectibles.clear();
    this.world.clear();
    this.ui.showHUD(false);
    this.ui.showScreen(this.ui.startScreen);
    Audio.stopBGM();
  }

  onPlayerCrash(obstacle) {
    this.currentState = this.STATE.GAMEOVER;
    Audio.playCrash();
    Audio.stopBGM();
    this.input.vibrate([100, 50, 100]);

    let shakeCount = 0;
    const shakeInterval = setInterval(() => {
      this.camera.position.x += (Math.random() - 0.5) * 0.4;
      this.camera.position.y += (Math.random() - 0.5) * 0.4;
      shakeCount++;
      if (shakeCount > 8) {
        clearInterval(shakeInterval);
        // Offer Revive if player has coins, otherwise direct Game Over
        const totalCoins = Storage.getTotalCoins();
        if (totalCoins >= 50) {
          this.ui.startReviveOffer(
            this.score,
            this.coins,
            this.distance,
            () => this.revivePlayer(),
            () => this.ui.showGameOver(this.score, this.coins, this.distance)
          );
        } else {
          this.ui.showGameOver(this.score, this.coins, this.distance);
        }
      }
    }, 30);
  }

  revivePlayer() {
    this.currentState = this.STATE.PLAYING;
    Audio.startBGM();

    // Clear immediate obstacles in front of player
    const pZ = this.player.mesh.position.z;
    for (let i = this.world.activeObstacles.length - 1; i >= 0; i--) {
      const obs = this.world.activeObstacles[i];
      if (obs.mesh.position.z < pZ + 5 && obs.mesh.position.z > pZ - 35) {
        this.collectibles.createPickupParticles(obs.mesh.position.x, 1.0, obs.mesh.position.z, 0x00d2d3);
        this.scene.remove(obs.mesh);
        this.world.activeObstacles.splice(i, 1);
      }
    }

    // Give player a fresh hoverboard shield
    this.player.activateHoverboard();
  }

  // --- GAME LOOP ---
  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this.currentState === this.STATE.PLAYING) {
      // 1. Move Player along -Z axis
      const stepDistance = this.currentSpeed * delta;
      this.player.mesh.position.z -= stepDistance;
      this.distance += stepDistance;

      // Gradually accelerate speed
      this.currentSpeed = Math.min(this.maxSpeed, this.baseSpeed + (this.distance / 100) * this.speedAcceleration);

      // Score accumulation
      const mult = this.player.hasMultiplier ? 2 : 1;
      this.score += (stepDistance * 1.5) * mult;

      // 2. Update Player Kinematics & Physics
      this.player.update(delta, this.currentSpeed, this.player.groundHeight || 0);

      // 3. Update World, Environmental Themes & Collisions
      this.world.update(delta, this.player, this.currentSpeed, (obs) => this.onPlayerCrash(obs), this.distance);

      // Smoothly Lerp Environmental Lighting & Sky Color
      this.updateEnvironmentalLighting(delta);

      // 4. Update Collectibles & Magnet Pull
      this.collectibles.update(
        delta,
        this.player,
        (val) => {
          this.coins += val;
          this.score += val * 10;
        },
        (powerupType) => {
          if (powerupType === 'magnet') this.player.activateMagnet();
          if (powerupType === 'multiplier') this.player.activateMultiplier();
          if (powerupType === 'hoverboard') this.player.activateHoverboard();
          if (powerupType === 'jetpack') {
            this.player.activateJetpack();
            this.collectibles.spawnJetpackCoins(this.player.mesh.position.z - 8, 16);
          }
        }
      );

      // 5. Update Speed Line VFX
      this.updateSpeedLines(delta);

      // 6. Update HUD UI
      this.ui.updateHUD(this.score, this.coins, this.multiplier, this.player);

      // 7. Follow Light to prevent shadow clipping
      this.dirLight.position.set(10, 25, this.player.mesh.position.z + 15);
      this.dirLight.target = this.player.mesh;

      // 8. Follow camera
      this.updateCamera(delta);
    } else if (this.currentState === this.STATE.MENU) {
      // Idle Showcase in Home Menu
      this.player.updateIdle(delta);

      // Character showcase camera placed in front of player
      const targetCamPos = new THREE.Vector3(0, 1.2, -2.5);
      this.camera.position.lerp(targetCamPos, delta * 8);
      this.camera.lookAt(0, 0.85, 0);
      this.camera.fov = 48;
      this.camera.updateProjectionMatrix();

      // Bright warm sunlight on front of character
      this.dirLight.position.set(2, 6, -6);
      this.dirLight.target = this.player.mesh;
    }

    // Render Frame
    this.renderer.render(this.scene, this.camera);
  }

  updateEnvironmentalLighting(delta) {
    const theme = this.world.getCurrentTheme();

    // Lerp Sky Color
    this.scene.background.lerp(new THREE.Color(theme.skyColor), delta * 2.0);

    // Lerp Fog Color & Density
    if (this.scene.fog) {
      this.scene.fog.color.lerp(new THREE.Color(theme.fogColor), delta * 2.0);
      this.scene.fog.density += (theme.fogDensity - this.scene.fog.density) * delta * 2.0;
    }

    // Lerp Ambient & Sun Light
    this.ambientLight.color.lerp(new THREE.Color(theme.ambientColor), delta * 2.0);
    this.dirLight.color.lerp(new THREE.Color(theme.dirLightColor), delta * 2.0);
    this.dirLight.intensity += (theme.dirLightIntensity - this.dirLight.intensity) * delta * 2.0;
  }

  updateCamera(delta) {
    const pPos = this.player.mesh.position;

    let targetCamY = pPos.y + this.cameraOffset.y;
    let targetCamZ = pPos.z + this.cameraOffset.z;

    // Speed FOV Punch: widen FOV as speed increases or during jetpack
    let desiredFOV = 65 + (this.currentSpeed - this.baseSpeed) * 0.4;
    if (this.player.hasJetpack) {
      targetCamY = pPos.y + 2.2;
      targetCamZ = pPos.z + 6.8;
      desiredFOV = 78;
    }

    this.camera.fov += (desiredFOV - this.camera.fov) * delta * 4;
    this.camera.updateProjectionMatrix();

    // Smooth Lerp Camera Position
    this.camera.position.x += (pPos.x * 0.45 - this.camera.position.x) * delta * 6;
    this.camera.position.y += (targetCamY - this.camera.position.y) * delta * 5;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * delta * 12;

    const lookTarget = new THREE.Vector3(
      pPos.x * 0.4,
      pPos.y + this.cameraLookOffset.y,
      pPos.z + this.cameraLookOffset.z
    );
    this.camera.lookAt(lookTarget);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
