import React, { useState, useEffect, useRef } from 'react';
import { ThemeMode } from '../types';

interface SystemLogItem {
  id?: string;
  api: string;
  status: string;
  timestamp: number;
  duration?: number;
}

interface SystemLogsProps {
  themeMode: ThemeMode;
}

export const SystemLogs: React.FC<SystemLogsProps> = ({ themeMode }) => {
  const isLight = themeMode === ThemeMode.LIGHT;
  const isColorful = themeMode === ThemeMode.COLORFUL;

  const [logs, setLogs] = useState<SystemLogItem[]>(() => {
    try {
      const saved = localStorage.getItem('quantinum_system_health_logs');
      return saved ? JSON.parse(saved) : [
        { api: 'System.boot', status: 'Success', timestamp: Date.now() - 5000 },
        { api: 'IndexedDB.initDB', status: 'Success', timestamp: Date.now() - 4000 }
      ];
    } catch {
      return [];
    }
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  
  // Real-time simulated developer metrics for debugging
  const [cpuUsage, setCpuUsage] = useState(12.5);
  const [memoryUsed, setMemoryUsed] = useState(148.4);
  const [activeThreads, setActiveThreads] = useState(4);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleNewLog = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const newLog: SystemLogItem = {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          api: customEvent.detail.api || 'Unknown API',
          status: customEvent.detail.status || 'Success',
          timestamp: Date.now(),
          duration: customEvent.detail.duration || Math.floor(Math.random() * 45) + 5
        };

        setLogs(prev => {
          const updated = [newLog, ...prev].slice(0, 50); // Keep last 50 logs for history
          localStorage.setItem('quantinum_system_health_logs', JSON.stringify(updated));
          return updated;
        });
      }
    };

    window.addEventListener('cosmic-health-api-call', handleNewLog);

    // Performance metrics generator
    const interval = setInterval(() => {
      setCpuUsage(prev => {
        const delta = (Math.random() - 0.5) * 5;
        return Math.max(3.5, Math.min(65.0, +(prev + delta).toFixed(1)));
      });
      setMemoryUsed(prev => {
        const delta = (Math.random() - 0.5) * 3;
        return Math.max(120.0, Math.min(512.0, +(prev + delta).toFixed(1)));
      });
      setActiveThreads(prev => {
        const change = Math.random() > 0.85 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        return Math.max(2, Math.min(8, prev + change));
      });
    }, 2000);

    return () => {
      window.removeEventListener('cosmic-health-api-call', handleNewLog);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleClear = () => {
    setLogs([]);
    localStorage.removeItem('quantinum_system_health_logs');
    window.dispatchEvent(new CustomEvent('cosmic-notification', {
      detail: { title: 'System Logs Purged', message: 'Diagnostics buffer cleared successfully.', type: 'info' }
    }));
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.api.toLowerCase().includes(search.toLowerCase()) || 
                          log.status.toLowerCase().includes(search.toLowerCase());
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'success') return matchesSearch && log.status.toLowerCase() === 'success';
    if (statusFilter === 'failed') return matchesSearch && log.status.toLowerCase() !== 'success';
    return matchesSearch;
  });

  return (
    <div className={`border rounded-[1.8rem] p-5 shadow-2xl flex flex-col h-[280px] w-full max-w-5xl transition-all duration-300 relative overflow-hidden ${
      isLight 
        ? 'bg-white border-slate-200 text-slate-800' 
        : isColorful
          ? 'bg-gradient-to-br from-fuchsia-950/40 via-purple-950/40 to-cyan-950/40 border-pink-500/20 text-white backdrop-blur-2xl shadow-[0_0_20px_rgba(219,39,119,0.15)]'
          : 'bg-slate-900/60 border-white/10 text-white backdrop-blur-xl'
    }`} id="system-logs-panel">
      {/* Top Header Bar */}
      <div className={`flex flex-wrap items-center justify-between border-b pb-2.5 mb-3 gap-2 ${
        isLight ? 'border-slate-100' : 'border-white/5'
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
          <h3 className="text-xs font-black uppercase tracking-[0.25em] text-cyan-400 flex items-center gap-1.5">
            <i className="fa-solid fa-terminal"></i>
            System Logs & Performance Diagnostics
          </h3>
        </div>

        {/* System telemetry pills */}
        <div className="flex items-center gap-3 text-[9px] font-mono">
          <span className={`px-2 py-0.5 rounded-full ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-white/60'}`} title="Processor Core Allocation">
            CPU: <b className="text-cyan-400">{cpuUsage}%</b>
          </span>
          <span className={`px-2 py-0.5 rounded-full ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-white/60'}`} title="Quantum Micro-RAM Pool">
            MEM: <b className="text-violet-400">{memoryUsed}MB</b>
          </span>
          <span className={`px-2 py-0.5 rounded-full ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-white/60'}`} title="Live Applet Channels">
            THREADS: <b className="text-amber-400">{activeThreads}</b>
          </span>
        </div>
      </div>

      {/* Control Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <i className={`fas fa-filter text-[10px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}></i>
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search diagnostics..."
            className={`flex-1 border rounded-xl px-3 py-1 text-[10px] focus:outline-none font-mono ${
              isLight 
                ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 placeholder-slate-400' 
                : 'bg-white/5 border-white/10 text-white focus:border-cyan-500/50 placeholder-white/20'
            }`}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status buttons filter */}
          <div className={`flex rounded-lg p-0.5 border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/5'}`}>
            {(['all', 'success', 'failed'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-2.5 py-0.5 rounded-md text-[9px] font-mono uppercase font-bold transition-all cursor-pointer ${
                  statusFilter === filter
                    ? isLight
                      ? 'bg-white text-slate-900 border border-slate-300 shadow-sm'
                      : 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Clean utility buttons */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase border cursor-pointer transition-all ${
              autoScroll 
                ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400' 
                : isLight ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white/5 border-white/10 text-white/50'
            }`}
            title="Toggle autoscroll to latest logs"
          >
            Scroll
          </button>

          <button
            onClick={handleClear}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase border cursor-pointer transition-all ${
              isLight ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
            }`}
            title="Clear memory log backlog"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Logs Window Terminal Grid */}
      <div className={`flex-1 overflow-y-auto rounded-xl p-3 border font-mono text-[10px] space-y-1 ${
        isLight 
          ? 'bg-slate-50 border-slate-200' 
          : 'bg-black/40 border-white/[0.03]'
      } custom-scrollbar`}>
        {filteredLogs.length > 0 ? (
          <div className="flex flex-col-reverse gap-1">
            {filteredLogs.map((log, idx) => {
              const isError = log.status.toLowerCase() !== 'success';
              const logTime = new Date(log.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit',
                hour12: false
              });
              return (
                <div 
                  key={log.id || idx}
                  className={`flex items-start gap-2.5 py-1 border-b border-white/[0.01] hover:bg-white/[0.02] transition-colors`}
                >
                  {/* Timestamp */}
                  <span className={`text-[9px] opacity-45 shrink-0 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    [{logTime}]
                  </span>

                  {/* Status Indicator Tag */}
                  <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded border shrink-0 ${
                    isError 
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}>
                    {log.status}
                  </span>

                  {/* API / Custom Action Name */}
                  <span className={`flex-1 break-all ${isLight ? 'text-slate-700 font-medium' : 'text-slate-200'}`}>
                    {log.api}
                  </span>

                  {/* Latency Execution Duration */}
                  {log.duration !== undefined && (
                    <span className="text-[8px] opacity-40 shrink-0">
                      {log.duration}ms
                    </span>
                  )}
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-[10px] text-center opacity-40 uppercase tracking-widest py-8">
            <i className="fa-solid fa-code-merge text-lg mb-2"></i>
            No diagnostics recorded in memory buffer
          </div>
        )}
      </div>
    </div>
  );
};
