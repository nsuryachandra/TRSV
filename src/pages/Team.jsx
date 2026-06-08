import React from 'react';
import { Users } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import AnimatedSection from '../components/AnimatedSection';

const LEADERS = [
  {
    id: 'kavitha',
    full_name: 'Kavitha Kalvakuntla Garu',
    role: 'Founder',
    profile_image: '/akka.jpg',
    accentColor: 'cyan',
    description: 'Founder & Patron of TVRS. Dedicated to championing student rights, state education reforms, and empowering youth across all districts of Telangana.'
  },
  {
    id: 'aaditya',
    full_name: 'Aaditya Devanapalli Garu',
    role: 'Leader',
    profile_image: null,
    accentColor: 'cyan',
    description: 'Senior Leader guiding organizational strategies, campus coordination frameworks, and student advocacy operations throughout the state.'
  },
  {
    id: 'karthik',
    full_name: 'Karthik Yadav',
    role: 'Greater Hyderabad General Secretary',
    profile_image: '/karthiknew.jpeg',
    accentColor: 'violet',
    description: 'Commands regional assembly clusters, compliance reporting, and student grievance cells throughout Greater Hyderabad. Main pillar, supporter of this portal.'
  },
  {
    id: 'suryachandra',
    full_name: 'Suryachandra',
    role: 'Developer & Digital Operations President',
    profile_image: null,
    accentColor: 'amber',
    description: 'Digital Architect of TVRS - designs, implements, and maintains the portal, database infrastructure, and student safety telemetry systems.'
  },
  {
    id: 'ramu',
    full_name: 'Ramu Yadav',
    role: 'President',
    profile_image: '/ramuanna.jpg',
    accentColor: 'emerald',
    description: 'Commands statewide student welfare campaigns, regional coordination committees, and executive campus advocacy cells.'
  },
  {
    id: 'naveen',
    full_name: 'Naveen Goud',
    role: 'Vice President',
    profile_image: null,
    accentColor: 'emerald',
    description: 'Supervises state-level campaigns, campus safety units, and represents student welfare delegations to governing bodies.'
  },
  {
    id: 'bhagath',
    full_name: 'Bhagath Yadav',
    role: 'General Secretary',
    profile_image: null,
    accentColor: 'emerald',
    description: 'Manages compliance auditing, student organization charters, and internal governance workflows across Telangana.'
  },
  {
    id: 'madhu',
    full_name: 'Kandula Madhu',
    role: 'Secretary',
    profile_image: null,
    accentColor: 'emerald',
    description: 'Coordinates communication channels, resolves regional student disputes, and leads student awareness assemblies.'
  },
  {
    id: 'rajkumar',
    full_name: 'B.Rajkumar',
    role: 'Rangareddy District President',
    profile_image: null,
    accentColor: 'violet',
    description: 'Oversees organizational growth, campus student welfare operations, and local grievance redressal cells in the Rangareddy district.'
  }
];

const CinematicCard = ({ lead, accentColor = 'cyan' }) => {
  const accents = {
    cyan: {
      gradient: 'from-cyan-500/20 to-transparent',
      badge: 'border-cyan-500/40 text-cyan-400',
      pulseDot: 'bg-cyan-400',
      roleColor: 'text-cyan-400',
      hoverColor: 'group-hover:text-cyan-400',
      officeIcon: 'text-cyan-500',
      dept: 'text-cyan-500/80',
    },
    emerald: {
      gradient: 'from-emerald-500/20 to-transparent',
      badge: 'border-emerald-500/40 text-emerald-400',
      pulseDot: 'bg-emerald-400',
      roleColor: 'text-emerald-400',
      hoverColor: 'group-hover:text-emerald-400',
      officeIcon: 'text-emerald-500',
      dept: 'text-emerald-500/80',
    },
    violet: {
      gradient: 'from-violet-500/20 to-transparent',
      badge: 'border-violet-500/40 text-violet-400',
      pulseDot: 'bg-violet-400',
      roleColor: 'text-violet-400',
      hoverColor: 'group-hover:text-violet-400',
      officeIcon: 'text-violet-500',
      dept: 'text-violet-500/80',
    },
    amber: {
      gradient: 'from-amber-550/20 to-transparent',
      badge: 'border-amber-500/45 text-amber-450 dark:text-amber-400',
      pulseDot: 'bg-amber-400',
      roleColor: 'text-amber-450 dark:text-amber-400',
      hoverColor: 'group-hover:text-amber-450 dark:group-hover:text-amber-400',
      officeIcon: 'text-amber-500',
      dept: 'text-amber-500/80',
    },
  };
  const c = accents[accentColor] || accents.cyan;

  return (
    <GlassCard hoverEffect={true} className="group p-0 flex flex-col items-stretch text-left bg-gradient-to-b from-white/40 to-white/10 dark:from-slate-950/50 dark:to-slate-950/20 border border-slate-200/50 dark:border-slate-800 shadow-xl overflow-hidden rounded-3xl">
      <div className="w-full aspect-[3/4] relative overflow-hidden bg-slate-100 dark:bg-slate-950">
        {lead.profile_image ? (
          <img
            src={lead.profile_image}
            alt={lead.full_name}
            loading="lazy"
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 flex flex-col items-center justify-center p-6 text-center select-none border-b border-slate-900/50">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
              <Users className="w-7 h-7 text-cyan-400" />
            </div>
            <span className="text-[10px] font-black text-cyan-400 tracking-[0.25em] uppercase mb-1">
              TVRS Officer
            </span>
            <span className="text-xs font-bold text-slate-500 tracking-wider">
              Executive Board
            </span>
          </div>
        )}
        {/* Bottom gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent opacity-90 pointer-events-none" />

        {/* Floating role badge top-left */}
        <div className={`absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border ${c.badge} shadow-lg`}>
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${c.pulseDot}`} />
          <span className={`text-[9px] font-black uppercase tracking-widest ${c.roleColor}`}>
            {lead.role}
          </span>
        </div>

        {/* Name overlaid at the bottom of portrait */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
          <h3 className={`text-xl sm:text-2xl font-black text-white leading-tight mb-1 transition-colors duration-300 ${c.hoverColor}`}>
            {lead.full_name}
          </h3>
        </div>
      </div>

      {/* Details below portrait */}
      <div className="flex flex-col gap-3 p-6">
        <p className="text-xs sm:text-sm text-slate-550 dark:text-slate-400 leading-relaxed">
          {lead.description}
        </p>
      </div>
    </GlassCard>
  );
};

export default function Team() {
  return (
    <div className="w-full flex flex-col gap-16 py-4">
      {/* Header */}
      <AnimatedSection direction="up" className="text-center max-w-3xl mx-auto flex flex-col gap-4">
        <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 tracking-widest uppercase">
          TVRS DIRECTORY
        </span>
        <h1 className="fluid-heading-2 font-black text-slate-850 dark:text-white leading-tight">
          Executive Board & Command Council
        </h1>
        <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
          The unified leadership council of Telangana Vidyarthi Rakshana Sena (TVRS), guiding student welfare and security across Telangana.
        </p>
      </AnimatedSection>

      <div className="flex flex-col gap-16 text-left animate-fadeIn">
        <AnimatedSection direction="up" delay={0.05} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {LEADERS.map(lead => (
              <CinematicCard
                key={lead.id}
                lead={lead}
                accentColor={lead.accentColor}
              />
            ))}
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
