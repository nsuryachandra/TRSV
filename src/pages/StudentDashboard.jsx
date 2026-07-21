import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ShieldCheck, 
  BookOpen, 
  HelpCircle, 
  FileText, 
  ChevronRight, 
  CheckCircle2, 
  RefreshCw, 
  AlertTriangle, 
  ShieldAlert, 
  Building, 
  MapPin,
  SearchCheck,
  MessageSquare,
  Volume2,
  Calendar,
  Image as ImageIcon,
  ArrowRight,
  Info,
  Clock,
  Sparkles,
  Users,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';
import ComplaintDetailsModal from '../components/ComplaintDetailsModal';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const openTicketId = searchParams.get('open_ticket_id');
  const { userProfile, refreshProfile } = useAuth();
  const { shortName, fullName } = useOrg();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  // Additional preview data states for Dashboard V2
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);

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

  // Trigger security warning modal on first visit
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

  // Fetch announcements & events for dashboard V2 preview cards
  useEffect(() => {
    const fetchPreviews = async () => {
      try {
        const token = localStorage.getItem('trsv_session_token');
        const headers = { 'Authorization': `Bearer ${token}` };

        const [annRes, evRes] = await Promise.all([
          fetch('/api/announcements', { headers }).catch(() => null),
          fetch('/api/modules/events', { headers }).catch(() => null)
        ]);

        if (annRes && annRes.ok) {
          const annData = await annRes.json();
          if (annData.success && annData.announcements) {
            setAnnouncements(annData.announcements.slice(0, 3));
          }
        }

        if (evRes && evRes.ok) {
          const evData = await evRes.json();
          if (evData.success && evData.events) {
            setEvents(evData.events.slice(0, 3));
          }
        }
      } catch (err) {
        console.warn('Failed to load dashboard previews:', err);
      }
    };

    fetchPreviews();
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

  const renderStatusStepper = (status) => {
    const stages = ['Registered', 'Started', 'Solved'];
    let currentIdx = 0;
    const st = (status || '').trim();
    if (st === 'Complaint Registered' || st === 'Audit Phase' || st === 'Registered' || st === 'Pending') {
      currentIdx = 0;
    } else if (st === 'Solving Started' || st === 'Processing' || st === 'In Progress' || st === 'Complaint Verified' || st === 'Verified' || st === 'Started') {
      currentIdx = 1;
    } else if (st === 'Solved' || st === 'Resolved') {
      currentIdx = 2;
    } else if (st === 'Dismissed' || st === 'Rejected') {
      currentIdx = -1;
    }

    if (currentIdx === -1) {
      return (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-600 dark:text-rose-400 font-semibold">
          <XCircle className="w-3.5 h-3.5" /> Rejected
        </div>
      );
    }

    const shortLabels = ['Registered', 'Started', 'Solved'];

    return (
      <div className="flex items-center gap-2 mt-3 w-full bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
        {stages.map((stage, idx) => {
          const isCompleted = currentIdx >= idx;
          const isActive = currentIdx === idx;
          return (
            <React.Fragment key={idx}>
              <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/20' 
                    : isCompleted 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                }`}>
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span className={`text-[9px] font-semibold tracking-tight truncate max-w-full uppercase ${
                  isActive 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : isCompleted 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {shortLabels[idx]}
                </span>
              </div>
              {idx < stages.length - 1 && (
                <div className={`h-0.5 flex-1 max-w-[40px] rounded transition-colors ${
                  currentIdx > idx ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
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

  const quickActions = [
    { label: 'Register Complaint', icon: FileText, path: '/dashboard/contact', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-900/60' },
    { label: 'Track Status', icon: SearchCheck, path: '/dashboard/track-complaint', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/60' },
    { label: 'Student Community', icon: MessageSquare, path: '/dashboard/social-chat', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200/80 dark:border-purple-900/60' },
    { label: 'Announcements', icon: Volume2, path: '/dashboard/announcements', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/60' },
    { label: 'State Events', icon: Calendar, path: '/dashboard/events', color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200/80 dark:border-cyan-900/60' },
    { label: 'Media Gallery', icon: ImageIcon, path: '/dashboard/gallery', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900/60' },
  ];

  return (
    <div className="w-full flex flex-col gap-6 text-left select-none animate-fadeIn pb-10">
      
      {/* 1. WELCOME BANNER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[11px] font-semibold border border-blue-200 dark:border-blue-800/60">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Official Student Portal
          </div>
          
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
            Welcome back, {userProfile?.full_name || 'Student'}
          </h1>
          
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
            Statewide Grievance & Emergency Protocol active. Dispatch escalations directly to assigned Constituency Leaders.
          </p>
        </div>
        
        <button 
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition flex items-center gap-2 cursor-pointer shrink-0 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Session'}
        </button>
      </div>

      {/* 2. MOST IMPORTANT INFORMATION (Key Status Metrics Focus) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between gap-2">
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">{activeTickets.length}</span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Active Grievances</span>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between gap-2">
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">{resolvedTickets.length}</span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Resolved Cases</span>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between gap-2 truncate">
          <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {userProfile?.college_name && userProfile.college_name !== 'Not Set' ? userProfile.college_name : 'Not Mapped'}
          </span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Campus Assignment</span>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between gap-2 truncate">
          <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {userProfile?.constituency_name || 'Not Mapped'}
          </span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Assembly Constituency</span>
        </div>
      </div>

      {/* 3. QUICK ACTIONS */}
      <div className="flex flex-col gap-2.5">
        <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action, idx) => {
            const IconComponent = action.icon;
            return (
              <div
                key={idx}
                onClick={() => navigate(action.path)}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-blue-500/50 transition-all flex flex-col items-center text-center gap-2 cursor-pointer group"
              >
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center group-hover:scale-105 transition-transform ${action.bg}`}>
                  <IconComponent className={`w-4.5 h-4.5 ${action.color}`} />
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {action.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. RECENT UPDATES (My Issues & Grievances Tracker) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs flex flex-col gap-4 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
              My Registered Grievances
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live status updates on complaints submitted to your constituency officers.
            </p>
          </div>
          
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setTicketTab('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                ticketTab === 'active'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              Open ({activeTickets.length})
            </button>
            <button
              type="button"
              onClick={() => setTicketTab('resolved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                ticketTab === 'resolved'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              Resolved ({resolvedTickets.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1 custom-sidebar-scrollbar min-h-[140px]">
            {currentTabTickets.length > 0 ? (
              currentTabTickets.map((t) => (
                <div 
                  key={t.id} 
                  onClick={() => setSelectedTicketId(t.id)}
                  className="flex flex-col p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 cursor-pointer hover:border-blue-500/50 transition-all gap-2"
                >
                  <div className="flex items-start justify-between min-w-0">
                    <div className="flex flex-col text-left min-w-0 max-w-[70%]">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        {t.title}
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5 truncate flex items-center gap-1.5 flex-wrap">
                        Ticket #{t.id} • {new Date(t.created_at).toLocaleDateString()}
                        {t.attachment_url && (
                          <a 
                            href={t.attachment_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-medium border border-blue-200 dark:border-blue-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Evidence Attached
                          </a>
                        )}
                      </span>
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shrink-0 ${
                      t.status === 'Resolved' || t.status === 'Solved' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' :
                      t.status === 'Under Investigation' || t.status === 'In Progress' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' :
                      'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  
                  {renderStatusStepper(t.status)}
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-xs text-slate-500 font-medium">
                {ticketTab === 'active' ? 'No active grievances registered.' : 'No resolved grievances recorded yet.'}
              </div>
            )}
          </div>
        )}

        {cooldownRemaining > 0 ? (
          <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-center">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <span className="text-xs font-semibold uppercase tracking-wider">⏳ Submission Cooldown</span>
              <span className="font-mono font-bold text-xs">{formatCooldown(cooldownRemaining)}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Next issue submission available after cooldown expires.</p>
          </div>
        ) : (
          <button
            type="button"
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            onClick={() => navigate('/dashboard/contact')}
          >
            <FileText className="w-4 h-4" /> Register New Grievance
          </button>
        )}
      </div>

      {/* 5. ACTIVITY & PREVIEWS (Announcements, Events & Community) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full items-stretch">
        
        {/* Latest Announcements */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4 text-left">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <span className="font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-amber-500" /> Announcements
            </span>
            <button 
              onClick={() => navigate('/dashboard/announcements')}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {announcements.length > 0 ? (
              announcements.map((note) => (
                <div 
                  key={note.id} 
                  onClick={() => navigate('/dashboard/announcements')}
                  className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-500/40 transition flex flex-col gap-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[10px] font-semibold">
                    <span className="text-amber-700 dark:text-amber-300 uppercase">
                      {note.target_audience === 'all' ? 'Statewide' : note.target_audience}
                    </span>
                    <span className="text-slate-400 font-normal">
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-1">
                    {note.title}
                  </h3>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                No active announcements.
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4 text-left">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <span className="font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-cyan-500" /> State Events
            </span>
            <button 
              onClick={() => navigate('/dashboard/events')}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {events.length > 0 ? (
              events.map((ev) => (
                <div 
                  key={ev.id} 
                  onClick={() => navigate('/dashboard/events')}
                  className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-500/40 transition flex flex-col gap-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[10px] font-semibold">
                    <span className="text-cyan-700 dark:text-cyan-300 uppercase">
                      {ev.location || 'Campus Event'}
                    </span>
                    <span className="text-slate-400 font-normal">
                      {ev.event_date ? new Date(ev.event_date).toLocaleDateString() : 'Upcoming'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-1">
                    {ev.title}
                  </h3>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                No scheduled events.
              </div>
            )}
          </div>
        </div>

        {/* Community Discussion */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4 text-left">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <span className="font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-purple-500" /> Student Community
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Live
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Engage with fellow union members across campuses and participate in active student welfare forums.
          </p>

          <button
            onClick={() => navigate('/dashboard/social-chat')}
            className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            Open Student Hub <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* 6. ADDITIONAL INFORMATION (Campus & Constituency Mapping) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs flex flex-col gap-5 text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <Building className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-semibold text-base text-slate-900 dark:text-white tracking-tight">
              Campus & Assembly Constituency Mapping
            </h2>
          </div>
          
          {userProfile?.college_name && userProfile.college_name !== 'Not Set' ? (
            <span className="text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Details Locked
            </span>
          ) : (
            <span className="text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-3 py-1 rounded-full flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Details Not Set
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
          <div className="lg:col-span-2 flex flex-col gap-4 justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  College / School Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. JNTU Hyderabad / Aurora College"
                  value={collegeSearch}
                  onChange={(e) => {
                    setCollegeSearch(e.target.value);
                    setSaveSuccess('');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-slate-50/50 dark:bg-slate-950 text-xs focus:outline-none focus:border-blue-600 border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Assembly Constituency
                </label>
                <select
                  value={selectedConstituencyId}
                  onChange={(e) => setSelectedConstituencyId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-slate-50/50 dark:bg-slate-950 text-xs focus:outline-none focus:border-blue-600 border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  {constituencies.map(con => (
                    <option key={con.id} value={con.id}>
                      {con.constituency_name === 'Upcoming Area' || con.constituency_name === 'Upcoming Area Node'
                        ? 'Not Listed (Send to All State Leaders)'
                        : con.constituency_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleLockCoordinates}
                disabled={savingMap || !collegeSearch}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {savingMap ? 'Locking Details...' : 'Lock Profile Details'}
              </button>

              {saveSuccess && (
                <p className={`text-xs font-semibold mt-1 text-left ${saveSuccess.startsWith('❌') ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {saveSuccess}
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-3 w-full flex flex-col justify-between p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50">
            <div className="flex flex-col gap-3 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-white text-xs">
                Constituency Identification Steps
              </span>
              <p className="leading-relaxed">
                1. Check the postal pincode of your college campus.<br/>
                2. Search Google for <span className="font-mono text-blue-600 dark:text-blue-400 font-medium">"[pincode] assembly constituency"</span>.<br/>
                3. Match and select your constituency from the dropdown above.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Official Grievance Details Modal */}
      {selectedTicketId && (
        <ComplaintDetailsModal 
          ticketId={selectedTicketId} 
          onClose={() => setSelectedTicketId(null)} 
          userProfile={userProfile} 
        />
      )}

      {/* Security Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
          <div className="max-w-md w-full mx-4 p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Genuine Grievance Notice
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Official {shortName} Guidelines
              </p>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Issues logged in the portal are transmitted directly to regional governance boards. 
              Filing false issues is strictly prohibited and will result in credential suspension.
            </p>

            <button
              type="button"
              onClick={handleAcceptWarning}
              className="w-full py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer"
            >
              OK, I Understand & Accept
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
