import * as THREE from 'three';

/**
 * Creates a 3D flag marker (red pin + "!" sprite) above a tower position.
 * Used for human-override flagging.
 */
export function createFlagMarker(scene, position) {
  const group = new THREE.Group();
  group.userData.isFlagMarker = true;

  // Pin stick
  const stickGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.7, 6);
  const stickMat = new THREE.MeshStandardMaterial({
    color: 0xcc2222,
    roughness: 0.4,
    metalness: 0.3,
  });
  const stick = new THREE.Mesh(stickGeo, stickMat);
  stick.position.y = 0.35;
  group.add(stick);

  // Pin head (sphere)
  const headGeo = new THREE.SphereGeometry(0.12, 12, 8);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xff2222,
    emissive: 0xff2222,
    emissiveIntensity: 0.4,
    roughness: 0.3,
    metalness: 0.2,
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 0.75;
  group.add(head);

  // Exclamation mark — canvas texture on a sprite
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, 64, 64);

  // Draw "!" in white
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', 32, 28);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.position.y = 0.75;
  sprite.scale.set(0.2, 0.2, 0.2);
  group.add(sprite);

  // Glow ring at base
  const ringGeo = new THREE.RingGeometry(0.15, 0.35, 24);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xff3333,
    emissive: 0xff3333,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.01;
  group.add(ring);

  // Point light for red glow
  const glow = new THREE.PointLight(0xff3333, 0.5, 3);
  glow.position.y = 0.8;
  group.add(glow);

  // Position above the tower
  group.position.set(position.x, 4.2, position.z);

  scene.add(group);
  return group;
}

/**
 * Removes a flag marker from the scene
 */
export function removeFlagMarker(scene, marker) {
  if (!marker) return;
  scene.remove(marker);
  marker.traverse(child => {
    if (child.isMesh) {
      child.geometry.dispose();
      if (child.material.map) child.material.map.dispose();
      child.material.dispose();
    }
    if (child.isSprite) {
      if (child.material.map) child.material.map.dispose();
      child.material.dispose();
    }
  });
}

/**
 * Animate flag markers with gentle bobbing
 */
export function updateFlagMarkers(markers, delta) {
  const time = performance.now() * 0.001;
  markers.forEach((markerData, uuid) => {
    const marker = markerData.marker;
    if (!marker) return;
    // Gentle bob
    marker.position.y = 4.2 + Math.sin(time * 2 + marker.position.x) * 0.08;
    // Gentle ring pulse
    const ring = marker.children.find(c => c.isMesh && c.geometry.type === 'RingGeometry');
    if (ring) {
      const pulse = 0.3 + Math.sin(time * 3) * 0.15;
      ring.material.opacity = pulse;
    }
  });
}
