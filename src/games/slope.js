// SLOPE 3D — Extreme Neon Rolling Ball down endless 3D slopes
import * as THREE from 'three';
import { sound } from '../audio.js';

export function launchSlope(container, onGameOver, onScoreUpdate) {
  let isRunning = true;
  let score = 0;
  let speed = 35;
  let ballX = 0;
  let ballVelocityX = 0;

  const width = Math.max(400, container.clientWidth || 800);
  const height = Math.max(350, container.clientHeight || 500);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070e);
  scene.fog = new THREE.FogExp2(0x05070e, 0.01);

  const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 400);
  camera.position.set(0, 4, 8);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Lighting
  scene.add(new THREE.AmbientLight(0x00f0ff, 1.2));
  const pLight = new THREE.PointLight(0x00ffcc, 3, 40);
  pLight.position.set(0, 8, 5);
  scene.add(pLight);

  // Player Glowing Sphere
  const ballGeo = new THREE.SphereGeometry(0.7, 24, 24);
  const ballMat = new THREE.MeshStandardMaterial({
    color: 0x00ffcc,
    emissive: 0x008866,
    metalness: 0.9,
    roughness: 0.1
  });
  const ball = new THREE.Mesh(ballGeo, ballMat);
  ball.position.set(0, 0.7, 0);
  scene.add(ball);

  // Procedural Platforms & Slopes
  const platforms = [];
  const hazards = [];
  const slopeMat = new THREE.MeshStandardMaterial({ color: 0x0d1525, roughness: 0.5 });
  const borderMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
  const hazardMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });

  let nextZ = 0;

  function spawnSlopeSegment() {
    const segLength = 40;
    const segWidth = Math.max(8, 14 - (score / 1000));
    const pGroup = new THREE.Group();
    pGroup.position.z = nextZ;

    // Road surface
    const floor = new THREE.Mesh(new THREE.BoxGeometry(segWidth, 1, segLength), slopeMat);
    floor.position.set(0, -0.5, -segLength / 2);
    pGroup.add(floor);

    // Glowing border edges
    const leftEdge = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, segLength), borderMat);
    leftEdge.position.set(-segWidth / 2, 0.2, -segLength / 2);
    const rightEdge = leftEdge.clone();
    rightEdge.position.x = segWidth / 2;
    pGroup.add(leftEdge, rightEdge);

    // Spawn red hazards on platforms
    if (nextZ < -40) {
      const hazardCount = Math.floor(Math.random() * 2) + 1;
      for (let h = 0; h < hazardCount; h++) {
        const hzX = (Math.random() - 0.5) * (segWidth - 2.5);
        const hzZ = nextZ - Math.random() * (segLength - 10) - 5;
        const hzMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), hazardMat);
        hzMesh.position.set(hzX, 0.7, hzZ);
        scene.add(hzMesh);
        hazards.push(hzMesh);
      }
    }

    scene.add(pGroup);
    platforms.push({ group: pGroup, width: segWidth, zStart: nextZ, zEnd: nextZ - segLength });
    nextZ -= segLength;
  }

  // Pre-spawn initial slopes
  for (let i = 0; i < 7; i++) {
    spawnSlopeSegment();
  }

  // Input
  let steerDir = 0;
  const onKeyDown = (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') steerDir = -1;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') steerDir = 1;
  };
  const onKeyUp = (e) => {
    if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && steerDir === -1) steerDir = 0;
    if ((e.code === 'ArrowRight' || e.code === 'KeyD') && steerDir === 1) steerDir = 0;
  };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // Mouse / Touch steering
  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    steerDir = nx * 1.5;
  });

  let lastT = performance.now();

  function animate(t) {
    if (!isRunning) return;
    requestAnimationFrame(animate);

    const delta = Math.min((t - lastT) / 1000, 0.1);
    lastT = t;

    speed += delta * 1.2;
    score += Math.floor(speed * delta * 5);
    if (onScoreUpdate) onScoreUpdate(score);

    // Ball physics
    ballVelocityX = steerDir * 18;
    ballX += ballVelocityX * delta;
    ball.position.x = ballX;
    ball.rotation.x -= speed * delta * 1.5;
    ball.rotation.z = -steerDir * 0.4;

    // Move slopes and hazards towards player (+Z)
    const moveZ = speed * delta;
    platforms.forEach(p => {
      p.group.position.z += moveZ;
      p.zStart += moveZ;
      p.zEnd += moveZ;
    });

    hazards.forEach((h, idx) => {
      h.position.z += moveZ;

      // Hazard Collision
      if (Math.hypot(h.position.x - ballX, h.position.z - ball.position.z) < 1.3) {
        gameOver();
        return;
      }
    });

    // Check if ball fell off current platform edge
    const currentPlatform = platforms.find(p => p.zStart >= 0 && p.zEnd <= 0);
    if (currentPlatform) {
      if (Math.abs(ballX) > currentPlatform.width / 2 + 0.3) {
        // Fell off edge!
        ball.position.y -= delta * 30;
        gameOver();
        return;
      }
    }

    // Recycle oldest platform
    if (platforms[0].zEnd > 20) {
      const old = platforms.shift();
      scene.remove(old.group);
      spawnSlopeSegment();
    }

    // Camera follow ball with tilt
    camera.position.x = ballX * 0.45;
    camera.lookAt(ballX * 0.5, 0.5, -15);

    renderer.render(scene, camera);
  }

  function gameOver() {
    if (!isRunning) return;
    isRunning = false;
    sound.playGameOver();
    if (onGameOver) onGameOver(score);
  }

  requestAnimationFrame(animate);

  return {
    destroy: () => {
      isRunning = false;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    }
  };
}
