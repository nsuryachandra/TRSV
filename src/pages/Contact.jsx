import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, ShieldAlert, CheckCircle, Lock, Sparkles, ChevronRight, ChevronLeft, UploadCloud, EyeOff, FileText, X, AlertTriangle, RefreshCw, Mic, Square, Trash2, User, Building, AlignLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PremiumButton from '../components/PremiumButton';
import AnimatedSection from '../components/AnimatedSection';
import { uploadGrievanceMedia } from '../config/supabase';

export default function Contact() {
  const { currentUser: user, userProfile } = useAuth();
  const navigate = useNavigate();
  
  // Complainant Mandatory Details
  const [complainantName, setComplainantName] = useState(userProfile?.full_name || '');
  const [complainantMobile, setComplainantMobile] = useState(userProfile?.phone || '');
  const [collegeSchoolAddress, setCollegeSchoolAddress] = useState(userProfile?.college_name && userProfile.college_name !== 'Not Set' ? userProfile.college_name : '');

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
  
  // Audio Recorder State
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [recordTime, setRecordTime] = useState(0);
  const [recordTimerInterval, setRecordTimerInterval] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);

  const startRecording = async () => {
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/mp3' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioPreviewUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      setAudioChunks([]);
      setAudioPreviewUrl(null);
      setAudioBlob(null);
      setRecordTime(0);
      
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);

      const interval = setInterval(() => {
        setRecordTime(prev => {
          if (prev >= 120) { // Auto-stop after 2 minutes
            recorder.stop();
            clearInterval(interval);
            setRecording(false);
            return 120;
          }
          return prev + 1;
        });
      }, 1000);
      setRecordTimerInterval(interval);
    } catch (err) {
      console.error('Microphone access denied:', err);
      setErrorMsg('Microphone access denied. Please allow microphone permissions in browser settings.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      if (recordTimerInterval) {
        clearInterval(recordTimerInterval);
      }
      setRecording(false);
    }
  };

  const deleteRecording = () => {
    setAudioPreviewUrl(null);
    setAudioBlob(null);
    setAudioChunks([]);
  };

  const attachAudioMemo = () => {
    if (audioBlob) {
      const audioFile = new File([audioBlob], `voice_memo_${Date.now()}.mp3`, { type: 'audio/mp3' });
      setProofFiles(prev => [...prev, audioFile]);
      deleteRecording();
    }
  };

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  };

  React.useEffect(() => {
    return () => {
      if (recordTimerInterval) clearInterval(recordTimerInterval);
    };
  }, [recordTimerInterval]);

  // 6-hour submission cooldown state
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const formatCooldown = (ms) => {
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  };

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

  // Cooldown check based on latest complaint
  React.useEffect(() => {
    const checkCooldown = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem('trsv_session_token');
        const res = await fetch('/api/complaints/my', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.complaints && data.complaints.length > 0) {
          const latestTime = new Date(data.complaints[0].created_at).getTime();
          const diffMs = Date.now() - latestTime;
          const cooldownMs = 6 * 60 * 60 * 1000;
          setCooldownRemaining(diffMs < cooldownMs ? cooldownMs - diffMs : 0);
        } else {
          setCooldownRemaining(0);
        }
      } catch (err) {
        console.warn('Cooldown check failed:', err);
      }
    };
    checkCooldown();
  }, [user]);

  // Tick cooldown timer every second
  React.useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const interval = setInterval(() => {
      setCooldownRemaining(prev => {
        if (prev <= 1000) { clearInterval(interval); return 0; }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownRemaining > 0]);

  // Sync initial profile values if loaded after render
  React.useEffect(() => {
    if (userProfile) {
      if (!complainantName) setComplainantName(userProfile.full_name || '');
      if (!complainantMobile) setComplainantMobile(userProfile.phone || '');
      if (!collegeSchoolAddress && userProfile.college_name && userProfile.college_name !== 'Not Set') setCollegeSchoolAddress(userProfile.college_name);
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

  const handleRaiseComplaint = async (e) => {
    e.preventDefault();
    // complainantName is now completely optional, so we do not enforce .trim() validation.
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

    setSubmitting(true);
    setErrorMsg('');
    try {
      const uploadedProofs = [];
      
      // Upload complaint proof attachments sequentially to Supabase
      if (proofFiles.length > 0) {
        for (const file of proofFiles) {
          const publicUrl = await uploadGrievanceMedia(file);
          uploadedProofs.push({ url: publicUrl, name: file.name });
        }
      }

      const token = localStorage.getItem('trsv_session_token');
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `Complaint from ${complainantName}`,
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
        setErrorMsg(data.message || 'Failed to raise official complaint.');
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
    const stages = ['Registered', 'Started', 'Solved'];
    let currentIdx = 0;
    const st = (status || '').trim();
    if (st === 'Complaint Registered' || st === 'Audit Phase' || st === 'Registered' || st === 'Pending') {
      currentIdx = 0;
    } else if (st === 'Solving Started' || st === 'Processing' || st === 'In Progress' || st === 'Complaint Verified' || st === 'Verified' || st === 'Started') {
      currentIdx = 1;
    } else if (st === 'Solved' || st === 'Resolved') {
      currentIdx = 2;
    } else if (st === 'Dismissed' || st === 'Rejected') {
      currentIdx = -1;
    }

    if (currentIdx === -1) {
      return (
        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-rose-500 font-bold">
          <AlertTriangle className="w-3.5 h-3.5" /> Rejected
        </div>
      );
    }

    const shortLabels = ['Registered', 'Started', 'Solved'];

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
                      : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {shortLabels[idx]}
                </span>
              </div>
              {idx < stages.length - 1 && (
                <div className={`h-0.5 flex-1 max-w-[40px] rounded transition-colors ${
                  currentIdx > idx ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-12 py-4 text-left animate-fadeIn">
      
      {/* Header Banner */}
      <AnimatedSection direction="up" className="text-center max-w-3xl mx-auto flex flex-col gap-4">
        <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 tracking-widest uppercase flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          OFFICIAL COMPLAINT REDRESSAL PORTAL
        </span>
        <h1 className="fluid-heading-2 font-black text-slate-850 dark:text-white leading-tight text-center">
          State Complaint Submission Gate
        </h1>
        <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed text-center">
          Raise your academic, campus-safety, or administrative complaint directly into the TVRS Command Node. Every submission is digitally routed to local and statewide leaders.
        </p>
      </AnimatedSection>      <section className="w-full flex flex-col gap-8">
        
        {/* Main Complaint Submission Form Card */}
        <div className="p-6 sm:p-8 w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs relative">
          {user ? (
            complaintSubmitted ? (
              // 1. Complaint Registered Success Screen
              <div className="text-center py-10 flex flex-col items-center gap-5 max-w-lg mx-auto animate-scaleUp">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-8 h-8" />
                </div>
                
                <div className="flex flex-col gap-2">
                  <h3 className="font-bold text-2xl text-slate-900 dark:text-white">
                    Complaint Logged Successfully
                  </h3>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-wider uppercase bg-blue-50 dark:bg-blue-950/50 px-3 py-1 rounded-full self-center border border-blue-200 dark:border-blue-900/50">
                    Ticket ID: #{assignedTicketId}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                  Your complaint has been successfully recorded in the database. The regional leaders mapped to your constituency area have been notified. You can track the real-time resolution progress of this ticket anytime on the dedicated Track Complaint page.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                  <PremiumButton
                    variant="primary"
                    size="md"
                    onClick={() => navigate(`/dashboard/track-complaint?open_ticket_id=${assignedTicketId}`)}
                  >
                    Track Complaint Status
                  </PremiumButton>

                  {cooldownRemaining > 0 ? (
                    <div className="w-full flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300">
                        <span className="text-xs font-semibold uppercase tracking-wider">⏳ Cooldown Active</span>
                        <span className="font-mono font-bold text-sm">{formatCooldown(cooldownRemaining)}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 text-center font-medium">You may submit another complaint once the cooldown expires.</p>
                    </div>
                  ) : (
                    <PremiumButton
                      variant="secondary"
                      size="md"
                      onClick={() => {
                        setComplaintSubmitted(false);
                        setAssignedTicketId('');
                      }}
                    >
                      Submit Another Complaint
                    </PremiumButton>
                  )}
                </div>
              </div>
            ) : (
              // 2. Complaint Raise Form
              <form onSubmit={handleRaiseComplaint} className="flex flex-col gap-6 w-full animate-scaleUp text-left">
                <div className="flex flex-col gap-1 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Get Official Help
                  </h3>
                  <p className="text-xs font-medium text-slate-400">
                    All fields are mandatory. Filing false complaints will result in permanent credential suspension.
                  </p>
                </div>

                {/* MANDATORY DISCLAIMER BOX */}
                <div className="p-4 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-start gap-2.5 leading-relaxed">
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                  <div>
                    <strong className="block font-bold uppercase mb-1">⚠️ Mandatory Disclaimer</strong>
                    By submitting this complaint, you declare under union regulations that all facts, details, and attachments are genuine and true. Lodging simulated, fake, or false reports is strictly prohibited under the TVRS State Charter, and will result in immediate suspension of student credentials and potential legal actions.
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Form Inputs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Complainant Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Complainant Full Name <span className="text-slate-400">(Optional)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter Complainant Name"
                        value={complainantName}
                        onChange={(e) => setComplainantName(e.target.value)}
                        className="peer w-full pl-11 pr-4 py-3 rounded-xl border bg-slate-50/50 dark:bg-slate-955 text-sm focus:outline-none focus:border-blue-600 border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white font-medium transition-colors"
                      />
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none z-10" />
                    </div>
                  </div>

                  {/* Constituency Selection Dropdown */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Constituency / Area Node <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedConstituencyId}
                        onChange={(e) => setSelectedConstituencyId(e.target.value)}
                        className="peer w-full pl-11 pr-4 py-3 rounded-xl border bg-slate-50/50 dark:bg-slate-955 text-sm focus:outline-none focus:border-blue-600 border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer transition-colors"
                        required
                      >
                        <option value="">Select constituency area</option>
                        {constituencyList.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.constituency_name === 'Upcoming Area' ? '⚠️ Upcoming Area (My area is not listed)' : `${c.constituency_name} (${c.district})`}
                          </option>
                        ))}
                      </select>
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none z-10" />
                    </div>
                  </div>

                  {/* Category Selection Dropdown */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Complaint Category <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="peer w-full pl-11 pr-4 py-3 rounded-xl border bg-slate-50/50 dark:bg-slate-955 text-sm focus:outline-none focus:border-blue-600 border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer transition-colors"
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
                        <option value="Other">Other complaints</option>
                      </select>
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none z-10" />
                    </div>
                  </div>

                  {/* Urgency selection dropdown */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Urgency Level <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={urgency}
                        onChange={(e) => setUrgency(e.target.value)}
                        className="peer w-full pl-11 pr-4 py-3 rounded-xl border bg-slate-50/50 dark:bg-slate-955 text-sm focus:outline-none focus:border-blue-600 border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer transition-colors"
                        required
                      >
                        <option value="Low">Low - System resolution timeline</option>
                        <option value="Medium">Medium - Standard leader dispatch</option>
                        <option value="High">High - Priority response board</option>
                        <option value="Critical">Critical - Immediate security check</option>
                      </select>
                      <AlertTriangle className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none z-10" />
                    </div>
                  </div>

                  {/* Empty space filler for layout matching */}
                  <div className="hidden md:block" />
                </div>

                {/* College address */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Full College / School Proper Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Enter College Name, Campus Block, City/District details"
                      value={collegeSchoolAddress}
                      onChange={(e) => setCollegeSchoolAddress(e.target.value)}
                      className="peer w-full pl-11 pr-4 py-3 rounded-xl border bg-slate-50/50 dark:bg-slate-955 text-sm focus:outline-none focus:border-blue-600 border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white font-medium transition-colors"
                    />
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none z-10" />
                  </div>
                </div>

                {/* Detailed description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Detailed Issue Description <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      rows={5}
                      required
                      placeholder="Provide a detailed description of the incident, names involved (if applicable), timings, and specific help required..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="peer w-full pl-11 pr-4 py-3 rounded-xl border bg-slate-50/50 dark:bg-slate-955 text-sm focus:outline-none focus:border-blue-600 border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white font-medium transition-colors resize-y"
                    />
                    <AlignLeft className="absolute left-4 top-4 w-4.5 h-4.5 text-slate-400 pointer-events-none z-10" />
                  </div>
                </div>

                {/* Proofs Drag and Drop field */}
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Complaint Proof Attachments <span className="text-slate-400">(Optional)</span></span>
                    <span className="text-[9px] text-blue-600 dark:text-blue-400 font-semibold uppercase">Evidence files are optional</span>
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* File Dropzone */}
                    <div className="relative group cursor-pointer border border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-600 rounded-2xl bg-slate-50/50 dark:bg-slate-955 p-6 text-center transition-all flex flex-col items-center justify-center min-h-[140px]">
                      <input
                        type="file"
                        multiple
                        accept="application/pdf,video/mp4,image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      />
                      <div className="flex flex-col items-center gap-2 pointer-events-none select-none">
                        <UploadCloud className="w-7 h-7 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform duration-200" />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 block">Drag & Drop files here</span>
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider font-medium">PDF, MP4, Images up to 20MB</span>
                        </div>
                      </div>
                    </div>

                    {/* Audio Recorder Panel */}
                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955 p-5 flex flex-col justify-between min-h-[140px] text-left gap-3 group">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          <Mic className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          Voice Memo Evidence
                        </span>
                        {recording && (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            Recording {formatTimer(recordTime)}
                          </span>
                        )}
                      </div>

                      {/* Display States */}
                      {!recording && !audioPreviewUrl ? (
                        <div className="flex-1 flex flex-col justify-center items-center text-center">
                          <p className="text-[10px] text-slate-400 font-medium mb-2 leading-relaxed max-w-[200px]">
                            Record a brief audio statement explaining the issue directly from your microphone.
                          </p>
                          <button
                            type="button"
                            onClick={startRecording}
                            className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold text-[10px] hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                          >
                            🎙️ Record Memo
                          </button>
                        </div>
                      ) : recording ? (
                        <div className="flex-1 flex flex-col justify-center items-center gap-2.5">
                          {/* Animated Waveform indicator */}
                          <div className="flex items-center gap-1 h-6">
                            <div className="w-1 bg-blue-600 rounded animate-voice-bar-1 h-2" />
                            <div className="w-1 bg-blue-600 rounded animate-voice-bar-2 h-4" />
                            <div className="w-1 bg-blue-500 rounded animate-voice-bar-3 h-5" />
                            <div className="w-1 bg-blue-600 rounded animate-voice-bar-4 h-3" />
                            <div className="w-1 bg-blue-500 rounded animate-voice-bar-5 h-4" />
                            <div className="w-1 bg-blue-600 rounded animate-voice-bar-6 h-2" />
                          </div>
                          <button
                            type="button"
                            onClick={stopRecording}
                            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[10px] flex items-center gap-1.5 cursor-pointer"
                          >
                            <Square className="w-3 h-3 fill-current" /> Stop & Preview
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col justify-center gap-2">
                          <audio src={audioPreviewUrl} controls className="w-full h-8 accent-blue-600 mt-1" />
                          <div className="flex gap-2 w-full mt-1.5">
                            <button
                              type="button"
                              onClick={deleteRecording}
                              className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                              title="Delete Recording"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={attachAudioMemo}
                              className="flex-1 py-2 px-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white font-semibold text-[10px] transition-colors cursor-pointer"
                            >
                              ✓ Attach Voice Memo
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* File Preview List */}
                {proofFiles.length > 0 && (
                  <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto pr-1">
                    {proofFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl border bg-slate-50/50 dark:bg-slate-955 border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center gap-2 min-w-0">
                           <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                           <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate">{file.name}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[9px] font-medium text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
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
                    className="rounded border-slate-300 dark:border-slate-800 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="anonymous" className="text-xs text-slate-600 dark:text-slate-400 font-medium select-none cursor-pointer">
                    File anonymously (Hide my name from regional leaders)
                  </label>
                </div>

                {cooldownRemaining > 0 ? (
                  <div className="w-full mt-2 flex flex-col items-center gap-2 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                      <span className="text-xs font-semibold uppercase tracking-wider">⏳ Submission Cooldown</span>
                      <span className="font-mono font-bold text-base">{formatCooldown(cooldownRemaining)}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center font-medium">Your previous complaint was lodged recently. You can submit another once this timer expires.</p>
                  </div>
                ) : (
                  <PremiumButton
                    type="submit"
                    variant="primary"
                    size="md"
                    className={`w-full mt-2 ${isEmergency ? '!bg-rose-600 hover:!bg-rose-700' : ''}`}
                    disabled={submitting}
                    icon={submitting ? null : <Send className="w-4 h-4 text-white" strokeWidth={2.5} />}
                  >
                    {submitting ? 'Transmitting Evidences & Submitting...' : (isEmergency ? 'Trigger Emergency Dispatch' : 'Get Help')}
                  </PremiumButton>
                )}
              </form>
            )
          ) : (
            // 3. Guest login warning fallback
            <div className="text-center py-10 flex flex-col items-center gap-5 max-w-md mx-auto animate-scaleUp">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-xl text-slate-900 dark:text-white">
                Secure Submission Required
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium text-center">
                To raise an official student complaint and track its lifecycle, you must log in to your verified student advocate account first.
              </p>
              <div className="flex gap-3">
                <PremiumButton variant="primary" size="sm" onClick={() => navigate('/login')}>
                  Log In Account
                </PremiumButton>
                <PremiumButton variant="secondary" size="sm" onClick={() => navigate('/signup')}>
                  Register Node
                </PremiumButton>
              </div>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
