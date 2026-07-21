import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import AnimatedSection from '../components/AnimatedSection';
import { useOrg } from '../context/OrgContext';

const LEADERS = [
  {
    id: 'kavitha',
    full_name: 'Kavitha Kalvakuntla Garu',
    role: 'Founder',
    profile_image: '/akka.jpg',
    accentColor: 'blue',
    description: 'Founder & Patron of TRSV. Dedicated to championing student rights, state education reforms, and empowering youth across all districts of Telangana.'
  },
  {
    id: 'aaditya',
    full_name: 'Aaditya Devanapalli Garu',
    role: 'Leader',
    profile_image: '/aaditya.jpg',
    accentColor: 'blue',
    description: 'Senior Leader guiding organizational strategies, campus coordination frameworks, and student advocacy operations throughout the state.'
  },
  {
    id: 'karthik',
    full_name: 'Karthik Yadav',
    role: 'Greater Hyderabad General Secretary',
    profile_image: '/karthiknew.jpeg',
    accentColor: 'blue',
    description: 'Commands regional assembly clusters, compliance reporting, and student grievance cells throughout Greater Hyderabad. Main pillar, supporter of this portal.'
  },
  {
    id: 'suryachandra',
    full_name: 'Suryachandra',
    role: 'Developer & Digital Operations President',
    profile_image: null,
    accentColor: 'amber',
    description: 'Digital Architect of TRSV - designs, implements, and maintains the portal, database infrastructure, and student safety telemetry systems.'
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
    profile_image: '/naveen_goud.jpg',
    accentColor: 'emerald',
    description: 'Supervises state-level campaigns, campus safety units, and represents student welfare delegations to governing bodies.'
  },
  {
    id: 'bhagath',
    full_name: 'Bhagath Yadav',
    role: 'General Secretary',
    profile_image: '/bhagatyadav.jpg',
    accentColor: 'emerald',
    description: 'Manages compliance auditing, student organization charters, and internal governance workflows across Telangana.'
  },
  {
    id: 'madhu',
    full_name: 'Kandula Madhu',
    role: 'Secretary',
    profile_image: '/kandulamadhu.jpg',
    accentColor: 'emerald',
    description: 'Coordinates communication channels, resolves regional student disputes, and leads student awareness assemblies.'
  },
  {
    id: 'rajkumar',
    full_name: 'B.Rajkumar',
    role: 'Rangareddy District President',
    profile_image: '/raj_rangareddy.jpg',
    accentColor: 'blue',
    description: 'Oversees organizational growth, campus student welfare operations, and local grievance redressal cells in the Rangareddy district.'
  },
  {
    id: 'gummadi_kranthi',
    full_name: 'Gummadi Kranthi',
    role: 'Greater Hyderabad President',
    profile_image: '/g_kranthi.jpg',
    accentColor: 'blue',
    description: 'Oversees campus welfare initiatives, district union coordination, and student advocacy committees throughout Greater Hyderabad.'
  },
  {
    id: 'vogoti_shekar',
    full_name: 'Vogoti Shekar',
    role: 'Greater Hyderabad Vice President',
    profile_image: '/shekar_hydvice.jpg',
    accentColor: 'blue',
    description: 'Manages student outreach initiatives, campus union activities, and regional support networks across Greater Hyderabad.'
  }
];

const CinematicCard = ({ lead, accentColor = 'blue' }) => {
  const accents = {
    blue: {
      badge: 'border-blue-200 dark:border-blue-800/80 bg-blue-50/90 dark:bg-blue-950/90 text-blue-700 dark:text-blue-300',
      pulseDot: 'bg-blue-600 dark:bg-blue-400',
      hoverColor: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
    },
    emerald: {
      badge: 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/90 dark:bg-emerald-950/90 text-emerald-700 dark:text-emerald-300',
      pulseDot: 'bg-emerald-600 dark:bg-emerald-400',
      hoverColor: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
    },
    amber: {
      badge: 'border-amber-200 dark:border-amber-800/80 bg-amber-50/90 dark:bg-amber-950/90 text-amber-700 dark:text-amber-300',
      pulseDot: 'bg-amber-600 dark:bg-amber-400',
      hoverColor: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
    },
  };
  const c = accents[lead.accentColor] || accents.blue;
  const { shortName } = useOrg();

  const formattedDescription = lead.description ? lead.description.replace(/TVRS/g, shortName) : '';

  return (
    <div className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col items-stretch text-left overflow-hidden">
      <div className="w-full aspect-[3/4] relative overflow-hidden bg-slate-100 dark:bg-slate-950">
        {lead.profile_image ? (
          <img
            src={lead.profile_image}
            alt={lead.full_name}
            loading="lazy"
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-6 text-center select-none border-b border-slate-800/50">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
              <Users className="w-7 h-7 text-blue-400" />
            </div>
            <span className="text-[10px] font-semibold text-blue-400 tracking-wider uppercase mb-1">
              {shortName} Officer
            </span>
            <span className="text-xs font-medium text-slate-400 tracking-wider">
              Executive Board
            </span>
          </div>
        )}
        {/* Bottom gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-85 pointer-events-none" />

        {/* Floating role badge top-left */}
        <div className={`absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-sm ${c.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${c.pulseDot}`} />
          <span className="text-[9px] font-semibold uppercase tracking-wider">
            {lead.role}
          </span>
        </div>

        {/* Name overlaid at the bottom of portrait */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-4">
          <h3 className={`text-lg sm:text-xl font-bold text-white leading-tight transition-colors duration-200 ${c.hoverColor}`}>
            {lead.full_name}
          </h3>
        </div>
      </div>

      {/* Details below portrait */}
      <div className="flex flex-col gap-3 p-5 sm:p-6">
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          {formattedDescription}
        </p>
      </div>
    </div>
  );
};

const getInitialLeaders = (shortName) => LEADERS.map(lead => ({
  ...lead,
  description: lead.description.replace(/(TVRS|TRSV)/g, shortName)
}));

export default function Team() {
  const { shortName, fullName } = useOrg();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const response = await fetch('/api/leaders/public');
        const data = await response.json();
        if (data.success && data.leaders && data.leaders.length > 0) {
          const apiLeaders = data.leaders.map(lead => {
            const desigLower = (lead.designation || '').toLowerCase();
            let accentColor = 'blue';
            if (desigLower.includes('president') || desigLower.includes('founder')) {
              accentColor = 'emerald';
            } else if (desigLower.includes('secretary')) {
              accentColor = 'blue';
            } else if (desigLower.includes('developer') || desigLower.includes('digital')) {
              accentColor = 'amber';
            }

            return {
              id: lead.id,
              full_name: lead.full_name,
              role: lead.designation,
              profile_image: lead.profile_image || null,
              accentColor: accentColor,
              description: lead.biography || `${lead.designation} of ${shortName} union. Serving the student community in ${lead.constituency_name || lead.district || 'Statewide'} region.`
            };
          });
          
          setLeaders(apiLeaders);
        } else {
          setLeaders(getInitialLeaders(shortName || 'TRSV'));
        }
      } catch (err) {
        console.warn('Failed to load leaders from database CMS:', err);
        setLeaders(getInitialLeaders(shortName || 'TRSV'));
      } finally {
        setLoading(false);
      }
    };

    fetchLeaders();
  }, [shortName]);

  return (
    <div className="w-full flex flex-col gap-12 py-4">
      {/* Header */}
      <AnimatedSection direction="up" className="text-center max-w-3xl mx-auto flex flex-col gap-3">
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-wider uppercase">
          {shortName} DIRECTORY
        </span>
        <h1 className="fluid-heading-2 font-bold text-slate-900 dark:text-white leading-tight">
          Executive Board & Command Council
        </h1>
        <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
          The unified leadership council of {fullName} ({shortName}), guiding student welfare and security across Telangana.
        </p>
      </AnimatedSection>

      <div className="flex flex-col gap-12 text-left animate-fadeIn">
        <AnimatedSection direction="up" delay={0.05} className="flex flex-col gap-6">
          {loading && leaders.length === 0 ? (
            <div className="w-full py-12 flex justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-t-blue-600 border-slate-200 dark:border-slate-800 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leaders.map(lead => (
                <CinematicCard
                  key={lead.id}
                  lead={lead}
                  accentColor={lead.accentColor}
                />
              ))}
            </div>
          )}
        </AnimatedSection>
      </div>
    </div>
  );
}
