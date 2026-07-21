import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Shield, 
  Users, 
  Radio, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  ChevronRight, 
  Phone, 
  RefreshCw, 
  X, 
  Check,
  Search,
  FileText,
  Scan,
  Volume2,
  Calendar,
  Activity,
  ArrowRight,
  ShieldCheck,
  Building,
  MapPin,
  Eye,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ComplaintDetailsModal from '../components/ComplaintDetailsModal';
import RealtimeActivityFeed from '../components/RealtimeActivityFeed';
import { CategoryPieChart } from '../components/RechartsWidgets';
import EmergencyFallback from '../components/EmergencyFallback';
import ComplaintFilters from '../components/ComplaintFilters';
import HubChat from '../components/HubChat';

export default function LeaderDashboard() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { shortName } = useOrg();
  const [searchParams] = useSearchParams();
  const openTicketId = searchParams.get('open_ticket_id');
  const [activeTab, setActiveTab] = useState('complaints'); // 'complaints', 'applications'

  const [joinRequests, setJoinRequests] = useState([]);
  const [fetchingRequests, setFetchingRequests] = useState(false);
  const [requestMessage, setRequestMessage] = useState({ text: '', type: '' });
  const [approvingApp, setApprovingApp] = useState(null);
  const [selectedRole, setSelectedRole] = useState('student');

  // Preview data states for Dashboard V2
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);

  const [stats, setStats] = useState({
    totalComplaints: 0,
    pendingComplaints: 0,
    resolvedComplaints: 0,
    collegeNodes: 0,
    resolutionRate: 0,
    activeConstituencies: 0,
    activeColleges: 0
  });

  const [activeQueue, setActiveQueue] = useState([]);
  const [filteredQueue, setFilteredQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [connectionDropped, setConnectionDropped] = useState(false);

  useEffect(() => {
    if (openTicketId) {
      setSelectedTicketId(parseInt(openTicketId));
    }
  }, [openTicketId]);
  
  const [localCategories, setLocalCategories] = useState([]);
  const [localActivity, setLocalActivity] = useState([]);
  const [constituencyList, setConstituencyList] = useState([]);

  const fetchJoinRequests = async () => {
    setFetchingRequests(true);
    try {
      const token = localStorage.getItem('trsv_session_token');
      const res = await fetch('/api/join-tvrs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setJoinRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Failed to fetch join requests:', err);
    } finally {
      setFetchingRequests(false);
    }
  };

  const handleUpdateRequestStatus = async (id, status, assignedRole) => {
    try {
      const token = localStorage.getItem('trsv_session_token');
      const res = await fetch(`/api/join-tvrs/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, role: assignedRole || 'student' })
      });
      const data = await res.json();
      if (data.success) {
        setRequestMessage({ text: data.message || `Application ${status === 'Approved' ? 'approved' : 'rejected'} successfully.`, type: 'success' });
        setApprovingApp(null);
        fetchJoinRequests();
      } else {
        setRequestMessage({ text: data.message || 'Failed to update application status.', type: 'error' });
      }
    } catch (err) {
      setRequestMessage({ text: 'Network failure updating application.', type: 'error' });
    }
  };

  useEffect(() => {
    if (activeTab === 'applications') {
      fetchJoinRequests();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('trsv_session_token');
      
      // 1. Fetch live metrics
      const statsRes = await fetch('/api/dashboards/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // 2. Fetch scoped complaint ticket list
      const complaintsRes = await fetch('/api/complaints', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const complaintsData = await complaintsRes.json();
      if (complaintsData.success) {
        setActiveQueue(complaintsData.complaints);
        setFilteredQueue(complaintsData.complaints);
      }
      
      // Fetch constituencies list for filters
      const conRes = await fetch('/api/constituencies');
      const conData = await conRes.json();
      if (conData.success) {
        setConstituencyList(conData.constituencies);
      }

      // 3. Fetch localized telemetry & previews
      const [catRes, actRes, annRes, evRes] = await Promise.all([
        fetch('/api/analytics/categories', { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null),
        fetch('/api/transparency/activity').catch(() => null),
        fetch('/api/announcements', { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null),
        fetch('/api/modules/events', { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null)
      ]);

      if (catRes && catRes.ok) {
        const catData = await catRes.json();
        if (catData.success) setLocalCategories(catData.data);
      }
      if (actRes && actRes.ok) {
        const actData = await actRes.json();
        if (actData.success && actData.activity) {
          const mapped = actData.activity.map(a => ({
            event_type: a.category + '_Dispute',
            event_message: `Ticket #${a.id} updated in ${a.constituency_name || 'State'}`,
            severity: a.status === 'Resolved' ? 'success' : a.status === 'Under Investigation' ? 'warning' : 'info',
            created_at: a.updated_at
          }));
          setLocalActivity(mapped.slice(0, 8));
        }
      }
      if (annRes && annRes.ok) {
        const annData = await annRes.json();
        if (annData.success && annData.announcements) setAnnouncements(annData.announcements.slice(0, 2));
      }
      if (evRes && evRes.ok) {
        const evData = await evRes.json();
        if (evData.success && evData.events) setEvents(evData.events.slice(0, 2));
      }

      setConnectionDropped(false);
    } catch (error) {
      console.error('Failed to load leader operations telemetry:', error.message);
      setConnectionDropped(true);
    } finally {
      setLoading(false);
    }
  };

  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connectStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const token = localStorage.getItem('trsv_session_token');
    const isNativeMobile = Boolean(window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform() !== 'web');
    const base = isNativeMobile ? 'https://trsv-union.onrender.com' : '';
    const es = new EventSource(`${base}/api/realtime/stream?token=${token}`);
    eventSourceRef.current = es;

    es.onopen = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      setConnectionDropped(false);
    };

    es.onerror = () => {
      if (!reconnectTimeoutRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (es.readyState !== EventSource.OPEN) {
            setConnectionDropped(true);
          }
        }, 5000);
      }
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_COMPLAINT' || data.type === 'EMERGENCY_ACKNOWLEDGED') {
          fetchDashboardData();
        }
      } catch (err) {
        console.error('SSE Error:', err);
      }
    };
  }, []);

  useEffect(() => {
    fetchDashboardData();
    connectStream();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectStream]);

  const getUrgencyColor = (urgency) => {
    const maps = {
      critical: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      high: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      medium: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      low: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    };
    return maps[urgency?.toLowerCase()] || maps.medium;
  };

  const getStatsCards = () => {
    if (userProfile?.role === 'secretary') {
      return [
        { label: 'Campus Total Cases', val: stats.totalComplaints || 0, color: 'text-blue-600 dark:text-blue-400' },
        { label: 'Pending Audit', val: stats.pendingComplaints || 0, color: 'text-rose-600 dark:text-rose-400' },
        { label: 'Cases Resolved', val: stats.resolvedComplaints || 0, color: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Campus Clear Rate', val: `${stats.resolutionRate || 0}%`, color: 'text-cyan-600 dark:text-cyan-400' }
      ];
    } else if (userProfile?.role === 'general_secretary') {
      return [
        { label: 'Constituency Issues', val: stats.totalComplaints || 0, color: 'text-blue-600 dark:text-blue-400' },
        { label: 'Active Reviews', val: stats.pendingComplaints || 0, color: 'text-rose-600 dark:text-rose-400' },
        { label: 'Resolved Cases', val: stats.resolvedComplaints || 0, color: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Active Campus Nodes', val: stats.collegeNodes || 0, color: 'text-cyan-600 dark:text-cyan-400' }
      ];
    } else {
      return [
        { label: 'Statewide Incidents', val: stats.totalComplaints || 0, color: 'text-blue-600 dark:text-blue-400' },
        { label: 'Pending Reviews', val: stats.pendingComplaints || 0, color: 'text-rose-600 dark:text-rose-400' },
        { label: 'Statewide Resolutions', val: stats.resolvedComplaints || 0, color: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Monitored Campuses', val: stats.activeColleges || 0, color: 'text-cyan-600 dark:text-cyan-400' }
      ];
    }
  };

  const getRoleHeaderLabel = (role) => {
    const roles = {
      secretary: 'Campus Secretary',
      general_secretary: 'General Secretary',
      vice_president: 'Vice President',
      president: 'State President'
    };
    return roles[role] || 'Regional Leader';
  };

  const handleFilterChange = (filters) => {
    let result = [...activeQueue];

    if (filters.search) {
      result = result.filter(item => 
        item.title.toLowerCase().includes(filters.search) || 
        item.id.toString().includes(filters.search) ||
        (item.description && item.description.toLowerCase().includes(filters.search))
      );
    }

    if (filters.category !== 'all') {
      result = result.filter(item => item.category === filters.category);
    }

    if (filters.status !== 'all') {
      result = result.filter(item => item.status === filters.status);
    }

    if (filters.urgency !== 'all') {
      result = result.filter(item => item.urgency?.toLowerCase() === filters.urgency.toLowerCase());
    }

    if (filters.constituency !== 'all') {
      result = result.filter(item => item.constituency_id === parseInt(filters.constituency));
    }

    setFilteredQueue(result);
  };

  const adminActions = [
    { label: 'ID Management', icon: ShieldCheck, path: '/dashboard/id-management', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900' },
    { label: 'Scan Digital ID', icon: Scan, path: '/dashboard/scan-qr', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900' },
    { label: 'Post Circular', icon: Volume2, path: '/dashboard/announcements', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900' },
    { label: 'System Audit Logs', icon: Activity, path: '/dashboard/system-logs', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-900' },
  ];

  return (
    <div className="w-full flex flex-col gap-6 text-left select-none animate-fadeIn pb-10">
      
      {/* 1. Leadership Greeting Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[11px] font-semibold border border-amber-200 dark:border-amber-800/60">
            <Radio className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" /> Active Constituency Operations Command
          </div>
          
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
            Welcome back, {userProfile?.full_name || 'Leader'} <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span> <span className="text-blue-600 dark:text-blue-400 font-semibold block sm:inline">{getRoleHeaderLabel(userProfile?.role)}</span>
          </h1>
          
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
            Directing operations for <strong className="text-slate-900 dark:text-slate-200 font-semibold">{userProfile?.college_name || userProfile?.constituency_name || 'Statewide Territory'}</strong>. Real-time issue monitoring and leader dispatch active.
          </p>
        </div>

        <div className="flex gap-3 shrink-0 self-start sm:self-center">
          <a href="tel:8142443684" className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white transition shadow-xs">
            <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Helpline Hotline
          </a>
        </div>
      </div>

      {/* 2. Summary Stats Grid (Most Important Information) */}
      {loading ? (
        <div className="w-full py-6 flex justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {getStatsCards().map((item, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between gap-1">
              <span className={`text-2xl font-bold tracking-tight ${item.color}`}>{item.val}</span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* 3. Quick Leader Actions Bar */}
      <div className="flex flex-col gap-2.5">
        <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">
          Quick Leader Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {adminActions.map((action, idx) => {
            const IconComponent = action.icon;
            return (
              <div
                key={idx}
                onClick={() => navigate(action.path)}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-blue-500/50 transition-all flex items-center gap-3 cursor-pointer group"
              >
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${action.bg}`}>
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

      {/* 4. Advanced Filtering Matrix */}
      <ComplaintFilters 
        onFilterChange={handleFilterChange} 
        constituencies={constituencyList}
      />

      {/* 5. Tab Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 mt-1">
        <button
          onClick={() => setActiveTab('complaints')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'complaints'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Issues Incident Queue
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'applications'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Join Requests Panel ({joinRequests.filter(r => r.status === 'Pending').length} Pending)
        </button>
      </div>

      {activeTab === 'complaints' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch w-full animate-fadeIn">
          
          {/* District Action Queue */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm h-full flex flex-col justify-between gap-4 min-h-[400px]">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">Issue Incident Dispatch Queue</span>
                <span className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Action Center
                </span>
              </div>

              {loading ? (
                <div className="py-12 flex justify-center">
                  <div className="w-8 h-8 rounded-full border-3 border-blue-600 border-t-transparent animate-spin" />
                </div>
              ) : (
                <div className="flex flex-col gap-3 my-1 max-h-[360px] overflow-y-auto pr-1 custom-sidebar-scrollbar">
                  {filteredQueue.length > 0 ? (
                    filteredQueue.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 gap-4 hover:border-blue-500/40 transition">
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</span>
                          <span className="text-[10px] text-slate-500 mt-1 uppercase font-semibold tracking-wider">
                            {item.college_name || 'Statewide Territory'} • Ticket #{item.id} • Student: {item.student_name || 'Anonymous Student'}
                          </span>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-1 italic max-w-xl">
                            "{item.description}"
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getUrgencyColor(item.urgency)}`}>
                            {item.urgency}
                          </span>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase">
                            {item.status}
                          </span>
                          <button
                            onClick={() => setSelectedTicketId(item.id)}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1 cursor-pointer"
                            title="Evaluate & update status"
                          >
                            <Eye className="w-3.5 h-3.5" /> Details
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-slate-500 text-xs font-medium">
                      No matching issues found matching your matrix query filters.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Localized Analytics & Feed */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="h-[250px] min-w-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider text-center shrink-0">Category Distribution</span>
              <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
                <CategoryPieChart data={localCategories} />
              </div>
            </div>
            <div className="flex-1 min-h-[250px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <RealtimeActivityFeed activities={localActivity} title="Local Feeds" />
            </div>
          </div>

        </div>
      )}

      {activeTab === 'applications' && (
        <div className="w-full flex flex-col gap-6 animate-fadeIn">
          <div className="p-6 flex flex-col gap-4 text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Join {shortName} Regional Requests
            </h3>

            {requestMessage.text && (
              <div className={`p-4 rounded-xl border text-xs font-semibold ${
                requestMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              }`}>
                {requestMessage.text}
              </div>
            )}

            {fetchingRequests ? (
              <div className="py-12 text-center text-xs text-slate-500 italic">
                Loading applications network node...
              </div>
            ) : joinRequests.length > 0 ? (
              <div className="flex flex-col gap-4">
                {joinRequests.map((req) => (
                  <div key={req.id} className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-slate-900 dark:text-white">{req.full_name}</strong>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          req.status === 'Approved'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : req.status === 'Rejected'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="mt-0.5">Email: <span className="text-slate-900 dark:text-slate-200 font-medium">{req.email}</span> | Phone: <span className="text-slate-900 dark:text-slate-200 font-medium">{req.phone}</span></p>
                      <p>Constituency: <span className="text-slate-900 dark:text-slate-200 font-bold">{req.constituency_name || 'Not Set'} ({req.district || ''})</span></p>
                      <div className="mt-1 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        <span className="font-bold text-[10px] text-slate-400 uppercase block mb-1">Statement of Motivation</span>
                        {req.reason}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">Applied: {new Date(req.created_at).toLocaleString()}</span>
                    </div>

                    {req.status === 'Pending' && (
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => { setApprovingApp(req); setSelectedRole('student'); }}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleUpdateRequestStatus(req.id, 'Rejected')}
                          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs italic">
                No join applications submitted to your constituency yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Dashboard V2 Section: Announcements & Events Previews for Leaders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-stretch">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-4 text-left">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <span className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-500" /> Recent Circulars
            </span>
            <button 
              onClick={() => navigate('/dashboard/announcements')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              Manage Circulars <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {announcements.length > 0 ? (
              announcements.map((note) => (
                <div 
                  key={note.id} 
                  onClick={() => navigate('/dashboard/announcements')}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 transition flex flex-col gap-1.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-amber-600 dark:text-amber-400 uppercase">
                      {note.target_audience}
                    </span>
                    <span className="text-slate-400 font-medium">
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                    {note.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed">
                    {note.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-500 italic">
                No active circulars published.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-4 text-left">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <span className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-500" /> Scheduled State Events
            </span>
            <button 
              onClick={() => navigate('/dashboard/events')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              View All Events <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {events.length > 0 ? (
              events.map((ev) => (
                <div 
                  key={ev.id} 
                  onClick={() => navigate('/dashboard/events')}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 transition flex flex-col gap-1.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-cyan-600 dark:text-cyan-400 uppercase">
                      {ev.location || 'State Outreach'}
                    </span>
                    <span className="text-slate-400 font-medium">
                      {ev.event_date ? new Date(ev.event_date).toLocaleDateString() : 'Upcoming'}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                    {ev.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed">
                    {ev.description}
                  </p>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-500 italic">
                No events currently scheduled.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7. Realtime Hub Chat */}
      {userProfile && (
        <div className="w-full mt-2">
          <HubChat 
            user={{
              id: userProfile.id,
              role: userProfile.role,
              full_name: userProfile.full_name,
              constituency_name: userProfile.constituency_name || userProfile.constituency,
              hub_name: userProfile.hub_name
            }} 
          />
        </div>
      )}

      {/* Role Approval Modal */}
      {approvingApp && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Assign Role & Approve</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Select leadership role for {approvingApp.full_name}</p>
              </div>
              <button onClick={() => setApprovingApp(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 py-2 text-left">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Target Constituency</label>
                <div className="text-xs text-slate-900 dark:text-white font-bold bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  {approvingApp.constituency_name || 'Not Set'}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Assign Union Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 cursor-pointer shadow-sm"
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
            
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => setApprovingApp(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateRequestStatus(approvingApp.id, 'Approved', selectedRole)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Check className="w-4 h-4" /> Confirm & Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTicketId && (
        <ComplaintDetailsModal 
          ticketId={selectedTicketId} 
          onClose={() => setSelectedTicketId(null)} 
          userProfile={userProfile} 
          onUpdateSuccess={fetchDashboardData}
        />
      )}

      <EmergencyFallback 
        isOffline={connectionDropped} 
        onRetry={async () => {
          try {
            await fetch('/api/health');
            setConnectionDropped(false);
            connectStream();
            fetchDashboardData();
          } catch (e) {
            console.warn('Re-connect attempt failed');
          }
        }} 
      />

    </div>
  );
}
