/**
 * Saurabh's Sprint - 3D Player Character Rig, Physics & Particle Trails
 */

class Player {
  constructor(scene) {
    this.scene = scene;
    this.mesh = new THREE.Group();

    // Lanes definition
    this.LANE_WIDTH = 2.2;
    this.currentLane = 0; // -1: Left, 0: Center, 1: Right
    this.targetX = 0;

    // Physics parameters
    this.y = 0;
    this.vy = 0;
    this.gravity = -32.0;
    this.jumpForce = 12.5;
    this.isGrounded = true;

    // Slide state
    this.isSliding = false;
    this.slideTimer = 0;
    this.slideDuration = 0.75;

    // Power-up states
    this.hasMagnet = false;
    this.magnetTimer = 0;

    this.hasMultiplier = false;
    this.multiplierTimer = 0;

    this.hasHoverboard = false;
    this.hoverboardTimer = 0;

    this.hasJetpack = false;
    this.jetpackTimer = 0;
    this.jetpackTargetY = 5.2;

    // Animation kinematics
    this.runCycle = 0;
    this.animSpeed = 14;
    this.bankRoll = 0;

    // Footstep & Jetpack Trail Particles
    this.trailParticles = [];
    this.particleGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);

    // 9 Custom Characters: Male & Female Rigs
    this.skins = {
      saurabh: {
        id: 'saurabh',
        name: 'Saurabh (Leader)',
        gender: 'male',
        cost: 0,
        hairStyle: 'cap',
        hoodie: 0xff3838,
        pants: 0x1e293b,
        shoes: 0xff4757,
        board: 0xff3838,
        hair: 0x1e272e,
        cap: 0xff3838,
        accent: 0x00d2d3,
        avatar: 'S'
      },
      rishav: {
        id: 'rishav',
        name: 'Rishav (Striker)',
        gender: 'male',
        cost: 250,
        hairStyle: 'cap',
        hoodie: 0xffd32a,
        pants: 0x111827,
        shoes: 0xffa502,
        board: 0xffd32a,
        hair: 0x2d3436,
        cap: 0x111827,
        accent: 0xffa502,
        avatar: 'R'
      },
      kashish: {
        id: 'kashish',
        name: 'Kashish (Phantom)',
        gender: 'male',
        cost: 450,
        hairStyle: 'cap',
        hoodie: 0x8e44ad,
        pants: 0x1e272e,
        shoes: 0x9b59b6,
        board: 0x8e44ad,
        hair: 0x1e272e,
        cap: 0x2c3e50,
        accent: 0xa29bfe,
        avatar: 'K'
      },
      jaishika: {
        id: 'jaishika',
        name: 'Jaishika (Superstar)',
        gender: 'female',
        cost: 600,
        hairStyle: 'ponytail',
        hoodie: 0xff4081,
        pants: 0x3f51b5,
        shoes: 0xff79b0,
        board: 0xff4081,
        hair: 0x3e2723,
        ribbon: 0x00e5ff,
        accent: 0xff4081,
        avatar: 'J'
      },
      vicky: {
        id: 'vicky',
        name: 'Vicky (Blaze)',
        gender: 'male',
        cost: 750,
        hairStyle: 'cap',
        hoodie: 0xd63031,
        pants: 0x111111,
        shoes: 0xe17055,
        board: 0xd63031,
        hair: 0x2d3436,
        cap: 0x111111,
        accent: 0xff7675,
        avatar: 'V'
      },
      bhoomi: {
        id: 'bhoomi',
        name: 'Bhoomi (Emerald)',
        gender: 'female',
        cost: 850,
        hairStyle: 'side_braid',
        hoodie: 0x00b894,
        pants: 0x2d3436,
        shoes: 0x55efc4,
        board: 0x00b894,
        hair: 0x4a2810,
        ribbon: 0xfdcb6e,
        accent: 0x00b894,
        avatar: 'B'
      },
      nikhil: {
        id: 'nikhil',
        name: 'Nikhil (Cyber Ace)',
        gender: 'male',
        cost: 1350,
        hairStyle: 'cap',
        hoodie: 0x0984e3,
        pants: 0x2d3436,
        shoes: 0x74b9ff,
        board: 0x0984e3,
        hair: 0x1e272e,
        cap: 0x0984e3,
        accent: 0x74b9ff,
        avatar: 'N'
      },
      aditya: {
        id: 'aditya',
        name: 'Aditya (Champion)',
        gender: 'male',
        cost: 2000,
        hairStyle: 'cap',
        hoodie: 0x6c5ce7,
        pants: 0xffd32a,
        shoes: 0xa29bfe,
        board: 0x6c5ce7,
        hair: 0x2d3436,
        cap: 0xffd32a,
        accent: 0xffd32a,
        avatar: 'A'
      }
    };

    // Compatibility alias
    this.skins.default = this.skins.saurabh;
    this.currentSkin = 'saurabh';

    this.buildCharacterMesh();
    this.scene.add(this.mesh);
  }

  buildCharacterMesh() {
    while (this.mesh.children.length > 0) {
      this.mesh.remove(this.mesh.children[0]);
    }

    const skinTheme = this.skins[this.currentSkin] || this.skins.saurabh;
    const isFemale = skinTheme.gender === 'female';

    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffdbac });
    const outfitMat = new THREE.MeshLambertMaterial({ color: skinTheme.hoodie });
    const pantsMat = new THREE.MeshLambertMaterial({ color: skinTheme.pants });
    const shoeMat = new THREE.MeshLambertMaterial({ color: skinTheme.shoes });
    const hairMat = new THREE.MeshLambertMaterial({ color: skinTheme.hair });
    const ribbonMat = new THREE.MeshLambertMaterial({ color: skinTheme.ribbon || 0xffffff });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x2f3542 });
    const accentMat = new THREE.MeshBasicMaterial({ color: skinTheme.accent || 0x00d2d3 });

    // Root Body Group
    this.bodyGroup = new THREE.Group();
    this.mesh.add(this.bodyGroup);

    // 1. Torso (Fitted crop jacket for girls, sporty hoodie for boys)
    const torsoW = isFemale ? 0.58 : 0.68;
    const torsoH = isFemale ? 0.68 : 0.75;
    const torsoD = isFemale ? 0.38 : 0.42;

    const torsoGeo = new THREE.BoxGeometry(torsoW, torsoH, torsoD);
    this.torso = new THREE.Mesh(torsoGeo, outfitMat);
    this.torso.position.y = isFemale ? 0.92 : 0.95;
    this.torso.castShadow = true;
    this.bodyGroup.add(this.torso);

    const stripeGeo = new THREE.BoxGeometry(torsoW * 0.45, torsoH * 0.55, torsoD + 0.02);
    const stripe = new THREE.Mesh(stripeGeo, new THREE.MeshLambertMaterial({ color: isFemale ? skinTheme.ribbon || 0xffffff : 0xffffff }));
    this.torso.add(stripe);

    // 2. Head Group
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, isFemale ? 1.50 : 1.55, 0);

    const headGeo = new THREE.BoxGeometry(isFemale ? 0.44 : 0.48, isFemale ? 0.44 : 0.48, isFemale ? 0.44 : 0.48);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.castShadow = true;
    this.headGroup.add(head);

    // Cute blush cheeks for female characters
    if (isFemale) {
      const blushGeo = new THREE.PlaneGeometry(0.1, 0.06);
      const blushMat = new THREE.MeshBasicMaterial({ color: 0xff7675 });
      const blushL = new THREE.Mesh(blushGeo, blushMat);
      blushL.position.set(-0.14, -0.06, -0.225);
      const blushR = blushL.clone();
      blushR.position.x = 0.14;
      this.headGroup.add(blushL);
      this.headGroup.add(blushR);
    }

    // HAIRSTYLES: Custom Female & Male Styles
    if (isFemale) {
      // Base female hair cap
      const hairBaseGeo = new THREE.BoxGeometry(0.48, 0.28, 0.48);
      const hairBase = new THREE.Mesh(hairBaseGeo, hairMat);
      hairBase.position.y = 0.15;
      this.headGroup.add(hairBase);

      // Bangs
      const bangsGeo = new THREE.BoxGeometry(0.44, 0.12, 0.1);
      const bangs = new THREE.Mesh(bangsGeo, hairMat);
      bangs.position.set(0, 0.16, -0.24);
      this.headGroup.add(bangs);

      if (skinTheme.hairStyle === 'ponytail') {
        // High Ponytail at back
        const ponyBand = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 8), ribbonMat);
        ponyBand.rotation.x = Math.PI / 2;
        ponyBand.position.set(0, 0.18, 0.28);
        this.headGroup.add(ponyBand);

        const ponyGeo = new THREE.BoxGeometry(0.18, 0.55, 0.18);
        const pony = new THREE.Mesh(ponyGeo, hairMat);
        pony.rotation.x = -0.25;
        pony.position.set(0, -0.08, 0.38);
        this.headGroup.add(pony);

      } else if (skinTheme.hairStyle === 'twin_buns') {
        // Cute Space Buns Left & Right
        const bunGeo = new THREE.SphereGeometry(0.14, 8, 8);
        const bunL = new THREE.Mesh(bunGeo, hairMat);
        bunL.position.set(-0.25, 0.32, 0.05);
        const bunR = bunL.clone();
        bunR.position.x = 0.25;
        this.headGroup.add(bunL);
        this.headGroup.add(bunR);

        // Bun hair ribbons
        const ribGeo = new THREE.TorusGeometry(0.1, 0.03, 6, 8);
        const ribL = new THREE.Mesh(ribGeo, ribbonMat);
        ribL.position.set(-0.25, 0.24, 0.05);
        ribL.rotation.x = Math.PI / 2;
        const ribR = ribL.clone();
        ribR.position.x = 0.25;
        this.headGroup.add(ribL);
        this.headGroup.add(ribR);

      } else if (skinTheme.hairStyle === 'side_braid') {
        // Sleek Side Braid
        const braidGeo = new THREE.BoxGeometry(0.14, 0.65, 0.14);
        const braid = new THREE.Mesh(braidGeo, hairMat);
        braid.rotation.z = 0.15;
        braid.position.set(-0.24, -0.15, 0.1);
        this.headGroup.add(braid);

        const tie = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.16), ribbonMat);
        tie.position.set(-0.28, -0.42, 0.1);
        this.headGroup.add(tie);

      } else {
        // Wavy Long Hair over shoulders
        const lockGeo = new THREE.BoxGeometry(0.14, 0.58, 0.16);
        const lockL = new THREE.Mesh(lockGeo, hairMat);
        lockL.position.set(-0.24, -0.12, -0.05);
        const lockR = lockL.clone();
        lockR.position.x = 0.24;
        const lockBack = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.58, 0.14), hairMat);
        lockBack.position.set(0, -0.12, 0.22);
        this.headGroup.add(lockL);
        this.headGroup.add(lockR);
        this.headGroup.add(lockBack);
      }

      // Girl Hair Bow / Headband
      const bandGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.06, 12, 1, true, 0, Math.PI);
      const headband = new THREE.Mesh(bandGeo, ribbonMat);
      headband.rotation.x = Math.PI / 2;
      headband.position.y = 0.18;
      this.headGroup.add(headband);

    } else {
      // Boy Cap & Visor
      const capGeo = new THREE.BoxGeometry(0.52, 0.22, 0.52);
      const capMat = new THREE.MeshLambertMaterial({ color: skinTheme.cap || skinTheme.hoodie });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 0.2;
      this.headGroup.add(cap);

      const visorGeo = new THREE.BoxGeometry(0.44, 0.06, 0.24);
      const visor = new THREE.Mesh(visorGeo, capMat);
      visor.position.set(0, 0.16, -0.32);
      this.headGroup.add(visor);

      // Headphones
      const hpBandGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.08, 12, 1, true, 0, Math.PI);
      const hpBand = new THREE.Mesh(hpBandGeo, darkMat);
      hpBand.rotation.x = Math.PI / 2;
      hpBand.position.y = 0.15;
      this.headGroup.add(hpBand);

      const earGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 8);
      const earL = new THREE.Mesh(earGeo, accentMat);
      earL.rotation.z = Math.PI / 2;
      earL.position.set(-0.27, 0, 0);
      this.headGroup.add(earL);

      const earR = earL.clone();
      earR.position.x = 0.27;
      this.headGroup.add(earR);
    }

    this.bodyGroup.add(this.headGroup);

    // 3. Limbs - Left & Right Arms
    const armW = isFemale ? 0.18 : 0.2;
    const armH = isFemale ? 0.60 : 0.65;
    const armGeo = new THREE.BoxGeometry(armW, armH, armW);

    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(isFemale ? -0.38 : -0.46, isFemale ? 1.18 : 1.25, 0);
    const leftArm = new THREE.Mesh(armGeo, outfitMat);
    leftArm.position.y = -armH / 2;
    leftArm.castShadow = true;
    this.leftArmGroup.add(leftArm);
    this.bodyGroup.add(this.leftArmGroup);

    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(isFemale ? 0.38 : 0.46, isFemale ? 1.18 : 1.25, 0);
    const rightArm = new THREE.Mesh(armGeo, outfitMat);
    rightArm.position.y = -armH / 2;
    rightArm.castShadow = true;
    this.rightArmGroup.add(rightArm);
    this.bodyGroup.add(this.rightArmGroup);

    // 4. Limbs - Left & Right Legs
    const legW = isFemale ? 0.20 : 0.24;
    const legH = isFemale ? 0.62 : 0.65;
    const legGeo = new THREE.BoxGeometry(legW, legH, isFemale ? 0.22 : 0.26);
    const footGeo = new THREE.BoxGeometry(isFemale ? 0.22 : 0.26, 0.16, isFemale ? 0.38 : 0.42);

    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(isFemale ? -0.16 : -0.2, isFemale ? 0.58 : 0.6, 0);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.y = -legH / 2;
    leftLeg.castShadow = true;
    this.leftLegGroup.add(leftLeg);

    const leftFoot = new THREE.Mesh(footGeo, shoeMat);
    leftFoot.position.set(0, -legH / 2 - 0.22, 0.08);
    leftFoot.castShadow = true;
    this.leftLegGroup.add(leftFoot);
    this.bodyGroup.add(this.leftLegGroup);

    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(isFemale ? 0.16 : 0.2, isFemale ? 0.58 : 0.6, 0);
    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.y = -legH / 2;
    rightLeg.castShadow = true;
    this.rightLegGroup.add(rightLeg);

    const rightFoot = new THREE.Mesh(footGeo, shoeMat);
    rightFoot.position.set(0, -legH / 2 - 0.22, 0.08);
    rightFoot.castShadow = true;
    this.rightLegGroup.add(rightFoot);
    this.bodyGroup.add(this.rightLegGroup);

    // 5. Hoverboard (Custom theme color)
    this.hoverboardGroup = new THREE.Group();
    const boardGeo = new THREE.BoxGeometry(0.7, 0.1, 1.5);
    const boardMat = new THREE.MeshStandardMaterial({
      color: skinTheme.board,
      emissive: skinTheme.board,
      emissiveIntensity: 0.4,
      metalness: 0.8,
      roughness: 0.2
    });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.y = -0.05;
    this.hoverboardGroup.add(board);

    const boardEdgeGeo = new THREE.BoxGeometry(0.74, 0.04, 1.54);
    const boardEdge = new THREE.Mesh(boardEdgeGeo, new THREE.MeshBasicMaterial({ color: skinTheme.accent || 0x00ffff }));
    boardEdge.position.y = -0.05;
    this.hoverboardGroup.add(boardEdge);

    this.hoverboardGroup.position.y = 0.05;
    this.hoverboardGroup.visible = false;
    this.mesh.add(this.hoverboardGroup);

    // 6. Jetpack
    this.jetpackGroup = new THREE.Group();
    const tankGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 8);
    const jetMat = new THREE.MeshStandardMaterial({ color: 0x34495e, metalness: 0.9 });
    const tankL = new THREE.Mesh(tankGeo, jetMat);
    tankL.position.set(-0.18, 0.95, -0.3);
    const tankR = new THREE.Mesh(tankGeo, jetMat);
    tankR.position.set(0.18, 0.95, -0.3);
    this.jetpackGroup.add(tankL);
    this.jetpackGroup.add(tankR);

    this.jetpackGroup.visible = false;
    this.bodyGroup.add(this.jetpackGroup);

    // 7. Aura Ring
    const auraGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const auraMat = new THREE.MeshBasicMaterial({
      color: skinTheme.accent || 0x00d2d3,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });
    this.auraMesh = new THREE.Mesh(auraGeo, auraMat);
    this.auraMesh.position.y = 1.0;
    this.auraMesh.visible = false;
    this.mesh.add(this.auraMesh);
  }

  applySkin(skinId) {
    this.currentSkin = skinId;
    this.buildCharacterMesh();
  }

  moveLeft() {
    if (this.currentLane > -1) {
      this.currentLane--;
      this.targetX = this.currentLane * this.LANE_WIDTH;
      this.bankRoll = 0.3;
      Audio.playWhoosh();
      return true;
    }
    return false;
  }

  moveRight() {
    if (this.currentLane < 1) {
      this.currentLane++;
      this.targetX = this.currentLane * this.LANE_WIDTH;
      this.bankRoll = -0.3;
      Audio.playWhoosh();
      return true;
    }
    return false;
  }

  jump() {
    if (this.hasJetpack) return;

    if (this.isGrounded || this.isSliding) {
      this.vy = this.jumpForce;
      this.isGrounded = false;
      this.isSliding = false;
      Storage.incrementStat('totalJumps', 1);
      Audio.playJump();
    }
  }

  slide() {
    if (this.hasJetpack) return;

    if (!this.isGrounded) {
      this.vy = -this.jumpForce * 1.6;
      this.isSliding = true;
      this.slideTimer = this.slideDuration;
      Storage.incrementStat('totalSlides', 1);
      Audio.playSlide();
    } else if (!this.isSliding) {
      this.isSliding = true;
      this.slideTimer = this.slideDuration;
      Storage.incrementStat('totalSlides', 1);
      Audio.playSlide();
    }
  }

  activateHoverboard() {
    if (this.hasHoverboard) return;
    this.hasHoverboard = true;
    this.hoverboardTimer = Storage.getPowerUpDuration('hoverboard');
    this.hoverboardGroup.visible = true;
    this.auraMesh.visible = true;
    this.auraMesh.material.color.setHex(0x2ed573);
    Storage.incrementStat('totalHoverboardsUsed', 1);
    Audio.playHoverboard();
  }

  activateMagnet() {
    this.hasMagnet = true;
    this.magnetTimer = Storage.getPowerUpDuration('magnet');
    this.auraMesh.visible = true;
    this.auraMesh.material.color.setHex(0xff4757);
    Storage.incrementStat('totalPowerUpsCollected', 1);
    Audio.playPowerUp();
  }

  activateMultiplier() {
    this.hasMultiplier = true;
    this.multiplierTimer = Storage.getPowerUpDuration('multiplier');
    Storage.incrementStat('totalPowerUpsCollected', 1);
    Audio.playPowerUp();
  }

  activateJetpack() {
    this.hasJetpack = true;
    this.jetpackTimer = Storage.getPowerUpDuration('jetpack');
    this.jetpackGroup.visible = true;
    this.auraMesh.visible = true;
    this.auraMesh.material.color.setHex(0x00d2d3);
    Storage.incrementStat('totalPowerUpsCollected', 1);
    Audio.playPowerUp();
  }

  spawnFootstepParticle(colorHex = 0x00d2d3) {
    if (this.trailParticles.length > 25) return;
    const p = new THREE.Mesh(this.particleGeo, new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.8 }));
    p.position.set(
      this.mesh.position.x + (Math.random() - 0.5) * 0.4,
      this.mesh.position.y + 0.1,
      this.mesh.position.z + 0.3
    );
    this.scene.add(p);
    this.trailParticles.push({ mesh: p, life: 0.25, maxLife: 0.25 });
  }

  updateTrailParticles(delta) {
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const p = this.trailParticles[i];
      p.life -= delta;
      p.mesh.scale.setScalar(p.life / p.maxLife);
      p.mesh.material.opacity = p.life / p.maxLife;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.trailParticles.splice(i, 1);
      }
    }
  }

  update(delta, gameSpeed, groundHeight = 0) {
    // 1. Smooth Lane X interpolation & Bank Roll
    this.mesh.position.x += (this.targetX - this.mesh.position.x) * Math.min(delta * 16, 1.0);
    this.bankRoll += (0 - this.bankRoll) * delta * 8;
    this.mesh.rotation.z = this.bankRoll;

    // 2. Jetpack vs Gravity
    if (this.hasJetpack) {
      this.y += (this.jetpackTargetY - this.y) * delta * 4;
      this.isGrounded = false;
      this.jetpackTimer -= delta;

      // Jetpack Thruster Flame Particles
      if (Math.random() > 0.4) {
        this.spawnFootstepParticle(0x00d2d3);
      }

      if (this.jetpackTimer <= 0) {
        this.hasJetpack = false;
        this.jetpackGroup.visible = false;
        if (!this.hasMagnet && !this.hasHoverboard) this.auraMesh.visible = false;
      }
    } else {
      if (!this.isGrounded || this.y > groundHeight) {
        this.vy += this.gravity * delta;
        this.y += this.vy * delta;

        if (this.y <= groundHeight) {
          this.y = groundHeight;
          this.vy = 0;
          this.isGrounded = true;
          // Landing dust
          this.spawnFootstepParticle(0xffffff);
        }
      } else {
        this.y = groundHeight;
      }
    }

    this.mesh.position.y = this.y;

    // 3. Slide Timer
    if (this.isSliding) {
      this.slideTimer -= delta;
      if (Math.random() > 0.3) this.spawnFootstepParticle(0xffa502);
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    } else if (this.isGrounded && Math.random() > 0.6) {
      // Running sneaker sparkles
      this.spawnFootstepParticle(0x00d2d3);
    }

    // 4. Power-Up Timers Countdown
    if (this.hasMagnet) {
      this.magnetTimer -= delta;
      if (this.magnetTimer <= 0) {
        this.hasMagnet = false;
        if (!this.hasHoverboard && !this.hasJetpack) this.auraMesh.visible = false;
      }
    }

    if (this.hasMultiplier) {
      this.multiplierTimer -= delta;
      if (this.multiplierTimer <= 0) {
        this.hasMultiplier = false;
      }
    }

    if (this.hasHoverboard) {
      this.hoverboardTimer -= delta;
      if (Math.random() > 0.5) this.spawnFootstepParticle(0x2ed573);
      if (this.hoverboardTimer <= 0) {
        this.hasHoverboard = false;
        this.hoverboardGroup.visible = false;
        if (!this.hasMagnet && !this.hasJetpack) this.auraMesh.visible = false;
      }
    }

    // 5. Update Trail Particles
    this.updateTrailParticles(delta);

    // 6. Procedural Character Animations
    this.animate(delta, gameSpeed);
  }

  animate(delta, gameSpeed) {
    if (this.hasJetpack) {
      this.bodyGroup.position.set(0, 0, 0);
      this.bodyGroup.rotation.set(0.3, 0, 0);
      this.leftArmGroup.rotation.x = 0.6;
      this.rightArmGroup.rotation.x = 0.6;
      this.leftLegGroup.rotation.x = 0.4;
      this.rightLegGroup.rotation.x = 0.2;
      return;
    }

    if (this.isSliding) {
      this.bodyGroup.position.set(0, -0.4, 0.2);
      this.bodyGroup.rotation.set(-0.6, 0, 0);
      this.leftLegGroup.rotation.set(-1.2, 0, 0);
      this.rightLegGroup.rotation.set(-0.4, 0, 0);
      this.leftArmGroup.rotation.set(1.0, 0, 0);
      this.rightArmGroup.rotation.set(1.0, 0, 0);
      return;
    }

    if (!this.isGrounded) {
      this.bodyGroup.position.set(0, 0, 0);
      this.bodyGroup.rotation.set(0, 0, 0);
      this.leftLegGroup.rotation.set(-0.5, 0, 0);
      this.rightLegGroup.rotation.set(0.6, 0, 0);
      this.leftArmGroup.rotation.set(-1.2, 0, 0);
      this.rightArmGroup.rotation.set(1.2, 0, 0);
      return;
    }

    if (this.hasHoverboard) {
      this.bodyGroup.position.set(0, 0.1, 0);
      this.bodyGroup.rotation.set(0, 0.5, 0);
      this.leftLegGroup.rotation.set(0, 0, 0.2);
      this.rightLegGroup.rotation.set(0, 0, -0.2);
      this.leftArmGroup.rotation.set(0.4, 0, 0.6);
      this.rightArmGroup.rotation.set(-0.4, 0, -0.6);
      return;
    }

    // Standard Running Stride Cycle
    this.runCycle += delta * gameSpeed * 1.1;
    const stride = Math.sin(this.runCycle);
    const bounce = Math.abs(Math.cos(this.runCycle)) * 0.1;

    this.bodyGroup.position.set(0, bounce, 0);
    this.bodyGroup.rotation.set(0.12, 0, stride * 0.05);

    this.leftLegGroup.rotation.x = stride * 0.95;
    this.rightLegGroup.rotation.x = -stride * 0.95;

    this.leftArmGroup.rotation.x = -stride * 0.9;
    this.rightArmGroup.rotation.x = stride * 0.9;

    this.headGroup.rotation.y = -stride * 0.05;
  }

  updateIdle(delta) {
    this.runCycle += delta * 2.5;
    const bob = Math.sin(this.runCycle) * 0.03;
    this.mesh.position.set(0, bob, 0);
    // Face directly towards the showcase camera (facing -Z) with subtle cool breathing sway
    this.mesh.rotation.y = Math.sin(this.runCycle * 0.6) * 0.25;
    this.bodyGroup.position.set(0, 0, 0);
    this.bodyGroup.rotation.set(0, 0, 0);
    this.leftArmGroup.rotation.set(0.1, 0, 0.15);
    this.rightArmGroup.rotation.set(0.1, 0, -0.15);
    this.leftLegGroup.rotation.set(0, 0, 0);
    this.rightLegGroup.rotation.set(0, 0, 0);
    this.headGroup.rotation.y = 0;
  }

  getCollider() {
    const height = this.isSliding ? 0.7 : 1.8;
    return {
      minX: this.mesh.position.x - 0.4,
      maxX: this.mesh.position.x + 0.4,
      minY: this.mesh.position.y,
      maxY: this.mesh.position.y + height,
      minZ: this.mesh.position.z - 0.35,
      maxZ: this.mesh.position.z + 0.35
    };
  }

  reset() {
    this.currentLane = 0;
    this.targetX = 0;
    this.mesh.position.set(0, 0, 0);
    this.mesh.rotation.set(0, 0, 0);
    this.y = 0;
    this.vy = 0;
    this.isGrounded = true;
    this.isSliding = false;
    this.slideTimer = 0;
    this.hasMagnet = false;
    this.hasMultiplier = false;
    this.hasHoverboard = false;
    this.hasJetpack = false;
    this.hoverboardGroup.visible = false;
    this.jetpackGroup.visible = false;
    this.auraMesh.visible = false;
    this.trailParticles.forEach(p => this.scene.remove(p.mesh));
    this.trailParticles = [];
  }
}
