import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, RefreshCw, FlipHorizontal, Download, Printer, ShieldAlert, ArrowRight, Sun, Moon, Info, PhoneCall } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import PremiumButton from '../components/PremiumButton';
import QRCode from 'qrcode';

export default function DigitalIdCard() {
  const { userProfile } = useAuth();
  const isLeader = userProfile?.role !== 'student';
  const getDisplayRole = (role, constituencyName) => {
    if (!role) return "UNION MEMBER";
    if (role === "student") return "STUDENT MEMBER";
    if (role === "supreme_admin") return "TVRS FOUNDER";
    if (role === "dev") return "DEVELOPER";
    
    const roleLabel = role.replace(/_/g, " ").toUpperCase();
    if (constituencyName && constituencyName !== "Statewide Headquarter") {
      return `${constituencyName} ${roleLabel}`.toUpperCase();
    }
    return `STATE ${roleLabel}`.toUpperCase();
  };

  const roleDisplay = getDisplayRole(userProfile?.role, userProfile?.constituency_name);

  // Theme configuration objects for HTML rendering
  const cardThemeStyles = isLeader 
    ? {
        bgGradient: 'from-[#060c18] via-[#0c162c] to-[#040812]',
        borderClass: 'border-[#fbbf24]/40',
        textGold: 'text-[#fbbf24]',
        textGoldMuted: 'text-[#fbbf24]/80',
        glowColor: 'rgba(251, 191, 36, 0.15)',
        statusClass: 'border-amber-500/35 bg-amber-500/10 text-amber-400',
        badgeClass: 'border-[#fbbf24]/30 bg-[#fbbf24]/5 text-[#fbbf24]',
        logoColor: '#fbbf24',
        svgWatermarkColor: 'rgba(251, 191, 36, 0.2)',
        svgStateColor: 'text-[#fbbf24]',
        svgLinesColor: 'rgba(251, 191, 36, 0.3)',
        boxShadowInset: 'inset 0 0 20px rgba(251, 191, 36, 0.05), 0 10px 30px rgba(0, 0, 0, 0.5)',
        photoBorder: 'border-[#fbbf24]/50',
        badgeTextColor: 'text-white'
      }
    : {
        bgGradient: 'from-[#07162c] via-[#0e2747] to-[#04101e]',
        borderClass: 'border-[#0ea5e9]/40',
        textGold: 'text-[#0ea5e9]',
        textGoldMuted: 'text-[#0ea5e9]/80',
        glowColor: 'rgba(14, 165, 233, 0.12)',
        statusClass: 'border-sky-500/35 bg-sky-500/10 text-sky-450',
        badgeClass: 'border-[#0ea5e9]/30 bg-[#0ea5e9]/5 text-[#0ea5e9]',
        logoColor: '#0ea5e9',
        svgWatermarkColor: 'rgba(14, 165, 233, 0.2)',
        svgStateColor: 'text-[#0ea5e9]',
        svgLinesColor: 'rgba(14, 165, 233, 0.3)',
        boxShadowInset: 'inset 0 0 20px rgba(14, 165, 233, 0.05), 0 10px 30px rgba(0, 0, 0, 0.5)',
        photoBorder: 'border-[#0ea5e9]/50',
        badgeTextColor: 'text-slate-200'
      };

  // State for card telemetry
  const [identity, setIdentity] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  
  // UI Interactive States
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardTheme, setCardTheme] = useState('dark'); // 'dark' | 'light'
  const cardRef = useRef(null);

  // Mouse Tracking Coordinates for 3D Tilt Effect
  const [tiltStyle, setTiltStyle] = useState({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
    reflectionX: '50%',
    reflectionY: '50%',
    reflectionOpacity: 0
  });

  // Fetch Member ID Card Data
  const loadIdentityData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('trsv_session_token');
      const response = await fetch('/api/identity/my-id', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setIdentity(data.identity);
        setMetrics(data.metrics);
      } else {
        setError(data.message || 'Failed to sync your digital identity card.');
      }
    } catch (err) {
      console.error(err);
      setError('Network communication failed with identity node.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIdentityData();
  }, []);

  // Generate QR code locally as a data URL whenever the identity token changes
  useEffect(() => {
    if (identity?.qr_token) {
      const isNativeMobile = window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform() !== 'web';
      const originUrl = isNativeMobile ? 'https://trsv-union.onrender.com' : window.location.origin;
      const verifyUrl = isNativeMobile 
        ? `${originUrl}/#/verify/${identity.qr_token}` 
        : `${originUrl}/verify/${identity.qr_token}`;
      QRCode.toDataURL(verifyUrl, {
        width: 300,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'H'
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('QR generation failed:', err));
    }
  }, [identity?.qr_token]);

  // 3D Tilt Logic
  const handleMouseMove = (e) => {
    if (!cardRef.current || isFlipped) return;
    
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    
    // Relative coordinates inside the card bounding box
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Map to percentage offsets (-0.5 to 0.5)
    const px = (x / rect.width) - 0.5;
    const py = (y / rect.height) - 0.5;
    
    // Rotation bounds: max 15 degrees tilt
    const rotateY = px * 22; 
    const rotateX = -py * 22; 
    
    // Position of dynamic reflection glint
    const glintX = `${(x / rect.width) * 100}%`;
    const glintY = `${(y / rect.height) * 100}%`;

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      reflectionX: glintX,
      reflectionY: glintY,
      reflectionOpacity: 0.35
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      reflectionX: '50%',
      reflectionY: '50%',
      reflectionOpacity: 0
    });
  };

  // Printable layout trigger
  const handlePrint = () => {
    window.print();
  };

  // Helper to load image safely inside canvas using CORS
  const loadImage = (src) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });
  };

  // High-Resolution ID Card Side-by-Side PNG Mock Download Trigger
  const handleDownload = async () => {
    // Generate side-by-side front & back high-resolution layouts
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');

    // Load actual profile avatar and the locally-generated QR code
    const avatarUrl = userProfile?.profile_image || '';
    
    const [avatarImg, qrImg] = await Promise.all([
      avatarUrl ? loadImage(avatarUrl) : Promise.resolve(null),
      qrDataUrl ? loadImage(qrDataUrl) : Promise.resolve(null)
    ]);

    // Draw backdrop backing
    const bgGradient = ctx.createLinearGradient(0, 0, 960, 320);
    bgGradient.addColorStop(0, '#030712');
    bgGradient.addColorStop(0.5, '#0b0f19');
    bgGradient.addColorStop(1, '#020617');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 960, 320);

    // Draw background neon particle glow highlights
    ctx.fillStyle = isLeader ? 'rgba(251, 191, 36, 0.02)' : 'rgba(34, 211, 238, 0.03)';
    ctx.beginPath();
    ctx.arc(200, 100, 180, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(760, 220, 180, 0, 2 * Math.PI);
    ctx.fill();

    // Helper to draw rounded rectangle cards
    const drawRoundedRect = (c, x, y, width, height, radius, fillStyle, strokeStyle, lineWidth) => {
      c.beginPath();
      c.moveTo(x + radius, y);
      c.lineTo(x + width - radius, y);
      c.quadraticCurveTo(x + width, y, x + width, y + radius);
      c.lineTo(x + width, y + height - radius);
      c.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      c.lineTo(x + radius, y + height);
      c.quadraticCurveTo(x, y + height, x, y + height - radius);
      c.lineTo(x, y + radius);
      c.quadraticCurveTo(x, y, x + radius, y);
      c.closePath();
      if (fillStyle) {
        c.fillStyle = fillStyle;
        c.fill();
      }
      if (strokeStyle) {
        c.strokeStyle = strokeStyle;
        c.lineWidth = lineWidth || 1;
        c.stroke();
      }
    };

    // Cards dimensions
    const cW = 420;
    const cH = 260;
    const cY = 30;
    const fX = 30;   // Front Card X
    const bX = 510;  // Back Card X

    // Card background linear gradient
    const cardBgGradient = (x) => {
      const g = ctx.createLinearGradient(x, cY, x + cW, cY + cH);
      if (isLeader) {
        g.addColorStop(0, '#060c18');
        g.addColorStop(1, '#0c162c');
      } else {
        g.addColorStop(0, '#07162c');
        g.addColorStop(1, '#0e2747');
      }
      return g;
    };

    const accentTextColor = isLeader ? '#fbbf24' : '#0ea5e9';
    const accentStrokeColor = isLeader ? 'rgba(251, 191, 36, 0.25)' : 'rgba(14, 165, 233, 0.25)';

    // ----------------------------------------------------
    // DRAW FRONT CARD FACE
    // ----------------------------------------------------
    drawRoundedRect(ctx, fX, cY, cW, cH, 16, cardBgGradient(fX), accentStrokeColor, 2);

    // Front Card Header
    ctx.fillStyle = accentTextColor;
    ctx.font = 'bold 13px Outfit, sans-serif';
    ctx.fillText('TELANGANA RAKSHANA SENA VIDYARTHI VIBHAGAM', fX + 24, cY + 36);

    ctx.fillStyle = isLeader ? '#fbbf24' : '#0ea5e9';
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 7px Outfit, sans-serif';
    ctx.fillText('STATE STUDENT GOVERNANCE COUNCIL', fX + 24, cY + 48);

    // Dynamic verification status tag in header
    const statusText = identity?.verification_status?.toUpperCase() || 'ACTIVE';
    const statusFill = isLeader ? 'rgba(251, 191, 36, 0.1)' : 'rgba(16, 185, 129, 0.1)';
    const statusStroke = isLeader ? '#fbbf24' : '#10b981';
    drawRoundedRect(ctx, fX + cW - 100, cY + 24, 76, 16, 8, statusFill, statusStroke, 1);
    ctx.fillStyle = statusStroke;
    ctx.font = 'bold 8px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(statusText, fX + cW - 62, cY + 35);
    ctx.textAlign = 'left'; // Reset

    // Draw Profile Avatar image rounded or standard letter initials!
    const avatarX = fX + 24;
    const avatarY = cY + 68;
    const avatarSize = 64;

    if (avatarImg) {
      ctx.save();
      // Draw circular avatar masking path
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();
      // Border outline
      ctx.strokeStyle = isLeader ? 'rgba(251, 191, 36, 0.4)' : 'rgba(14, 165, 233, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, 2 * Math.PI);
      ctx.stroke();
    } else {
      // Fallback: Custom Letter initial badge
      const initGrad = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize);
      if (isLeader) {
        initGrad.addColorStop(0, '#fbbf24');
        initGrad.addColorStop(1, '#f59e0b');
      } else {
        initGrad.addColorStop(0, '#0ea5e9');
        initGrad.addColorStop(1, '#22d3ee');
      }
      drawRoundedRect(ctx, avatarX, avatarY, avatarSize, avatarSize, 12, initGrad, null);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Outfit, sans-serif';
      ctx.textAlign = 'center';
      const initials = userProfile?.full_name ? userProfile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'SU';
      ctx.fillText(initials, avatarX + avatarSize/2, avatarY + avatarSize/2 + 8);
      ctx.textAlign = 'left'; // Reset
    }

    // Name & Role
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Outfit, sans-serif';
    ctx.fillText(userProfile?.full_name || 'Surya', avatarX + avatarSize + 16, avatarY + 22);

    ctx.fillStyle = accentTextColor;
    ctx.font = 'bold 10px Outfit, sans-serif';
    ctx.fillText(roleDisplay, avatarX + avatarSize + 16, avatarY + 38);

    // Constituency & Campus Details (Clean wrapping to avoid overlap)
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '9px Outfit, sans-serif';
    
    const constituencyVal = `Constituency: ${userProfile?.constituency_name && userProfile.constituency_name !== 'Not Set' ? userProfile.constituency_name : 'Not Set'}`;
    const campusVal = `Campus: ${userProfile?.college_name && userProfile.college_name !== 'Not Set' ? userProfile.college_name : 'Not Set'}`;
    const issuedVal = `Issued: ${new Date(identity?.issued_at).toLocaleDateString()}`;

    ctx.fillText(constituencyVal, avatarX + avatarSize + 16, avatarY + 54);
    ctx.fillText(campusVal.length > 40 ? campusVal.substring(0, 38) + '...' : campusVal, avatarX + avatarSize + 16, avatarY + 68);
    ctx.fillText(issuedVal, avatarX + avatarSize + 16, avatarY + 82);

    // Front Card Footer
    ctx.fillStyle = '#64748b';
    ctx.font = '8px Outfit, sans-serif';
    ctx.fillText('TVRS SYSTEM NODE ID', fX + 24, cY + cH - 38);
    
    ctx.fillStyle = accentTextColor;
    ctx.font = 'bold 15px Courier New, monospace';
    ctx.fillText(identity?.trsv_member_id || 'TVRS-KHA-0001', fX + 24, cY + cH - 20);

    // Verified Seal Badge at bottom-right
    const badgeX = fX + cW - 84;
    const badgeY = cY + cH - 44;
    const badgeFill = isLeader ? 'rgba(251, 191, 36, 0.08)' : 'rgba(14, 165, 233, 0.08)';
    const badgeStroke = isLeader ? 'rgba(251, 191, 36, 0.25)' : 'rgba(14, 165, 233, 0.25)';
    drawRoundedRect(ctx, badgeX, badgeY, 60, 26, 6, badgeFill, badgeStroke, 1);
    
    ctx.fillStyle = isLeader ? '#fbbf24' : '#0ea5e9';
    ctx.font = 'bold 7px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VERIFIED', badgeX + 30, badgeY + 11);
    ctx.fillStyle = isLeader ? '#ffffff' : '#cbd5e1';
    ctx.fillText(isLeader ? 'EXECUTIVE' : 'MEMBER', badgeX + 30, badgeY + 20);
    ctx.textAlign = 'left';

    // ----------------------------------------------------
    // DRAW BACK CARD FACE
    // ----------------------------------------------------
    drawRoundedRect(ctx, bX, cY, cW, cH, 16, cardBgGradient(bX), accentStrokeColor, 2);

    // Back card Header
    ctx.fillStyle = accentTextColor;
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.fillText('TVRS SECURE DATABASE GRID', bX + 24, cY + 36);

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 7px Outfit, sans-serif';
    ctx.fillText('SECURE REAL-TIME VERIFICATION PORTAL', bX + 24, cY + 48);

    // Security chip
    const chipX = bX + cW - 64;
    const chipY = cY + 24;
    const chipGrad = ctx.createLinearGradient(chipX, chipY, chipX + 40, chipY + 26);
    if (isLeader) {
      chipGrad.addColorStop(0, '#f59e0b');
      chipGrad.addColorStop(0.5, '#fbbf24');
      chipGrad.addColorStop(1, '#d97706');
      drawRoundedRect(ctx, chipX, chipY, 40, 26, 6, chipGrad, 'rgba(180, 83, 9, 0.3)', 1);
    } else {
      chipGrad.addColorStop(0, '#94a3b8');
      chipGrad.addColorStop(0.5, '#cbd5e1');
      chipGrad.addColorStop(1, '#64748b');
      drawRoundedRect(ctx, chipX, chipY, 40, 26, 6, chipGrad, 'rgba(100, 116, 139, 0.3)', 1);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chipX + 20, chipY); ctx.lineTo(chipX + 20, chipY + 26);
    ctx.moveTo(chipX, chipY + 13); ctx.lineTo(chipX + 40, chipY + 13);
    ctx.stroke();

    // Centered Large QR Code block
    const qrSize = 100;
    const qrPosX = bX + (cW - qrSize) / 2;
    const qrPosY = cY + 62;

    // Draw white contrast base frame
    drawRoundedRect(ctx, qrPosX - 6, qrPosY - 6, qrSize + 12, qrSize + 12, 10, '#ffffff', isLeader ? 'rgba(251, 191, 36, 0.2)' : 'rgba(14, 165, 233, 0.2)', 1.5);
    
    if (qrImg) {
      ctx.drawImage(qrImg, qrPosX, qrPosY, qrSize, qrSize);
    } else {
      // Fallback: draw placeholder QR grid
      ctx.fillStyle = '#000000';
      ctx.fillRect(qrPosX, qrPosY, qrSize, qrSize);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrPosX + 20, qrPosY + 20, 60, 60);
      ctx.fillStyle = '#000000';
      ctx.fillRect(qrPosX + 35, qrPosY + 35, 30, 30);
    }

    // Label below QR
    ctx.fillStyle = accentTextColor;
    ctx.font = 'bold 7px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SCAN TO AUDIT PROFILE', bX + cW/2, qrPosY + qrSize + 22);

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 5px Outfit, sans-serif';
    ctx.fillText('NEON POSTGRESQL HOSTED LEDGER', bX + cW/2, qrPosY + qrSize + 30);
    ctx.textAlign = 'left'; // Reset

    // Back card Footer
    ctx.fillStyle = '#64748b';
    ctx.font = '7px Outfit, sans-serif';
    ctx.fillText('System Node', bX + 24, cY + cH - 36);
    ctx.fillText('Node Region', bX + cW - 120, cY + cH - 36);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 9px Outfit, sans-serif';
    ctx.fillText('TVRS-V2.5.0', bX + 24, cY + cH - 22);
    ctx.fillText(userProfile?.constituency_name && userProfile.constituency_name !== 'Not Set' ? userProfile.constituency_name : 'Not Set', bX + cW - 120, cY + cH - 22);

    // Trigger immediate link download
    const link = document.createElement('a');
    link.download = `${identity?.trsv_member_id || 'TVRS_Card'}_DigitalID.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const getStatusDetails = (status) => {
    const maps = {
      Verified: { text: 'Verified Official', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' },
      Active: { text: 'Active Member', color: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/10' },
      Suspended: { text: 'Suspended Pending Audit', color: 'text-amber-500 border-amber-500/20 bg-amber-500/10' },
      Inactive: { text: 'Inactive Cardholder', color: 'text-slate-400 border-slate-500/20 bg-slate-500/10' },
      Revoked: { text: 'Revoked Cardholder', color: 'text-rose-500 border-rose-500/20 bg-rose-500/10' }
    };
    return maps[status] || maps.Active;
  };

  const statusObj = getStatusDetails(identity?.verification_status);

  if (loading) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-t-cyan-500 border-slate-200 dark:border-slate-800 animate-spin" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-450 animate-pulse">Syncing Secure ID Node...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 text-left select-none animate-fadeIn">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl glass-panel-light dark:glass-panel-dark border border-slate-200/50 dark:border-slate-850 p-8 shadow-premium-light dark:shadow-premium-dark flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-500/10 to-transparent blur-xl pointer-events-none" />
        
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-extrabold uppercase tracking-wider border border-cyan-500/20">
            Digital Identity Wallet
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white">
            Your Governance Credential
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xl leading-relaxed">
            Manage your holographic governance pass, download print-ready PNG configurations, or trigger QR validation scans for active civic-tech statewide operations.
          </p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setCardTheme(cardTheme === 'dark' ? 'light' : 'dark')}
            className="p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-900/60 text-slate-600 dark:text-slate-350 transition-all duration-200 cursor-pointer active:scale-95"
            title="Toggle card layout color theme"
          >
            {cardTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <PremiumButton 
            variant="glow" 
            size="sm" 
            onClick={loadIdentityData}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh Node
          </PremiumButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        {/* Left Side: 3D ID Card Presentation (5 Cols, or centered 12 for students) */}
        <div className={`${userProfile?.role === 'student' ? 'lg:col-span-12' : 'lg:col-span-5'} flex flex-col items-center gap-6 select-none print:col-span-12`}>
          
          {/* Card perspective container */}
          <div 
            className="w-full max-w-[420px] aspect-[1.586/1] relative cursor-pointer group"
            style={{ perspective: '1000px' }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* Holographic backing wrapper */}
            <div 
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className={`w-full h-full rounded-2xl transition-transform duration-700 ease-out preserve-3d relative border border-white/10 shadow-2xl flex flex-col justify-between p-6 ${cardTheme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}
              style={{
                transform: `${tiltStyle.transform} ${isFlipped ? 'rotateY(180deg)' : ''}`,
                boxShadow: cardTheme === 'dark' 
                  ? '0 25px 50px -12px rgba(34, 211, 238, 0.15)' 
                  : '0 25px 50px -12px rgba(14, 165, 233, 0.12)'
              }}
            >
              {/* --- FRONT SIDE --- */}
              <div 
                className={`absolute inset-0 p-3.5 xs:p-4 sm:p-5 flex flex-col justify-between backface-hidden rounded-2xl transition-all duration-300 z-25 opacity-100 bg-gradient-to-br ${cardThemeStyles.bgGradient} ${cardThemeStyles.borderClass} ${
                  isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
                style={{
                  boxShadow: cardThemeStyles.boxShadowInset
                }}
              >
                {/* 1. Security Micro Geometric Pattern & Guilloche Layer */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl opacity-[0.08]">
                  <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="security-grid-front" width="14" height="14" patternUnits="userSpaceOnUse">
                        <path d="M 14 0 L 0 0 0 14" fill="none" stroke={cardThemeStyles.svgWatermarkColor} strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#security-grid-front)" />
                    <path d="M-50,80 Q100,30 250,130 T550,80" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                    <path d="M-50,90 Q100,40 250,140 T550,90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                    <path d="M-50,100 Q100,50 250,150 T550,100" fill="none" stroke={isLeader ? 'rgba(251, 191, 36, 0.06)' : 'rgba(14, 165, 233, 0.06)'} strokeWidth="0.5" />
                    <path d="M-50,110 Q100,60 250,160 T550,110" fill="none" stroke={isLeader ? 'rgba(251, 191, 36, 0.06)' : 'rgba(14, 165, 233, 0.06)'} strokeWidth="0.5" />
                  </svg>
                </div>

                {/* 2. Massive Telangana State Outline Watermark & Civic-Tech Grid */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl flex items-center justify-center opacity-[0.06]">
                  <svg viewBox="0 0 120 100" className={`w-[75%] h-[75%] ${cardThemeStyles.svgStateColor} fill-none stroke-current stroke-[0.85]`}>
                    <path d="M 58 6 C 72 10, 86 8, 96 16 C 106 24, 110 42, 107 55 C 104 68, 87 82, 72 87 C 57 92, 42 89, 30 82 C 18 75, 10 59, 8 45 C 6 31, 14 17, 27 9 C 40 1, 47 3, 58 6 Z" />
                    <path d="M 58 14 C 69 17, 80 15, 88 22 C 96 29, 99 44, 96 55 C 93 66, 79 78, 67 82 C 55 86, 42 84, 32 78 C 22 72, 15 58, 14 45 C 13 32, 20 20, 31 13 C 42 6, 48 8, 58 14 Z" strokeDasharray="1 3" strokeWidth="0.5" />
                    <circle cx="58" cy="45" r="1.5" className="fill-current stroke-none" />
                    <circle cx="70" cy="50" r="1" className="fill-current/50 stroke-none" />
                    <circle cx="50" cy="35" r="1" className="fill-current/50 stroke-none" />
                    <circle cx="82" cy="38" r="1.2" className="fill-current/50 stroke-none" />
                    <line x1="58" y1="45" x2="70" y2="50" stroke={cardThemeStyles.svgLinesColor} strokeWidth="0.5" />
                    <line x1="58" y1="45" x2="50" y2="35" stroke={cardThemeStyles.svgLinesColor} strokeWidth="0.5" />
                    <line x1="70" y1="50" x2="82" y2="38" stroke={cardThemeStyles.svgLinesColor} strokeWidth="0.5" />
                  </svg>
                </div>

                {/* 3. TVRS Logo Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] select-none pointer-events-none">
                  <img src="/tvrslogo.jpeg" alt="TVRS Logo" className="w-[50%] h-[50%] object-contain rounded-full" />
                </div>

                {/* Holographic reflection glint sheet */}
                <div 
                  className="absolute inset-0 pointer-events-none transition-opacity duration-300 bg-[radial-gradient(circle_at_var(--x,50%)_var(--y,50%),rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_60%)] mix-blend-overlay rounded-2xl"
                  style={{
                    '--x': tiltStyle.reflectionX,
                    '--y': tiltStyle.reflectionY,
                    opacity: tiltStyle.reflectionOpacity
                  }}
                />

                {/* ID Header */}
                <div className="flex items-start justify-between z-10 w-full border-b border-white/10 pb-1.5 sm:pb-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* TVRS Logo in header of ID Card */}
                    <img 
                      src="/trsv.jpeg" 
                      alt="TVRS Logo" 
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg object-cover border border-white/10 shrink-0" 
                    />
                    <div className="flex flex-col text-left">
                      <span className="text-[7.5px] xs:text-[8.5px] sm:text-[10px] font-black tracking-[0.12em] text-white uppercase font-sans">TELANGANA RAKSHANA SENA</span>
                      <span className={`text-[5.5px] xs:text-[6px] sm:text-[7px] font-extrabold ${cardThemeStyles.textGold} uppercase tracking-[0.16em]`}>VIDYARTHI VIBHAGAM (TVRS)</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[5px] xs:text-[5.5px] sm:text-[6.5px] font-black text-slate-400 uppercase tracking-widest leading-none">STATE COUNCIL</span>
                    <div className={`mt-0.5 sm:mt-1 px-1 py-0.5 sm:px-1.5 rounded border text-[5.5px] xs:text-[6px] sm:text-[7px] font-black tracking-wider uppercase flex items-center gap-0.5 sm:gap-1 leading-none ${cardThemeStyles.statusClass}`}>
                      <span className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full ${isLeader ? 'bg-amber-400' : 'bg-cyan-400'} animate-pulse`} />
                      {statusObj.text.replace(' Official', '').replace(' Member', '')}
                    </div>
                  </div>
                </div>

                {/* Card middle: Avatar & Profile */}
                <div className="flex items-center gap-2 sm:gap-4 my-auto z-10 w-full">
                  {/* Photo Section (Hero Frame) */}
                  <div className="relative shrink-0 flex flex-col items-center justify-center">
                    <div className={`w-12 h-16 sm:w-[72px] sm:h-[90px] rounded-lg overflow-hidden border ${cardThemeStyles.photoBorder} bg-[#06142c] relative p-[2px] sm:p-[3px] shadow-[0_4px_12px_rgba(0,0,0,0.3)] shrink-0`}>
                      {/* ID Border Crop Marks / Security Ticks */}
                      <div className={`absolute top-1 left-1 w-1.5 h-1.5 border-t border-l ${cardThemeStyles.borderClass}`} />
                      <div className={`absolute top-1 right-1 w-1.5 h-1.5 border-t border-r ${cardThemeStyles.borderClass}`} />
                      <div className={`absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l ${cardThemeStyles.borderClass}`} />
                      <div className={`absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r ${cardThemeStyles.borderClass}`} />
                      
                      {userProfile?.profile_image ? (
                        <img 
                          src={userProfile.profile_image} 
                          alt={userProfile.full_name} 
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-b ${isLeader ? 'from-[#0a1b32] to-[#122e50]' : 'from-[#041d3d] to-[#0d3b66]'} ${cardThemeStyles.textGold} font-black text-xl flex flex-col items-center justify-center uppercase select-none rounded`}>
                          <span className="text-xl sm:text-2xl">{userProfile?.full_name ? userProfile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'ST'}</span>
                          <span className="text-[5px] sm:text-[6px] tracking-wider text-slate-400 mt-1 font-sans">{isLeader ? 'OFFICIAL' : 'MEMBER'}</span>
                        </div>
                      )}
                    </div>
                    {/* Corner shield verification tick mark on photo */}
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full ${isLeader ? 'bg-[#fbbf24] text-[#071830]' : 'bg-[#0ea5e9] text-white'} flex items-center justify-center border border-[#071830] shadow`}>
                      <ShieldCheck className="w-2 sm:w-2.5 h-2 sm:h-2.5 fill-current" />
                    </div>
                  </div>

                  {/* Vertical Divider */}
                  <div className="w-[1px] bg-white/10 self-stretch my-0.5 sm:my-1" />

                  {/* Credential Data Fields */}
                  <div className="flex flex-col justify-between flex-1 min-w-0 text-left py-0.5 gap-0.5 sm:gap-1">
                    <div>
                      <span className="text-[5px] xs:text-[5.5px] sm:text-[6.5px] font-black text-slate-400 uppercase tracking-widest block">MEMBER NAME</span>
                      <h3 className="font-extrabold text-[11px] xs:text-[12px] sm:text-sm truncate tracking-tight text-white leading-tight mt-0.5">{userProfile?.full_name}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                      <div>
                        <span className="text-[5px] xs:text-[5.5px] sm:text-[6.5px] font-black text-slate-400 uppercase tracking-widest block font-sans">CONSTITUENCY</span>
                        <span className="text-[7.5px] xs:text-[8.5px] sm:text-[9.5px] font-bold text-slate-200 block truncate leading-tight mt-0.5">{userProfile?.constituency_name && userProfile.constituency_name !== 'Not Set' ? userProfile.constituency_name : 'Not Set'}</span>
                      </div>
                      <div>
                        <span className="text-[5px] xs:text-[5.5px] sm:text-[6.5px] font-black text-slate-400 uppercase tracking-widest block font-sans">DISTRICT</span>
                        <span className="text-[7.5px] xs:text-[8.5px] sm:text-[9.5px] font-bold text-slate-200 block truncate leading-tight mt-0.5">{userProfile?.district && userProfile.district !== 'Not Set' ? userProfile.district : 'Not Set'}</span>
                      </div>
                    </div>

                    <div className="mt-0.5 sm:mt-1">
                      <span className="text-[5px] xs:text-[5.5px] sm:text-[6.5px] font-black text-slate-400 uppercase tracking-widest block font-sans">ROLE / DESIGNATION</span>
                      <span className={`text-[7.5px] xs:text-[8.5px] sm:text-[9.5px] font-bold block truncate leading-tight mt-0.5 ${cardThemeStyles.textGold}`} title={roleDisplay}>
                        {roleDisplay}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex items-end justify-between border-t border-white/10 pt-1.5 sm:pt-2 z-10 w-full">
                  <div className="flex flex-col text-left">
                    <span className="text-[5px] xs:text-[5.5px] sm:text-[6.5px] text-slate-400 uppercase tracking-widest">CREDENTIAL NUMBER</span>
                    <span className={`text-[9.5px] xs:text-[10.5px] sm:text-[12px] font-bold font-mono ${cardThemeStyles.textGold} tracking-wider mt-0.5`}>
                      {identity?.trsv_member_id}
                    </span>
                  </div>

                  {/* Official VERIFIED Seal Badge */}
                  <div className={`flex items-center gap-1 sm:gap-1.5 border px-1 py-0.5 sm:px-2 sm:py-1 rounded-md shadow-sm select-none shrink-0 ${cardThemeStyles.badgeClass}`}>
                    <svg className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill={isLeader ? "rgba(251, 191, 36, 0.1)" : "rgba(14, 165, 233, 0.1)"}/>
                      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div className="flex flex-col leading-none text-left">
                      <span className="text-[6px] sm:text-[7.5px] font-black uppercase tracking-wider">VERIFIED</span>
                      <span className={`text-[4.5px] sm:text-[5.5px] font-bold uppercase tracking-widest mt-0.5 ${cardThemeStyles.badgeTextColor}`}>{isLeader ? 'EXECUTIVE' : 'MEMBER'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- BACK SIDE --- */}
              <div 
                className={`absolute inset-0 p-3.5 xs:p-4 sm:p-5 flex flex-col justify-between backface-hidden rotate-y-180 rounded-2xl transition-all duration-300 border bg-gradient-to-br ${cardThemeStyles.bgGradient} ${cardThemeStyles.borderClass} ${
                  isFlipped ? 'z-25 opacity-100' : 'z-10 opacity-0 pointer-events-none'
                }`}
              >
                {/* Back card Header */}
                <div className="flex items-center justify-between border-b border-slate-200/10 dark:border-slate-800/50 pb-1.5 sm:pb-2">
                  <div className="flex flex-col text-left">
                    <span className={`text-[7.5px] xs:text-[8px] sm:text-[9px] font-black tracking-widest ${cardThemeStyles.textGold} uppercase`}>TVRS DATABASE GRID</span>
                    <span className="text-[5px] sm:text-[6px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest mt-0.5 font-sans">Verification Portal</span>
                  </div>
                  <div className={`w-6 h-4 sm:w-8 sm:h-6 rounded relative overflow-hidden border shrink-0 ${isLeader ? 'bg-gradient-to-tr from-amber-500 to-amber-300 border-amber-600/30' : 'bg-gradient-to-tr from-slate-400 to-slate-200 border-slate-500/30'}`}>
                    <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-800/20" />
                    <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-800/20" />
                  </div>
                </div>

                {/* Back card Middle: LARGE CENTRAL QR CODE */}
                <div className="flex flex-col items-center justify-center my-auto gap-1 sm:gap-1.5 py-1 sm:py-1.5">
                  <div className={`p-1 rounded-lg sm:rounded-xl bg-white border ${isLeader ? 'border-amber-500/20 shadow-glow-amber/15' : 'border-cyan-500/20 shadow-glow-cyan/15'} flex items-center justify-center shrink-0`}>
                    {qrDataUrl ? (
                      <img 
                        src={qrDataUrl} 
                        alt="Scannable Security QR" 
                        className="w-16 h-16 sm:w-24 sm:h-24"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center text-[8px] text-slate-400 animate-pulse">Generating...</div>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-0.5 mt-0.5">
                    <span className={`text-[6px] sm:text-[7px] font-black ${cardThemeStyles.textGold} tracking-widest uppercase`}>SCAN TO AUDIT PROFILE</span>
                    <span className="text-[4px] sm:text-[5px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">NEON POSTGRESQL HOSTED LEDGER</span>
                  </div>
                </div>

                {/* Back Card Footer: Support info */}
                <div className="flex items-end justify-between border-t border-slate-200/10 dark:border-slate-800/50 pt-1.5 sm:pt-2">
                  <div className="flex flex-col text-left">
                    <span className="text-[5px] sm:text-[6px] text-slate-450 dark:text-slate-500 uppercase tracking-widest">System Node</span>
                    <span className="text-[7px] sm:text-[8px] font-extrabold text-slate-350 dark:text-slate-200 mt-0.5 font-mono">
                      TVRS-V2.5.0
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[5px] sm:text-[6px] text-slate-455 dark:text-slate-500 uppercase tracking-widest">Node Region</span>
                    <span className="text-[7px] sm:text-[8px] font-extrabold text-slate-350 dark:text-slate-200 mt-0.5 truncate max-w-[120px]">
                      {userProfile?.constituency_name && userProfile.constituency_name !== 'Not Set' ? userProfile.constituency_name : 'Not Set'}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Interactive Flip Helper badge */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider select-none">
            <FlipHorizontal className="w-4 h-4 text-cyan-500 animate-bounce" />
            Click Card to Flip & View Details
          </div>

          {/* Actions toolbar */}
          <div className="flex gap-3 w-full max-w-[420px] print:hidden">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-900/60 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
            >
              <Printer className="w-4 h-4 text-cyan-500" />
              Print Pass
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-900/60 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
            >
              <Download className="w-4 h-4 text-sky-500" />
              PNG Export
            </button>
          </div>
        </div>

        {/* Right Side: Identity Metrics & Timelines (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6 print:col-span-12">
        
          {/* 1. Identity Verification Metrics */}
          <div className={`grid gap-4 w-full ${userProfile?.role !== 'student' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'}`}>
            <GlassCard className="p-4 flex flex-col text-left gap-1" hoverEffect={false}>
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Resolved Issues</span>
              <strong className="text-2xl font-black text-slate-800 dark:text-white">
                {metrics?.issues_resolved || 0}
              </strong>
            </GlassCard>
            <GlassCard className="p-4 flex flex-col text-left gap-1" hoverEffect={false}>
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Active Issues</span>
              <strong className="text-2xl font-black text-slate-800 dark:text-white">
                {metrics?.issues_pending || 0}
              </strong>
            </GlassCard>
            {userProfile?.role !== 'student' && (
              <>
                <GlassCard className="p-4 flex flex-col text-left gap-1" hoverEffect={false}>
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Campaigns Run</span>
                  <strong className="text-2xl font-black text-slate-800 dark:text-white">
                    {metrics?.active_campaigns || 0}
                  </strong>
                </GlassCard>
                <GlassCard className="p-4 flex flex-col text-left gap-1" hoverEffect={false}>
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Member Rating</span>
                  <strong className={`text-2xl font-black flex items-center gap-1 ${
                    (metrics?.issues_resolved || 0) === 0 ? 'text-slate-400 dark:text-slate-500' : 'text-amber-500'
                  }`}>
                    {(metrics?.issues_resolved || 0) === 0 ? (
                      <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-900/50 px-2 py-0.5 rounded-md">Not Started</span>
                    ) : (
                      <>★ {parseFloat(metrics?.rating || 5.00).toFixed(2)}</>
                    )}
                  </strong>
                </GlassCard>
              </>
            )}
          </div>

          {/* 2. Official Timeline History */}
          <GlassCard className="p-6 flex flex-col gap-4 text-left relative" hoverEffect={false}>
            <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-850 pb-3">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                Commissioning Timeline
              </h3>
              <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest font-mono">
                Decryption Log Sync
              </span>
            </div>

            <div className="relative border-l border-slate-200/60 dark:border-slate-800/80 pl-6 ml-2 flex flex-col gap-6 py-2">
              {metrics?.timeline && metrics.timeline.length > 0 ? (
                metrics.timeline.map((item, idx) => (
                  <div key={idx} className="relative group text-left">
                    {/* Ring dot marker */}
                    <div className="absolute -left-[30px] top-1 w-2.5 h-2.5 rounded-full border border-cyan-400 bg-white dark:bg-slate-900 shadow-glow-cyan" />
                    
                    <span className="text-[10px] font-bold text-cyan-500 font-mono block">
                      {item.date}
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold mt-1">
                      {item.event}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 dark:text-slate-500 py-4 italic">
                  No chronological timeline logs seed found.
                </div>
              )}
            </div>
          </GlassCard>

          {/* 3. Verification Instructions Panel */}
          <div className="flex items-start gap-4 p-4 rounded-xl border border-cyan-500/10 bg-cyan-500/5 text-slate-600 dark:text-slate-350 text-xs leading-relaxed text-left">
            <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="flex flex-col gap-1">
              <strong className="text-slate-800 dark:text-slate-200">How to execute validation scans?</strong>
              <p>State Coordinators, security teams, and student unions can scan your digital ID card code using their mobile terminals to load your certified digital governance profile, active stats, and resolved complaints metrics instantly.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
