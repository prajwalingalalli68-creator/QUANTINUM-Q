
import React, { useState, useEffect } from 'react';
import { ThemeMode } from '../types';

interface LockScreenProps {
  themeMode: ThemeMode;
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ themeMode, onUnlock }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const formattedDate = time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="z-10 text-center select-none">
        <h1 className="text-[12rem] font-display font-black tracking-tighter leading-none opacity-80 mb-2">
          {formattedTime}
        </h1>
        <p className="text-2xl font-bold tracking-[0.2em] uppercase text-cyan-400 mb-16 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
          {formattedDate}
        </p>

        <button 
          onClick={onUnlock}
          className="group relative px-12 py-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl hover:bg-white/10 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <span className="relative text-lg font-bold tracking-widest uppercase">Tap to Synchronize</span>
        </button>
      </div>

      <div className="absolute bottom-12 text-white/30 text-xs tracking-widest uppercase flex items-center gap-4">
        <span>Biometric Active</span>
        <div className="w-1 h-1 bg-white/30 rounded-full"></div>
        <span>Core Status: Optimal</span>
      </div>
    </div>
  );
};
