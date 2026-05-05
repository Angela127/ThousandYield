import * as THREE from 'three';

// Plant species configurations with distinct visual characteristics
const PLANT_SPECIES = [
  {
    name: 'Lettuce',
    leafColor: 0x4caf50,
    leafColorAlt: 0x66bb6a,
    leafSize: 0.12,
    density: 6,
    spread: 0.15,
  },
  {
    name: 'Red Leaf Lettuce',
    leafColor: 0x6d3a5c,
    leafColorAlt: 0x8b4572,
    leafSize: 0.11,
    density: 6,
    spread: 0.14,
  },
  {
    name: 'Basil',
    leafColor: 0x2e7d32,
    leafColorAlt: 0x388e3c,
    leafSize: 0.08,
    density: 8,
    spread: 0.12,
  },
  {
    name: 'Kale',
    leafColor: 0x1b5e20,
    leafColorAlt: 0x2e7d32,
    leafSize: 0.14,
    density: 5,
    spread: 0.16,
  },
  {
    name: 'Swiss Chard',
    leafColor: 0x33691e,
    leafColorAlt: 0x558b2f,
    leafSize: 0.13,
    density: 5,
    spread: 0.15,
  },
];

/**
 * Creates a single leaf geometry cluster
 */
function createLeafCluster(species, yPos, angle) {
  const group = new THREE.Group();

  for (let i = 0; i < species.density; i++) {
    const leafAngle = angle + (i / species.density) * Math.PI * 2;
    const leafGeo = new THREE.SphereGeometry(
      species.leafSize,
      6,
      4,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    );

    const isAlt = Math.random() > 0.5;
    const leafMat = new THREE.MeshStandardMaterial({
      color: isAlt ? species.leafColorAlt : species.leafColor,
      roughness: 0.7,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });

    const leaf = new THREE.Mesh(leafGeo, leafMat);
    const radius = species.spread + Math.random() * 0.05;
    leaf.position.set(
      Math.cos(leafAngle) * radius,
      yPos + (Math.random() - 0.5) * 0.04,
      Math.sin(leafAngle) * radius
    );
    leaf.rotation.set(
      Math.random() * 0.5 - 0.8,
      leafAngle,
      Math.random() * 0.3
    );
    leaf.scale.set(
      0.8 + Math.random() * 0.4,
      0.5 + Math.random() * 0.3,
      0.8 + Math.random() * 0.4
    );
    leaf.castShadow = true;
    group.add(leaf);
  }

  return group;
}

/**
 * Creates a single vertical grow tower with plant pockets
 */
function createTower(x, z, speciesIndex) {
  const tower = new THREE.Group();
  tower.userData = {
    type: 'tower',
    species: PLANT_SPECIES[speciesIndex].name,
    position: { x, z },
    isTower: true,
  };

  // Main column (white PVC-style)
  const colGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.6, 12);
  const colMat = new THREE.MeshStandardMaterial({
    color: 0xf0f0ec,
    roughness: 0.3,
    metalness: 0.05,
  });
  const column = new THREE.Mesh(colGeo, colMat);
  column.position.y = 2.0;
  column.castShadow = true;
  tower.add(column);

  // Growing pockets with plants at intervals
  const pocketGeo = new THREE.CylinderGeometry(0.18, 0.14, 0.08, 10, 1, true);
  const pocketMat = new THREE.MeshStandardMaterial({
    color: 0xe8e8e0,
    roughness: 0.4,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  const species = PLANT_SPECIES[speciesIndex];
  const pocketCount = 8;

  for (let i = 0; i < pocketCount; i++) {
    const y = 0.6 + i * 0.4;
    const angle = (i * 137.5 * Math.PI) / 180; // golden angle for natural spiral

    // Pocket ring
    const pocket = new THREE.Mesh(pocketGeo, pocketMat);
    pocket.position.set(
      Math.cos(angle) * 0.05,
      y,
      Math.sin(angle) * 0.05
    );
    tower.add(pocket);

    // Leaf cluster growing from pocket
    const leaves = createLeafCluster(species, y, angle);
    tower.add(leaves);
  }

  tower.position.set(x, 0, z);
  return tower;
}

/**
 * Creates all tower rows for the vertical farm
 * Returns { towerGroup, towerMeshes, towerPositions }
 */
export function createTowers(scene) {
  const towerGroup = new THREE.Group();
  const towerMeshes = [];
  const towerPositions = [];

  // Row configurations: x-positions for parallel rows
  const rowXPositions = [-6, -3.5, 3.5, 6];
  const towersPerRow = 12;
  const spacing = 2.5;
  const startZ = -((towersPerRow - 1) * spacing) / 2;

  rowXPositions.forEach((rowX, rowIndex) => {
    for (let i = 0; i < towersPerRow; i++) {
      const z = startZ + i * spacing;
      const speciesIndex = (rowIndex + i) % PLANT_SPECIES.length;
      const tower = createTower(rowX, z, speciesIndex);

      towerGroup.add(tower);
      towerMeshes.push(tower);
      towerPositions.push([rowX, z]);
    }
  });

  scene.add(towerGroup);
  return { towerGroup, towerMeshes, towerPositions };
}
