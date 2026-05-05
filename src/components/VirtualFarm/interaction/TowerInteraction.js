import * as THREE from 'three';

/**
 * Manages hover highlighting and click interactions on towers.
 * - Raycasts from mouse position to detect tower groups
 * - Applies emissive glow on hover
 * - Restores original materials on un-hover
 */
export class TowerInteraction {
  constructor(camera, domElement, towerMeshes) {
    this.camera = camera;
    this.domElement = domElement;
    this.towerMeshes = towerMeshes;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredTower = null;
    this.selectedTower = null;

    // Store original materials per tower for restoration
    this._originalMaterials = new Map();

    // Highlight emissive color
    this.highlightColor = new THREE.Color(0x44ff88);
    this.highlightIntensity = 0.35;

    // Selection emissive color
    this.selectColor = new THREE.Color(0x00ccff);
    this.selectIntensity = 0.5;

    this._onMouseMove = this._onMouseMove.bind(this);
    this._onClick = this._onClick.bind(this);
    this._addListeners();
  }

  _addListeners() {
    this.domElement.addEventListener('mousemove', this._onMouseMove);
    this.domElement.addEventListener('click', this._onClick);
  }

  _onMouseMove(event) {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  _onClick() {
    // If clicking the background, deselect current
    if (!this.hoveredTower) {
      if (this.selectedTower) {
        this._removeHighlight(this.selectedTower);
        this.selectedTower = null;
      }
      return;
    }

    // Toggle logic: if clicking the already selected tower, deselect it
    if (this.selectedTower === this.hoveredTower) {
      this._removeHighlight(this.selectedTower);
      this.selectedTower = null;
      // Re-apply hover highlight since it's still being hovered
      this._applyHighlight(this.hoveredTower, this.highlightColor, this.highlightIntensity);
    } else {
      // Deselect previous if any
      if (this.selectedTower) {
        this._removeHighlight(this.selectedTower);
      }
      // Select new
      this.selectedTower = this.hoveredTower;
      this._applyHighlight(this.selectedTower, this.selectColor, this.selectIntensity);
    }
  }

  /**
   * Finds the top-level tower group for a given mesh
   */
  _findTowerParent(object) {
    let current = object;
    while (current) {
      if (current.userData && current.userData.isTower) {
        return current;
      }
      current = current.parent;
    }
    return null;
  }

  /**
   * Store original emissive values and apply highlight
   */
  _applyHighlight(tower, color, intensity) {
    if (!this._originalMaterials.has(tower.uuid)) {
      const originals = [];
      tower.traverse(child => {
        if (child.isMesh && child.material) {
          const mat = child.material;
          originals.push({
            mesh: child,
            emissive: mat.emissive ? mat.emissive.clone() : new THREE.Color(0x000000),
            emissiveIntensity: mat.emissiveIntensity || 0,
          });
        }
      });
      this._originalMaterials.set(tower.uuid, originals);
    }

    tower.traverse(child => {
      if (child.isMesh && child.material && child.material.emissive) {
        child.material.emissive.copy(color);
        child.material.emissiveIntensity = intensity;
      }
    });
  }

  /**
   * Restore original emissive values
   */
  _removeHighlight(tower) {
    const originals = this._originalMaterials.get(tower.uuid);
    if (!originals) return;

    originals.forEach(({ mesh, emissive, emissiveIntensity }) => {
      if (mesh.material && mesh.material.emissive) {
        mesh.material.emissive.copy(emissive);
        mesh.material.emissiveIntensity = emissiveIntensity;
      }
    });

    this._originalMaterials.delete(tower.uuid);
  }

  /**
   * Call every frame to perform raycasting and update hover state.
   * Returns the currently hovered tower's userData or null.
   */
  update() {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Collect all meshes from all towers
    const allMeshes = [];
    this.towerMeshes.forEach(tower => {
      tower.traverse(child => {
        if (child.isMesh) {
          allMeshes.push(child);
        }
      });
    });

    const intersects = this.raycaster.intersectObjects(allMeshes, false);

    let newHovered = null;
    if (intersects.length > 0) {
      newHovered = this._findTowerParent(intersects[0].object);
    }

    // Handle hover transitions
    if (newHovered !== this.hoveredTower) {
      // Remove hover highlight from old tower (unless it's selected)
      if (this.hoveredTower && this.hoveredTower !== this.selectedTower) {
        this._removeHighlight(this.hoveredTower);
      }

      // Apply hover highlight to new tower (unless it's already selected)
      if (newHovered && newHovered !== this.selectedTower) {
        this._applyHighlight(newHovered, this.highlightColor, this.highlightIntensity);
      }

      this.hoveredTower = newHovered;
    }

    // Update cursor
    this.domElement.style.cursor = newHovered ? 'pointer' : '';

    return this.hoveredTower ? this.hoveredTower.userData : null;
  }

  /**
   * Returns data about the currently selected tower
   */
  getSelectedData() {
    return this.selectedTower ? this.selectedTower.userData : null;
  }

  /**
   * Clean up
   */
  dispose() {
    this.domElement.removeEventListener('mousemove', this._onMouseMove);
    this.domElement.removeEventListener('click', this._onClick);
    this._originalMaterials.clear();
  }
}
