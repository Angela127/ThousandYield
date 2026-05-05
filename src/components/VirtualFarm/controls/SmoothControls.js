import * as THREE from 'three';

const MOVE_SPEED = 8.0;
const LOOK_SPEED = 0.003;
const PLAYER_HEIGHT = 1.7;
const BOUNDARY = 24;
const LERP_FACTOR = 0.15; // The "Butter" factor
const ZOOM_SPEED = 2.0;

/**
 * SmoothControls: Drag-to-rotate, Scroll-to-zoom, and Smooth WASD movement.
 * Maintains eye-level first-person perspective.
 */
export class SmoothControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Internal state for smoothing
    this.targetRotation = new THREE.Euler(0, 0, 0, 'YXZ');
    this.currentRotation = new THREE.Euler(0, 0, 0, 'YXZ');
    
    // Initialize rotation from camera
    this.targetRotation.setFromQuaternion(this.camera.quaternion);
    this.currentRotation.copy(this.targetRotation);

    this.targetPosition = this.camera.position.clone();
    this.currentPosition = this.camera.position.clone();
    this.velocity = new THREE.Vector3();

    this.isDragging = false;
    this.keys = { forward: false, backward: false, left: false, right: false };

    // Event handlers
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onWheel = this._onWheel.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onContextMenu = (e) => e.preventDefault();

    this._addListeners();
  }

  _addListeners() {
    this.domElement.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mouseup', this._onMouseUp);
    this.domElement.addEventListener('wheel', this._onWheel, { passive: false });
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    this.domElement.addEventListener('contextmenu', this._onContextMenu);
  }

  _onMouseDown(event) {
    if (event.button === 0 || event.button === 2) { // Left or Right click
      this.isDragging = true;
      this.domElement.style.cursor = 'grabbing';
    }
  }

  _onMouseMove(event) {
    if (!this.isDragging) return;

    // Update target rotation based on mouse delta
    // Note: movementX/Y work even without pointer lock in most modern browsers during drag
    this.targetRotation.y -= event.movementX * LOOK_SPEED;
    this.targetRotation.x -= event.movementY * LOOK_SPEED;

    // Clamp pitch (vertical look)
    const minPitch = -Math.PI / 2.2;
    const maxPitch = Math.PI / 2.2;
    this.targetRotation.x = Math.max(minPitch, Math.min(maxPitch, this.targetRotation.x));
  }

  _onMouseUp() {
    this.isDragging = false;
    this.domElement.style.cursor = 'default';
  }

  _onWheel(event) {
    event.preventDefault();
    
    // Zoom in/out moves the camera forward/backward
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    
    const zoomAmount = -event.deltaY * 0.01 * ZOOM_SPEED;
    this.targetPosition.addScaledVector(direction, zoomAmount);
    
    // Keep height locked and clamp boundaries
    this._clampTarget();
  }

  _onKeyDown(event) {
    switch (event.code) {
      case 'KeyW': case 'ArrowUp': this.keys.forward = true; break;
      case 'KeyS': case 'ArrowDown': this.keys.backward = true; break;
      case 'KeyA': case 'ArrowLeft': this.keys.left = true; break;
      case 'KeyD': case 'ArrowRight': this.keys.right = true; break;
    }
  }

  _onKeyUp(event) {
    switch (event.code) {
      case 'KeyW': case 'ArrowUp': this.keys.forward = false; break;
      case 'KeyS': case 'ArrowDown': this.keys.backward = false; break;
      case 'KeyA': case 'ArrowLeft': this.keys.left = false; break;
      case 'KeyD': case 'ArrowRight': this.keys.right = false; break;
    }
  }

  _clampTarget() {
    this.targetPosition.x = Math.max(-BOUNDARY, Math.min(BOUNDARY, this.targetPosition.x));
    this.targetPosition.z = Math.max(-BOUNDARY, Math.min(BOUNDARY, this.targetPosition.z));
    this.targetPosition.y = PLAYER_HEIGHT;
  }

  update(delta) {
    // 1. Handle WASD Movement
    const moveDirection = new THREE.Vector3();
    moveDirection.z = Number(this.keys.forward) - Number(this.keys.backward);
    moveDirection.x = Number(this.keys.right) - Number(this.keys.left);
    moveDirection.normalize();

    if (moveDirection.lengthSq() > 0) {
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      this.targetPosition.addScaledVector(forward, moveDirection.z * MOVE_SPEED * delta);
      this.targetPosition.addScaledVector(right, moveDirection.x * MOVE_SPEED * delta);
      this._clampTarget();
    }

    // 2. Smooth Interpolation (The "Butter" part)
    
    // Lerp rotation
    this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * LERP_FACTOR;
    this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * LERP_FACTOR;
    this.camera.quaternion.setFromEuler(this.currentRotation);

    // Lerp position
    this.camera.position.lerp(this.targetPosition, LERP_FACTOR);
  }

  dispose() {
    this.domElement.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mouseup', this._onMouseUp);
    this.domElement.removeEventListener('wheel', this._onWheel);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this.domElement.removeEventListener('contextmenu', this._onContextMenu);
  }
}
