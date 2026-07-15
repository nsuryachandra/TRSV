import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, AlertTriangle, X } from 'lucide-react';

export default function EmergencyFallback({ isOffline, onRetry }) {
  const [retrying, setRetrying] = useState(false);
  const [count, setCount] = useState(10);
  const [isDismissed, setIsDismissed] = useState(false);

  // Reset dismiss state if status changes to online
  useEffect(() => {
    if (!isOffline) {
      setIsDismissed(false);
    }
  }, [isOffline]);

  // Automated reconnect countdown
  useEffect(() => {
    if (!isOffline || isDismissed) return;
    
    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          handleRetry();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOffline, isDismissed]);

  const handleRetry = async () => {
    setRetrying(true);
    if (onRetry) {
      await onRetry();
    }
    setTimeout(() => {
      setRetrying(false);
    }, 1000);
  };

  if (!isOffline || isDismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[99999] w-[calc(100%-2rem)] max-w-sm bg-slate-950/95 border border-rose-550/30 p-5 rounded-2xl shadow-[0_10px_30px_rgba(244,63,94,0.2)] flex flex-col items-center text-center overflow-hidden select-none animate-fadeIn">
      {/* Close button to dismiss and allow normal usage */}
      <button 
        onClick={() => setIsDismissed(true)} 
        className="absolute top-2.5 right-2.5 text-slate-400 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
        title="Dismiss Offline Banner"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="relative z-10 flex flex-col gap-2 w-full pt-1">
        <div className="inline-flex items-center gap-1.5 self-center px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[9px] font-extrabold uppercase tracking-wider border border-rose-500/20 mb-1 animate-pulse">
          <AlertTriangle className="w-3 h-3" /> Telemetry Offline
        </div>
        
        <h3 className="text-xs font-black text-white uppercase tracking-wider">Node Offline</h3>
        <p className="text-[10.5px] text-slate-400 leading-normal">
          Lost contact with the telemetry stream. Real-time updates are temporarily paused.
        </p>

        <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-slate-900/50 border border-slate-800 text-[10px] text-slate-500 font-mono flex items-center justify-between w-full">
          <span>Auto-reconnecting:</span>
          <span className="text-rose-500 font-bold">{count}s</span>
        </div>

        <button
          onClick={handleRetry}
          disabled={retrying}
          className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${retrying ? 'animate-spin' : ''}`} />
          {retrying ? 'Connecting...' : 'Reconnect Now'}
        </button>
      </div>
    </div>
  );
}
