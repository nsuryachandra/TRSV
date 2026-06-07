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

  const [showWelcome, setShowWelcome] = useState(false);

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
      {/* Cinematic Welcome Splash Screen disabled for native Welcome.jsx routing */}

      {/* Background Canvas Particles */}
      <FloatingParticles />

      {/* Sticky Floating Premium Navbar */}
      {location.pathname !== '/' && (
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
              <span style={{fontFamily:'Satoshi,Inter,sans-serif',fontWeight:700,fontSize:'1.125rem',letterSpacing:'-0.04em',lineHeight:1}} className="bg-clip-text text-transparent bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-700 dark:from-sky-400 dark:via-cyan-400 dark:to-blue-500">
                TRSV
              </span>
              <span style={{fontFamily:'Inter,sans-serif',fontSize:'0.5625rem',fontWeight:500,letterSpacing:'0.1em'}} className="hidden sm:inline text-slate-400 dark:text-slate-500 uppercase">
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
                  style={{fontFamily:'Inter,sans-serif',fontSize:'0.875rem',fontWeight: isActive ? 600 : 500,letterSpacing:'-0.01em'}}
                  className={`px-3.5 py-2 transition-all duration-200 relative ${
                    isActive
                      ? 'text-sky-600 dark:text-cyan-400'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  <span className="relative z-10">{link.name}</span>
                  {isActive && (
                    <motion.span
                      layoutId="activeNavIndicator"
                      className="absolute bottom-0 left-3.5 right-3.5 h-[1.5px] bg-gradient-to-r from-sky-500 via-cyan-400 to-indigo-500 rounded-full shadow-[0_1px_8px_rgba(6,182,212,0.5)]"
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
                  variant="colorful" 
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
                  variant="colorful" 
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
      )}

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
      <main className={`flex-1 relative z-10 w-full ${location.pathname === '/' ? 'p-0 max-w-none' : 'max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10'}`}>
        <Outlet />
      </main>

      {/* Cinematic State Governance Footer */}
      {location.pathname !== '/' && (
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
      )}

    </div>
  );
}
