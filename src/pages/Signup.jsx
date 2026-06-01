import React, { useState } from 'react';
import { useNavigate as useNav, Link as RouterLink } from 'react-router-dom';
import { Shield, Lock, User, ArrowRight, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import PremiumButton from '../components/PremiumButton';

export default function Signup() {
  const navigate = useNav();
  const { signup, currentUser, userProfile } = useAuth();

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

  const [formData, setFormData] = useState({ 
    name: '', 
    username: '', 
    password: '' 
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!formData.username.trim()) {
      setError('Please enter your username.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      // 1. Authenticate and register user in relational database.
      // We map username to the email argument of the signup function.
      const profile = await signup(
        formData.username.trim().toLowerCase(),
        formData.password,
        formData.name.trim(),
        null, // Phone is optional/null
        null, // Selected inside Student Dashboard
        null, // Selected inside Student Dashboard
        null  // Profile image
      );
      
      setLoading(false);
      
      // Dynamic redirection
      if (profile.role === 'student') {
        navigate('/dashboard/student');
      } else {
        navigate('/dashboard/leader');
      }
    } catch (err) {
      setLoading(false);
      console.error(err);
      setError(err.message || 'Registration failed.');
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
              Enroll Student Profile
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Create student credentials to access the portal
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
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-bold"
                />
              </div>
            </div>

            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Advocacy Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. rahul123"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-bold"
                />
              </div>
            </div>
        
            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Access Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-bold"
                />
              </div>
            </div>

            {/* Agreement Checklist */}
            <div className="flex items-start gap-2.5 mt-1">
              <input type="checkbox" required className="mt-1 rounded border-slate-300 dark:border-slate-800 cursor-pointer" />
              <p className="text-[10px] text-slate-450 leading-normal font-semibold">
                I agree to the statewide student terms. I verify all entered academic information is correct and authentic under legal review.
              </p>
            </div>

            {/* Register trigger */}
            <PremiumButton 
              type="submit" 
              variant="primary" 
              size="md" 
              className="w-full mt-2"
              icon={loading ? null : <ArrowRight className="w-4 h-4" />}
              disabled={loading}
            >
              {loading ? 'Activating Profile Coordinates...' : 'Enroll Student Profile'}
            </PremiumButton>

            <p className="text-center text-xs text-slate-400 mt-2 font-bold">
              Already have a profile logged?{' '}
              <RouterLink to="/login" className="font-extrabold text-cyan-500 hover:underline">
                Sign In
              </RouterLink>
            </p>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
