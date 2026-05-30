import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Lock } from 'lucide-react';

// Help parse SVG paths into Three.js 2D Shapes for Extrusion
function parseSvgPathToShape(pathString) {
  const shape = new THREE.Shape();
  const commands = pathString.match(/[MLCZz]|[+-]?\d*\.?\d+(?:[eE][+-]?\d+)?/g);
  if (!commands) return shape;

  let i = 0;
  while (i < commands.length) {
    const cmd = commands[i];
    if (cmd === 'M' || cmd === 'm') {
      const x = parseFloat(commands[i + 1]);
      const y = parseFloat(commands[i + 2]);
      shape.moveTo(x - 300, -(y - 250)); // Center map coordinates
      i += 3;
    } else if (cmd === 'L' || cmd === 'l') {
      const x = parseFloat(commands[i + 1]);
      const y = parseFloat(commands[i + 2]);
      shape.lineTo(x - 300, -(y - 250));
      i += 3;
    } else if (cmd === 'C' || cmd === 'c') {
      const cp1x = parseFloat(commands[i + 1]);
      const cp1y = parseFloat(commands[i + 2]);
      const cp2x = parseFloat(commands[i + 3]);
      const cp2y = parseFloat(commands[i + 4]);
      const x = parseFloat(commands[i + 5]);
      const y = parseFloat(commands[i + 6]);
      shape.bezierCurveTo(
        cp1x - 300, -(cp1y - 250),
        cp2x - 300, -(cp2y - 250),
        x - 300, -(y - 250)
      );
      i += 7;
    } else if (cmd === 'Z' || cmd === 'z') {
      shape.closePath();
      i++;
    } else {
      i++;
    }
  }
  return shape;
}

export default function ThreeTelanganaMap({
  mapLevel,
  setMapLevel,
  selectedConstituency,
  setSelectedConstituency,
  constituencyList,
  onHoverRegion
}) {
  const mountRef = useRef(null);
  const [webGlSupported, setWebGlSupported] = useState(true);

  // Realistic SVG Boundaries from state code
  const TELANGANA_DISTRICTS = [
    { id: 'gh', name: 'Greater Hyderabad', active: true, path: 'M 255 230 C 295 220, 315 220, 345 230 C 365 260, 345 290, 315 305 C 275 290, 245 270, 255 230 Z', centerX: 298 - 300, centerY: -(260 - 250) },
    { id: 'adilabad', name: 'Adilabad', active: false, path: 'M 190 60 C 230 40, 330 40, 370 70 C 350 90, 300 110, 240 100 C 200 95, 170 80, 190 60 Z' },
    { id: 'nizamabad', name: 'Nizamabad', active: false, path: 'M 140 130 C 180 110, 220 110, 245 125 C 255 155, 235 185, 210 200 C 160 210, 130 180, 140 130 Z' },
    { id: 'karimnagar', name: 'Karimnagar', active: false, path: 'M 290 125 C 330 105, 380 115, 410 135 C 390 175, 360 205, 320 200 C 290 185, 275 155, 290 125 Z' },
    { id: 'medak', name: 'Medak', active: false, path: 'M 125 215 C 165 200, 215 205, 245 220 C 240 250, 210 280, 175 285 C 135 270, 115 240, 125 215 Z' },
    { id: 'warangal', name: 'Warangal', active: false, path: 'M 355 215 C 395 200, 445 205, 475 235 C 445 275, 415 295, 365 275 C 335 260, 335 235, 355 215 Z' },
    { id: 'khammam', name: 'Khammam', active: false, path: 'M 425 295 C 465 275, 515 290, 535 325 C 505 385, 465 415, 415 395 C 395 365, 395 330, 425 295 Z' },
    { id: 'nalgonda', name: 'Nalgonda', active: false, path: 'M 285 315 C 325 305, 375 310, 395 325 C 405 375, 365 415, 325 425 C 285 405, 275 365, 285 315 Z' },
    { id: 'mahabubnagar', name: 'Mahabubnagar', active: false, path: 'M 135 295 C 185 290, 235 305, 245 320 C 255 365, 215 410, 175 415 C 125 395, 115 340, 135 295 Z' }
  ];

  const GH_CONSTITUENCIES = [
    { id: 'Secunderabad', name: 'Secunderabad', path: 'M 220 70 C 270 50, 320 50, 340 100 C 310 130, 270 140, 210 110 C 190 95, 195 85, 220 70 Z' },
    { id: 'Nampally', name: 'Nampally', path: 'M 170 150 C 220 140, 260 140, 285 160 C 290 205, 255 240, 220 250 C 185 235, 160 200, 170 150 Z' },
    { id: 'Charminar', name: 'Charminar', path: 'M 190 260 C 230 250, 280 250, 305 270 C 300 325, 265 350, 230 360 C 195 345, 180 310, 190 260 Z' },
    { id: 'Jubilee Hills', name: 'Jubilee Hills', path: 'M 70 130 C 120 110, 160 120, 185 140 C 160 185, 130 205, 90 200 C 60 185, 55 160, 70 130 Z' },
    { id: 'Khairatabad', name: 'Khairatabad', path: 'M 300 170 C 340 150, 385 160, 410 180 C 390 225, 360 250, 320 245 C 290 230, 285 205, 300 170 Z' },
    { id: 'Amberpet', name: 'Amberpet', path: 'M 320 260 C 360 250, 405 260, 430 280 C 410 325, 380 350, 340 345 C 310 330, 305 305, 320 260 Z' },
    { id: 'Musheerabad', name: 'Musheerabad', path: 'M 80 235 C 130 225, 150 235, 175 250 C 150 295, 120 315, 80 310 C 50 295, 55 270, 80 235 Z' },
    { id: 'Karwan', name: 'Karwan', path: 'M 290 85 C 340 75, 390 85, 415 105 C 395 150, 365 170, 325 165 C 295 150, 280 120, 290 85 Z' }
  ];

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL Support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGlSupported(false);
        return;
      }
    } catch (e) {
      setWebGlSupported(false);
      return;
    }

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 450;

    // Scene setup
    const scene = new THREE.Scene();

    // Camera setup
    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 2000);
    camera.position.set(0, -180, 420); // angled look
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Groups
    const mapGroup = new THREE.Group();
    scene.add(mapGroup);

    const stateGroup = new THREE.Group();
    const ghGroup = new THREE.Group();
    mapGroup.add(stateGroup);
    mapGroup.add(ghGroup);

    // Dynamic scale depending on level
    if (mapLevel === 'state') {
      stateGroup.visible = true;
      ghGroup.visible = false;
      mapGroup.scale.set(0.9, 0.9, 0.9);
    } else {
      stateGroup.visible = false;
      ghGroup.visible = true;
      mapGroup.scale.set(1.4, 1.4, 1.4); // Zoom in effect
    }

    // Extrude Settings
    const extrudeSettings = {
      depth: 12,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 1.5,
      bevelThickness: 1.5
    };

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 3.5);
    dirLight.position.set(100, 200, 300);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x22d3ee, 5, 200);
    pointLight.position.set(0, 0, 50);
    scene.add(pointLight);

    // Materials
    const activeFaceMat = new THREE.MeshPhysicalMaterial({
      color: 0x0ea5e9, // Glowing sky blue
      metalness: 0.1,
      roughness: 0.15,
      transmission: 0.4, // glass opacity
      thickness: 4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.15
    });

    const activeSideMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Luxury dark gold
      metalness: 0.95,
      roughness: 0.2
    });

    const inactiveFaceMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // slate-800
      metalness: 0.8,
      roughness: 0.45,
      transparent: true,
      opacity: 0.6
    });

    const inactiveSideMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // slate-900
      metalness: 0.8,
      roughness: 0.5,
      transparent: true,
      opacity: 0.55
    });

    const outlineGlowMat = new THREE.LineBasicMaterial({
      color: 0x22d3ee, // glowing cyan outline
      transparent: true,
      opacity: 0.8
    });

    const outlineSlateMat = new THREE.LineBasicMaterial({
      color: 0x475569, // slate outline
      transparent: true,
      opacity: 0.4
    });

    // 1. Build State Districts
    const districtMeshes = [];
    TELANGANA_DISTRICTS.forEach((dist) => {
      const shape = parseSvgPathToShape(dist.path);
      const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      
      const mesh = new THREE.Mesh(geom, [
        dist.active ? activeFaceMat : inactiveFaceMat,
        dist.active ? activeSideMat : inactiveSideMat
      ]);
      mesh.userData = { id: dist.id, name: dist.name, active: dist.active, type: 'district' };
      stateGroup.add(mesh);
      districtMeshes.push(mesh);

      // Top face borders loop
      const points = shape.getPoints();
      const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.LineLoop(lineGeom, dist.active ? outlineGlowMat : outlineSlateMat);
      line.position.z = 13.5; // position outline slightly above top face
      stateGroup.add(line);
    });

    // 2. Build GH Constituencies
    const ghMeshes = [];
    GH_CONSTITUENCIES.forEach((con) => {
      const shape = parseSvgPathToShape(con.path);
      const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      
      // Determine color & selection state
      const isSelected = selectedConstituency?.constituency_name.toLowerCase().includes(con.name.toLowerCase());
      
      const conFaceMat = new THREE.MeshPhysicalMaterial({
        color: isSelected ? 0x22d3ee : 0x0f766e, // Teal highlight vs dark teal
        metalness: 0.2,
        roughness: 0.1,
        transmission: 0.5,
        thickness: 3
      });

      const conSideMat = new THREE.MeshStandardMaterial({
        color: isSelected ? 0x0ea5e9 : 0x115e59,
        metalness: 0.9,
        roughness: 0.25
      });

      const mesh = new THREE.Mesh(geom, [conFaceMat, conSideMat]);
      mesh.userData = { id: con.id, name: con.name, active: true, type: 'constituency' };
      ghGroup.add(mesh);
      ghMeshes.push(mesh);

      const points = shape.getPoints();
      const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.LineLoop(lineGeom, new THREE.LineBasicMaterial({
        color: isSelected ? 0x38bdf8 : 0x0ea5e9,
        transparent: true,
        opacity: isSelected ? 0.9 : 0.5
      }));
      line.position.z = 13.5;
      ghGroup.add(line);
    });

    // 3. Floating Halo particles for cinematic depth
    const particleGeom = new THREE.BufferGeometry();
    const particleCount = 45;
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 350;
      posArray[i + 1] = (Math.random() - 0.5) * 300;
      posArray[i + 2] = Math.random() * 100;
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 3,
      color: 0xf59e0b, // Radiant Luxury Gold
      transparent: true,
      opacity: 0.6
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    // Raycasting & Mouse move
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let currentHoveredMesh = null;

    let targetRotX = 0;
    let targetRotY = 0;
    let curRotX = 0;
    let curRotY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Elastic 3D Rotation angles
      const normX = (x / rect.width) - 0.5;
      const normY = (y / rect.height) - 0.5;
      targetRotX = -normY * 0.35; // Maximum tilt
      targetRotY = normX * 0.35;

      // Raycasting
      mouse.x = (x / rect.width) * 2 - 1;
      mouse.y = -(y / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const activeGroup = mapLevel === 'state' ? stateGroup : ghGroup;
      const intersects = raycaster.intersectObjects(activeGroup.children);

      if (intersects.length > 0) {
        const mesh = intersects[0].object;
        if (mesh.userData.name && mesh !== currentHoveredMesh) {
          currentHoveredMesh = mesh;
          onHoverRegion({
            id: mesh.userData.id,
            name: mesh.userData.name,
            active: mesh.userData.active,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          });
        }
      } else {
        if (currentHoveredMesh) {
          currentHoveredMesh = null;
          onHoverRegion(null);
        }
      }
    };

    const handleMouseLeave = () => {
      targetRotX = 0;
      targetRotY = 0;
      currentHoveredMesh = null;
      onHoverRegion(null);
    };

    const handleClick = () => {
      if (currentHoveredMesh) {
        const data = currentHoveredMesh.userData;
        if (data.type === 'district' && data.id === 'gh') {
          setMapLevel('gh');
          onHoverRegion(null);
        } else if (data.type === 'constituency') {
          // Handle constituency click selection
          const matched = constituencyList.find(c =>
            c.constituency_name.toLowerCase().includes(data.name.toLowerCase())
          );
          if (matched) {
            setSelectedConstituency(matched);
            const element = document.getElementById(`constituency-card-${matched.id}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('click', handleClick);

    // Anim loop
    let clock = new THREE.Clock();
    let animId;

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      // Gently rotate particle fields
      particles.position.z += Math.sin(elapsed) * 0.05;
      
      // Interpolate map rotation for smooth elastic movement
      curRotX += (targetRotX - curRotX) * 0.08;
      curRotY += (targetRotY - curRotY) * 0.08;
      mapGroup.rotation.x = curRotX;
      mapGroup.rotation.y = curRotY;

      // Floating wave movement
      mapGroup.position.z = Math.sin(elapsed * 1.2) * 5;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('click', handleClick);
      renderer.dispose();
    };
  }, [mapLevel, selectedConstituency, constituencyList]);

  if (!webGlSupported) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-700 rounded-2xl h-[400px] text-slate-400">
        <Lock className="w-8 h-8 text-rose-500 mb-2" />
        WebGL is not supported in this browser environment.
      </div>
    );
  }

  return (
    <div 
      ref={mountRef} 
      className="w-full h-full min-h-[380px] flex items-center justify-center relative overflow-hidden"
    />
  );
}
