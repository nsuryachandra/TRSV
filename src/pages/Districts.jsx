import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Users, ShieldAlert, CheckCircle2, Shield, Building2, ChevronLeft, Lock, Info, Phone, Mail, Award, ArrowRight } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import AnimatedSection from '../components/AnimatedSection';
import { useAuth } from '../context/AuthContext';
import PremiumButton from '../components/PremiumButton';
import { useNavigate } from 'react-router-dom';

const formatRole = (role, tier) => {
  if (role === 'supreme_admin') return 'TRSV Founder';
  if (role === 'president' || role === 'state_president') {
    if (tier === 'state') return 'State President';
    if (tier === 'hub') return 'President';
    return 'Local President';
  }
  if (role === 'general_secretary') {
    if (tier === 'hub') return 'General Secretary';
    return 'General Secretary';
  }
  if (role === 'digital_operations_president') return 'Digital Operations President';
  if (role === 'dev') return 'Developer & Digital Operations President';
  if (role === 'vice_president') return 'Vice President';
  if (role === 'secretary') return 'Secretary';
  return role.replace(/_/g, ' ').toUpperCase();
};

const LeaderCard = ({ lead, tier, color = 'cyan', constName = '' }) => {
  const styles = {
    cyan: {
      wrap: 'bg-slate-50/60 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800 hover:border-cyan-500/30',
      bar: 'bg-cyan-500',
      img: 'ring-2 ring-cyan-500/30',
      name: 'text-slate-900 dark:text-white',
      role: 'text-cyan-600 dark:text-cyan-400',
    },
    emerald: {
      wrap: 'bg-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/40',
      bar: 'bg-emerald-500',
      img: 'ring-2 ring-emerald-500/30',
      name: 'text-slate-900 dark:text-white',
      role: 'text-emerald-600 dark:text-emerald-400',
    },
    violet: {
      wrap: 'bg-violet-500/5 border border-violet-500/20 hover:border-violet-500/40',
      bar: 'bg-violet-500',
      img: 'ring-2 ring-violet-500/30',
      name: 'text-slate-900 dark:text-white',
      role: 'text-violet-600 dark:text-violet-400',
    },
  };
  const s = styles[color] || styles.cyan;

  return (
    <div className={`flex items-stretch gap-0 rounded-2xl overflow-hidden transition-all duration-200 animate-fadeIn ${s.wrap}`}>
      {/* Colored left accent bar */}
      <div className={`w-1 shrink-0 ${s.bar}`} />

      {/* Photo */}
      <div className="w-16 h-16 shrink-0 m-3">
        <img
          src={lead.profile_image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256'}
          alt={lead.full_name}
          className={`w-full h-full rounded-xl object-cover object-top ${s.img}`}
        />
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-center gap-0.5 py-3 pr-4 min-w-0">
        <span className={`font-black text-xs leading-tight truncate ${s.name}`}>
          {lead.full_name}
        </span>
        <span className={`text-[9px] font-black uppercase tracking-wider ${s.role}`}>
          {formatRole(lead.role, tier)}{constName && tier !== 'hub' && tier !== 'state' ? ` — ${constName}` : ''}
        </span>
        {lead.phone && (
          <span className="text-[9px] text-slate-400 font-mono mt-0.5 truncate flex items-center gap-1">
            📞 {lead.phone}
          </span>
        )}
      </div>
    </div>
  );
};

const TierSection = ({ pulse, title, children, empty }) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-900/60 pb-2">
      <span className={`w-2 h-2 rounded-full animate-pulse ${pulse}`} />
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</h3>
    </div>
    <div className="flex flex-col gap-3">
      {empty ? (
        <div className="flex flex-col items-center justify-center py-6 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 text-center gap-2 min-h-[100px]">
          <Users className="w-7 h-7 text-slate-400 stroke-[1.5]" />
          <span className="font-bold text-xs text-slate-500 block">No officers assigned yet</span>
          <span className="text-[9.5px] text-slate-400 block">Board assignments pending for this area.</span>
        </div>
      ) : children}
    </div>
  </div>
);

// High-fidelity Realistic Telangana Map Boundary Paths
const TELANGANA_DISTRICTS = [
  { id: 'gh', name: 'Greater Hyderabad', active: true, path: 'M 255 230 C 295 220, 315 220, 345 230 C 365 260, 345 290, 315 305 C 275 290, 245 270, 255 230 Z', centerX: 298, centerY: 260 },
  { id: 'adilabad', name: 'Adilabad', active: false, path: 'M 190 60 C 230 40, 330 40, 370 70 C 350 90, 300 110, 240 100 C 200 95, 170 80, 190 60 Z', centerX: 280, centerY: 70 },
  { id: 'nizamabad', name: 'Nizamabad', active: false, path: 'M 140 130 C 180 110, 220 110, 245 125 C 255 155, 235 185, 210 200 C 160 210, 130 180, 140 130 Z', centerX: 185, centerY: 155 },
  { id: 'karimnagar', name: 'Karimnagar', active: false, path: 'M 290 125 C 330 105, 380 115, 410 135 C 390 175, 360 205, 320 200 C 290 185, 275 155, 290 125 Z', centerX: 350, centerY: 155 },
  { id: 'medak', name: 'Medak', active: false, path: 'M 125 215 C 165 200, 215 205, 245 220 C 240 250, 210 280, 175 285 C 135 270, 115 240, 125 215 Z', centerX: 180, centerY: 245 },
  { id: 'warangal', name: 'Warangal', active: false, path: 'M 355 215 C 395 200, 445 205, 475 235 C 445 275, 415 295, 365 275 C 335 260, 335 235, 355 215 Z', centerX: 415, centerY: 245 },
  { id: 'khammam', name: 'Khammam', active: false, path: 'M 425 295 C 465 275, 515 290, 535 325 C 505 385, 465 415, 415 395 C 395 365, 395 330, 425 295 Z', centerX: 475, centerY: 345 },
  { id: 'nalgonda', name: 'Nalgonda', active: false, path: 'M 285 315 C 325 305, 375 310, 395 325 C 405 375, 365 415, 325 425 C 285 405, 275 365, 285 315 Z', centerX: 340, centerY: 365 },
  { id: 'mahabubnagar', name: 'Mahabubnagar', active: false, path: 'M 135 295 C 185 290, 235 305, 245 320 C 255 365, 215 410, 175 415 C 125 395, 115 340, 135 295 Z', centerX: 185, centerY: 350 }
];

// High-fidelity Realistic Greater Hyderabad Assembly Constituency Paths
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

export default function Districts() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [search, setSearch] = useState('');
  const [constituencyList, setConstituencyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leadersData, setLeadersData] = useState({ statewideLeaders: [], mainHubLeaders: [], localLeaders: [] });
  const [selectedConstituency, setSelectedConstituency] = useState(null);

  // Map Navigation and 3D Perspective States
  const [mapLevel, setMapLevel] = useState('state'); // 'state' | 'gh'
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [tiltStyle, setTiltStyle] = useState({});
  const mapContainerRef = useRef(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dirRes, leadRes] = await Promise.all([
          fetch('/api/constituencies/directory'),
          fetch('/api/constituencies/leaders-grid')
        ]);
        const dirData = await dirRes.json();
        const leadData = await leadRes.json();

        if (dirData.success) {
          setConstituencyList(dirData.directory);

          const studentCon = dirData.directory.find(c => c.id === userProfile?.constituency_id);
          if (studentCon) {
            setSelectedConstituency(studentCon);
          } else if (dirData.directory.length > 0) {
            const defaultCon = dirData.directory.find(c =>
              c.constituency_name.toLowerCase().includes('nampally')
            ) || dirData.directory[0];
            setSelectedConstituency(defaultCon);
          }
        }

        if (leadData.success) {
          setLeadersData({
            statewideLeaders: leadData.statewideLeaders || [],
            mainHubLeaders: leadData.mainHubLeaders || [],
            localLeaders: leadData.localLeaders || []
          });
        }
      } catch (err) {
        console.error('Failed to load districts data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [userProfile]);

  const filteredConstituencies = constituencyList.filter(c =>
    c.constituency_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.coordinator_name || '').toLowerCase().includes(search.toLowerCase()) ||
    c.district.toLowerCase().includes(search.toLowerCase())
  );

  const activeLocalLeaders = selectedConstituency
    ? leadersData.localLeaders.filter(l => l.constituency_id === selectedConstituency.id)
    : [];

  const handleMapRegionClick = (name) => {
    const matched = constituencyList.find(c =>
      c.constituency_name.toLowerCase().includes(name.toLowerCase())
    );
    if (matched) {
      setSelectedConstituency(matched);
      const element = document.getElementById(`constituency-card-${matched.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const getRegionStats = (name) => {
    const matched = constituencyList.find(c =>
      c.constituency_name.toLowerCase().includes(name.toLowerCase())
    );
    if (matched) {
      const resolvedCount = matched.resolved_tickets || 0;
      const totalTickets = (matched.active_tickets || 0) + resolvedCount;
      const safetyRatio = totalTickets > 0 ? ((resolvedCount / totalTickets) * 100).toFixed(0) : '100';
      return {
        active: matched.active_tickets || 0,
        resolved: resolvedCount,
        safety: safetyRatio,
        colleges: matched.college_count || 0,
        coordinator: matched.coordinator_name || 'Vacant'
      };
    }
    return { active: 0, resolved: 0, safety: 100, colleges: 0, coordinator: 'Vacant' };
  };

  // 3D Perspective Mouse Tilt Calculations
  const handleMapMouseMove = (e) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Normalize coordinates (-0.5 to 0.5)
    const normX = (x / rect.width) - 0.5;
    const normY = (y / rect.height) - 0.5;
    
    // Rotate max 12 degrees for premium holographic effect
    const rotX = -normY * 15;
    const rotY = normX * 15;
    
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.1s ease-out'
    });

    setTooltipPos({
      x: e.clientX - rect.left + 15,
      y: e.clientY - rect.top + 15
    });
  };

  const handleMapMouseLeave = () => {
    setHoveredRegion(null);
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s ease-out'
    });
  };

  const selectedStats = selectedConstituency ? getRegionStats(selectedConstituency.constituency_name) : null;

  return (
    <div className="w-full flex flex-col gap-12 py-4 animate-fadeIn">

      {/* Header Banner */}
      <AnimatedSection direction="up" className="text-center max-w-3xl mx-auto flex flex-col gap-4">
        <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 tracking-widest uppercase flex items-center justify-center gap-1.5">
          <MapPin className="w-4 h-4" /> REGIONAL HOLOGRAPHIC COMMAND MAP
        </span>
        <h1 className="fluid-heading-2 font-black text-slate-850 dark:text-white leading-tight">
          Regional Command Hubs
        </h1>
        <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
          Hover over the map to view safety stats, or click to analyze active district councils and leadership grids.
        </p>
      </AnimatedSection>

      {/* Interactive Map Visual Section */}
      <AnimatedSection direction="up" delay={0.05}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Map Viewer Panel with 3D perspective styling */}
          <GlassCard 
            className="lg:col-span-2 p-5 border border-slate-200/50 dark:border-slate-900/60 relative overflow-hidden flex flex-col min-h-[500px]"
            style={{ perspective: '1000px' }}
          >
            {/* Visual Header / Grid Status */}
            <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-slate-800/60 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse shadow-glow-cyan" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {mapLevel === 'state' ? 'Telangana State System Area' : 'Greater Hyderabad Hub Area'}
                </span>
              </div>
              {mapLevel === 'gh' && (
                <button
                  onClick={() => setMapLevel('state')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase border border-cyan-500/20 bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500 hover:text-white transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Back to State Map
                </button>
              )}
            </div>

            {/* Map Container Viewport */}
            <div 
              ref={mapContainerRef}
              onMouseMove={handleMapMouseMove}
              onMouseLeave={handleMapMouseLeave}
              style={tiltStyle}
              className="flex-1 w-full relative flex items-center justify-center min-h-[380px] bg-slate-950/20 dark:bg-slate-950/40 rounded-2xl border border-slate-200/20 dark:border-slate-900/50 shadow-inner overflow-hidden cursor-crosshair"
            >
              {/* Background HUD tech lines */}
              <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-30">
                <div className="absolute top-1/4 left-0 w-full h-[1px] bg-cyan-500/40 border-dashed" />
                <div className="absolute top-2/4 left-0 w-full h-[1px] bg-cyan-500/40 border-dashed" />
                <div className="absolute top-3/4 left-0 w-full h-[1px] bg-cyan-500/40 border-dashed" />
                <div className="absolute left-1/4 top-0 h-full w-[1px] bg-cyan-500/40 border-dashed" />
                <div className="absolute left-2/4 top-0 h-full w-[1px] bg-cyan-500/40 border-dashed" />
                <div className="absolute left-3/4 top-0 h-full w-[1px] bg-cyan-500/40 border-dashed" />
              </div>

              {mapLevel === 'state' ? (
                // 1. Realistic Telangana State Map
                <svg viewBox="0 0 600 500" className="w-full max-w-[500px] h-auto select-none transition-all duration-500 transform scale-100 drop-shadow-[0_15px_30px_rgba(6,182,212,0.15)]">
                  <g fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {TELANGANA_DISTRICTS.map((dist) => {
                      if (dist.id === 'gh') {
                        // Active clickable area
                        return (
                          <g key={dist.id}>
                            <path
                              d={dist.path}
                              onClick={() => {
                                setMapLevel('gh');
                                setHoveredRegion(null);
                              }}
                              onMouseEnter={() => setHoveredRegion({ id: 'gh', name: 'Greater Hyderabad', active: true })}
                              onMouseLeave={() => setHoveredRegion(null)}
                              className="fill-cyan-500/10 stroke-cyan-500 hover:fill-cyan-500/25 hover:stroke-cyan-400 transition-all duration-350 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                              style={{ filter: 'drop-shadow(0 0 5px rgba(6,182,212,0.4))' }}
                            />
                            {/* Pulse beacons */}
                            <circle cx={dist.centerX} cy={dist.centerY} r="6" className="fill-cyan-400 shadow-glow-cyan animate-pulse" />
                            <circle cx={dist.centerX} cy={dist.centerY} r="14" className="stroke-cyan-500/50 fill-none animate-ping" style={{ animationDuration: '2.5s' }} />
                            <text x={dist.centerX} y={dist.centerY - 18} textAnchor="middle" className="fill-cyan-400 font-black text-[9px] tracking-wider uppercase font-sans select-none">
                              GH HUB (ACTIVE)
                            </text>
                          </g>
                        );
                      } else {
                        // Locked "Coming Soon" districts with realistic curves
                        return (
                          <path
                            key={dist.id}
                            d={dist.path}
                            onMouseEnter={() => setHoveredRegion({ id: dist.id, name: dist.name, active: false })}
                            onMouseLeave={() => setHoveredRegion(null)}
                            className="fill-slate-800/5 stroke-slate-700/40 hover:fill-slate-800/15 hover:stroke-slate-600/60 transition-all duration-300 cursor-not-allowed"
                            strokeDasharray="4 4"
                          />
                        );
                      }
                    })}
                  </g>
                </svg>
              ) : (
                // 2. Realistic Greater Hyderabad Constituency Sub-Map
                <svg viewBox="0 0 500 500" className="w-full max-w-[420px] h-auto select-none transition-all duration-500 animate-scaleUp drop-shadow-[0_15px_30px_rgba(6,182,212,0.25)]">
                  <g fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    {GH_CONSTITUENCIES.map((con) => {
                      const isSelected = selectedConstituency?.constituency_name.toLowerCase().includes(con.name.toLowerCase());
                      const stats = getRegionStats(con.name);
                      
                      return (
                        <path
                          key={con.id}
                          d={con.path}
                          onClick={() => handleMapRegionClick(con.name)}
                          onMouseEnter={() => setHoveredRegion({ id: con.id, name: con.name, active: true, safety: stats.safety, tickets: stats.active })}
                          onMouseLeave={() => setHoveredRegion(null)}
                          className={`cursor-pointer transition-all duration-300
                            ${isSelected 
                              ? 'fill-cyan-500/25 stroke-cyan-400 shadow-glow-cyan' 
                              : 'fill-cyan-500/5 stroke-cyan-500/45 hover:fill-cyan-500/15 hover:stroke-cyan-300'}`}
                          style={isSelected ? { filter: 'drop-shadow(0 0 6px rgba(6,182,212,0.45))' } : undefined}
                        />
                      );
                    })}
                  </g>
                </svg>
              )}

              {/* Floating Map Tooltip */}
              {hoveredRegion && (
                <div 
                  className="absolute p-3 rounded-xl border border-slate-700/40 bg-slate-900/95 text-left pointer-events-none z-40 shadow-premium-dark font-sans animate-fadeIn max-w-[200px]"
                  style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
                >
                  <div className="flex items-center gap-1.5">
                    {hoveredRegion.active ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    ) : (
                      <Lock className="w-3 h-3 text-slate-500" />
                    )}
                    <span className="text-xs font-black text-white uppercase tracking-wider">{hoveredRegion.name}</span>
                  </div>
                  {hoveredRegion.active ? (
                    <div className="flex flex-col gap-1 mt-2 text-[10px] text-slate-300 font-medium">
                      {hoveredRegion.id === 'gh' ? (
                        <span className="text-cyan-400 font-extrabold uppercase">Click to zoom into hub</span>
                      ) : (
                        <>
                          <span className="text-green-400 font-bold">Safety Index: {hoveredRegion.safety || getRegionStats(hoveredRegion.name).safety}%</span>
                          <span className="text-rose-400 font-bold">Active cases: {hoveredRegion.tickets ?? getRegionStats(hoveredRegion.name).active}</span>
                          <span className="text-[9px] text-slate-400 italic mt-0.5">Click boundary to filter</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500 block mt-1.5 font-bold uppercase tracking-wider">Coming Soon</span>
                  )}
                </div>
              )}
            </div>
          </GlassCard>

          {/* Map Side HUD Panel (Holographic Stats Display) */}
          <GlassCard className="p-5 border border-slate-200/50 dark:border-slate-900/60 flex flex-col justify-between text-left relative overflow-hidden bg-slate-950/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl pointer-events-none" />
            
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 tracking-widest uppercase block mb-1">
                SYSTEM HUB HUD
              </span>

              {selectedConstituency ? (
                <div className="flex flex-col gap-5 animate-scaleUp">
                  {/* Title Area */}
                  <div>
                    <h3 className="text-xl font-black text-slate-850 dark:text-white uppercase leading-tight flex items-center gap-1.5">
                      <MapPin className="w-5 h-5 text-cyan-500 shrink-0" />
                      {selectedConstituency.constituency_name}
                    </h3>
                    <span className="text-xs text-slate-400 mt-1 block">
                      Constituency Hub — District: {selectedConstituency.district}
                    </span>
                  </div>

                  {/* Safety Ratio dial bar */}
                  <div className="p-4 rounded-2xl bg-white/40 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-450 uppercase">Safety Rating index</span>
                      <span className="text-xs font-black text-green-500">{selectedStats?.safety}% Secure</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-green-500 transition-all duration-1000"
                        style={{ width: `${selectedStats?.safety || 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Mapped stats grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/30 dark:border-slate-800/80 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-cyan-500" />
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 uppercase font-bold">Colleges</span>
                        <span className="text-xs font-black text-slate-850 dark:text-white">{selectedStats?.colleges}</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/30 dark:border-slate-800/80 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 uppercase font-bold">Active Cases</span>
                        <span className="text-xs font-black text-slate-850 dark:text-white">{selectedStats?.active}</span>
                      </div>
                    </div>
                  </div>

                  {/* Mapped Coordinator Box */}
                  <div className="p-4 rounded-xl border border-slate-200/50 dark:border-slate-850 bg-white/20 dark:bg-slate-900/20">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Chief Lead Coordinator</span>
                    <span className="text-xs font-black text-slate-850 dark:text-white block">{selectedStats?.coordinator}</span>
                    <span className="text-[10px] text-cyan-500 font-extrabold uppercase mt-0.5 block">
                      {selectedConstituency.coordinator_role ? selectedConstituency.coordinator_role.replace(/_/g, ' ') : 'Pending Board Assignment'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs text-center">
                  <Info className="w-8 h-8 text-slate-500 mb-2 opacity-50" />
                  Select an active constituency on the map to display system analytics.
                </div>
              )}
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="flex flex-col gap-2.5 mt-6 border-t border-slate-200/50 dark:border-slate-800/60 pt-4 shrink-0">
              <PremiumButton
                onClick={() => navigate('/contact')}
                variant="primary"
                size="sm"
                className="w-full flex items-center justify-center gap-1 text-[10px] font-extrabold uppercase py-2.5"
              >
                Lodge Grievance in this Hub <ArrowRight className="w-3 h-3" />
              </PremiumButton>
            </div>
          </GlassCard>

        </div>
      </AnimatedSection>

      {/* 3-Tier Command Board */}
      <AnimatedSection direction="up" delay={0.1}>
        <GlassCard className="p-6 md:p-8 border border-slate-200/50 dark:border-slate-900/60 flex flex-col gap-6 text-left">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200/40 dark:border-slate-800/60 pb-6">
            <div>
              <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 tracking-widest uppercase block mb-1">
                LIVE 3-TIER COMMAND BOARD
              </span>
              <h2 className="text-xl md:text-2xl font-black text-slate-850 dark:text-white flex items-center gap-2">
                <Shield className="w-6 h-6 text-cyan-500" />
                Constituency Governance Council
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Viewing command chain for <strong className="text-cyan-500">{selectedConstituency?.constituency_name || '...'}</strong>
              </p>
            </div>
            <div className="w-full md:w-64 text-left">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Select Constituency
              </label>
              <select
                value={selectedConstituency?.id || ''}
                onChange={e => {
                  const sel = constituencyList.find(c => c.id === parseInt(e.target.value));
                  if (sel) setSelectedConstituency(sel);
                }}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-950/85 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-bold cursor-pointer"
              >
                {constituencyList.map(c => (
                  <option key={c.id} value={c.id}>{c.constituency_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tier 1: State */}
            <TierSection
              pulse="bg-cyan-500 shadow-glow-cyan"
              title="Tier 1 — State Command"
              empty={leadersData.statewideLeaders.length === 0}
            >
              {leadersData.statewideLeaders.map(lead => (
                <LeaderCard key={lead.id} lead={lead} tier="state" color="cyan" />
              ))}
            </TierSection>

            {/* Tier 2: Greater Hyderabad Hub */}
            <TierSection
              pulse="bg-emerald-500"
              title="Tier 2 — Greater Hyderabad Hub"
              empty={leadersData.mainHubLeaders.length === 0}
            >
              {leadersData.mainHubLeaders.map(lead => (
                <LeaderCard key={lead.id} lead={lead} tier="hub" color="emerald" constName={lead.constituency_name} />
              ))}
            </TierSection>

            {/* Tier 3: Local Sub-constituency */}
            <TierSection
              pulse="bg-violet-500"
              title={`Tier 3 — ${selectedConstituency?.constituency_name || 'Local'} Officers`}
              empty={activeLocalLeaders.length === 0}
            >
              {activeLocalLeaders.map(lead => (
                <LeaderCard key={lead.id} lead={lead} tier="local" color="violet" constName={selectedConstituency?.constituency_name} />
              ))}
            </TierSection>
          </div>
        </GlassCard>
      </AnimatedSection>

      {/* Constituency Directory Grid */}
      <section className="w-full flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="text-left">
            <h3 className="font-extrabold text-xl text-slate-850 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-500" />
              Hyderabad Constituency Directory
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {filteredConstituencies.length} active regional student commands
            </p>
          </div>
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search constituency, district or leader..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-medium"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">
            Syncing constituency commands from Neon DB...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full text-left">
            {filteredConstituencies.length > 0 ? filteredConstituencies.map(dist => {
              const leadName = dist.coordinator_name || 'Vacant Coordinate';
              let leadRoleLabel = 'Board Assignment Pending';
              if (dist.coordinator_role) {
                if (dist.coordinator_role === 'supreme_admin') leadRoleLabel = 'TRSV Founder';
                else if (dist.coordinator_role === 'president' || dist.coordinator_role === 'state_president') leadRoleLabel = 'State President';
                else if (dist.coordinator_role === 'general_secretary') leadRoleLabel = 'General Secretary';
                else leadRoleLabel = dist.coordinator_role.replace(/_/g, ' ').toUpperCase();
                leadRoleLabel = `${leadRoleLabel} — ${dist.constituency_name}`;
              }
              const resolvedCount = dist.resolved_tickets || 0;
              const totalTickets = (dist.active_tickets || 0) + resolvedCount;
              const safetyRatio = totalTickets > 0 ? ((resolvedCount / totalTickets) * 100).toFixed(1) : '100.0';

              return (
                <GlassCard
                  key={dist.id}
                  id={`constituency-card-${dist.id}`}
                  hoverEffect={true}
                  className={`p-6 flex flex-col justify-between gap-6 border cursor-pointer transition-all duration-200
                    ${selectedConstituency?.id === dist.id
                      ? 'border-cyan-500/40 bg-cyan-500/5 dark:bg-cyan-500/5'
                      : 'border-slate-200/40 dark:border-slate-850'}`}
                  onClick={() => setSelectedConstituency(dist)}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <MapPin className={`w-5 h-5 shrink-0 ${selectedConstituency?.id === dist.id ? 'text-cyan-400' : 'text-cyan-500'}`} />
                        <span className="font-extrabold text-base sm:text-lg text-slate-800 dark:text-white truncate">
                          {dist.constituency_name}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 shrink-0">
                        {safetyRatio}% Secure
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block -mt-2">
                      District: {dist.district}
                    </span>
                    <div className="h-[1px] bg-slate-250/50 dark:bg-slate-800/80 my-1" />
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>Colleges: <strong className="text-slate-700 dark:text-white">{dist.college_count}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                        <span>Active: <strong className="text-slate-700 dark:text-white">{dist.active_tickets}</strong></span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mt-2">
                      Chief Lead: <strong className="text-slate-700 dark:text-slate-350">{leadName}</strong>
                      <span className="block text-[10px] text-cyan-555 font-bold mt-0.5">{leadRoleLabel}</span>
                    </p>
                  </div>
                  <div className="flex items-center justify-end border-t border-slate-200/50 dark:border-slate-800/80 pt-4 text-xs">
                    <span className="text-[10px] font-extrabold text-green-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {resolvedCount} Resolved
                    </span>
                  </div>
                </GlassCard>
              );
            }) : (
              <div className="col-span-full py-12 text-center text-slate-450">
                No matching constituencies found.
              </div>
            )}
          </div>
        )}
      </section>

    </div>
  );
}
