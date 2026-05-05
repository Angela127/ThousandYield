import * as THREE from 'three';

const MOVE_SPEED = 5.0;
const LOOK_SPEED = 0.002;
const PLAYER_HEIGHT = 1.7;
const BOUNDARY = 24;

/**
 * First-person controls using pointer lock + WASD.
 * Handles movement, mouse look, and collision boundaries.
 */
export class FirstPersonControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();

    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
    };

    this.isLocked = false;
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onPointerLockChange = this._onPointerLockChange.bind(this);

    this._addListeners();
  }

  _addListeners() {
    this.domElement.addEventListener('click', () => {
      if (!this.isLocked) {
        this.domElement.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', this._onPointerLockChange);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
  }

  _onPointerLockChange() {
    this.isLocked = document.pointerLockElement === this.domElement;
  }

  _onMouseMove(event) {
    if (!this.isLocked) return;

    this.euler.setFromQuaternion(this.camera.quaternion);
    this.euler.y -= event.movementX * LOOK_SPEED;
    this.euler.x -= event.movementY * LOOK_SPEED;
    this.euler.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.euler.x));
    this.camera.quaternion.setFromEuler(this.euler);
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

  /**
   * Call every frame with delta time.
   * Applies deceleration and movement clamped to greenhouse boundaries.
   */
  update(delta) {
    // Apply friction
    this.velocity.x -= this.velocity.x * 10.0 * delta;
    this.velocity.z -= this.velocity.z * 10.0 * delta;

    // Calculate movement direction
    this.direction.z = Number(this.keys.forward) - Number(this.keys.backward);
    this.direction.x = Number(this.keys.right) - Number(this.keys.left);
    this.direction.normalize();

    if (this.keys.forward || this.keys.backward) {
      this.velocity.z -= this.direction.z * MOVE_SPEED * delta;
    }
    if (this.keys.left || this.keys.right) {
      this.velocity.x -= this.direction.x * MOVE_SPEED * delta;
    }

    // Move relative to camera orientation (only yaw)
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    this.camera.position.addScaledVector(forward, -this.velocity.z * delta * 60);
    this.camera.position.addScaledVector(right, -this.velocity.x * delta * 60);

    // Clamp to boundaries
    this.camera.position.x = Math.max(-BOUNDARY, Math.min(BOUNDARY, this.camera.position.x));
    this.camera.position.z = Math.max(-BOUNDARY, Math.min(BOUNDARY, this.camera.position.z));
    this.camera.position.y = PLAYER_HEIGHT;
  }

  /**
   * Clean up event listeners
   */
  dispose() {
    document.removeEventListener('pointerlockchange', this._onPointerLockChange);
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
  }
}
