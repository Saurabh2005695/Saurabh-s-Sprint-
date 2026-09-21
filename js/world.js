/**
 * Saurabh's Sprint - Dynamic Multi-Environment World Engine
 * Seamlessly transitions between:
 * 1. SUNSET CITY (Golden hour, warm skies, glowing windows)
 * 2. CYBER NIGHT (Deep neon sky, illuminated skyscrapers, glowing tracks)
 * 3. METRO TUNNEL (Underground subway tunnel with neon ceiling lights & hazard arches)
 * 4. SKY BRIDGE (Elevated neon suspension bridge over futuristic skyline)
 */

class WorldManager {
  constructor(scene, collectibleManager) {
    this.scene = scene;
    this.collectibles = collectibleManager;

    this.LANE_WIDTH = 2.2;
    this.LANES = [-this.LANE_WIDTH, 0, this.LANE_WIDTH]; // Left, Center, Right

    this.CHUNK_LENGTH = 50;
    this.VISIBLE_CHUNKS = 7;
    this.chunks = [];
    this.activeObstacles = [];
    this.movingTrains = [];

    this.nextChunkZ = 0;
    this.currentThemeIndex = 0;
    this.themeChangeDistance = 350; // Transition environment every 350m
    this.lastThemeZ = 0;

    this.THEMES = [
      {
        id: 'SUNNY_METRO',
        name: 'Sunny Metro Skyline',
        skyColor: 0x70a1ff,
        fogColor: 0xa4b0be,
        fogDensity: 0.008,
        ambientColor: 0xffffff,
        dirLightColor: 0xfff275,
        dirLightIntensity: 1.15,
        ballastColor: 0xdfe4ea,
        railColor: 0x00d2d3,
        isTunnel: false,
        isBridge: false
      },
      {
        id: 'EMERALD_BRIDGE',
        name: 'Crystal Turquoise Bridge',
        skyColor: 0x55efc4,
        fogColor: 0x81ecec,
        fogDensity: 0.007,
        ambientColor: 0xffffff,
        dirLightColor: 0x00cec9,
        dirLightIntensity: 1.1,
        ballastColor: 0xced6e0,
        railColor: 0x00b894,
        isTunnel: false,
        isBridge: true
      },
      {
        id: 'GOLDEN_BLVD',
        name: 'Golden Sunset Boulevard',
        skyColor: 0xffbe76,
        fogColor: 0xf6e58d,
        fogDensity: 0.009,
        ambientColor: 0xffeaa7,
        dirLightColor: 0xff793f,
        dirLightIntensity: 1.05,
        ballastColor: 0xdfe4ea,
        railColor: 0xff9f1a,
        isTunnel: false,
        isBridge: false
      },
      {
        id: 'SUNRISE_TUNNEL',
        name: 'Neon Sunrise Metro Tunnel',
        skyColor: 0x2c3e50,
        fogColor: 0x34495e,
        fogDensity: 0.016,
        ambientColor: 0xff7675,
        dirLightColor: 0xffffff,
        dirLightIntensity: 0.9,
        ballastColor: 0x57606f,
        railColor: 0xff4757,
        isTunnel: true,
        isBridge: false
      }
    ];

    this.initMaterials();
    this.initEnvironment();
  }

  getCurrentTheme() {
    return this.THEMES[this.currentThemeIndex];
  }

  initMaterials() {
    // Shared Reusable Geometries
    this.tunnelArchGeo = new THREE.CylinderGeometry(5.4, 5.4, this.CHUNK_LENGTH, 16, 1, true, 0, Math.PI);
    this.tunnelTubeLightGeo = new THREE.CylinderGeometry(0.08, 0.08, 6, 8);
    this.bridgeCableGeo = new THREE.CylinderGeometry(0.05, 0.05, 18, 6);

    // Track Materials (Clean light styling)
    this.ballastMat = new THREE.MeshLambertMaterial({ color: 0xdfe4ea });
    this.railMat = new THREE.MeshStandardMaterial({ color: 0x00d2d3, metalness: 0.85, roughness: 0.2 });
    this.tieMat = new THREE.MeshLambertMaterial({ color: 0x747d8c });

    // Train Materials (Modern sleek high-speed metro)
    this.trainBodyMat = new THREE.MeshStandardMaterial({ color: 0xf1f2f6, roughness: 0.2, metalness: 0.3 });
    this.trainStripeMat = new THREE.MeshLambertMaterial({ color: 0xff4757 });
    this.trainWindowMat = new THREE.MeshStandardMaterial({ color: 0x00d2d3, emissive: 0x00d2d3, emissiveIntensity: 0.6 });
    this.trainLightMat = new THREE.MeshBasicMaterial({ color: 0xfffa65 });

    // Tunnel & Bridge Materials
    this.tunnelWallMat = new THREE.MeshLambertMaterial({ color: 0x2f3542, side: THREE.BackSide });
    this.tunnelLightMat = new THREE.MeshBasicMaterial({ color: 0xfffa65 });
    this.bridgePillarMat = new THREE.MeshStandardMaterial({ color: 0x00cec9, metalness: 0.6, roughness: 0.3 });

    // Barrier Materials
    this.barrierMat = new THREE.MeshLambertMaterial({ color: 0xff4757 });
    this.barrierStripeMat = new THREE.MeshLambertMaterial({ color: 0xfffa65 });
    this.overheadMat = new THREE.MeshStandardMaterial({ color: 0x747d8c, metalness: 0.5 });

    // City Backdrop Materials (Vibrant modern skyscrapers)
    this.buildingMat = new THREE.MeshLambertMaterial({ color: 0xe4ebf5 });
    this.windowMat = new THREE.MeshBasicMaterial({ color: 0x74b9ff });
  }

  initEnvironment() {
    const theme = this.getCurrentTheme();
    this.scene.fog = new THREE.FogExp2(theme.fogColor, theme.fogDensity);
    this.scene.background = new THREE.Color(theme.skyColor);

    this.nextChunkZ = 15;
    for (let i = 0; i < this.VISIBLE_CHUNKS; i++) {
      this.spawnChunk(i === 0);
    }
  }

  // Generate a track chunk with current dynamic theme styling
  spawnChunk(isFirst = false) {
    const chunk = new THREE.Group();
    const chunkZ = this.nextChunkZ;
    chunk.position.z = chunkZ;

    const theme = this.getCurrentTheme();

    // 1. Ground Track Bed (Ballast)
    const groundGeo = new THREE.PlaneGeometry(10, this.CHUNK_LENGTH);
    const ground = new THREE.Mesh(groundGeo, this.ballastMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, -this.CHUNK_LENGTH / 2);
    ground.receiveShadow = true;
    chunk.add(ground);

    // 2. 3 Sets of Steel Rails & Wooden Ties
    this.LANES.forEach((laneX) => {
      // Left and Right Steel Rail
      const railGeo = new THREE.BoxGeometry(0.08, 0.12, this.CHUNK_LENGTH);
      const railL = new THREE.Mesh(railGeo, this.railMat);
      railL.position.set(laneX - 0.45, 0.06, -this.CHUNK_LENGTH / 2);
      const railR = new THREE.Mesh(railGeo, this.railMat);
      railR.position.set(laneX + 0.45, 0.06, -this.CHUNK_LENGTH / 2);
      chunk.add(railL);
      chunk.add(railR);

      // Wooden Ties
      const tieCount = Math.floor(this.CHUNK_LENGTH / 1.5);
      const tieGeo = new THREE.BoxGeometry(1.2, 0.06, 0.25);
      for (let t = 0; t < tieCount; t++) {
        const tie = new THREE.Mesh(tieGeo, this.tieMat);
        tie.position.set(laneX, 0.03, -t * 1.5);
        chunk.add(tie);
      }
    });

    // 3. Theme Specific Structures: Tunnel vs Bridge vs Open City
    if (theme.isTunnel) {
      // UNDERGROUND TUNNEL ARCH & LIGHTS
      const tunnel = new THREE.Mesh(this.tunnelArchGeo, this.tunnelWallMat);
      tunnel.rotation.x = -Math.PI / 2;
      tunnel.rotation.z = Math.PI / 2;
      tunnel.position.set(0, 0, -this.CHUNK_LENGTH / 2);
      chunk.add(tunnel);

      // Fluorescent Ceiling Lights
      for (let l = 0; l < 4; l++) {
        const tube = new THREE.Mesh(this.tunnelTubeLightGeo, this.tunnelLightMat);
        tube.rotation.z = Math.PI / 2;
        tube.position.set(0, 5.0, -l * 12 - 6);
        chunk.add(tube);
      }
    } else if (theme.isBridge) {
      // SKY BRIDGE SUSPENSION TOWERS & NEON CABLES
      const towerGeo = new THREE.BoxGeometry(0.6, 16, 0.6);
      const towerL = new THREE.Mesh(towerGeo, this.bridgePillarMat);
      towerL.position.set(-5.2, 8, -this.CHUNK_LENGTH / 2);
      const towerR = new THREE.Mesh(towerGeo, this.bridgePillarMat);
      towerR.position.set(5.2, 8, -this.CHUNK_LENGTH / 2);
      chunk.add(towerL);
      chunk.add(towerR);

      // Suspension Cables
      for (let c = 0; c < 3; c++) {
        const cable = new THREE.Mesh(this.bridgeCableGeo, new THREE.MeshBasicMaterial({ color: 0x2ed573 }));
        cable.rotation.x = 0.45;
        cable.position.set(-5.2, 8, -c * 14 - 10);
        chunk.add(cable);

        const cableR = cable.clone();
        cableR.position.x = 5.2;
        chunk.add(cableR);
      }
    } else {
      // CITY SKYLINE & OVERHEAD GANTRIES
      const gantry = this.createOverheadGantry();
      gantry.position.set(0, 0, -this.CHUNK_LENGTH / 2);
      chunk.add(gantry);

      this.addCityScenery(chunk);
    }

    // 4. Spawn Obstacles & Collectibles on this chunk
    if (!isFirst) {
      this.populateObstacles(chunk, chunkZ);
    }

    this.scene.add(chunk);
    this.chunks.push({ mesh: chunk, z: chunkZ, themeIndex: this.currentThemeIndex });
    this.nextChunkZ -= this.CHUNK_LENGTH;
  }

  // Create Overhead Arch Structure
  createOverheadGantry() {
    const group = new THREE.Group();
    const colGeo = new THREE.BoxGeometry(0.3, 5.0, 0.3);
    const colL = new THREE.Mesh(colGeo, this.overheadMat);
    colL.position.set(-4.5, 2.5, 0);
    const colR = new THREE.Mesh(colGeo, this.overheadMat);
    colR.position.set(4.5, 2.5, 0);
    group.add(colL);
    group.add(colR);

    const beamGeo = new THREE.BoxGeometry(9.3, 0.35, 0.35);
    const beam = new THREE.Mesh(beamGeo, this.overheadMat);
    beam.position.set(0, 4.8, 0);
    group.add(beam);

    // Neon Billboard Sign
    const signGeo = new THREE.BoxGeometry(4.2, 0.8, 0.1);
    const signMat = new THREE.MeshBasicMaterial({ color: 0xff3838 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 4.2, 0);
    group.add(sign);

    return group;
  }

  // City Scenery along tracks
  addCityScenery(chunk) {
    const buildingGeo = new THREE.BoxGeometry(8, 22 + Math.random() * 18, 8);
    for (let side of [-1, 1]) {
      for (let b = 0; b < 3; b++) {
        const building = new THREE.Mesh(buildingGeo, this.buildingMat);
        const posX = side * (8.5 + Math.random() * 4);
        const posZ = -b * 16 - 8;
        building.position.set(posX, 11, posZ);
        chunk.add(building);

        // Window glow dots
        const winGeo = new THREE.PlaneGeometry(0.4, 0.6);
        for (let w = 0; w < 5; w++) {
          const win = new THREE.Mesh(winGeo, this.windowMat);
          win.position.set(posX - side * 4.01, 3 + w * 3.5, posZ + (Math.random() - 0.5) * 4);
          win.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
          chunk.add(win);
        }
      }
    }
  }

  // Populate Obstacles & Formations
  populateObstacles(chunk, chunkZ) {
    const patterns = ['TRAIN_LANE', 'HIGH_SLIDE', 'LOW_JUMP', 'TRAIN_RAMP', 'SPLIT_HURDLES', 'DOUBLE_TRAINS', 'RAMP_TO_ROOF_RUN', 'ZIGZAG_BARRIERS'];
    const chosenPattern = patterns[Math.floor(Math.random() * patterns.length)];

    if (chosenPattern === 'TRAIN_LANE') {
      const trainLane = Math.floor(Math.random() * 3);
      const isMoving = Math.random() > 0.45;
      const trainX = this.LANES[trainLane];
      const trainZ = chunkZ - 25;

      this.spawnTrain(trainX, trainZ, isMoving, false);
      const openLane = (trainLane + 1) % 3;
      this.collectibles.spawnCoinArc(this.LANES[openLane], chunkZ - 15, 5);

    } else if (chosenPattern === 'DOUBLE_TRAINS') {
      // Two tracks have trains, one safe lane
      const safeLane = Math.floor(Math.random() * 3);
      for (let i = 0; i < 3; i++) {
        if (i !== safeLane) {
          const trainX = this.LANES[i];
          const trainZ = chunkZ - 25;
          this.spawnTrain(trainX, trainZ, false, Math.random() > 0.5);
        } else {
          this.collectibles.spawnCoinArc(this.LANES[i], chunkZ - 16, 5);
        }
      }

    } else if (chosenPattern === 'TRAIN_RAMP' || chosenPattern === 'RAMP_TO_ROOF_RUN') {
      const trainLane = Math.floor(Math.random() * 3);
      const trainX = this.LANES[trainLane];
      const trainZ = chunkZ - 25;

      this.spawnTrain(trainX, trainZ, false, true);

      // Guiding coins ascending up the ramp onto the roof
      this.collectibles.spawnCoin(trainX, 1.0, trainZ + 9.0);
      this.collectibles.spawnCoin(trainX, 2.0, trainZ + 7.0);
      this.collectibles.spawnCoin(trainX, 3.0, trainZ + 5.0);

      // Coins along train roof
      for (let c = 0; c < 5; c++) {
        this.collectibles.spawnCoin(trainX, 3.2, trainZ + 2.0 - c * 2.5);
      }

      if (Math.random() > 0.4) {
        const types = ['magnet', 'multiplier', 'hoverboard', 'jetpack'];
        const pu = types[Math.floor(Math.random() * types.length)];
        this.collectibles.spawnPowerUp(pu, trainX, 3.2, trainZ - 11);
      }

    } else if (chosenPattern === 'HIGH_SLIDE') {
      const slideLane = Math.floor(Math.random() * 3);
      const slideX = this.LANES[slideLane];
      const slideZ = chunkZ - 20;

      this.spawnHighGirder(slideX, slideZ);
      for (let c = 0; c < 4; c++) {
        this.collectibles.spawnCoin(slideX, 0, slideZ + 3 - c * 2);
      }

    } else if (chosenPattern === 'LOW_JUMP') {
      const jumpLane = Math.floor(Math.random() * 3);
      const jumpX = this.LANES[jumpLane];
      const jumpZ = chunkZ - 22;

      this.spawnLowBarrier(jumpX, jumpZ);
      this.collectibles.spawnCoinArc(jumpX, jumpZ + 4, 5);

    } else if (chosenPattern === 'ZIGZAG_BARRIERS') {
      // Staggered hurdles requiring lane weaves
      this.spawnLowBarrier(this.LANES[0], chunkZ - 15);
      this.spawnLowBarrier(this.LANES[2], chunkZ - 25);
      this.spawnLowBarrier(this.LANES[1], chunkZ - 35);
      this.collectibles.spawnCoinArc(this.LANES[1], chunkZ - 15, 3);
      this.collectibles.spawnCoinArc(this.LANES[0], chunkZ - 25, 3);
      this.collectibles.spawnCoinArc(this.LANES[2], chunkZ - 35, 3);

    } else if (chosenPattern === 'SPLIT_HURDLES') {
      const freeLane = Math.floor(Math.random() * 3);
      for (let i = 0; i < 3; i++) {
        if (i !== freeLane) {
          this.spawnLowBarrier(this.LANES[i], chunkZ - 24);
        } else {
          this.collectibles.spawnCoinArc(this.LANES[i], chunkZ - 18, 4);
          if (Math.random() > 0.5) {
            const types = ['magnet', 'multiplier', 'hoverboard', 'jetpack'];
            const pu = types[Math.floor(Math.random() * types.length)];
            this.collectibles.spawnPowerUp(pu, this.LANES[i], 0, chunkZ - 30);
          }
        }
      }
    }
  }

  // --- OBSTACLE FACTORIES ---
  spawnTrain(x, z, isMoving = false, hasRamp = false) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const length = 16.0;
    const width = 1.9;
    const height = 2.8;

    const bodyGeo = new THREE.BoxGeometry(width, height, length);
    const body = new THREE.Mesh(bodyGeo, this.trainBodyMat);
    body.position.y = height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const stripeGeo = new THREE.BoxGeometry(width + 0.05, 0.4, length);
    const stripe = new THREE.Mesh(stripeGeo, this.trainStripeMat);
    stripe.position.y = height / 2 + 0.2;
    group.add(stripe);

    const winGeo = new THREE.BoxGeometry(width - 0.2, 0.8, 0.1);
    const win = new THREE.Mesh(winGeo, this.trainWindowMat);
    win.position.set(0, height - 0.7, length / 2 + 0.02);
    group.add(win);

    const lightGeo = new THREE.CircleGeometry(0.18, 12);
    const lightL = new THREE.Mesh(lightGeo, this.trainLightMat);
    lightL.position.set(-0.55, 0.7, length / 2 + 0.05);
    const lightR = lightL.clone();
    lightR.position.x = 0.55;
    group.add(lightL);
    group.add(lightR);

    if (hasRamp) {
      const rampGeo = new THREE.BoxGeometry(1.6, 0.2, 4.0);
      const ramp = new THREE.Mesh(rampGeo, this.tieMat);
      ramp.rotation.x = 0.65;
      ramp.position.set(0, 1.4, length / 2 + 1.2);
      group.add(ramp);
    }

    this.scene.add(group);

    const obstacleObj = {
      type: 'train',
      mesh: group,
      isMoving: isMoving,
      moveSpeed: isMoving ? 13 : 0,
      hasRamp: hasRamp,
      width: width,
      height: height,
      length: length,
      topY: height,
      getBounds: () => {
        const pos = group.position;
        return {
          minX: pos.x - width / 2,
          maxX: pos.x + width / 2,
          minY: 0,
          maxY: height,
          minZ: pos.z - length / 2,
          maxZ: pos.z + length / 2 + (hasRamp ? 2.5 : 0)
        };
      }
    };

    this.activeObstacles.push(obstacleObj);
    if (isMoving) this.movingTrains.push(obstacleObj);
    return obstacleObj;
  }

  spawnHighGirder(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const beamGeo = new THREE.BoxGeometry(2.1, 1.2, 0.4);
    const beam = new THREE.Mesh(beamGeo, this.barrierMat);
    beam.position.y = 1.8;
    beam.castShadow = true;
    group.add(beam);

    const stripeGeo = new THREE.BoxGeometry(2.12, 0.25, 0.42);
    const stripe = new THREE.Mesh(stripeGeo, this.barrierStripeMat);
    stripe.position.y = 1.8;
    group.add(stripe);

    const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8);
    const postL = new THREE.Mesh(postGeo, this.overheadMat);
    postL.position.set(-1.0, 1.2, 0);
    const postR = postL.clone();
    postR.position.x = 1.0;
    group.add(postL);
    group.add(postR);

    this.scene.add(group);

    const obstacleObj = {
      type: 'high_girder',
      mesh: group,
      getBounds: () => {
        const pos = group.position;
        return {
          minX: pos.x - 1.0,
          maxX: pos.x + 1.0,
          minY: 1.1,
          maxY: 2.5,
          minZ: pos.z - 0.25,
          maxZ: pos.z + 0.25
        };
      }
    };

    this.activeObstacles.push(obstacleObj);
    return obstacleObj;
  }

  spawnLowBarrier(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const plankGeo = new THREE.BoxGeometry(2.0, 0.5, 0.15);
    const plank = new THREE.Mesh(plankGeo, this.barrierMat);
    plank.position.y = 0.55;
    plank.castShadow = true;
    group.add(plank);

    const stripeGeo = new THREE.BoxGeometry(2.02, 0.15, 0.18);
    const stripe = new THREE.Mesh(stripeGeo, this.barrierStripeMat);
    stripe.position.y = 0.55;
    group.add(stripe);

    const footGeo = new THREE.BoxGeometry(0.15, 0.8, 0.5);
    const footL = new THREE.Mesh(footGeo, this.tieMat);
    footL.position.set(-0.85, 0.4, 0);
    const footR = footL.clone();
    footR.position.x = 0.85;
    group.add(footL);
    group.add(footR);

    this.scene.add(group);

    const obstacleObj = {
      type: 'low_barrier',
      mesh: group,
      getBounds: () => {
        const pos = group.position;
        return {
          minX: pos.x - 0.95,
          maxX: pos.x + 0.95,
          minY: 0,
          maxY: 0.85,
          minZ: pos.z - 0.2,
          maxZ: pos.z + 0.2
        };
      }
    };

    this.activeObstacles.push(obstacleObj);
    return obstacleObj;
  }

  // --- UPDATE LOOP WITH THEME PROGRESSION ---
  update(delta, player, gameSpeed, onCrash, totalDistance) {
    const playerPos = player.mesh.position;
    const playerCol = player.getCollider();

    // Check if it's time to transition environment theme
    if (totalDistance - this.lastThemeZ > this.themeChangeDistance) {
      this.lastThemeZ = totalDistance;
      this.currentThemeIndex = (this.currentThemeIndex + 1) % this.THEMES.length;
      const nextTheme = this.getCurrentTheme();
      this.ballastMat.color.setHex(nextTheme.ballastColor);
      this.railMat.color.setHex(nextTheme.railColor);
    }

    // 1. Move oncoming trains
    for (let i = 0; i < this.movingTrains.length; i++) {
      const train = this.movingTrains[i];
      train.mesh.position.z += train.moveSpeed * delta;
    }

    // 2. Check collisions & Rooftop Ground Heights
    let calculatedGroundHeight = 0;

    for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
      const obs = this.activeObstacles[i];
      const bounds = obs.getBounds();

      // Check if Player is standing on Train Roof or climbing Ramp
      if (obs.type === 'train') {
        const onX = playerPos.x >= bounds.minX - 0.25 && playerPos.x <= bounds.maxX + 0.25;
        const onZ = playerPos.z >= bounds.minZ && playerPos.z <= bounds.maxZ;

        if (onX && onZ) {
          if (player.y >= obs.topY - 0.4) {
            calculatedGroundHeight = Math.max(calculatedGroundHeight, obs.topY);
          } else if (obs.hasRamp && playerPos.z > bounds.maxZ - 3.8) {
            const rampProgress = Math.max(0, Math.min(1, 1 - (playerPos.z - (bounds.maxZ - 3.8)) / 3.8));
            calculatedGroundHeight = Math.max(calculatedGroundHeight, rampProgress * obs.topY);
          }
        }
      }

      // Check AABB Box Overlap Collision
      const overlapX = playerCol.maxX > bounds.minX + 0.12 && playerCol.minX < bounds.maxX - 0.12;
      const overlapY = playerCol.maxY > bounds.minY + 0.1 && playerCol.minY < bounds.maxY;
      const overlapZ = playerCol.maxZ > bounds.minZ + 0.15 && playerCol.minZ < bounds.maxZ - 0.15;

      if (overlapX && overlapY && overlapZ) {
        // If on train roof or ascending ramp, ignore front crash
        if (obs.type === 'train') {
          if (player.y >= obs.topY - 0.4) {
            continue; // Safely running on roof
          }
          if (obs.hasRamp && playerPos.z > bounds.maxZ - 3.8 && player.y >= calculatedGroundHeight - 0.5) {
            continue; // Safely running up ramp
          }
        }

        if (!player.hasJetpack) {
          if (player.hasHoverboard) {
            player.hasHoverboard = false;
            player.hoverboardGroup.visible = false;
            if (!player.hasMagnet && !player.hasJetpack) player.auraMesh.visible = false;
            Audio.playCrash();

            this.collectibles.createPickupParticles(obs.mesh.position.x, 1.0, obs.mesh.position.z, 0xff4757);
            this.scene.remove(obs.mesh);
            this.activeObstacles.splice(i, 1);
            continue;
          } else {
            onCrash(obs);
            return;
          }
        }
      }

      if (bounds.minZ > playerPos.z + 20) {
        this.scene.remove(obs.mesh);
        this.activeObstacles.splice(i, 1);
      }
    }

    player.groundHeight = calculatedGroundHeight;

    // 3. Procedural Chunk Recycling
    const oldestChunk = this.chunks[0];
    if (oldestChunk && oldestChunk.z > playerPos.z + this.CHUNK_LENGTH) {
      this.scene.remove(oldestChunk.mesh);
      this.chunks.shift();
      this.spawnChunk(false);
    }
  }

  clear() {
    this.chunks.forEach(c => this.scene.remove(c.mesh));
    this.chunks = [];
    this.activeObstacles.forEach(o => this.scene.remove(o.mesh));
    this.activeObstacles = [];
    this.movingTrains = [];
    this.currentThemeIndex = 0;
    this.lastThemeZ = 0;
    this.initEnvironment();
  }
}
