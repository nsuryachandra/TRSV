import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  ArrowLeft, 
  Send, 
  CheckCircle2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  AlignLeft, 
  HelpCircle,
  BookOpen,
  Home,
  Landmark,
  Check,
  Calendar
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import AnimatedSection from '../components/AnimatedSection';
import { useNavigate } from 'react-router-dom';
import PremiumButton from '../components/PremiumButton';
import { useAuth } from '../context/AuthContext';

export default function JoinTVRS() {
  const navigate = useNavigate();
  const { userProfile, refreshProfile } = useAuth();
  
  const [constituencies, setConstituencies] = useState([]);
  const [loadingConstituencies, setLoadingConstituencies] = useState(true);
  
  const [formData, setFormData] = useState({
    fullName: userProfile?.full_name || '',
    email: userProfile?.email || '',
    phone: userProfile?.phone || '',
    memberType: 'Student', // 'Student' or 'Non-Student'
    collegeName: '',
    locality: '',
    district: '',
    constituencyId: '',
    reason: '',
    declaration: false,
    dateOfBirth: '',
    gender: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeApplication, setActiveApplication] = useState(null);
  const [checkingApp, setCheckingApp] = useState(true);

  const calculateAge = (dobString) => {
    if (!dobString) return '';
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? `${age} years` : '';
  };

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

  // Check if user already submitted a join application
  useEffect(() => {
    let intervalId;

    const checkUserApplication = async () => {
      try {
        const token = localStorage.getItem('trsv_session_token');
        if (!token) {
          setCheckingApp(false);
          return;
        }
        const response = await fetch('/api/join-tvrs/my', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success && data.request) {
          setActiveApplication(data.request);
          if (data.request.status === 'Approved') {
            await refreshProfile();
            navigate('/dashboard', { replace: true });
          }
        }
      } catch (err) {
        console.error('Error fetching user application:', err);
      } finally {
        setCheckingApp(false);
      }
    };

    checkUserApplication();

    // Poll status every 5 seconds to automatically activate dashboard once approved
    intervalId = setInterval(checkUserApplication, 5000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [success, refreshProfile, navigate]);

  // Load constituencies
  useEffect(() => {
    const fetchConstituencies = async () => {
      try {
        const response = await fetch('/api/constituencies');
        const data = await response.json();
        if (data.success) {
          setConstituencies(data.constituencies);
          
          // Preselect constituency based on profile or fallback
          let initialConstituencyId = formData.constituencyId || userProfile?.constituency_id?.toString() || '';
          let matchedCon = data.constituencies.find(c => c.id.toString() === initialConstituencyId);
          
          if (!matchedCon && data.constituencies.length > 0) {
            matchedCon = data.constituencies[0];
            initialConstituencyId = matchedCon.id.toString();
          }
          
          setFormData(prev => ({
            ...prev,
            constituencyId: initialConstituencyId,
            district: prev.district || matchedCon?.district || ''
          }));
        }
      } catch (err) {
        console.error('Failed to load constituencies:', err);
      } finally {
        setLoadingConstituencies(false);
      }
    };
    fetchConstituencies();
  }, [userProfile]);

  // Get unique districts list
  const districts = [...new Set(constituencies.map(c => c.district))].filter(Boolean);

  // Filter constituencies by currently selected district
  const filteredConstituencies = constituencies.filter(c => c.district === formData.district);

  const handleDistrictChange = (selectedDistrict) => {
    const filtered = constituencies.filter(c => c.district === selectedDistrict);
    setFormData(prev => ({
      ...prev,
      district: selectedDistrict,
      constituencyId: filtered.length > 0 ? filtered[0].id.toString() : ''
    }));
  };

  const handleMemberTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      memberType: type,
      collegeName: type === 'Student' ? prev.collegeName : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim()) return setError('Please enter your full name.');
    if (!formData.phone.trim()) return setError('Please enter your mobile number.');
    if (!formData.memberType) return setError('Please select your member type.');
    if (formData.memberType === 'Student' && !formData.collegeName.trim()) {
      return setError('Please enter your college or institution name.');
    }
    if (!formData.district) return setError('Please select your district.');
    if (!formData.constituencyId) return setError('Please select your constituency.');
    if (!formData.dateOfBirth) return setError('Please enter your date of birth.');
    if (!formData.gender) return setError('Please select your gender.');
    if (!formData.reason.trim()) return setError('Please provide the purpose for joining.');
    if (!formData.declaration) {
      return setError('You must confirm that the information provided is true and accurate.');
    }

    setLoading(true);

    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      const token = localStorage.getItem('trsv_session_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/join-tvrs', {
        method: 'POST',
        headers,
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

  if (checkingApp) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-t-amber-500 border-slate-200 dark:border-slate-800 animate-spin" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 animate-pulse">
          Syncing Application Coordinates...
        </p>
      </div>
    );
  }

  const isGuest = userProfile?.email?.endsWith('@trsv.guest');

  if (isGuest) {
    return (
      <div className="w-full min-h-[80vh] flex flex-col items-center justify-center py-4 px-2 sm:py-8 sm:px-4">
        <AnimatedSection direction="up" className="w-full max-w-md text-center">
          <GlassCard hoverEffect={false} className="p-8 sm:p-10 relative overflow-hidden border border-rose-500/20 dark:border-rose-500/10 shadow-2xl rounded-3xl bg-white/40 dark:bg-slate-955/20 flex flex-col items-center">
            {/* Ambient background light */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-rose-500/10 to-transparent blur-2xl pointer-events-none" />

            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(244,63,94,0.15)] animate-bounce">
              <AlertTriangle className="w-8 h-8 text-rose-500 dark:text-rose-450" />
            </div>

            <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 tracking-widest uppercase block mb-2">
              Access Restricted
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-855 dark:text-white leading-tight mb-4">
              Guest Logins can't join TVRS
            </h1>
            <p className="text-sm text-slate-550 dark:text-slate-400 leading-relaxed mb-6 font-medium">
              You are currently logged in with a guest session. Please register or log in using a verified student account to apply for membership.
            </p>

            <PremiumButton
              variant="glow"
              onClick={() => navigate('/dashboard')}
              className="w-full max-w-[200px]"
            >
              Back to Dashboard
            </PremiumButton>
          </GlassCard>
        </AnimatedSection>
      </div>
    );
  }

  if (activeApplication) {
    const isPending = activeApplication.status === 'Pending';
    const isApproved = activeApplication.status === 'Approved';
    const isRejected = activeApplication.status === 'Rejected';

    return (
      <div className="w-full min-h-[80vh] flex flex-col items-center py-4 px-2 sm:py-8 sm:px-4">
        <AnimatedSection direction="up" className="w-full max-w-2xl text-left">
          <GlassCard hoverEffect={false} className="p-5 sm:p-10 relative overflow-hidden border border-slate-200/50 dark:border-slate-850 shadow-2xl rounded-3xl bg-white/40 dark:bg-slate-955/20">
            {/* Cybernetic ambient backing light */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8 border-b border-slate-200/40 dark:border-slate-850 pb-5">
              <img 
                src="/trsv.jpeg" 
                alt="TVRS Logo" 
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-slate-200/50 dark:border-slate-800 shadow-md shrink-0" 
              />
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 tracking-widest uppercase block leading-none">
                  MEMBERSHIP APPLICATION STATUS
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-855 dark:text-white leading-tight mt-1">
                  Application Tracking Node
                </h1>
                <p className="text-xs text-slate-450 dark:text-slate-400 leading-normal mt-0.5 font-medium">
                  Track your registration status on the decentralized TVRS network.
                </p>
              </div>
            </div>

            {/* Application Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-100/60 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-850 p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Applicant Coordinates</span>
                <strong className="text-sm font-bold text-slate-800 dark:text-slate-200 block">{activeApplication.full_name}</strong>
                <span className="text-xs text-slate-600 dark:text-slate-400 block">{activeApplication.email}</span>
                <span className="text-xs text-slate-600 dark:text-slate-400 block">{activeApplication.phone}</span>
              </div>

              <div className="bg-slate-100/60 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-850 p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Union Alignment</span>
                <strong className="text-sm font-bold text-slate-800 dark:text-slate-200 block">{activeApplication.constituency_name}</strong>
                <span className="text-xs text-slate-600 dark:text-slate-400 block">{activeApplication.district} District</span>
                <span className="text-xs text-slate-600 dark:text-slate-400 block">{activeApplication.member_type}</span>
              </div>
            </div>

            {/* Status Visual Tracker */}
            <div className="bg-slate-50/60 dark:bg-slate-955/40 border border-slate-200/80 dark:border-slate-900/60 rounded-2xl p-6 mb-8 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Application Lifecycle</span>
                <span className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase border ${
                  isPending ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25 animate-pulse' :
                  isApproved ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25' :
                  'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'
                }`}>
                  {activeApplication.status}
                </span>
              </div>

              {/* Graphical line representation */}
              <div className="flex items-center justify-between relative px-2">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
                
                {/* Left Half Line: Submitted -> Under Review */}
                <div className={`absolute top-1/2 left-0 w-1/2 h-1 -translate-y-1/2 z-0 transition-all duration-500 ${
                  (isPending || isApproved || isRejected) ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-800'
                }`} />

                {/* Right Half Line: Under Review -> Decision */}
                <div className={`absolute top-1/2 left-1/2 w-1/2 h-1 -translate-y-1/2 z-0 transition-all duration-500 ${
                  isApproved ? 'bg-emerald-500' : isRejected ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-800'
                }`} />

                {/* Step 1: Submitted */}
                <div className="z-10 flex flex-col items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800/40">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-glow-emerald">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350">Submitted</span>
                </div>

                {/* Step 2: Under Review */}
                <div className="z-10 flex flex-col items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800/40">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isPending ? 'bg-cyan-500 text-white animate-pulse shadow-glow-cyan' :
                    (isApproved || isRejected) ? 'bg-emerald-500 text-white shadow-glow-emerald' : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    {isPending ? <div className="w-2 h-2 rounded-full bg-white animate-ping" /> : <Check className="w-4 h-4" />}
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350">Under Review</span>
                </div>

                {/* Step 3: Decision */}
                <div className="z-10 flex flex-col items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800/40">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isApproved ? 'bg-emerald-500 text-white shadow-glow-emerald' :
                    isRejected ? 'bg-rose-500 text-white shadow-glow-rose' : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    {isApproved ? <Check className="w-4 h-4" /> : isRejected ? <div className="font-extrabold text-sm">✕</div> : <HelpCircle className="w-4 h-4" />}
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350">Decision</span>
                </div>
              </div>

              {/* Status Message Text */}
              <div className="p-4 bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-900 rounded-xl text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                {isPending && "Your membership request has been registered and is currently being inspected by the regional constituency committee. Please wait for official authorization."}
                {isApproved && "Congratulations! Your registration has been approved. You are now officially recognized as a TVRS representative. Please restart the app or refresh to sync your dashboard access."}
                {isRejected && "Your application has been rejected by the regional committee. You can submit a new application below with updated coordinates if necessary."}
              </div>
            </div>

            {/* Back to Dashboard and Re-Apply Buttons */}
            <div className="flex gap-4">
              <PremiumButton
                onClick={() => navigate('/dashboard/student')}
                variant="glow"
                size="sm"
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Back to Dashboard
              </PremiumButton>

              {isRejected && (
                <button
                  onClick={() => setActiveApplication(null)}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-[#071830] rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  Submit New Application
                </button>
              )}
            </div>

          </GlassCard>
        </AnimatedSection>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center py-8 px-4 text-center">
        <AnimatedSection direction="up" className="w-full max-w-xl">
          <GlassCard className="p-8 sm:p-12 border border-emerald-500/20 bg-emerald-500/5 shadow-2xl rounded-2xl">
            <div className="flex flex-col items-center text-center justify-center gap-6 w-full h-full">
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

              <p className="text-sm text-slate-550 dark:text-slate-450 leading-relaxed max-w-md">
                Your application to join the <strong>Telangana Vidyarthi Rakshana Sena</strong> has been registered on our secure node. Our regional committee will inspect your profile details and contact you soon.
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
            </div>
          </GlassCard>
        </AnimatedSection>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[80vh] flex flex-col items-center py-4 px-2 sm:py-8 sm:px-4">
      <AnimatedSection direction="up" className="w-full max-w-2xl text-left">
        <GlassCard hoverEffect={false} className="p-5 sm:p-10 relative overflow-hidden border border-slate-200/50 dark:border-slate-850 shadow-2xl rounded-3xl bg-white/40 dark:bg-slate-950/20">
          {/* Cybernetic ambient backing light */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-400/10 to-transparent blur-2xl pointer-events-none" />
          
          {/* Official Branding Header Layout */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8 border-b border-slate-200/40 dark:border-slate-850 pb-5">
            <img 
              src="/trsv.jpeg" 
              alt="TVRS Logo" 
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-slate-200/50 dark:border-slate-800 shadow-md shrink-0" 
            />
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-black text-cyan-600 dark:text-cyan-400 tracking-widest uppercase block leading-none">
                OFFICIAL REGISTRATION TERMINAL
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-855 dark:text-white leading-tight mt-1">
                Telangana Vidyarthi Rakshana Sena
              </h1>
              <p className="text-xs text-slate-450 dark:text-slate-400 leading-normal mt-0.5 font-medium">
                Submit details below to stand as a digital coordinator node and represent student advocacy rights across educational zones.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-2.5 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            
            {/* 👤 SECTION 1. Personal Information */}
            <div className="flex flex-col gap-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 border-b border-slate-200/30 dark:border-slate-850 pb-2">
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Anand Rao"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="peer w-full pl-11 pr-4 py-3 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-855 dark:text-slate-100 font-bold"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-cyan-600 dark:text-cyan-400 pointer-events-none z-10 transition-transform duration-200 peer-focus:scale-110 peer-focus:text-sky-500">
                      <User size={18} strokeWidth={2.2} />
                    </div>
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. +91 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="peer w-full pl-11 pr-4 py-3 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-855 dark:text-slate-100 font-bold"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-cyan-600 dark:text-cyan-400 pointer-events-none z-10 transition-transform duration-200 peer-focus:scale-110 peer-focus:text-sky-500">
                      <Phone size={18} strokeWidth={2.2} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* Date of Birth */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                    Date of Birth <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="peer w-full pl-11 pr-4 py-3 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-855 dark:text-slate-100 font-bold cursor-pointer"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-cyan-600 dark:text-cyan-400 pointer-events-none z-10 transition-transform duration-200 peer-focus:scale-110 peer-focus:text-sky-500">
                      <Calendar size={18} strokeWidth={2.2} />
                    </div>
                  </div>
                </div>

                {/* Calculated Age */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                    Calculated Age
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      disabled
                      placeholder="—"
                      value={calculateAge(formData.dateOfBirth)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border bg-slate-100/50 dark:bg-slate-900/10 border-slate-200/40 dark:border-slate-850 text-sm text-slate-500 dark:text-slate-400 font-bold select-none cursor-not-allowed"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 pointer-events-none z-10">
                      <User size={18} strokeWidth={2.2} />
                    </div>
                  </div>
                </div>

                {/* Gender */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.gender}
                      required
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="peer w-full pl-11 pr-10 py-3 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-855 dark:text-slate-100 font-bold cursor-pointer appearance-none"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-cyan-600 dark:text-cyan-400 pointer-events-none z-10 transition-transform duration-200 peer-focus:scale-110 peer-focus:text-sky-500">
                      <User size={18} strokeWidth={2.2} />
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none z-10 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-500 dark:border-t-slate-400" />
                  </div>
                </div>
              </div>

              {/* Email (Optional) */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                  Email Address <span className="text-slate-450 font-bold text-[9px]">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="e.g. anand@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="peer w-full pl-11 pr-4 py-3 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-855 dark:text-slate-100 font-bold"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-cyan-600 dark:text-cyan-400 pointer-events-none z-10 transition-transform duration-200 peer-focus:scale-110 peer-focus:text-sky-500">
                    <Mail size={18} strokeWidth={2.2} />
                  </div>
                </div>
              </div>
            </div>

            {/* 🪪 SECTION 2. Member Information */}
            <div className="flex flex-col gap-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 border-b border-slate-200/30 dark:border-slate-850 pb-2">
                Member Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Member Type */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                    Member Type <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3 h-[46px]">
                    <button
                      type="button"
                      onClick={() => handleMemberTypeChange('Student')}
                      className={`flex items-center justify-center gap-2 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
                        formData.memberType === 'Student'
                          ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-600 dark:text-cyan-400 shadow-sm'
                          : 'border-slate-200/60 dark:border-slate-800 bg-white/20 dark:bg-slate-900/20 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/50'
                      }`}
                    >
                      <User size={14} />
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMemberTypeChange('Non-Student')}
                      className={`flex items-center justify-center gap-2 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
                        formData.memberType === 'Non-Student'
                          ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-600 dark:text-cyan-400 shadow-sm'
                          : 'border-slate-200/60 dark:border-slate-800 bg-white/20 dark:bg-slate-900/20 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/50'
                      }`}
                    >
                      <ShieldCheck size={14} />
                      Non-Student
                    </button>
                  </div>
                </div>

                {/* College / Institution (Only if Student) */}
                {formData.memberType === 'Student' && (
                  <div className="flex flex-col gap-1.5 text-left animate-fadeIn">
                    <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                      College / Institution <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="e.g. JNTU Hyderabad"
                        value={formData.collegeName}
                        onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                        className="peer w-full pl-11 pr-4 py-3 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-855 dark:text-slate-100 font-bold"
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-cyan-600 dark:text-cyan-400 pointer-events-none z-10 transition-transform duration-200 peer-focus:scale-110 peer-focus:text-sky-500">
                        <BookOpen size={18} strokeWidth={2.2} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Locality */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                  Locality <span className="text-slate-400 font-bold text-[9px]">(your address)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Kukatpally Phase 3, Hyderabad"
                    value={formData.locality}
                    onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                    className="peer w-full pl-11 pr-4 py-3 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-855 dark:text-slate-100 font-bold"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-cyan-600 dark:text-cyan-400 pointer-events-none z-10 transition-transform duration-200 peer-focus:scale-110 peer-focus:text-sky-500">
                    <Home size={18} strokeWidth={2.2} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* District */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                    District <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.district}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      className="peer w-full pl-11 pr-10 py-3 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-855 dark:text-slate-100 font-bold cursor-pointer appearance-none"
                    >
                      <option value="">Select District</option>
                      {districts.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-cyan-600 dark:text-cyan-400 pointer-events-none z-10 transition-transform duration-200 peer-focus:scale-110 peer-focus:text-sky-500">
                      <Landmark size={18} strokeWidth={2.2} />
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none z-10 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-500 dark:border-t-slate-400" />
                  </div>
                </div>

                {/* Constituency */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                    Constituency <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.constituencyId}
                      onChange={(e) => setFormData({ ...formData, constituencyId: e.target.value })}
                      disabled={!formData.district || loadingConstituencies}
                      className="peer w-full pl-11 pr-10 py-3 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-855 dark:text-slate-100 font-bold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed appearance-none"
                    >
                      {loadingConstituencies ? (
                        <option value="">Syncing Constituencies...</option>
                      ) : !formData.district ? (
                        <option value="">Select District First</option>
                      ) : filteredConstituencies.length === 0 ? (
                        <option value="">No constituency available</option>
                      ) : (
                        filteredConstituencies.map((con) => (
                          <option key={con.id} value={con.id}>
                            {con.constituency_name === 'Upcoming Area' || con.constituency_name === 'Upcoming Area Node'
                              ? 'Not Listed (Send to All State Leaders)'
                              : con.constituency_name}
                          </option>
                        ))
                      )}
                    </select>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-cyan-600 dark:text-cyan-400 pointer-events-none z-10 transition-transform duration-200 peer-focus:scale-110 peer-focus:text-sky-500">
                      <MapPin size={18} strokeWidth={2.2} />
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none z-10 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-500 dark:border-t-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* 📝 SECTION 3. Additional Information */}
            <div className="flex flex-col gap-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 border-b border-slate-200/30 dark:border-slate-850 pb-2">
                Additional Information
              </h3>

              {formData.district && (
                <div className="p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-500/5 text-left flex flex-col gap-2 animate-fadeIn">
                  <div className="flex items-center gap-2 text-cyan-500">
                    <HelpCircle size={15} className="text-cyan-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Constituency Finder Helper
                    </span>
                  </div>
                  <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-semibold">
                    To find your constituency, search Google for your college/school address pincode followed by <span className="font-mono text-cyan-600 dark:text-cyan-400">"assembly constituency"</span>. Match it with the dropdown select list. If it is not listed, select <strong className="text-amber-500">"Not Listed (Send to All State Leaders)"</strong>.
                  </p>
                </div>
              )}

              {/* Purpose */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                  Purpose for joining tvrs? <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us about your campus, advocacy ideas, or how you want to support student welfare..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="peer w-full pl-11 pr-4 py-3 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-855 dark:text-slate-100 font-bold leading-relaxed resize-none"
                  />
                  <div className="absolute left-4 top-4 flex items-center justify-center text-cyan-600 dark:text-cyan-400 pointer-events-none z-10 transition-transform duration-200 peer-focus:scale-110 peer-focus:text-sky-500">
                    <AlignLeft size={18} strokeWidth={2.2} />
                  </div>
                </div>
              </div>
            </div>

            {/* 📋 SECTION 4. Declaration */}
            <div className="flex flex-col gap-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 border-b border-slate-200/30 dark:border-slate-850 pb-2">
                Declaration
              </h3>

              <div className="flex items-start gap-3 text-left">
                <label className="relative flex items-center justify-center w-5 h-5 rounded border border-slate-200/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 cursor-pointer shrink-0 mt-0.5 select-none transition-all duration-200 hover:border-cyan-400">
                  <input
                    type="checkbox"
                    checked={formData.declaration}
                    onChange={(e) => setFormData({ ...formData, declaration: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="absolute inset-0 rounded flex items-center justify-center bg-cyan-500 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200">
                    <Check size={14} strokeWidth={3} />
                  </div>
                </label>
                <span 
                  className="text-xs text-slate-600 dark:text-slate-350 font-semibold select-none cursor-pointer" 
                  onClick={() => setFormData(prev => ({ ...prev, declaration: !prev.declaration }))}
                >
                  I confirm that the information provided is true and accurate. <span className="text-rose-500">*</span>
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 border-t border-slate-200/40 dark:border-slate-850 pt-5">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <ArrowLeft size={16} className="text-slate-550 dark:text-slate-400" strokeWidth={2.2} /> Cancel Application
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
