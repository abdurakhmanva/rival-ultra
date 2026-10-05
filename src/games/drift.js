// NEON DRIFT 3D — High-speed cyber highway dodging game
import * as THREE from 'three';
import { sound } from '../audio.js';

export function launchDrift(container, onGameOver, onScoreUpdate) {
  let isRunning = true;
  let score = 0;
  let speed = 40;
  let playerX = 0;
  let targetX = 0;

  // Setup Three.js
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x060914, 0.015);

  const width = Math.max(400, container.clientWidth || 800);
  const height = Math.max(350, container.clientHeight || 500);

  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 300);
  camera.position.set(0, 3.2, 7);
  camera.lookAt(0, 1.2, -15);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Lighting
  const light = new THREE.DirectionalLight(0xff00ff, 2.5);
  light.position.set(10, 20, 10);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x00f0ff, 1.2));

  // Cyber Highway Road
  const roadGeo = new THREE.PlaneGeometry(14, 400);
  const roadMat = new THREE.MeshBasicMaterial({ color: 0x0a0f1d, side: THREE.DoubleSide });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.z = -150;
  scene.add(road);

  // Road grid lines
  const gridHelper = new THREE.GridHelper(400, 80, 0x00f0ff, 0x112244);
  gridHelper.position.y = 0.05;
  gridHelper.position.z = -150;
  scene.add(gridHelper);

  // Player Vehicle (Stylized Cyber Car)
  const carGroup = new THREE.Group();
  const bodyGeo = new THREE.BoxGeometry(1.4, 0.5, 2.4);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, roughness: 0.2, metalness: 0.8 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.45;
  carGroup.add(body);

  const cabinGeo = new THREE.BoxGeometry(1.0, 0.45, 1.2);
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0xff007f, roughness: 0.1 });
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.position.set(0, 0.8, -0.2);
  carGroup.add(cabin);

  // Neon Taillights
  const tailGeo = new THREE.BoxGeometry(0.3, 0.1, 0.05);
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
  const leftTail = new THREE.Mesh(tailGeo, tailMat);
  leftTail.position.set(-0.5, 0.5, 1.22);
  const rightTail = leftTail.clone();
  rightTail.position.x = 0.5;
  carGroup.add(leftTail, rightTail);

  scene.add(carGroup);

  // Obstacles (Cyber drones / barriers)
  const obstacles = [];
  const obsGeo = new THREE.BoxGeometry(1.5, 1.2, 1.5);
  const obsMat = new THREE.MeshStandardMaterial({ color: 0xff3300, emissive: 0x991100, roughness: 0.3 });

  function spawnObstacle() {
    if (!isRunning) return;
    const obs = new THREE.Mesh(obsGeo, obsMat);
    const lanes = [-4.5, -2.25, 0, 2.25, 4.5];
    obs.position.x = lanes[Math.floor(Math.random() * lanes.length)];
    obs.position.y = 0.6;
    obs.position.z = -180;
    scene.add(obs);
    obstacles.push(obs);
  }

  const spawnTimer = setInterval(spawnObstacle, 750);

  // Controls
  const onKeyDown = (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') targetX = Math.max(-5, targetX - 2.25);
    if (e.code === 'ArrowRight' || e.code === 'KeyD') targetX = Math.min(5, targetX + 2.25);
  };
  window.addEventListener('keydown', onKeyDown);

  // Touch / mouse steering
  const onMouseMove = (e) => {
    const rect = container.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    targetX = Math.max(-5, Math.min(5, nx * 5.5));
  };
  container.addEventListener('mousemove', onMouseMove);

  let lastTime = performance.now();

  function animate(t) {
    if (!isRunning) return;
    requestAnimationFrame(animate);

    const delta = Math.min((t - lastTime) / 1000, 0.1);
    lastTime = t;

    // Increase speed and score
    speed += delta * 1.5;
    score += Math.floor(speed * delta * 2.5);
    if (onScoreUpdate) onScoreUpdate(score);

    // Smooth car movement
    playerX += (targetX - playerX) * Math.min(1, delta * 14);
    carGroup.position.x = playerX;
    carGroup.rotation.z = -(targetX - playerX) * 0.12;

    // Move grid road for illusion of speed
    gridHelper.position.z += speed * delta;
    if (gridHelper.position.z > -100) gridHelper.position.z = -150;

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.position.z += speed * delta;

      // Collision check
      if (Math.abs(obs.position.z - carGroup.position.z) < 1.8 && Math.abs(obs.position.x - playerX) < 1.3) {
        // Crash!
        isRunning = false;
        sound.playGameOver();
        if (onGameOver) onGameOver(score);
        return;
      }

      if (obs.position.z > 15) {
        scene.remove(obs);
        obstacles.splice(i, 1);
      }
    }

    renderer.render(scene, camera);
  }

  requestAnimationFrame(animate);

  return {
    destroy: () => {
      isRunning = false;
      clearInterval(spawnTimer);
      window.removeEventListener('keydown', onKeyDown);
      container.removeEventListener('mousemove', onMouseMove);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    }
  };
}
