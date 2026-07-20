import React, { useState, useEffect } from 'react';
import { Building2, Save, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useOrg } from '../../context/OrgContext';

const OrgIdentityPanel = () => {
  const { shortName, fullName, updateOrgIdentity, refreshOrgIdentity } = useOrg();

  const [inputShortName, setInputShortName] = useState(shortName);
  const [inputFullName, setInputFullName] = useState(fullName);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    setInputShortName(shortName);
    setInputFullName(fullName);
  }, [shortName, fullName]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!inputShortName.trim() || !inputFullName.trim()) {
      setStatusMsg({ type: 'error', text: 'Both Short and Full Organization Names are required.' });
      return;
    }

    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await updateOrgIdentity(inputShortName.trim(), inputFullName.trim());
      if (res.success) {
        setStatusMsg({ type: 'success', text: 'Organization Identity updated successfully! Portal refreshed.' });
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to update Organization Identity.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Error saving organization identity.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" /> Organization Identity
          </h2>
          <p className="text-xs text-slate-400">
            Configure default short and full names. Updates propagate instantly across the entire portal interface.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { refreshOrgIdentity(); setStatusMsg(null); }}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" /> Refresh Data
        </button>
      </div>

      <div className="max-w-2xl bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-5">
        {statusMsg && (
          <div
            className={`p-3.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Short Organization Name
            </label>
            <input
              type="text"
              value={inputShortName}
              onChange={(e) => setInputShortName(e.target.value)}
              placeholder="e.g. TVRS or TRSV"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:border-cyan-500 outline-none transition"
              required
            />
            <p className="text-[11px] text-slate-500">
              Used in navigation badges, headers, short buttons, and compact titles.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Full Organization Name
            </label>
            <input
              type="text"
              value={inputFullName}
              onChange={(e) => setInputFullName(e.target.value)}
              placeholder="e.g. Telangana Vidyarthi Rakshana Sena"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:border-cyan-500 outline-none transition"
              required
            />
            <p className="text-[11px] text-slate-500">
              Used in hero banners, main page titles, official footers, and about sections.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/40 disabled:opacity-50 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default {
  id: 'org_identity',
  name: 'Organization Identity',
  icon: 'Building2',
  panels: [
    { id: 'identity', name: 'Identity Configuration', component: OrgIdentityPanel }
  ],
  searchIndex: [
    { query: 'Edit short and full organization name', action: 'identity' }
  ]
};
