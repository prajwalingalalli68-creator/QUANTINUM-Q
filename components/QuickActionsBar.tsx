import React, { useState, useEffect } from 'react';
import { ThemeMode } from '../types';

interface QuickActionsBarProps {
  themeMode: ThemeMode;
  dnd: boolean;
  onToggleDnd: () => void;
  readingMode: boolean;
  onToggleReadingMode: () => void;
  batterySaver: boolean;
  onToggleBatterySaver: () => void;
  systemMute: boolean;
  onToggleSystemMute: () => void;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  themeMode,
  dnd,
  onToggleDnd,
  readingMode,
  onToggleReadingMode,
  batterySaver,
  onToggleBatterySaver,
  systemMute,
  onToggleSystemMute
}) => {
  const isLight = themeMode === ThemeMode.LIGHT;
  const isColorful = themeMode === ThemeMode.COLORFUL;

  // Pomodoro state
  const WORK_TIME = 25 * 60;
  const BREAK_TIME = 5 * 60;
  
  const [pomodoroMode, setPomodoroMode] = useState<'idle' | 'work' | 'break'>('idle');
  const [pomodoroTime, setPomodoroTime] = useState<number>(WORK_TIME);
  const [isPomodoroRunning, setIsPomodoroRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPomodoroRunning && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime(prev => prev - 1);
      }, 1000);
    } else if (isPomodoroRunning && pomodoroTime === 0) {
      setIsPomodoroRunning(false);
      
      const isWork = pomodoroMode === 'work';
      const title = isWork ? 'Work Interval Complete' : 'Break Complete';
      const message = isWork ? 'Time for a short 5-minute break!' : 'Ready to focus again?';
      
      window.dispatchEvent(new CustomEvent('cosmic-notification', {
        detail: {
          title,
          message,
          type: isWork ? 'success' : 'info'
        }
      }));
      
      if (isWork) {
        setPomodoroMode('break');
        setPomodoroTime(BREAK_TIME);
      } else {
        setPomodoroMode('idle');
        setPomodoroTime(WORK_TIME);
      }
    }
    return () => clearInterval(interval);
  }, [isPomodoroRunning, pomodoroTime, pomodoroMode]);

  const togglePomodoro = () => {
    if (pomodoroMode === 'idle') {
      setPomodoroMode('work');
      setPomodoroTime(WORK_TIME);
      setIsPomodoroRunning(true);
    } else {
      setIsPomodoroRunning(!isPomodoroRunning);
    }
  };

  const skipPomodoro = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pomodoroMode === 'work') {
      setPomodoroMode('break');
      setPomodoroTime(BREAK_TIME);
      setIsPomodoroRunning(true);
    } else {
      setPomodoroMode('idle');
      setPomodoroTime(WORK_TIME);
      setIsPomodoroRunning(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getBtnClass = (active: boolean) => {
    if (active) {
      if (isLight) return 'bg-blue-600 text-white border-blue-600 shadow-sm';
      if (isColorful) return 'bg-pink-500 text-white border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.5)]';
      return 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]';
    } else {
      if (isLight) return 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200';
      if (isColorful) return 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10';
      return 'bg-zinc-900/50 hover:bg-zinc-800/80 text-white/70 border-white/5';
    }
  };

  const getIndicatorClass = (active: boolean) => {
    if (active) {
      return isLight ? 'bg-blue-300' : isColorful ? 'bg-pink-300 animate-pulse' : 'bg-cyan-300 animate-pulse';
    }
    return 'bg-gray-500/30';
  };

  return (
    <div 
      className={`fixed top-9 left-0 right-0 h-8 z-[110] border-b flex items-center px-6 select-none overflow-x-auto scrollbar-none transition-all duration-300 ${
        isLight 
          ? 'bg-slate-50/90 border-slate-200 text-slate-800' 
          : 'bg-black/80 border-white/5 text-white'
      }`}
      style={{ scrollbarWidth: 'none' }}
    >
      <div className="flex items-center gap-2 text-[9px] font-mono tracking-widest uppercase opacity-40 shrink-0 mr-4 border-r pr-4 border-solid border-current/10">
        <i className="fas fa-sliders text-[10px]"></i>
        <span>QUICK MODES</span>
      </div>

      <div className="flex items-center gap-2.5 overflow-x-auto py-1 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
        {/* Do Not Disturb Toggle */}
        <button
          onClick={onToggleDnd}
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-mono border border-solid transition-all duration-300 active:scale-95 cursor-pointer shrink-0 ${getBtnClass(dnd)}`}
          title="Do Not Disturb: Suppress incoming notification alerts"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${getIndicatorClass(dnd)}`} />
          <i className="fas fa-moon text-[9px]"></i>
          <span className="font-bold tracking-wider">DO NOT DISTURB</span>
          {dnd && <span className="text-[7px] font-bold opacity-60">(MUTED)</span>}
        </button>

        {/* Reading Mode Toggle */}
        <button
          onClick={onToggleReadingMode}
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-mono border border-solid transition-all duration-300 active:scale-95 cursor-pointer shrink-0 ${getBtnClass(readingMode)}`}
          title="Reading Mode: Apply warmer tones and focus layout"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${getIndicatorClass(readingMode)}`} />
          <i className="fas fa-book-open text-[9px]"></i>
          <span className="font-bold tracking-wider">READING MODE</span>
          {readingMode && <span className="text-[7px] font-bold opacity-60">(WARM)</span>}
        </button>

        {/* Battery Saver Toggle */}
        <button
          onClick={onToggleBatterySaver}
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-mono border border-solid transition-all duration-300 active:scale-95 cursor-pointer shrink-0 ${getBtnClass(batterySaver)}`}
          title="Battery Saver: Stop background dynamic canvas animation"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${getIndicatorClass(batterySaver)}`} />
          <i className="fas fa-leaf text-[9px]"></i>
          <span className="font-bold tracking-wider">BATTERY SAVER</span>
          {batterySaver && <span className="text-[7px] font-bold opacity-60">(ECO)</span>}
        </button>

        {/* Pomodoro Timer Toggle */}
        <div className={`flex items-center rounded-full text-[9px] font-mono border border-solid transition-all duration-300 shrink-0 overflow-hidden ${
          pomodoroMode !== 'idle' 
            ? isLight 
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
              : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
            : isLight 
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
              : 'bg-zinc-900/50 hover:bg-zinc-800/80 text-white/70 border-white/5'
        }`}>
          <button
            onClick={togglePomodoro}
            className="flex items-center gap-2 px-3 py-1 cursor-pointer active:scale-95"
            title="Pomodoro Timer: Toggle focused work (25m) and break (5m)"
          >
            {pomodoroMode !== 'idle' && (
              <span className={`w-1.5 h-1.5 rounded-full ${isPomodoroRunning ? 'bg-rose-400 animate-pulse' : 'bg-gray-400'}`} />
            )}
            {pomodoroMode === 'idle' ? (
              <i className="fas fa-stopwatch text-[9px]"></i>
            ) : pomodoroMode === 'work' ? (
              <i className="fas fa-brain text-[9px]"></i>
            ) : (
              <i className="fas fa-mug-hot text-[9px]"></i>
            )}
            <span className="font-bold tracking-wider">
              {pomodoroMode === 'idle' ? 'POMODORO' : `${pomodoroMode === 'work' ? 'WORK' : 'BREAK'} ${formatTime(pomodoroTime)}`}
            </span>
          </button>

          {pomodoroMode !== 'idle' && (
            <button
              onClick={skipPomodoro}
              className={`px-2 py-1 cursor-pointer border-l ${
                isLight ? 'border-rose-500/30 hover:bg-rose-700' : 'border-rose-500/30 hover:bg-rose-500/30'
              }`}
              title="Skip to next phase"
            >
              <i className="fas fa-forward-step text-[8px]"></i>
            </button>
          )}
        </div>

        {/* System Mute Toggle */}
        <button
          onClick={onToggleSystemMute}
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-mono border border-solid transition-all duration-300 active:scale-95 cursor-pointer shrink-0 ${getBtnClass(systemMute)}`}
          title="System Sound Mute"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${getIndicatorClass(systemMute)}`} />
          <i className={`fas ${systemMute ? 'fa-volume-mute' : 'fa-volume-up'} text-[9px]`}></i>
          <span className="font-bold tracking-wider">SYSTEM MUTE</span>
          {systemMute && <span className="text-[7px] font-bold opacity-60">(SILENT)</span>}
        </button>
      </div>

      <div className="ml-auto flex items-center gap-2 text-[8px] font-mono opacity-30 shrink-0 hidden md:flex">
        <span>ACTIVE PROFILE: {dnd ? 'SILENT' : readingMode ? 'COZY' : 'STANDARD'}</span>
      </div>
    </div>
  );
};
