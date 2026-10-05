// SODA GAME RUSH 3D — Cyber Soda Can Endless Runner & Carbonation Blast
import * as THREE from 'three';
import { sound } from '../audio.js';

export function launchSoda(container, onGameOver, onScoreUpdate) {
  let isRunning = true;
  let score = 0;
  let coins = 0;
  let fizzLevel = 25; // 0 to 100%
  let sodaVolume = 1; // Number of stacked cans or volume
  let speed = 36;
  let playerX = 0;
  let targetX = 0;
  let isSuperJet = false;
  let jetTimer = 0;
  let lastTime = performance.now();

  const width = Math.max(400, container.clientWidth || 800);
  const height = Math.max(350, container.clientHeight || 500);

  // 1. Scene & Camera
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0614);
  scene.fog = new THREE.FogExp2(0x0a0614, 0.012);

  const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 350);
  camera.position.set(0, 3.8, 7.5);
  camera.lookAt(0, 1.2, -18);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // 2. Lighting
  const dirLight = new THREE.DirectionalLight(0xff0077, 2.5);
  dirLight.position.set(5, 15, 10);
  scene.add(dirLight);

  const dirLight2 = new THREE.DirectionalLight(0x00f0ff, 2.0);
  dirLight2.position.set(-5, 10, -10);
  scene.add(dirLight2);

  scene.add(new THREE.AmbientLight(0x221133, 1.5));

  // 3. Cyber Conveyor Runway
  const runwayWidth = 12;
  const runwayGeo = new THREE.PlaneGeometry(runwayWidth, 400);
  const runwayMat = new THREE.MeshStandardMaterial({
    color: 0x120c24,
    roughness: 0.2,
    metalness: 0.8
  });
  const runway = new THREE.Mesh(runwayGeo, runwayMat);
  runway.rotation.x = -Math.PI / 2;
  runway.position.z = -150;
  scene.add(runway);

  // Glowing Edge Rails
  const railMat = new THREE.MeshBasicMaterial({ color: 0xff0077 });
  const leftRail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 400), railMat);
  leftRail.position.set(-runwayWidth / 2, 0.2, -150);
  const rightRail = leftRail.clone();
  rightRail.position.x = runwayWidth / 2;
  rightRail.material = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
  scene.add(leftRail, rightRail);

  // Moving Grid texture on track
  const gridHelper = new THREE.GridHelper(400, 60, 0xff0077, 0x331144);
  gridHelper.position.set(0, 0.04, -150);
  scene.add(gridHelper);

  // 4. Soda Bottle / Can Model (Detailed 3D Mesh)
  const playerGroup = new THREE.Group();

  // Can Body
  const canRadius = 0.55;
  const canHeight = 1.4;
  const canGeo = new THREE.CylinderGeometry(canRadius, canRadius, canHeight, 24);
  const canMat = new THREE.MeshStandardMaterial({
    color: 0xff0066,
    metalness: 0.85,
    roughness: 0.2,
    emissive: 0x330015
  });
  const canMesh = new THREE.Mesh(canGeo, canMat);
  canMesh.position.y = canHeight / 2;
  playerGroup.add(canMesh);

  // Can Top Rim
  const rimGeo = new THREE.TorusGeometry(canRadius * 0.9, 0.05, 12, 24);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.9, roughness: 0.1 });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = canHeight + 0.02;
  playerGroup.add(rim);

  // Can Pull-Tab
  const tabGeo = new THREE.BoxGeometry(0.18, 0.03, 0.35);
  const tab = new THREE.Mesh(tabGeo, rimMat);
  tab.position.set(0, canHeight + 0.05, 0.1);
  playerGroup.add(tab);

  // Soda Label Ring
  const labelGeo = new THREE.CylinderGeometry(canRadius + 0.01, canRadius + 0.01, canHeight * 0.55, 24);
  const labelMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x002244,
    metalness: 0.4,
    roughness: 0.3
  });
  const labelMesh = new THREE.Mesh(labelGeo, labelMat);
  labelMesh.position.y = canHeight / 2;
  playerGroup.add(labelMesh);

  // Bubbly Aura / Glow Shield
  const auraGeo = new THREE.SphereGeometry(1.1, 16, 16);
  const auraMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    wireframe: true,
    transparent: true,
    opacity: 0.0
  });
  const auraMesh = new THREE.Mesh(auraGeo, auraMat);
  auraMesh.position.y = canHeight / 2;
  playerGroup.add(auraMesh);

  playerGroup.position.set(0, 0, 0);
  scene.add(playerGroup);

  // 5. Jet Particles (Fizz Fountain)
  const jetCount = 60;
  const jetGeo = new THREE.BufferGeometry();
  const jetPositions = new Float32Array(jetCount * 3);
  const jetVelocities = [];

  for (let i = 0; i < jetCount; i++) {
    jetPositions[i * 3] = 0;
    jetPositions[i * 3 + 1] = canHeight + 0.2;
    jetPositions[i * 3 + 2] = 0;
    jetVelocities.push({
      vx: (Math.random() - 0.5) * 2,
      vy: Math.random() * 8 + 6,
      vz: Math.random() * 4 + 2,
      life: 0
    });
  }
  jetGeo.setAttribute('position', new THREE.BufferAttribute(jetPositions, 3));
  const jetMat = new THREE.PointsMaterial({
    color: 0x00ffff,
    size: 0.35,
    transparent: true,
    opacity: 0.0
  });
  const jetParticles = new THREE.Points(jetGeo, jetMat);
  scene.add(jetParticles);

  // 6. Collectibles & Hazards
  const items = [];
  const obstacles = [];
  const gates = [];

  // Reusable Materials & Geometries
  const bubbleGeo = new THREE.SphereGeometry(0.35, 12, 12);
  const bubbleMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x0066aa,
    roughness: 0.1,
    metalness: 0.9,
    transparent: true,
    opacity: 0.85
  });

  const miniCanGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.7, 14);
  const miniCanMat = new THREE.MeshStandardMaterial({
    color: 0xff0066,
    metalness: 0.8,
    roughness: 0.2
  });

  const iceGeo = new THREE.BoxGeometry(0.65, 0.65, 0.65);
  const iceMat = new THREE.MeshStandardMaterial({
    color: 0xaaffff,
    roughness: 0.05,
    metalness: 0.2,
    transparent: true,
    opacity: 0.75
  });

  const hazardMat = new THREE.MeshStandardMaterial({
    color: 0xff1133,
    emissive: 0x660011,
    roughness: 0.3
  });

  let nextSpawnZ = -30;

  function spawnWave() {
    const lanes = [-3.8, -1.9, 0, 1.9, 3.8];
    const waveType = Math.random();

    if (waveType < 0.35) {
      // Gate Portal (Multiplier or Fizz Booster)
      const isPositive = Math.random() > 0.2;
      const gateGroup = new THREE.Group();
      const gWidth = 3.6;
      const gHeight = 3.2;

      const archMat = new THREE.MeshBasicMaterial({ color: isPositive ? 0x00ff88 : 0xff2244 });
      const arch = new THREE.Mesh(new THREE.BoxGeometry(gWidth, 0.35, 0.4), archMat);
      arch.position.y = gHeight;
      const postL = new THREE.Mesh(new THREE.BoxGeometry(0.3, gHeight, 0.3), archMat);
      postL.position.set(-gWidth / 2, gHeight / 2, 0);
      const postR = postL.clone();
      postR.position.x = gWidth / 2;
      gateGroup.add(arch, postL, postR);

      // Gate banner screen
      const bannerGeo = new THREE.PlaneGeometry(gWidth - 0.4, 1.2);
      const bannerMat = new THREE.MeshBasicMaterial({
        color: isPositive ? 0x004422 : 0x440011,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });
      const banner = new THREE.Mesh(bannerGeo, bannerMat);
      banner.position.y = gHeight - 0.7;
      gateGroup.add(banner);

      const targetLane = lanes[Math.floor(Math.random() * lanes.length)];
      gateGroup.position.set(targetLane, 0, nextSpawnZ);
      gateGroup.userData = {
        isPositive,
        val: isPositive ? 30 : -20,
        lane: targetLane,
        passed: false
      };
      scene.add(gateGroup);
      gates.push(gateGroup);

    } else if (waveType < 0.7) {
      // Row of Fizzy Bubbles or Soda Cans
      const chosenLane = lanes[Math.floor(Math.random() * lanes.length)];
      const isCan = Math.random() > 0.5;

      for (let i = 0; i < 4; i++) {
        const itemMesh = isCan ? new THREE.Mesh(miniCanGeo, miniCanMat) : new THREE.Mesh(bubbleGeo, bubbleMat);
        itemMesh.position.set(chosenLane, 0.5, nextSpawnZ - i * 3.5);
        itemMesh.userData = {
          type: isCan ? 'can' : 'fizz',
          rotSpeed: 2 + Math.random() * 2
        };
        scene.add(itemMesh);
        items.push(itemMesh);
      }

      // Add a hazard in adjacent lane
      const otherLanes = lanes.filter(l => Math.abs(l - chosenLane) > 1.5);
      const hazardLane = otherLanes[Math.floor(Math.random() * otherLanes.length)];
      const obsGeo = new THREE.BoxGeometry(1.6, 1.4, 1.6);
      const obsMesh = new THREE.Mesh(obsGeo, hazardMat);
      obsMesh.position.set(hazardLane, 0.7, nextSpawnZ - 6);
      scene.add(obsMesh);
      obstacles.push(obsMesh);

    } else {
      // Ice Cubes + Spiked Hazard
      const chosenLane = lanes[Math.floor(Math.random() * lanes.length)];
      const iceMesh = new THREE.Mesh(iceGeo, iceMat);
      iceMesh.position.set(chosenLane, 0.6, nextSpawnZ);
      iceMesh.userData = { type: 'ice', rotSpeed: 1.5 };
      scene.add(iceMesh);
      items.push(iceMesh);

      // 2 Hazards blocking other lanes
      const hazLanes = lanes.filter(l => l !== chosenLane).slice(0, 2);
      hazLanes.forEach(hl => {
        const obsGeo = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 12);
        const obsMesh = new THREE.Mesh(obsGeo, hazardMat);
        obsMesh.position.set(hl, 0.75, nextSpawnZ);
        scene.add(obsMesh);
        obstacles.push(obsMesh);
      });
    }

    nextSpawnZ -= 38;
  }

  // Pre-seed runway
  for (let i = 0; i < 6; i++) {
    spawnWave();
  }

  // 7. Dynamic HUD Inside Container
  const hud = document.createElement('div');
  hud.style.cssText = `
    position: absolute;
    top: 14px;
    left: 14px;
    right: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    pointer-events: none;
    z-index: 10;
    font-family: 'Space Grotesk', system-ui, sans-serif;
  `;

  hud.innerHTML = `
    <div style="background: rgba(10, 15, 30, 0.75); backdrop-filter: blur(12px); border: 1px solid rgba(255, 0, 119, 0.4); border-radius: 12px; padding: 10px 18px; color: #fff;">
      <div style="font-size: 11px; color: #ff0077; font-weight: 7px; letter-spacing: 1.5px;">KIBER SODA GAZI</div>
      <div style="display: flex; align-items: center; gap: 10px; margin-top: 4px;">
        <div style="width: 140px; height: 12px; background: rgba(255,255,255,0.1); border-radius: 6px; overflow: hidden; border: 1px solid rgba(0, 240, 255, 0.3);">
          <div id="soda-fizz-bar" style="width: ${fizzLevel}%; height: 100%; background: linear-gradient(90deg, #ff0077, #00f0ff); transition: width 0.15s ease;"></div>
        </div>
        <strong id="soda-fizz-txt" style="font-size: 14px; color: #00f0ff;">${fizzLevel}%</strong>
      </div>
      <div id="soda-jet-hint" style="font-size: 10px; color: #aaa; margin-top: 3px;">[SPACE] — Kiber-Gaz Turbo (100% da)</div>
    </div>

    <div style="background: rgba(10, 15, 30, 0.75); backdrop-filter: blur(12px); border: 1px solid rgba(0, 240, 255, 0.4); border-radius: 12px; padding: 10px 18px; color: #fff; text-align: right;">
      <div style="font-size: 11px; color: #00f0ff; letter-spacing: 1.5px;">OCHKO & TO‘PLAM</div>
      <div style="font-size: 24px; font-weight: 800; color: #ffea00; margin-top: 2px;">
        <span id="soda-score-val">0</span>
      </div>
      <div style="font-size: 11px; color: #ff0077;">🥫 Hajm: <strong id="soda-vol-val">1</strong>x</div>
    </div>
  `;
  container.appendChild(hud);

  const fizzBar = hud.querySelector('#soda-fizz-bar');
  const fizzTxt = hud.querySelector('#soda-fizz-txt');
  const jetHint = hud.querySelector('#soda-jet-hint');
  const scoreVal = hud.querySelector('#soda-score-val');
  const volVal = hud.querySelector('#soda-vol-val');

  // 8. Controls
  const keys = {};

  function onKeyDown(e) {
    keys[e.key] = true;

    if (e.key === ' ' || e.key === 'w' || e.key === 'ArrowUp') {
      if (fizzLevel >= 100 && !isSuperJet) {
        activateSuperJet();
      }
    }
  }

  function onKeyUp(e) {
    keys[e.key] = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // Mouse & Touch Drag Controls
  let isPointerDown = false;
  let startPointerX = 0;
  let startPlayerX = 0;

  function onPointerDown(e) {
    isPointerDown = true;
    startPointerX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    startPlayerX = targetX;
  }

  function onPointerMove(e) {
    if (!isPointerDown) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const diff = (clientX - startPointerX) / (width * 0.4);
    targetX = Math.max(-4.5, Math.min(4.5, startPlayerX + diff * 8));
  }

  function onPointerUp() {
    isPointerDown = false;
  }

  container.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  container.addEventListener('touchstart', onPointerDown, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('touchend', onPointerUp);

  // Activate Jet
  function activateSuperJet() {
    isSuperJet = true;
    jetTimer = 4.5; // 4.5 seconds
    fizzLevel = 0;
    sound.playScore();
    auraMat.opacity = 0.8;
    jetMat.opacity = 1.0;
    jetHint.textContent = '🔥 SUPER KIBER-GAZ REJIMI!';
    jetHint.style.color = '#ffea00';
  }

  // 9. Main Game Loop
  function animate(timestamp) {
    if (!isRunning) return;
    requestAnimationFrame(animate);

    const delta = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    const currentSpeed = isSuperJet ? speed * 1.9 : speed;

    // Movement
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
      targetX = Math.max(-4.5, targetX - 12 * delta);
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
      targetX = Math.min(4.5, targetX + 12 * delta);
    }

    playerX += (targetX - playerX) * 12 * delta;
    playerGroup.position.x = playerX;
    playerGroup.rotation.z = -(targetX - playerX) * 0.25; // Tilt when steering
    playerGroup.rotation.y = Math.sin(timestamp * 0.004) * 0.15;

    // Super Jet Countdown
    if (isSuperJet) {
      jetTimer -= delta;
      camera.position.y = 4.2 + (Math.random() - 0.5) * 0.1;
      camera.position.x = playerX * 0.3 + (Math.random() - 0.5) * 0.08;

      // Update Jet Particles
      const posAttr = jetParticles.geometry.attributes.position;
      for (let i = 0; i < jetCount; i++) {
        const vel = jetVelocities[i];
        let px = posAttr.getX(i);
        let py = posAttr.getY(i);
        let pz = posAttr.getZ(i);

        py += vel.vy * delta;
        pz += vel.vz * delta;
        px += vel.vx * delta;

        if (py > 4 || pz > 6) {
          px = playerX + (Math.random() - 0.5) * 0.3;
          py = canHeight + 0.1;
          pz = 0;
        }

        posAttr.setXYZ(i, px, py, pz);
      }
      posAttr.needsUpdate = true;

      if (jetTimer <= 0) {
        isSuperJet = false;
        auraMat.opacity = 0;
        jetMat.opacity = 0;
        jetHint.textContent = '[SPACE] — Kiber-Gaz Turbo (100% da)';
        jetHint.style.color = '#aaa';
      }
    } else {
      camera.position.y = 3.8;
      camera.position.x = playerX * 0.35;
    }

    // Move track grid
    gridHelper.position.z += currentSpeed * delta;
    if (gridHelper.position.z > 0) {
      gridHelper.position.z = -50;
    }

    // Move Collectibles
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.position.z += currentSpeed * delta;
      it.rotation.y += it.userData.rotSpeed * delta;
      it.rotation.x += it.userData.rotSpeed * 0.5 * delta;

      // Magnet effect during Super Jet
      if (isSuperJet && Math.abs(it.position.z) < 25) {
        it.position.x += (playerX - it.position.x) * 8 * delta;
      }

      // Collision with player
      const dx = playerX - it.position.x;
      const dz = 0 - it.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 1.3) {
        // Collect!
        if (it.userData.type === 'fizz') {
          fizzLevel = Math.min(100, fizzLevel + 12);
          score += 15;
          coins += 1;
        } else if (it.userData.type === 'can') {
          sodaVolume += 1;
          fizzLevel = Math.min(100, fizzLevel + 18);
          score += 35;
          coins += 2;
        } else if (it.userData.type === 'ice') {
          score += 50;
          coins += 3;
        }

        sound.playScore();
        scene.remove(it);
        items.splice(i, 1);
        updateHUD();
        continue;
      }

      // Despawn passed items
      if (it.position.z > 15) {
        scene.remove(it);
        items.splice(i, 1);
      }
    }

    // Move Gates
    for (let i = gates.length - 1; i >= 0; i--) {
      const g = gates[i];
      g.position.z += currentSpeed * delta;

      if (!g.userData.passed && Math.abs(g.position.z) < 1.6) {
        if (Math.abs(playerX - g.userData.lane) < 2.2) {
          g.userData.passed = true;
          if (g.userData.isPositive) {
            fizzLevel = Math.min(100, fizzLevel + g.userData.val);
            score += 100;
            sound.playLevelUp();
          } else {
            if (!isSuperJet) {
              fizzLevel = Math.max(0, fizzLevel + g.userData.val);
              sodaVolume = Math.max(1, sodaVolume - 1);
            }
          }
          updateHUD();
        }
      }

      if (g.position.z > 15) {
        scene.remove(g);
        gates.splice(i, 1);
      }
    }

    // Move Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.position.z += currentSpeed * delta;

      // Collision Check
      const dx = playerX - obs.position.x;
      const dz = 0 - obs.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 1.4) {
        if (isSuperJet) {
          // Smash obstacle!
          sound.playGameOver();
          scene.remove(obs);
          obstacles.splice(i, 1);
          score += 75;
          continue;
        } else {
          // Crash!
          gameOver();
          return;
        }
      }

      if (obs.position.z > 15) {
        scene.remove(obs);
        obstacles.splice(i, 1);
      }
    }

    // Score over time & speed scaling
    score += Math.floor(currentSpeed * delta * 2);
    speed += delta * 0.4; // Gradually faster

    if (onScoreUpdate) onScoreUpdate(score);
    updateHUD();

    // Spawn more waves
    if (nextSpawnZ > -180) {
      spawnWave();
    }
    nextSpawnZ += currentSpeed * delta;

    renderer.render(scene, camera);
  }

  function updateHUD() {
    fizzBar.style.width = `${fizzLevel}%`;
    fizzTxt.textContent = `${Math.floor(fizzLevel)}%`;
    scoreVal.textContent = score.toLocaleString();
    volVal.textContent = sodaVolume;

    if (fizzLevel >= 100 && !isSuperJet) {
      jetHint.textContent = '🚀 [SPACE] BOSING — KIBER TURBO TAYYOR!';
      jetHint.style.color = '#00f0ff';
      fizzBar.style.boxShadow = '0 0 16px #00f0ff';
    } else if (!isSuperJet) {
      fizzBar.style.boxShadow = 'none';
    }
  }

  function gameOver() {
    if (!isRunning) return;
    isRunning = false;
    sound.playGameOver();
    if (onGameOver) onGameOver(score, coins);
  }

  requestAnimationFrame(animate);

  return {
    destroy: () => {
      isRunning = false;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      container.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);

      if (hud.parentNode) hud.parentNode.removeChild(hud);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    }
  };
}
