import React, { useState, useEffect } from 'react';
import { ThemeMode } from '../types';

interface StatusBarProps {
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  isOnline: boolean;
  unreadCount: number;
  onOpenNotifications: () => void;
  batteryLevel: number;
  isCharging: boolean;
  batterySupported: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  themeMode,
  onToggleTheme,
  isOnline,
  unreadCount,
  onOpenNotifications,
  batteryLevel,
  isCharging,
  batterySupported
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getThemeLabel = (mode: ThemeMode) => {
    switch (mode) {
      case ThemeMode.DARK:
        return 'DARK-BLACK';
      case ThemeMode.LIGHT:
        return 'LIGHT-WHITE';
      case ThemeMode.COLORFUL:
        return 'COLOURFUL-COLOURFUL';
      default:
        return 'CUSTOM-THEME';
    }
  };

  const getThemeColorClass = (mode: ThemeMode) => {
    switch (mode) {
      case ThemeMode.DARK:
        return 'bg-zinc-950 text-cyan-400 border-cyan-500/30';
      case ThemeMode.LIGHT:
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case ThemeMode.COLORFUL:
        return 'bg-pink-500/20 text-pink-300 border-pink-500/30 animate-pulse';
      default:
        return 'bg-indigo-950 text-indigo-400 border-indigo-500/30';
    }
  };

  const getBatteryIcon = (level: number) => {
    if (level >= 0.8) return 'fa-battery-full text-emerald-400';
    if (level >= 0.5) return 'fa-battery-three-quarters text-cyan-400';
    if (level >= 0.25) return 'fa-battery-half text-yellow-400';
    return 'fa-battery-quarter text-rose-500 animate-pulse';
  };

  const formattedTime = time.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: true 
  });

  const isLight = themeMode === ThemeMode.LIGHT;

  return (
    <div 
      className={`fixed top-0 left-0 right-0 h-9 z-[120] border-b flex items-center justify-between px-6 text-[10px] font-mono select-none backdrop-blur-md transition-all duration-300 ${
        isLight 
          ? 'bg-white/80 border-slate-200 text-slate-800' 
          : 'bg-black/70 border-white/10 text-white'
      }`}
    >
      {/* Left Segment: Branding and Notification Bell */}
      <div className="flex items-center gap-4">
        {/* OS logo/branding */}
        <div className="flex items-center gap-2 font-display font-black tracking-widest text-[9px]">
          <span className={`w-2 h-2 rounded-full animate-pulse ${
            isLight ? 'bg-blue-600' : themeMode === ThemeMode.COLORFUL ? 'bg-pink-500' : 'bg-cyan-400'
          }`} />
          <span className={themeMode === ThemeMode.COLORFUL ? 'text-pink-400' : isLight ? 'text-blue-600' : 'text-cyan-400'}>
            QUANTINUM-Q OS
          </span>
        </div>

        {/* Bell Alerts Button with unread count */}
        <button 
          onClick={onOpenNotifications}
          className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
            isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/5 text-white/70 hover:text-white'
          }`}
          title="Open alerts center (Ctrl+I)"
        >
          <i className="fas fa-bell text-xs"></i>
          <span className="text-[8px] font-bold tracking-wider uppercase hidden sm:inline">ALERTS</span>
          {unreadCount > 0 && (
            <span className={`flex items-center justify-center min-w-[12px] h-[12px] rounded-full px-0.5 text-[7px] font-black leading-none text-black ${
              isLight ? 'bg-blue-600 text-white' : themeMode === ThemeMode.COLORFUL ? 'bg-pink-400' : 'bg-cyan-400'
            }`}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Middle Segment: Clock */}
      <div className={`font-semibold tracking-[0.2em] tabular-nums ${
        isLight ? 'text-slate-800' : 'text-white'
      }`}>
        {formattedTime}
      </div>

      {/* Right Segment: Network, Battery, Theme Control */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Network status */}
        <div className="flex items-center gap-1.5" title={isOnline ? 'Network Core Connected' : 'Offline Mode'}>
          <i className={`fas ${isOnline ? 'fa-wifi text-emerald-400' : 'fa-wifi-slash text-rose-500 animate-pulse'} text-[11px]`}></i>
          <span className="text-[8px] tracking-wider font-bold uppercase hidden md:inline">
            {isOnline ? 'Grid Online' : 'Grid Offline'}
          </span>
        </div>

        {/* Battery Status Panel */}
        <div 
          className="flex items-center gap-2 border-l border-white/10 pl-4 sm:pl-6" 
          title={`Battery Level: ${Math.round(batteryLevel * 100)}% (${isCharging ? 'Charging' : 'Discharging'})`}
        >
          {isCharging && (
            <i className="fas fa-bolt text-yellow-400 animate-pulse text-[10px]" />
          )}
          <i className={`fas ${getBatteryIcon(batteryLevel)} text-sm`} />
          <span className="tabular-nums font-bold">
            {Math.round(batteryLevel * 100)}%
          </span>
        </div>

        {/* Theme mode controls with explicit active label */}
        <button 
          onClick={onToggleTheme}
          className={`flex items-center gap-2 border border-solid rounded-md px-2.5 py-1 text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer hover:scale-105 active:scale-95 ${getThemeColorClass(themeMode)}`}
          title="Switch theme mode (Alt+T)"
        >
          <i className={`fas ${
            themeMode === ThemeMode.DARK ? 'fa-moon' : 
            themeMode === ThemeMode.LIGHT ? 'fa-sun' : 
            'fa-palette'
          } text-[9px]`}></i>
          <span>{getThemeLabel(themeMode)}</span>
        </button>
      </div>
    </div>
  );
};
