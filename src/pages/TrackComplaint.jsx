import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  SearchCheck, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle, 
  ChevronRight, 
  Eye, 
  MapPin, 
  Building, 
  Calendar, 
  ShieldCheck,
  RefreshCw,
  X
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import AnimatedSection from '../components/AnimatedSection';
import PremiumButton from '../components/PremiumButton';
import { useOrg } from '../context/OrgContext';
import { useAuth } from '../context/AuthContext';

export default function TrackComplaint() {
  const { shortName } = useOrg();
  const { userProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const openTicketId = searchParams.get('open_ticket_id');

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  useEffect(() => {
    if (openTicketId && complaints.length > 0) {
      const match = complaints.find(c => c.id === parseInt(openTicketId) || c.ticket_id === openTicketId);
      if (match) setSelectedComplaint(match);
    }
  }, [openTicketId, complaints]);

  const fetchMyComplaints = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('trsv_session_token');
      const res = await fetch('/api/complaints/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.complaints) {
        setComplaints(data.complaints);
      } else {
        // Fallback fetch from public list filtered by user if needed
        const resPublic = await fetch('/api/complaints', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataPublic = await resPublic.json();
        if (dataPublic.success && dataPublic.complaints) {
          const myOnly = dataPublic.complaints.filter(c => c.user_id === userProfile?.id || c.student_email === userProfile?.email);
          setComplaints(myOnly.length > 0 ? myOnly : dataPublic.complaints);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch user complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'RESOLVED' || s === 'SOLVED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle className="w-3.5 h-3.5" /> Resolved
        </span>
      );
    }
    if (s === 'UNDER REVIEW' || s === 'IN PROGRESS' || s === 'ASSIGNED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Clock className="w-3.5 h-3.5 animate-pulse" /> Under Review
        </span>
      );
    }
    if (s === 'REJECTED' || s === 'DISMISSED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <XCircle className="w-3.5 h-3.5" /> Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
        <AlertCircle className="w-3.5 h-3.5" /> Pending Dispatch
      </span>
    );
  };

  const getTimelineSteps = (status) => {
    const s = (status || '').toUpperCase();
    const steps = [
      { label: 'Registered', done: true },
      { label: 'Assigned to Lead', done: ['UNDER REVIEW', 'IN PROGRESS', 'ASSIGNED', 'RESOLVED', 'SOLVED'].includes(s) },
      { label: 'Investigation', done: ['UNDER REVIEW', 'IN PROGRESS', 'RESOLVED', 'SOLVED'].includes(s) },
      { label: 'Resolution', done: ['RESOLVED', 'SOLVED'].includes(s) }
    ];
    return steps;
  };

  const filteredComplaints = complaints.filter(item => {
    const matchesSearch = 
      (item.ticket_id || item.id || '').toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.subject || item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.college || item.college_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedStatus === 'ALL') return matchesSearch;
    const s = (item.status || '').toUpperCase();
    if (selectedStatus === 'PENDING') return matchesSearch && (s === 'PENDING' || s === 'NEW');
    if (selectedStatus === 'UNDER_REVIEW') return matchesSearch && (s === 'UNDER REVIEW' || s === 'IN PROGRESS' || s === 'ASSIGNED');
    if (selectedStatus === 'RESOLVED') return matchesSearch && (s === 'RESOLVED' || s === 'SOLVED');
    if (selectedStatus === 'REJECTED') return matchesSearch && (s === 'REJECTED' || s === 'DISMISSED');
    return matchesSearch;
  });

  return (
    <div className="w-full flex flex-col gap-8 py-8 animate-fadeIn text-left">
      
      {/* Header */}
      <AnimatedSection direction="up" className="text-center max-w-3xl mx-auto flex flex-col gap-3">
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-widest uppercase flex items-center justify-center gap-2">
          <SearchCheck className="w-4 h-4 text-amber-500" /> Real-time Grievance Tracking
        </span>
        <h1 className="fluid-heading-2 font-bold text-slate-900 dark:text-white leading-tight">
          Track Your Complaints
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          Monitor the live investigation status, assigned officer progress, and official resolution timeline for your submitted grievances.
        </p>
      </AnimatedSection>

      {/* Controls & Filter Bar */}
      <AnimatedSection delay={0.05} className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by Ticket ID, title or campus..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {['ALL', 'PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                selectedStatus === st
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
          
          <button
            onClick={fetchMyComplaints}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600"
            title="Refresh Complaints"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

      </AnimatedSection>

      {/* Complaints List Grid */}
      <AnimatedSection delay={0.1} className="flex flex-col gap-4">
        {loading ? (
          <div className="w-full py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-500">Retrieving grievance records...</span>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <GlassCard className="p-12 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 flex items-center justify-center">
              <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex flex-col items-center text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No Complaints Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto text-center">
                You have not submitted any complaints matching the selected filter. If you are experiencing ragging or campus issues, lodge a new complaint.
              </p>
            </div>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredComplaints.map((item) => {
              const timeline = getTimelineSteps(item.status);
              return (
                <GlassCard key={item.id} hoverEffect className="p-6 flex flex-col gap-5">
                  
                  {/* Top Row: Ticket ID + Status */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1 rounded-lg bg-blue-600/10 border border-blue-600/20 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold">
                        #{item.ticket_id || `${shortName}-${item.id}`}
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        Submitted: {new Date(item.created_at || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  {/* Body Content */}
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex flex-col gap-1.5 max-w-3xl">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {item.subject || item.title || 'Campus Incident Report'}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {item.description || item.content || 'No detailed description logged.'}
                      </p>

                      <div className="flex flex-wrap gap-4 mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {(item.college || item.college_name) && (
                          <span className="flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            {item.college || item.college_name}
                          </span>
                        )}
                        {(item.district || item.constituency) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-500" />
                            {item.district || item.constituency}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedComplaint(item)}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0"
                    >
                      <Eye className="w-4 h-4" /> Track Details
                    </button>
                  </div>

                  {/* Mini Stepper Progress */}
                  <div className="pt-2">
                    <div className="grid grid-cols-4 gap-2">
                      {timeline.map((step, idx) => (
                        <div key={idx} className="flex flex-col gap-1.5">
                          <div className={`h-1.5 rounded-full transition-all duration-300 ${
                            step.done ? 'bg-blue-600 dark:bg-blue-500' : 'bg-slate-200 dark:bg-slate-800'
                          }`} />
                          <span className={`text-[10px] font-semibold truncate ${
                            step.done ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </GlassCard>
              );
            })}
          </div>
        )}
      </AnimatedSection>

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col gap-6 text-left">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block">
                  Official Grievance Detail
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                  #{selectedComplaint.ticket_id || `${shortName}-${selectedComplaint.id}`}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedComplaint(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Subject</span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedComplaint.subject || selectedComplaint.title || 'Grievance Report'}
                </h4>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Full Description</span>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  {selectedComplaint.description || selectedComplaint.content || 'No full description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 font-medium block">Current Status</span>
                  <div className="mt-1">{getStatusBadge(selectedComplaint.status)}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 font-medium block">Assigned Officer</span>
                  <span className="font-bold text-slate-900 dark:text-white mt-1 block">
                    {selectedComplaint.assigned_to || selectedComplaint.handler || 'State Grievance Cell'}
                  </span>
                </div>
              </div>

              {selectedComplaint.resolution && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                    Official Resolution Remarks
                  </span>
                  <p className="text-emerald-700 dark:text-emerald-400 leading-relaxed">
                    {selectedComplaint.resolution}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold"
              >
                Close Tracking View
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
