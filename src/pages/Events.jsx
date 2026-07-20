import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  UserCheck, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight, 
  Share2, 
  Sparkles,
  Tag
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import AnimatedSection from '../components/AnimatedSection';
import { useOrg } from '../context/OrgContext';

export default function Events() {
  const { shortName, fullName } = useOrg();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('trsv_session_token');
      const res = await fetch('/api/modules/events', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.events) {
        setEvents(data.events);
      }
    } catch (err) {
      console.warn('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'COMPLETED' || s === 'PAST') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
          Completed
        </span>
      );
    }
    if (s === 'CANCELLED') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          Cancelled
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
        Upcoming
      </span>
    );
  };

  const filteredEvents = events.filter(ev => {
    const s = (ev.status || '').toUpperCase();
    if (activeTab === 'UPCOMING') return s === 'UPCOMING' || s === 'ACTIVE';
    if (activeTab === 'COMPLETED') return s === 'COMPLETED' || s === 'PAST';
    return true;
  });

  return (
    <div className="w-full flex flex-col gap-8 py-8 animate-fadeIn text-left">
      
      {/* Header */}
      <AnimatedSection direction="up" className="text-center max-w-3xl mx-auto flex flex-col gap-3">
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-widest uppercase flex items-center justify-center gap-2">
          <Calendar className="w-4 h-4 text-amber-500" /> State Outreach & Assemblies
        </span>
        <h1 className="fluid-heading-2 font-bold text-slate-900 dark:text-white leading-tight">
          {shortName} Official Events
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          Stay informed on upcoming student rallies, anti-ragging seminars, leadership conclaves, and campus outreach drives across Telangana.
        </p>
      </AnimatedSection>

      {/* Filter Tabs */}
      <AnimatedSection delay={0.05} className="flex justify-center">
        <div className="flex p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          {['ALL', 'UPCOMING', 'COMPLETED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
              }`}
            >
              {tab} Events
            </button>
          ))}
        </div>
      </AnimatedSection>

      {/* Events List Grid */}
      <AnimatedSection delay={0.1} className="flex flex-col gap-6">
        {loading ? (
          <div className="w-full py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-500">Loading scheduled events...</span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <GlassCard className="p-12 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No Events Available</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                There are currently no events listed under the "{activeTab}" filter. Check back soon for upcoming state announcements.
              </p>
            </div>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEvents.map((ev) => {
              const eventDateStr = ev.event_date ? new Date(ev.event_date).toLocaleDateString(undefined, {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
              }) : 'TBD';

              return (
                <GlassCard key={ev.id} hoverEffect className="p-0 overflow-hidden flex flex-col h-full">
                  
                  {/* Event Banner Image */}
                  {ev.banner_url ? (
                    <div className="w-full h-48 bg-slate-900 relative overflow-hidden">
                      <img 
                        src={ev.banner_url} 
                        alt={ev.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                      <div className="absolute top-4 right-4">
                        {getStatusBadge(ev.status)}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 p-6 flex flex-col justify-between relative">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-amber-400/30">
                          {shortName} Assembly
                        </span>
                        {getStatusBadge(ev.status)}
                      </div>
                    </div>
                  )}

                  {/* Body Details */}
                  <div className="p-6 flex flex-col justify-between flex-1 gap-4">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                        {ev.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                        {ev.description}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="font-semibold">{eventDateStr}</span>
                        {ev.time && <span className="text-slate-400">• {ev.time}</span>}
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="truncate">{ev.location || ev.venue || 'Telangana State Campus'}</span>
                      </div>

                      {ev.organizer && (
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="text-slate-500 dark:text-slate-400">Organized by: <strong className="text-slate-700 dark:text-slate-200">{ev.organizer}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action */}
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        Capacity: {ev.capacity || 250} Attendees
                      </span>
                      <button className="px-4 py-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                        View Details <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>

                </GlassCard>
              );
            })}
          </div>
        )}
      </AnimatedSection>

    </div>
  );
}
