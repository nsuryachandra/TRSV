import React, { useState, useEffect } from 'react';
import { Shield, UserMinus, UserPlus, Search, RefreshCw, UserCheck, ShieldAlert } from 'lucide-react';

const LeadersManagementPanel = () => {
  const [leaders, setLeaders] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [username, setUsername] = useState('');
  const [selectedRole, setSelectedRole] = useState('president');
  const [constituencyId, setConstituencyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const token = localStorage.getItem('trsv_session_token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lRes, cRes] = await Promise.all([
        fetch('/api/modules/members/leaders/list', { headers }),
        fetch('/api/constituencies', { headers })
      ]);
      const lData = await lRes.json();
      const cData = await cRes.json();
      if (lData.success) setLeaders(lData.leaders);
      if (cData.success) {
        setConstituencies(cData.constituencies);
        if (cData.constituencies.length > 0 && !constituencyId) {
          setConstituencyId(cData.constituencies[0].id.toString());
        }
      }
    } catch (err) {
      console.error('Error fetching leaders/constituencies data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignLeader = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      alert('Please enter a student username.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/modules/members/leaders/assign', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          username: username.trim(),
          role: selectedRole,
          constituency_id: constituencyId ? parseInt(constituencyId) : null
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Leader assigned successfully.');
        setUsername('');
        fetchData();
      } else {
        alert(data.message || 'Failed to assign leader.');
      }
    } catch (err) {
      alert('Error assigning leader.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeLeader = async (id, fullName) => {
    if (!confirm(`Are you sure you want to revoke leadership status for ${fullName}?`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/modules/members/leaders/${id}/remove`, {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Leadership revoked successfully.');
        fetchData();
      } else {
        alert(data.message || 'Failed to revoke leadership.');
      }
    } catch (err) {
      alert('Error revoking leadership.');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'president': return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
      case 'vice_president': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'general_secretary': return 'bg-pink-500/10 text-pink-400 border border-pink-500/20';
      case 'secretary': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  const formatRole = (role) => {
    return role.replace(/_/g, ' ').toUpperCase();
  };

  const filteredLeaders = leaders.filter(l => 
    l.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.constituency_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    formatRole(l.role)?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-100">
      {/* Module Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" /> Leader Management Terminal
          </h2>
          <p className="text-xs text-slate-400">Directly assign constituency leaders and promote members into the state union control ecosystem.</p>
        </div>
        <button onClick={fetchData} disabled={loading} className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-slate-300 transition">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Grid: Assign Form (Left/Top) & Current Leaders (Right/Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Promotion Form */}
        <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Promote Student
          </h3>
          <p className="text-[11px] text-slate-400">Enter a student's username directly to promote them to leadership status.</p>
          
          <form onSubmit={handleAssignLeader} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500">Student Username</label>
              <input
                type="text"
                placeholder="e.g. aditya"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                disabled={actionLoading}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500">Union Role</label>
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                disabled={actionLoading}
              >
                <option value="president">Constituency President</option>
                <option value="vice_president">Constituency Vice President</option>
                <option value="general_secretary">Constituency General Secretary</option>
                <option value="secretary">Constituency Secretary</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500">Target Constituency</label>
              <select
                value={constituencyId}
                onChange={e => setConstituencyId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                disabled={actionLoading}
              >
                <option value="">No Constituency (Statewide Leader)</option>
                {constituencies.map(con => (
                  <option key={con.id} value={con.id}>
                    {con.constituency_name} ({con.district})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={actionLoading || loading}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition shadow-[0_0_12px_rgba(6,182,212,0.15)] flex items-center justify-center gap-2"
            >
              {actionLoading ? 'Processing promotion...' : 'Promote to Leader'}
            </button>
          </form>
        </div>

        {/* Directory Table */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-cyan-400" /> Active Leaders Directory
            </h3>
            
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search leaders..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 pl-8 pr-3 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            </div>
          </div>

          <div className="border border-slate-800/80 rounded-lg overflow-hidden max-h-[380px] overflow-y-auto">
            <table className="w-full text-[11px] text-left text-slate-350">
              <thead className="bg-slate-950/80 text-[9px] uppercase text-slate-400 tracking-wider sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Username</th>
                  <th className="px-4 py-2.5">Role</th>
                  <th className="px-4 py-2.5">Constituency</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredLeaders.map(leader => {
                  const uName = leader.email?.split('@')[0] || leader.email || '—';
                  return (
                    <tr key={leader.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-100">{leader.full_name}</td>
                      <td className="px-4 py-3 font-mono text-cyan-400">{uName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getRoleBadgeColor(leader.role)}`}>
                          {formatRole(leader.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3">{leader.constituency_name || <span className="text-slate-500 italic">Statewide</span>}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRevokeLeader(leader.id, leader.full_name)}
                          disabled={actionLoading}
                          className="p-1.5 bg-rose-950/20 hover:bg-rose-500 hover:text-white border border-rose-900/30 rounded text-rose-400 transition"
                          title="Revoke Leadership"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredLeaders.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-10 text-slate-500 italic">
                      {loading ? 'Fetching leader list from state mainframe...' : 'No leaders found in registry.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default {
  id: 'leaders',
  name: 'Leaders',
  icon: 'Shield',
  panels: [
    { id: 'management', name: 'Leaders Management', component: LeadersManagementPanel }
  ],
  searchIndex: [
    { query: 'Manage union leaders', action: 'management' },
    { query: 'Promote student to president secretary', action: 'management' },
    { query: 'Remove leader privileges', action: 'management' }
  ]
};
