import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ShieldAlert, Key, MessageCircle, HelpCircle, Phone, Globe, ExternalLink, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '../components/ThemeToggle';
import PremiumButton from '../components/PremiumButton';
import FloatingParticles from '../components/FloatingParticles';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';

export default function RootLayout() {
  const { currentUser, userProfile, logout } = useAuth();
  const { shortName, fullName } = useOrg();
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
    { name: 'Join TVRS', path: '/#join-tvrs' }
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
          
          {/* Logo with Org Image */}
          <Link to="/" onClick={(e) => handleNavClick(e, '/')} className="flex items-center gap-2.5 group">
            <img 
              src="/tvrs.jpeg" 
              alt={`${shortName} Logo`} 
              className="w-9 h-9 rounded-xl object-cover border border-blue-700/40 shadow-sm transition-transform group-hover:scale-105 shrink-0"
            />
            <div className="flex flex-col">
              <span style={{fontFamily:'Poppins, sans-serif',fontWeight:600,fontSize:'1.125rem',letterSpacing:'-0.02em',lineHeight:1}} className="text-blue-700 dark:text-blue-400">
                {shortName}
              </span>
              <span style={{fontFamily:'Poppins, sans-serif',fontSize:'0.5625rem',fontWeight:500,letterSpacing:'0.08em'}} className="hidden sm:inline text-amber-600 dark:text-amber-400 uppercase mt-0.5">
                Official Student Portal
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
                  style={{fontFamily:'Poppins, sans-serif',fontSize:'0.875rem',fontWeight: isActive ? 600 : 500}}
                  className={`px-3.5 py-2 transition-all duration-200 relative ${
                    isActive
                      ? 'text-blue-700 dark:text-blue-400'
                      : 'text-slate-700 hover:text-blue-700 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  <span className="relative z-10">{link.name}</span>
                  {isActive && (
                    <motion.span
                      layoutId="activeNavIndicator"
                      className="absolute bottom-0 left-3.5 right-3.5 h-[2px] bg-amber-500 rounded-full"
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
                    <span className="font-semibold text-xs">Create New Account</span>
                    <span className="text-[9px] opacity-80 font-normal">Register Application</span>
                  </div>
                </PremiumButton>
                
                <PremiumButton 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => navigate('/login')}
                >
                  <div className="flex flex-col items-start leading-tight text-left">
                    <span className="font-semibold text-xs">Sign In</span>
                    <span className="text-[9px] opacity-80 font-normal">Members & Admins</span>
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
              className="p-2 rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          </nav>
        </header>
      )}

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-4 top-[90px] z-50 rounded-2xl glass-panel-light dark:glass-panel-dark p-6 shadow-xl border border-slate-200 dark:border-slate-800 md:hidden flex flex-col gap-4"
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
                    className={`px-4 py-2.5 rounded-xl text-base font-medium transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
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
                      <span className="font-semibold text-sm">Create New Account</span>
                      <span className="text-[10px] opacity-85 font-normal">Register Application</span>
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
                      <span className="font-semibold text-sm">Sign In</span>
                      <span className="text-[10px] opacity-85 font-normal">Members & Admins</span>
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

      {/* Official Government / Student Organization Footer */}
      {location.pathname !== '/' && (
        <footer className="relative z-10 w-full mt-auto border-t border-slate-200 dark:border-slate-800 glass-panel-light dark:glass-panel-dark bg-white dark:bg-slate-900 pt-16 pb-8 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            
            {/* Logo & Info column */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <img 
                  src="/tvrs.jpeg" 
                  alt={`${shortName} Logo`} 
                  className="w-8 h-8 rounded-lg object-cover border border-blue-700/30"
                />
                <span className="font-semibold text-xl tracking-tight text-slate-900 dark:text-white">{shortName}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {fullName} is an official student organization offering campus representation, leadership development, transparency auditing, and student protection.
              </p>
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm">
                <Globe className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <span>Official Student Union Portal</span>
              </div>
            </div>

            {/* Organization Directory */}
            <div className="flex flex-col gap-4">
              <h4 className="font-semibold text-sm tracking-wider uppercase text-slate-900 dark:text-slate-200">
                Organization Directory
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Link to="/login" className="text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400">About {shortName}</Link>
                <Link to="/login" className="text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400">Services</Link>
                <Link to="/login" className="text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400">Public Audit</Link>
                <Link to="/login" className="text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400">Constituencies</Link>
                <Link to="/login" className="text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400">Leadership</Link>
                <Link to="/login" className="text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400">Support Hub</Link>
                <Link to="/login" className="text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400">Notices</Link>
                <Link to="/#join-tvrs" onClick={(e) => handleNavClick(e, '/#join-tvrs')} className="text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400">Join Union</Link>
              </div>
            </div>

            {/* Official Support Helpdesks */}
            <div className="flex flex-col gap-4">
              <h4 className="font-semibold text-sm tracking-wider uppercase text-slate-900 dark:text-slate-200">
                Support Helpdesks
              </h4>
              <ul className="flex flex-col gap-3 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <a href="mailto:karthikyadavtjsf@gmail.com" className="block font-medium text-slate-800 dark:text-slate-200 hover:underline">karthikyadavtjsf@gmail.com</a>
                    <span className="text-[11px] text-slate-500">Email Assistance Support</span>
                  </div>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <a href="tel:8142443684" className="block font-medium text-slate-800 dark:text-slate-200 hover:underline">+91 8142443684</a>
                    <span className="text-[11px] text-slate-500">Direct Support Hotline</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Administration & Badges */}
            <div className="flex flex-col gap-4">
              <h4 className="font-semibold text-sm tracking-wider uppercase text-slate-900 dark:text-slate-200">
                Union Governance
              </h4>
              <div className="flex flex-col gap-3 text-sm text-slate-600 dark:text-slate-400">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Centralized student organization portal for transparency, grievance handling, and membership management.
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    <Scale className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                    Official Portal
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    SSL Secured
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom copyright details */}
          <div className="max-w-7xl mx-auto border-t border-slate-200 dark:border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center md:text-left">
              © {new Date().getFullYear()} {shortName} ({fullName}). All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <Link to="/login" className="hover:text-blue-700 dark:hover:text-blue-400">Official Access</Link>
              <span>•</span>
              <Link to="/login" className="hover:text-blue-700 dark:hover:text-blue-400">Privacy & Terms</Link>
            </div>
          </div>
        </footer>
      )}

    </div>
  );
}
