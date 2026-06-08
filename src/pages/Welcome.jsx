import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, User, Users, Lock, 
  CheckCircle2, Eye, EyeOff, Loader2, AlertCircle, Sparkles, Fingerprint
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

/* ═══════════════════════════════════════════════════════════════
   21st.dev-grade Reusable Sub-components (Light Theme)
   ═══════════════════════════════════════════════════════════════ */

/* ── Interactive Card with cursor-tracking border glow ── */
function InteractiveCard({ children, isActive, accentColor, onClick, disabled }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);
  const { isDark } = useTheme();

  const onMove = useCallback((e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  }, []);

  const colors = {
    cyan:    { glow: 'rgba(14,165,233,0.15)',  border: '#0ea5e9', bg: '#f0f9ff', darkBg: '#082f49' },
    emerald: { glow: 'rgba(16,185,129,0.15)',  border: '#10b981', bg: '#ecfdf5', darkBg: '#064e3b' },
    amber:   { glow: 'rgba(245,158,11,0.15)',  border: '#f59e0b', bg: '#fffbeb', darkBg: '#78350f' },
  };
  const c = colors[accentColor] || colors.cyan;

  return (
    <motion.button
      ref={ref}
      disabled={disabled}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      whileTap={{ scale: 0.96 }}
      className="relative flex flex-col items-center justify-between p-5 rounded-3xl border cursor-pointer overflow-hidden group w-full h-[146px] transition-all duration-300"
      style={{
        fontFamily: "'Satoshi', 'Inter', sans-serif",
        borderColor: isActive ? c.border : (isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226,232,240,0.9)'),
        backgroundColor: isActive 
          ? (isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff') 
          : (isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(248, 250, 252, 0.7)'),
        boxShadow: isActive
          ? `0 12px 30px -10px ${c.glow}, 0 2px 4px rgba(0,0,0,0.02), 0 0 0 1px ${c.border}`
          : '0 2px 8px rgba(15,23,42,0.02), 0 1px 3px rgba(15,23,42,0.01)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Background soft color tint when active */}
      {isActive && (
        <div 
          className="absolute inset-0 opacity-40 pointer-events-none transition-opacity duration-300"
          style={{ backgroundColor: isDark ? c.darkBg : c.bg }}
        />
      )}

      {/* Cursor-tracking radial glow */}
      {hovering && (
        <div
          className="pointer-events-none absolute w-36 h-36 rounded-full transition-opacity duration-200"
          style={{
            left: pos.x - 72, top: pos.y - 72,
            background: `radial-gradient(circle, ${c.glow}, transparent 70%)`,
            filter: 'blur(20px)',
            opacity: 0.85,
          }}
        />
      )}
      <div className="relative z-10 flex flex-col items-center justify-between h-full w-full py-0.5">
        {children}
      </div>
    </motion.button>
  );
}

/* ── Premium Input (21st.dev Style with outside label) ── */
function PremiumInput({ label, icon: Icon, error, helperText, value, onChange, ...props }) {
  const [focused, setFocused] = useState(false);
  const { isDark } = useTheme();

  return (
    <div className="w-full flex flex-col gap-2 text-left">
      <div className="flex justify-between items-center px-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500" style={{ fontFamily: "'Satoshi', sans-serif" }}>
          {label}
        </span>
        {helperText && !error && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            {helperText}
          </span>
        )}
      </div>
      <div className="relative flex items-center">
        <input
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`peer w-full py-3.5 pr-4 rounded-2xl border outline-none text-slate-800 dark:text-slate-100 text-sm font-semibold transition-all duration-300 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md
            ${Icon ? 'pl-12' : 'pl-4'}
            ${focused 
              ? 'border-sky-500 ring-4 ring-sky-500/10 shadow-[0_4px_16px_rgba(14,165,233,0.05)]' 
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
            }`}
          {...props}
        />
        {Icon && (
          <span className={`absolute left-4 pointer-events-none z-10 transition-colors duration-200 ${focused ? 'text-sky-500' : 'text-slate-450 dark:text-slate-500'} animate-icon-bounce-static`}>
            <Icon className="w-5 h-5" />
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Shimmer CTA Button (MagicUI / 21st.dev pattern) ── */
function ShimmerCTA({ children, onClick, disabled, gradient, type = 'button' }) {
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={onClick}
      disabled={disabled}
      type={type}
      className="relative w-full py-4 rounded-2xl font-bold text-sm text-white overflow-hidden disabled:opacity-40 cursor-pointer group shadow-[0_4px_20px_-4px_rgba(14,165,233,0.3)] transition-all duration-200 hover:shadow-[0_6px_24px_-4px_rgba(14,165,233,0.45)]"
      style={{ fontFamily: "'Satoshi', 'Inter', sans-serif", background: gradient }}
    >
      {/* Top highlight line */}
      <span className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      {/* Shimmer sweep */}
      <span className="absolute inset-0 overflow-hidden rounded-2xl">
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-800 ease-out">
          <span className="block w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </span>
      </span>
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Welcome Page — Light Theme Only
   ═══════════════════════════════════════════════════════════════ */
export default function Welcome() {
  const navigate = useNavigate();
  const { loginSimplified, login, userProfile, checkBiometricsAvailable, loginWithBiometrics } = useAuth();
  const { isDark } = useTheme();

  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsConfigured, setBiometricsConfigured] = useState(false);

  useEffect(() => {
    const checkBio = async () => {
      const status = await checkBiometricsAvailable();
      if (status && status.isAvailable) {
        setBiometricsAvailable(true);
        setBiometricsConfigured(status.isConfigured);
      }
    };
    checkBio();
  }, [checkBiometricsAvailable]);

  useEffect(() => {
    if (userProfile) {
      const r = userProfile.role;
      if (r === 'supreme_admin' || r === 'dev') navigate('/dashboard/command', { replace: true });
      else if (r === 'student') navigate('/dashboard/student', { replace: true });
      else navigate('/dashboard/leader', { replace: true });
    }
  }, [userProfile, navigate]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('username');
  const [username, setUsername] = useState(() => localStorage.getItem('trsv_saved_username') || '');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const usernameRegex = /^[a-zA-Z0-9_*.]+$/;
  const isUsernameValid = username.length >= 3 && username.length <= 20 && usernameRegex.test(username);

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    if (!isUsernameValid) return;
    setLoading(true); setErrorMsg('');
    try {
      const profile = await loginSimplified('username', username);
      setModalOpen(false);
      navigate(profile.role === 'student' ? '/dashboard/student' : '/dashboard/leader');
    } catch (err) { setErrorMsg(err.message || 'Authentication failed.'); }
    finally { setLoading(false); }
  };

  const handleGuestSubmit = async () => {
    setLoading(true); setErrorMsg('');
    try {
      await loginSimplified('guest');
      setModalOpen(false);
      navigate('/dashboard/student');
    } catch (err) { setErrorMsg(err.message || 'Guest entry failed.'); }
    finally { setLoading(false); }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) return;
    setLoading(true); setErrorMsg('');
    try {
      const profile = await login(adminEmail, adminPassword);
      setModalOpen(false);
      navigate((profile.role === 'supreme_admin' || profile.role === 'dev') ? '/dashboard/command' : '/dashboard/leader');
    } catch (err) { setErrorMsg(err.message || 'Admin login failed.'); }
    finally { setLoading(false); }
  };

  const handleBiometricLogin = async () => {
    setLoading(true); setErrorMsg('');
    try {
      const profile = await loginWithBiometrics();
      setModalOpen(false);
      navigate((profile.role === 'supreme_admin' || profile.role === 'dev') ? '/dashboard/command' : '/dashboard/leader');
    } catch (err) {
      setErrorMsg(err.message || 'Biometric verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => { setModalOpen(true); setErrorMsg(''); };

  const cardData = [
    { 
      id: 'username', 
      icon: User, 
      title: 'Student',  
      desc: 'Username login', 
      color: 'cyan',    
      gradient: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
      inactiveBg: 'rgba(14,165,233,0.08)',
      inactiveText: '#0284c7'
    },
    { 
      id: 'guest',    
      icon: Users, 
      title: 'Guest',   
      desc: 'Browse freely',  
      color: 'emerald', 
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      inactiveBg: 'rgba(16,185,129,0.08)',
      inactiveText: '#059669'
    },
    { 
      id: 'admin',    
      icon: Lock,  
      title: 'Admin',   
      desc: 'Officers only',  
      color: 'amber',   
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      inactiveBg: 'rgba(245,158,11,0.08)',
      inactiveText: '#d97706'
    },
  ];

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 select-none overflow-hidden w-full bg-[#f8fafc] dark:bg-slate-950 transition-colors duration-300"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        background: isDark ? 'linear-gradient(180deg, #090d16 0%, #0f172a 100%)' : 'linear-gradient(180deg, #f1f5f9 0%, #f8fafc 50%, #ffffff 100%)',
      }}
    >
      {/* Ambient background orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-sky-200/20 dark:bg-sky-900/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-amber-200/20 dark:bg-amber-900/10 blur-[130px] pointer-events-none" />
      {/* Subtle dot grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(15,23,42,0.03)_1px,transparent_1px)] dark:bg-[radial-gradient(circle,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* ── Hero Content ── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md flex flex-col items-center text-center relative z-10 gap-5"
      >
        {/* Photo with premium ring */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden welcome-photo"
          style={{
            boxShadow: isDark
              ? '0 0 0 3px rgba(245,158,11,0.3), 0 0 0 8px rgba(245,158,11,0.1), 0 24px 60px -12px rgba(0,0,0,0.5)'
              : '0 0 0 3px rgba(245,158,11,0.2), 0 0 0 8px rgba(245,158,11,0.06), 0 24px 60px -12px rgba(245,158,11,0.15)',
          }}
        >
          <img src="/entryakka.jpeg" alt="Kavitha Kalvakuntla" className="w-full h-full object-cover object-top scale-105" />
        </motion.div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-[0.15em] shadow-sm">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Student Command Portal
        </div>

        {/* Title — Satoshi Black */}
        <h1
          className="text-[1.6rem] sm:text-[2rem] md:text-[2.25rem] font-black uppercase tracking-tight leading-[1.12]"
          style={{ fontFamily: "'Satoshi', 'Inter', sans-serif" }}
        >
          <span className="text-slate-800 dark:text-slate-100 transition-colors duration-300">Welcome to</span><br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600">
            Telangana Vidyarthi
          </span><br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600">
            Rakshana Sena
          </span>
        </h1>

        {/* Description */}
        <p className="text-[13.5px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs font-semibold transition-colors duration-300">
          Under the visionary leadership of Kavitha Kalvakuntla — safeguarding student welfare statewide.
        </p>

        {/* ── Enter Portal CTA — Shimmer Button ── */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={openModal}
          className="mt-2 relative inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-[13px] tracking-tight text-white overflow-hidden cursor-pointer group"
          style={{
            fontFamily: "'Satoshi', 'Inter', sans-serif",
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            boxShadow: '0 8px 30px -4px rgba(14,165,233,0.35), 0 2px 4px rgba(0,0,0,0.04)',
          }}
        >
          {/* Top highlight */}
          <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          {/* Shimmer sweep on hover */}
          <span className="absolute inset-0 overflow-hidden rounded-2xl">
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out">
              <span className="block w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            </span>
          </span>
          <span className="relative z-10 flex items-center gap-2">
            ENTER PORTAL
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
          </span>
        </motion.button>
      </motion.div>

      {/* ═══════════════ Identity Modal ═══════════════ */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { if (!loading) setModalOpen(false); }}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm z-0"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ type: 'spring', stiffness: 160, damping: 22 }}
              className="w-full max-w-[480px] relative z-10 rounded-3xl overflow-hidden transition-colors duration-300"
              style={{
                background: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(30px) saturate(180%)',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.6)',
                boxShadow: isDark ? '0 30px 70px -10px rgba(0,0,0,0.5)' : '0 30px 70px -10px rgba(15,23,42,0.15)',
              }}
            >
              <div className="p-6 sm:p-8">
                {/* Header */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight transition-colors duration-300" style={{ fontFamily: "'Satoshi', 'Inter', sans-serif" }}>
                    Choose Access Mode
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-semibold tracking-wide">Select your portal entry method</p>
                </div>

                {/* ── 3-Card Identity Selector ── */}
                <div className="grid grid-cols-3 gap-3.5 mb-7">
                  {cardData.map((card) => {
                    const isActive = modalTab === card.id;
                    const IconComponent = card.icon;
                    return (
                      <InteractiveCard
                        key={card.id}
                        isActive={isActive}
                        accentColor={card.color}
                        disabled={loading}
                        onClick={() => { setModalTab(card.id); setErrorMsg(''); }}
                      >
                        {/* Icon Container with explicit BackgroundImage/Color */}
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-105"
                          style={{ 
                            backgroundImage: isActive ? card.gradient : 'none',
                            backgroundColor: isActive ? 'transparent' : (isDark ? 'rgba(255,255,255,0.03)' : card.inactiveBg),
                            boxShadow: isActive ? '0 4px 14px rgba(14,165,233,0.25)' : 'none'
                          }}
                        >
                          <IconComponent 
                            className="w-5 h-5" 
                            stroke={isActive ? '#ffffff' : card.inactiveText}
                            strokeWidth={2.5}
                          />
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[12.5px] font-extrabold text-slate-800 dark:text-slate-200 tracking-tight leading-normal" style={{ fontFamily: "'Satoshi', 'Inter', sans-serif" }}>
                            {card.title}
                          </span>
                          <span className="text-[9.5px] text-slate-400 dark:text-slate-550 font-bold mt-0.5 leading-none">
                            {card.desc}
                          </span>
                        </div>
                      </InteractiveCard>
                    );
                  })}
                </div>

                {/* Error */}
                {errorMsg && (
                  <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/30 text-rose-600 dark:text-rose-450 text-xs font-semibold mb-5">
                    <AlertCircle className="w-4 h-4 shrink-0" /><span>{errorMsg}</span>
                  </div>
                )}

                {/* ── Form Area ── */}
                <div className="min-h-[170px] flex flex-col justify-center">
                  {/* USERNAME */}
                  {modalTab === 'username' && (
                    <motion.form key="username" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                      onSubmit={handleUsernameSubmit} className="flex flex-col gap-5">
                      <PremiumInput
                        label="Username"
                        icon={User}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. surya_chandra"
                        disabled={loading}
                        helperText="Use 3–20 letters, numbers, _, *, or . only"
                      />
                      <ShimmerCTA type="submit" disabled={loading || !isUsernameValid} gradient="linear-gradient(135deg, #0ea5e9, #2563eb)">
                        {loading ? <span className="flex items-center justify-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...</span> : 'Continue'}
                      </ShimmerCTA>
                    </motion.form>
                  )}

                  {/* GUEST */}
                  {modalTab === 'guest' && (
                    <motion.div key="guest" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="flex flex-col gap-5">
                      <p className="text-[13.5px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold text-center px-1">
                        Browse student boards, district registers, and contact coordinators — no account needed.
                      </p>
                      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold shadow-sm justify-center">
                        <Users className="w-5 h-5 shrink-0 text-emerald-500" />
                        <span>Guest credentials auto-generated in memory.</span>
                      </div>
                      <ShimmerCTA onClick={handleGuestSubmit} disabled={loading} gradient="linear-gradient(135deg, #10b981, #059669)">
                        {loading ? <span className="flex items-center justify-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Entering...</span> : 'Enter as Guest'}
                      </ShimmerCTA>
                    </motion.div>
                  )}

                  {/* ADMIN */}
                  {modalTab === 'admin' && (
                    <motion.form key="admin" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                      onSubmit={handleAdminSubmit} className="flex flex-col gap-4">
                      <PremiumInput
                        label="Officer Email"
                        type="email"
                        icon={User}
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="officer@tvrs.gov.in"
                        disabled={loading}
                      />
                      <div className="relative">
                        <PremiumInput
                          label="Secure Key"
                          type={showPassword ? 'text' : 'password'}
                          icon={Lock}
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="••••••••"
                          disabled={loading}
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)} 
                          className="absolute right-4 bottom-[14px] text-slate-400 hover:text-slate-655 cursor-pointer transition-colors z-10"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <ShimmerCTA type="submit" disabled={loading || !adminEmail || !adminPassword} gradient="linear-gradient(135deg, #f59e0b, #d97706)">
                        {loading ? <span className="flex items-center justify-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Authorizing...</span> : 'Secure Connect'}
                      </ShimmerCTA>

                      {biometricsAvailable && biometricsConfigured && (
                        <div className="flex flex-col gap-2 mt-1">
                          <div className="relative flex py-1 items-center">
                            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
                            <span className="flex-shrink mx-4 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">or</span>
                            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
                          </div>
                          
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            onClick={handleBiometricLogin}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-bold text-[13px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100/80 dark:hover:bg-amber-950/40 border border-amber-200/50 dark:border-amber-900/30 shadow-sm transition-all duration-300 focus:outline-none cursor-pointer"
                          >
                            <Fingerprint className="w-5 h-5 text-amber-600 dark:text-amber-500 animate-pulse" />
                            Use Touch ID / Face ID
                          </motion.button>
                        </div>
                      )}

                      {biometricsAvailable && !biometricsConfigured && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold text-center mt-2">
                          💡 Tip: Enable biometric sign-in in your dashboard settings for instant access.
                        </p>
                      )}
                    </motion.form>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
