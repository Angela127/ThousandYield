import * as THREE from 'three';

/**
 * Manages hover highlighting and click interactions on towers, tanks, and pumps.
 * - Raycasts from mouse position to detect interactive objects
 * - Applies emissive glow on hover
 * - Restores original materials on un-hover
 * - Supports tower selection, tank/pump inspection, and flagging
 */
export class TowerInteraction {
  constructor(camera, domElement, towerMeshes, tankMeshes = [], pumpMeshes = []) {
    this.camera = camera;
    this.domElement = domElement;
    this.towerMeshes = towerMeshes;
    this.tankMeshes = tankMeshes;
    this.pumpMeshes = pumpMeshes;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredTower = null;
    this.selectedTower = null;
    this.hoveredPump = null;
    this.selectedPump = null;

    // Store original materials per object for restoration
    this._originalMaterials = new Map();

    // Highlight emissive color
    this.highlightColor = new THREE.Color(0x44ff88);
    this.highlightIntensity = 0.35;

    // Selection emissive color
    this.selectColor = new THREE.Color(0x00ccff);
    this.selectIntensity = 0.5;

    // Pump/tank highlight colors
    this.pumpHighlightColor = new THREE.Color(0x44aaff);
    this.pumpHighlightIntensity = 0.35;
    this.pumpSelectColor = new THREE.Color(0x0088ff);
    this.pumpSelectIntensity = 0.5;

    // Flag color
    this.flagColor = new THREE.Color(0xff3333);
    this.flagIntensity = 0.4;

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
    // --- PUMP / TANK CLICK ---
    if (this.hoveredPump) {
      // Toggle pump selection
      if (this.selectedPump === this.hoveredPump) {
        this._removeHighlight(this.selectedPump);
        this.selectedPump = null;
        this._applyHighlight(this.hoveredPump, this.pumpHighlightColor, this.pumpHighlightIntensity);
      } else {
        if (this.selectedPump) this._removeHighlight(this.selectedPump);
        this.selectedPump = this.hoveredPump;
        this._applyHighlight(this.selectedPump, this.pumpSelectColor, this.pumpSelectIntensity);
      }
      return;
    }

    // --- TOWER CLICK ---
    if (!this.hoveredTower) {
      // Clicking background deselects everything
      if (this.selectedTower) {
        // Check if flagged — if so, re-apply flag color instead of removing
        if (this.selectedTower.userData.isFlagged) {
          this._applyHighlight(this.selectedTower, this.flagColor, this.flagIntensity);
        } else {
          this._removeHighlight(this.selectedTower);
        }
        this.selectedTower = null;
      }
      if (this.selectedPump) {
        this._removeHighlight(this.selectedPump);
        this.selectedPump = null;
      }
      return;
    }

    // Toggle tower selection
    if (this.selectedTower === this.hoveredTower) {
      this.selectedTower = null;
      // If flagged, keep the flag color
      if (this.hoveredTower.userData.isFlagged) {
        this._removeHighlight(this.hoveredTower);
        this._applyHighlight(this.hoveredTower, this.flagColor, this.flagIntensity);
      } else {
        this._removeHighlight(this.hoveredTower);
        this._applyHighlight(this.hoveredTower, this.highlightColor, this.highlightIntensity);
      }
    } else {
      // Deselect previous
      if (this.selectedTower) {
        if (this.selectedTower.userData.isFlagged) {
          this._removeHighlight(this.selectedTower);
          this._applyHighlight(this.selectedTower, this.flagColor, this.flagIntensity);
        } else {
          this._removeHighlight(this.selectedTower);
        }
      }
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
   * Finds a pump/tank parent for a given mesh
   */
  _findPumpParent(object) {
    let current = object;
    while (current) {
      if (current.userData && (current.userData.isPump || current.userData.isTank)) {
        return current;
      }
      current = current.parent;
    }
    return null;
  }

  /**
   * Store original emissive values and apply highlight
   */
  _applyHighlight(obj, color, intensity) {
    if (!this._originalMaterials.has(obj.uuid)) {
      const originals = [];
      obj.traverse(child => {
        if (child.isMesh && child.material) {
          const mat = child.material;
          originals.push({
            mesh: child,
            emissive: mat.emissive ? mat.emissive.clone() : new THREE.Color(0x000000),
            emissiveIntensity: mat.emissiveIntensity || 0,
          });
        }
      });
      this._originalMaterials.set(obj.uuid, originals);
    }

    obj.traverse(child => {
      if (child.isMesh && child.material && child.material.emissive) {
        child.material.emissive.copy(color);
        child.material.emissiveIntensity = intensity;
      }
    });
  }

  /**
   * Restore original emissive values
   */
  _removeHighlight(obj) {
    const originals = this._originalMaterials.get(obj.uuid);
    if (!originals) return;

    originals.forEach(({ mesh, emissive, emissiveIntensity }) => {
      if (mesh.material && mesh.material.emissive) {
        mesh.material.emissive.copy(emissive);
        mesh.material.emissiveIntensity = emissiveIntensity;
      }
    });

    this._originalMaterials.delete(obj.uuid);
  }

  /**
   * Apply flag highlight to a tower (called from outside)
   */
  applyFlagHighlight(tower) {
    if (!tower) return;
    this._removeHighlight(tower);
    tower.userData.isFlagged = true;
    // Only apply flag color if it's not the currently selected tower
    if (tower !== this.selectedTower) {
      this._applyHighlight(tower, this.flagColor, this.flagIntensity);
    }
  }

  /**
   * Remove flag highlight from a tower (called from outside)
   */
  removeFlagHighlight(tower) {
    if (!tower) return;
    tower.userData.isFlagged = false;
    this._removeHighlight(tower);
  }

  /**
   * Call every frame to perform raycasting and update hover state.
   * Returns the currently hovered tower's userData or null.
   */
  update() {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Collect all meshes from towers
    const allMeshes = [];
    this.towerMeshes.forEach(tower => {
      tower.traverse(child => {
        if (child.isMesh) allMeshes.push(child);
      });
    });

    // Collect meshes from tanks
    this.tankMeshes.forEach(tank => {
      tank.traverse(child => {
        if (child.isMesh) allMeshes.push(child);
      });
    });

    // Collect meshes from pumps
    this.pumpMeshes.forEach(pump => {
      pump.traverse(child => {
        if (child.isMesh) allMeshes.push(child);
      });
    });

    const intersects = this.raycaster.intersectObjects(allMeshes, false);

    let newHoveredTower = null;
    let newHoveredPump = null;

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      // Check if it's a pump/tank first
      const pumpParent = this._findPumpParent(hit);
      if (pumpParent) {
        newHoveredPump = pumpParent;
      } else {
        const towerParent = this._findTowerParent(hit);
        if (towerParent) newHoveredTower = towerParent;
      }
    }

    // Handle tower hover transitions
    if (newHoveredTower !== this.hoveredTower) {
      if (this.hoveredTower && this.hoveredTower !== this.selectedTower) {
        // If flagged, re-apply flag color
        if (this.hoveredTower.userData.isFlagged) {
          this._removeHighlight(this.hoveredTower);
          this._applyHighlight(this.hoveredTower, this.flagColor, this.flagIntensity);
        } else {
          this._removeHighlight(this.hoveredTower);
        }
      }
      if (newHoveredTower && newHoveredTower !== this.selectedTower) {
        this._applyHighlight(newHoveredTower, this.highlightColor, this.highlightIntensity);
      }
      this.hoveredTower = newHoveredTower;
    }

    // Handle pump hover transitions
    if (newHoveredPump !== this.hoveredPump) {
      if (this.hoveredPump && this.hoveredPump !== this.selectedPump) {
        this._removeHighlight(this.hoveredPump);
      }
      if (newHoveredPump && newHoveredPump !== this.selectedPump) {
        this._applyHighlight(newHoveredPump, this.pumpHighlightColor, this.pumpHighlightIntensity);
      }
      this.hoveredPump = newHoveredPump;
    }

    // Update cursor
    this.domElement.style.cursor = (newHoveredTower || newHoveredPump) ? 'pointer' : '';

    return this.hoveredTower ? this.hoveredTower.userData : null;
  }

  /**
   * Returns data about the currently selected tower
   */
  getSelectedData() {
    return this.selectedTower ? this.selectedTower.userData : null;
  }

  /**
   * Returns data about the currently selected pump/tank
   */
  getSelectedPumpData() {
    return this.selectedPump ? this.selectedPump.userData : null;
  }

  /**
   * Returns the actual selected tower object (for flagging)
   */
  getSelectedTowerObject() {
    return this.selectedTower;
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
