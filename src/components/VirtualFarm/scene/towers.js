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
 * Creates a single flat leaf shape
 */
function createFlatLeaf(species) {
  const shape = new THREE.Shape();
  const s = species.leafSize * 1.2;
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(s * 0.5, s * 0.6, 0, s * 1.4);
  shape.quadraticCurveTo(-s * 0.5, s * 0.6, 0, 0);

  const geo = new THREE.ShapeGeometry(shape, 4);
  const isAlt = Math.random() > 0.5;
  const mat = new THREE.MeshStandardMaterial({
    color: isAlt ? species.leafColorAlt : species.leafColor,
    roughness: 0.65,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
  return new THREE.Mesh(geo, mat);
}

/**
 * Creates a single leaf geometry cluster — mix of sphere and flat leaves
 */
function createLeafCluster(species, yPos, angle) {
  const group = new THREE.Group();
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x3d6b35,
    roughness: 0.7,
    metalness: 0.0,
  });

  for (let i = 0; i < species.density; i++) {
    const leafAngle = angle + (i / species.density) * Math.PI * 2;
    const radius = species.spread + Math.random() * 0.06;
    const yOff = yPos + (Math.random() - 0.5) * 0.05;

    // Thin stem
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, radius * 0.8, 3),
      stemMat
    );
    stem.position.set(
      Math.cos(leafAngle) * radius * 0.4,
      yOff,
      Math.sin(leafAngle) * radius * 0.4
    );
    stem.rotation.z = leafAngle + Math.PI / 2;
    stem.rotation.x = -0.3;
    group.add(stem);

    // Alternate between sphere leaves and flat leaves
    if (i % 3 === 0) {
      const flat = createFlatLeaf(species);
      flat.position.set(
        Math.cos(leafAngle) * radius,
        yOff,
        Math.sin(leafAngle) * radius
      );
      flat.rotation.set(
        -0.4 + Math.random() * 0.3,
        leafAngle,
        Math.random() * 0.4 - 0.2
      );
      flat.scale.setScalar(0.8 + Math.random() * 0.5);
      flat.castShadow = true;
      group.add(flat);
    } else {
      const leafGeo = new THREE.SphereGeometry(
        species.leafSize,
        6, 4, 0, Math.PI * 2, 0, Math.PI / 2
      );
      const isAlt = Math.random() > 0.5;
      const leafMat = new THREE.MeshStandardMaterial({
        color: isAlt ? species.leafColorAlt : species.leafColor,
        roughness: 0.7,
        metalness: 0.0,
        side: THREE.DoubleSide,
      });
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(
        Math.cos(leafAngle) * radius,
        yOff,
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
  }

  return group;
}

/**
 * Creates dangling vine tendrils on some towers
 */
function createVines(tower, species) {
  const vineMat = new THREE.MeshStandardMaterial({
    color: species.leafColor,
    roughness: 0.7,
    metalness: 0.0,
  });

  const vineCount = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < vineCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const startY = 1.5 + Math.random() * 2.0;
    const length = 0.4 + Math.random() * 0.8;

    // Vine strand
    const vine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.004, length, 4),
      vineMat
    );
    vine.position.set(
      Math.cos(angle) * 0.2,
      startY - length / 2,
      Math.sin(angle) * 0.2
    );
    vine.rotation.z = (Math.random() - 0.5) * 0.3;
    tower.add(vine);

    // Tiny leaf at vine tip
    const tipLeaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 4, 3),
      vineMat
    );
    tipLeaf.position.set(
      Math.cos(angle) * 0.2,
      startY - length,
      Math.sin(angle) * 0.2
    );
    tower.add(tipLeaf);
  }
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

  // Top cap
  const capGeo = new THREE.CylinderGeometry(0.06, 0.14, 0.1, 12);
  const cap = new THREE.Mesh(capGeo, colMat);
  cap.position.y = 3.85;
  tower.add(cap);

  // Growing pockets with plants at intervals — more pockets for density
  const pocketGeo = new THREE.CylinderGeometry(0.18, 0.14, 0.08, 10, 1, true);
  const pocketMat = new THREE.MeshStandardMaterial({
    color: 0xe8e8e0,
    roughness: 0.4,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  const species = PLANT_SPECIES[speciesIndex];
  const pocketCount = 10;

  for (let i = 0; i < pocketCount; i++) {
    const y = 0.5 + i * 0.34;
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

  // Dangling vines on ~60% of towers
  if (Math.random() > 0.4) {
    createVines(tower, species);
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
