import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { createScene, createCamera, createRenderer, addLighting } from './scene/setup';
import { createFloor, createGreenhouse, createGrowLights, createWaterTrays } from './scene/environment';
import {
  createParticles, updateParticles,
  createIrrigationPipes, createNutrientTanks, createControlPanel,
  createVentilationFans, updateFans,
  createFloorDrains, createSupportCables, createFloorPuddles,
  createRowLabels, createWaterDrips, updateWaterDrips, createToolCart,
} from './scene/details';
import { createTowers } from './scene/towers';
import { SmoothControls } from './controls/SmoothControls';
import { TowerInteraction } from './interaction/TowerInteraction';
import './VirtualFarm.css';

const VirtualFarm = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animFrameRef = useRef(null);
  const controlsRef = useRef(null);
  const interactionRef = useRef(null);

  const [hoveredInfo, setHoveredInfo] = useState(null);
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [showInstructions, setShowInstructions] = useState(true);

  const handleResize = useCallback((camera, renderer) => {
    const container = containerRef.current;
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const w = container.clientWidth;
    const h = container.clientHeight;

    // === Scene Setup ===
    const scene = createScene();
    const camera = createCamera(w / h);
    const renderer = createRenderer(canvas, w, h);
    addLighting(scene);

    // === Environment ===
    createFloor(scene);
    createGreenhouse(scene);
    createGrowLights(scene);

    // === Plant Towers ===
    const { towerMeshes, towerPositions } = createTowers(scene);
    createWaterTrays(scene, towerPositions);

    // === Details ===
    const particles = createParticles(scene);
    createIrrigationPipes(scene, towerPositions);
    createNutrientTanks(scene);
    createControlPanel(scene);
    const fans = createVentilationFans(scene);
    createFloorDrains(scene);
    createSupportCables(scene);
    createFloorPuddles(scene);
    createRowLabels(scene);
    const drips = createWaterDrips(scene);
    createToolCart(scene);

    // === Controls ===
    const controls = new SmoothControls(camera, canvas);
    controlsRef.current = controls;

    // === Interaction ===
    const interaction = new TowerInteraction(camera, canvas, towerMeshes);
    interactionRef.current = interaction;

    // === Interaction ===
    // Click to hide instructions
    const onCanvasClick = () => {
      setShowInstructions(false);
    };
    canvas.addEventListener('click', onCanvasClick);

    // === Resize ===
    const onResize = () => handleResize(camera, renderer);
    window.addEventListener('resize', onResize);

    // === Animation Loop ===
    const clock = new THREE.Clock();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      controls.update(delta);

      // Animate details
      updateParticles(particles);
      updateFans(fans, delta);
      updateWaterDrips(drips, delta);

      // Perform hover interaction
      const hovered = interaction.update();
      setHoveredInfo(hovered);
      setSelectedInfo(interaction.getSelectedData());

      renderer.render(scene, camera);
    };
    animate();

    // === Cleanup ===
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('click', onCanvasClick);
      controls.dispose();
      interaction.dispose();
      renderer.dispose();
      scene.traverse(child => {
        if (child.isMesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    };
  }, [handleResize]);

  return (
    <div className="virtual-farm-container" ref={containerRef}>
      <canvas ref={canvasRef} className="virtual-farm-canvas" />

      {/* Instructions Overlay */}
      {showInstructions && (
        <div className="vf-instructions-overlay" onClick={() => setShowInstructions(false)}>
          <div className="vf-instructions-card">
            <div className="vf-instructions-icon">🌱</div>
            <h2>Virtual Farm Explorer</h2>
            <p className="vf-instructions-subtitle">Walk through your vertical farm in 3D</p>
            <div className="vf-instructions-controls">
              <div className="vf-control-group">
                <div className="vf-key-row">
                  <span className="vf-key">W</span>
                </div>
                <div className="vf-key-row">
                  <span className="vf-key">A</span>
                  <span className="vf-key">S</span>
                  <span className="vf-key">D</span>
                </div>
                <span className="vf-control-label">Move</span>
              </div>
              <div className="vf-control-group">
                <div className="vf-mouse-icon">
                  <svg width="32" height="42" viewBox="0 0 32 42" fill="none">
                    <rect x="1" y="1" width="30" height="40" rx="15" stroke="currentColor" strokeWidth="2" />
                    <path d="M16 10 L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M10 20 L22 20" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
                  </svg>
                </div>
                <span className="vf-control-label">Drag to Look</span>
              </div>
              <div className="vf-control-group">
                <div className="vf-mouse-icon">
                  <svg width="32" height="42" viewBox="0 0 32 42" fill="none">
                    <rect x="1" y="1" width="30" height="40" rx="15" stroke="currentColor" strokeWidth="2" />
                    <circle cx="16" cy="12" r="3" fill="currentColor" className="vf-scroll-anim" />
                  </svg>
                </div>
                <span className="vf-control-label">Scroll to Zoom</span>
              </div>
            </div>
            <p className="vf-click-prompt">Click anywhere to start</p>
            <p className="vf-hover-hint">Hover over plant towers to inspect them</p>
          </div>
        </div>
      )}


      {/* Hover Tooltip */}
      {hoveredInfo && (
        <div className="vf-hover-tooltip">
          <div className="vf-tooltip-icon">🌿</div>
          <div className="vf-tooltip-content">
            <span className="vf-tooltip-species">{hoveredInfo.species}</span>
            <span className="vf-tooltip-action">Click to select</span>
          </div>
        </div>
      )}

      {/* Selected Tower Info Panel */}
      {selectedInfo && (
        <div className="vf-info-panel">
          <div className="vf-info-header">
            <span className="vf-info-badge">SELECTED</span>
            <h3>{selectedInfo.species}</h3>
          </div>
          <div className="vf-info-stats">
            <div className="vf-stat">
              <span className="vf-stat-label">Growth Stage</span>
              <div className="vf-stat-bar">
                <div className="vf-stat-fill" style={{ width: '78%' }} />
              </div>
              <span className="vf-stat-value">78%</span>
            </div>
            <div className="vf-stat">
              <span className="vf-stat-label">Hydration</span>
              <div className="vf-stat-bar">
                <div className="vf-stat-fill vf-fill-blue" style={{ width: '92%' }} />
              </div>
              <span className="vf-stat-value">92%</span>
            </div>
            <div className="vf-stat">
              <span className="vf-stat-label">Nutrient Level</span>
              <div className="vf-stat-bar">
                <div className="vf-stat-fill vf-fill-amber" style={{ width: '65%' }} />
              </div>
              <span className="vf-stat-value">65%</span>
            </div>
          </div>
          <div className="vf-info-meta">
            <span>Tower Position: ({selectedInfo.position.x.toFixed(1)}, {selectedInfo.position.z.toFixed(1)})</span>
          </div>
        </div>
      )}


      {/* Mini-map legend */}
      <div className="vf-legend">
        <span className="vf-legend-dot" style={{ background: '#4caf50' }} /> Lettuce
        <span className="vf-legend-dot" style={{ background: '#6d3a5c' }} /> Red Leaf
        <span className="vf-legend-dot" style={{ background: '#2e7d32' }} /> Basil
        <span className="vf-legend-dot" style={{ background: '#1b5e20' }} /> Kale
        <span className="vf-legend-dot" style={{ background: '#33691e' }} /> Chard
      </div>
    </div>
  );
};

export default VirtualFarm;
