import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  MapPin, 
  Users, 
  Trash2, 
  Edit3, 
  Eye, 
  Image as ImageIcon, 
  Clock, 
  UserCheck, 
  RotateCcw, 
  Save, 
  X,
  Sparkles
} from 'lucide-react';

const EVENT_DEFAULTS = {
  title: 'Anti-Ragging & Student Rights Awareness Campaign',
  description: 'A state-level awareness campaign to educate students on their academic rights, anti-ragging protections, and leadership opportunities within the TVRS network.',
  location: 'JNTUH Auditorium, Kukatpally, Hyderabad',
  eventDate: '2026-08-15',
  time: '10:00 AM',
  organizer: 'TRSV State Executive Board',
  status: 'Upcoming',
  bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80',
  capacity: '250'
};

const EventsPanel = () => {
  const [events, setEvents] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [time, setTime] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [status, setStatus] = useState('Upcoming');
  const [bannerUrl, setBannerUrl] = useState('');
  const [imagesText, setImagesText] = useState('');
  const [capacity, setCapacity] = useState('100');
  const [loading, setLoading] = useState(true);
  const [previewEvent, setPreviewEvent] = useState(null);

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
      if (data.success && data.events) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setLocation('');
    setEventDate('');
    setTime('');
    setOrganizer('');
    setStatus('Upcoming');
    setBannerUrl('');
    setImagesText('');
    setCapacity('100');
  };

  const handleEdit = (ev) => {
    setEditingId(ev.id);
    setTitle(ev.title || '');
    setDescription(ev.description || '');
    setLocation(ev.location || ev.venue || '');
    setEventDate(ev.event_date ? ev.event_date.split('T')[0] : '');
    setTime(ev.time || '');
    setOrganizer(ev.organizer || '');
    setStatus(ev.status || 'Upcoming');
    setBannerUrl(ev.banner_url || '');
    let imgs = [];
    try {
      imgs = typeof ev.images === 'string' ? JSON.parse(ev.images) : (ev.images || []);
    } catch(e) { imgs = []; }
    setImagesText(Array.isArray(imgs) ? imgs.join('\n') : '');
    setCapacity((ev.capacity || 100).toString());
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title || !description || !location || !eventDate) {
      alert('Title, description, venue/location, and date are required.');
      return;
    }

    const imagesArray = imagesText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const payload = {
      title,
      description,
      location,
      venue: location,
      event_date: eventDate,
      time: time || '10:00 AM',
      organizer: organizer || 'TRSV Executive Council',
      status: status || 'Upcoming',
      banner_url: bannerUrl,
      images: imagesArray,
      capacity: parseInt(capacity) || 100
    };

    try {
      let res;
      if (editingId) {
        res = await fetch(`/api/modules/events/${editingId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/modules/events', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (data.success) {
        alert(editingId ? 'Event updated successfully.' : 'Event created successfully.');
        handleResetForm();
        fetchEvents();
      } else {
        alert(data.message || 'Failed to save event.');
      }
    } catch (err) {
      alert('Error saving event.');
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
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" /> Events & Assemblies Management
          </h2>
          <p className="text-xs text-slate-400">Add, edit, or remove state outreach events. Public Events page will auto-update.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Event Form */}
        <form onSubmit={handleSave} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              {editingId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingId ? 'Edit Event Listing' : 'Schedule New Event'}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={handleResetForm}
                className="text-[10px] text-rose-400 hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Cancel Edit
              </button>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Event Title *</label>
            <input
              type="text"
              placeholder="e.g. Statewide Anti-Ragging Summit"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Description *</label>
            <textarea
              rows={3}
              placeholder="Event briefing..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Venue / Location *</label>
            <input
              type="text"
              placeholder="e.g. JNTUH Auditorium, Kukatpally"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Event Date *</label>
              <input
                type="date"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Time</label>
              <input
                type="text"
                placeholder="10:00 AM"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Organizer</label>
              <input
                type="text"
                placeholder="TRSV Council"
                value={organizer}
                onChange={e => setOrganizer(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Event Banner Image URL</label>
            <input
              type="url"
              placeholder="https://..."
              value={bannerUrl}
              onChange={e => setBannerUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Additional Image URLs (1 per line)</label>
            <textarea
              rows={2}
              placeholder="https://...\nhttps://..."
              value={imagesText}
              onChange={e => setImagesText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Expected Capacity</label>
            <input
              type="number"
              value={capacity}
              onChange={e => setCapacity(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {editingId ? 'Save Changes' : 'Publish Event'}
            </button>
            
            <button
              type="button"
              onClick={() => {
                setTitle(EVENT_DEFAULTS.title);
                setDescription(EVENT_DEFAULTS.description);
                setLocation(EVENT_DEFAULTS.location);
                setEventDate(EVENT_DEFAULTS.eventDate);
                setTime(EVENT_DEFAULTS.time);
                setOrganizer(EVENT_DEFAULTS.organizer);
                setStatus(EVENT_DEFAULTS.status);
                setBannerUrl(EVENT_DEFAULTS.bannerUrl);
                setCapacity(EVENT_DEFAULTS.capacity);
              }}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition font-semibold"
              title="Fill Sample Data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Events Registry List */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" /> Active Events Registry ({events.length})
            </h3>
          </div>

          <div className="space-y-3 flex-1 max-h-[600px] overflow-y-auto pr-1">
            {events.map(ev => (
              <div key={ev.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-start gap-4 hover:border-slate-700 transition">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-xs truncate">{ev.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      ev.status === 'Completed' ? 'bg-slate-800 text-slate-400' :
                      ev.status === 'Cancelled' ? 'bg-rose-950 text-rose-400' : 'bg-amber-950 text-amber-400'
                    }`}>
                      {ev.status || 'Upcoming'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{ev.description}</p>
                  <div className="flex flex-wrap gap-3 text-[10px] text-slate-500 font-mono pt-1">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-blue-400" /> {ev.event_date ? new Date(ev.event_date).toLocaleDateString() : 'TBD'} {ev.time ? `• ${ev.time}` : ''}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-amber-400" /> {ev.location || ev.venue}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setPreviewEvent(ev)}
                    className="p-2 bg-slate-900 hover:bg-blue-950 hover:text-blue-400 text-slate-400 rounded-lg border border-slate-800"
                    title="Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleEdit(ev)}
                    className="p-2 bg-slate-900 hover:bg-amber-950 hover:text-amber-400 text-slate-400 rounded-lg border border-slate-800"
                    title="Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(ev.id)}
                    className="p-2 bg-slate-900 hover:bg-rose-950 hover:text-rose-400 text-slate-400 rounded-lg border border-slate-800"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-12">No events scheduled yet.</p>
            )}
          </div>
        </div>

      </div>

      {/* Preview Modal */}
      {previewEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full flex flex-col gap-4 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-blue-400 uppercase">Event Live Preview</span>
              <button onClick={() => setPreviewEvent(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            {previewEvent.banner_url && (
              <img src={previewEvent.banner_url} alt={previewEvent.title} className="w-full h-40 object-cover rounded-xl" />
            )}
            <h3 className="text-lg font-bold text-white">{previewEvent.title}</h3>
            <p className="text-xs text-slate-300">{previewEvent.description}</p>
            <div className="text-xs text-slate-400 space-y-1">
              <div>📍 Venue: {previewEvent.location || previewEvent.venue}</div>
              <div>📅 Date: {previewEvent.event_date ? new Date(previewEvent.event_date).toLocaleDateString() : 'TBD'} ({previewEvent.time})</div>
              <div>👤 Organizer: {previewEvent.organizer}</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default {
  id: 'events',
  name: 'Events Management',
  icon: 'Calendar',
  panels: [
    { id: 'scheduler', name: 'Events Manager', component: EventsPanel }
  ],
  searchIndex: [
    { query: 'Schedule awareness events', action: 'scheduler' },
    { query: 'Edit campaign event listing', action: 'scheduler' }
  ]
};
