import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Lock } from 'lucide-react';

// Scale factor to fit SVG coords (928x875 viewbox) into Three.js space
const SX = 464; // center X offset
const SY = 437; // center Y offset
const SCALE = 0.6; // scale factor

function tx(x) { return (x - SX) * SCALE; }
function ty(y) { return -(y - SY) * SCALE; }

// Build a Three.js Shape from a flat array of [x,y] pairs
function pointsToShape(pts) {
  const shape = new THREE.Shape();
  if (!pts.length) return shape;
  shape.moveTo(tx(pts[0][0]), ty(pts[0][1]));
  for (let i = 1; i < pts.length; i++) {
    shape.lineTo(tx(pts[i][0]), ty(pts[i][1]));
  }
  shape.closePath();
  return shape;
}

// Real simplified district outlines extracted from t.svg
// Each entry is a polygon approximation of the actual geography
const DISTRICT_DATA = [
  {
    id: 'hyderabad', name: 'Hyderabad', active: true,
    pts: [[284,557],[290,535],[300,530],[310,528],[315,535],[314,550],[308,560],[296,563],[284,557]]
  },
  {
    id: 'ranga_reddy', name: 'Ranga Reddy', active: false,
    pts: [[200,620],[230,580],[260,570],[290,575],[310,600],[300,650],[270,680],[235,675],[200,650],[190,635],[200,620]]
  },
  {
    id: 'medchal', name: 'Medchal', active: false,
    pts: [[250,480],[300,470],[330,480],[340,510],[320,545],[290,548],[265,535],[245,510],[250,480]]
  },
  {
    id: 'sangareddy', name: 'Sangareddy', active: false,
    pts: [[130,480],[160,440],[210,430],[240,440],[242,470],[220,510],[180,525],[145,515],[125,495],[130,480]]
  },
  {
    id: 'medak', name: 'Medak', active: false,
    pts: [[170,420],[210,390],[250,395],[265,420],[255,455],[225,470],[190,465],[165,445],[170,420]]
  },
  {
    id: 'kamareddy', name: 'Kamareddy', active: false,
    pts: [[150,320],[200,285],[250,290],[280,315],[275,355],[250,390],[210,395],[165,380],[145,350],[150,320]]
  },
  {
    id: 'nizamabad', name: 'Nizamabad', active: false,
    pts: [[130,240],[175,210],[220,215],[255,235],[250,275],[220,310],[180,320],[140,300],[120,270],[130,240]]
  },
  {
    id: 'nirmal', name: 'Nirmal', active: false,
    pts: [[180,170],[230,145],[280,150],[310,175],[295,220],[260,240],[215,240],[175,215],[165,190],[180,170]]
  },
  {
    id: 'adilabad', name: 'Adilabad', active: false,
    pts: [[200,110],[260,80],[330,85],[385,110],[375,155],[335,180],[280,185],[225,165],[195,140],[200,110]]
  },
  {
    id: 'mancherial', name: 'Mancherial', active: false,
    pts: [[420,150],[480,120],[540,130],[570,165],[555,210],[510,235],[460,225],[425,195],[415,170],[420,150]]
  },
  {
    id: 'komaram_bheem', name: 'Komaram Bheem', active: false,
    pts: [[370,100],[430,70],[510,80],[550,115],[525,165],[475,185],[420,175],[380,145],[365,120],[370,100]]
  },
  {
    id: 'peddapalli', name: 'Peddapalli', active: false,
    pts: [[480,270],[520,245],[570,250],[595,280],[575,320],[540,340],[500,330],[475,305],[480,270]]
  },
  {
    id: 'jayashankar', name: 'Jayashankar', active: false,
    pts: [[580,320],[640,290],[700,305],[720,345],[695,400],[650,420],[600,405],[575,370],[580,320]]
  },
  {
    id: 'karimnagar', name: 'Karimnagar', active: false,
    pts: [[390,280],[440,255],[490,265],[510,295],[495,335],[460,355],[415,345],[385,315],[390,280]]
  },
  {
    id: 'rajanna', name: 'Rajanna Sircilla', active: false,
    pts: [[340,280],[390,255],[420,270],[425,305],[400,335],[365,340],[335,315],[330,290],[340,280]]
  },
  {
    id: 'jagtial', name: 'Jagtial', active: false,
    pts: [[330,220],[380,195],[420,205],[435,235],[415,270],[380,285],[340,272],[320,248],[330,220]]
  },
  {
    id: 'siddipet', name: 'Siddipet', active: false,
    pts: [[255,380],[300,355],[345,360],[370,385],[360,425],[325,445],[280,440],[255,415],[250,395],[255,380]]
  },
  {
    id: 'yadadri', name: 'Yadadri', active: false,
    pts: [[320,540],[365,510],[410,515],[430,545],[415,590],[380,610],[340,605],[315,575],[320,540]]
  },
  {
    id: 'nalgonda', name: 'Nalgonda', active: false,
    pts: [[340,610],[390,575],[450,580],[480,615],[465,680],[425,715],[375,710],[340,670],[330,640],[340,610]]
  },
  {
    id: 'suryapet', name: 'Suryapet', active: false,
    pts: [[460,620],[530,590],[590,600],[610,640],[590,700],[545,720],[490,710],[455,670],[450,645],[460,620]]
  },
  {
    id: 'khammam', name: 'Khammam', active: false,
    pts: [[620,580],[690,545],[760,560],[790,610],[760,680],[710,710],[645,695],[615,645],[620,580]]
  },
  {
    id: 'bhadradri', name: 'Bhadradri', active: false,
    pts: [[750,490],[820,460],[870,480],[885,530],[865,600],[815,630],[755,615],[725,560],[750,490]]
  },
  {
    id: 'warangal_u', name: 'Warangal Urban', active: false,
    pts: [[500,410],[540,390],[575,400],[585,430],[565,460],[530,470],[495,455],[485,430],[500,410]]
  },
  {
    id: 'warangal_r', name: 'Warangal Rural', active: false,
    pts: [[540,450],[590,425],[635,440],[650,475],[625,515],[580,525],[540,505],[525,475],[540,450]]
  },
  {
    id: 'mahabubabad', name: 'Mahabubabad', active: false,
    pts: [[575,500],[630,475],[680,490],[695,530],[670,575],[625,590],[575,570],[555,535],[575,500]]
  },
  {
    id: 'jangaon', name: 'Jangaon', active: false,
    pts: [[450,430],[495,405],[530,415],[540,445],[515,480],[475,490],[445,470],[435,450],[450,430]]
  },
  {
    id: 'vikarabad', name: 'Vikarabad', active: false,
    pts: [[80,580],[130,545],[180,550],[210,580],[200,630],[160,660],[110,650],[75,615],[80,580]]
  },
  {
    id: 'narayanpet', name: 'Narayanpet', active: false,
    pts: [[100,680],[155,650],[210,660],[230,695],[215,740],[170,760],[115,745],[90,710],[100,680]]
  },
  {
    id: 'nagarkurnool', name: 'Nagarkurnool', active: false,
    pts: [[220,720],[280,690],[340,700],[365,735],[345,790],[295,815],[240,805],[210,765],[220,720]]
  },
  {
    id: 'wanaparthy', name: 'Wanaparthy', active: false,
    pts: [[165,760],[220,730],[270,740],[290,775],[270,820],[225,840],[175,825],[150,790],[165,760]]
  },
  {
    id: 'gadwal', name: 'Gadwal', active: false,
    pts: [[105,800],[165,770],[210,780],[225,815],[205,855],[160,870],[110,850],[90,820],[105,800]]
  },
  {
    id: 'mahbubnagar', name: 'Mahbubnagar', active: false,
    pts: [[80,660],[135,625],[195,635],[230,670],[215,720],[170,745],[110,730],[70,695],[80,660]]
  }
];

// GH constituency approximate polygons (scaled within Hyderabad zone)
const GH_DATA = [
  { id: 'Secunderabad', name: 'Secunderabad', pts: [[290,510],[310,505],[325,515],[322,535],[305,540],[290,530],[290,510]] },
  { id: 'Nampally', name: 'Nampally', pts: [[275,535],[295,530],[308,540],[305,558],[288,562],[272,550],[275,535]] },
  { id: 'Charminar', name: 'Charminar', pts: [[280,558],[305,555],[312,570],[305,585],[282,582],[272,568],[280,558]] },
  { id: 'JubileeHills', name: 'Jubilee Hills', pts: [[260,525],[280,518],[292,530],[285,548],[264,548],[254,538],[260,525]] },
  { id: 'Khairatabad', name: 'Khairatabad', pts: [[270,505],[290,500],[305,510],[302,528],[283,530],[268,520],[270,505]] },
  { id: 'Amberpet', name: 'Amberpet', pts: [[300,528],[318,522],[330,535],[325,552],[308,556],[298,542],[300,528]] },
  { id: 'Musheerabad', name: 'Musheerabad', pts: [[288,495],[308,490],[320,502],[316,518],[298,520],[285,508],[288,495]] },
  { id: 'LBNagar', name: 'L.B. Nagar', pts: [[295,565],[315,560],[325,572],[318,590],[298,592],[288,575],[295,565]] }
];

export default function ThreeTelanganaMap({ mapLevel, setMapLevel, selectedConstituency, setSelectedConstituency, constituencyList, onHoverRegion }) {
  const mountRef = useRef(null);
  const [webGlSupported, setWebGlSupported] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) { setWebGlSupported(false); return; }
    } catch (e) { setWebGlSupported(false); return; }

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 450;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 1, 2000);
    camera.position.set(0, 0, 380);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const mapGroup = new THREE.Group();
    scene.add(mapGroup);

    const stateGroup = new THREE.Group();
    const ghGroup = new THREE.Group();
    mapGroup.add(stateGroup);
    mapGroup.add(ghGroup);

    stateGroup.visible = mapLevel === 'state';
    ghGroup.visible = mapLevel !== 'state';

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const dir = new THREE.DirectionalLight(0xffffff, 3.5);
    dir.position.set(150, 200, 300);
    scene.add(dir);
    const pt = new THREE.PointLight(0x22d3ee, 6, 300);
    pt.position.set(0, 50, 80);
    scene.add(pt);

    const extOpts = { depth: 10, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.8, bevelThickness: 0.8 };

    const activeFace = new THREE.MeshPhysicalMaterial({ color: 0x0ea5e9, metalness: 0.1, roughness: 0.2, emissive: 0x0369a1, emissiveIntensity: 0.2 });
    const activeSide = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.15 });
    const lockedFace = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.5, transparent: true, opacity: 0.75 });
    const lockedSide = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.5, transparent: true, opacity: 0.7 });
    const glowLine = new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.9 });
    const dimLine = new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.5 });

    // Build state districts
    DISTRICT_DATA.forEach(d => {
      const shape = pointsToShape(d.pts);
      const geom = new THREE.ExtrudeGeometry(shape, extOpts);
      const mesh = new THREE.Mesh(geom, [d.active ? activeFace : lockedFace, d.active ? activeSide : lockedSide]);
      mesh.userData = { id: d.id, name: d.name, active: d.active, type: 'district' };
      stateGroup.add(mesh);

      const pts3d = d.pts.map(p => new THREE.Vector3(tx(p[0]), ty(p[1]), 11));
      pts3d.push(pts3d[0]);
      const lg = new THREE.BufferGeometry().setFromPoints(pts3d);
      stateGroup.add(new THREE.Line(lg, d.active ? glowLine : dimLine));
    });

    // Build GH constituencies
    GH_DATA.forEach(c => {
      const isSelected = selectedConstituency?.constituency_name?.toLowerCase().includes(c.name.toLowerCase());
      const faceMat = new THREE.MeshPhysicalMaterial({ color: isSelected ? 0x22d3ee : 0x0f766e, metalness: 0.2, roughness: 0.1, emissive: isSelected ? 0x0ea5e9 : 0x134e4a, emissiveIntensity: 0.3 });
      const sideMat = new THREE.MeshStandardMaterial({ color: isSelected ? 0x0ea5e9 : 0x115e59, metalness: 0.9, roughness: 0.2 });
      const shape = pointsToShape(c.pts);
      const geom = new THREE.ExtrudeGeometry(shape, extOpts);
      const mesh = new THREE.Mesh(geom, [faceMat, sideMat]);
      mesh.userData = { id: c.id, name: c.name, active: true, type: 'constituency' };
      ghGroup.add(mesh);

      const pts3d = c.pts.map(p => new THREE.Vector3(tx(p[0]), ty(p[1]), 11));
      pts3d.push(pts3d[0]);
      const lg = new THREE.BufferGeometry().setFromPoints(pts3d);
      ghGroup.add(new THREE.Line(lg, new THREE.LineBasicMaterial({ color: isSelected ? 0x38bdf8 : 0x0ea5e9, transparent: true, opacity: isSelected ? 1 : 0.6 })));
    });

    // Gold particles
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(120);
    for (let i = 0; i < 120; i += 3) {
      pPos[i] = (Math.random() - 0.5) * 320;
      pPos[i+1] = (Math.random() - 0.5) * 280;
      pPos[i+2] = Math.random() * 60;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 2.5, color: 0xf59e0b, transparent: true, opacity: 0.55 }));
    scene.add(particles);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredMesh = null;
    let tX = 0, tY = 0, cX = 0, cY = 0;

    const onMove = e => {
      const r = container.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      tX = -((y / r.height) - 0.5) * 0.4;
      tY = ((x / r.width) - 0.5) * 0.4;
      mouse.x = (x / r.width) * 2 - 1;
      mouse.y = -(y / r.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const group = mapLevel === 'state' ? stateGroup : ghGroup;
      const hits = raycaster.intersectObjects(group.children);
      if (hits.length > 0 && hits[0].object.userData.name) {
        const m = hits[0].object;
        if (m !== hoveredMesh) {
          hoveredMesh = m;
          onHoverRegion({ id: m.userData.id, name: m.userData.name, active: m.userData.active, x, y });
        }
      } else if (hoveredMesh) {
        hoveredMesh = null;
        onHoverRegion(null);
      }
    };

    const onLeave = () => { tX = 0; tY = 0; hoveredMesh = null; onHoverRegion(null); };

    const onClick = () => {
      if (!hoveredMesh) return;
      const d = hoveredMesh.userData;
      if (d.type === 'district' && d.id === 'hyderabad') { setMapLevel('gh'); onHoverRegion(null); }
      else if (d.type === 'constituency') {
        const m = constituencyList.find(c => c.constituency_name.toLowerCase().includes(d.name.toLowerCase()));
        if (m) {
          setSelectedConstituency(m);
          document.getElementById(`constituency-card-${m.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };

    container.addEventListener('mousemove', onMove);
    container.addEventListener('mouseleave', onLeave);
    container.addEventListener('click', onClick);

    const clock = new THREE.Clock();
    let animId;
    const animate = () => {
      const t = clock.getElapsedTime();
      cX += (tX - cX) * 0.07;
      cY += (tY - cY) * 0.07;
      mapGroup.rotation.x = cX;
      mapGroup.rotation.y = cY;
      mapGroup.position.y = Math.sin(t * 0.8) * 4;
      particles.rotation.z = t * 0.03;
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const { width: w, height: h } = e.contentRect;
        if (w && h) { camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); }
      }
    });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      container.removeEventListener('mousemove', onMove);
      container.removeEventListener('mouseleave', onLeave);
      container.removeEventListener('click', onClick);
      ro.disconnect();
      renderer.dispose();
    };
  }, [mapLevel, selectedConstituency, constituencyList]);

  if (!webGlSupported) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] border border-dashed border-slate-700 rounded-2xl text-slate-400">
        <Lock className="w-8 h-8 text-rose-500 mb-2" />
        WebGL not supported in this browser.
      </div>
    );
  }

  return <div ref={mountRef} className="w-full h-full min-h-[420px] relative overflow-hidden" />;
}
