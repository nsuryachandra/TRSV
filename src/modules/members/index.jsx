import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Shield, Trash2, Calendar, Clipboard, CheckCircle, XCircle, Search, RefreshCw, BadgeCheck } from 'lucide-react';

const MembersPanel = () => {
  const [members, setMembers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [approvingApp, setApprovingApp] = useState(null);
  const [selectedRole, setSelectedRole] = useState('student');
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const token = localStorage.getItem('trsv_session_token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mRes, aRes] = await Promise.all([
        fetch('/api/modules/members', { headers }),
        fetch('/api/join-tvrs', { headers })
      ]);
      const mData = await mRes.json();
      const aData = await aRes.json();
      if (mData.success) setMembers(mData.members);
      if (aData.success) setApplications(aData.requests || []);
    } catch (err) {
      console.error('Error fetching members data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, assignedRole) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/modules/members/applications/${id}/approve`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ role: assignedRole })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Application approved successfully! Member profile created.');
        setApprovingApp(null);
        fetchData();
      } else {
        alert(data.message || 'Approval failed.');
      }
    } catch (err) {
      alert('Error approving application.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/join-tvrs/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'Rejected' })
      });
      const data = await res.json();
      if (data.success) {
        alert('Application rejected.');
        fetchData();
      }
    } catch (err) {
      alert('Error rejecting application.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerify = async (uid) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/modules/members/${uid}/verify`, {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (data.success) {
        alert('Member verified successfully! Badge added to card.');
        fetchData();
        if (selectedMember && selectedMember.id === uid) {
          viewTimeline(uid);
        }
      }
    } catch (err) {
      alert('Verification failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (uid, status) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/modules/members/${uid}/status`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Member status updated to ${status}.`);
        fetchData();
      }
    } catch (err) {
      alert('Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const viewTimeline = async (member) => {
    setSelectedMember(member);
    try {
      const res = await fetch(`/api/modules/members/${member.id}/timeline`, { headers });
      const data = await res.json();
      if (data.success) {
        setTimeline(data.timeline || []);
      }
    } catch (err) {
      console.error('Error fetching member timeline:', err);
    }
  };

  const filteredMembers = members.filter(m => 
    m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.trsv_member_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" /> Member Directory
          </h2>
          <p className="text-xs text-slate-400">View registered students, elevate designations, and review state credentials.</p>
        </div>
        <button onClick={fetchData} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Grid of Applications and Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Applications Approval Queue */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" /> Approvals Queue ({applications.filter(a => a.status === 'Pending').length})
          </h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {applications.filter(a => a.status === 'Pending').map(app => (
              <div key={app.id} className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-200">{app.full_name}</span>
                  <span className="text-[10px] bg-cyan-900/30 text-cyan-400 border border-cyan-800/30 px-1.5 py-0.5 rounded">
                    {app.member_type || 'Student'}
                  </span>
                </div>
                <div className="text-slate-400 space-y-1">
                  <div>Email: {app.email || 'N/A'}</div>
                  <div>Phone: {app.phone}</div>
                  <div>Constituency: {app.constituency_name}</div>
                  {app.college_name && <div>College: {app.college_name}</div>}
                  <div className="italic bg-slate-900/40 p-1.5 rounded border border-slate-800/30">"{app.reason}"</div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button 
                    onClick={() => handleReject(app.id)}
                    disabled={actionLoading}
                    className="flex items-center gap-1 px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/40 rounded text-[10px] text-rose-400 transition"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button 
                    onClick={() => { setApprovingApp(app); setSelectedRole('student'); }}
                    disabled={actionLoading}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/40 rounded text-[10px] text-emerald-400 transition"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                </div>
              </div>
            ))}
            {applications.filter(a => a.status === 'Pending').length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-4">No pending join applications.</p>
            )}
          </div>
        </div>

        {/* Right Columns: Members List */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by name, email, member ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100/50 dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded-lg py-1.5 pl-10 pr-4 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-450 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-950/50 text-[10px] uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">ID / Status</th>
                  <th className="px-4 py-3">Constituency</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredMembers.map(member => (
                  <tr key={member.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-200 flex items-center gap-1.5">
                        {member.full_name}
                        {member.verified && <BadgeCheck className="w-4 h-4 text-amber-500 fill-amber-500/20" />}
                      </div>
                      <div className="text-[10px] text-slate-500">{member.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-[10px]">{member.trsv_member_id || 'PENDING'}</div>
                      <span className={`text-[9px] px-1 rounded ${
                        member.verification_status === 'Verified' 
                          ? 'bg-amber-900/30 text-amber-400 border border-amber-800/30' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {member.verification_status || 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{member.constituency_name || 'State Head'}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded text-slate-300">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5">
                      <button 
                        onClick={() => viewTimeline(member)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px]"
                      >
                        Timeline
                      </button>
                      {!member.verified && (
                        <button 
                          onClick={() => handleVerify(member.id)}
                          className="px-2 py-1 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-800/40 text-amber-400 rounded text-[10px]"
                        >
                          Verify
                        </button>
                      )}
                      {member.verification_status !== 'Suspended' ? (
                        <button 
                          onClick={() => handleStatusChange(member.id, 'Suspended')}
                          className="px-2 py-1 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/40 text-rose-400 rounded text-[10px]"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleStatusChange(member.id, 'Verified')}
                          className="px-2 py-1 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/40 text-emerald-400 rounded text-[10px]"
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Timeline Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-55">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100">{selectedMember.full_name}</h3>
                <p className="text-[10px] text-slate-400">Activity Timeline & Governance History</p>
              </div>
              <button onClick={() => setSelectedMember(null)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto py-2">
              {timeline.length > 0 ? (
                timeline.map((t, idx) => (
                  <div key={idx} className="flex gap-3 text-xs">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                      {idx < timeline.length - 1 && <div className="w-0.5 flex-1 bg-slate-800" />}
                    </div>
                    <div className="space-y-0.5 pb-4">
                      <div className="text-[10px] text-slate-500 font-mono">{t.date}</div>
                      <div className="text-slate-300">{t.event}</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 italic text-center py-4">No events logged in the member timeline.</p>
              )}
            </div>
            
            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button 
                onClick={() => setSelectedMember(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Selection Modal */}
      {approvingApp && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-55">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100">Assign Role & Approve</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Select leadership or student status for {approvingApp.full_name}</p>
              </div>
              <button onClick={() => setApprovingApp(null)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>
            
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Target Constituency</label>
                <div className="text-xs text-slate-800 dark:text-slate-200 font-bold bg-slate-100 dark:bg-slate-950 p-2.5 rounded border border-slate-350 dark:border-slate-850">
                  {approvingApp.constituency_name}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500">Assign Union Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-350 dark:border-slate-850 rounded-lg p-2.5 text-xs text-slate-850 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="student">Regular Student Member (No Leadership Role)</option>
                  <option value="president">Constituency President</option>
                  <option value="vice_president">Constituency Vice President</option>
                  <option value="general_secretary">Constituency General Secretary</option>
                  <option value="secretary">Constituency Secretary</option>
                </select>
                <p className="text-[10px] text-slate-400 italic">
                  Selecting a leadership role grants access to scan digital IDs and moderate constituency logs.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button 
                onClick={() => setApprovingApp(null)}
                className="px-4 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleApprove(approvingApp.id, selectedRole)}
                disabled={actionLoading}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs"
              >
                {actionLoading ? 'Approving...' : 'Confirm & Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default {
  id: 'members',
  name: 'Members',
  icon: 'Users',
  panels: [
    { id: 'directory', name: 'Directory & Approvals', component: MembersPanel }
  ],
  searchIndex: [
    { query: 'Manage members list', action: 'directory' },
    { query: 'Approve student applications', action: 'directory' }
  ]
};

