import React from 'react';
import { useAuth } from '../context/AuthContext';
import HubChat from '../components/HubChat';
import { Navigate } from 'react-router-dom';

export default function SocialChatPage() {
  const { userProfile } = useAuth();

  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }
  const isLeader = userProfile.role !== 'student';
  const hasLocation = isLeader || (userProfile.constituency_id && userProfile.hub_name && userProfile.hub_name !== 'Upcoming Area');

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col gap-6 animate-fadeIn text-left">
      <div className="flex flex-col items-center text-center gap-1.5 shrink-0">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-900/50">
          Student Network
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Social Chat Lounge
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-lg leading-relaxed">
          Secure regional student lounge & verified social network
        </p>
      </div>

      {!hasLocation ? (
        <div className="w-full max-w-xl mx-auto py-12">
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center font-bold text-xl">
              📍
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Location Required</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Please set your campus or constituency location in your profile before accessing the Social Chat lounge.
              </p>
            </div>
            <a href="/dashboard/student" className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs">
              Set Location
            </a>
          </div>
        </div>
      ) : (
        <HubChat 
          user={{
            id: userProfile.id,
            role: userProfile.role,
            full_name: userProfile.full_name,
            constituency_name: userProfile.constituency_name || userProfile.constituency,
            hub_name: userProfile.hub_name,
            constituency_id: userProfile.constituency_id
          }} 
          chatMode="social"
        />
      )}
    </div>
  );
}
