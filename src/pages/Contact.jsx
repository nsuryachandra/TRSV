import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, ShieldAlert, CheckCircle, Lock, Sparkles, ChevronRight, ChevronLeft, UploadCloud, EyeOff, FileText, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import PremiumButton from '../components/PremiumButton';
import AnimatedSection from '../components/AnimatedSection';
import { uploadGrievanceMedia } from '../config/supabase';
import ComplaintDetailsModal from '../components/ComplaintDetailsModal';

export default function Contact() {
  const { currentUser: user, userProfile } = useAuth();
  
  // Complainant Mandatory Details
  const [complainantName, setComplainantName] = useState(userProfile?.full_name || '');
  const [complainantMobile, setComplainantMobile] = useState(userProfile?.phone || '');
  const [collegeSchoolAddress, setCollegeSchoolAddress] = useState(userProfile?.college_name || '');

  // Constituency selector list
  const [constituencyList, setConstituencyList] = useState([]);
  const [selectedConstituencyId, setSelectedConstituencyId] = useState(userProfile?.constituency_id || '');

  // Complaint lodge state
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Anti-Ragging');
  const [urgency, setUrgency] = useState('Medium');
  const [description, setDescription] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [proofFiles, setProofFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [assignedTicketId, setAssignedTicketId] = useState('');

  // Fetch all active constituencies on mount
  React.useEffect(() => {
    const fetchConstituencies = async () => {
      try {
        const res = await fetch('/api/constituencies');
        const data = await res.json();
        if (data.success) {
          setConstituencyList(data.constituencies);
        }
      } catch (err) {
        console.error('Failed to load constituencies:', err);
      }
    };
    fetchConstituencies();
  }, []);

  // Complaint list tracking states
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [ticketTab, setTicketTab] = useState('active'); // 'active' | 'resolved'

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('tsrv_session_token');
      const response = await fetch('/api/complaints', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTickets(data.complaints || []);
      }
    } catch (err) {
      console.error('Failed to load student complaints in contact page:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  React.useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  // Sync initial profile values if loaded after render
  React.useEffect(() => {
    if (userProfile) {
      if (!complainantName) setComplainantName(userProfile.full_name || '');
      if (!complainantMobile) setComplainantMobile(userProfile.phone || '');
      if (!collegeSchoolAddress) setCollegeSchoolAddress(userProfile.college_name || '');
      if (!selectedConstituencyId) setSelectedConstituencyId(userProfile.constituency_id || '');
    }
  }, [userProfile]);

  // Anonymous inquiry state
  const [anonName, setAnonName] = useState('');
  const [anonEmail, setAnonEmail] = useState('');
  const [anonMsg, setAnonMsg] = useState('');
  const [anonSubmitted, setAnonSubmitted] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setErrorMsg('');
      const allowedTypes = ['application/pdf', 'video/mp4', 'image/png', 'image/jpg', 'image/jpeg', 'image/gif'];
      const newFiles = Array.from(e.target.files).filter(f => {
        if (!allowedTypes.includes(f.type)) {
          setErrorMsg(`File "${f.name}" is not supported. Please upload PDF, MP4, or Images only.`);
          return false;
        }
        const isOkSize = f.size <= 20 * 1024 * 1024; // max 20MB for evidence
        if (!isOkSize) {
          setErrorMsg(`File "${f.name}" exceeds the 20MB limit.`);
        }
        return isOkSize;
      });
      setProofFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (indexToRemove) => {
    setProofFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleLodgeComplaint = async (e) => {
    e.preventDefault();
    if (!complainantName.trim()) {
      setErrorMsg('Please enter your valid Full Name (cannot be empty or spaces).');
      return;
    }
    if (!complainantMobile.trim()) {
      setErrorMsg('Please enter your Active Mobile Number (cannot be empty or spaces).');
      return;
    }
    if (!selectedConstituencyId) {
      setErrorMsg('Please select a Constituency Area.');
      return;
    }
    if (!collegeSchoolAddress.trim()) {
      setErrorMsg('Please enter the Proper College/School Address (cannot be empty or spaces).');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Please enter a detailed description of the issue (cannot be empty or spaces).');
      return;
    }
    if (proofFiles.length === 0) {
      setErrorMsg('At least one proof file (PDF or MP4 or Image) is required. You cannot skip this field.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const uploadedProofs = [];
      
      // Upload grievance attachments sequentially to Supabase
      if (proofFiles.length > 0) {
        for (const file of proofFiles) {
          const publicUrl = await uploadGrievanceMedia(file);
          uploadedProofs.push({ url: publicUrl, name: file.name });
        }
      }

      const token = localStorage.getItem('tsrv_session_token');
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `Grievance from ${complainantName}`,
          description,
          category,
          urgency,
          anonymous,
          emergency_flag: urgency === 'Critical',
          proofs: uploadedProofs,
          complainant_name: complainantName,
          complainant_mobile: complainantMobile,
          college_school_address: collegeSchoolAddress,
          collegeId: userProfile?.college_id || null,
          constituencyId: selectedConstituencyId
        })
      });

      const data = await response.json();
      if (data.success) {
        setComplaintSubmitted(true);
        setAssignedTicketId(data.complaint.id);
        
        // Reset state
        setTitle('');
        setDescription('');
        setProofFiles([]);
        setAnonymous(false);
        fetchTickets(); // Refresh list immediately!
      } else {
        setErrorMsg(data.message || 'Failed to lodge official complaint.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to connect to regional database nodes.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnonSubmit = (e) => {
    e.preventDefault();
    if (!anonName || !anonMsg) return;
    setAnonSubmitted(true);
  };

  const isEmergency = urgency === 'Critical';

  const getUrgencyBadge = (urgencyVal) => {
    const maps = {
      critical: 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-glow-rose',
      high: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      medium: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
      low: 'bg-green-500/10 text-green-500 border-green-500/20'
    };
    return maps[urgencyVal?.toLowerCase()] || maps.medium;
  };

  const renderStatusStepper = (status) => {
    const stages = ['Complaint Registered', 'Complaint Verified', 'Solving Started', 'Solved'];
    let currentIdx = 0;
    if (status === 'Complaint Registered' || status === 'Audit Phase' || status === 'Registered') {
      currentIdx = 0;
    } else if (status === 'Complaint Verified' || status === 'Verified') {
      currentIdx = 1;
    } else if (status === 'Solving Started' || status === 'Processing' || status === 'In Progress') {
      currentIdx = 2;
    } else if (status === 'Solved' || status === 'Resolved') {
      currentIdx = 3;
    } else if (status === 'Dismissed') {
      currentIdx = -1;
    }

    if (currentIdx === -1) {
      return (
        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-rose-500 font-bold">
          <AlertTriangle className="w-3.5 h-3.5" /> Dismissed / Rejected
        </div>
      );
    }

    const shortLabels = ['Registered', 'Verified', 'Solving Started', 'Solved'];

    return (
      <div className="flex items-center gap-2 mt-3 w-full bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-200/30 dark:border-slate-800">
        {stages.map((stage, idx) => {
          const isCompleted = currentIdx >= idx;
          const isActive = currentIdx === idx;
          return (
            <React.Fragment key={idx}>
              <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black transition-all ${
                  isActive 
                    ? 'bg-cyan-500 text-white shadow-glow-cyan animate-pulse scale-110' 
                    : isCompleted 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-450 dark:text-slate-600'
                }`}>
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span className={`text-[8px] font-extrabold tracking-tight truncate max-w-full uppercase ${
                  isActive 
                    ? 'text-cyan-500 font-black' 
                    : isCompleted 
                      ? 'text-emerald-500' 
                      : 'text-slate-405 dark:text-slate-500'
                }`}>
                  {shortLabels[idx]}
                </span>
              </div>
              {idx < stages.length - 1 && (
                <div className={`h-0.5 flex-1 max-w-[25px] rounded transition-colors ${
                  currentIdx > idx ? 'bg-emerald-500' : 'bg-slate-250 dark:bg-slate-800'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };  return (
    <div className="w-full flex flex-col gap-12 py-4 text-left animate-fadeIn">
      
      {/* Header Banner */}
      <AnimatedSection direction="up" className="text-center max-w-3xl mx-auto flex flex-col gap-4">
        <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 tracking-widest uppercase flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          OFFICIAL GRIEVANCE REDRESSAL PORTAL
        </span>
        <h1 className="fluid-heading-2 font-black text-slate-850 dark:text-white leading-tight text-center">
          State Grievance Submission Gate
        </h1>
        <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed text-center">
          Lodge your academic, campus-safety, or administrative grievance directly into the TSRV Command Node. Every submission is digitally routed to local and statewide leaders.
        </p>
      </AnimatedSection>

      <section className="w-full flex flex-col gap-8">
        
        {/* Main Complaint Submission Form Card */}
        <GlassCard hoverEffect={false} className="p-6 sm:p-8 w-full border border-slate-200/50 dark:border-slate-850 relative">
          {user ? (
            complaintSubmitted ? (
              // 1. Complaint Registered Success Screen
              <div className="text-center py-10 flex flex-col items-center gap-5 max-w-lg mx-auto animate-scaleUp">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-glow-emerald">
                  <CheckCircle className="w-10 h-10" />
                </div>
                
                <div className="flex flex-col gap-2">
                  <h3 className="font-extrabold text-2xl text-slate-850 dark:text-white">
                    Grievance Logged Successfully
                  </h3>
                  <span className="text-xs font-bold text-cyan-500 font-mono tracking-widest uppercase bg-cyan-500/10 px-3 py-1 rounded-full self-center border border-cyan-500/15">
                    Ticket ID: #{assignedTicketId}
                  </span>
                </div>

                <p className="text-sm text-slate-550 dark:text-slate-400 leading-relaxed">
                  Your grievance has been successfully recorded in the Neon database. The regional leaders mapped to your constituency area have been notified. You can track the progress of this ticket in the tracking section below.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                  <PremiumButton 
                    variant="primary" 
                    size="md" 
                    onClick={() => {
                      setComplaintSubmitted(false);
                      setAssignedTicketId('');
                    }}
                  >
                    Submit Another Grievance
                  </PremiumButton>
                </div>
              </div>
            ) : (
              // 2. Complaint Lodge Form
              <form onSubmit={handleLodgeComplaint} className="flex flex-col gap-6 w-full animate-scaleUp text-left">
                <div className="flex flex-col gap-1 pb-3 border-b border-slate-200/50 dark:border-slate-850">
                  <h3 className="font-black text-lg text-slate-850 dark:text-white flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-cyan-500" />
                    Lodge Official Grievance
                  </h3>
                  <p className="text-xs text-slate-400">
                    All fields are mandatory. Filing false complaints will result in permanent credential suspension.
                  </p>
                </div>

                {/* MANDATORY DISCLAIMER BOX */}
                <div className="p-4 text-xs bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl flex items-start gap-2.5 leading-relaxed animate-scaleUp">
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-rose-500 mt-0.5" />
                  <div>
                    <strong className="block font-extrabold uppercase mb-1">⚠️ Mandatory Disclaimer</strong>
                    By submitting this complaint, you declare under union regulations that all facts, details, and attachments are genuine and true. Lodging simulated, fake, or false reports is strictly prohibited under the TSRV State Charter, and will result in immediate suspension of student credentials and potential legal actions.
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-4 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-bold flex items-center gap-2 animate-bounce">
                    <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Form Inputs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Complainant Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Complainant Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter Complainant Name"
                      value={complainantName}
                      onChange={(e) => setComplainantName(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-805 dark:text-slate-100 font-bold"
                    />
                  </div>

                  {/* Complainant Active Mobile Number */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Active Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={complainantMobile}
                      onChange={(e) => setComplainantMobile(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-805 dark:text-slate-100 font-bold"
                    />
                  </div>

                  {/* Constituency Selection Dropdown */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Constituency / Area Node <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedConstituencyId}
                      onChange={(e) => setSelectedConstituencyId(e.target.value)}
                      className="w-full p-3.5 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-805 dark:text-slate-100 font-bold"
                      required
                    >
                      <option value="">Select constituency area</option>
                      {constituencyList.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.constituency_name === 'Upcoming Area' ? '⚠️ Upcoming Area (My area is not listed)' : `${c.constituency_name} (${c.district})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category Selection Dropdown */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Grievance Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-3.5 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-855 dark:text-slate-100 font-bold font-bold"
                      required
                    >
                      <option value="Anti-Ragging">Anti-Ragging (Ragging protection)</option>
                      <option value="Harassment">Harassment protection</option>
                      <option value="Faculty Issues">Faculty/Classroom misconduct</option>
                      <option value="Infrastructure Problems">Infrastructure problems</option>
                      <option value="Fee Issues">Scholarship/Fee issues</option>
                      <option value="Hostel Issues">Hostel & Mess quality</option>
                      <option value="Transport Problems">Transport & Passes</option>
                      <option value="Safety Issues">Campus Security & Safety risks</option>
                      <option value="Administration Problems">Administrative delays</option>
                      <option value="Abuse">Physical or verbal abuse</option>
                      <option value="Other">Other grievances</option>
                    </select>
                  </div>

                  {/* Urgency selection dropdown */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Urgency Level <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value)}
                      className="w-full p-3.5 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-805 dark:text-slate-100 font-bold"
                      required
                    >
                      <option value="Low">Low - System resolution timeline</option>
                      <option value="Medium">Medium - Standard leader dispatch</option>
                      <option value="High">High - Priority response board</option>
                      <option value="Critical">Critical - Immediate security check</option>
                    </select>
                  </div>

                  {/* Empty space filler for layout matching */}
                  <div className="hidden md:block" />
                </div>

                {/* College address */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Full College / School Proper Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter College Name, Campus Block, City/District details"
                    value={collegeSchoolAddress}
                    onChange={(e) => setCollegeSchoolAddress(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-805 dark:text-slate-100 font-bold"
                  />
                </div>

                {/* Detailed description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Detailed Issue Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Provide a detailed description of the incident, names involved (if applicable), timings, and specific help required..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:border-cyan-400 border-slate-200/60 dark:border-slate-800 text-slate-805 dark:text-slate-100 font-bold"
                  />
                </div>

                {/* Proofs Drag and Drop field */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Grievance Proof Attachments <span className="text-rose-500">*</span>
                  </label>
                  
                  <div className="relative group cursor-pointer border-2 border-dashed border-slate-200/60 dark:border-slate-800 hover:border-cyan-500/60 dark:hover:border-cyan-400/60 rounded-2xl bg-white/10 dark:bg-slate-900/10 p-6 text-center transition-all">
                    <input
                      type="file"
                      multiple
                      accept="application/pdf,video/mp4,image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />
                    <div className="flex flex-col items-center gap-2 pointer-events-none select-none">
                      <UploadCloud className="w-8 h-8 text-cyan-500 group-hover:scale-110 transition-transform duration-200" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-slate-700 dark:text-white block">Drag & Drop files here or click to browse</span>
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider">PDF, MP4, or Images up to 20MB only (Mandatory)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* File Preview List */}
                {proofFiles.length > 0 && (
                  <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto pr-1 custom-sidebar-scrollbar">
                    {proofFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border bg-white/50 dark:bg-slate-850/50 border-slate-200/50 dark:border-slate-800">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{file.name}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[9px] text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          <button type="button" onClick={() => removeFile(idx)} className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Anonymous Submit Option */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={anonymous}
                    onChange={(e) => setAnonymous(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-800 text-cyan-500 focus:ring-cyan-400"
                  />
                  <label htmlFor="anonymous" className="text-xs text-slate-550 dark:text-slate-400 font-bold select-none cursor-pointer">
                    File anonymously (Hide my name from regional leaders)
                  </label>
                </div>

                <PremiumButton 
                  type="submit" 
                  variant="primary" 
                  size="md" 
                  className={`w-full mt-2 ${isEmergency ? 'bg-rose-500 hover:bg-rose-600 shadow-glow-rose before:from-rose-400 before:to-rose-600' : ''}`}
                  disabled={submitting}
                >
                  {submitting ? 'Transmitting Evidences & Lodge...' : (isEmergency ? 'Trigger Emergency Dispatch' : 'Lodge Union Grievance')}
                </PremiumButton>
              </form>
            )
          ) : (
            // 3. Guest login warning fallback
            <div className="text-center py-10 flex flex-col items-center gap-5 max-w-md mx-auto animate-scaleUp">
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500 shadow-glow-cyan">
                <Lock className="w-10 h-10 animate-pulse" />
              </div>
              <h3 className="font-extrabold text-xl text-slate-850 dark:text-white">
                Secure Submission Required
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed text-center">
                To lodge an official student grievance and track its lifecycle, you must log in to your verified student advocate account first.
              </p>
              <div className="flex gap-3">
                <PremiumButton variant="primary" size="sm" onClick={() => window.location.hash = '#/login'}>
                  Log In Account
                </PremiumButton>
                <PremiumButton variant="secondary" size="sm" onClick={() => window.location.hash = '#/signup'}>
                  Register Node
                </PremiumButton>
              </div>
            </div>
          )}
        </GlassCard>

        {/* 4. Grievance Tracking Section */}
        {user && (
          <GlassCard hoverEffect={false} className="p-6 sm:p-8 w-full border border-slate-200/50 dark:border-slate-850 text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-850 pb-4">
              <div className="flex flex-col gap-1">
                <h3 className="font-black text-lg text-slate-850 dark:text-white uppercase tracking-wider">
                  Grievance Tickets Tracking
                </h3>
                <p className="text-xs text-slate-400">
                  Monitor the real-time resolution timeline of your submitted cases. Click any ticket for complete logs.
                </p>
              </div>
              
              {/* Tab Selector */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTicketTab('active')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                    ticketTab === 'active'
                      ? 'bg-cyan-500 text-white border-cyan-500 shadow-glow-cyan'
                      : 'bg-white/40 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Active ({tickets.filter(t => t.status !== 'Solved' && t.status !== 'Resolved' && t.status !== 'Dismissed').length})
                </button>
                <button
                  type="button"
                  onClick={() => setTicketTab('resolved')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                    ticketTab === 'resolved'
                      ? 'bg-cyan-500 text-white border-cyan-500 shadow-glow-cyan'
                      : 'bg-white/40 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Resolved ({tickets.filter(t => t.status === 'Solved' || t.status === 'Resolved').length})
                </button>
              </div>
            </div>

            {loadingTickets ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col gap-4 mt-6">
                {(ticketTab === 'active' 
                  ? tickets.filter(t => t.status !== 'Solved' && t.status !== 'Resolved' && t.status !== 'Dismissed')
                  : tickets.filter(t => t.status === 'Solved' || t.status === 'Resolved')
                ).length > 0 ? (
                  (ticketTab === 'active' 
                    ? tickets.filter(t => t.status !== 'Solved' && t.status !== 'Resolved' && t.status !== 'Dismissed')
                    : tickets.filter(t => t.status === 'Solved' || t.status === 'Resolved')
                  ).map((t) => (
                    <div 
                      key={t.id} 
                      onClick={() => setSelectedTicketId(t.id)}
                      className="flex flex-col p-5 rounded-2xl bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-850 cursor-pointer hover:border-cyan-500/50 transition-all hover:scale-[1.005] group gap-3 text-left animate-fadeIn"
                    >
                      <div className="flex items-start justify-between min-w-0">
                        <div className="flex flex-col text-left min-w-0 max-w-[70%]">
                          <span className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white flex items-center gap-2 truncate">
                            <FileText className="w-4.5 h-4.5 text-cyan-500 shrink-0" />
                            {t.description.substring(0, 100)}{t.description.length > 100 ? '...' : ''}
                          </span>
                          <span className="text-[10px] text-slate-450 mt-1 truncate flex items-center gap-1.5 flex-wrap font-bold">
                            Ticket #{t.id} • {new Date(t.created_at).toLocaleDateString()}
                            {t.attachment_url && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 text-[8px] font-black uppercase tracking-wider border border-cyan-500/15">
                                Evidence Attached
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[9px] font-black px-2 py-1 rounded border uppercase tracking-wider ${getUrgencyBadge(t.urgency)}`}>
                            {t.urgency}
                          </span>
                        </div>
                      </div>
                      
                      {/* Live Stepper */}
                      {renderStatusStepper(t.status)}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs border-2 border-dashed border-slate-200/20 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-905/30">
                    <AlertTriangle className="w-8 h-8 text-slate-400 mb-2 opacity-50 animate-pulse" />
                    No tickets in this section. Lodge a grievance to activate real-time tracking.
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        )}
      </section>

      {/* Ticket Details Modal */}
      {selectedTicketId && (
        <ComplaintDetailsModal 
          ticketId={selectedTicketId} 
          onClose={() => setSelectedTicketId(null)} 
          userProfile={userProfile} 
        />
      )}

    </div>
  );
}
