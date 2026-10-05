// SUBWAY DASH 3D — Full 3D 3-Lane Subway Runner
import * as THREE from 'three';
import { sound } from '../audio.js';

export function launchSubway(container, onGameOver, onScoreUpdate) {
  let isRunning = true;
  let score = 0;
  let coins = 0;
  let speed = 25;
  const maxSpeed = 48;
  const laneWidth = 3.0;

  const width = Math.max(400, container.clientWidth || 800);
  const height = Math.max(350, container.clientHeight || 500);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a1020);
  scene.fog = new THREE.FogExp2(0x0a1020, 0.012);

  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 400);
  camera.position.set(0, 3.8, 7.5);
  camera.lookAt(0, 1.8, -10);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  container.appendChild(renderer.domElement);

  // Sunlight & Ambient
  const sun = new THREE.DirectionalLight(0xffeedd, 2.2);
  sun.position.set(15, 30, 15);
  sun.castShadow = true;
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0x00f0ff, 1.0));

  // Player Character
  const playerGroup = new THREE.Group();
  let lane = 0; // -1, 0, 1
  let targetX = 0;
  let playerX = 0;
  let yVelocity = 0;
  let isGrounded = true;
  let isSliding = false;
  let slideTimer = 0;

  // Character Mesh
  const bodyGeo = new THREE.BoxGeometry(0.7, 0.8, 0.45);
  const hoodieMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, roughness: 0.3 });
  const body = new THREE.Mesh(bodyGeo, hoodieMat);
  body.position.y = 0.9;
  body.castShadow = true;
  playerGroup.add(body);

  const headGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffcc99, roughness: 0.5 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.5;
  head.castShadow = true;

  // Cap
  const capGeo = new THREE.BoxGeometry(0.48, 0.15, 0.48);
  const capMat = new THREE.MeshStandardMaterial({ color: 0xff0055 });
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = 0.22;
  head.add(cap);
  playerGroup.add(head);

  // Limbs
  const legGeo = new THREE.BoxGeometry(0.24, 0.6, 0.26);
  const jeansMat = new THREE.MeshStandardMaterial({ color: 0x1a2638 });
  const leftLeg = new THREE.Mesh(legGeo, jeansMat);
  leftLeg.position.set(-0.2, 0.3, 0);
  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.2;
  playerGroup.add(leftLeg, rightLeg);

  scene.add(playerGroup);

  // Rails and Ground Tracks
  const trackGroup = new THREE.Group();
  const groundGeo = new THREE.PlaneGeometry(16, 400);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x121824, roughness: 0.8 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.z = -150;
  trackGroup.add(ground);

  // 3 Lanes of rails
  [-laneWidth, 0, laneWidth].forEach(lx => {
    const railGeo = new THREE.BoxGeometry(0.12, 0.15, 400);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x8899aa, metalness: 0.8 });
    const r1 = new THREE.Mesh(railGeo, railMat);
    r1.position.set(lx - 0.7, 0.08, -150);
    const r2 = r1.clone();
    r2.position.x = lx + 0.7;
    trackGroup.add(r1, r2);
  });
  scene.add(trackGroup);

  // Obstacles & Coins
  const obstacles = [];
  const coinsList = [];

  const trainMat = new THREE.MeshStandardMaterial({ color: 0xcc2233, roughness: 0.4 });
  const hurdleMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.4 });
  const coinMat = new THREE.MeshStandardMaterial({ color: 0xffea00, metalness: 0.9, roughness: 0.2, emissive: 0x443300 });

  function spawnChunk(z) {
    const lanes = [-laneWidth, 0, laneWidth];
    lanes.sort(() => Math.random() - 0.5);

    const type = Math.random();
    if (type < 0.4) {
      // Train on one lane
      const trainGeo = new THREE.BoxGeometry(2.4, 3.2, 18);
      const train = new THREE.Mesh(trainGeo, trainMat);
      train.position.set(lanes[0], 1.6, z);
      scene.add(train);
      obstacles.push({ mesh: train, type: 'TRAIN', height: 3.2, x: lanes[0], z, depth: 18 });
    } else {
      // Hurdle on one lane
      const hurdleGeo = new THREE.BoxGeometry(2.4, 0.9, 0.3);
      const hurdle = new THREE.Mesh(hurdleGeo, hurdleMat);
      hurdle.position.set(lanes[0], 0.45, z);
      scene.add(hurdle);
      obstacles.push({ mesh: hurdle, type: 'HURDLE', height: 0.9, x: lanes[0], z, depth: 0.3 });
    }

    // Spawn coins in an open lane
    const coinLane = lanes[1];
    for (let c = 0; c < 4; c++) {
      const coinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.1, 12), coinMat);
      coinMesh.rotation.x = Math.PI / 2;
      coinMesh.position.set(coinLane, 0.8, z - c * 3 + 4);
      scene.add(coinMesh);
      coinsList.push(coinMesh);
    }
  }

  // Pre-spawn chunks ahead
  for (let z = -30; z > -250; z -= 35) {
    spawnChunk(z);
  }

  // Input Handling
  const onKey = (e) => {
    if (!isRunning) return;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      lane = Math.max(-1, lane - 1);
      targetX = lane * laneWidth;
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      lane = Math.min(1, lane + 1);
      targetX = lane * laneWidth;
    }
    if ((e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') && isGrounded) {
      yVelocity = 17;
      isGrounded = false;
      sound.playClick();
    }
    if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      if (!isGrounded) yVelocity = -25; // Fast dive
      isSliding = true;
      slideTimer = 0.6;
      body.scale.set(1.2, 0.4, 1.2);
      body.position.y = 0.4;
      head.position.y = 0.8;
      sound.playClick();
    }
  };
  window.addEventListener('keydown', onKey);

  // Swipe support
  let tX = 0, tY = 0;
  container.addEventListener('touchstart', (e) => {
    tX = e.touches[0].clientX;
    tY = e.touches[0].clientY;
  }, { passive: true });
  container.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - tX;
    const dy = e.changedTouches[0].clientY - tY;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 25) { lane = Math.min(1, lane + 1); targetX = lane * laneWidth; }
      else if (dx < -25) { lane = Math.max(-1, lane - 1); targetX = lane * laneWidth; }
    } else {
      if (dy < -25 && isGrounded) { yVelocity = 17; isGrounded = false; }
      else if (dy > 25) { isSliding = true; slideTimer = 0.6; }
    }
  }, { passive: true });

  let lastT = performance.now();

  function animate(t) {
    if (!isRunning) return;
    requestAnimationFrame(animate);

    const delta = Math.min((t - lastT) / 1000, 0.1);
    lastT = t;

    speed = Math.min(maxSpeed, speed + delta * 0.8);
    score += Math.floor(speed * delta * 4);
    if (onScoreUpdate) onScoreUpdate(score);

    // Player Horizontal Interpolation
    playerX += (targetX - playerX) * Math.min(1, delta * 15);
    playerGroup.position.x = playerX;
    playerGroup.rotation.z = -(targetX - playerX) * 0.1;

    // Player Gravity & Jump
    if (!isGrounded) {
      yVelocity -= 48 * delta;
      playerGroup.position.y += yVelocity * delta;
      if (playerGroup.position.y <= 0) {
        playerGroup.position.y = 0;
        yVelocity = 0;
        isGrounded = true;
      }
    }

    // Sliding Timer
    if (isSliding) {
      slideTimer -= delta;
      if (slideTimer <= 0) {
        isSliding = false;
        body.scale.set(1, 1, 1);
        body.position.y = 0.9;
        head.position.y = 1.5;
      }
    }

    // Running animation
    const cycle = Date.now() * 0.015 * (speed / 25);
    leftLeg.rotation.x = Math.sin(cycle) * 0.8;
    rightLeg.rotation.x = -Math.sin(cycle) * 0.8;

    // Move Obstacles towards player (+Z)
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.mesh.position.z += speed * delta;
      obs.z = obs.mesh.position.z;

      // Collision Check
      if (Math.abs(obs.z - playerGroup.position.z) < obs.depth / 2 + 0.3) {
        if (Math.abs(obs.x - playerX) < 1.1) {
          if (obs.type === 'TRAIN' && playerGroup.position.y < obs.height - 0.5) {
            crash();
            return;
          } else if (obs.type === 'HURDLE' && playerGroup.position.y < obs.height - 0.2) {
            crash();
            return;
          }
        }
      }

      if (obs.z > 20) {
        scene.remove(obs.mesh);
        obstacles.splice(i, 1);
        spawnChunk(-240);
      }
    }

    // Move & Collect Coins
    for (let i = coinsList.length - 1; i >= 0; i--) {
      const c = coinsList[i];
      c.position.z += speed * delta;
      c.rotation.z += delta * 5;

      if (Math.hypot(c.position.x - playerX, c.position.z - playerGroup.position.z) < 1.2) {
        if (Math.abs(c.position.y - playerGroup.position.y - 0.8) < 1.4) {
          scene.remove(c);
          coinsList.splice(i, 1);
          coins++;
          score += 100;
          sound.playClick();
          continue;
        }
      }

      if (c.position.z > 20) {
        scene.remove(c);
        coinsList.splice(i, 1);
      }
    }

    renderer.render(scene, camera);
  }

  function crash() {
    isRunning = false;
    sound.playGameOver();
    if (onGameOver) onGameOver(score);
  }

  requestAnimationFrame(animate);

  return {
    destroy: () => {
      isRunning = false;
      window.removeEventListener('keydown', onKey);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    }
  };
}
