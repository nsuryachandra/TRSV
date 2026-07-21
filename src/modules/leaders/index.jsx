import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, UserPlus, Search, RefreshCw, UserCheck, ShieldAlert,
  Edit3, Trash2, ArrowUp, ArrowDown, Eye, CheckCircle2, XCircle,
  EyeOff, Image as ImageIcon, Sparkles, Filter, AlertTriangle, X,
  Layers, ChevronLeft, ChevronRight, User, Building, MapPin, Calendar
} from 'lucide-react';
import { useOrg } from '../../context/OrgContext';

const DESIGNATION_PRESETS = [
  'Founder & Patron',
  'President',
  'Vice President',
  'General Secretary',
  'Secretary',
  'Joint Secretary',
  'Coordinator',
  'District President',
  'Greater Hyderabad President',
  'Greater Hyderabad Vice President',
  'Greater Hyderabad General Secretary',
  'State Leader',
  'College Incharge',
  'Media Team Head',
  'Digital Operations President',
  'Developer & Digital Operations President'
];

const computeLocationTag = (district = '', constituencyName = '') => {
  const distClean = (district || '').trim();
  const constClean = (constituencyName || '').trim();
  const full = `${distClean} ${constClean}`.trim().toLowerCase();

  if (!full || full === 'state' || full === 'telangana' || full.includes('statewide') || full.includes('central') || full.includes('all')) {
    return 'STATE';
  }

  const getAbbr = (text) => {
    const words = text.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';
    if (words.length === 1) {
      const w = words[0].toUpperCase();
      if (w.length <= 2) return w;
      const consonants = w.replace(/[AEIOU]/g, '');
      return consonants.length >= 2 ? consonants.substring(0, 2) : w.substring(0, 2);
    }
    return words.map(w => w[0].toUpperCase()).join('').substring(0, 2);
  };

  const isGH = distClean.toLowerCase().includes('greater hyd') || distClean.toLowerCase() === 'gh' || (distClean.toLowerCase().includes('hyderabad') && !constClean);

  if (isGH) {
    if (!constClean || constClean.toLowerCase() === 'greater hyderabad' || constClean.toLowerCase() === 'hyderabad') {
      return 'GH';
    }
    // Known overrides for Greater Hyderabad sub-constituencies
    const cLower = constClean.toLowerCase();
    if (cLower.includes('sanath') || cLower.includes('sn')) return 'GHSN';
    if (cLower.includes('jubilee')) return 'GHJB';
    if (cLower.includes('khairatabad')) return 'GHKT';
    if (cLower.includes('secunderabad')) return 'GHSC';
    if (cLower.includes('amberpet')) return 'GHAP';
    if (cLower.includes('musheerabad')) return 'GHMB';
    if (cLower.includes('malakpet')) return 'GHMP';
    if (cLower.includes('kukatpally')) return 'GHKP';
    if (cLower.includes('serilingampally')) return 'GHSL';
    if (cLower.includes('lb nagar')) return 'GHLB';
    if (cLower.includes('uppal')) return 'GHUP';

    const constAbbr = getAbbr(constClean);
    return `GH${constAbbr}`;
  }

  if (distClean && constClean && constClean.toLowerCase() !== distClean.toLowerCase()) {
    const dAbbr = getAbbr(distClean);
    const cAbbr = getAbbr(constClean);
    return `${dAbbr}${cAbbr}`;
  }

  return getAbbr(distClean || constClean) || 'STATE';
};

const LeadersManagementPanel = () => {
  const { shortName } = useOrg();
  const [leaders, setLeaders] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLeader, setEditingLeader] = useState(null); // null = Add, object = Edit
  const [previewLeader, setPreviewLeader] = useState(null);
  const [deletingLeader, setDeletingLeader] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    profile_image: '',
    organization_id: '',
    designation: 'President',
    custom_designation: '',
    email: '',
    password: '',
    phone: '',
    college_name: '',
    district: '',
    constituency_name: '',
    biography: '',
    joining_date: new Date().toISOString().split('T')[0],
    display_order: 1,
    status: 'Active'
  });

  const token = localStorage.getItem('trsv_session_token');
  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }), [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lRes, cRes] = await Promise.all([
        fetch('/api/dev/leaders/admin/list?limit=200', { headers }),
        fetch('/api/constituencies', { headers })
      ]);
      const lData = await lRes.json();
      const cData = await cRes.json();
      if (lData.success) {
        setLeaders(lData.leaders || []);
      }
      if (cData.success) {
        setConstituencies(cData.constituencies || []);
      }
    } catch (err) {
      console.error('Error fetching leaders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered leaders list
  const filteredLeaders = useMemo(() => {
    return leaders.filter(l => {
      const matchesSearch = !searchQuery.trim() || (
        l.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.organization_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.constituency_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leaders, searchQuery, statusFilter]);

  // Paginated leaders
  const paginatedLeaders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLeaders.slice(start, start + itemsPerPage);
  }, [filteredLeaders, currentPage]);

  const totalPages = Math.ceil(filteredLeaders.length / itemsPerPage) || 1;

  // Open Add Leader Modal
  const handleOpenAdd = () => {
    const nextOrder = leaders.length > 0 ? Math.max(...leaders.map(l => l.display_order || 0)) + 1 : 1;
    const initialDist = 'Hyderabad';
    const initialConst = 'Greater Hyderabad';
    const tag = computeLocationTag(initialDist, initialConst);
    const nextNum = (leaders.length + 1).toString().padStart(4, '0');

    setEditingLeader(null);
    setFormData({
      full_name: '',
      profile_image: '',
      organization_id: `TRSV-${tag}-${nextNum}`,
      designation: 'President',
      custom_designation: '',
      email: '',
      password: '',
      phone: '',
      college_name: '',
      district: initialDist,
      constituency_name: initialConst,
      biography: '',
      joining_date: new Date().toISOString().split('T')[0],
      display_order: nextOrder,
      status: 'Active'
    });
    setIsFormOpen(true);
  };

  // Open Edit Leader Modal
  const handleOpenEdit = (leader) => {
    setEditingLeader(leader);
    const isPreset = DESIGNATION_PRESETS.includes(leader.designation);
    setFormData({
      full_name: leader.full_name || '',
      profile_image: leader.profile_image || '',
      organization_id: leader.organization_id || '',
      designation: isPreset ? leader.designation : 'CUSTOM',
      custom_designation: isPreset ? '' : leader.designation,
      email: leader.email || '',
      password: '',
      phone: leader.phone || '',
      college_name: leader.college_name || '',
      district: leader.district || '',
      constituency_name: leader.constituency_name || '',
      biography: leader.biography || '',
      joining_date: leader.joining_date ? leader.joining_date.split('T')[0] : new Date().toISOString().split('T')[0],
      display_order: leader.display_order || 1,
      status: leader.status || 'Active'
    });
    setIsFormOpen(true);
  };

  // Handle Save (Add or Edit)
  const handleSaveLeader = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      alert('Please enter Leader Full Name.');
      return;
    }

    if (!formData.email || !formData.email.trim()) {
      alert('Email address is required so the leader can log in.');
      return;
    }

    if (!editingLeader && (!formData.password || !formData.password.trim())) {
      alert('Password is required so the leader can log in.');
      return;
    }

    const finalDesignation = formData.designation === 'CUSTOM'
      ? formData.custom_designation.trim()
      : formData.designation;

    if (!finalDesignation) {
      alert('Please specify a Designation.');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        ...formData,
        designation: finalDesignation
      };

      const url = editingLeader
        ? `/api/dev/leaders/admin/edit/${editingLeader.id}`
        : '/api/dev/leaders/admin/add';

      const method = editingLeader ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setIsFormOpen(false);
        fetchData();
      } else {
        alert(data.message || 'Failed to save leader.');
      }
    } catch (err) {
      alert('Error saving leader.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteLeader = async () => {
    if (!deletingLeader) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/dev/leaders/admin/delete/${deletingLeader.id}`, {
        method: 'DELETE',
        headers
      });
      const data = await res.json();
      if (data.success) {
        setDeletingLeader(null);
        fetchData();
      } else {
        alert(data.message || 'Failed to delete leader.');
      }
    } catch (err) {
      alert('Error deleting leader.');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Active / Inactive / Hidden
  const handleStatusToggle = async (leader, newStatus) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/dev/leaders/admin/status/${leader.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setLeaders(prev => prev.map(l => l.id === leader.id ? { ...l, status: newStatus } : l));
      } else {
        alert(data.message || 'Failed to update status.');
      }
    } catch (err) {
      alert('Error updating status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Move Up / Move Down Reordering
  const handleMoveOrder = async (index, direction) => {
    const newLeaders = [...leaders];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newLeaders.length) return;

    // Swap display_order values
    const tempOrder = newLeaders[index].display_order;
    newLeaders[index].display_order = newLeaders[targetIdx].display_order;
    newLeaders[targetIdx].display_order = tempOrder;

    // Swap positions
    const temp = newLeaders[index];
    newLeaders[index] = newLeaders[targetIdx];
    newLeaders[targetIdx] = temp;

    setLeaders(newLeaders);

    // Send order update to backend
    try {
      const orderedIds = newLeaders.map(l => l.id);
      await fetch('/api/dev/leaders/admin/reorder', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ orderedIds })
      });
    } catch (err) {
      console.error('Failed to sync reorder:', err);
    }
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* ─── Top Header Bar ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-slate-100">Leadership Management System</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
              CMS Console
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Dynamically manage TRSV state and constituency leaders, profile photos, designation hierarchy, and public display orders.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-xl text-slate-300 transition border border-slate-700"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-cyan-950/50 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Add New Leader
          </button>
        </div>
      </div>

      {/* ─── Metric Badges ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Total Leaders</div>
            <div className="text-lg font-black text-slate-100 mt-0.5">{leaders.length}</div>
          </div>
          <UserCheck className="w-5 h-5 text-cyan-400" />
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Active Public</div>
            <div className="text-lg font-black text-emerald-400 mt-0.5">
              {leaders.filter(l => l.status === 'Active').length}
            </div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Inactive</div>
            <div className="text-lg font-black text-amber-400 mt-0.5">
              {leaders.filter(l => l.status === 'Inactive').length}
            </div>
          </div>
          <XCircle className="w-5 h-5 text-amber-400" />
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Hidden</div>
            <div className="text-lg font-black text-slate-400 mt-0.5">
              {leaders.filter(l => l.status === 'Hidden').length}
            </div>
          </div>
          <EyeOff className="w-5 h-5 text-slate-400" />
        </div>
      </div>

      {/* ─── Search & Filter Bar ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search name, designation, district, ID..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {['All', 'Active', 'Inactive', 'Hidden'].map(st => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-lg shrink-0">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded text-xs transition ${viewMode === 'table' ? 'bg-cyan-950 text-cyan-400 font-bold' : 'text-slate-500'}`}
            title="Table View"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded text-xs transition ${viewMode === 'cards' ? 'bg-cyan-950 text-cyan-400 font-bold' : 'text-slate-500'}`}
            title="Card View"
          >
            <User className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ─── Main Directory Content ─── */}
      {viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-950/90 text-[10px] uppercase text-slate-400 tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-3 py-3 text-center w-12">Order</th>
                  <th className="px-4 py-3">Leader</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Region</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedLeaders.map((leader, idx) => {
                  const absoluteIdx = (currentPage - 1) * itemsPerPage + idx;
                  return (
                    <tr key={leader.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Reorder controls */}
                      <td className="px-3 py-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            onClick={() => handleMoveOrder(absoluteIdx, 'up')}
                            disabled={absoluteIdx === 0}
                            className="p-0.5 hover:bg-slate-800 disabled:opacity-20 rounded text-slate-400 hover:text-cyan-400"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <span className="text-[10px] font-bold font-mono text-cyan-400">{leader.display_order}</span>
                          <button
                            onClick={() => handleMoveOrder(absoluteIdx, 'down')}
                            disabled={absoluteIdx === leaders.length - 1}
                            className="p-0.5 hover:bg-slate-800 disabled:opacity-20 rounded text-slate-400 hover:text-cyan-400"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Photo + Name + Org ID */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                            {leader.profile_image ? (
                              <img src={leader.profile_image} alt={leader.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-slate-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-100">{leader.full_name}</div>
                            <div className="text-[10px] font-mono text-cyan-500">{leader.organization_id || `TRSV-LEAD-${leader.id}`}</div>
                          </div>
                        </div>
                      </td>

                      {/* Designation */}
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-950/60 text-blue-300 border border-blue-800/50 inline-block">
                          {leader.designation}
                        </span>
                      </td>

                      {/* District & Constituency */}
                      <td className="px-4 py-3">
                        <div className="text-slate-200 font-medium">{leader.district || 'Statewide'}</div>
                        <div className="text-[10px] text-slate-500">{leader.constituency_name || 'Telangana'}</div>
                      </td>

                      {/* Joined Date */}
                      <td className="px-4 py-3 font-mono text-slate-400">
                        {leader.joining_date ? leader.joining_date.split('T')[0] : '—'}
                      </td>

                      {/* Status Toggle */}
                      <td className="px-4 py-3 text-center">
                        <select
                          value={leader.status}
                          onChange={e => handleStatusToggle(leader, e.target.value)}
                          disabled={actionLoading}
                          className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg border focus:outline-none bg-slate-950 cursor-pointer ${
                            leader.status === 'Active'
                              ? 'text-emerald-400 border-emerald-800/80'
                              : leader.status === 'Inactive'
                              ? 'text-amber-400 border-amber-800/80'
                              : 'text-slate-400 border-slate-800'
                          }`}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Hidden">Hidden</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewLeader(leader)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                            title="Preview Public Card"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(leader)}
                            className="p-1.5 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800 text-cyan-400 rounded-lg transition"
                            title="Edit Leader"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingLeader(leader)}
                            className="p-1.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-800 text-rose-400 rounded-lg transition"
                            title="Delete Leader"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {paginatedLeaders.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-500 italic">
                      {loading ? 'Fetching leadership mainframe...' : 'No leaders found matching criteria.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedLeaders.map((leader) => (
            <div key={leader.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-cyan-800/60 transition group">
              <div className="flex items-start gap-3">
                <div className="w-14 h-18 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center relative">
                  {leader.profile_image ? (
                    <img src={leader.profile_image} alt={leader.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-slate-600" />
                  )}
                  <span className="absolute bottom-0 inset-x-0 text-[8px] font-mono text-center font-bold bg-slate-950/90 text-cyan-400 py-0.5">
                    #{leader.display_order}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-cyan-500 font-bold">{leader.organization_id || `TRSV-LEAD-${leader.id}`}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      leader.status === 'Active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}>
                      {leader.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-100 truncate text-sm mt-0.5">{leader.full_name}</h3>
                  <p className="text-xs font-semibold text-blue-400 mt-0.5">{leader.designation}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{leader.district || 'Statewide'} • {leader.constituency_name || 'Telangana'}</p>
                </div>
              </div>

              {leader.biography && (
                <p className="text-[11px] text-slate-400 line-clamp-2 italic bg-slate-950/50 p-2 rounded-lg border border-slate-800/50">
                  "{leader.biography}"
                </p>
              )}

              <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                <div className="text-[10px] text-slate-500 font-mono">
                  Joined: {leader.joining_date ? leader.joining_date.split('T')[0] : '—'}
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setPreviewLeader(leader)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleOpenEdit(leader)} className="p-1.5 bg-cyan-950/60 text-cyan-400 border border-cyan-800 rounded-lg">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeletingLeader(leader)} className="p-1.5 bg-rose-950/40 text-rose-400 border border-rose-800 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Pagination Controls ─── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 px-4 py-3 rounded-xl">
          <div className="text-xs text-slate-400">
            Page <span className="font-bold text-slate-200">{currentPage}</span> of <span className="font-bold text-slate-200">{totalPages}</span> ({filteredLeaders.length} leaders)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 bg-slate-950 hover:bg-slate-800 disabled:opacity-30 rounded-lg border border-slate-800 text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 bg-slate-950 hover:bg-slate-800 disabled:opacity-30 rounded-lg border border-slate-800 text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL 1: ADD / EDIT LEADER FORM ─── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0 animate-fadeIn my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-slate-100 text-base">
                  {editingLeader ? 'Edit Leader Details' : 'Add New Union Leader'}
                </h3>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveLeader} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Photo Preview + URL */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="w-20 h-24 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center relative">
                  {formData.profile_image ? (
                    <img src={formData.profile_image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-slate-600" />
                  )}
                </div>
                <div className="flex-1 space-y-2 w-full">
                  <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400" /> Profile Photo URL / Path
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /karthiknew.jpeg or https://..."
                    value={formData.profile_image}
                    onChange={e => setFormData({ ...formData, profile_image: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    Use public asset path (e.g. <code>/photo.jpg</code>) or direct HTTPS image URL.
                  </p>
                </div>
              </div>

              {/* Grid: Full Name & Org ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kavitha Garu"
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Organization ID</label>
                  <input
                    type="text"
                    placeholder="e.g. TRSV-LEAD-0001"
                    value={formData.organization_id}
                    onChange={e => setFormData({ ...formData, organization_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Grid: Designation Selector */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400">Designation / Role *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {DESIGNATION_PRESETS.map(preset => (
                      <option key={preset} value={preset}>{preset}</option>
                    ))}
                    <option value="CUSTOM">Custom Designation...</option>
                  </select>

                  {formData.designation === 'CUSTOM' && (
                    <input
                      type="text"
                      placeholder="Enter custom title..."
                      value={formData.custom_designation}
                      onChange={e => setFormData({ ...formData, custom_designation: e.target.value })}
                      className="w-full bg-slate-950 border border-cyan-800 rounded-lg p-2 text-xs text-cyan-300 focus:outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Grid: District & Constituency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">District</label>
                  <input
                    type="text"
                    placeholder="e.g. Hyderabad"
                    value={formData.district}
                    onChange={e => {
                      const newDist = e.target.value;
                      const tag = computeLocationTag(newDist, formData.constituency_name);
                      const numPart = formData.organization_id.split('-').pop() || '0001';
                      setFormData({
                        ...formData,
                        district: newDist,
                        organization_id: `TRSV-${tag}-${numPart}`
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Constituency</label>
                  <input
                    type="text"
                    placeholder="e.g. Greater Hyderabad"
                    value={formData.constituency_name}
                    onChange={e => {
                      const newConst = e.target.value;
                      const tag = computeLocationTag(formData.district, newConst);
                      const numPart = formData.organization_id.split('-').pop() || '0001';
                      setFormData({
                        ...formData,
                        constituency_name: newConst,
                        organization_id: `TRSV-${tag}-${numPart}`
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Grid: Email & Password (Login Credentials) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1">
                    Email Address * (Required for Login)
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="leader@trsv.org"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                    {editingLeader ? 'New Password (Optional)' : 'Password * (Required for Login)'}
                  </label>
                  <input
                    type="password"
                    required={!editingLeader}
                    placeholder={editingLeader ? 'Leave blank to keep existing' : 'Assign login password...'}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Biography */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Biography / About</label>
                <textarea
                  rows="3"
                  placeholder="Summary of responsibilities and achievements..."
                  value={formData.biography}
                  onChange={e => setFormData({ ...formData, biography: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Grid: Joining Date, Display Order, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Joining Date</label>
                  <input
                    type="date"
                    value={formData.joining_date}
                    onChange={e => setFormData({ ...formData, joining_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.display_order}
                    onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Public Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Active">Active (Visible)</option>
                    <option value="Inactive">Inactive (Hidden)</option>
                    <option value="Hidden">Hidden (Internal Only)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : (editingLeader ? 'Update Leader' : 'Create Leader')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: LIVE CARD PREVIEW ─── */}
      {previewLeader && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl space-y-4 p-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Live Public Card Preview
              </span>
              <button onClick={() => setPreviewLeader(null)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Public CinematicCard */}
            <div className="rounded-2xl bg-white text-slate-900 shadow-xl overflow-hidden border border-slate-200">
              <div className="w-full aspect-[3/4] relative overflow-hidden bg-slate-950">
                {previewLeader.profile_image ? (
                  <img src={previewLeader.profile_image} alt={previewLeader.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none">
                    <User className="w-12 h-12 text-blue-400 mb-2" />
                    <span className="text-[10px] font-semibold text-blue-400 uppercase">{shortName} Leader</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-85" />

                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-blue-900/90 text-blue-200 border border-blue-700 text-[9px] font-bold uppercase tracking-wider">
                  {previewLeader.designation}
                </div>

                <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 text-white">
                  <h3 className="text-lg font-bold">{previewLeader.full_name}</h3>
                  <div className="text-[10px] text-cyan-400 font-mono">{previewLeader.organization_id}</div>
                </div>
              </div>

              <div className="p-4 text-left">
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {previewLeader.biography || `${previewLeader.designation} of ${shortName} union serving ${previewLeader.constituency_name || previewLeader.district || 'Statewide'} region.`}
                </p>
              </div>
            </div>

            <button
              onClick={() => setPreviewLeader(null)}
              className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs border border-slate-800"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: DELETE CONFIRMATION ─── */}
      {deletingLeader && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-900/50 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-slate-100 text-base">Confirm Deletion</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete leader <strong className="text-white">{deletingLeader.full_name}</strong> ({deletingLeader.designation})?
            </p>
            <p className="text-[11px] text-slate-500">
              This action will delete the leader record from the database and remove them from all public portal pages immediately.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setDeletingLeader(null)}
                className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLeader}
                disabled={actionLoading}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow-md disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default {
  id: 'leaders',
  name: 'Leadership Management',
  icon: 'Shield',
  panels: [
    { id: 'management', name: 'Leadership Directory & CMS', component: LeadersManagementPanel }
  ],
  searchIndex: [
    { query: 'Manage union leaders', action: 'management' },
    { query: 'Add edit delete leader CMS', action: 'management' },
    { query: 'Reorder leadership priority display', action: 'management' }
  ]
};
