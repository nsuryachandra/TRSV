import React from 'react';
import { useAuth } from '../context/AuthContext';
import HubChat from '../components/HubChat';
import { Navigate } from 'react-router-dom';

export default function SocialChatPage() {
  const { userProfile } = useAuth();

  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }
  const hasLocation = userProfile.constituency_id && userProfile.hub_name && userProfile.hub_name !== 'Upcoming Area';

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col gap-4 animate-fadeIn text-left">
      <div className="flex flex-col gap-1 shrink-0">
        <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-wider">
          Social Chat Lounge
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">
          Secure Regional Student Lounge & Social Network
        </p>
      </div>

      {!hasLocation ? (
        <div className="w-full max-w-2xl mx-auto py-12">
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-yellow-50 dark:bg-yellow-900/10 text-center">
            <h3 className="font-extrabold text-lg text-amber-700 dark:text-amber-300 mb-2">Location Required</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">Please set your campus or constituency location in your profile before accessing the Social Chat lounge.</p>
            <a href="/dashboard/student" className="inline-block px-4 py-2 rounded-xl bg-amber-500 text-white font-bold">Set Location</a>
          </div>
        </div>
      ) : (
        <HubChat 
          user={{
            id: userProfile.id,
            role: userProfile.role,
            full_name: userProfile.full_name,
            constituency_name: userProfile.constituency_name || userProfile.constituency,
            hub_name: userProfile.hub_name
          }} 
          chatMode="social"
        />
      )}
    </div>
  );
}
