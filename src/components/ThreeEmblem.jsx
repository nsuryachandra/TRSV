import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function ThreeEmblem() {
  const mountRef = useRef(null);
  const [webGlSupported, setWebGlSupported] = useState(true);

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

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 6;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Group to hold all 3D geometries
    const emblemGroup = new THREE.Group();
    scene.add(emblemGroup);

    // Small detailed inner golden shield sigil (Protection Symbol)
    const shieldShape = new THREE.Shape();
    shieldShape.moveTo(0, 0.9);
    shieldShape.lineTo(0.6, 0.7);
    shieldShape.lineTo(0.6, 0.1);
    shieldShape.quadraticCurveTo(0.6, -0.6, 0, -1.0);
    shieldShape.quadraticCurveTo(-0.6, -0.6, -0.6, 0.1);
    shieldShape.lineTo(-0.6, 0.7);
    shieldShape.lineTo(0, 0.9);

    const extrudeSettings = {
      depth: 0.12,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04
    };

    const goldenShieldGeom = new THREE.ExtrudeGeometry(shieldShape, extrudeSettings);
    goldenShieldGeom.center();

    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Radiant Luxury Gold
      metalness: 0.98,
      roughness: 0.12,
      emissive: 0x78350f,
      emissiveIntensity: 0.15
    });
    const goldShieldMesh = new THREE.Mesh(goldenShieldGeom, goldMaterial);
    goldShieldMesh.scale.set(0.6, 0.6, 0.6); // Perfect size to fit inside glass sphere
    goldShieldMesh.position.z = -0.06;

    // Central Glass Crystal Sphere (Refractive transparency core)
    const crystalGeom = new THREE.SphereGeometry(0.9, 32, 32);
    const crystalMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.15,
      roughness: 0.04,
      transmission: 0.96, // High transparency refraction
      thickness: 0.95,
      ior: 1.62, // Premium crystal index of refraction
      clearcoat: 1.0,
      clearcoatRoughness: 0.02
    });
    const crystalMesh = new THREE.Mesh(crystalGeom, crystalMaterial);
    
    // Add the golden shield inside the crystal sphere
    crystalMesh.add(goldShieldMesh);
    emblemGroup.add(crystalMesh);

    // Outer Cyber Grid Lattice (Wireframe Lattice)
    const latticeGeom = new THREE.IcosahedronGeometry(1.35, 1);
    const latticeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x22d3ee, // Cyber Cyan
      metalness: 0.3,
      roughness: 0.1,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const latticeMesh = new THREE.Mesh(latticeGeom, latticeMaterial);
    emblemGroup.add(latticeMesh);

    // Conic telemetry orbit rings
    // Orbit 1: Rose (TRS branding accent)
    const orbit1Geom = new THREE.TorusGeometry(1.6, 0.012, 8, 120);
    const orbit1Material = new THREE.MeshStandardMaterial({
      color: 0xf43f5e, // Rose
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x9f1239,
      emissiveIntensity: 0.4
    });
    const orbit1Mesh = new THREE.Mesh(orbit1Geom, orbit1Material);
    orbit1Mesh.rotation.x = Math.PI / 4;
    emblemGroup.add(orbit1Mesh);

    // Orbit 2: Cyan (Cyber accent)
    const orbit2Geom = new THREE.TorusGeometry(1.95, 0.008, 8, 120);
    const orbit2Material = new THREE.MeshStandardMaterial({
      color: 0x06b6d4, // Cyan
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x0891b2,
      emissiveIntensity: 0.4
    });
    const orbit2Mesh = new THREE.Mesh(orbit2Geom, orbit2Material);
    orbit2Mesh.rotation.y = Math.PI / 3;
    emblemGroup.add(orbit2Mesh);

    // Orbit 3: Amber/Gold (Telemetry boundary)
    const orbit3Geom = new THREE.TorusGeometry(2.3, 0.006, 8, 120);
    const orbit3Material = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Amber Gold
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xb45309,
      emissiveIntensity: 0.4
    });
    const orbit3Mesh = new THREE.Mesh(orbit3Geom, orbit3Material);
    orbit3Mesh.rotation.x = -Math.PI / 6;
    emblemGroup.add(orbit3Mesh);

    // Orbiting Space Dust Particle System
    const particleCount = 180;
    const particlesGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = [];

    for (let i = 0; i < particleCount; i++) {
      const r = 1.45 + Math.random() * 1.15;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      
      particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = r * Math.cos(phi);
      
      particleSpeeds.push({
        speed: 0.15 + Math.random() * 0.35,
        radius: r,
        angle: theta,
        yPhase: Math.random() * Math.PI * 2
      });
    }
    
    particlesGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    // Circular custom canvas texture for smooth anti-aliased glowing points
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 16;
    pCanvas.height = 16;
    const pCtx = pCanvas.getContext('2d');
    const pGrad = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
    pGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    pGrad.addColorStop(0.3, 'rgba(34, 211, 238, 0.8)');
    pGrad.addColorStop(1, 'rgba(34, 211, 238, 0)');
    pCtx.fillStyle = pGrad;
    pCtx.fillRect(0, 0, 16, 16);
    const pTexture = new THREE.CanvasTexture(pCanvas);

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.09,
      map: pTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.8
    });
    
    const particleSystem = new THREE.Points(particlesGeom, particlesMaterial);
    emblemGroup.add(particleSystem);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    // Direct lighting that casts gleams
    const pointLight1 = new THREE.PointLight(0x0ea5e9, 220, 50);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x22d3ee, 150, 50);
    pointLight2.position.set(-5, -5, 3);
    scene.add(pointLight2);

    const dirLight = new THREE.DirectionalLight(0xffffff, 4.5);
    dirLight.position.set(2, 4, 6);
    scene.add(dirLight);

    // Cursor tracking state variables
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left - width / 2;
      const y = event.clientY - rect.top - height / 2;
      targetX = (x / width) * 1.5;
      targetY = (y / height) * 1.5;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // Resize listener
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW && newH) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // Render loop
    let clock = new THREE.Clock();
    let animId;

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Rotate the central crystal sphere and gold shield
      crystalMesh.rotation.y = elapsedTime * 0.45;
      crystalMesh.rotation.x = elapsedTime * 0.18;

      // Spin lattice
      latticeMesh.rotation.y = -elapsedTime * 0.15;
      latticeMesh.rotation.z = elapsedTime * 0.08;

      // Spin custom concentric telemetry orbits on different axes
      orbit1Mesh.rotation.z = elapsedTime * 0.4;
      orbit2Mesh.rotation.z = -elapsedTime * 0.25;
      orbit3Mesh.rotation.z = elapsedTime * 0.12;

      // Dynamic orbital position update for particles
      const positions = particlesGeom.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const speedData = particleSpeeds[i];
        speedData.angle += speedData.speed * 0.008;
        
        const x = speedData.radius * Math.cos(speedData.angle);
        const z = speedData.radius * Math.sin(speedData.angle);
        const y = Math.sin(elapsedTime * 0.4 + speedData.yPhase) * 0.6;
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
      }
      particlesGeom.attributes.position.needsUpdate = true;

      // Elastic cursor reaction
      mouseX += (targetX - mouseX) * 0.08;
      mouseY += (targetY - mouseY) * 0.08;

      emblemGroup.rotation.y = mouseX;
      emblemGroup.rotation.x = -mouseY;

      // Smooth float
      emblemGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.1;

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
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  if (!webGlSupported) {
    return <FallbackSVGEmblem />;
  }

  return (
    <div 
      ref={mountRef} 
      className="w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 mx-auto cursor-grab active:cursor-grabbing relative flex items-center justify-center"
    />
  );
}

// Sleek responsive vector shield fallback for maximum accessibility
function FallbackSVGEmblem() {
  return (
    <div className="w-64 h-64 sm:w-80 sm:h-80 relative flex items-center justify-center animate-float-slow">
      {/* Halo outer rings */}
      <div className="absolute inset-0 border border-cyan-400/20 dark:border-cyan-500/20 rounded-full animate-[spin_12s_linear_infinite]" />
      <div className="absolute inset-6 border border-sky-400/10 dark:border-sky-500/10 rounded-full animate-[spin_8s_linear_infinite_reverse]" />
      
      {/* Decorative Core Shield */}
      <svg 
        viewBox="0 0 100 100" 
        className="w-40 h-40 drop-shadow-glow-cyan dark:drop-shadow-[0_0_25px_rgba(34,211,238,0.4)]"
      >
        <defs>
          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        
        {/* Futuristic Grid Shield structure */}
        <polygon 
          points="50,5 90,20 90,55 50,95 10,55 10,20" 
          fill="url(#shieldGrad)" 
          className="opacity-90"
        />
        
        {/* Core details */}
        <polygon 
          points="50,15 80,26 80,50 50,82 20,50 20,26" 
          fill="#ffffff" 
          className="opacity-20"
        />
        
        {/* Inner symbol block (T) */}
        <path 
          d="M38,30 H62 V38 H54 V70 H46 V38 H38 Z" 
          fill="#ffffff"
          className="drop-shadow-sm font-extrabold"
        />
      </svg>
    </div>
  );
}
