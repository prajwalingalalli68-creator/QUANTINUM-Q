import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppState, ThemeMode } from '../types';

export interface AppRegistryItem {
  state: AppState;
  label: string;
  icon: string;
  color: string;
  baseMemory: number; // in MB
}

export const APP_REGISTRY: AppRegistryItem[] = [
  { state: 'COSMIC_LINK', label: 'Cosmic Oracle', icon: 'fa-eye', color: 'text-violet-400', baseMemory: 180 },
  { state: 'IMAGE_GEN', label: 'Cosmic Image', icon: 'fa-wand-magic-sparkles', color: 'text-pink-400', baseMemory: 320 },
  { state: 'BANNER_GEN', label: 'Cosmic Banner', icon: 'fa-panorama', color: 'text-orange-400', baseMemory: 110 },
  { state: 'COSMIC_CERTIFICATE', label: 'Certificate Suite', icon: 'fa-certificate', color: 'text-amber-400', baseMemory: 85 },
  { state: 'COUNTRY_INTEL', label: 'Country Informer', icon: 'fa-earth-asia', color: 'text-emerald-400', baseMemory: 95 },
  { state: 'PYTHON', label: 'Cosmic Python', icon: 'fa-brands fa-python', color: 'text-blue-400', baseMemory: 240 },
  { state: 'CHAT', label: 'Cosmic Editor', icon: 'fa-pen-nib', color: 'text-slate-400', baseMemory: 75 },
  { state: 'COSMIC_EXCEL', label: 'Cosmic Excel', icon: 'fa-table', color: 'text-emerald-500', baseMemory: 145 },
  { state: 'COSMIC_WORD', label: 'Cosmic Word', icon: 'fa-file-word', color: 'text-blue-500', baseMemory: 130 },
  { state: 'COSMIC_POWER_POINT', label: 'Power Point', icon: 'fa-presentation-screen', color: 'text-orange-500', baseMemory: 160 },
  { state: 'GAMES', label: 'Game Zone', icon: 'fa-gamepad', color: 'text-purple-400', baseMemory: 410 },
  { state: 'PROJECT_MAKER', label: 'Project Maker', icon: 'fa-rocket', color: 'text-teal-400', baseMemory: 125 },
  { state: 'VIDEO_GEN', label: 'Cosmic Video', icon: 'fa-video', color: 'text-red-400', baseMemory: 380 },
  { state: 'DICTIONARY', label: 'Oxford Lexicon', icon: 'fa-book', color: 'text-indigo-400', baseMemory: 65 },
  { state: 'TRANSLATOR', label: 'Translator', icon: 'fa-language', color: 'text-cyan-400', baseMemory: 70 },
  { state: 'QUESTION_PAPER', label: 'Exam Prep', icon: 'fa-graduation-cap', color: 'text-amber-500', baseMemory: 115 },
  { state: 'HISTORY', label: 'History', icon: 'fa-timeline', color: 'text-slate-400', baseMemory: 50 },
  { state: 'THEMES', label: 'Theme Settings', icon: 'fa-palette', color: 'text-pink-500', baseMemory: 60 },
  { state: 'PERFORMANCE', label: 'Performance', icon: 'fa-chart-pie', color: 'text-green-400', baseMemory: 80 },
  { state: 'COSMIC_WATCH', label: 'Alarms & Watch', icon: 'fa-clock', color: 'text-rose-400', baseMemory: 55 },
];

interface DockAndTaskManagerProps {
  themeMode: ThemeMode;
  appState: AppState;
  onNavigate: (state: AppState) => void;
  onNavigateHome: () => void;
  runningApps: AppState[];
  onTerminateApp: (state: AppState) => void;
  appFrequencies: Record<string, number>;
}

export const DockAndTaskManager: React.FC<DockAndTaskManagerProps> = ({
  themeMode,
  appState,
  onNavigate,
  onNavigateHome,
  runningApps,
  onTerminateApp,
  appFrequencies,
}) => {
  const [showTaskManager, setShowTaskManager] = useState(false);
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);
  
  // Dynamic process measurements
  const [processMetrics, setProcessMetrics] = useState<Record<string, { ram: number; cpu: number }>>({});

  useEffect(() => {
    // Generate organic dynamic variations for RAM & CPU
    const interval = setInterval(() => {
      setProcessMetrics(prev => {
        const next: Record<string, { ram: number; cpu: number }> = {};
        runningApps.forEach(state => {
          const registryItem = APP_REGISTRY.find(item => item.state === state);
          const baseMem = registryItem ? registryItem.baseMemory : 100;
          
          // Slight fluctuation
          const prevMetrics = prev[state] || { ram: baseMem, cpu: 1.2 };
          const ramDelta = (Math.random() * 4 - 2); // +/- 2MB
          const nextRam = Math.max(baseMem * 0.8, Math.min(baseMem * 1.5, prevMetrics.ram + ramDelta));
          
          const targetCpu = state === appState ? 5.5 + Math.random() * 8 : 0.2 + Math.random() * 1.5;
          const nextCpu = prevMetrics.cpu * 0.7 + targetCpu * 0.3; // smooth transition

          next[state] = {
            ram: Number(nextRam.toFixed(1)),
            cpu: Number(nextCpu.toFixed(1))
          };
        });
        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [runningApps, appState]);

  const isLight = themeMode === ThemeMode.LIGHT;
  const isColourful = themeMode === ThemeMode.COLORFUL;

  // Determine frequently used apps based on interaction counts
  const getFrequentlyUsedApps = (): AppRegistryItem[] => {
    const sortedByFreq = [...APP_REGISTRY]
      .filter(app => (appFrequencies[app.state] || 0) > 0)
      .sort((a, b) => (appFrequencies[b.state] || 0) - (appFrequencies[a.state] || 0));

    if (sortedByFreq.length >= 4) {
      return sortedByFreq.slice(0, 5);
    }

    // Default seed apps to keep it fully functional and aesthetically populated
    const defaultApps = ['CHAT', 'COSMIC_WORD', 'PYTHON', 'GAMES', 'COSMIC_WATCH'];
    const seeded = [...sortedByFreq];
    
    defaultApps.forEach(stateStr => {
      if (!seeded.some(app => app.state === stateStr)) {
        const found = APP_REGISTRY.find(app => app.state === stateStr);
        if (found) seeded.push(found);
      }
    });

    return seeded.slice(0, 5);
  };

  const freqApps = getFrequentlyUsedApps();

  // Find running apps that are NOT in the frequently used list to display dynamically on the right
  const otherRunningApps = APP_REGISTRY.filter(
    app => runningApps.includes(app.state) && !freqApps.some(freq => freq.state === app.state)
  );

  // Compute total dynamic usage
  const baseSystemRam = 1.2 * 1024; // 1.2 GB base
  const totalAppsRam = (Object.values(processMetrics) as { ram: number; cpu: number }[]).reduce((sum, item) => sum + item.ram, 0);
  const totalRamUsedGB = ((baseSystemRam + totalAppsRam) / 1024).toFixed(2);
  const totalRamPercent = Math.min(98, Number((((baseSystemRam + totalAppsRam) / 16384) * 100).toFixed(1)));

  const baseSystemCpu = 3.5;
  const totalAppsCpu = (Object.values(processMetrics) as { ram: number; cpu: number }[]).reduce((sum, item) => sum + item.cpu, 0);
  const totalCpuPercent = Math.min(100, Number((baseSystemCpu + totalAppsCpu).toFixed(1)));

  // If Lock Screen is active, don't render dock
  if (appState === 'LOCK') return null;

  return (
    <>
      {/* Floating Dock Navigation */}
      <div 
        id="dock-navigation-container"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] px-4 pointer-events-none select-none max-w-full"
      >
        <div 
          className={`pointer-events-auto flex items-center gap-2 md:gap-3.5 px-4.5 py-2 rounded-2xl border transition-all duration-300 shadow-2xl relative ${
            isLight 
              ? 'bg-white/80 border-slate-200 text-slate-800 shadow-slate-300/40 backdrop-blur-xl' 
              : isColourful
                ? 'bg-gradient-to-r from-fuchsia-950/70 via-purple-950/70 to-indigo-950/70 border-pink-500/20 text-white shadow-fuchsia-500/10 backdrop-blur-2xl'
                : 'bg-zinc-950/80 border-white/10 text-white shadow-black/80 backdrop-blur-xl'
          }`}
        >
          {/* Dock Gloss Overlay */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

          {/* Home Button */}
          <div className="relative group">
            <button
              id="dock-btn-home"
              onClick={onNavigateHome}
              onMouseEnter={() => setHoveredApp('HOME')}
              onMouseLeave={() => setHoveredApp(null)}
              className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex flex-col items-center justify-center transition-all duration-200 hover:-translate-y-2.5 cursor-pointer hover:shadow-lg ${
                appState === 'HOME'
                  ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-400'
                  : 'bg-white/5 hover:bg-white/10 border border-transparent'
              }`}
            >
              <i className="fa-solid fa-house text-lg"></i>
              {/* Dot Indicators */}
              <div className="flex gap-0.5 mt-0.5">
                <div className={`w-1 h-1 rounded-full ${appState === 'HOME' ? 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]' : 'bg-transparent'}`} />
              </div>
            </button>
            
            {/* Tooltip */}
            <AnimatePresence>
              {hoveredApp === 'HOME' && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: -4, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className={`absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase font-mono shadow-xl border whitespace-nowrap z-[110] ${
                    isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-zinc-950 border-white/10 text-white'
                  }`}
                >
                  Workspace Hub
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className={`w-[1px] h-8 self-center ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />

          {/* Frequently Used Apps Section */}
          <div className="flex items-center gap-2">
            {freqApps.map((app) => {
              const isActive = appState === app.state;
              const isRunning = runningApps.includes(app.state);
              return (
                <div key={app.state} className="relative group">
                  <button
                    id={`dock-btn-freq-${app.state}`}
                    onClick={() => onNavigate(app.state)}
                    onMouseEnter={() => setHoveredApp(app.state)}
                    onMouseLeave={() => setHoveredApp(null)}
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex flex-col items-center justify-center transition-all duration-200 hover:-translate-y-2.5 cursor-pointer hover:shadow-lg relative overflow-hidden ${
                      isActive
                        ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-400 shadow-md shadow-cyan-500/10'
                        : isRunning
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-white hover:bg-emerald-500/20'
                          : 'bg-white/5 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <i className={`fas ${app.icon} text-lg ${isActive ? 'text-cyan-400' : app.color}`}></i>
                    
                    {/* Running/Active Dot Indicators */}
                    <div className="flex gap-0.5 mt-0.5">
                      {isActive ? (
                        <div className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
                      ) : isRunning ? (
                        <div className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                      ) : null}
                    </div>
                  </button>

                  {/* Tooltip */}
                  <AnimatePresence>
                    {hoveredApp === app.state && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: -4, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className={`absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase font-mono shadow-xl border whitespace-nowrap z-[110] ${
                          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-zinc-950 border-white/10 text-white'
                        }`}
                      >
                        {app.label} {isRunning && <span className="text-emerald-400 text-[8px] ml-1">(Running)</span>}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Dynamic other running apps if any */}
          {otherRunningApps.length > 0 && (
            <>
              <div className={`w-[1px] h-5 self-center ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />
              <div className="flex items-center gap-2">
                {otherRunningApps.map((app) => {
                  const isActive = appState === app.state;
                  return (
                    <div key={app.state} className="relative group">
                      <button
                        id={`dock-btn-run-${app.state}`}
                        onClick={() => onNavigate(app.state)}
                        onMouseEnter={() => setHoveredApp(app.state)}
                        onMouseLeave={() => setHoveredApp(null)}
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex flex-col items-center justify-center transition-all duration-200 hover:-translate-y-2.5 cursor-pointer hover:shadow-lg ${
                          isActive
                            ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-400 shadow-md shadow-cyan-500/10'
                            : 'bg-emerald-500/10 border border-emerald-500/20 text-white hover:bg-emerald-500/20'
                        }`}
                      >
                        <i className={`fas ${app.icon} text-lg ${isActive ? 'text-cyan-400' : app.color}`}></i>
                        
                        <div className="flex gap-0.5 mt-0.5">
                          <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]' : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'}`} />
                        </div>
                      </button>

                      {/* Tooltip */}
                      <AnimatePresence>
                        {hoveredApp === app.state && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: -4, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            className={`absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase font-mono shadow-xl border whitespace-nowrap z-[110] ${
                              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-zinc-950 border-white/10 text-white'
                            }`}
                          >
                            {app.label} <span className="text-emerald-400 text-[8px] ml-1">(Active Process)</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className={`w-[1px] h-8 self-center ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />

          {/* Task Manager Button */}
          <div className="relative group">
            <button
              id="dock-btn-taskmgr"
              onClick={() => setShowTaskManager(!showTaskManager)}
              onMouseEnter={() => setHoveredApp('TASK_MANAGER')}
              onMouseLeave={() => setHoveredApp(null)}
              className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:-translate-y-2.5 cursor-pointer hover:shadow-lg ${
                showTaskManager
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                  : 'bg-white/5 hover:bg-white/10 border border-transparent text-white/85'
              }`}
            >
              <i className="fa-solid fa-list-check text-lg"></i>
            </button>

            {/* Tooltip */}
            <AnimatePresence>
              {hoveredApp === 'TASK_MANAGER' && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: -4, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className={`absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase font-mono shadow-xl border whitespace-nowrap z-[110] ${
                    isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-zinc-950 border-white/10 text-white'
                  }`}
                >
                  Task Manager
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Task Manager Modal Overlay */}
      <AnimatePresence>
        {showTaskManager && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTaskManager(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />

            {/* Task Manager Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`w-full max-w-2xl rounded-3xl border shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-800'
                  : isColourful
                    ? 'bg-gradient-to-br from-indigo-950/95 via-slate-950/95 to-purple-950/95 border-fuchsia-500/20 text-white shadow-fuchsia-500/10'
                    : 'bg-zinc-950 border-white/10 text-white shadow-black/90'
              }`}
            >
              {/* Premium Glow Bar */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-rose-500" />

              {/* Title & Stats Header */}
              <div className={`p-6 border-b shrink-0 flex items-center justify-between ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.25em] text-cyan-400 flex items-center gap-2">
                    <i className="fa-solid fa-gauge-high animate-spin-slow"></i>
                    QUANTINUM-Q TASK MANAGER
                  </h3>
                  <p className="text-[9px] font-mono uppercase tracking-[0.15em] opacity-60 mt-0.5">
                    Real-time container memory & process allocation
                  </p>
                </div>
                <button
                  onClick={() => setShowTaskManager(false)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/10 text-white/70'
                  }`}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              {/* Dynamic OS Performance Dashboard Block */}
              <div className={`p-4 mx-6 mt-4 rounded-2xl border flex flex-col md:flex-row gap-4 shrink-0 font-mono ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
              }`}>
                {/* CPU Thread Utilization */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold flex items-center gap-1.5 font-sans uppercase tracking-wider text-cyan-400">
                      <i className="fa-solid fa-microchip"></i> CPU Usage
                    </span>
                    <span className="text-cyan-400 font-bold">{totalCpuPercent}%</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                    <div 
                      className="h-full rounded-full bg-cyan-400 transition-all duration-500" 
                      style={{ width: `${totalCpuPercent}%` }}
                    />
                  </div>
                </div>

                {/* System RAM Heap Allocation */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold flex items-center gap-1.5 font-sans uppercase tracking-wider text-indigo-400">
                      <i className="fa-solid fa-memory"></i> Memory Used
                    </span>
                    <span className="text-indigo-300 font-bold">{totalRamUsedGB} / 16.00 GB ({totalRamPercent}%)</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                    <div 
                      className="h-full rounded-full bg-indigo-500 transition-all duration-500" 
                      style={{ width: `${totalRamPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Process Listing Section */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                <div className="text-[10px] font-mono tracking-widest opacity-40 uppercase pb-1 flex justify-between border-b border-white/5">
                  <span>Active Process / Workspace</span>
                  <div className="flex gap-16 pr-4">
                    <span>RAM / CPU</span>
                    <span>Action</span>
                  </div>
                </div>

                {runningApps.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center opacity-65">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-dashed border-white/10 flex items-center justify-center mb-4 text-white/40">
                      <i className="fa-solid fa-cubes text-xl"></i>
                    </div>
                    <p className="font-mono text-xs tracking-wider uppercase text-cyan-400/80 mb-1">NO BACKGROUND WORKSPACES ACTIVE</p>
                    <p className="font-sans text-[11px] opacity-70">Apps opened through the Dock or launcher will run background states here.</p>
                  </div>
                ) : (
                  runningApps.map((state) => {
                    const registryItem = APP_REGISTRY.find(item => item.state === state);
                    const metrics = processMetrics[state] || { ram: registryItem ? registryItem.baseMemory : 100, cpu: 0.5 };
                    const isActive = appState === state;

                    if (!registryItem) return null;

                    return (
                      <div 
                        key={state}
                        className={`p-3.5 rounded-xl border flex items-center justify-between transition-all font-mono ${
                          isActive 
                            ? isLight
                              ? 'bg-cyan-50/50 border-cyan-200 shadow-sm'
                              : 'bg-cyan-950/20 border-cyan-500/30'
                            : isLight
                              ? 'bg-white border-slate-200 hover:border-slate-300'
                              : 'bg-zinc-900/60 border-white/5 hover:border-white/10'
                        }`}
                      >
                        {/* Process Info */}
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            isLight ? 'bg-slate-100' : 'bg-white/5'
                          }`}>
                            <i className={`fas ${registryItem.icon} text-md ${registryItem.color}`}></i>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-sans font-black tracking-wide text-white/90">{registryItem.label}</span>
                              {isActive && (
                                <span className="text-[7px] font-mono tracking-widest font-black uppercase bg-cyan-400 text-black px-1.5 py-0.5 rounded">
                                  Foreground
                                </span>
                              )}
                            </div>
                            <span className="text-[8px] opacity-50 block uppercase tracking-wider">PID {1000 + APP_REGISTRY.indexOf(registryItem)} • thread_io</span>
                          </div>
                        </div>

                        {/* Metrics and Actions */}
                        <div className="flex items-center gap-6">
                          <div className="text-right text-[10px]">
                            <div className="font-bold opacity-95">{metrics.ram} MB</div>
                            <div className="text-[9px] opacity-60 text-cyan-400 font-bold">{metrics.cpu}% CPU</div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Switch To */}
                            <button
                              onClick={() => {
                                onNavigate(state);
                                setShowTaskManager(false);
                              }}
                              className={`p-2 rounded-lg border transition-all cursor-pointer hover:scale-105 ${
                                isActive
                                  ? 'bg-transparent border-transparent text-cyan-400 cursor-default opacity-50'
                                  : isLight
                                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                              }`}
                              disabled={isActive}
                              title="Switch Workspace"
                            >
                              <i className="fa-solid fa-arrow-right-to-bracket text-xs"></i>
                            </button>

                            {/* Kill/Terminate */}
                            <button
                              onClick={() => onTerminateApp(state)}
                              className="p-2 rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-600 hover:text-white transition-all text-rose-400 cursor-pointer hover:scale-105"
                              title="Terminate Process"
                            >
                              <i className="fa-solid fa-skull text-xs"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Panel */}
              <div className={`p-4 border-t flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-100' : 'bg-black/40 border-white/5'
              }`}>
                <div className="text-[9px] font-mono tracking-widest uppercase opacity-50">
                  Secure Quantum Thread Pool Active
                </div>
                {runningApps.length > 0 && (
                  <button
                    onClick={() => {
                      runningApps.forEach(state => onTerminateApp(state));
                      setShowTaskManager(false);
                      window.dispatchEvent(new CustomEvent('cosmic-notification', {
                        detail: {
                          title: 'All Tasks Terminated',
                          message: 'System heap cleared. All background applications purged successfully.',
                          type: 'success'
                        }
                      }));
                    }}
                    className="px-4 py-2 text-[9px] font-mono font-black uppercase tracking-widest bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-lg border border-rose-700 transition-all cursor-pointer shadow-lg shadow-rose-600/10"
                  >
                    Purge All Tasks
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
