import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Users, FileText, Megaphone, Calendar, Network, ShieldAlert, Server, Globe,
  ChevronRight, Command, Cpu, Activity, Shield, Settings2, PanelLeft, X,
  LayoutDashboard, Zap, Search
} from 'lucide-react';
import devModules from '../modules/index.js';

// Icon resolver
const iconMap = {
  Users, FileText, Megaphone, Calendar, Network, ShieldAlert, Server, Globe,
  Cpu, Activity, Shield, Settings2, Zap, LayoutDashboard
};
const getIcon = (name) => iconMap[name] || Settings2;

const DevTools = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [localSearch, setLocalSearch] = useState('');

  const activeModuleId = searchParams.get('module') || (devModules[0]?.id ?? '');
  const activePanelId = searchParams.get('panel') || (devModules[0]?.panels?.[0]?.id ?? '');

  const activeModule = useMemo(() => devModules.find(m => m.id === activeModuleId), [activeModuleId]);
  const activePanel = useMemo(
    () => activeModule?.panels?.find(p => p.id === activePanelId) || activeModule?.panels?.[0],
    [activeModule, activePanelId]
  );

  // Guard: only supreme_admin and dev can access
  useEffect(() => {
    if (user && !['supreme_admin', 'dev'].includes(user?.role)) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const setActive = (moduleId, panelId) => {
    setSearchParams({ module: moduleId, panel: panelId });
  };

  const filteredModules = useMemo(() => {
    if (!localSearch.trim()) return devModules;
    const q = localSearch.toLowerCase();
    return devModules.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.panels?.some(p => p.name.toLowerCase().includes(q))
    );
  }, [localSearch]);

  const ActiveComponent = activePanel?.component;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">

      {/* ─── Sidebar ─── */}
      <aside
        className={`flex flex-col bg-slate-950 border-r border-slate-800/80 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        }`}
      >
        {/* Brand / Logo area */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-700 shadow-lg shadow-cyan-900/40">
            <Command className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 leading-none">TVRS Dev Tools</div>
            <div className="text-[9px] text-slate-500 mt-0.5">Supreme Admin Console</div>
          </div>
        </div>

        {/* Module Search */}
        <div className="px-3 pt-3 pb-2 shrink-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Filter modules..."
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 pl-8 pr-3 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-600"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
          </div>
        </div>

        {/* Module List */}
        <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          {filteredModules.map(mod => {
            const Icon = getIcon(mod.icon);
            const isModActive = activeModuleId === mod.id;

            return (
              <div key={mod.id}>
                {/* Module button */}
                <button
                  onClick={() => setActive(mod.id, mod.panels?.[0]?.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group ${
                    isModActive
                      ? 'bg-cyan-950/50 text-cyan-400 border border-cyan-800/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${isModActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span className="text-xs font-medium">{mod.name}</span>
                  {isModActive && <ChevronRight className="ml-auto w-3 h-3 text-cyan-600" />}
                </button>

                {/* Panel sub-items */}
                {isModActive && mod.panels?.length > 1 && (
                  <div className="ml-4 pl-3 border-l border-slate-800 mt-0.5 space-y-0.5">
                    {mod.panels.map(panel => (
                      <button
                        key={panel.id}
                        onClick={() => setActive(mod.id, panel.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                          activePanelId === panel.id
                            ? 'text-cyan-300 bg-cyan-950/30'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {panel.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer: User Chip */}
        <div className="border-t border-slate-800/80 px-3 py-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
              {user?.full_name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="overflow-hidden">
              <div className="text-[11px] font-bold text-slate-200 truncate">{user?.full_name}</div>
              <div className="text-[9px] text-cyan-500 font-mono truncate">{user?.role}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="flex items-center gap-3 px-5 py-3 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-sm shrink-0">
          <button
            onClick={() => setSidebarOpen(s => !s)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-slate-500 hover:text-slate-300 cursor-pointer" onClick={() => navigate('/dashboard')}>
              Dashboard
            </span>
            <ChevronRight className="w-3 h-3 text-slate-700" />
            <span className="text-slate-400">Dev Tools</span>
            {activeModule && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-700" />
                <span className="text-slate-200 font-medium">{activeModule.name}</span>
              </>
            )}
            {activePanel && activeModule?.panels?.length > 1 && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-700" />
                <span className="text-cyan-400">{activePanel.name}</span>
              </>
            )}
          </div>

          {/* Ctrl+K hint */}
          <div className="ml-auto flex items-center gap-1.5 text-[10px] text-slate-500 border border-slate-800 rounded-lg px-2.5 py-1.5 bg-slate-900/60">
            <Command className="w-3 h-3" />
            <span>K</span>
            <span className="ml-1 text-slate-600">Global Search</span>
          </div>
        </header>

        {/* Panel Content Area */}
        <main className="flex-1 overflow-y-auto p-5 md:p-7">
          {ActiveComponent ? (
            <Suspense fallback={
              <div className="flex items-center justify-center h-full gap-3 text-slate-500">
                <Activity className="w-5 h-5 animate-pulse" /> Loading panel...
              </div>
            }>
              <ActiveComponent />
            </Suspense>
          ) : (
            <DevToolsHome modules={devModules} onNavigate={setActive} />
          )}
        </main>
      </div>
    </div>
  );
};

// ─── Dev Tools Home / Overview ────────────────────────────────────────────────
const DevToolsHome = ({ modules, onNavigate }) => {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-100">
          TVRS Supreme Administration Console
        </h1>
        <p className="text-sm text-slate-400 max-w-xl">
          The central governance brain of TRSV. Manage statewide membership, dispatch official documents, monitor security intelligence, and configure the public portal — all from a single command plane.
        </p>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map(mod => {
          const Icon = getIcon(mod.icon);
          return (
            <button
              key={mod.id}
              onClick={() => onNavigate(mod.id, mod.panels?.[0]?.id)}
              className="group relative p-5 bg-slate-900/60 border border-slate-800/80 hover:border-cyan-800/60 rounded-xl text-left transition-all hover:bg-slate-900 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border border-cyan-800/30 group-hover:border-cyan-700/50 transition-colors">
                  <Icon className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-200">{mod.name}</div>
                  <div className="text-[10px] text-slate-500">{mod.panels?.length || 1} panel{(mod.panels?.length || 1) > 1 ? 's' : ''}</div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">{mod.description}</p>
              <div className="flex items-center gap-1 text-[10px] text-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Open <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DevTools;
