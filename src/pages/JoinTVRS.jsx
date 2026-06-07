import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, ArrowLeft, Send, CheckCircle2, User, Mail, Phone, MapPin, AlignLeft, HelpCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import AnimatedSection from '../components/AnimatedSection';
import { useNavigate } from 'react-router-dom';
import PremiumButton from '../components/PremiumButton';
import { useAuth } from '../context/AuthContext';

export default function JoinTVRS() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  const [constituencies, setConstituencies] = useState([]);
  const [loadingConstituencies, setLoadingConstituencies] = useState(true);
  
  const [formData, setFormData] = useState({
    fullName: userProfile?.full_name || '',
    email: userProfile?.email || '',
    phone: userProfile?.phone || '',
    constituencyId: userProfile?.constituency_id?.toString() || '',
    reason: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Sync profile details if available
  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || userProfile.full_name || '',
        email: prev.email || userProfile.email || '',
        phone: prev.phone || userProfile.phone || '',
        constituencyId: prev.constituencyId || userProfile.constituency_id?.toString() || ''
      }));
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
          if (!formData.constituencyId && data.constituencies.length > 0) {
            setFormData(prev => ({ ...prev, constituencyId: data.constituencies[0].id.toString() }));
          }
        }
      } catch (err) {
        console.error('Failed to load constituencies:', err);
      } finally {
        setLoadingConstituencies(false);
      }
    };
    fetchConstituencies();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim()) return setError('Please enter your full name.');
    if (!formData.email.trim()) return setError('Please enter your email.');
    if (!formData.phone.trim()) return setError('Please enter your phone number.');
    if (!formData.constituencyId) return setError('Please select your constituency.');
    if (!formData.reason.trim()) return setError('Please provide a reason/motivation for joining.');

    setLoading(true);

    try {
      const response = await fetch('/api/join-tvrs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || 'Failed to submit application.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to the server timed out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center py-8 px-4 text-center">
        <AnimatedSection direction="up" className="w-full max-w-xl">
          <GlassCard className="p-8 sm:p-12 border border-emerald-500/20 bg-emerald-500/5 shadow-2xl rounded-2xl flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-glow-emerald animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="flex flex-col gap-1.5">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                Application Submitted!
              </h2>
              <span className="text-[10px] text-emerald-500 font-extrabold uppercase tracking-widest">
                Ledger Logged Successfully
              </span>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
              Your application to join the <strong>Telangana Vidyarthi Rakshana Sena</strong> has been registered on our secure node. Our regional committee will inspect your student profile and contact you soon.
            </p>

            <PremiumButton
              onClick={() => navigate('/dashboard/student')}
              variant="glow"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
              className="mt-4"
            >
              Return to Dashboard
            </PremiumButton>
          </GlassCard>
        </AnimatedSection>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[80vh] flex flex-col items-center justify-center py-8 px-4">
      <AnimatedSection direction="up" className="w-full max-w-2xl text-left">
        <GlassCard hoverEffect={false} className="p-6 sm:p-10 relative overflow-hidden border border-slate-200/50 dark:border-slate-850 shadow-2xl rounded-3xl bg-white/40 dark:bg-slate-950/20">
          {/* Cybernetic ambient backing light */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-400/10 to-transparent blur-2xl pointer-events-none" />
          
          <div className="flex flex-col gap-2 mb-8 border-b border-slate-200/40 dark:border-slate-850 pb-5">
            <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 tracking-widest uppercase block">
              RECRUITMENT TERMINAL
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-855 dark:text-white leading-tight">
              Apply to Join TVRS
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mt-0.5">
              Submit your credentials to stand as a digital coordinator node and represent student advocacy rights across educational zones.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-2.5 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anand Rao"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="peer w-full pl-11 pr-4 py-3 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-855 dark:text-slate-100 font-bold"
                  />
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-cyan-600 dark:text-cyan-400 pointer-events-none z-10 animate-icon-bounce-centered" strokeWidth={2.2} />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="e.g. anand@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="peer w-full pl-11 pr-4 py-3 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-855 dark:text-slate-100 font-bold"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-cyan-600 dark:text-cyan-400 pointer-events-none z-10 animate-icon-bounce-centered" strokeWidth={2.2} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="peer w-full pl-11 pr-4 py-3 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-855 dark:text-slate-100 font-bold"
                  />
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-cyan-600 dark:text-cyan-400 pointer-events-none z-10 animate-icon-bounce-centered" strokeWidth={2.2} />
                </div>
              </div>

              {/* Constituency */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Constituency</label>
                <div className="relative">
                  <select
                    value={formData.constituencyId}
                    onChange={(e) => setFormData({ ...formData, constituencyId: e.target.value })}
                    className="peer w-full pl-11 pr-4 py-3 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-855 dark:text-slate-100 font-bold cursor-pointer"
                  >
                    {loadingConstituencies ? (
                      <option value="">Syncing Constituencies...</option>
                    ) : (
                      constituencies.map((con) => (
                        <option key={con.id} value={con.id}>
                          {con.constituency_name === 'Upcoming Area' || con.constituency_name === 'Upcoming Area Node'
                            ? 'Not Listed (Send to All State Leaders)'
                            : con.constituency_name}
                        </option>
                      ))
                    )}
                  </select>
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-cyan-600 dark:text-cyan-400 pointer-events-none z-10 animate-icon-bounce-centered" strokeWidth={2.2} />
                </div>
              </div>
            </div>

            {/* Constituency Finder Help Box */}
            <div className="p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-500/5 text-left flex flex-col gap-2">
              <div className="flex items-center gap-2 text-cyan-500">
                <HelpCircle className="w-4 h-4 text-cyan-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Constituency Finder Helper
                </span>
              </div>
              <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-semibold">
                To find your constituency, search Google for your college/school address pincode followed by <span className="font-mono text-cyan-600 dark:text-cyan-400">"assembly constituency"</span> (e.g. search: <span className="font-mono text-cyan-600 dark:text-cyan-400">"500001 assembly constituency"</span>). Match it with the dropdown select list. If it is not listed, select <strong className="text-amber-500">"Not Listed (Send to All State Leaders)"</strong>.
              </p>
            </div>

            {/* Motivation / Reason */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Statement of Purpose / Why do you want to join?</label>
              <div className="relative">
                <textarea
                  required
                  rows={4}
                  placeholder="Tell us about your campus, advocacy ideas, or how you want to support student welfare..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="peer w-full pl-11 pr-4 py-3 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-855 dark:text-slate-100 font-bold leading-relaxed resize-none"
                />
                <AlignLeft className="absolute left-4 top-4.5 w-4.5 h-4.5 text-cyan-600 dark:text-cyan-400 pointer-events-none z-10 animate-icon-bounce-static" strokeWidth={2.2} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 border-t border-slate-200/40 dark:border-slate-850 pt-5">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-slate-550 dark:text-slate-400" strokeWidth={2.2} /> Cancel Application
              </button>
              
              <PremiumButton
                type="submit"
                variant="primary"
                size="md"
                disabled={loading}
                icon={loading ? null : <Send className="w-4 h-4 text-white" strokeWidth={2.5} />}
                className="w-full sm:w-auto"
              >
                {loading ? 'Transmitting Registry...' : 'Transmit Application'}
              </PremiumButton>
            </div>
          </form>
        </GlassCard>
      </AnimatedSection>
    </div>
  );
}
