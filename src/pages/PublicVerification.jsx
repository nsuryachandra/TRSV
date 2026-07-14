import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Calendar, Award, User, MapPin, Landmark, Clock, CheckCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { useAuth } from '../context/AuthContext';
import { TVRSIdentityCard } from './Profile';

export default function PublicVerification() {
  const { token_or_id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const runVerificationScan = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/identity/verify/${token_or_id}`);
      const resData = await response.json();
      if (resData.success) {
        setData(resData);
      } else {
        setError(resData.message || 'Decryption failed: Member digital record is not indexed on our core PostgreSQL node.');
      }
    } catch (err) {
      console.error(err);
      setError('Communication with the TS-State core governance server timed out.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runVerificationScan();
  }, [token_or_id]);

  if (loading) {
    return (
      <div className="w-full min-h-[85vh] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full border-2 border-t-cyan-500 border-slate-200 dark:border-slate-800 animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-450 animate-pulse mt-2">
          Syncing with Telangana Neon Database...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-[80vh] flex flex-col items-center justify-center p-4">
        <GlassCard className="max-w-[480px] p-8 text-center border-red-500/20 relative" hoverEffect={false}>
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto mb-5 animate-bounce">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Decryption Error</h2>
          <p className="text-xs text-rose-500 dark:text-rose-450 font-mono bg-rose-500/5 p-4 rounded-xl border border-rose-500/10 leading-relaxed">
            {error}
          </p>
          <div className="text-[10px] text-slate-450 mt-6 leading-relaxed">
            TELANGANA VIDYARTHI RAKSHANA SENA<br />
            State Audit Security Node: <span className="font-mono">TVRS-SEC-CORE</span>
          </div>
        </GlassCard>
      </div>
    );
  }

  const { identity, profile, metrics } = data;

  const getStatusVisuals = () => {
    switch (identity.verification_status) {
      case 'Verified':
        return {
          icon: <ShieldCheck className="w-12 h-12 text-emerald-500" />,
          title: 'VERIFIED OFFICIAL',
          sub: 'This credential is fully certified and validated.',
          badgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
          glow: 'border-emerald-500/20 bg-emerald-500/5'
        };
      case 'Active':
        return {
          icon: <ShieldCheck className="w-12 h-12 text-cyan-500" />,
          title: 'ACTIVE REPRESENTATIVE',
          sub: 'Official member in active governance standing.',
          badgeClass: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]',
          glow: 'border-cyan-500/20 bg-cyan-500/5'
        };
      case 'Suspended':
        return {
          icon: <ShieldAlert className="w-12 h-12 text-amber-500" />,
          title: 'TEMPORARILY SUSPENDED',
          sub: 'This credential has been frozen pending a leadership audit.',
          badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]',
          glow: 'border-amber-500/20 bg-amber-500/5'
        };
      case 'Inactive':
        return {
          icon: <ShieldAlert className="w-12 h-12 text-slate-450" />,
          title: 'INACTIVE CARDHOLDER',
          sub: 'This digital identity card has expired or is currently inactive.',
          badgeClass: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
          glow: 'border-slate-550/20 bg-slate-500/5'
        };
      case 'Revoked':
      default:
        return {
          icon: <ShieldAlert className="w-12 h-12 text-rose-500 animate-pulse" />,
          title: 'CREDENTIALS REVOKED',
          sub: 'This card was officially revoked by Supreme Command and is no longer valid.',
          badgeClass: 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]',
          glow: 'border-rose-500/20 bg-rose-500/5'
        };
    }
  };

  const statusVisual = getStatusVisuals();
  const designation = profile.role ? profile.role.replace(/_/g, ' ').toUpperCase() : 'MEMBER';

  return (
    <div className="w-full min-h-[90vh] py-12 px-4 flex flex-col items-center justify-center animate-fadeIn select-none">
      <div className="w-full max-w-[500px] flex flex-col gap-6">
        
        {/* State Insignia Header */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Telangana Vidyarthi Rakshana Sena
          </div>
          <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
            Official Credentials Registry
          </h1>
          <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mt-1" />
        </div>

        {/* Central Verification Card */}
        <GlassCard className="p-6 flex flex-col items-center border border-slate-200/50 dark:border-slate-850 relative overflow-hidden" hoverEffect={false}>
          {/* Subtle Guilloche/Grid pattern backdrop */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#fff_1px,transparent_1px)]" />

          {/* Status Badge */}
          <div className={`px-4 py-2 rounded-full border text-xs font-black uppercase tracking-wider ${statusVisual.badgeClass} flex items-center gap-2 mb-6`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
            </span>
            {statusVisual.title}
          </div>

          {/* Interactive digital ID card */}
          <div className="w-full flex justify-center scale-[0.93] origin-center -my-2">
            <TVRSIdentityCard
              photo={profile.profile_image}
              name={profile.full_name}
              tvrsId={identity.trsv_member_id}
              designation={designation}
              constituency={profile.constituency_name || 'Statewide Headquarters'}
              district={profile.district || 'Hyderabad'}
              joinedDate={identity.issued_at ? new Date(identity.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '14 Jun 2023'}
              verified={identity.verification_status === 'Verified' || profile.role === 'supreme_admin'}
              qrValue={`${window.location.origin}/verify/${identity.qr_token || identity.trsv_member_id}`}
            />
          </div>

          <p className="text-[10px] text-slate-450 dark:text-slate-500 text-center max-w-[280px] leading-relaxed -mt-1 mb-6">
            Click card to flip and verify security features.
          </p>

          {/* Official Registry Details */}
          <div className="w-full flex flex-col gap-3.5 border-t border-slate-200/50 dark:border-slate-850 pt-6 text-left">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5 mb-1">
              <User className="w-4 h-4 text-cyan-400" />
              Personnel Details
            </h3>

            <div className="flex justify-between items-center text-xs py-1 border-b border-slate-100/50 dark:border-slate-900/50">
              <span className="text-slate-450">Full Name</span>
              <strong className="text-slate-800 dark:text-white font-bold">{profile.full_name}</strong>
            </div>

            <div className="flex justify-between items-center text-xs py-1 border-b border-slate-100/50 dark:border-slate-900/50">
              <span className="text-slate-450">Designation</span>
              <strong className="text-cyan-500 dark:text-cyan-400 font-extrabold uppercase">{designation}</strong>
            </div>

            <div className="flex justify-between items-center text-xs py-1 border-b border-slate-100/50 dark:border-slate-900/50">
              <span className="text-slate-450">Member ID</span>
              <strong className="font-mono text-slate-800 dark:text-white font-bold">{identity.trsv_member_id}</strong>
            </div>

            <div className="flex justify-between items-center text-xs py-1 border-b border-slate-100/50 dark:border-slate-900/50">
              <span className="text-slate-450">Constituency</span>
              <strong className="text-slate-850 dark:text-slate-200">{profile.constituency_name || 'Statewide Headquarters'}</strong>
            </div>

            {profile.college_name && (
              <div className="flex justify-between items-center text-xs py-1 border-b border-slate-100/50 dark:border-slate-900/50">
                <span className="text-slate-450">Campus</span>
                <strong className="text-slate-850 dark:text-slate-200 truncate max-w-[200px]">{profile.college_name}</strong>
              </div>
            )}

            <div className="flex justify-between items-center text-xs py-1">
              <span className="text-slate-450">Issued On</span>
              <strong className="text-slate-850 dark:text-slate-200">
                {identity.issued_at ? new Date(identity.issued_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
              </strong>
            </div>
          </div>

          {/* Verification Audit details */}
          <div className="w-full mt-6 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200/50 dark:border-slate-850 text-[10px] text-slate-500 dark:text-slate-450 leading-normal flex items-start gap-2.5">
            <Award className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <strong className="text-slate-750 dark:text-slate-300 font-bold uppercase tracking-wider">Cryptographic Attestation</strong>
              <p>This verification ledger is signed securely by the TVRS State Command. Real-time audit logs of this check are cataloged on core PostgreSQL nodes.</p>
            </div>
          </div>
        </GlassCard>

        {/* Back Link */}
        <div className="text-center mt-2">
          <Link to="/" className="text-xs text-slate-400 hover:text-cyan-500 transition-colors uppercase tracking-widest font-black">
            ← Return to TVRS Portal
          </Link>
        </div>

      </div>
    </div>
  );
}
