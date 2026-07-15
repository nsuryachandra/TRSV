import React, { useState, useEffect } from 'react';
import { Globe, Save, Image, Type, Flag, RefreshCw } from 'lucide-react';

// Field component must be defined at module scope — NOT inside PortalPanel.
// Defining it inside the parent causes React to treat it as a new component type
// on every render, which unmounts and remounts the input, losing cursor focus.
const Field = ({ label, id, type = 'text', placeholder, value, onChange, hint }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
    {type === 'textarea' ? (
      <textarea
        id={id}
        rows={3}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:border-cyan-500 outline-none resize-none"
      />
    ) : (
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:border-cyan-500 outline-none"
      />
    )}
    {hint && <p className="text-[10px] text-slate-500">{hint}</p>}
  </div>
);

const PortalPanel = () => {
  const [branding, setBranding] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    site_title: '',
    tagline: '',
    footer_text: '',
    alert_banner: '',
    primary_color: '#0ea5e9',
    logo_url: '',
    hero_text: ''
  });

  const token = localStorage.getItem('trsv_session_token');
  const headers = { 'Authorization': `Bearer ${token}` };

  useEffect(() => {
    fetch('/api/modules/portal/branding', { headers })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setBranding(data.branding);
          setForm(prev => ({ ...prev, ...data.branding }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/modules/portal/branding', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        alert('Portal configuration saved successfully.');
        setBranding(form);
      } else {
        alert('Failed to save: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Network error — failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" /> Portal Configuration
          </h2>
          <p className="text-xs text-slate-400">Configure site branding, alerts, and public-facing content from a central control panel.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-5">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Type className="w-4 h-4 text-cyan-400" /> Content & Identity
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field
              label="Site Title"
              id="site_title"
              placeholder="Telangana Vidyarthi Rakshana Sena"
              value={form.site_title}
              onChange={e => setForm(f => ({ ...f, site_title: e.target.value }))}
            />
            <Field
              label="Tagline"
              id="tagline"
              placeholder="Protecting Student Rights Across Telangana"
              value={form.tagline}
              onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
            />
          </div>

          <Field
            label="Hero Banner Text"
            id="hero_text"
            type="textarea"
            placeholder="Welcome message displayed on the public landing page..."
            value={form.hero_text}
            onChange={e => setForm(f => ({ ...f, hero_text: e.target.value }))}
          />

          <Field
            label="Footer Notice"
            id="footer_text"
            type="textarea"
            placeholder="© 2025 Telangana Vidyarthi Rakshana Sena. All rights reserved."
            value={form.footer_text}
            onChange={e => setForm(f => ({ ...f, footer_text: e.target.value }))}
          />

          <Field
            label="Alert Banner Message (leave empty to hide)"
            id="alert_banner"
            placeholder="e.g. State General Council Meeting on 20th July 2025 — All secretaries must attend."
            value={form.alert_banner}
            onChange={e => setForm(f => ({ ...f, alert_banner: e.target.value }))}
            hint="Displayed as a notice at the top of the student portal homepage."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field
              label="Logo URL (optional override)"
              id="logo_url"
              placeholder="https://cdn.tvrs.org/logo.png"
              value={form.logo_url}
              onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))}
            />
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5" /> Accent Color
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={form.primary_color}
                  onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
                  className="w-12 h-10 rounded-lg border border-slate-800 bg-slate-950 cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-400">{form.primary_color}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg text-xs transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Portal Configuration'}
          </button>
        </div>

        {/* Live Preview */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Live Preview</h3>

          <div className="rounded-xl overflow-hidden border border-slate-800">
            {/* Simulated alert banner */}
            {form.alert_banner && (
              <div className="bg-amber-950/40 border-b border-amber-800/40 px-3 py-1.5 text-[10px] text-amber-400 font-medium">
                📢 {form.alert_banner}
              </div>
            )}
            {/* Simulated header */}
            <div
              className="px-4 py-4 text-center space-y-1"
              style={{ background: `linear-gradient(135deg, #0f172a, ${form.primary_color}22)` }}
            >
              <div className="font-bold text-slate-100 text-sm">{form.site_title || 'Portal Title'}</div>
              <div className="text-[11px] text-slate-400">{form.tagline || 'Tagline here'}</div>
            </div>
            {/* Hero text area */}
            <div className="bg-slate-950 px-4 py-4 text-[10px] text-slate-400 italic">
              {form.hero_text || 'Hero message will appear here...'}
            </div>
            {/* Footer */}
            <div className="bg-slate-900/70 px-4 py-2 text-[9px] text-slate-500 border-t border-slate-800">
              {form.footer_text || '© TVRS. All rights reserved.'}
            </div>
          </div>

          {/* Current Active Settings */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saved Config</div>
            {Object.entries(branding).filter(([k, v]) => v).map(([key, value]) => (
              <div key={key} className="flex justify-between text-[10px] py-1 border-b border-slate-800/60">
                <span className="text-slate-500 font-mono">{key}</span>
                <span className="text-slate-300 truncate max-w-[120px]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default {
  id: 'portal',
  name: 'Portal',
  icon: 'Globe',
  panels: [
    { id: 'branding', name: 'Branding & Content', component: PortalPanel }
  ],
  searchIndex: [
    { query: 'Edit site title and tagline', action: 'branding' },
    { query: 'Update portal alert banner', action: 'branding' },
    { query: 'Change portal footer text', action: 'branding' },
    { query: 'Configure portal appearance', action: 'branding' }
  ]
};

