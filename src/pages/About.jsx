import React from 'react';
import { ShieldCheck, Flag, Users, Scale, CheckCircle, GraduationCap, HeartPulse } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import AnimatedSection from '../components/AnimatedSection';

export default function About() {
  const pillars = [
    {
      icon: <ShieldCheck className="w-8 h-8 text-rose-500" />,
      title: 'Student Protection First',
      desc: 'Our primary mandate is creating a secure and intimidation-free learning environment across all educational zones. Our anti-ragging squad operates round the clock with legal counsel backing.'
    },
    {
      icon: <Scale className="w-8 h-8 text-cyan-500" />,
      title: 'Decentralized Transparency',
      desc: 'We publish resolution logs and responsive metrics publicly. Every ticket filed receives an immutable digital token that prevents college administrations from burying complaints.'
    },
    {
      icon: <Users className="w-8 h-8 text-sky-500" />,
      title: 'Regional Empowered Governance',
      desc: 'We support 33 active Constituency Hubs and a massive constituency-level campus cluster network. Constituency leads are empowered to audit local college clusters, campus security squads, and fee billing registries.'
    },
    {
      icon: <Flag className="w-8 h-8 text-amber-500" />,
      title: 'Statewide Representative Action',
      desc: 'TVRS operates a scalable State → Constituency → College network. We empower students to stand as coordinators, resolve local college issues, and direct rapid mediation dispatches.'
    }
  ];

  return (
    <div className="w-full flex flex-col gap-16 py-4">
      
      {/* Header Banner */}
      <AnimatedSection direction="up" className="text-center max-w-3xl mx-auto flex flex-col gap-4">
        <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 tracking-widest uppercase">
          WHO WE ARE
        </span>
        <h1 className="fluid-heading-2 font-black text-slate-850 dark:text-white leading-tight">
          Telangana Vidyarthi Rakshana Sena
        </h1>
        <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
          Founded as a statewide digital-first student governance organization, TVRS shields millions of students across campuses from exploitation, ragging, and institutional harassment.
        </p>
      </AnimatedSection>

      {/* Grid Pillars */}
      <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {pillars.map((item, idx) => (
          <GlassCard key={idx} hoverEffect={true} className="p-8 flex flex-col gap-4 text-left">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center shadow-md">
              {item.icon}
            </div>
            <h3 className="font-extrabold text-xl text-slate-850 dark:text-white tracking-tight">
              {item.title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {item.desc}
            </p>
          </GlassCard>
        ))}
      </section>

      {/* Manifesto Section (moved higher for prominence) */}
      <AnimatedSection direction="up" className="w-full flex flex-col gap-8 text-center max-w-4xl mx-auto">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-rose-500 tracking-widest uppercase">
            OUR MANIFESTO
          </span>
          <h2 className="fluid-heading-3 font-extrabold text-slate-850 dark:text-white">
            Transforming Student Welfare & Governance
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            TVRS is committed to advocating for fundamental rights that empower every student to learn, grow, and thrive without financial or social barriers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <GlassCard hoverEffect={true} className="p-6 flex gap-5 border border-rose-500/10 dark:border-rose-500/20 bg-rose-500/5">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center shrink-0 border border-rose-500/20">
              <GraduationCap className="w-6 h-6 text-rose-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h4 className="font-bold text-lg text-slate-850 dark:text-white leading-tight">
                Free Education
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Advocating for fully funded public education, eliminating tuition fees, and ensuring quality learning tools, libraries, and advanced campus facilities are accessible to all students without financial strain.
              </p>
            </div>
          </GlassCard>

          <GlassCard hoverEffect={true} className="p-6 flex gap-5 border border-cyan-500/10 dark:border-cyan-500/20 bg-cyan-500/5">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 flex items-center justify-center shrink-0 border border-cyan-500/20">
              <HeartPulse className="w-6 h-6 text-cyan-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h4 className="font-bold text-lg text-slate-850 dark:text-white leading-tight">
                Free Healthcare
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Ensuring comprehensive medical support, regular health checkups, mental health counseling, and emergency medical response systems are built directly into every college campus framework free of charge.
              </p>
            </div>
          </GlassCard>
        </div>
      </AnimatedSection>

      {/* State Student Charter Section */}
      <AnimatedSection direction="up" className="w-full max-w-4xl mx-auto">
        <GlassCard className="p-8 sm:p-12 text-left relative">
          <h2 className="font-extrabold text-2xl text-slate-850 dark:text-white mb-6 border-b border-slate-200/50 dark:border-slate-850 pb-4 flex items-center gap-2.5">
            <ShieldCheck className="w-6.5 h-6.5 text-cyan-500" />
            TVRS State Student Charter Principles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
              <span>Right to ragging-free secure housing and classrooms on every campus.</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
              <span>Right to public fee clarity and full protection against administrative blackmail.</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
              <span>Immediate access to legal counsel when facing wrongful academic suspensions.</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
              <span>Right to participate in state-level leadership training networks.</span>
            </div>
          </div>
        </GlassCard>
      </AnimatedSection>

    </div>
  );
}
