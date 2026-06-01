import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ShieldAlert, Key, MessageCircle, HelpCircle, Phone, Globe, ExternalLink, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '../components/ThemeToggle';
import PremiumButton from '../components/PremiumButton';
import FloatingParticles from '../components/FloatingParticles';
import { useAuth } from '../context/AuthContext';

export default function RootLayout() {
  const { currentUser, userProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [showWelcome, setShowWelcome] = useState(() => {
    return !sessionStorage.getItem('trsv_welcome_shown');
  });

  useEffect(() => {
    if (location.pathname === '/' && showWelcome) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [showWelcome, location.pathname]);

  const handleCloseWelcome = () => {
    sessionStorage.setItem('trsv_welcome_shown', 'true');
    setShowWelcome(false);
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Join TRSV', path: '/#join-trsv' }
  ];

  const handleNavClick = (e, path) => {
    if (path === '/') {
      if (location.pathname === '/') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (path.startsWith('/#')) {
      e.preventDefault();
      const id = path.substring(2);
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          const el = document.getElementById(id);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative select-none">
      {/* Cinematic Welcome Splash Screen overlaying entire viewport */}
      <AnimatePresence>
        {location.pathname === '/' && showWelcome && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            exit={{ y: '-100vh', opacity: 0 }}
            transition={{ duration: 0.95, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 bg-slate-950 text-white select-none overflow-hidden h-screen w-screen"
          >
            {/* Ambient official background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,#0f172a_0%,#020617_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
            
            {/* Content card centered */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8, ease: 'easeOut' }}
              className="w-full max-w-2xl h-full max-h-[92vh] flex flex-col items-center justify-center text-center relative z-10 px-4 gap-y-3 sm:gap-y-4"
            >
              {/* Founder Image Frame - Larger and official gold themed */}
              <div className="relative w-64 h-64 xs:w-72 xs:h-72 sm:w-80 sm:h-80 md:w-[360px] md:h-[360px] rounded-full overflow-hidden border-[8px] border-amber-500/50 dark:border-amber-400/60 shadow-[0_0_50px_rgba(245,158,11,0.3)] mb-4 shrink-0 bg-slate-900 transition-all duration-300 hover:scale-103 hover:border-amber-400 welcome-photo">
                <img 
                  src="/entryakka.jpeg" 
                  alt="Kavitha Kalvakuntla - Founder" 
                  className="w-full h-full object-cover object-top scale-105"
                />
                {/* Horizontal light scanning bar */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-scan-line pointer-events-none" />
                {/* Frosted lens reflection overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-white/10 pointer-events-none" />
              </div>

              {/* Official header badges */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 text-[10px] font-sans font-black text-amber-400 uppercase tracking-wider shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                STATEWIDE STUDENT COMMAND PORTAL
              </div>

              <h1 className="text-xl xs:text-2.5xl sm:text-3.5xl md:text-4xl font-black text-white uppercase tracking-tight leading-tight select-none welcome-title shrink-0">
                Welcome To <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">
                  Telangana Rakshana Sena
                </span> <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-500">
                  Vidyarthi Vibhagam
                </span> <br />
                <span className="text-white">Portal</span>
              </h1>

              <div className="h-[2px] w-20 bg-gradient-to-r from-transparent via-amber-500 to-transparent shrink-0" />

              <p className="text-[11px] sm:text-xs md:text-sm text-slate-400 leading-relaxed font-semibold max-w-md welcome-desc">
                "Under the leadership of our beloved founder, Kavitha Kalvakuntla, TRSV is committed to safeguarding student welfare, defending academic rights, and pioneering statewide self-governance. Welcome to the official command portal."
              </p>

              <div className="shrink-0">
                <PremiumButton 
                  variant="primary" 
                  size="lg" 
                  className="px-10 py-2 sm:px-12 sm:py-3 shadow-glow-cyan text-sm sm:text-base font-black tracking-wide hover:scale-105 transition-transform"
                  onClick={handleCloseWelcome}
                >
                  ENTER SYSTEM PORTAL
                </PremiumButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Canvas Particles */}
      <FloatingParticles />

      {/* Sticky Floating Premium Navbar */}
      <header className="sticky top-0 z-40 w-full px-4 sm:px-6 py-4 transition-all duration-300">
        <nav className="max-w-7xl mx-auto rounded-2xl glass-panel-light dark:glass-panel-dark glass-card-border-light dark:glass-card-border-dark px-4 sm:px-6 py-3 flex items-center justify-between shadow-premium-light dark:shadow-premium-dark relative">
          
          {/* Logo with TRSV Image */}
          <Link to="/" onClick={(e) => handleNavClick(e, '/')} className="flex items-center gap-2.5 group">
            <img 
              src="/trsv.jpeg" 
              alt="TRSV Logo" 
              className="w-9 h-9 rounded-xl object-cover border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.15)] transition-transform group-hover:scale-105 shrink-0"
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-700 dark:from-sky-400 dark:via-cyan-400 dark:to-blue-500">
                TRSV
              </span>
              <span className="hidden sm:inline text-[9px] font-medium text-slate-400 dark:text-slate-500 tracking-widest uppercase">
                Student Governance
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path && !link.path.includes('#');
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={(e) => handleNavClick(e, link.path)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 relative ${
                    isActive
                      ? 'text-sky-600 dark:text-cyan-400'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-350 dark:hover:text-slate-100'
                  }`}
                >
                  <span className="relative z-10">{link.name}</span>
                  {isActive && (
                    <motion.span
                      layoutId="activeNavIndicator"
                      className="absolute inset-0 z-0 bg-sky-50 dark:bg-cyan-950/40 rounded-lg border-b border-sky-300/30 dark:border-cyan-500/20"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser && userProfile ? (
              <>
                <PremiumButton 
                  variant="glow" 
                  size="sm" 
                  icon={<MessageCircle className="w-4 h-4" />}
                  onClick={() => {
                    if (userProfile.role === 'supreme_admin' || userProfile.role === 'dev') {
                      navigate('/dashboard/command');
                    } else if (userProfile.role === 'student') {
                      navigate('/dashboard/student');
                    } else {
                      navigate('/dashboard/leader');
                    }
                  }}
                >
                  Go to Dashboard
                </PremiumButton>
                
                <PremiumButton 
                  variant="secondary" 
                  size="sm" 
                  icon={<Key className="w-4 h-4" />}
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                >
                  Sign Out
                </PremiumButton>
              </>
            ) : (
              <>
                <PremiumButton 
                  variant="glow" 
                  size="sm" 
                  onClick={() => navigate('/signup')}
                >
                  <div className="flex flex-col items-start leading-tight text-left">
                    <span className="font-extrabold text-xs">Create New Account</span>
                    <span className="text-[9px] opacity-75 font-normal">Register Complaint</span>
                  </div>
                </PremiumButton>
                
                <PremiumButton 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => navigate('/login')}
                >
                  <div className="flex flex-col items-start leading-tight text-left">
                    <span className="font-extrabold text-xs">Login</span>
                    <span className="text-[9px] opacity-75 font-normal">Users & Admins</span>
                  </div>
                </PremiumButton>
              </>
            )}
            
            <ThemeToggle />
          </div>

          {/* Mobile Hamburg Trigger & Toggle */}
          <div className="flex md:hidden items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-100/80 border border-slate-200/50 dark:bg-slate-900/60 dark:border-slate-800/60 text-slate-600 dark:text-slate-300"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </nav>
      </header>

      {/* Mobile Frosted Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-4 top-[90px] z-50 rounded-2xl glass-panel-light dark:glass-panel-dark glass-card-border-light dark:glass-card-border-dark p-6 shadow-premium-dark border border-slate-200/50 dark:border-slate-850 md:hidden flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path && !link.path.includes('#');
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={(e) => {
                      setMobileMenuOpen(false);
                      handleNavClick(e, link.path);
                    }}
                    className={`px-4 py-2.5 rounded-xl text-base font-semibold transition-colors duration-200 ${
                      isActive
                        ? 'bg-sky-50 text-sky-600 dark:bg-cyan-950/40 dark:text-cyan-400'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
            
            <div className="h-[1px] bg-slate-200 dark:bg-slate-800 my-1" />
            
            <div className="flex flex-col gap-3">
              {currentUser && userProfile ? (
                <>
                  <PremiumButton 
                    variant="primary" 
                    size="md" 
                    className="w-full"
                    icon={<MessageCircle className="w-4 h-4" />}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (userProfile.role === 'supreme_admin' || userProfile.role === 'dev') {
                        navigate('/dashboard/command');
                      } else if (userProfile.role === 'student') {
                        navigate('/dashboard/student');
                      } else {
                        navigate('/dashboard/leader');
                      }
                    }}
                  >
                    Go to Dashboard
                  </PremiumButton>
                  <PremiumButton 
                    variant="secondary" 
                    size="md" 
                    className="w-full"
                    icon={<Key className="w-4 h-4" />}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                      navigate('/');
                    }}
                  >
                    Sign Out
                  </PremiumButton>
                </>
              ) : (
                <>
                  <PremiumButton 
                    variant="primary" 
                    size="md" 
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/signup');
                    }}
                  >
                    <div className="flex flex-col items-center leading-tight">
                      <span className="font-extrabold text-sm">Create New Account</span>
                      <span className="text-[10px] opacity-85 font-normal">Register Complaint</span>
                    </div>
                  </PremiumButton>
                  <PremiumButton 
                    variant="secondary" 
                    size="md" 
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/login');
                    }}
                  >
                    <div className="flex flex-col items-center leading-tight">
                      <span className="font-extrabold text-sm">Login</span>
                      <span className="text-[10px] opacity-85 font-normal">Users & Admins</span>
                    </div>
                  </PremiumButton>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Page Layout Route Wrapper */}
      <main className="flex-1 relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 md:py-10">
        <Outlet />
      </main>

      {/* Cinematic State Governance Footer */}
      <footer className="relative z-10 w-full mt-auto border-t border-slate-200/50 dark:border-slate-900/60 glass-panel-light dark:glass-panel-dark bg-white/45 dark:bg-slate-950/40 pt-16 pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Logo & Info column */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <img 
                src="/trsv.jpeg" 
                alt="TRSV Logo" 
                className="w-8 h-8 rounded-lg object-cover border border-cyan-500/30"
              />
              <span className="font-black text-xl tracking-tight text-slate-800 dark:text-white">TRSV</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Telangana Rakshana Sena Vidyarthi Vibhagam is a premier student union organization offering campus representation, peer mentorship, transparency auditing, and complaint assistance.
            </p>
            <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 text-sm">
              <Globe className="w-4 h-4 text-cyan-500" />
              <span>Official Student Union Portal v1.0.0</span>
            </div>
          </div>

          {/* Organization Directory */}
          <div className="flex flex-col gap-4">
            <h4 className="font-semibold text-sm tracking-wider uppercase text-slate-700 dark:text-slate-350">
              Union Directory
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Link to="/login" className="text-slate-500 dark:text-slate-450 hover:text-cyan-500 dark:hover:text-cyan-400">About TRSV</Link>
              <Link to="/login" className="text-slate-500 dark:text-slate-450 hover:text-cyan-500 dark:hover:text-cyan-400">Services</Link>
              <Link to="/login" className="text-slate-500 dark:text-slate-450 hover:text-cyan-500 dark:hover:text-cyan-400">Public Audit</Link>
              <Link to="/login" className="text-slate-500 dark:text-slate-450 hover:text-cyan-500 dark:hover:text-cyan-400">Districts</Link>
              <Link to="/login" className="text-slate-500 dark:text-slate-450 hover:text-cyan-500 dark:hover:text-cyan-400">Leadership</Link>
              <Link to="/login" className="text-slate-500 dark:text-slate-450 hover:text-cyan-500 dark:hover:text-cyan-400">Support Hub</Link>
              <Link to="/login" className="text-slate-500 dark:text-slate-450 hover:text-cyan-500 dark:hover:text-cyan-400">Notices</Link>
              <Link to="/#join-trsv" onClick={(e) => handleNavClick(e, '/#join-trsv')} className="text-slate-500 dark:text-slate-450 hover:text-cyan-500 dark:hover:text-cyan-400">Join Union</Link>
            </div>
          </div>

          {/* Official Hotlines */}
          <div className="flex flex-col gap-4">
            <h4 className="font-semibold text-sm tracking-wider uppercase text-slate-700 dark:text-slate-350">
              Union Support Helpdesks
            </h4>
            <ul className="flex flex-col gap-3 text-sm text-slate-500 dark:text-slate-450">
              <li className="flex items-center gap-2.5">
                <div className="p-1.5 rounded bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-500">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div>
                  <a href="mailto:karthikyadavtjsf@gmail.com" className="block font-semibold text-slate-700 dark:text-slate-300 hover:underline">karthikyadavtjsf@gmail.com</a>
                  <span className="text-[11px] text-slate-400">Email Assistance Support</span>
                </div>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="p-1.5 rounded bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-500">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div>
                  <a href="tel:8142443684" className="block font-semibold text-slate-700 dark:text-slate-300 hover:underline">+91 8142443684</a>
                  <span className="text-[11px] text-slate-400">Direct Support Hotline</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Legal Compliance & Badges */}
          <div className="flex flex-col gap-4">
            <h4 className="font-semibold text-sm tracking-wider uppercase text-slate-700 dark:text-slate-350">
              Union Administration
            </h4>
            <div className="flex flex-col gap-3 text-sm text-slate-500 dark:text-slate-450">
              <p className="text-xs text-slate-450">
                Centralized student union web portal for transparency, issue mediation, and campaign coordination.
              </p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-cyan-400 uppercase tracking-wider">
                  <Scale className="w-3.5 h-3.5 text-cyan-500" />
                  Self-Governance
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-sky-400 uppercase tracking-wider">
                  SSL Secured
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright details */}
        <div className="max-w-7xl mx-auto border-t border-slate-200/50 dark:border-slate-900/60 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center md:text-left">
            © {new Date().getFullYear()} TRSV (Telangana Rakshana Sena Vidyarthi Vibhagam). Developed for student union empowerment. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
            <Link to="/login" className="hover:text-cyan-500">Staff Access</Link>
            <span>•</span>
            <Link to="/login" className="hover:text-cyan-500">Audit Protocol</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
