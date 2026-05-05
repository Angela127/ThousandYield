import * as THREE from 'three';

/**
 * Builds the floor of the greenhouse
 */
export function createFloor(scene) {
  const floorGeo = new THREE.PlaneGeometry(60, 60);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x8a8a82,
    roughness: 0.85,
    metalness: 0.05,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);

  // Aisle markings
  const aisleGeo = new THREE.PlaneGeometry(2.8, 50);
  const aisleMat = new THREE.MeshStandardMaterial({
    color: 0x999990,
    roughness: 0.7,
    metalness: 0.02,
  });
  const aisle = new THREE.Mesh(aisleGeo, aisleMat);
  aisle.rotation.x = -Math.PI / 2;
  aisle.position.set(0, 0.005, 0);
  aisle.receiveShadow = true;
  scene.add(aisle);
}

/**
 * Builds the greenhouse structure (frame + glass panels)
 */
export function createGreenhouse(scene) {
  const group = new THREE.Group();

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    roughness: 0.3,
    metalness: 0.8,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.15,
    roughness: 0.05,
    metalness: 0.0,
    transmission: 0.9,
    thickness: 0.1,
    side: THREE.DoubleSide,
  });

  const width = 20;
  const length = 50;
  const wallHeight = 5;
  const roofPeak = 8;

  // Vertical columns
  const columnGeo = new THREE.CylinderGeometry(0.06, 0.06, wallHeight, 8);
  const columnPositions = [];
  for (let z = -length / 2; z <= length / 2; z += 5) {
    columnPositions.push([-width / 2, z], [width / 2, z]);
  }
  columnPositions.forEach(([x, z]) => {
    const col = new THREE.Mesh(columnGeo, frameMat);
    col.position.set(x, wallHeight / 2, z);
    col.castShadow = true;
    group.add(col);
  });

  // Roof ridge beams
  const ridgeGeo = new THREE.CylinderGeometry(0.05, 0.05, length, 8);
  const ridge = new THREE.Mesh(ridgeGeo, frameMat);
  ridge.rotation.x = Math.PI / 2;
  ridge.position.set(0, roofPeak, 0);
  group.add(ridge);

  // Side top beams
  [-width / 2, width / 2].forEach(x => {
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, length, 8),
      frameMat
    );
    beam.rotation.x = Math.PI / 2;
    beam.position.set(x, wallHeight, 0);
    group.add(beam);
  });

  // Roof cross-rafters
  for (let z = -length / 2; z <= length / 2; z += 5) {
    const rafterLen = Math.sqrt((width / 2) ** 2 + (roofPeak - wallHeight) ** 2);
    const angle = Math.atan2(roofPeak - wallHeight, width / 2);

    [-1, 1].forEach(side => {
      const rafter = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, rafterLen, 6),
        frameMat
      );
      rafter.position.set(
        side * width / 4,
        wallHeight + (roofPeak - wallHeight) / 2,
        z
      );
      rafter.rotation.z = side * (Math.PI / 2 - angle);
      group.add(rafter);
    });
  }

  // Glass walls (sides)
  [-width / 2, width / 2].forEach(x => {
    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(length, wallHeight),
      glassMat
    );
    wall.rotation.y = Math.PI / 2;
    wall.position.set(x, wallHeight / 2, 0);
    group.add(wall);
  });

  // Glass roof panels
  const roofWidth = Math.sqrt((width / 2) ** 2 + (roofPeak - wallHeight) ** 2);
  const roofAngle = Math.atan2(roofPeak - wallHeight, width / 2);

  [-1, 1].forEach(side => {
    const roofPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(roofWidth, length),
      glassMat
    );
    roofPanel.position.set(
      side * width / 4,
      wallHeight + (roofPeak - wallHeight) / 2,
      0
    );
    roofPanel.rotation.x = 0;
    roofPanel.rotation.z = side * (Math.PI / 2 - roofAngle);
    group.add(roofPanel);
  });

  scene.add(group);
}

/**
 * Creates overhead LED grow light bars along the rows
 */
export function createGrowLights(scene) {
  const group = new THREE.Group();

  const barMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.5,
    metalness: 0.7,
  });

  const ledMat = new THREE.MeshStandardMaterial({
    color: 0xdd88ff,
    emissive: 0xdd88ff,
    emissiveIntensity: 0.6,
  });

  const rows = [-5, -2.5, 0, 2.5, 5];

  rows.forEach(x => {
    for (let z = -20; z <= 20; z += 5) {
      // Light bar housing
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.06, 0.15),
        barMat
      );
      bar.position.set(x, 4.5, z);
      group.add(bar);

      // LED strip
      const led = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.02, 0.08),
        ledMat
      );
      led.position.set(x, 4.47, z);
      group.add(led);

      // Purple point light for glow effect
      const light = new THREE.PointLight(0xdd88ff, 0.3, 4);
      light.position.set(x, 4.4, z);
      group.add(light);
    }
  });

  scene.add(group);
}

/**
 * Creates decorative water trays at the base of towers
 */
export function createWaterTrays(scene, towerPositions) {
  const trayGeo = new THREE.CylinderGeometry(0.45, 0.4, 0.12, 16);
  const trayMat = new THREE.MeshStandardMaterial({
    color: 0x7fad96,
    roughness: 0.4,
    metalness: 0.1,
  });
  const waterGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.04, 16);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x6ba89a,
    roughness: 0.1,
    metalness: 0.3,
    transparent: true,
    opacity: 0.7,
  });

  towerPositions.forEach(([x, z]) => {
    const tray = new THREE.Mesh(trayGeo, trayMat);
    tray.position.set(x, 0.06, z);
    tray.receiveShadow = true;
    scene.add(tray);

    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.set(x, 0.1, z);
    scene.add(water);
  });
}
