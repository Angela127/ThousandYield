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
  createWaterReservoir, createWaterPump, createSprayers, createSprayParticles,
  updateSprayParticles, updateWaterFlow, updateGrowLights
} from './scene/details';
import { createTowers } from './scene/towers';
import { createFlagMarker, removeFlagMarker, updateFlagMarkers } from './scene/flag-markers';
import { SmoothControls } from './controls/SmoothControls';
import { TowerInteraction } from './interaction/TowerInteraction';
import { FarmSettings } from './ui/FarmSettings';
import { FlagSystemModal } from './ui/FlagSystem';
import VirtualChatbox from './ui/VirtualChatbox';
import './VirtualFarm.css';

// Create a cute robot based on the user's image (Screen head, legs)
const createRobot = (scene) => {
  const robotGroup = new THREE.Group();
  
  // Materials
  const lightGrey = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.2 });
  const lightGreen = new THREE.MeshStandardMaterial({ color: 0x81c784, roughness: 0.2 }); // Light green!
  const darkScreen = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.1 });
  const glowingBlue = new THREE.MeshBasicMaterial({ color: 0x00d2ff });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x333333 });

  // === Body ===
  const bodyGeom = new THREE.BoxGeometry(0.4, 0.25, 0.35);
  // Round the corners a bit using a sphere if possible, or just keep it boxy
  const body = new THREE.Mesh(bodyGeom, lightGrey);
  body.position.y = 0.35;
  robotGroup.add(body);
  
  const bodyAccentGeom = new THREE.BoxGeometry(0.2, 0.15, 0.02);
  const bodyAccent = new THREE.Mesh(bodyAccentGeom, lightGreen);
  bodyAccent.position.set(0, -0.02, 0.176);
  body.add(bodyAccent);

  // === Head ===
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.65;
  
  const headGeom = new THREE.BoxGeometry(0.45, 0.35, 0.35);
  const head = new THREE.Mesh(headGeom, lightGrey);
  headGroup.add(head);
  
  // Screen
  const screenGeom = new THREE.BoxGeometry(0.38, 0.28, 0.02);
  const screen = new THREE.Mesh(screenGeom, darkScreen);
  screen.position.set(0, 0, 0.17);
  headGroup.add(screen);
  
  // Eyes (Filled circles with reflections)
  const eyeGeom = new THREE.CircleGeometry(0.05, 16);
  const reflectionGeom = new THREE.CircleGeometry(0.015, 16);
  const reflectionMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  
  const eye1 = new THREE.Mesh(eyeGeom, glowingBlue);
  eye1.position.set(0.08, 0.02, 0.02);
  const ref1 = new THREE.Mesh(reflectionGeom, reflectionMat);
  ref1.position.set(0.015, 0.015, 0.001);
  eye1.add(ref1);

  const eye2 = new THREE.Mesh(eyeGeom, glowingBlue);
  eye2.position.set(-0.08, 0.02, 0.02);
  const ref2 = new THREE.Mesh(reflectionGeom, reflectionMat);
  ref2.position.set(0.015, 0.015, 0.001);
  eye2.add(ref2);
  
  screen.add(eye1, eye2);
  
  // Smile
  const smileGeom = new THREE.TorusGeometry(0.03, 0.006, 8, 16, Math.PI); // Half circle
  const smile = new THREE.Mesh(smileGeom, glowingBlue);
  smile.position.set(0, -0.05, 0.02);
  smile.rotation.z = Math.PI; // Face up
  screen.add(smile);
  
  // Antenna (Y shape)
  const antBaseGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.05);
  const antBase = new THREE.Mesh(antBaseGeom, blackMat);
  antBase.position.y = 0.2;
  headGroup.add(antBase);
  
  const antStemGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.1);
  const antStem = new THREE.Mesh(antStemGeom, lightGreen);
  antStem.position.y = 0.25;
  headGroup.add(antStem);
  
  const antLeftGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.08);
  const antLeft = new THREE.Mesh(antLeftGeom, lightGreen);
  antLeft.position.set(0.03, 0.32, 0);
  antLeft.rotation.z = -Math.PI / 4;
  headGroup.add(antLeft);
  
  const antRightGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.08);
  const antRight = new THREE.Mesh(antRightGeom, lightGreen);
  antRight.position.set(-0.03, 0.32, 0);
  antRight.rotation.z = Math.PI / 4;
  headGroup.add(antRight);

  robotGroup.add(headGroup);
  robotGroup.userData.headGroup = headGroup;

  // === Arms ===
  const armGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.15);
  
  const armGroup1 = new THREE.Group();
  armGroup1.position.set(0.25, 0.35, 0);
  const arm1 = new THREE.Mesh(armGeom, lightGreen);
  arm1.position.y = -0.075;
  armGroup1.add(arm1);
  const handGeom = new THREE.SphereGeometry(0.03, 8, 8);
  const hand1 = new THREE.Mesh(handGeom, blackMat);
  hand1.position.y = -0.16;
  armGroup1.add(hand1);
  robotGroup.add(armGroup1);
  robotGroup.userData.arm = armGroup1; // For waving!

  const armGroup2 = new THREE.Group();
  armGroup2.position.set(-0.25, 0.35, 0);
  const arm2 = new THREE.Mesh(armGeom, lightGreen);
  arm2.position.y = -0.075;
  armGroup2.add(arm2);
  const hand2 = new THREE.Mesh(handGeom, blackMat);
  hand2.position.y = -0.16;
  armGroup2.add(hand2);
  robotGroup.add(armGroup2);

  // === Legs ===
  const legGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.15);
  
  const leg1 = new THREE.Mesh(legGeom, lightGreen);
  leg1.position.set(0.1, 0.15, 0);
  robotGroup.add(leg1);
  
  const leg2 = new THREE.Mesh(legGeom, lightGreen);
  leg2.position.set(-0.1, 0.15, 0);
  robotGroup.add(leg2);
  
  const footGeom = new THREE.BoxGeometry(0.06, 0.04, 0.1);
  const foot1 = new THREE.Mesh(footGeom, blackMat);
  foot1.position.set(0.1, 0.05, 0.02);
  robotGroup.add(foot1);
  
  const foot2 = new THREE.Mesh(footGeom, blackMat);
  foot2.position.set(-0.1, 0.05, 0.02);
  robotGroup.add(foot2);

  // Position the robot
  robotGroup.position.set(0, 0, 8); // Place it near the entrance or center!
  scene.add(robotGroup);
  
  return robotGroup;
};

const VirtualFarm = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animFrameRef = useRef(null);
  const controlsRef = useRef(null);
  const interactionRef = useRef(null);
  const loadingStartTimeRef = useRef(Date.now());

  const [hoveredInfo, setHoveredInfo] = useState(null);
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [selectedPumpInfo, setSelectedPumpInfo] = useState(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
  
  // New State
  const [showSettings, setShowSettings] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [isRobotFocus, setIsRobotFocus] = useState(false);
  const [flaggedTowers, setFlaggedTowers] = useState(new Map()); // UUID -> { reason, marker }
  const flaggedTowersRef = useRef(flaggedTowers);
  const isRobotFocusRef = useRef(isRobotFocus);
  
  useEffect(() => {
    isRobotFocusRef.current = isRobotFocus;
  }, [isRobotFocus]);
  
  const [farmSettings, setFarmSettings] = useState({
    lightIntensity: 0.8,
    fanSpeed: 1.0,
    sprayInterval: 5,
    temperature: 22,
    pumpInterval: 2,
  });
  const settingsRef = useRef(farmSettings);

  useEffect(() => {
    settingsRef.current = farmSettings;
  }, [farmSettings]);

  useEffect(() => {
    flaggedTowersRef.current = flaggedTowers;
  }, [flaggedTowers]);

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
    const pipeRefs = createIrrigationPipes(scene, towerPositions);
    const tankMeshes = createNutrientTanks(scene);
    const reservoir = createWaterReservoir(scene);
    const pump = createWaterPump(scene);
    createControlPanel(scene);
    const fans = createVentilationFans(scene);
    createFloorDrains(scene);
    createSupportCables(scene);
    createFloorPuddles(scene);
    createRowLabels(scene);
    const drips = createWaterDrips(scene);
    createToolCart(scene);

    const robot = createRobot(scene);

    const sprayers = createSprayers(scene, towerPositions);
    const sprayParticles = createSprayParticles(scene, towerPositions);

    // Collect pump meshes
    const pumpMeshes = [reservoir, pump];

    // === Controls ===
    const controls = new SmoothControls(camera, canvas);
    controlsRef.current = controls;

    // === Interaction ===
    const interaction = new TowerInteraction(camera, canvas, towerMeshes, tankMeshes, pumpMeshes);
    interactionRef.current = interaction;

    // === Interaction ===
    // Click to hide instructions
    const onCanvasClick = () => {
      setShowInstructions(false);
    };
    canvas.addEventListener('click', onCanvasClick);

    // Click on robot to open chatbot
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onRobotClick = (event) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(robot, true);
      
      if (intersects.length > 0) {
        setIsRobotFocus(true);
      }
    };
    canvas.addEventListener('click', onRobotClick);

    // === Resize ===
    const onResize = () => handleResize(camera, renderer);
    window.addEventListener('resize', onResize);

    // Scene is now ready for rendering - store start time for minimum loading duration
    loadingStartTimeRef.current = Date.now();
    const showReadyState = () => {
      const elapsed = Date.now() - loadingStartTimeRef.current;
      if (elapsed >= 500) {
        setSceneReady(true);
      } else {
        setTimeout(showReadyState, 500 - elapsed);
      }
    };
    const readyTimeout = setTimeout(showReadyState, 500);

    // === Animation Loop ===
    const clock = new THREE.Clock();
    let sprayTimer = 0;
    let pumpTimer = 0;
    
    // Base fog color
    const baseFogColor = new THREE.Color(0xd4e6d4);

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const currentSettings = settingsRef.current;

      if (isRobotFocusRef.current) {
        // Smoothly move camera to position looking at robot (shifted left)
        camera.position.lerp(new THREE.Vector3(-0.8, 1.2, 10.5), 0.05);
        camera.lookAt(1.0, 1.0, 8.0); // Point further to the right of the robot to shift it left
        
        // Hello Animation (Waving UPWARDS)
        if (robot.userData.arm) {
          robot.userData.arm.rotation.z = 1.5 + Math.sin(clock.getElapsedTime() * 8) * 0.3;
        }
        
        // Head Animation (Subtle bobbing, staying attached to body)
        if (robot.userData.headGroup) {
          robot.userData.headGroup.position.y = 0.65 + Math.sin(clock.getElapsedTime() * 2) * 0.005;
        }
      } else {
        controls.update(delta);
      }

      // System timers
      sprayTimer += delta;
      pumpTimer += delta;
      
      const sprayIntervalSec = currentSettings.sprayInterval * 60;
      const sprayActive = sprayTimer % sprayIntervalSec < 10; // Spray for 10s
      
      const pumpIntervalSec = currentSettings.pumpInterval * 60;
      const pumpActive = pumpTimer % pumpIntervalSec < 15; // Pump runs for 15s

      // Animate details
      updateParticles(particles);
      updateFans(fans, delta, currentSettings.fanSpeed);
      updateWaterDrips(drips, delta);
      updateSprayParticles(sprayParticles, delta, sprayActive);
      updateWaterFlow(pipeRefs, delta, pumpActive);
      updateGrowLights(scene, currentSettings.lightIntensity);
      updateFlagMarkers(flaggedTowersRef.current, delta);

      // Temperature effects (adjust fog color)
      // 15C -> more blue/cool, 35C -> more warm/yellow
      const tempLerp = (currentSettings.temperature - 15) / 20; 
      const targetFogColor = new THREE.Color().lerpColors(
        new THREE.Color(0xc0e0ff), // Cool 15C
        new THREE.Color(0xffe6b0), // Warm 35C
        tempLerp
      );
      // Blend with base greenhouse color
      scene.fog.color.lerpColors(baseFogColor, targetFogColor, 0.4);

      // Perform hover interaction
      const hovered = interaction.update();
      
      // Update info panels
      setHoveredInfo(hovered);
      setSelectedInfo(interaction.getSelectedData());
      setSelectedPumpInfo(interaction.getSelectedPumpData());

      renderer.render(scene, camera);
    };
    animate();

    // === Cleanup ===
    return () => {
      clearTimeout(readyTimeout);
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('click', onCanvasClick);
      canvas.removeEventListener('click', onRobotClick);
      controls.dispose();
      interaction.dispose();
      renderer.dispose();
      
      // Cleanup flags
      flaggedTowersRef.current.forEach((data) => {
        removeFlagMarker(scene, data.marker);
      });
      
      scene.traverse(child => {
        if (child.isMesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else if (child.material) {
            child.material.dispose();
          }
        }
      });
    };
  }, [handleResize]);

  return (
    <div className="virtual-farm-container" ref={containerRef}>
      <canvas ref={canvasRef} className="virtual-farm-canvas" />

      {/* Loading Overlay - shown while scene initializes */}
      {!sceneReady && (
        <div className="vf-loading-overlay">
          <div className="vf-loading-spinner" />
          <p className="vf-loading-text">Initializing 3D Scene...</p>
        </div>
      )}

      {/* Settings Button */}
      <button className="vf-settings-btn" onClick={() => setShowSettings(true)}>
        ⚙️
      </button>

      {/* Temperature HUD */}
      <div className="vf-temp-hud">
        <span className="vf-temp-icon">🌡️</span>
        <span className="vf-temp-value">{farmSettings.temperature}°C</span>
      </div>

      <FarmSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        settings={farmSettings} 
        onSettingsChange={setFarmSettings} 
      />

      <FlagSystemModal 
        isOpen={showFlagModal} 
        onClose={() => setShowFlagModal(false)}
        tower={interactionRef.current?.getSelectedTowerObject()}
        onFlagSubmit={(uuid, reason) => {
          const tower = interactionRef.current?.getSelectedTowerObject();
          if (tower) {
            // Create marker in scene
            const scene = tower.parent;
            const marker = createFlagMarker(scene, tower.position);
            
            setFlaggedTowers(prev => {
              const next = new Map(prev);
              next.set(uuid, { reason, marker });
              return next;
            });
            
            // Tell interaction to apply red highlight
            interactionRef.current.applyFlagHighlight(tower);
          }
        }}
      />

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
            {flaggedTowers.has(interactionRef.current?.getSelectedTowerObject()?.uuid) && (
              <span className="vf-flag-badge">⚠ FLAGGED</span>
            )}
            <h3>{selectedInfo.species}</h3>
          </div>
          
          {flaggedTowers.has(interactionRef.current?.getSelectedTowerObject()?.uuid) && (
            <div className="vf-flag-reason-box">
              <strong>Issue:</strong> {flaggedTowers.get(interactionRef.current.getSelectedTowerObject().uuid).reason}
            </div>
          )}
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
          
          <div className="vf-panel-actions">
            {flaggedTowers.has(interactionRef.current?.getSelectedTowerObject()?.uuid) ? (
              <button 
                className="vf-btn-unflag"
                onClick={() => {
                  const tower = interactionRef.current.getSelectedTowerObject();
                  const data = flaggedTowers.get(tower.uuid);
                  removeFlagMarker(tower.parent, data.marker);
                  
                  setFlaggedTowers(prev => {
                    const next = new Map(prev);
                    next.delete(tower.uuid);
                    return next;
                  });
                  
                  interactionRef.current.removeFlagHighlight(tower);
                }}
              >
                ⚑ Unflag
              </button>
            ) : (
              <button 
                className="vf-btn-flag"
                onClick={() => setShowFlagModal(true)}
              >
                🚩 Flag for Review
              </button>
            )}
          </div>
        </div>
      )}

      {/* Selected Pump/Tank Info Panel */}
      {selectedPumpInfo && (
        <div className="vf-info-panel vf-pump-panel">
          <div className="vf-info-header">
            <span className="vf-info-badge vf-pump-badge">SYSTEM</span>
            <h3>{selectedPumpInfo.type} {selectedPumpInfo.isTank ? 'Tank' : ''}</h3>
          </div>
          <div className="vf-info-stats">
            {selectedPumpInfo.waterLevel !== undefined && (
              <div className="vf-stat">
                <span className="vf-stat-label">Level</span>
                <div className="vf-stat-bar">
                  <div className="vf-stat-fill vf-fill-blue" style={{ width: `${selectedPumpInfo.waterLevel}%` }} />
                </div>
                <span className="vf-stat-value">{selectedPumpInfo.waterLevel}%</span>
              </div>
            )}
            {selectedPumpInfo.ph !== undefined && selectedPumpInfo.ph !== null && (
              <div className="vf-stat">
                <span className="vf-stat-label">pH Level</span>
                <div className="vf-stat-bar">
                  <div className="vf-stat-fill vf-fill-amber" style={{ width: `${(selectedPumpInfo.ph / 14) * 100}%` }} />
                </div>
                <span className="vf-stat-value">{selectedPumpInfo.ph}</span>
              </div>
            )}
            {selectedPumpInfo.flowRate !== undefined && (
              <div className="vf-stat">
                <span className="vf-stat-label">Flow Rate</span>
                <span className="vf-stat-text">{selectedPumpInfo.flowRate} L/min</span>
              </div>
            )}
            {selectedPumpInfo.pressure && (
              <div className="vf-stat">
                <span className="vf-stat-label">Pressure</span>
                <span className="vf-stat-text">{selectedPumpInfo.pressure}</span>
              </div>
            )}
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

      {/* Virtual Farm Chatbot */}
      {isRobotFocus && (
        <VirtualChatbox onClose={() => setIsRobotFocus(false)} />
      )}
    </div>
  );
};

export default VirtualFarm;
