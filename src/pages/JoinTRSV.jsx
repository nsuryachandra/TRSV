import React from 'react';
import { ShieldAlert, AlertTriangle, ArrowLeft, UserX } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import AnimatedSection from '../components/AnimatedSection';
import { useNavigate } from 'react-router-dom';
import PremiumButton from '../components/PremiumButton';

export default function JoinTRSV() {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-center py-8 px-4 text-left">
      <AnimatedSection direction="up" className="w-full max-w-2xl text-center">
        <GlassCard hoverEffect={true} className="p-8 sm:p-12 relative overflow-hidden border border-amber-500/20 dark:border-amber-500/10 bg-white/45 dark:bg-slate-950/20 shadow-xl rounded-2xl">
          {/* Cybernetic accent element */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-glow-amber text-white relative">
              <UserX className="w-8 h-8 animate-pulse" />
              <AlertTriangle className="absolute -bottom-1 -right-1 w-5 h-5 text-amber-900 bg-amber-400 rounded-full p-0.5 border border-white dark:border-slate-900" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-850 dark:text-white leading-tight">
              Recruitment Node Suspended
            </h1>
            <div className="h-1 w-20 bg-gradient-to-r from-amber-500 to-amber-300 rounded-full" />
          </div>

          <div className="space-y-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg mx-auto">
            <p className="font-bold text-slate-700 dark:text-slate-350">
              The TRSV Student Recruitment Portal is currently suspended for active registrations.
            </p>
            <p>
              In alignment with our migration to a privacy-first, identity-secured architecture, the active intake forms have been temporarily taken offline to protect participant data and node integrity.
            </p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400/90 font-semibold bg-amber-500/5 py-2 px-4 rounded-lg border border-amber-500/10 inline-block">
              ⚠️ Status Code: REC_PORTAL_SUSPENDED
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-800/40 flex justify-center">
            <PremiumButton
              onClick={() => navigate(-1)}
              variant="outline"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Return to Previous Terminal
            </PremiumButton>
          </div>
        </GlassCard>
      </AnimatedSection>
    </div>
  );
}
