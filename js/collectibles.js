/**
 * Saurabh's Sprint - Collectibles & Power-Ups System
 */

class CollectibleManager {
  constructor(scene) {
    this.scene = scene;
    this.items = []; // Active collectibles

    // Shared geometries and materials for peak WebGL performance
    this.coinGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 14);
    this.coinMat = new THREE.MeshStandardMaterial({
      color: 0xffd32a,
      emissive: 0xff9f1a,
      emissiveIntensity: 0.35,
      metalness: 0.85,
      roughness: 0.25
    });

    // Particle Sparks on collection
    this.particles = [];
    this.initParticlePool();
  }

  initParticlePool() {
    this.particleGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    this.particleMat = new THREE.MeshBasicMaterial({ color: 0xffd32a });
  }

  // Spawn Coin at specific position
  spawnCoin(x, y, z) {
    const coin = new THREE.Mesh(this.coinGeo, this.coinMat);
    coin.rotation.x = Math.PI / 2;
    coin.position.set(x, y + 0.45, z);
    coin.castShadow = true;

    const itemObj = {
      type: 'coin',
      mesh: coin,
      baseY: y + 0.45,
      collected: false,
      value: 1
    };

    this.scene.add(coin);
    this.items.push(itemObj);
    return itemObj;
  }

  // Spawn Coin Arcs
  spawnCoinArc(laneX, startZ, count = 5, startY = 0) {
    const spacing = 2.4;
    for (let i = 0; i < count; i++) {
      const progress = i / (count - 1);
      const arcY = startY + Math.sin(progress * Math.PI) * 1.8;
      this.spawnCoin(laneX, arcY, startZ - i * spacing);
    }
  }

  // Spawn Sky Coins for Jetpack Flight
  spawnJetpackCoins(startZ, count = 15) {
    const spacing = 3.0;
    for (let i = 0; i < count; i++) {
      const lane = (i % 3) - 1; // Sway between lanes
      this.spawnCoin(lane * 2.2, 5.2, startZ - i * spacing);
    }
  }

  // Spawn Power-Up Mesh
  spawnPowerUp(type, x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y + 0.7, z);

    let color = 0xff4757;
    if (type === 'multiplier') color = 0xffa502;
    if (type === 'hoverboard') color = 0x2ed573;
    if (type === 'jetpack') color = 0x00d2d3;

    // Outer Glow Ring
    const ringGeo = new THREE.TorusGeometry(0.45, 0.08, 8, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: color });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    group.add(ring);

    // Inner Icon shape
    if (type === 'magnet') {
      // Horseshoe Magnet
      const magnetGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8, 1, true, 0, Math.PI);
      const magnetMat = new THREE.MeshLambertMaterial({ color: 0xff4757 });
      const magnetMesh = new THREE.Mesh(magnetGeo, magnetMat);
      magnetMesh.rotation.z = Math.PI;
      group.add(magnetMesh);
    } else if (type === 'multiplier') {
      // 2X Diamond
      const starGeo = new THREE.OctahedronGeometry(0.3, 0);
      const starMat = new THREE.MeshStandardMaterial({ color: 0xfffa65, emissive: 0xffa502, emissiveIntensity: 0.5 });
      const star = new THREE.Mesh(starGeo, starMat);
      group.add(star);
    } else if (type === 'hoverboard') {
      // Mini Board
      const boardGeo = new THREE.BoxGeometry(0.4, 0.06, 0.8);
      const boardMat = new THREE.MeshStandardMaterial({ color: 0x2ed573, emissive: 0x2ed573, emissiveIntensity: 0.4 });
      const board = new THREE.Mesh(boardGeo, boardMat);
      group.add(board);
    } else if (type === 'jetpack') {
      // Mini Rocket
      const rocketGeo = new THREE.ConeGeometry(0.2, 0.5, 8);
      const rocketMat = new THREE.MeshStandardMaterial({ color: 0x00d2d3, emissive: 0x54a0ff, emissiveIntensity: 0.5 });
      const rocket = new THREE.Mesh(rocketGeo, rocketMat);
      group.add(rocket);
    }

    const itemObj = {
      type: type,
      mesh: group,
      baseY: y + 0.7,
      collected: false
    };

    this.scene.add(group);
    this.items.push(itemObj);
    return itemObj;
  }

  // Trigger Spark Particles
  createPickupParticles(x, y, z, colorHex = 0xffd32a) {
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Mesh(this.particleGeo, new THREE.MeshBasicMaterial({ color: colorHex }));
      p.position.set(x, y, z);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 5 + 2,
        (Math.random() - 0.5) * 6
      );
      this.scene.add(p);
      this.particles.push({ mesh: p, vel: vel, life: 0.4 });
    }
  }

  update(delta, player, onCollectCoin, onCollectPowerUp) {
    const playerPos = player.mesh.position;
    const playerCol = player.getCollider();
    const magnetActive = player.hasMagnet;
    const magnetRadius = 14.0;

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;
      p.mesh.position.addScaledVector(p.vel, delta);
      p.vel.y -= 9.8 * delta; // Gravity on sparks
      p.mesh.scale.setScalar(p.life / 0.4);

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }

    // Update Items
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      const pos = item.mesh.position;

      // Spin animation
      item.mesh.rotation.y += delta * 3.5;
      item.mesh.position.y = item.baseY + Math.sin(Date.now() * 0.005 + pos.x) * 0.12;

      // Magnet Pull Physics
      if (item.type === 'coin' && magnetActive && !item.collected) {
        const distToPlayer = pos.distanceTo(playerPos);
        if (distToPlayer < magnetRadius) {
          const dir = new THREE.Vector3().subVectors(playerPos, pos).normalize();
          const speed = Math.max(18, (1 - distToPlayer / magnetRadius) * 35);
          item.mesh.position.addScaledVector(dir, speed * delta);
          item.baseY = item.mesh.position.y;
        }
      }

      // Check collision with Player
      const dx = Math.abs(pos.x - playerPos.x);
      const dy = Math.abs(pos.y - (playerPos.y + (player.isSliding ? 0.4 : 0.9)));
      const dz = Math.abs(pos.z - playerPos.z);

      if (dx < 0.75 && dy < 1.2 && dz < 0.9 && !item.collected) {
        item.collected = true;

        if (item.type === 'coin') {
          this.createPickupParticles(pos.x, pos.y, pos.z, 0xffd32a);
          Audio.playCoin();
          onCollectCoin(item.value);
        } else {
          // Power-up collected
          this.createPickupParticles(pos.x, pos.y, pos.z, 0x00ffff);
          onCollectPowerUp(item.type);
        }

        this.scene.remove(item.mesh);
        this.items.splice(i, 1);
        continue;
      }

      // Despawn if passed behind player
      if (pos.z > playerPos.z + 15) {
        this.scene.remove(item.mesh);
        this.items.splice(i, 1);
      }
    }
  }

  clear() {
    this.items.forEach(item => this.scene.remove(item.mesh));
    this.items = [];
    this.particles.forEach(p => this.scene.remove(p.mesh));
    this.particles = [];
  }
}
