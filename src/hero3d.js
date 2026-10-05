import * as THREE from 'three';

export class Hero3DScene {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.init();
    this.createCore();
    this.createParticles();
    this.addEventListeners();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 0, 18);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // Soft cyber lighting
    const ambient = new THREE.AmbientLight(0x112233, 1.5);
    this.scene.add(ambient);

    const lightCyan = new THREE.PointLight(0x00f0ff, 3, 50);
    lightCyan.position.set(10, 15, 10);
    this.scene.add(lightCyan);

    const lightMagenta = new THREE.PointLight(0xff007f, 3, 50);
    lightMagenta.position.set(-10, -10, 10);
    this.scene.add(lightMagenta);
  }

  createCore() {
    this.coreGroup = new THREE.Group();

    // 1. Central Icosahedron Crystal
    const icoGeo = new THREE.IcosahedronGeometry(2.4, 1);
    const icoMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      wireframe: true,
      emissive: 0x005577,
      roughness: 0.2
    });
    this.crystal = new THREE.Mesh(icoGeo, icoMat);
    this.coreGroup.add(this.crystal);

    // Inner Glowing Core
    const innerGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0xff00aa });
    this.innerCore = new THREE.Mesh(innerGeo, innerMat);
    this.coreGroup.add(this.innerCore);

    // 2. Gyro Orbit Ring A (Cyan)
    const ringGeo = new THREE.TorusGeometry(4.2, 0.05, 16, 100);
    const ringMatA = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    this.ringA = new THREE.Mesh(ringGeo, ringMatA);
    this.coreGroup.add(this.ringA);

    // 3. Gyro Orbit Ring B (Magenta)
    const ringMatB = new THREE.MeshBasicMaterial({ color: 0xff007f });
    this.ringB = new THREE.Mesh(ringGeo, ringMatB);
    this.ringB.rotation.x = Math.PI / 3;
    this.coreGroup.add(this.ringB);

    // 4. Gyro Orbit Ring C (Amber Gold)
    const ringMatC = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    this.ringC = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.04, 16, 100), ringMatC);
    this.ringC.rotation.y = Math.PI / 4;
    this.coreGroup.add(this.ringC);

    this.scene.add(this.coreGroup);
  }

  createParticles() {
    const pCount = 350;
    const pGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(pCount * 3);
    const colors = new Float32Array(pCount * 3);

    const c1 = new THREE.Color(0x00f0ff);
    const c2 = new THREE.Color(0xff007f);

    for (let i = 0; i < pCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const dist = 5 + Math.random() * 22;

      positions[i * 3] = dist * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = dist * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = dist * Math.cos(phi);

      const mixed = c1.clone().lerp(c2, Math.random());
      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(pGeo, pMat);
    this.scene.add(this.particles);
  }

  addEventListeners() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  animate() {
    requestAnimationFrame(this.animate);

    // Smooth mouse parallax
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Rotate core and gyro rings
    if (this.coreGroup) {
      this.coreGroup.rotation.y += 0.005;
      this.coreGroup.rotation.x = this.mouse.y * 0.35;
      this.coreGroup.rotation.z = -this.mouse.x * 0.35;

      this.crystal.rotation.x += 0.01;
      this.crystal.rotation.y += 0.015;

      this.ringA.rotation.x += 0.012;
      this.ringB.rotation.y += 0.016;
      this.ringC.rotation.z += 0.008;

      // Pulse inner core scale
      const s = 1 + Math.sin(Date.now() * 0.003) * 0.15;
      this.innerCore.scale.set(s, s, s);
    }

    if (this.particles) {
      this.particles.rotation.y += 0.001;
    }

    this.camera.position.x = this.mouse.x * 2.5;
    this.camera.position.y = -this.mouse.y * 2.5;
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
  }
}
