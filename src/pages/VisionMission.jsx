import React from 'react';
import { ShieldCheck, Target, Award, Eye, Heart, Compass, CheckCircle2, Star, Flag } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import AnimatedSection from '../components/AnimatedSection';
import { useOrg } from '../context/OrgContext';

export default function VisionMission() {
  const { shortName, fullName } = useOrg();

  const coreValues = [
    {
      title: 'Student Empowerment & Protection',
      desc: 'Protecting student rights, preventing campus ragging, and providing a 24/7 rapid response safety net across all colleges in Telangana.',
      icon: <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
    },
    {
      title: 'Systemic Accountability',
      desc: 'Operating with 100% public transparency. Every grievance is logged, tracked, and resolved with verifiable cryptographic tracking.',
      icon: <Eye className="w-6 h-6 text-amber-500" />
    },
    {
      title: 'Academic & Institutional Integrity',
      desc: 'Advocating for fair fee structures, updated lab infrastructure, timely scholarship distribution, and meritocratic campus appointments.',
      icon: <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
    },
    {
      title: 'Inclusive Leadership',
      desc: 'Developing young grassroots leaders across all constituencies, empowering students from rural and urban Telangana alike.',
      icon: <Compass className="w-6 h-6 text-amber-500" />
    }
  ];

  const studentRights = [
    'Right to a zero-tolerance anti-ragging & safe campus environment.',
    'Right to transparent fee structures & prompt government scholarship disbursements.',
    'Right to raise academic complaints without fear of administrative retaliation.',
    'Right to equal representation in college student committees & state forums.',
    'Right to emergency dispatch assistance in crisis situations.'
  ];

  const strategicGoals = [
    {
      year: '2026',
      title: 'Statewide Digital Telemetry Expansion',
      desc: 'Deploying direct panic buttons and automated grievance routing across 1,000+ colleges.'
    },
    {
      year: '2027',
      title: 'Student Legal & Welfare Support Cell',
      desc: 'Providing free legal aid and academic advocacy for aggrieved students in all 33 districts.'
    },
    {
      year: '2028',
      title: 'Center for Youth Innovation & Governance',
      desc: 'Building state-of-the-art incubation units and leadership training academies.'
    }
  ];

  return (
    <div className="w-full flex flex-col gap-12 py-8 animate-fadeIn text-left">
      
      {/* Hero Section */}
      <AnimatedSection direction="up" className="text-center max-w-4xl mx-auto flex flex-col gap-4">
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-widest uppercase flex items-center justify-center gap-2">
          <Flag className="w-4 h-4 text-amber-500" /> Official Institutional Charter
        </span>
        <h1 className="fluid-heading-2 font-bold text-slate-900 dark:text-white leading-tight">
          Vision & Mission Statement
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
          Guiding principles, core values, and strategic imperatives driving {fullName} ({shortName}) towards total student empowerment across Telangana.
        </p>
      </AnimatedSection>

      {/* Vision & Mission Double Card */}
      <AnimatedSection delay={0.1} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <GlassCard className="p-8 flex flex-col gap-5 border-l-4 border-l-blue-600 dark:border-l-blue-500">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center">
            <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-1">
              Our Vision
            </span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Transforming Campus Governance
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              To build a fearless, transparent, and digitally empowered student community in Telangana where every student's dignity is protected, rights are safeguarded, and potential is nurtured without institutional barriers.
            </p>
          </div>
        </GlassCard>

        <GlassCard className="p-8 flex flex-col gap-5 border-l-4 border-l-amber-500">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 flex items-center justify-center">
            <Target className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest block mb-1">
              Our Mission
            </span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Uncompromising Protection & Service
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              To operate an ultra-responsive student welfare framework that acts immediately on grievances, enforces strict anti-ragging protocols, advocates for higher education reforms, and fosters ethical youth leadership across all 33 districts.
            </p>
          </div>
        </GlassCard>

      </AnimatedSection>

      {/* Core Pillars / Values */}
      <AnimatedSection delay={0.15} className="flex flex-col gap-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Core Institutional Values
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            The foundation of every action taken by the {shortName} state council.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {coreValues.map((val, idx) => (
            <GlassCard key={idx} hoverEffect className="p-6 flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {val.icon}
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {val.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {val.desc}
              </p>
            </GlassCard>
          ))}
        </div>
      </AnimatedSection>

      {/* Student Rights Charter */}
      <AnimatedSection delay={0.2} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        <GlassCard className="lg:col-span-2 p-8 flex flex-col gap-6 bg-gradient-to-br from-blue-900/10 via-white to-amber-500/10 dark:from-blue-950/40 dark:via-slate-900 dark:to-amber-950/20">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {shortName} Student Rights Charter
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Non-negotiable guarantees for every enrolled student in Telangana.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {studentRights.map((right, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                  {right}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Future Goals */}
        <GlassCard className="p-8 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Star className="w-6 h-6 text-amber-500" />
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Future Strategic Roadmap
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Target milestones</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {strategicGoals.map((goal, idx) => (
              <div key={idx} className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    {goal.year} Goal
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                  {goal.title}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {goal.desc}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>
      </AnimatedSection>

    </div>
  );
}
