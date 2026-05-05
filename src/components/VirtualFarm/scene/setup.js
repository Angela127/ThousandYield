import * as THREE from 'three';

/**
 * Creates and configures the Three.js scene with lighting
 */
export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd4e6d4);
  scene.fog = new THREE.Fog(0xd4e6d4, 30, 80);
  return scene;
}

/**
 * Creates a perspective camera for first-person view
 */
export function createCamera(aspect) {
  const camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 200);
  camera.position.set(0, 1.7, 12);
  return camera;
}

/**
 * Creates and configures the WebGL renderer
 */
export function createRenderer(canvas, width, height) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  return renderer;
}

/**
 * Adds all lighting to the scene (sun, ambient, fill lights, grow lights)
 */
export function addLighting(scene) {
  // Soft ambient light simulating greenhouse diffusion
  const ambient = new THREE.AmbientLight(0xe8f0e8, 0.6);
  scene.add(ambient);

  // Main sunlight coming through greenhouse roof
  const sunLight = new THREE.DirectionalLight(0xfff8e7, 1.8);
  sunLight.position.set(10, 25, 10);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 60;
  sunLight.shadow.camera.left = -25;
  sunLight.shadow.camera.right = 25;
  sunLight.shadow.camera.top = 25;
  sunLight.shadow.camera.bottom = -25;
  sunLight.shadow.bias = -0.0005;
  scene.add(sunLight);

  // Secondary fill light from opposite side
  const fillLight = new THREE.DirectionalLight(0xc8e0f0, 0.4);
  fillLight.position.set(-8, 15, -5);
  scene.add(fillLight);

  // Hemisphere light for natural sky/ground bounce
  const hemiLight = new THREE.HemisphereLight(0xb1e1ff, 0xb97a20, 0.3);
  scene.add(hemiLight);

  return { sunLight, fillLight, ambient, hemiLight };
}
