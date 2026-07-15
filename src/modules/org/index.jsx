import React, { useState, useEffect } from 'react';
import { Network, Plus, ShieldCheck, MapPin, Landmark, School, RotateCcw } from 'lucide-react';

const ORG_DEFAULTS = {
  constituency: { name: 'Jubilee Hills', district: 'Hyderabad' },
  college: { name: 'Chaitanya Bharathi Institute of Technology (CBIT)' }
};

const OrgPanel = () => {
  const [districts, setDistricts] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [conName, setConName] = useState('');
  const [conDistrict, setConDistrict] = useState('');
  const [colName, setColName] = useState('');
  const [colConstituency, setColConstituency] = useState('');

  const token = localStorage.getItem('trsv_session_token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/modules/org/hierarchy', { headers });
      const data = await res.json();
      if (data.success) {
        setDistricts(data.districts || []);
        setConstituencies(data.constituencies || []);
        setColleges(data.colleges || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddConstituency = async (e) => {
    e.preventDefault();
    if (!conName || !conDistrict) return;
    try {
      const res = await fetch('/api/modules/org/constituencies', {
        method: 'POST',
        headers,
        body: JSON.stringify({ constituency_name: conName, district: conDistrict })
      });
      const data = await res.json();
      if (data.success) {
        alert('Constituency added successfully.');
        setConName('');
        setConDistrict('');
        fetchHierarchy();
      }
    } catch (err) {
      alert('Failed to add constituency.');
    }
  };

  const handleAddCollege = async (e) => {
    e.preventDefault();
    if (!colName || !colConstituency) return;
    try {
      const res = await fetch('/api/modules/org/colleges', {
        method: 'POST',
        headers,
        body: JSON.stringify({ college_name: colName, constituency_id: parseInt(colConstituency) })
      });
      const data = await res.json();
      if (data.success) {
        alert('College chapter registered.');
        setColName('');
        setColConstituency('');
        fetchHierarchy();
      }
    } catch (err) {
      alert('Failed to add college.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" /> Organizational Hierarchy
          </h2>
          <p className="text-xs text-slate-400">Configure districts, append electoral assembly constituencies, and register student college chapters.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left forms */}
        <div className="space-y-6">
          {/* Add Constituency Form */}
          <form onSubmit={handleAddConstituency} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Landmark className="w-4 h-4 text-cyan-400" /> Add Constituency Area
            </h3>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Constituency Name</label>
              <input
                type="text"
                placeholder="e.g. Amberpet"
                value={conName}
                onChange={e => setConName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-cyan-500 outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">District</label>
              <input
                type="text"
                placeholder="e.g. Hyderabad"
                value={conDistrict}
                onChange={e => setConDistrict(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-cyan-500 outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs transition border border-slate-750"
            >
              Add Constituency
            </button>
            <button
              type="button"
              onClick={() => { setConName(ORG_DEFAULTS.constituency.name); setConDistrict(ORG_DEFAULTS.constituency.district); }}
              className="w-full py-2 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white font-bold rounded-lg text-xs transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Fill Defaults
            </button>
          </form>

          {/* Add College Form */}
          <form onSubmit={handleAddCollege} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <School className="w-4 h-4 text-cyan-400" /> Register College Chapter
            </h3>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">College Name</label>
              <input
                type="text"
                placeholder="e.g. Keshav Memorial Institute"
                value={colName}
                onChange={e => setColName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-cyan-500 outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Constituency Scope</label>
              <select
                value={colConstituency}
                onChange={e => setColConstituency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:border-cyan-500 outline-none"
                required
              >
                <option value="">Select Target Area</option>
                {constituencies.map(c => (
                  <option key={c.id} value={c.id}>{c.constituency_name} ({c.district})</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs transition border border-slate-750"
            >
              Register College
            </button>
            <button
              type="button"
              onClick={() => setColName(ORG_DEFAULTS.college.name)}
              className="w-full py-2 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white font-bold rounded-lg text-xs transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Fill Defaults
            </button>
          </form>
        </div>

        {/* Right lists */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" /> Active Governance Node Coverage
          </h3>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {districts.map(district => (
              <div key={district} className="p-4 bg-slate-950 border border-slate-850 rounded-lg space-y-3">
                <div className="font-bold text-xs text-cyan-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> District: {district}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-5 border-l border-slate-800">
                  {constituencies.filter(c => c.district === district).map(c => (
                    <div key={c.id} className="p-2.5 bg-slate-900/60 border border-slate-800/80 rounded space-y-1">
                      <div className="font-bold text-slate-200 text-xs">{c.constituency_name}</div>
                      <div className="text-[10px] text-slate-500">
                        Colleges: {colleges.filter(col => col.constituency_id === c.id).length} chapters
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default {
  id: 'org',
  name: 'Organization',
  icon: 'Network',
  panels: [
    { id: 'hierarchy', name: 'Territory Setup', component: OrgPanel }
  ],
  searchIndex: [
    { query: 'Add electoral constituencies', action: 'hierarchy' },
    { query: 'Register new colleges', action: 'hierarchy' }
  ]
};

