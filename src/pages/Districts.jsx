import React, { useState, useEffect } from 'react';
import { MapPin, Search, Users, ShieldAlert, CheckCircle2, Shield, Building2, ChevronLeft, Lock, Info, ArrowRight, Phone } from 'lucide-react';
import AnimatedSection from '../components/AnimatedSection';
import { useAuth } from '../context/AuthContext';
import PremiumButton from '../components/PremiumButton';
import { useNavigate } from 'react-router-dom';
import ThreeTelanganaMap from '../components/ThreeTelanganaMap';

const formatRole = (role, tier) => {
  if (role === 'supreme_admin') return 'TVRS Founder';
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
      wrap: 'bg-slate-50/60 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800 hover:border-blue-500/30',
      bar: 'bg-blue-600',
      img: 'ring-2 ring-blue-500/30',
      name: 'text-slate-900 dark:text-white',
      role: 'text-blue-600 dark:text-blue-400',
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
        <span className={`font-semibold text-xs leading-tight truncate ${s.name}`}>
          {lead.full_name}
        </span>
        <span className={`text-[9px] font-semibold uppercase tracking-wider ${s.role}`}>
          {formatRole(lead.role, tier)}{constName && tier !== 'hub' && tier !== 'state' ? ` — ${constName}` : ''}
        </span>
        {lead.phone && (
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wider font-mono mt-1 flex items-center gap-1.5">
            <Phone className={`w-3 h-3 ${s.role}`} />
            {lead.phone === '99999999' || lead.phone.toLowerCase() === 'revealing soon' ? 'REVEALING SOON' : lead.phone}
          </span>
        )}
      </div>
    </div>
  );
};

const TierSection = ({ pulse, title, children, empty }) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
      <span className={`w-2 h-2 rounded-full animate-pulse ${pulse}`} />
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</h3>
    </div>
    <div className="flex flex-col gap-3">
      {empty ? (
        <div className="flex flex-col items-center justify-center py-6 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955 text-center gap-2 min-h-[100px]">
          <Users className="w-7 h-7 text-slate-400 stroke-[1.5]" />
          <span className="font-semibold text-xs text-slate-500 block">No officers assigned yet</span>
          <span className="text-[9.5px] text-slate-400 block font-medium">Board assignments pending for this area.</span>
        </div>
      ) : children}
    </div>
  </div>
);

export default function Districts() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [search, setSearch] = useState('');
  const [constituencyList, setConstituencyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leadersData, setLeadersData] = useState({ statewideLeaders: [], mainHubLeaders: [], localLeaders: [] });
  const [selectedConstituency, setSelectedConstituency] = useState(null);

  // Map States
  const [mapLevel, setMapLevel] = useState('state'); // 'state' | 'gh'
  const [hoveredRegion, setHoveredRegion] = useState(null);

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

  const selectedStats = selectedConstituency ? getRegionStats(selectedConstituency.constituency_name) : null;

  return (
    <div className="w-full flex flex-col gap-12 py-4 animate-fadeIn">

      {/* Header Banner */}
      <AnimatedSection direction="up" className="text-center max-w-3xl mx-auto flex flex-col gap-4">
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-wider uppercase flex items-center justify-center gap-1.5">
          <MapPin className="w-4 h-4" /> REGIONAL HOLOGRAPHIC COMMAND MAP
        </span>
        <h1 className="fluid-heading-2 font-bold text-slate-900 dark:text-white leading-tight">
          Regional Command Hubs
        </h1>
        <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
          Hover and interact with the WebGL 3D map to view regional metrics, or drill down into Greater Hyderabad assembly constituencies.
        </p>
      </AnimatedSection>

      {/* Interactive Map Visual Section */}
      <AnimatedSection direction="up" delay={0.05}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* WebGL 3D Map Viewport Panel */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs relative overflow-hidden flex flex-col min-h-[500px]">
            {/* Map UI Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4 shrink-0 z-10">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {mapLevel === 'state' ? '3D WebGL Telangana Command Center' : '3D WebGL Greater Hyderabad Hub'}
                </span>
              </div>
              {mapLevel === 'gh' && (
                <button
                  onClick={() => setMapLevel('state')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-semibold uppercase border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer z-20"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Back to State Map
                </button>
              )}
            </div>

            {/* Three.js Container Canvas */}
            <div className="w-full h-[450px] relative bg-slate-950/20 dark:bg-slate-950/40 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-inner overflow-hidden">
              <ThreeTelanganaMap
                mapLevel={mapLevel}
                setMapLevel={setMapLevel}
                selectedConstituency={selectedConstituency}
                setSelectedConstituency={setSelectedConstituency}
                constituencyList={constituencyList}
                onHoverRegion={setHoveredRegion}
              />

              {/* Holographic Mouse Tooltip Overlay */}
              {hoveredRegion && (
                <div 
                  className="absolute p-3 rounded-xl border border-slate-700/40 bg-slate-900/95 text-left pointer-events-none z-45 font-sans animate-fadeIn max-w-[210px]"
                  style={{ left: `${hoveredRegion.x + 15}px`, top: `${hoveredRegion.y + 15}px` }}
                >
                  <div className="flex items-center gap-1.5">
                    {hoveredRegion.active ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    ) : (
                      <Lock className="w-3 h-3 text-slate-500" />
                    )}
                    <span className="text-xs font-semibold text-white uppercase tracking-wider">{hoveredRegion.name}</span>
                  </div>
                  {hoveredRegion.active ? (
                    <div className="flex flex-col gap-1 mt-2 text-[10px] text-slate-350 font-medium">
                      {hoveredRegion.id === 'gh' ? (
                        <span className="text-blue-400 font-semibold uppercase animate-pulse">Click district to zoom</span>
                      ) : (
                        <>
                          <span className="text-emerald-400 font-semibold">Safety Index: {getRegionStats(hoveredRegion.name).safety}%</span>
                          <span className="text-rose-400 font-semibold">Active cases: {getRegionStats(hoveredRegion.name).active}</span>
                          <span className="text-[9px] text-slate-400 italic mt-0.5">Click boundary to filter</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500 block mt-1.5 font-semibold uppercase tracking-wider">🔒 Locked (Phase 2)</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Map Side HUD Panel (Holographic Stats Display) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between text-left relative overflow-hidden">
            
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 tracking-wider uppercase block mb-1">
                SYSTEM HUB HUD
              </span>

              {selectedConstituency ? (
                <div className="flex flex-col gap-5 animate-scaleUp">
                  {/* Title Area */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase leading-tight flex items-center gap-1.5">
                      <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                      {selectedConstituency.constituency_name}
                    </h3>
                    <span className="text-xs text-slate-400 mt-1 block font-medium">
                      Constituency Hub — District: {selectedConstituency.district}
                    </span>
                  </div>

                  {/* Safety Ratio dial bar */}
                  <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-955 border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Safety Rating index</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{selectedStats?.safety}% Secure</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-1000"
                        style={{ width: `${selectedStats?.safety || 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Mapped stats grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-955 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 uppercase font-semibold">Colleges</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{selectedStats?.colleges}</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-955 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 uppercase font-semibold">Active Cases</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{selectedStats?.active}</span>
                      </div>
                    </div>
                  </div>

                  {/* Mapped Coordinator Box */}
                  <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Chief Lead Coordinator</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">{selectedStats?.coordinator}</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase mt-0.5 block">
                      {selectedConstituency.coordinator_role ? selectedConstituency.coordinator_role.replace(/_/g, ' ') : 'Pending Board Assignment'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs text-center font-medium">
                  <Info className="w-8 h-8 text-slate-400 mb-2 opacity-50" />
                  Select an active constituency on the map to display system analytics.
                </div>
              )}
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="flex flex-col gap-2.5 mt-6 border-t border-slate-100 dark:border-slate-800/80 pt-4 shrink-0">
              <PremiumButton
                onClick={() => navigate('/contact')}
                variant="primary"
                size="sm"
                className="w-full flex items-center justify-center gap-1 text-[10px] font-semibold uppercase py-2.5"
              >
                Get Help <ArrowRight className="w-3 h-3" />
              </PremiumButton>
            </div>
          </div>

        </div>
      </AnimatedSection>

      {/* 3-Tier Command Board */}
      <AnimatedSection direction="up" delay={0.1}>
        <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col gap-6 text-left">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-6">
            <div>
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 tracking-wider uppercase block mb-1">
                LIVE 3-TIER COMMAND BOARD
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                Constituency Governance Council
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Viewing command chain for <strong className="text-blue-600 dark:text-blue-400">{selectedConstituency?.constituency_name || '...'}</strong>
              </p>
            </div>
            <div className="w-full md:w-64 text-left">
              <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Select Constituency
              </label>
              <select
                value={selectedConstituency?.id || ''}
                onChange={e => {
                  const sel = constituencyList.find(c => c.id === parseInt(e.target.value));
                  if (sel) setSelectedConstituency(sel);
                }}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50/50 dark:bg-slate-955 text-sm focus:outline-none focus:border-blue-600 border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer"
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
              pulse="bg-blue-600"
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
        </div>
      </AnimatedSection>

      {/* Constituency Directory Grid */}
      <section className="w-full flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="text-left">
            <h3 className="font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Hyderabad Constituency Directory
            </h3>
            <p className="text-xs font-medium text-slate-400 mt-1">
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
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-50/50 dark:bg-slate-955 text-sm focus:outline-none focus:border-blue-600 border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white font-medium"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm font-medium text-slate-400">
            Syncing constituency commands from Neon DB...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full text-left">
            {filteredConstituencies.length > 0 ? filteredConstituencies.map(dist => {
              const leadName = dist.coordinator_name || 'Vacant Coordinate';
              let leadRoleLabel = 'Board Assignment Pending';
              if (dist.coordinator_role) {
                if (dist.coordinator_role === 'supreme_admin') leadRoleLabel = 'TVRS Founder';
                else if (dist.coordinator_role === 'president' || dist.coordinator_role === 'state_president') leadRoleLabel = 'State President';
                else if (dist.coordinator_role === 'general_secretary') leadRoleLabel = 'General Secretary';
                else leadRoleLabel = dist.coordinator_role.replace(/_/g, ' ').toUpperCase();
                leadRoleLabel = `${leadRoleLabel} — ${dist.constituency_name}`;
              }
              const resolvedCount = dist.resolved_tickets || 0;
              const totalTickets = (dist.active_tickets || 0) + resolvedCount;
              const safetyRatio = totalTickets > 0 ? ((resolvedCount / totalTickets) * 100).toFixed(1) : '100.0';

              return (
                <div
                  key={dist.id}
                  id={`constituency-card-${dist.id}`}
                  className={`p-6 flex flex-col justify-between gap-6 rounded-2xl bg-white dark:bg-slate-900 border shadow-xs cursor-pointer transition-all duration-200
                    ${selectedConstituency?.id === dist.id
                      ? 'border-blue-500/60 dark:border-blue-500/60 ring-2 ring-blue-500/20'
                      : 'border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'}`}
                  onClick={() => setSelectedConstituency(dist)}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <MapPin className={`w-5 h-5 shrink-0 ${selectedConstituency?.id === dist.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                        <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                          {dist.constituency_name}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 shrink-0">
                        {safetyRatio}% Secure
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block -mt-2 font-medium">
                      District: {dist.district}
                    </span>
                    <div className="h-[1px] bg-slate-100 dark:bg-slate-800/80 my-1" />
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>Colleges: <strong className="text-slate-900 dark:text-white">{dist.college_count}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                        <ShieldAlert className="w-4 h-4 text-rose-500" />
                        <span>Active: <strong className="text-slate-900 dark:text-white">{dist.active_tickets}</strong></span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2 font-medium">
                      Chief Lead: <strong className="text-slate-800 dark:text-slate-200">{leadName}</strong>
                      <span className="block text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">{leadRoleLabel}</span>
                    </p>
                  </div>
                  <div className="flex items-center justify-end border-t border-slate-100 dark:border-slate-800/80 pt-4 text-xs">
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {resolvedCount} Resolved
                    </span>
                  </div>
                </div>
              );
            }) : (
              <div className="col-span-full py-12 text-center text-slate-400 font-medium">
                No matching constituencies found.
              </div>
            )}
          </div>
        )}
      </section>

    </div>
  );
}
