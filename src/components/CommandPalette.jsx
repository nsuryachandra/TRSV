import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command, ArrowRight, Users, FileText, Megaphone, Calendar, Network, ShieldAlert, Server, Globe, Home, MessageSquare, Bell, Map, ClipboardList, CreditCard, Zap, ChevronRight } from 'lucide-react';
import devModules from '../modules/index.js';
import { useOrg } from '../context/OrgContext';

// Icon resolver
const iconMap = {
  Users, FileText, Megaphone, Calendar, Network, ShieldAlert, Server, Globe,
  Home, MessageSquare, Bell, Map, ClipboardList, CreditCard, Zap
};

const getIcon = (name) => iconMap[name] || Command;

// Static navigation commands (all roles can see navigation-level items)
const STATIC_COMMANDS = [
  { id: 'nav-home', group: 'Navigation', icon: 'Home', label: 'Go to Dashboard', path: '/dashboard', roles: ['all'] },
  { id: 'nav-complaints', group: 'Navigation', icon: 'ClipboardList', label: 'View Complaints', path: '/complaints', roles: ['all'] },
  { id: 'nav-id', group: 'Navigation', icon: 'CreditCard', label: 'My Digital ID Card', path: '/my-id', roles: ['all'] },
  { id: 'nav-announcements', group: 'Navigation', icon: 'Megaphone', label: 'Announcements Board', path: '/announcements', roles: ['all'] },
  { id: 'nav-districts', group: 'Navigation', icon: 'Map', label: 'Districts Directory', path: '/districts', roles: ['all'] },
  { id: 'nav-emergency', group: 'Navigation', icon: 'Zap', label: 'Emergency Command Center', path: '/emergency', roles: ['supreme_admin', 'dev', 'state_president', 'president', 'vice_president'] },
  { id: 'nav-devtools', group: 'Navigation', icon: 'Server', label: 'Open Dev Tools', path: '/dev-tools', roles: ['supreme_admin'] },
];

const CommandPalette = ({ isOpen, onClose, user }) => {
  const { shortName } = useOrg();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  // Build full command index from static + dynamic modules
  const buildCommandIndex = useCallback(() => {
    const cmds = [];

    // 1. Static nav commands (filtered by role)
    STATIC_COMMANDS.forEach(cmd => {
      const allowed = cmd.roles.includes('all') || (user?.role && cmd.roles.includes(user.role));
      if (allowed) {
        cmds.push({
          id: cmd.id,
          group: cmd.group,
          icon: cmd.icon,
          label: cmd.label,
          action: () => { navigate(cmd.path); onClose(); }
        });
      }
    });

    // 2. Dynamic Dev Tools module commands (supreme_admin only)
    if (user?.role === 'supreme_admin') {
      devModules.forEach(mod => {
        const Icon = getIcon(mod.icon);
        // Panel commands
        mod.panels?.forEach(panel => {
          cmds.push({
            id: `devtools-${mod.id}-${panel.id}`,
            group: `Dev Tools › ${mod.name}`,
            icon: mod.icon,
            label: panel.name,
            action: () => {
              navigate(`/dev-tools?module=${mod.id}&panel=${panel.id}`);
              onClose();
            }
          });
        });
        // Search index commands
        mod.searchIndex?.forEach((si, idx) => {
          cmds.push({
            id: `search-${mod.id}-${idx}`,
            group: `Dev Tools › ${mod.name}`,
            icon: mod.icon,
            label: si.query,
            action: () => {
              navigate(`/dev-tools?module=${mod.id}&panel=${si.action}`);
              onClose();
            }
          });
        });
      });
    }

    return cmds;
  }, [user, navigate, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setTimeout(() => inputRef.current?.focus(), 50);
    setQuery('');
    setActiveIndex(0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const allCommands = buildCommandIndex();
    if (!query.trim()) {
      setResults(allCommands.slice(0, 12));
    } else {
      const q = query.toLowerCase();
      const filtered = allCommands
        .filter(cmd =>
          cmd.label.toLowerCase().includes(q) ||
          cmd.group.toLowerCase().includes(q)
        )
        .slice(0, 14);
      setResults(filtered);
    }
    setActiveIndex(0);
  }, [query, isOpen, buildCommandIndex]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      results[activeIndex].action();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Group results by group label
  const grouped = results.reduce((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = [];
    acc[cmd.group].push(cmd);
    return acc;
  }, {});

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />

      {/* Palette modal */}
      <div
        className="relative w-full max-w-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
          
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search commands, pages, and tools..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-slate-200 text-sm placeholder-slate-500 focus:outline-none"
            />
            <kbd className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded font-mono">ESC</kbd>
          </div>

          {/* Results */}
          <div className="max-h-[380px] overflow-y-auto">
            {results.length > 0 ? (
              Object.entries(grouped).map(([group, cmds]) => (
                <div key={group}>
                  <div className="px-4 py-2 text-[10px] uppercase font-bold tracking-widest text-slate-500 bg-slate-950/40">
                    {group}
                  </div>
                  {cmds.map((cmd) => {
                    const Icon = getIcon(cmd.icon);
                    const globalIdx = results.indexOf(cmd);
                    const isActive = globalIdx === activeIndex;
                    return (
                      <button
                        key={cmd.id}
                        onClick={cmd.action}
                        onMouseEnter={() => setActiveIndex(globalIdx)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          isActive ? 'bg-cyan-950/40 border-l-2 border-cyan-500' : 'border-l-2 border-transparent hover:bg-slate-800/40'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${isActive ? 'bg-cyan-900/40 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className={`text-sm flex-1 ${isActive ? 'text-slate-100' : 'text-slate-300'}`}>
                          {cmd.label}
                        </span>
                        <ChevronRight className={`w-3.5 h-3.5 transition-opacity ${isActive ? 'text-cyan-400 opacity-100' : 'text-slate-600 opacity-0'}`} />
                      </button>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-sm text-slate-500">
                No commands found for "<span className="text-slate-400">{query}</span>"
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/50 flex items-center gap-5 text-[10px] text-slate-500">
            <span className="flex items-center gap-1"><kbd className="bg-slate-800 border border-slate-700 px-1.5 rounded font-mono">↑↓</kbd> Navigate</span>
            <span className="flex items-center gap-1"><kbd className="bg-slate-800 border border-slate-700 px-1.5 rounded font-mono">↵</kbd> Execute</span>
            <span className="flex items-center gap-1"><kbd className="bg-slate-800 border border-slate-700 px-1.5 rounded font-mono">ESC</kbd> Dismiss</span>
            <span className="ml-auto flex items-center gap-1">
              <Command className="w-3 h-3" /> {shortName} Command Hub
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
