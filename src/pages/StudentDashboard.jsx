import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, BookOpen, Download, HelpCircle, FileText, ChevronRight, CheckCircle2, RefreshCw, AlertTriangle, ShieldAlert, Building, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';
import GlassCard from '../components/GlassCard';
import PremiumButton from '../components/PremiumButton';
import ComplaintDetailsModal from '../components/ComplaintDetailsModal';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const openTicketId = searchParams.get('open_ticket_id');
  const { userProfile, refreshProfile } = useAuth();
  const { shortName } = useOrg();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  // 6-hour submission cooldown
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const formatCooldown = (ms) => {
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  };

  useEffect(() => {
    if (openTicketId) {
      setSelectedTicketId(parseInt(openTicketId));
    }
  }, [openTicketId]);

  // Manual Profile Location & Selection States
  const [constituencies, setConstituencies] = useState([]);
  const [collegeSearch, setCollegeSearch] = useState(userProfile?.college_name && userProfile.college_name !== 'Not Set' ? userProfile.college_name : '');
  const [selectedConstituencyId, setSelectedConstituencyId] = useState(userProfile?.constituency_id && userProfile.constituency_id !== 'Not Set' ? userProfile.constituency_id : '');
  const [savingMap, setSavingMap] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Trigger luxury security alert modal on dashboard visit
  useEffect(() => {
    const accepted = localStorage.getItem('trsv_warning_accepted');
    if (!accepted) {
      setShowWarningModal(true);
    }
  }, []);

  const handleAcceptWarning = () => {
    localStorage.setItem('trsv_warning_accepted', 'true');
    setShowWarningModal(false);
  };

  // Sync profile details if available
  useEffect(() => {
    if (userProfile) {
      if (userProfile.college_name && userProfile.college_name !== 'Not Set') {
        setCollegeSearch(userProfile.college_name);
      }
      if (userProfile.constituency_id && userProfile.constituency_id !== 'Not Set') {
        setSelectedConstituencyId(userProfile.constituency_id.toString());
      }
    }
  }, [userProfile]);

  // Load constituencies
  useEffect(() => {
    const fetchConstituencies = async () => {
      try {
        const response = await fetch('/api/constituencies');
        const data = await response.json();
        if (data.success) {
          setConstituencies(data.constituencies);
          // If no constituency is preselected, default to the first one
          if (!selectedConstituencyId && data.constituencies.length > 0) {
            setSelectedConstituencyId(data.constituencies[0].id.toString());
          }
        }
      } catch (error) {
        console.error('Failed to load constituencies:', error);
      }
    };
    fetchConstituencies();
  }, []);

  const handleLockCoordinates = async () => {
    if (!collegeSearch) return;
    setSavingMap(true);
    setSaveSuccess('');
    try {
      const tokenVal = localStorage.getItem('trsv_session_token');
      const response = await fetch('/api/auth/update-college', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenVal}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          collegeName: collegeSearch,
          constituencyId: selectedConstituencyId || userProfile?.constituency_id || '1'
        })
      });
      const data = await response.json();
      if (data.success) {
        setSaveSuccess('🎉 Profile campus & constituency details locked successfully!');
        await refreshProfile();
      } else {
        setSaveSuccess(`❌ Sync failure: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      setSaveSuccess('❌ Network synchronization error.');
    } finally {
      setSavingMap(false);
    }
  };

  // Fetch real student complaints raised from database
  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('trsv_session_token');
      const response = await fetch('/api/complaints', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setTickets(data.complaints);
      }
    } catch (error) {
      console.error('Failed to load student complaints:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Compute cooldown from latest ticket
  useEffect(() => {
    if (tickets && tickets.length > 0) {
      const latestTime = new Date(tickets[0].created_at).getTime();
      const diffMs = Date.now() - latestTime;
      const cooldownMs = 6 * 60 * 60 * 1000;
      setCooldownRemaining(diffMs < cooldownMs ? cooldownMs - diffMs : 0);
    } else {
      setCooldownRemaining(0);
    }
  }, [tickets]);

  // Tick cooldown timer every second
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const interval = setInterval(() => {
      setCooldownRemaining(prev => {
        if (prev <= 1000) { clearInterval(interval); return 0; }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownRemaining > 0]);

  const handleSync = async () => {
    setSyncing(true);
    await refreshProfile();
    await fetchComplaints();
    setSyncing(false);
  };

  const [ticketTab, setTicketTab] = useState('active'); // 'active' | 'resolved'

  const getUrgencyBadge = (urgency) => {
    const maps = {
      critical: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      high: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      medium: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
      low: 'bg-green-500/10 text-green-500 border-green-500/20'
    };
    return maps[urgency?.toLowerCase()] || maps.medium;
  };

  const renderStatusStepper = (status) => {
    const stages = ['Issue Registered', 'Issue Verified', 'Solving Started', 'Solved'];
    let currentIdx = 0;
    if (status === 'Complaint Registered' || status === 'Audit Phase' || status === 'Registered') {
      currentIdx = 0;
    } else if (status === 'Complaint Verified' || status === 'Verified') {
      currentIdx = 1;
    } else if (status === 'Solving Started' || status === 'Processing' || status === 'In Progress') {
      currentIdx = 2;
    } else if (status === 'Solved' || status === 'Resolved') {
      currentIdx = 3;
    } else if (status === 'Dismissed') {
      currentIdx = -1;
    }

    if (currentIdx === -1) {
      return (
        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-rose-500 font-bold">
          <AlertTriangle className="w-3.5 h-3.5" /> Dismissed / Rejected
        </div>
      );
    }

    const shortLabels = ['Registered', 'Verified', 'Started', 'Solved'];

    return (
      <div className="flex items-center gap-2 mt-3 w-full bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-200/30 dark:border-slate-800">
        {stages.map((stage, idx) => {
          const isCompleted = currentIdx >= idx;
          const isActive = currentIdx === idx;
          return (
            <React.Fragment key={idx}>
              <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black transition-all ${
                  isActive 
                    ? 'bg-cyan-500 text-white shadow-glow-cyan animate-pulse scale-110' 
                    : isCompleted 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-450 dark:text-slate-600'
                }`}>
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span className={`text-[8px] font-extrabold tracking-tight truncate max-w-full uppercase ${
                  isActive 
                    ? 'text-cyan-500 font-black' 
                    : isCompleted 
                      ? 'text-emerald-500' 
                      : 'text-slate-405 dark:text-slate-500'
                }`}>
                  {shortLabels[idx]}
                </span>
              </div>
              {idx < stages.length - 1 && (
                <div className={`h-0.5 flex-1 max-w-[20px] rounded transition-colors ${
                  currentIdx > idx ? 'bg-emerald-500' : 'bg-slate-250 dark:bg-slate-800'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const activeTickets = tickets.filter(t => t.status !== 'Solved' && t.status !== 'Resolved' && t.status !== 'Dismissed');
  const resolvedTickets = tickets.filter(t => t.status === 'Solved' || t.status === 'Resolved');
  const currentTabTickets = ticketTab === 'active' ? activeTickets : resolvedTickets;

  return (
    <div className="w-full flex flex-col gap-6 text-left select-none animate-fadeIn">
      
      {/* 1. Dashboard Welcome System Card */}
      <div className="relative overflow-hidden rounded-2xl glass-panel-light dark:glass-panel-dark border border-slate-200/50 dark:border-slate-850 p-8 shadow-premium-light dark:shadow-premium-dark flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Glow ambient backing */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-500/10 to-transparent blur-xl pointer-events-none" />
        
        <div className="flex flex-col gap-2">
          {/* Subtitle/Role Tag badge */}
          <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-extrabold uppercase tracking-wider border border-cyan-500/20">
            Student Member Node
          </div>
          
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex flex-wrap items-center gap-x-2 gap-y-1">
            Welcome, {userProfile?.full_name || 'User'} <span className="text-slate-300 dark:text-slate-750 hidden sm:inline">|</span> <span className="text-gradient-cyan block sm:inline">{userProfile?.role === 'dev' ? 'Developer' : userProfile?.role === 'supreme_admin' ? 'Supreme Admin' : 'Student'}</span>
          </h2>
          
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xl leading-relaxed">
            Registered Student Coordinator node active. Your digital identity credentials, local district cluster, and issue records are fully synchronized with the Neon database.
          </p>
        </div>
        
        <PremiumButton 
          variant="glow" 
          size="sm" 
          onClick={handleSync}
          disabled={syncing}
          icon={<RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />}
        >
          {syncing ? 'Syncing Network...' : 'Sync Profile'}
        </PremiumButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-stretch">
        
        {/* 2. Verified Student Identity Card */}
        <GlassCard hoverEffect={false} className="p-6 flex flex-col justify-between gap-6 border border-cyan-400/20 relative">
          <div className="absolute top-3 right-3">
            <ShieldAlert className="w-5 h-5 text-cyan-500" />
          </div>

          <div className="flex flex-col gap-4 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">My Profile</span>
            
            <div className="flex items-center gap-4 bg-slate-100/50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/30 dark:border-slate-850">
              {userProfile?.profile_image ? (
                <img 
                  src={userProfile.profile_image} 
                  alt={userProfile.full_name} 
                  className="w-14 h-14 rounded-full object-cover shadow-glow-cyan shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-500 to-cyan-400 text-white font-black text-xl flex items-center justify-center shadow-glow-cyan uppercase shrink-0">
                  {userProfile?.full_name ? userProfile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'ST'}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="font-black text-base text-slate-800 dark:text-white truncate">
                  {userProfile?.full_name}
                </span>
                <span className="text-[11px] font-semibold text-cyan-500 mt-0.5 truncate">
                  {userProfile?.college_name || 'Not Set'}
                </span>
                <span className="text-[9px] text-slate-450 mt-0.5 font-mono">
                  ID: #{userProfile?.id ? userProfile.id.substring(0, 8).toUpperCase() : 'MOCK_ID'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 text-xs text-slate-500 dark:text-slate-400 text-left border-t border-slate-200/50 dark:border-slate-850 pt-4">
            <div className="flex justify-between">
              <span>Role:</span>
              <strong className="text-slate-800 dark:text-slate-200">
                {userProfile?.role ? userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1) : 'Student'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Constituency:</span>
              <strong className="text-slate-800 dark:text-slate-250">
                {userProfile?.constituency_name || 'Not Set'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>District:</span>
              <strong className="text-slate-800 dark:text-slate-255">
                {userProfile?.district || 'Not Set'}
              </strong>
            </div>
          </div>
        </GlassCard>

        {/* 3. Complaints Dispatch Tracker */}
        <div className="lg:col-span-2">
          <GlassCard hoverEffect={false} className="p-6 h-full flex flex-col justify-between gap-4 text-left">
            <div className="flex flex-col gap-2 border-b border-slate-200/50 dark:border-slate-850 pb-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-700 dark:text-white uppercase tracking-wider">My Issues</span>
                <span className="text-xs text-slate-400">{tickets.length} Logged</span>
              </div>
              
              {/* Tab Selector */}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setTicketTab('active')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    ticketTab === 'active'
                      ? 'bg-cyan-500 text-white border-cyan-500 shadow-glow-cyan'
                      : 'bg-white/40 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Open Issues ({activeTickets.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTicketTab('resolved')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    ticketTab === 'resolved'
                      ? 'bg-cyan-500 text-white border-cyan-500 shadow-glow-cyan'
                      : 'bg-white/40 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Resolved Issues ({resolvedTickets.length})
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center min-h-[150px]">
                <div className="w-8 h-8 rounded-full border-2 border-t-cyan-500 border-r-transparent border-slate-850 animate-spin" />
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-3 my-2 overflow-y-auto max-h-[220px] pr-1 custom-sidebar-scrollbar min-h-[150px]">
                {currentTabTickets.length > 0 ? (
                  currentTabTickets.map((t) => (
                    <div 
                      key={t.id} 
                      onClick={() => setSelectedTicketId(t.id)}
                      className="flex flex-col p-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-850 cursor-pointer hover:border-cyan-500/50 transition-all group gap-2"
                    >
                      <div className="flex items-start justify-between min-w-0">
                        <div className="flex flex-col text-left min-w-0 max-w-[70%]">
                          <span className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5 truncate">
                            <FileText className="w-4 h-4 text-cyan-500 shrink-0" />
                            {t.title}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 truncate flex items-center gap-1.5 flex-wrap">
                            Ticket #{t.id} • {new Date(t.created_at).toLocaleDateString()}
                            {t.attachment_url && (
                              <a 
                                href={t.attachment_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 dark:text-cyan-400 text-[8px] font-black uppercase tracking-wider transition-colors border border-cyan-500/15"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Evidence Attached
                              </a>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase ${getUrgencyBadge(t.urgency)}`}>
                            {t.urgency}
                          </span>
                        </div>
                      </div>
                      
                      {/* Live Stepper */}
                      {renderStatusStepper(t.status)}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-xs">
                    <AlertTriangle className="w-8 h-8 text-slate-400 mb-2 opacity-50" />
                    No tickets in this section. Submit a case to get immediate redressal.
                  </div>
                )}
              </div>
            )}

            {cooldownRemaining > 0 ? (
              <div className="mt-2 flex flex-col items-center gap-1.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">⏳ Cooldown</span>
                  <span className="font-mono font-black text-sm">{formatCooldown(cooldownRemaining)}</span>
                </div>
                <p className="text-[9px] text-slate-400 text-center">Next issue submission available after cooldown expires.</p>
              </div>
            ) : (
              <PremiumButton
                type="button"
                variant="primary"
                size="sm"
                className="w-full mt-2"
                onClick={() => navigate('/dashboard/contact')}
              >
                Get Help
              </PremiumButton>
            )}
          </GlassCard>
        </div>
      </div>

       {/* 4. Profile Location & Constituency Hub */}
      <GlassCard hoverEffect={false} className="p-6 flex flex-col gap-5 border border-cyan-500/10 relative overflow-hidden">
        {/* Glow backing */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-cyan-500/5 to-transparent blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/40 dark:border-slate-850 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
              <Building className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-left">
              <h3 className="font-black text-base text-slate-800 dark:text-white uppercase tracking-wider">
                📍 Campus & Constituency Selection
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Set your college campus name and select your assembly constituency to route your issues to the correct leaders.
              </p>
            </div>
          </div>
          
          {userProfile?.college_name && userProfile.college_name !== 'Not Set' ? (
            <span className="self-start md:self-center text-[9px] font-black bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
              ✓ Profile Details Locked: {userProfile.college_name}
            </span>
          ) : (
            <span className="self-start md:self-center text-[9px] font-black bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
              ⚠️ Details Not Set
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
          {/* Left Panel: College name and constituency dropdown */}
          <div className="lg:col-span-2 flex flex-col gap-4 text-left justify-between">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  College / School Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Aurora Technological Uppal"
                    value={collegeSearch}
                    onChange={(e) => {
                      setCollegeSearch(e.target.value);
                      setSaveSuccess('');
                    }}
                    className="peer w-full pl-11 pr-4 py-3 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-sm"
                  />
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-cyan-600 dark:text-cyan-400 pointer-events-none z-10" strokeWidth={2.2} />
                </div>
              </div>

              {/* Manual constituency select option */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Assembly Constituency
                </label>
                <div className="relative">
                  <select
                    value={selectedConstituencyId}
                    onChange={(e) => setSelectedConstituencyId(e.target.value)}
                    className="peer w-full pl-11 pr-4 py-3 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-855 dark:text-slate-100"
                  >
                    {constituencies.map(con => (
                      <option key={con.id} value={con.id}>
                        {con.constituency_name === 'Upcoming Area' || con.constituency_name === 'Upcoming Area Node'
                          ? 'Not Listed (Send to All State Leaders)'
                          : con.constituency_name}
                      </option>
                    ))}
                  </select>
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-cyan-600 dark:text-cyan-400 pointer-events-none z-10" strokeWidth={2.2} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {/* Lock details button */}
              <PremiumButton
                type="button"
                variant="glow"
                size="md"
                className="w-full"
                onClick={handleLockCoordinates}
                disabled={savingMap || !collegeSearch}
              >
                {savingMap ? 'Locking Details...' : 'Lock Profile Details'}
              </PremiumButton>

              {saveSuccess && (
                <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 text-left ${saveSuccess.startsWith('❌') ? 'text-rose-500' : 'text-emerald-500 dark:text-emerald-400'}`}>
                  {saveSuccess}
                </p>
              )}
            </div>
          </div>

          {/* Right Panel: How to find your constituency instructions */}
          <div className="lg:col-span-3 w-full flex flex-col justify-between p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-500/5 relative overflow-hidden">
            <div className="flex flex-col gap-4 text-left">
              <div className="flex items-center gap-2 text-cyan-500">
                <HelpCircle className="w-5 h-5 text-cyan-500" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Constituency Identification Guide
                </span>
              </div>
              <div className="flex flex-col gap-3.5 text-xs text-slate-650 dark:text-slate-400 font-semibold leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-[10px] text-cyan-500 font-black shrink-0 mt-0.5">1</div>
                  <p>
                    <strong className="text-slate-800 dark:text-slate-200">Get your Campus Pincode:</strong> Check the address of your college or school to locate its 6-digit postal pincode.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-[10px] text-cyan-500 font-black shrink-0 mt-0.5">2</div>
                  <p>
                    <strong className="text-slate-800 dark:text-slate-200">Search on Google:</strong> Type your college pincode followed by <span className="font-mono text-cyan-600 dark:text-cyan-400">"assembly constituency"</span> into Google search (e.g. search: <span className="font-mono text-cyan-600 dark:text-cyan-400">"500001 assembly constituency"</span>).
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-[10px] text-cyan-500 font-black shrink-0 mt-0.5">3</div>
                  <p>
                    <strong className="text-slate-800 dark:text-slate-200">Select & Save:</strong> Match the Google result with our constituency list dropdown. Click <span className="text-cyan-500">"Lock Profile Details"</span> to save.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-[10px] text-amber-500 font-black shrink-0 mt-0.5">!</div>
                  <p>
                    <strong className="text-amber-500">Not Listed?</strong> If your constituency is not present in our database, select <strong className="text-amber-500">"Not Listed (Send to All State Leaders)"</strong>. Your issue tickets will be dispatched globally to all state committee members.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {selectedTicketId && (
        <ComplaintDetailsModal 
          ticketId={selectedTicketId} 
          onClose={() => setSelectedTicketId(null)} 
          userProfile={userProfile} 
        />
      )}

      {showWarningModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="max-w-md w-full mx-4 p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-500 shadow-2xl text-center flex flex-col items-center gap-5 relative overflow-hidden animate-scaleUp">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-amber-500/15 to-transparent blur-xl pointer-events-none" />
            
            {/* Glowing warning icon container */}
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-bounce">
              <ShieldAlert className="w-9 h-9" />
            </div>

            <div className="flex flex-col gap-1.5 z-10">
              <h3 className="text-2xl font-black tracking-wider text-amber-600 dark:text-amber-400 uppercase">
                ⚠️ Be Alert!
              </h3>
              <p className="text-[10px] text-slate-555 dark:text-slate-400 font-extrabold uppercase tracking-widest">
                Official {shortName} Student Notice
              </p>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-semibold z-10">
              Issue tickets logged in the {shortName} Command Node are transmitted directly to regional boards. 
              <span className="text-amber-600 dark:text-amber-400 font-bold block mt-1">You must file only real and genuine issues.</span> 
              Filing simulated, fake, or false issues is strictly prohibited and will result in permanent student credential suspension.
            </p>

            <button
              type="button"
              onClick={handleAcceptWarning}
              className="w-full z-10 py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black uppercase text-xs tracking-wider transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] select-none cursor-pointer border border-amber-400/20"
            >
              OK, I Accept
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
