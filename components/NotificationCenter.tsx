import React from 'react';
import { ThemeMode } from '../types';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  type: 'info' | 'success' | 'alert';
  read: boolean;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onMarkRead: (id: string) => void;
  themeMode: ThemeMode;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onClearAll,
  onMarkRead,
  themeMode
}) => {
  const isLight = themeMode === ThemeMode.LIGHT;
  const isColorful = themeMode === ThemeMode.COLORFUL;

  // System Health States
  const [apiLogs, setApiLogs] = React.useState<{ api: string; status: string; timestamp: number }[]>(() => {
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

  const [cpuUsage, setCpuUsage] = React.useState(12.5);
  const [memoryUsed, setMemoryUsed] = React.useState(148.4);
  const [isHealthExpanded, setIsHealthExpanded] = React.useState(true);

  React.useEffect(() => {
    const handleApiLog = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const newLog = {
          api: customEvent.detail.api || 'Unknown API',
          status: customEvent.detail.status || 'Success',
          timestamp: Date.now()
        };
        setApiLogs(prev => {
          const updated = [newLog, ...prev].slice(0, 20); // Keep last 20 logs
          localStorage.setItem('quantinum_system_health_logs', JSON.stringify(updated));
          return updated;
        });
      }
    };

    window.addEventListener('cosmic-health-api-call', handleApiLog);

    // Simulate metrics
    const interval = setInterval(() => {
      setCpuUsage(prev => {
        const delta = (Math.random() - 0.5) * 4;
        return Math.max(2.1, Math.min(32.4, +(prev + delta).toFixed(1)));
      });
      setMemoryUsed(prev => {
        const delta = (Math.random() - 0.5) * 2;
        return Math.max(90.0, Math.min(256.0, +(prev + delta).toFixed(1)));
      });
    }, 3000);

    return () => {
      window.removeEventListener('cosmic-health-api-call', handleApiLog);
      clearInterval(interval);
    };
  }, []);

  const handleClearLogs = () => {
    setApiLogs([]);
    localStorage.removeItem('quantinum_system_health_logs');
  };

  const getRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[130] transition-opacity cursor-pointer"
          onClick={onClose}
        />
      )}

      {/* Slide-out Sidebar Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-[340px] sm:w-[420px] transition-transform duration-500 ease-out z-[140] flex flex-col shadow-2xl border-l select-none ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${
          isLight 
            ? 'bg-white text-slate-900 border-slate-200' 
            : isColorful 
            ? 'bg-indigo-950/95 backdrop-blur-3xl text-white border-pink-500/20 shadow-[0_0_50px_rgba(236,72,153,0.15)]'
            : 'bg-black text-white border-cyan-500/20 shadow-[0_0_50px_rgba(6,182,212,0.15)]'
        }`}
      >
        {/* Dynamic header indicator line */}
        <div className={`h-1 w-full ${
          isLight 
            ? 'bg-blue-500' 
            : isColorful 
            ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500' 
            : 'bg-gradient-to-r from-cyan-400 to-blue-500'
        }`} />

        {/* Panel Header */}
        <div className="p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <i className={`fas fa-bell text-lg ${
              isLight ? 'text-blue-500' : isColorful ? 'text-pink-400' : 'text-cyan-400'
            }`}></i>
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.25em] font-display">System Alert Center</h3>
              <div className="text-[9px] font-mono opacity-60 mt-0.5">
                {notifications.filter(n => !n.read).length} UNREAD BLUEPRINTS
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/5 text-white/50 hover:text-white'
            }`}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Action Controls */}
        {notifications.length > 0 && (
          <div className="px-6 py-3 border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/[0.02] flex items-center justify-between gap-3 text-[10px] font-mono">
            <button 
              onClick={onMarkAllRead}
              className={`font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
                isLight ? 'text-blue-600 hover:text-blue-700' : 'text-cyan-400/80 hover:text-cyan-300'
              }`}
            >
              <i className="fas fa-check-double text-[9px]"></i>
              Mark All Read
            </button>
            <button 
              onClick={onClearAll}
              className={`font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
                isLight ? 'text-rose-600 hover:text-rose-700' : 'text-rose-400/80 hover:text-rose-300'
              }`}
            >
              <i className="fas fa-trash-can text-[9px]"></i>
              Clear Archive
            </button>
          </div>
        )}

        {/* Alerts List Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3.5 custom-scrollbar">
          {notifications.length > 0 ? (
            notifications.map((notif) => {
              const notifColor = 
                notif.type === 'success' 
                  ? (isLight ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20')
                  : notif.type === 'alert'
                  ? (isLight ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-rose-400 bg-rose-500/10 border-rose-500/20')
                  : (isLight ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20');

              const indicatorIcon = 
                notif.type === 'success' ? 'fa-circle-check' :
                notif.type === 'alert' ? 'fa-triangle-exclamation' : 'fa-circle-info';

              return (
                <div 
                  key={notif.id}
                  onClick={() => onMarkRead(notif.id)}
                  className={`group relative p-4 rounded-2xl border text-left transition-all duration-300 flex gap-3.5 cursor-pointer hover:scale-[1.01] ${
                    isLight 
                      ? `${notif.read ? 'bg-slate-50/50 border-slate-100 opacity-60' : 'bg-slate-50 border-slate-200 shadow-sm'}` 
                      : `${notif.read ? 'bg-white/[0.02] border-white/5 opacity-50' : 'bg-white/[0.05] border-white/10 hover:border-cyan-500/30'}`
                  }`}
                >
                  {/* Read state dot */}
                  {!notif.read && (
                    <div className={`absolute top-4 right-4 w-1.5 h-1.5 rounded-full ${
                      isLight ? 'bg-blue-600' : isColorful ? 'bg-pink-500 animate-pulse' : 'bg-cyan-400 animate-pulse'
                    }`} />
                  )}

                  {/* Left Icon Panel */}
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${notifColor}`}>
                    <i className={`fas ${indicatorIcon} text-base`}></i>
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 truncate ${
                      isLight ? 'text-slate-800' : 'text-white'
                    }`}>
                      {notif.title}
                    </div>
                    <p className={`text-[11px] font-medium leading-relaxed mt-1 ${
                      isLight ? 'text-slate-600' : 'text-white/70'
                    }`}>
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between mt-2 text-[8px] font-mono opacity-50 uppercase tracking-widest">
                      <span>{getRelativeTime(notif.timestamp)}</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {notif.read ? 'read' : 'mark read'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-12">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-current flex items-center justify-center mb-4">
                <i className="fas fa-bell-slash text-xl animate-pulse"></i>
              </div>
              <span className="text-[10px] font-mono tracking-[0.3em] uppercase">No active alerts</span>
              <p className="text-[9px] max-w-[200px] mt-2 font-mono">
                System notifications and recent task completions will manifest here.
              </p>
            </div>
          )}
        </div>

        {/* System Health Log Section */}
        <div className={`border-t flex flex-col transition-all duration-300 ${
          isLight ? 'border-slate-100 bg-slate-50/50' : 'border-white/5 bg-white/[0.01]'
        }`}>
          {/* Header Toggle */}
          <button 
            onClick={() => setIsHealthExpanded(!isHealthExpanded)}
            className={`w-full px-6 py-3.5 flex items-center justify-between text-left text-[10px] font-black uppercase tracking-[0.2em] font-mono cursor-pointer ${
              isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-cyan-400/80 hover:bg-white/[0.03]'
            }`}
          >
            <div className="flex items-center gap-2">
              <i className={`fas fa-heartbeat ${isLight ? 'text-blue-500' : 'text-cyan-400'}`}></i>
              <span>System Health Log</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping`}></span>
              <i className={`fas ${isHealthExpanded ? 'fa-chevron-down' : 'fa-chevron-up'} opacity-60 text-[9px]`}></i>
            </div>
          </button>

          {/* Collapsible Content */}
          {isHealthExpanded && (
            <div className="px-6 pb-5 pt-1 space-y-4 font-mono text-[10px] animate-fade-in">
              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-white border-slate-100' : 'bg-black/30 border-white/5'}`}>
                  <div className="flex justify-between items-center opacity-60 mb-1.5">
                    <span>CPU ESTIMATE</span>
                    <span className="font-bold">{cpuUsage}%</span>
                  </div>
                  <div className="h-1 w-full bg-slate-500/20 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        cpuUsage > 25 ? 'bg-rose-500' : cpuUsage > 15 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, cpuUsage * 3)}%` }}
                    />
                  </div>
                </div>

                <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-white border-slate-100' : 'bg-black/30 border-white/5'}`}>
                  <div className="flex justify-between items-center opacity-60 mb-1.5">
                    <span>MEMORY ALLOC</span>
                    <span className="font-bold">{memoryUsed}MB</span>
                  </div>
                  <div className="h-1 w-full bg-slate-500/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-1000"
                      style={{ width: `${Math.min(100, (memoryUsed / 256) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* API Logs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-dashed border-current/10 pb-1.5">
                  <span className="opacity-50">RECENT API TRANSACTIONS</span>
                  {apiLogs.length > 0 && (
                    <button 
                      onClick={handleClearLogs}
                      className="text-[8px] font-bold text-rose-500 hover:underline tracking-wider uppercase cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                
                <div className="max-h-24 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                  {apiLogs.length > 0 ? (
                    apiLogs.map((log, idx) => (
                      <div key={idx} className="flex justify-between items-start gap-2 py-0.5 border-b border-solid border-current/[0.02] last:border-0">
                        <div className="truncate max-w-[180px] text-white/80 dark:text-white/80 light:text-slate-700">
                          <i className="fas fa-terminal opacity-40 mr-1.5 text-[8px]"></i>
                          <span className={isLight ? 'text-slate-800' : 'text-slate-200'}>{log.api}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 text-[8px]">
                          <span className="opacity-40">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                          <span className={`px-1 rounded-sm text-[7px] font-bold uppercase ${
                            log.status.toLowerCase() === 'success' 
                              ? 'bg-emerald-500/10 text-emerald-500' 
                              : 'bg-rose-500/10 text-rose-500'
                          }`}>{log.status}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 opacity-30 text-[9px] uppercase tracking-wider">
                      No transaction records.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Panel Footer Diagnostic Info */}
        <div className={`p-4 border-t font-mono text-[9px] text-center opacity-50 tracking-widest uppercase ${
          isLight ? 'border-slate-100 text-slate-600 bg-slate-50' : 'border-white/5 text-white bg-black/40'
        }`}>
          <div>Quantinum OS • v2.6.1-Alpha</div>
          <div className="mt-1">All subsystems operational</div>
        </div>
      </div>
    </>
  );
};
