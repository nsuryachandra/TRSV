import React, { useState, useEffect } from 'react';
import { Calendar, Plus, MapPin, Users, CheckSquare, Trash2 } from 'lucide-react';

const EventsPanel = () => {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [capacity, setCapacity] = useState('100');
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('trsv_session_token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/modules/events', { headers });
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
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
      const res = await fetch('/api/modules/events', {
        method: 'POST',
        headers,
        body: JSON.stringify({ title, description, location, event_date: eventDate, capacity: parseInt(capacity) })
      });
      const data = await res.json();
      if (data.success) {
        alert('Outreach event scheduled successfully.');
        setTitle('');
        setDescription('');
        setLocation('');
        setEventDate('');
        fetchEvents();
      }
    } catch (err) {
      alert('Error scheduling event.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      const res = await fetch(`/api/modules/events/${id}`, {
        method: 'DELETE',
        headers
      });
      const data = await res.json();
      if (data.success) {
        fetchEvents();
      }
    } catch (err) {
      alert('Error deleting event.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" /> Outreach & Events Scheduler
          </h2>
          <p className="text-xs text-slate-400">Organize student campaigns, coordinate regional events, and check-in attendees.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Schedule event */}
        <form onSubmit={handleCreate} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" /> Schedule Campaign
          </h3>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Event Title</label>
            <input
              type="text"
              placeholder="e.g. Anti-Ragging Awareness Seminar"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-cyan-500 outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
            <textarea
              rows={3}
              placeholder="Provide briefing details..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-cyan-500 outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location / Campus Coordinates</label>
            <input
              type="text"
              placeholder="e.g. JNTUH Auditorium, Hyderabad"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-cyan-500 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Event Date</label>
              <input
                type="datetime-local"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[11px] text-slate-300 focus:border-cyan-500 outline-none"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Capacity</label>
              <input
                type="number"
                value={capacity}
                onChange={e => setCapacity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:border-cyan-500 outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg text-xs transition"
          >
            Create Event Listing
          </button>
        </form>

        {/* Events listings list */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" /> Outreach Campaign Registry
          </h3>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {events.map(ev => (
              <div key={ev.id} className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-start gap-4">
                <div className="space-y-1.5">
                  <div className="font-bold text-slate-200 text-xs">{ev.title}</div>
                  <p className="text-[11px] text-slate-400">{ev.description}</p>
                  <div className="flex gap-4 text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-cyan-400" /> {ev.location}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3 text-amber-400" /> Checked In: {ev.attendance_count || 0} / {ev.capacity}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(ev.id)}
                  className="p-1.5 bg-slate-900 hover:bg-rose-950/40 hover:text-rose-400 text-slate-500 rounded border border-slate-800"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {events.length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-6">No campaigns scheduled.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default {
  id: 'events',
  name: 'Events',
  icon: 'Calendar',
  panels: [
    { id: 'scheduler', name: 'Campaign Scheduler', component: EventsPanel }
  ],
  searchIndex: [
    { query: 'Schedule awareness events', action: 'scheduler' },
    { query: 'Review campaign check-ins', action: 'scheduler' }
  ]
};

