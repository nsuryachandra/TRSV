import React from 'react';
import { ShieldCheck, Flag, Users, Scale, CheckCircle, GraduationCap, HeartPulse } from 'lucide-react';
import AnimatedSection from '../components/AnimatedSection';
import { useOrg } from '../context/OrgContext';

export default function About() {
  const { shortName, fullName } = useOrg();

  const pillars = [
    {
      icon: <ShieldCheck className="w-7 h-7 text-blue-600 dark:text-blue-400" />,
      title: 'Student Protection First',
      desc: 'Our primary mandate is creating a secure and intimidation-free learning environment across all educational zones. Our anti-ragging squad operates round the clock with legal counsel backing.'
    },
    {
      icon: <Scale className="w-7 h-7 text-blue-600 dark:text-blue-400" />,
      title: 'Decentralized Transparency',
      desc: 'We publish resolution logs and responsive metrics publicly. Every ticket filed receives an immutable digital token that prevents college administrations from burying complaints.'
    },
    {
      icon: <Users className="w-7 h-7 text-amber-500" />,
      title: 'Regional Empowered Governance',
      desc: 'We support 33 active Constituency Hubs and a massive constituency-level campus cluster network. Constituency leads are empowered to audit local college clusters, campus security squads, and fee billing registries.'
    },
    {
      icon: <Flag className="w-7 h-7 text-amber-500" />,
      title: 'Statewide Representative Action',
      desc: `${shortName} operates a scalable State → Constituency → College network. We empower students to stand as coordinators, resolve local college issues, and direct rapid mediation dispatches.`
    }
  ];

  return (
    <div className="w-full flex flex-col gap-12 py-4">
      
      {/* Header Banner */}
      <AnimatedSection direction="up" className="text-center max-w-3xl mx-auto flex flex-col gap-3">
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-widest uppercase flex items-center justify-center gap-1.5">
          WHO WE ARE
        </span>
        <h1 className="fluid-heading-2 font-bold text-slate-900 dark:text-white leading-tight">
          {fullName}
        </h1>
        <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
          Founded as a statewide digital-first student governance organization, {shortName} shields millions of students across campuses from exploitation, ragging, and institutional harassment.
        </p>
      </AnimatedSection>

      {/* Grid Pillars */}
      <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {pillars.map((item, idx) => (
          <div key={idx} className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col gap-4 text-left">
            <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center shadow-xs">
              {item.icon}
            </div>
            <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight">
              {item.title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </section>

      {/* Manifesto Section */}
      <AnimatedSection direction="up" className="w-full flex flex-col gap-8 text-center max-w-4xl mx-auto">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 tracking-wider uppercase">
            OUR MANIFESTO
          </span>
          <h2 className="fluid-heading-3 font-bold text-slate-900 dark:text-white">
            Transforming Student Welfare & Governance
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto">
            {shortName} is committed to advocating for fundamental rights that empower every student to learn, grow, and thrive without financial or social barriers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex gap-5">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900/60">
              <GraduationCap className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h4 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                Free Education
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Advocating for fully funded public education, eliminating tuition fees, and ensuring quality learning tools, libraries, and advanced campus facilities are accessible to all students without financial strain.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex gap-5">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-900/60">
              <HeartPulse className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h4 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                Free Healthcare
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Ensuring comprehensive medical support, regular health checkups, mental health counseling, and emergency medical response systems are built directly into every college campus framework free of charge.
              </p>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* State Student Charter Section */}
      <AnimatedSection direction="up" className="w-full max-w-4xl mx-auto">
        <div className="p-6 sm:p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs text-left relative">
          <h2 className="font-bold text-xl sm:text-2xl text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800/80 pb-4 flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            {shortName} State Student Charter Principles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <span>Right to ragging-free secure housing and classrooms on every campus.</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <span>Right to public fee clarity and full protection against administrative blackmail.</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <span>Immediate access to legal counsel when facing wrongful academic suspensions.</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <span>Right to participate in state-level leadership training networks.</span>
            </div>
          </div>
        </div>
      </AnimatedSection>

    </div>
  );
}
