import React, { useState, useEffect } from 'react';
import { ShieldAlert, Activity, Lock, RefreshCw, Search, Clock, User } from 'lucide-react';

const LogTable = ({ logs, columns }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-[11px] text-left text-slate-300">
      <thead className="bg-slate-950/60 text-[9px] uppercase text-slate-400 tracking-wider sticky top-0">
        <tr>
          {columns.map(c => (
            <th key={c.key} className="px-3 py-2.5">{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-800/50">
        {logs.map((log, idx) => (
          <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
            {columns.map(c => (
              <td key={c.key} className="px-3 py-2.5 font-mono">
                {c.render ? c.render(log) : (log[c.key] || '—')}
              </td>
            ))}
          </tr>
        ))}
        {logs.length === 0 && (
          <tr>
            <td colSpan={columns.length} className="text-center py-8 text-slate-500 italic font-sans">
              No log entries found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const SecurityPanel = () => {
  const [activeTab, setActiveTab] = useState('audit');
  const [auditLogs, setAuditLogs] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const [auditRes, actRes, secRes] = await Promise.all([
        fetch('/api/modules/security/audit-logs', { headers }),
        fetch('/api/modules/security/activity-logs', { headers }),
        fetch('/api/modules/security/security-logs', { headers })
      ]);
      const [audit, act, sec] = await Promise.all([auditRes.json(), actRes.json(), secRes.json()]);
      if (audit.success) setAuditLogs(audit.logs);
      if (act.success) setActivityLogs(act.logs);
      if (sec.success) setSecurityLogs(sec.logs);
    } catch (err) {
      console.error('Error fetching security logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const tabs = [
    { id: 'audit', label: 'Audit Trail', icon: ShieldAlert, data: auditLogs },
    { id: 'activity', label: 'Activity Feed', icon: Activity, data: activityLogs },
    { id: 'security', label: 'Security Events', icon: Lock, data: securityLogs }
  ];

  const auditCols = [
    { key: 'created_at', label: 'Timestamp', render: l => new Date(l.created_at).toLocaleString() },
    { key: 'full_name', label: 'Actor', render: l => l.full_name || 'System' },
    { key: 'action_context', label: 'Action' },
    { key: 'ip_address', label: 'IP Address', render: l => <span className="text-cyan-400">{l.ip_address || '—'}</span> }
  ];

  const activityCols = [
    { key: 'created_at', label: 'Timestamp', render: l => new Date(l.created_at).toLocaleString() },
    { key: 'full_name', label: 'User', render: l => l.full_name || 'Public' },
    { key: 'activity_type', label: 'Type', render: l => <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[9px]">{l.activity_type}</span> },
    { key: 'details', label: 'Details', render: l => <span className="text-slate-400 truncate max-w-xs block">{l.details}</span> }
  ];

  const secCols = [
    { key: 'created_at', label: 'Timestamp', render: l => new Date(l.created_at).toLocaleString() },
    { key: 'actor_name', label: 'Actor', render: l => l.actor_name || 'System' },
    { key: 'event_type', label: 'Event' },
    { key: 'severity', label: 'Severity', render: l => (
      <span className={`px-1.5 py-0.5 rounded text-[9px] ${
        l.severity === 'high' ? 'bg-rose-950/40 text-rose-400 border border-rose-800/40' :
        l.severity === 'medium' ? 'bg-amber-950/40 text-amber-400 border border-amber-800/40' :
        'bg-slate-800 text-slate-400'
      }`}>{l.severity || 'low'}</span>
    )}
  ];

  const colsMap = { audit: auditCols, activity: activityCols, security: secCols };
  const activeData = tabs.find(t => t.id === activeTab)?.data || [];
  const filtered = activeData.filter(l => JSON.stringify(l).toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" /> Security Intelligence Center
          </h2>
          <p className="text-xs text-slate-400">Immutable audit trails, privilege monitoring, and real-time activity events.</p>
        </div>
        <button onClick={fetchLogs} disabled={loading} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-slate-900/50 border border-slate-800 rounded-xl p-1.5">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-slate-100 shadow-lg shadow-black/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span className="ml-1 text-[10px] bg-slate-700/50 px-1.5 rounded-full">{tab.data.length}</span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Filter log entries..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
      </div>

      {/* Log Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden max-h-[460px] overflow-y-auto">
        <LogTable logs={filtered} columns={colsMap[activeTab]} />
      </div>
    </div>
  );
};

export default {
  id: 'security',
  name: 'Security',
  icon: 'ShieldAlert',
  panels: [
    { id: 'logs', name: 'Security Intelligence', component: SecurityPanel }
  ],
  searchIndex: [
    { query: 'View audit logs', action: 'logs' },
    { query: 'Monitor login activities', action: 'logs' },
    { query: 'Security event monitoring', action: 'logs' }
  ]
};
