import * as THREE from 'three';

/**
 * Floating dust/pollen particles in the air — animated each frame
 */
export function createParticles(scene) {
  const count = 600;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 40;
    positions[i * 3 + 1] = Math.random() * 7 + 0.5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
    velocities[i * 3] = (Math.random() - 0.5) * 0.003;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.001;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.003;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.03,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geo, mat);
  points.userData.velocities = velocities;
  scene.add(points);
  return points;
}

/** Animate particles each frame */
export function updateParticles(particles) {
  const pos = particles.geometry.attributes.position;
  const vel = particles.userData.velocities;
  for (let i = 0; i < pos.count; i++) {
    pos.array[i * 3] += vel[i * 3];
    pos.array[i * 3 + 1] += vel[i * 3 + 1];
    pos.array[i * 3 + 2] += vel[i * 3 + 2];
    // wrap bounds
    if (pos.array[i * 3] > 20) pos.array[i * 3] = -20;
    if (pos.array[i * 3] < -20) pos.array[i * 3] = 20;
    if (pos.array[i * 3 + 1] > 7.5) pos.array[i * 3 + 1] = 0.5;
    if (pos.array[i * 3 + 1] < 0.5) pos.array[i * 3 + 1] = 7.5;
    if (pos.array[i * 3 + 2] > 20) pos.array[i * 3 + 2] = -20;
    if (pos.array[i * 3 + 2] < -20) pos.array[i * 3 + 2] = 20;
  }
  pos.needsUpdate = true;
}

/**
 * Irrigation pipe network running along tower rows
 */
export function createIrrigationPipes(scene, towerPositions) {
  const group = new THREE.Group();
  const pipeMat = new THREE.MeshStandardMaterial({
    color: 0x5588aa,
    roughness: 0.25,
    metalness: 0.6,
  });
  const jointMat = new THREE.MeshStandardMaterial({
    color: 0x447799,
    roughness: 0.3,
    metalness: 0.7,
  });

  // Main horizontal header pipes along each row
  const rowXs = [...new Set(towerPositions.map(p => p[0]))];
  const allZ = towerPositions.map(p => p[1]);
  const minZ = Math.min(...allZ) - 1;
  const maxZ = Math.max(...allZ) + 1;
  const pipeLen = maxZ - minZ;

  rowXs.forEach(x => {
    // Header pipe at top
    const header = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, pipeLen, 8),
      pipeMat
    );
    header.rotation.x = Math.PI / 2;
    header.position.set(x, 3.9, (minZ + maxZ) / 2);
    group.add(header);

    // Drip line at bottom
    const drip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, pipeLen, 6),
      pipeMat
    );
    drip.rotation.x = Math.PI / 2;
    drip.position.set(x + 0.15, 0.3, (minZ + maxZ) / 2);
    group.add(drip);
  });

  // Vertical drop pipes at each tower
  towerPositions.forEach(([x, z]) => {
    const drop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 3.6, 6),
      pipeMat
    );
    drop.position.set(x + 0.18, 2.1, z);
    group.add(drop);

    // Joint/elbow at top
    const joint = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 8, 6),
      jointMat
    );
    joint.position.set(x + 0.18, 3.9, z);
    group.add(joint);
  });

  scene.add(group);
}

/**
 * Nutrient reservoir tanks at the end of the greenhouse
 */
export function createNutrientTanks(scene) {
  const group = new THREE.Group();

  const tankMat = new THREE.MeshStandardMaterial({
    color: 0x2a6e4e,
    roughness: 0.35,
    metalness: 0.15,
  });
  const lidMat = new THREE.MeshStandardMaterial({
    color: 0x1f5a3e,
    roughness: 0.4,
    metalness: 0.2,
  });
  const labelMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0,
  });

  const tankData = [
    { x: -7, z: -22, label: 'N' },
    { x: -4, z: -22, label: 'P' },
    { x: 4, z: -22, label: 'K' },
    { x: 7, z: -22, label: 'pH' },
  ];

  tankData.forEach(({ x, z }) => {
    // Tank body
    const tank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 1.4, 16),
      tankMat
    );
    tank.position.set(x, 0.7, z);
    tank.castShadow = true;
    group.add(tank);

    // Lid
    const lid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.58, 0.55, 0.08, 16),
      lidMat
    );
    lid.position.set(x, 1.44, z);
    group.add(lid);

    // Label stripe
    const stripe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.56, 0.56, 0.15, 16, 1, true),
      labelMat
    );
    stripe.position.set(x, 0.8, z);
    group.add(stripe);

    // Outlet pipe going to main line
    const outlet = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 1.5, 6),
      new THREE.MeshStandardMaterial({ color: 0x5588aa, roughness: 0.3, metalness: 0.6 })
    );
    outlet.rotation.x = Math.PI / 2;
    outlet.position.set(x, 0.35, z + 0.8);
    group.add(outlet);
  });

  scene.add(group);
}

/**
 * Monitoring control panel / workstation
 */
export function createControlPanel(scene) {
  const group = new THREE.Group();

  // Desk
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5, metalness: 0.3 });
  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.7), deskMat);
  desk.position.set(0, 0.9, -23);
  desk.castShadow = true;
  group.add(desk);

  // Desk legs
  const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6);
  [[-0.8, -0.3], [-0.8, 0.3], [0.8, -0.3], [0.8, 0.3]].forEach(([dx, dz]) => {
    const leg = new THREE.Mesh(legGeo, deskMat);
    leg.position.set(dx, 0.45, -23 + dz);
    group.add(leg);
  });

  // Monitor screen
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x112211,
    emissive: 0x113322,
    emissiveIntensity: 0.8,
    roughness: 0.1,
    metalness: 0.5,
  });
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.03), screenMat);
  screen.position.set(0, 1.45, -23.2);
  group.add(screen);

  // Screen border
  const borderMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3, metalness: 0.7 });
  const border = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.61, 0.02), borderMat);
  border.position.set(0, 1.45, -23.22);
  group.add(border);

  // Monitor stand
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.5, 8), borderMat);
  stand.position.set(0, 1.15, -23.2);
  group.add(stand);

  // Screen glow light
  const glow = new THREE.PointLight(0x22aa66, 0.4, 3);
  glow.position.set(0, 1.45, -22.8);
  group.add(glow);

  // Keyboard
  const kbMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.4 });
  const kb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.18), kbMat);
  kb.position.set(0, 0.94, -22.85);
  group.add(kb);

  scene.add(group);
}

/**
 * Ventilation fans on greenhouse walls
 */
export function createVentilationFans(scene) {
  const group = new THREE.Group();

  const housingMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.4, metalness: 0.6 });
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.5 });
  const guardMat = new THREE.MeshStandardMaterial({
    color: 0x555555, roughness: 0.4, metalness: 0.6,
    wireframe: true,
  });

  const fanPositions = [
    { x: -10, z: -10, rot: Math.PI / 2 },
    { x: -10, z: 0, rot: Math.PI / 2 },
    { x: -10, z: 10, rot: Math.PI / 2 },
    { x: 10, z: -10, rot: -Math.PI / 2 },
    { x: 10, z: 0, rot: -Math.PI / 2 },
    { x: 10, z: 10, rot: -Math.PI / 2 },
  ];

  const fans = [];

  fanPositions.forEach(({ x, z, rot }) => {
    // Housing ring
    const housing = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.06, 8, 16),
      housingMat
    );
    housing.position.set(x, 3.2, z);
    housing.rotation.y = rot;
    group.add(housing);

    // Fan blades (will be animated)
    const bladeGroup = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.02, 0.08),
        bladeMat
      );
      blade.rotation.z = (i / 5) * Math.PI * 2;
      blade.position.set(
        Math.cos((i / 5) * Math.PI * 2) * 0.17,
        Math.sin((i / 5) * Math.PI * 2) * 0.17,
        0
      );
      bladeGroup.add(blade);
    }
    bladeGroup.position.set(x, 3.2, z);
    bladeGroup.rotation.y = rot;
    group.add(bladeGroup);
    fans.push(bladeGroup);

    // Wire guard
    const guard = new THREE.Mesh(
      new THREE.CircleGeometry(0.44, 12),
      guardMat
    );
    guard.position.set(x, 3.2, z + (x < 0 ? 0.08 : -0.08));
    guard.rotation.y = rot;
    group.add(guard);
  });

  scene.add(group);
  return fans;
}

/** Spin fan blades each frame */
export function updateFans(fans, delta) {
  fans.forEach((fan, i) => {
    const speed = 1.5 + (i % 3) * 0.5;
    fan.rotation.z += speed * delta;
  });
}

/**
 * Floor drain channels running between tower rows
 */
export function createFloorDrains(scene) {
  const group = new THREE.Group();

  const drainMat = new THREE.MeshStandardMaterial({
    color: 0x6a6a62,
    roughness: 0.9,
    metalness: 0.05,
  });
  const grateMat = new THREE.MeshStandardMaterial({
    color: 0x777770,
    roughness: 0.5,
    metalness: 0.3,
    wireframe: true,
  });

  // Drain channels between rows
  const drainXPositions = [-4.75, -1.25, 1.25, 4.75];

  drainXPositions.forEach(x => {
    // Channel trench
    const channel = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.04, 40),
      drainMat
    );
    channel.position.set(x, 0.002, 0);
    channel.receiveShadow = true;
    group.add(channel);

    // Metal grate cover
    const grate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, 40),
      grateMat
    );
    grate.rotation.x = -Math.PI / 2;
    grate.position.set(x, 0.025, 0);
    group.add(grate);
  });

  scene.add(group);
}

/**
 * Ceiling-mounted support cables / wire trellises
 */
export function createSupportCables(scene) {
  const group = new THREE.Group();

  const cableMat = new THREE.MeshStandardMaterial({
    color: 0x999999,
    roughness: 0.2,
    metalness: 0.8,
  });

  // Cross cables between rows at ceiling height
  for (let z = -20; z <= 20; z += 2.5) {
    const cable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 18, 4),
      cableMat
    );
    cable.rotation.z = Math.PI / 2;
    cable.position.set(0, 4.8, z);
    group.add(cable);
  }

  // Longitudinal cables along each side
  [-8, -5, 5, 8].forEach(x => {
    const cable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 44, 4),
      cableMat
    );
    cable.rotation.x = Math.PI / 2;
    cable.position.set(x, 4.8, 0);
    group.add(cable);
  });

  scene.add(group);
}

/**
 * Wet floor puddle reflections near water trays
 */
export function createFloorPuddles(scene) {
  const puddleMat = new THREE.MeshStandardMaterial({
    color: 0x8a9a8a,
    roughness: 0.05,
    metalness: 0.5,
    transparent: true,
    opacity: 0.3,
  });

  for (let i = 0; i < 15; i++) {
    const size = 0.3 + Math.random() * 0.5;
    const puddle = new THREE.Mesh(
      new THREE.CircleGeometry(size, 12),
      puddleMat
    );
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(
      (Math.random() - 0.5) * 16,
      0.003,
      (Math.random() - 0.5) * 35
    );
    scene.add(puddle);
  }
}

/**
 * Row label signs at the start of each tower row
 */
export function createRowLabels(scene) {
  const group = new THREE.Group();

  const signMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.5, metalness: 0.05 });
  const postMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.5 });
  const stripMat = new THREE.MeshStandardMaterial({ color: 0x3a5a40, roughness: 0.5, metalness: 0.1 });

  const rows = [
    { x: -6, label: 'A' },
    { x: -3.5, label: 'B' },
    { x: 3.5, label: 'C' },
    { x: 6, label: 'D' },
  ];

  rows.forEach(({ x }) => {
    // Sign post
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 6), postMat);
    post.position.set(x, 0.6, 15);
    group.add(post);

    // Sign plate
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.02), signMat);
    sign.position.set(x, 1.1, 15);
    group.add(sign);

    // Color stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.025), stripMat);
    stripe.position.set(x, 1.2, 15);
    group.add(stripe);
  });

  scene.add(group);
}

/**
 * Water drip animation — small droplets falling from irrigation joints
 */
export function createWaterDrips(scene) {
  const drips = [];
  const dripMat = new THREE.MeshStandardMaterial({
    color: 0x88ccee,
    transparent: true,
    opacity: 0.6,
    roughness: 0.05,
    metalness: 0.3,
  });
  const dripGeo = new THREE.SphereGeometry(0.015, 6, 4);

  // Create ~20 drip points at random tower locations
  const rowXs = [-6, -3.5, 3.5, 6];
  for (let i = 0; i < 20; i++) {
    const x = rowXs[Math.floor(Math.random() * rowXs.length)] + 0.18;
    const z = (Math.random() - 0.5) * 26;
    const drip = new THREE.Mesh(dripGeo, dripMat);
    drip.position.set(x, 3.5 + Math.random() * 0.4, z);
    drip.userData.startY = drip.position.y;
    drip.userData.speed = 0.8 + Math.random() * 1.2;
    scene.add(drip);
    drips.push(drip);
  }

  return drips;
}

/** Animate water drips falling */
export function updateWaterDrips(drips, delta) {
  drips.forEach(d => {
    d.position.y -= d.userData.speed * delta;
    if (d.position.y < 0.15) {
      d.position.y = d.userData.startY;
    }
  });
}

/**
 * Small tool cart near workstation
 */
export function createToolCart(scene) {
  const group = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4, metalness: 0.6 });
  const trayMat = new THREE.MeshStandardMaterial({ color: 0x3a6b4f, roughness: 0.5, metalness: 0.2 });

  // Cart body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.4), trayMat);
  body.position.set(2.2, 0.7, -22.5);
  group.add(body);

  // Lower shelf
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.03, 0.4), trayMat);
  shelf.position.set(2.2, 0.35, -22.5);
  group.add(shelf);

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6);
  [[-0.27, -0.17], [-0.27, 0.17], [0.27, -0.17], [0.27, 0.17]].forEach(([dx, dz]) => {
    const leg = new THREE.Mesh(legGeo, metalMat);
    leg.position.set(2.2 + dx, 0.35, -22.5 + dz);
    group.add(leg);
  });

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.03, 8);
  [[-0.27, -0.17], [-0.27, 0.17], [0.27, -0.17], [0.27, 0.17]].forEach(([dx, dz]) => {
    const wheel = new THREE.Mesh(wheelGeo, metalMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(2.2 + dx, 0.05, -22.5 + dz);
    group.add(wheel);
  });

  // Small bottles on top
  const bottleMat = new THREE.MeshStandardMaterial({ color: 0x226644, roughness: 0.3, metalness: 0.1 });
  for (let i = 0; i < 3; i++) {
    const bottle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8),
      bottleMat
    );
    bottle.position.set(2.05 + i * 0.15, 0.82, -22.5);
    group.add(bottle);
  }

  scene.add(group);
}
