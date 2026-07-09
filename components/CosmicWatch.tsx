import React, { useState, useEffect, useRef } from 'react';
import { ThemeMode } from '../types';

export interface Alarm {
  id: string;
  hour: number;
  minute: number;
  label: string;
  active: boolean;
  repeat: 'once' | 'daily' | 'weekdays';
  snoozedCount?: number;
}

interface CosmicWatchProps {
  themeMode?: ThemeMode;
}

export const CosmicWatch: React.FC<CosmicWatchProps> = ({ themeMode = ThemeMode.DARK }) => {
  const [time, setTime] = useState(new Date());
  const [alarms, setAlarms] = useState<Alarm[]>(() => {
    try {
      const saved = localStorage.getItem('quantinum_alarms');
      return saved ? JSON.parse(saved) : [
        { id: 'alarm-1', hour: 7, minute: 30, label: 'Morning Sync', active: true, repeat: 'daily' },
        { id: 'alarm-2', hour: 12, minute: 0, label: 'Mid-day Diagnostics', active: false, repeat: 'once' }
      ];
    } catch {
      return [];
    }
  });

  const [newHour, setNewHour] = useState(8);
  const [newMinute, setNewMinute] = useState(0);
  const [newLabel, setNewLabel] = useState('');
  const [newRepeat, setNewRepeat] = useState<'once' | 'daily' | 'weekdays'>('once');
  const [showAddForm, setShowAddForm] = useState(false);

  // Active sounding alarm
  const [ringingAlarm, setRingingAlarm] = useState<Alarm | null>(null);
  const audioIntervalRef = useRef<any>(null);

  const isLight = themeMode === ThemeMode.LIGHT;

  // Persist alarms
  useEffect(() => {
    localStorage.setItem('quantinum_alarms', JSON.stringify(alarms));
  }, [alarms]);

  // Clock tick & Alarm matching
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);

      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentSeconds = now.getSeconds();

      // Check alarms only at the beginning of a minute (second === 0)
      if (currentSeconds === 0) {
        const day = now.getDay(); // 0 = Sunday, 6 = Saturday
        const isWeekday = day >= 1 && day <= 5;

        const triggered = alarms.find(alarm => {
          if (!alarm.active) return false;
          if (alarm.hour !== currentHour || alarm.minute !== currentMinute) return false;

          if (alarm.repeat === 'weekdays' && !isWeekday) return false;
          return true;
        });

        if (triggered && !ringingAlarm) {
          triggerAlarm(triggered);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [alarms, ringingAlarm]);

  // Synthesis Beep Generator
  const playAlarmSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note

      // Beep patterns
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn('AudioContext beep blocked or unsupported', e);
    }
  };

  const triggerAlarm = (alarm: Alarm) => {
    setRingingAlarm(alarm);
    
    // Dispatch system notification
    window.dispatchEvent(new CustomEvent('cosmic-notification', {
      detail: {
        title: `Alarm Triggered!`,
        message: `${alarm.label || 'Alarm alert'} (${alarm.hour.toString().padStart(2, '0')}:${alarm.minute.toString().padStart(2, '0')})`,
        type: 'warning'
      }
    }));

    window.dispatchEvent(new CustomEvent('cosmic-health-api-call', {
      detail: { api: 'AlarmSystem.trigger', status: 'Warning' }
    }));

    // Repeat beep sequence
    playAlarmSound();
    audioIntervalRef.current = setInterval(() => {
      playAlarmSound();
    }, 1200);
  };

  const stopRinging = () => {
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    setRingingAlarm(null);
  };

  const dismissAlarm = () => {
    if (!ringingAlarm) return;
    
    // If repeat is 'once', deactivate it
    if (ringingAlarm.repeat === 'once') {
      setAlarms(prev => prev.map(a => a.id === ringingAlarm.id ? { ...a, active: false } : a));
    }

    window.dispatchEvent(new CustomEvent('cosmic-notification', {
      detail: {
        title: 'Alarm Dismissed',
        message: `Ringing alarm "${ringingAlarm.label || 'Alarm'}" dismissed successfully.`,
        type: 'info'
      }
    }));

    stopRinging();
  };

  const snoozeAlarm = () => {
    if (!ringingAlarm) return;

    // Calculate snooze target (5 minutes from now)
    const now = new Date();
    const snoozeTime = new Date(now.getTime() + 5 * 60 * 1000);

    const snoozedAlarm: Alarm = {
      id: `snooze-${Date.now()}`,
      hour: snoozeTime.getHours(),
      minute: snoozeTime.getMinutes(),
      label: `Snooze: ${ringingAlarm.label || 'Alarm'}`,
      active: true,
      repeat: 'once',
      snoozedCount: (ringingAlarm.snoozedCount || 0) + 1
    };

    setAlarms(prev => [...prev, snoozedAlarm]);
    
    window.dispatchEvent(new CustomEvent('cosmic-notification', {
      detail: {
        title: 'Alarm Snoozed',
        message: `Snoozing "${ringingAlarm.label || 'Alarm'}" for 5 minutes.`,
        type: 'info'
      }
    }));

    stopRinging();
  };

  const handleAddAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    const alarm: Alarm = {
      id: `alarm-${Date.now()}`,
      hour: newHour,
      minute: newMinute,
      label: newLabel.trim() || 'Untitled Alarm',
      active: true,
      repeat: newRepeat
    };

    setAlarms(prev => [...prev, alarm]);
    setNewLabel('');
    setShowAddForm(false);

    window.dispatchEvent(new CustomEvent('cosmic-notification', {
      detail: {
        title: 'Alarm Registered',
        message: `Created alarm "${alarm.label}" set for ${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`,
        type: 'success'
      }
    }));
  };

  const toggleAlarmActive = (id: string) => {
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  const deleteAlarm = (id: string) => {
    setAlarms(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden select-none p-6 ${
      isLight ? 'bg-slate-50 text-slate-800' : 'bg-transparent text-white'
    }`}>
      {/* Top Banner Header */}
      <div className="flex items-center justify-between border-b border-solid border-current/10 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-solid border-cyan-500/20 text-cyan-400">
            <i className="fas fa-clock text-lg animate-pulse"></i>
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] font-sans">Alarms & Watch</h3>
            <p className="text-[9px] font-mono opacity-50 uppercase tracking-widest mt-0.5">Linked to system telemetry sync clock</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer border border-solid ${
            isLight 
              ? 'bg-blue-600 border-blue-700 text-white hover:bg-blue-700' 
              : 'bg-cyan-500/10 border-cyan-400/30 text-cyan-400 hover:bg-cyan-500/20'
          }`}
        >
          <i className="fas fa-plus mr-1.5"></i>
          Add Alarm
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* Left Side: System Clock & Sound Indicator */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative p-6 border border-solid border-current/5 rounded-3xl bg-current/[0.01] backdrop-blur-md">
          <div className="text-center">
            <div className="text-xs font-mono tracking-[0.3em] uppercase opacity-40 mb-3">CURRENT SYSTEM TIME</div>
            <div className="text-5xl md:text-6xl font-black font-mono tracking-tight leading-none drop-shadow-[0_0_20px_rgba(255,255,255,0.05)]">
              {time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-xs font-mono tracking-[0.15em] uppercase font-bold text-cyan-400 mt-3 flex items-center justify-center gap-2 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
              <i className="fa-solid fa-earth-americas text-cyan-400 animate-spin-slow"></i>
              <span>{new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(time)}</span>
            </div>
          </div>

          {/* Glowing visualization dial */}
          <div className="relative mt-8 w-44 h-44 rounded-full border border-dashed border-current/10 flex items-center justify-center">
            <div className="absolute inset-4 rounded-full border border-solid border-cyan-500/10 animate-spin-slow"></div>
            <div className="absolute inset-8 rounded-full border border-dashed border-cyan-500/20"></div>
            <div className="text-center font-mono text-[9px] uppercase tracking-widest opacity-30">
              {alarms.filter(a => a.active).length} active alarms
            </div>
          </div>
        </div>

        {/* Right Side: Alarms List & Add Form */}
        <div className="lg:col-span-7 flex flex-col min-h-0">
          {showAddForm ? (
            <form onSubmit={handleAddAlarm} className={`border border-solid p-6 rounded-3xl space-y-4 animate-fade-in ${
              isLight ? 'bg-white border-slate-200' : 'bg-black/40 border-white/5'
            }`}>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-2 text-cyan-500 flex items-center gap-2">
                <i className="fas fa-plus"></i> Configure New Alarm Sector
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] font-mono tracking-widest uppercase opacity-50 mb-1.5">HOUR (0-23)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="23" 
                    value={newHour} 
                    onChange={(e) => setNewHour(parseInt(e.target.value) || 0)}
                    className={`w-full font-mono text-center py-2 rounded-xl border border-solid text-xs ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-mono tracking-widest uppercase opacity-50 mb-1.5">MINUTE (0-59)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="59" 
                    value={newMinute} 
                    onChange={(e) => setNewMinute(parseInt(e.target.value) || 0)}
                    className={`w-full font-mono text-center py-2 rounded-xl border border-solid text-xs ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[8px] font-mono tracking-widest uppercase opacity-50 mb-1.5">ALARM SECTOR LABEL</label>
                <input 
                  type="text" 
                  placeholder="e.g. Sync Session"
                  value={newLabel} 
                  onChange={(e) => setNewLabel(e.target.value)}
                  className={`w-full font-sans px-4 py-2 rounded-xl border border-solid text-xs ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white/5 border-white/10 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[8px] font-mono tracking-widest uppercase opacity-50 mb-1.5">TEMPORAL REPEAT Blueprints</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['once', 'daily', 'weekdays'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setNewRepeat(mode)}
                      className={`py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase border border-solid transition-all cursor-pointer ${
                        newRepeat === mode 
                          ? (isLight ? 'bg-blue-600 text-white border-blue-600' : 'bg-cyan-500 text-black border-cyan-400')
                          : (isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200' : 'bg-white/5 hover:bg-white/10 text-white/50 border-white/5')
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-mono uppercase tracking-wider cursor-pointer border border-solid ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600' : 'bg-white/5 hover:bg-white/10 text-white/60 border-white/5'
                  }`}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`px-4 py-2 rounded-xl text-[10px] font-mono uppercase tracking-wider font-bold cursor-pointer border border-solid ${
                    isLight ? 'bg-blue-600 border-blue-700 text-white' : 'bg-cyan-500 border-cyan-400 text-slate-950'
                  }`}
                >
                  Save Alarm
                </button>
              </div>
            </form>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <h4 className="text-[10px] font-black uppercase tracking-[0.25em] mb-3 opacity-50 font-mono">SCHEDULED SYSTEM TELEMETRY ALARMS</h4>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                {alarms.length > 0 ? (
                  alarms.map(alarm => (
                    <div 
                      key={alarm.id}
                      className={`border border-solid p-4 rounded-2xl flex items-center justify-between transition-all group ${
                        alarm.active 
                          ? (isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/[0.02] border-cyan-500/20')
                          : (isLight ? 'bg-slate-100/50 border-slate-200 opacity-60' : 'bg-black/20 border-white/5 opacity-40')
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-mono border border-solid shrink-0 ${
                          alarm.active 
                            ? (isLight ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-cyan-500/10 border-cyan-400/30 text-cyan-400')
                            : (isLight ? 'bg-slate-200/50 border-slate-200 text-slate-500' : 'bg-white/5 border-white/5 text-white/30')
                        }`}>
                          <span className="text-sm font-black leading-none">{alarm.hour.toString().padStart(2, '0')}</span>
                          <span className="text-[8px] font-bold leading-none mt-0.5">{alarm.minute.toString().padStart(2, '0')}</span>
                        </div>
                        <div className="min-w-0">
                          <div className={`text-xs font-bold font-sans truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>
                            {alarm.label}
                          </div>
                          <div className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-wider opacity-50 mt-1">
                            <i className="fa-solid fa-redo text-[7px]"></i>
                            <span>{alarm.repeat}</span>
                            {alarm.snoozedCount && alarm.snoozedCount > 0 && (
                              <span className="text-amber-500 font-bold">({alarm.snoozedCount}x Snoozed)</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Active Switch */}
                        <button
                          onClick={() => toggleAlarmActive(alarm.id)}
                          className={`w-10 h-6 rounded-full relative transition-all border border-solid duration-300 cursor-pointer ${
                            alarm.active 
                              ? (isLight ? 'bg-blue-600 border-blue-600' : 'bg-cyan-500 border-cyan-400') 
                              : (isLight ? 'bg-slate-300 border-slate-300' : 'bg-zinc-800 border-zinc-700')
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all duration-300 shadow-md ${
                            alarm.active ? 'left-[18px]' : 'left-0.5'
                          }`} />
                        </button>

                        {/* Delete Button */}
                        <button 
                          onClick={() => deleteAlarm(alarm.id)}
                          className={`p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                            isLight ? 'text-slate-400 hover:bg-slate-100 hover:text-red-500' : 'text-white/20 hover:bg-white/5 hover:text-red-400'
                          }`}
                          title="Purge Alarm Configuration"
                        >
                          <i className="fas fa-trash text-[10px]"></i>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-10 opacity-30 border border-dashed border-current/10 rounded-2xl">
                    <i className="fa-regular fa-bell-slash text-2xl mb-2"></i>
                    <span className="text-[10px] font-mono uppercase tracking-widest">No Active Telemetry Alarms</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ringing / Warning overlay */}
      {ringingAlarm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-lg z-[210] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-solid border-rose-500/30 rounded-3xl p-8 text-center relative overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.2)] animate-pulse">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-amber-500"></div>
            
            <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-solid border-rose-500/30 flex items-center justify-center mx-auto mb-6 text-rose-500 animate-bounce">
              <i className="fas fa-bell text-3xl"></i>
            </div>

            <h3 className="text-rose-500 text-xs font-mono font-black tracking-[0.3em] uppercase mb-1">SYSTEM ALERT INTERRUPT</h3>
            <h2 className="text-white text-3xl font-black font-sans tracking-wide leading-tight mb-2 truncate">
              {ringingAlarm.label}
            </h2>
            <div className="text-white/60 font-mono text-lg tracking-widest font-black uppercase mb-6">
              At {ringingAlarm.hour.toString().padStart(2, '0')}:{ringingAlarm.minute.toString().padStart(2, '0')}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={snoozeAlarm}
                className="w-full py-3.5 rounded-xl text-xs font-mono font-bold uppercase tracking-widest bg-zinc-900 border border-solid border-white/10 hover:bg-zinc-800 text-white transition-all cursor-pointer active:scale-95"
              >
                Snooze (5m)
              </button>
              <button
                onClick={dismissAlarm}
                className="w-full py-3.5 rounded-xl text-xs font-mono font-bold uppercase tracking-widest bg-rose-600 border border-solid border-rose-700 text-white hover:bg-rose-700 transition-all cursor-pointer active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
