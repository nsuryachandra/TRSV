import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, User, ShieldAlert, ArrowRight, Fingerprint } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import PremiumButton from '../components/PremiumButton';

export default function Login() {
  const navigate = useNavigate();
  const { 
    login, 
    currentUser, 
    userProfile,
    checkBiometricsAvailable,
    loginWithBiometrics 
  } = useAuth();

  // Biometrics States
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsConfigured, setBiometricsConfigured] = useState(false);

  React.useEffect(() => {
    if (currentUser && userProfile) {
      if (userProfile.role === 'supreme_admin' || userProfile.role === 'dev') {
        navigate('/dashboard/command');
      } else if (userProfile.role === 'student') {
        navigate('/dashboard/student');
      } else {
        navigate('/dashboard/leader');
      }
    }
  }, [currentUser, userProfile, navigate]);

  React.useEffect(() => {
    const initBiometrics = async () => {
      const status = await checkBiometricsAvailable();
      if (status.isAvailable) {
        setBiometricsAvailable(true);
        if (status.isConfigured) {
          setBiometricsConfigured(true);
          if (status.enrolledUser) {
            setUsername(status.enrolledUser);
          }
        }
      }
    };
    initBiometrics();
  }, [checkBiometricsAvailable]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectUser = (user) => {
    if (user.role === 'supreme_admin' || user.role === 'dev') {
      navigate('/dashboard/command');
    } else if (user.role === 'student') {
      navigate('/dashboard/student');
    } else {
      navigate('/dashboard/leader');
    }
  };

  const handleBiometricLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await loginWithBiometrics();
      setLoading(false);
      redirectUser(user);
    } catch (err) {
      setLoading(false);
      console.warn('[Biometrics Login] Failed:', err.message);
      setError(err.message || 'Biometric authentication failed.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(username.trim().toLowerCase(), password);
      setLoading(false);
      redirectUser(user);
    } catch (err) {
      setLoading(false);
      console.error(err);
      setError(err.message || 'Access denied: Authentication failed.');
    }
  };

  return (
    <div className="w-full min-h-[75vh] flex items-center justify-center py-6 px-4">
      <div className="w-full max-w-md">
        
        <GlassCard hoverEffect={false} className="p-8 relative">
          {/* Neon backing light flare */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-400/10 to-transparent blur-xl rounded-bl-full pointer-events-none" />
          
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center shadow-glow-cyan text-white">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="font-extrabold text-2xl text-slate-850 dark:text-white mt-1">
              Access Governance OS
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Provide credentials to sync your terminal
            </p>
          </div>

          {/* Premium diagnostic alert card */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500 text-xs text-left">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
            {/* Username Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Advocacy Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Username or Admin ID"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-bold"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Access Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-bold"
                />
              </div>
            </div>

            {/* Sign in Trigger */}
            <PremiumButton 
              type="submit" 
              variant="primary" 
              size="md" 
              className="w-full mt-2"
              icon={loading ? null : <ArrowRight className="w-4 h-4" />}
              disabled={loading}
            >
              {loading ? 'Decrypting Credentials...' : 'Sign In to Terminal'}
            </PremiumButton>

            {biometricsConfigured && (
              <div className="flex flex-col items-center gap-2 mt-4 pt-4 border-t border-slate-200/20 dark:border-slate-800/40">
                <button
                  type="button"
                  onClick={handleBiometricLogin}
                  className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-tr from-cyan-500/15 to-sky-500/15 hover:from-cyan-500/25 hover:to-sky-500/25 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300 shadow-glow-cyan/25 hover:shadow-glow-cyan/50 transition-all duration-300 cursor-pointer active:scale-95 animate-[pulse_2s_infinite]"
                  title="Login with Biometrics"
                >
                  <Fingerprint className="w-7 h-7" />
                </button>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                  Scan Fingerprint to Unlock
                </span>
              </div>
            )}

            <p className="text-center text-xs text-slate-400 mt-2 font-bold">
              New to the state governance network?{' '}
              <Link to="/signup" className="font-extrabold text-cyan-500 hover:underline">
                Create Profile
              </Link>
            </p>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
