import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, Users, Clock, AlertTriangle, ChevronRight, BarChart2, ShieldAlert } from 'lucide-react';
import AnimatedSection from '../components/AnimatedSection';
import { useOrg } from '../context/OrgContext';

export default function Transparency() {
  const { shortName } = useOrg();
  const [metrics, setMetrics] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransparencyData();
  }, []);

  const fetchTransparencyData = async () => {
    try {
      const [metricsRes, rankingsRes, activityRes] = await Promise.all([
        fetch('/api/transparency/metrics'),
        fetch('/api/transparency/rankings'),
        fetch('/api/transparency/activity')
      ]);
      
      const metricsData = await metricsRes.json();
      const rankingsData = await rankingsRes.json();
      const activityData = await activityRes.json();

      if (metricsData.success) setMetrics(metricsData.metrics);
      if (rankingsData.success) setRankings(rankingsData.rankings);
      if (activityData.success) setActivity(activityData.activity);
    } catch (err) {
      console.error('Failed to load transparency metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-10 h-10 border-2 border-slate-200 dark:border-slate-800 border-t-blue-600 rounded-full animate-spin" />
        <p className="mt-4 text-xs font-semibold tracking-wider text-slate-400 uppercase animate-pulse">Syncing Accountability Data...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-12 py-4 animate-fadeIn">
      
      {/* Hero Header */}
      <AnimatedSection direction="up" className="text-center max-w-4xl mx-auto flex flex-col gap-3">
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-wider uppercase flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> Open Governance & Telemetry
        </span>
        <h1 className="fluid-heading-2 font-bold text-slate-900 dark:text-white leading-tight">
          Complaint Statistics
        </h1>
        <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium max-w-2xl mx-auto">
          {shortName} operates with 100% public accountability. Monitor organization-wide grievance metrics, resolution rates, and constituency performance statistics.
        </p>
      </AnimatedSection>

      {/* Top Metrics Row */}
      <AnimatedSection delay={0.1} className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col items-center text-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{metrics?.totalComplaints || 0}</h3>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Tickets</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col items-center text-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{metrics?.resolvedComplaints || 0}</h3>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Resolved Issues</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col items-center text-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{metrics?.criticalEmergencies || 0}</h3>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Panic Responded</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col items-center text-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{metrics?.averageResolutionHours || 0}<span className="text-lg">h</span></h3>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Avg Resolution</span>
          </div>
        </div>
      </AnimatedSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Constituency Leaderboard */}
        <AnimatedSection delay={0.2} className="flex flex-col gap-5 text-left">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40">
              <BarChart2 className="w-4.5 h-4.5" />
            </div>
            <h2 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Performance Rankings</h2>
          </div>
          
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col gap-1 p-2">
            {rankings.length > 0 ? rankings.map((con, idx) => (
              <div key={idx} className="flex items-center p-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors gap-4">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${idx === 0 ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60' : idx === 1 ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' : idx === 2 ? 'bg-amber-50/50 dark:bg-amber-950/30 text-amber-500' : 'bg-slate-100 dark:bg-slate-900 text-slate-400'}`}>
                  #{idx + 1}
                </span>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">{con.name}</span>
                  <span className="text-[11px] font-medium text-slate-400">{con.resolved_tickets} / {con.total_tickets} Resolved</span>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">{con.resolution_rate}%</span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Clear Rate</span>
                </div>
              </div>
            )) : (
              <div className="py-10 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">No active rankings yet.</div>
            )}
          </div>
        </AnimatedSection>

        {/* Real-time Activity Ledger */}
        <AnimatedSection delay={0.3} className="flex flex-col gap-5 text-left">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
              <Activity className="w-4.5 h-4.5" />
            </div>
            <h2 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Live Issue Tracker</h2>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col gap-1 p-3 overflow-hidden relative h-full max-h-[500px]">
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5">
              {activity.length > 0 ? activity.map((act) => (
                <div key={act.id} className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-955/50 border border-slate-200/80 dark:border-slate-800/80 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Ticket #{act.id}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{new Date(act.updated_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{act.category} Dispute</span>
                      <span className="text-[11px] font-medium text-slate-500 truncate flex items-center gap-1 mt-0.5">
                        <Users className="w-3 h-3 text-slate-400" /> 
                        {act.constituency_name || 'State Scope'}
                      </span>
                    </div>
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 border ${
                      act.status === 'Resolved' ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60' : 
                      act.status === 'Under Investigation' ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60' : 
                      'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                    }`}>
                      {act.status}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="py-10 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Tracker currently silent.</div>
              )}
            </div>
          </div>
        </AnimatedSection>
      </div>

    </div>
  );
}
