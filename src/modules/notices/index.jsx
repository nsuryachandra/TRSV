import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Calendar, Trash2, Globe, Archive, RotateCcw } from 'lucide-react';

const NOTICE_DEFAULTS = {
  title: 'Mandatory Leadership Council Summit — Attendance Notice',
  content: 'All district presidents, college representatives, and core committee members are required to attend the virtual leadership summit. Agenda: academic fee regulation representation, regional hub activation status, and student welfare updates. Attendance is compulsory.',
  targetAudience: 'leaders',
  priority: 'High'
};

const NoticesPanel = () => {
  const [notices, setNotices] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [priority, setPriority] = useState('Normal');
  const [status, setStatus] = useState('Active');
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('trsv_session_token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/modules/notices', { headers });
      const data = await res.json();
      if (data.success) {
        setNotices(data.notices);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/modules/notices', {
        method: 'POST',
        headers,
        body: JSON.stringify({ title, content, target_audience: targetAudience, priority, status })
      });
      const data = await res.json();
      if (data.success) {
        alert('Notice posted successfully.');
        setTitle('');
        setContent('');
        fetchNotices();
      }
    } catch (err) {
      alert('Error creating notice.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    try {
      const res = await fetch(`/api/modules/notices/${id}`, {
        method: 'DELETE',
        headers
      });
      const data = await res.json();
      if (data.success) {
        fetchNotices();
      }
    } catch (err) {
      alert('Error deleting notice.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-cyan-400" /> State Bulletins & Notices
          </h2>
          <p className="text-xs text-slate-400">Post immediate announcements or bulletins visible across user boards.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Post notice */}
        <form onSubmit={handleCreate} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" /> Dispatch New Notice
          </h3>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notice Title</label>
            <input
              type="text"
              placeholder="e.g. Mandatory College Attendance Compliance Guideline"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-cyan-500 outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notice Content</label>
            <textarea
              rows={4}
              placeholder="Input announcement details..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-cyan-500 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scope</label>
              <select
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:border-cyan-500 outline-none"
              >
                <option value="all">All Members</option>
                <option value="leaders">Leaders Only</option>
                <option value="students">Students Only</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:border-cyan-500 outline-none"
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg text-xs transition"
          >
            Post Announcement
          </button>
          <button
            type="button"
            onClick={() => {
              setTitle(NOTICE_DEFAULTS.title);
              setContent(NOTICE_DEFAULTS.content);
              setTargetAudience(NOTICE_DEFAULTS.targetAudience);
              setPriority(NOTICE_DEFAULTS.priority);
            }}
            className="w-full py-2 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-bold rounded-lg text-xs transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Fill Defaults
          </button>
        </form>

        {/* Notices list */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" /> Active Bulletins
          </h3>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {notices.map(n => (
              <div key={n.id} className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200 text-xs">{n.title}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                      n.priority === 'Critical' 
                        ? 'bg-rose-950/40 text-rose-400 border border-rose-800/40' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {n.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{n.content}</p>
                  <div className="text-[9px] text-slate-500 flex items-center gap-1 font-mono pt-1">
                    <Calendar className="w-3 h-3" /> {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(n.id)}
                  className="p-1.5 bg-slate-900 hover:bg-rose-950/40 hover:text-rose-400 text-slate-500 rounded border border-slate-800"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {notices.length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-6">No bulletins posted yet.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default {
  id: 'notices',
  name: 'Notices',
  icon: 'Megaphone',
  panels: [
    { id: 'notices', name: 'Bulletins Board', component: NoticesPanel }
  ],
  searchIndex: [
    { query: 'Create state notice alert', action: 'notices' },
    { query: 'Schedule bulletin board messages', action: 'notices' }
  ]
};

