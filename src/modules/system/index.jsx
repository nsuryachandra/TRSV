import React, { useState, useEffect } from 'react';
import { Server, Download, Upload, RefreshCw, Activity, Database, Cpu, HardDrive, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';

const SystemPanel = () => {
  const [telemetry, setTelemetry] = useState(null);
  const [recentBackups, setRecentBackups] = useState([]);
  const [maintenance, setMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [togglingMaint, setTogglingMaint] = useState(false);
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoring, setRestoring] = useState(false);

  const token = localStorage.getItem('trsv_session_token');
  const headers = { 'Authorization': `Bearer ${token}` };

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const [healthRes, maintRes] = await Promise.all([
        fetch('/api/modules/system/health', { headers }),
        fetch('/api/modules/system/maintenance', { headers })
      ]);
      const health = await healthRes.json();
      const maint = await maintRes.json();
      if (health.success) {
        setTelemetry(health.telemetry);
        setRecentBackups(health.recent_backups || []);
      }
      if (maint.success) setMaintenance(maint.maintenance);
    } catch (err) {
      console.error('Error fetching system health:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHealth(); }, []);

  const handleBackupExport = async () => {
    try {
      const res = await fetch('/api/modules/system/backup/export', { headers });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tvrs_backup_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      fetchHealth();
    } catch (err) {
      alert('Backup generation failed.');
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) return alert('Please select a backup file first.');
    if (!confirm('⚠️ This will OVERWRITE all current database tables with the backup data. Are you absolutely sure?')) return;

    setRestoring(true);
    try {
      const text = await restoreFile.text();
      const backupData = JSON.parse(text);
      const res = await fetch('/api/modules/system/backup/restore', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupData })
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ Database successfully restored from backup.');
        fetchHealth();
      } else {
        alert('Restore failed: ' + data.error);
      }
    } catch (err) {
      alert('Error parsing or restoring backup file.');
    } finally {
      setRestoring(false);
    }
  };

  const handleToggleMaintenance = async () => {
    setTogglingMaint(true);
    try {
      const res = await fetch('/api/modules/system/maintenance', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenance: !maintenance })
      });
      const data = await res.json();
      if (data.success) setMaintenance(!maintenance);
    } catch (err) {
      alert('Failed to toggle maintenance mode.');
    } finally {
      setTogglingMaint(false);
    }
  };

  const MetricCard = ({ icon: Icon, label, value, color = 'text-cyan-400' }) => (
    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
      <div className={`p-2.5 rounded-lg bg-slate-900 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{label}</div>
        <div className="text-base font-bold text-slate-100 mt-0.5">{value ?? '—'}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" /> System Administration Console
          </h2>
          <p className="text-xs text-slate-400">Monitor backend health, export backups, restore snapshots, and toggle maintenance mode.</p>
        </div>
        <button onClick={fetchHealth} disabled={loading} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Telemetry Metrics Grid */}
      {telemetry && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard icon={Activity} label="DB Latency" value={`${telemetry.latency_ms} ms`} color="text-emerald-400" />
          <MetricCard icon={Server} label="Uptime" value={`${Math.floor(telemetry.uptime_seconds / 60)} min`} color="text-blue-400" />
          <MetricCard icon={Cpu} label="CPU Cores" value={telemetry.cpu_cores} color="text-violet-400" />
          <MetricCard icon={HardDrive} label="Heap Used" value={`${telemetry.memory?.heap_used_mb} MB`} color="text-amber-400" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backup & Restore */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-5">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" /> Backup & Recovery Engine
          </h3>

          {/* Export */}
          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-3">
            <div className="text-xs font-bold text-slate-300">Export Full Snapshot</div>
            <p className="text-[11px] text-slate-500">Generate a complete JSON dump of all statewide data tables — users, complaints, colleges, documents, and more.</p>
            <button
              onClick={handleBackupExport}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/40 text-cyan-400 rounded-lg text-xs font-bold transition"
            >
              <Download className="w-4 h-4" /> Generate & Download Backup
            </button>
          </div>

          {/* Restore */}
          <div className="p-4 bg-slate-950/70 border border-rose-900/30 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
              <AlertTriangle className="w-4 h-4" /> Restore from Backup File
            </div>
            <p className="text-[11px] text-slate-500">⚠️ This will <strong className="text-rose-400">permanently overwrite</strong> all existing data with the backup content. Handle with extreme caution.</p>
            <div className="flex gap-3 items-center">
              <label className="flex-1 cursor-pointer border border-dashed border-slate-700 rounded-lg p-2.5 text-center text-[11px] text-slate-400 hover:border-slate-500 transition">
                <Upload className="w-4 h-4 mx-auto mb-1 text-slate-500" />
                {restoreFile ? restoreFile.name : 'Click to select .json backup'}
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={e => setRestoreFile(e.target.files[0])}
                />
              </label>
              <button
                onClick={handleRestore}
                disabled={!restoreFile || restoring}
                className="px-4 py-2.5 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/40 text-rose-400 rounded-lg text-xs font-bold transition disabled:opacity-40"
              >
                {restoring ? 'Restoring...' : 'Execute Restore'}
              </button>
            </div>
          </div>

          {/* Recent Backups */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recent Backup History</div>
            {recentBackups.length > 0 ? (
              recentBackups.map((bk, idx) => (
                <div key={idx} className="text-[10px] flex justify-between text-slate-500 py-1.5 border-b border-slate-800/60">
                  <span className="font-mono">{bk.backup_name}</span>
                  <span className="text-emerald-400">{bk.status}</span>
                  <span>{new Date(bk.created_at).toLocaleDateString()}</span>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-slate-600 italic">No recent backups recorded.</p>
            )}
          </div>
        </div>

        {/* Maintenance Mode */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-5">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-amber-400" /> System Controls
          </h3>

          <div className={`p-5 rounded-xl border transition-all ${maintenance ? 'bg-amber-950/20 border-amber-800/40' : 'bg-slate-950/70 border-slate-800/80'}`}>
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <div className={`text-sm font-bold ${maintenance ? 'text-amber-400' : 'text-slate-200'}`}>
                  Maintenance Mode
                </div>
                <p className="text-[11px] text-slate-500">
                  {maintenance
                    ? 'System is currently in maintenance. Public access to portal is blocked.'
                    : 'System is LIVE. All portals are accessible to members.'}
                </p>
              </div>
              <button
                onClick={handleToggleMaintenance}
                disabled={togglingMaint}
                className="p-1 rounded-lg transition"
              >
                {maintenance
                  ? <ToggleRight className="w-10 h-10 text-amber-400" />
                  : <ToggleLeft className="w-10 h-10 text-slate-500" />
                }
              </button>
            </div>
          </div>

          {/* System Info */}
          {telemetry && (
            <div className="space-y-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Environment Details</div>
              <div className="space-y-2 text-[11px] font-mono">
                {[
                  ['Platform', telemetry.platform],
                  ['Architecture', telemetry.arch],
                  ['Total RAM', `${telemetry.memory?.total_gb} GB`],
                  ['Free RAM', `${telemetry.memory?.free_gb} GB`],
                  ['RSS Memory', `${telemetry.memory?.rss_mb} MB`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-500">{label}</span>
                    <span className="text-slate-300">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default {
  id: 'system',
  name: 'System',
  icon: 'Server',
  panels: [
    { id: 'console', name: 'Admin Console', component: SystemPanel }
  ],
  searchIndex: [
    { query: 'Export database backup', action: 'console' },
    { query: 'Server health monitoring', action: 'console' },
    { query: 'Toggle maintenance mode', action: 'console' },
    { query: 'Restore backup snapshot', action: 'console' }
  ]
};

