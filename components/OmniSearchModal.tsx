import React, { useState, useEffect, useRef } from 'react';
import { ThemeMode, ChatMessage } from '../types';
import { searchAllDocuments, SearchResult } from '../services/documentStorage';
import { getChatHistory } from '../services/indexedDBCache';

interface OmniSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (state: any) => void;
  themeMode?: ThemeMode;
}

interface SettingsItem {
  id: string;
  name: string;
  category: string;
  value: boolean;
  onToggle: () => void;
  icon: string;
}

export const OmniSearchModal: React.FC<OmniSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  themeMode = ThemeMode.DARK
}) => {
  const [query, setQuery] = useState('');
  const [documentResults, setDocumentResults] = useState<SearchResult[]>([]);
  const [taskResults, setTaskResults] = useState<any[]>([]);
  const [settingResults, setSettingResults] = useState<SettingsItem[]>([]);
  const [chatResults, setChatResults] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const [activeTab, setActiveTab] = useState<'results' | 'recent'>('results');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('quantinum_recent_searches');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addRecentSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 10);
      localStorage.setItem('quantinum_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const [dnd, setDnd] = useState(() => localStorage.getItem('quantinum_dnd') === 'true');
  const [reading, setReading] = useState(() => localStorage.getItem('quantinum_reading') === 'true');
  const [saver, setSaver] = useState(() => localStorage.getItem('quantinum_battery_saver') === 'true');
  const [mute, setMute] = useState(() => localStorage.getItem('quantinum_system_mute') === 'true');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLight = themeMode === ThemeMode.LIGHT;

  // Sync state values on modal open
  useEffect(() => {
    if (isOpen) {
      setDnd(localStorage.getItem('quantinum_dnd') === 'true');
      setReading(localStorage.getItem('quantinum_reading') === 'true');
      setSaver(localStorage.getItem('quantinum_battery_saver') === 'true');
      setMute(localStorage.getItem('quantinum_system_mute') === 'true');
      setQuery('');
      setDocumentResults([]);
      setTaskResults([]);
      setSettingResults([]);
      setChatResults([]);
      setActiveIndex(0);
      setActiveTab('results');
      
      try {
        const stored = localStorage.getItem('quantinum_recent_searches');
        if (stored) {
          setRecentSearches(JSON.parse(stored));
        }
      } catch (e) {
        console.warn(e);
      }

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim()) {
      setActiveTab('results');
    }
  }, [query]);

  // Handle custom trigger events
  useEffect(() => {
    const handleGlobalOpen = (e: CustomEvent) => {
      const initialQuery = e.detail?.query || '';
      setQuery(initialQuery);
    };
    window.addEventListener('cosmic-open-omnisearch' as any, handleGlobalOpen);
    return () => window.removeEventListener('cosmic-open-omnisearch' as any, handleGlobalOpen);
  }, []);

  // Filter & Search Logic across IndexedDB & Local Storage
  useEffect(() => {
    const term = query.toLowerCase().trim();
    if (!term) {
      setDocumentResults([]);
      setTaskResults([]);
      setSettingResults([]);
      setChatResults([]);
      return;
    }

    // 1. Documents search
    const docs = searchAllDocuments(term);
    setDocumentResults(docs);

    // 2. Tasks search
    try {
      const storedTasks = localStorage.getItem('quantinum_active_tasks');
      if (storedTasks) {
        const tasksList = JSON.parse(storedTasks);
        const matchedTasks = tasksList.filter((t: any) => 
          t.text.toLowerCase().includes(term)
        );
        setTaskResults(matchedTasks);
      }
    } catch (e) {
      console.warn(e);
    }

    // 3. System Settings matching
    const allSettings: SettingsItem[] = [
      {
        id: 'opt-dnd',
        name: 'Do Not Disturb Protocol',
        category: 'System Control',
        value: dnd,
        icon: 'fa-bell-slash',
        onToggle: () => {
          const next = !dnd;
          setDnd(next);
          localStorage.setItem('quantinum_dnd', String(next));
          window.dispatchEvent(new Event('cosmic-quickaction-sync'));
          window.dispatchEvent(new CustomEvent('cosmic-notification', {
            detail: { title: 'DND Status Updated', message: `Do Not Disturb is now ${next ? 'enabled' : 'disabled'}`, type: 'info' }
          }));
        }
      },
      {
        id: 'opt-reading',
        name: 'Eye-Safe Reading Filter Overlay',
        category: 'Display Control',
        value: reading,
        icon: 'fa-eye',
        onToggle: () => {
          const next = !reading;
          setReading(next);
          localStorage.setItem('quantinum_reading', String(next));
          window.dispatchEvent(new Event('cosmic-quickaction-sync'));
          window.dispatchEvent(new CustomEvent('cosmic-notification', {
            detail: { title: 'Display Filter Synced', message: `Reading filter is now ${next ? 'active' : 'inactive'}`, type: 'info' }
          }));
        }
      },
      {
        id: 'opt-saver',
        name: 'Battery saver (Limit CPU background routines)',
        category: 'Power Management',
        value: saver,
        icon: 'fa-battery-three-quarters',
        onToggle: () => {
          const next = !saver;
          setSaver(next);
          localStorage.setItem('quantinum_battery_saver', String(next));
          window.dispatchEvent(new Event('cosmic-quickaction-sync'));
          window.dispatchEvent(new CustomEvent('cosmic-notification', {
            detail: { title: 'Power Profile Synced', message: `Battery Saver is now ${next ? 'active' : 'inactive'}`, type: 'info' }
          }));
        }
      },
      {
        id: 'opt-mute',
        name: 'System audio mute toggle',
        category: 'Telemetry Audio',
        value: mute,
        icon: 'fa-volume-mute',
        onToggle: () => {
          const next = !mute;
          setMute(next);
          localStorage.setItem('quantinum_system_mute', String(next));
          window.dispatchEvent(new Event('cosmic-quickaction-sync'));
          window.dispatchEvent(new CustomEvent('cosmic-notification', {
            detail: { title: 'Telemetry Audio Synced', message: `Mute state is now ${next ? 'enabled' : 'disabled'}`, type: 'info' }
          }));
        }
      }
    ];

    const matchedSettings = allSettings.filter(s => 
      s.name.toLowerCase().includes(term) || s.category.toLowerCase().includes(term)
    );
    setSettingResults(matchedSettings);

    // 4. Chat history IndexedDB search
    getChatHistory<ChatMessage[]>().then(messages => {
      if (messages) {
        const matchedMsgs = messages.filter(m => m.content.toLowerCase().includes(term));
        setChatResults(matchedMsgs.slice(0, 5)); // Cap at top 5 matches
      }
    }).catch(e => console.warn(e));

  }, [query, dnd, reading, saver, mute]);

  // Click outside handler
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('mousedown', handleOutside);
    }
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [isOpen, onClose]);

  const handleDocumentClick = (doc: SearchResult) => {
    addRecentSearch(query);
    onNavigate(doc.type === 'word' ? 'COSMIC_WORD' : doc.type === 'excel' ? 'COSMIC_EXCEL' : 'PYTHON');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('cosmic-open-document', {
        detail: { id: doc.id, type: doc.type }
      }));
    }, 150);
    onClose();
  };

  const totalResultsCount = documentResults.length + taskResults.length + settingResults.length + chatResults.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[220] flex items-center justify-center p-4 md:p-10 animate-fade-in select-none">
      <div 
        ref={containerRef}
        className="w-full max-w-3xl bg-slate-900/90 border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.85)] flex flex-col relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-emerald-400 to-indigo-500"></div>

        {/* Input Header */}
        <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-white/5">
          <i className="fa-solid fa-magnifying-glass text-cyan-400 text-lg animate-pulse"></i>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                addRecentSearch(query);
              }
            }}
            placeholder="Search documents, tasks, system settings, or AI chat logs..."
            className="flex-1 bg-transparent text-white text-base focus:outline-none placeholder-white/30 font-sans"
          />
          <span className="text-[9px] bg-white/10 px-2.5 py-1 rounded-md text-white/40 font-mono tracking-widest uppercase">
            Omni Index Active
          </span>
        </div>

        {/* Interactive Workspace Split Layout */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-[380px]">
          {/* Left Sidebar Tab Selector */}
          <div className="w-full md:w-48 border-b md:border-b-0 md:border-r border-white/5 bg-black/10 p-3.5 flex flex-row md:flex-col gap-1.5 shrink-0">
            <button
              onClick={() => setActiveTab('results')}
              className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2.5 px-3 py-2.5 rounded-xl text-[10px] font-bold tracking-wider font-mono uppercase transition-all border ${
                activeTab === 'results' 
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[inset_0_0_12px_rgba(34,211,238,0.05)]' 
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5 border-transparent'
              }`}
            >
              <i className="fa-solid fa-magnifying-glass text-[9px]"></i>
              <span>All Results</span>
              {totalResultsCount > 0 && (
                <span className="ml-auto text-[9px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-md font-mono font-black">
                  {totalResultsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2.5 px-3 py-2.5 rounded-xl text-[10px] font-bold tracking-wider font-mono uppercase transition-all border ${
                activeTab === 'recent' 
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[inset_0_0_12px_rgba(34,211,238,0.05)]' 
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5 border-transparent'
              }`}
            >
              <i className="fa-solid fa-clock-rotate-left text-[9px]"></i>
              <span>Recents</span>
              {recentSearches.length > 0 && (
                <span className="ml-auto text-[9px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded-md font-mono">
                  {recentSearches.length}
                </span>
              )}
            </button>
          </div>

          {/* Main Results Container */}
          <div className="flex-1 max-h-[450px] overflow-y-auto custom-scrollbar p-5">
            {activeTab === 'results' ? (
              <div className="space-y-5">
                {totalResultsCount > 0 ? (
                  <>
                    {/* Document Results */}
                    {documentResults.length > 0 && (
                      <div>
                        <h4 className="text-[9px] font-mono font-black uppercase tracking-[0.25em] text-cyan-400 mb-2 border-b border-white/5 pb-1">
                          Matched System Documents ({documentResults.length})
                        </h4>
                        <div className="space-y-1">
                          {documentResults.map(doc => (
                            <button
                              key={doc.id}
                              onClick={() => handleDocumentClick(doc)}
                              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-transparent hover:border-white/10 bg-white/[0.01] hover:bg-white/5 transition-all text-left group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5 ${
                                  doc.type === 'word' ? 'bg-blue-500/10 text-blue-400' : doc.type === 'excel' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-cyan-500/10 text-cyan-400'
                                }`}>
                                  <i className={`fa-solid ${doc.type === 'word' ? 'fa-file-lines' : doc.type === 'excel' ? 'fa-table' : 'fa-brands fa-python'} text-xs`}></i>
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-white group-hover:text-cyan-300 truncate transition-colors">{doc.title}</div>
                                  <div className="text-[9px] font-mono text-white/40 truncate mt-0.5" dangerouslySetInnerHTML={{ __html: doc.snippet }} />
                                </div>
                              </div>
                              <i className="fa-solid fa-chevron-right text-[9px] text-white/20 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tasks Results */}
                    {taskResults.length > 0 && (
                      <div>
                        <h4 className="text-[9px] font-mono font-black uppercase tracking-[0.25em] text-emerald-400 mb-2 border-b border-white/5 pb-1">
                          Matched Active Objectives ({taskResults.length})
                        </h4>
                        <div className="space-y-1">
                          {taskResults.map(task => (
                            <div
                              key={task.id}
                              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-white/5 bg-white/[0.01] text-left"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5 ${
                                  task.completed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                }`}>
                                  <i className={`fa-solid ${task.completed ? 'fa-circle-check' : 'fa-circle'} text-xs`}></i>
                                </div>
                                <div className="min-w-0">
                                  <div className={`text-xs font-bold ${task.completed ? 'text-white/40 line-through' : 'text-white'}`}>{task.text}</div>
                                  <div className="text-[8px] font-mono text-white/20 uppercase mt-0.5">Objective Sector</div>
                                </div>
                              </div>
                              <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border border-solid ${
                                task.completed ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                              }`}>
                                {task.completed ? 'Completed' : 'Pending'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Setting Results */}
                    {settingResults.length > 0 && (
                      <div>
                        <h4 className="text-[9px] font-mono font-black uppercase tracking-[0.25em] text-indigo-400 mb-2 border-b border-white/5 pb-1">
                          Matched System Settings ({settingResults.length})
                        </h4>
                        <div className="space-y-1">
                          {settingResults.map(setting => (
                            <div
                              key={setting.id}
                              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-white/5 bg-white/[0.01] text-left"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5 bg-indigo-500/10 text-indigo-400">
                                  <i className={`fa-solid ${setting.icon} text-xs`}></i>
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-white">{setting.name}</div>
                                  <div className="text-[8px] font-mono text-white/40 uppercase mt-0.5">{setting.category}</div>
                                </div>
                              </div>
                              
                              {/* Instant Toggle Control */}
                              <button
                                onClick={() => {
                                  addRecentSearch(query);
                                  setting.onToggle();
                                }}
                                className={`w-10 h-6 rounded-full relative transition-all border border-solid duration-300 cursor-pointer ${
                                  setting.value 
                                    ? 'bg-cyan-500 border-cyan-400' 
                                    : 'bg-zinc-800 border-zinc-700'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all duration-300 shadow-md ${
                                  setting.value ? 'left-[18px]' : 'left-0.5'
                                }`} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Chat Log Results */}
                    {chatResults.length > 0 && (
                      <div>
                        <h4 className="text-[9px] font-mono font-black uppercase tracking-[0.25em] text-fuchsia-400 mb-2 border-b border-white/5 pb-1">
                          Matched Oracle AI Conversations ({chatResults.length})
                        </h4>
                        <div className="space-y-1">
                          {chatResults.map((msg, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                addRecentSearch(query);
                                onNavigate('CHAT');
                                onClose();
                              }}
                              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-transparent hover:border-white/10 bg-white/[0.01] hover:bg-white/5 transition-all text-left group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5 ${
                                  msg.role === 'assistant' ? 'bg-fuchsia-500/10 text-fuchsia-400' : 'bg-cyan-500/10 text-cyan-400'
                                }`}>
                                  <i className={`fa-solid ${msg.role === 'assistant' ? 'fa-wand-magic-sparkles' : 'fa-user'} text-xs`}></i>
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-white truncate">{msg.content}</div>
                                  <div className="text-[8px] font-mono text-white/30 uppercase mt-0.5">
                                    {msg.role === 'assistant' ? 'Oracle Response' : 'User Transmission'}
                                  </div>
                                </div>
                              </div>
                              <i className="fa-solid fa-comment-dots text-[10px] text-white/20 group-hover:text-fuchsia-400 transition-colors" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-white/30">
                      <i className="fa-solid fa-magnifying-glass-chart text-xl animate-pulse"></i>
                    </div>
                    <p className="text-sm font-bold text-white mb-1">Index queries completed</p>
                    <p className="text-xs text-white/30 max-w-sm mx-auto font-mono uppercase tracking-wider leading-relaxed">
                      {query.trim() ? 'No database documents or settings matched' : 'Type a query to run global full-text indexing'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h4 className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-cyan-400">
                    Search Query History
                  </h4>
                  {recentSearches.length > 0 && (
                    <button
                      onClick={() => {
                        setRecentSearches([]);
                        localStorage.removeItem('quantinum_recent_searches');
                      }}
                      className="text-[9px] font-mono font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
                    >
                      <i className="fa-solid fa-trash-can text-[8px]"></i>
                      Clear All
                    </button>
                  )}
                </div>

                {recentSearches.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-white/25">
                      <i className="fa-solid fa-clock-rotate-left text-base"></i>
                    </div>
                    <p className="text-xs font-bold text-white/60 mb-0.5">No recent queries</p>
                    <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider">Search terms are cached in local registry</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {recentSearches.map((term, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/5 transition-all group"
                      >
                        <button
                          onClick={() => {
                            setQuery(term);
                            setActiveTab('results');
                          }}
                          className="flex-1 text-left flex items-center gap-2.5 min-w-0 cursor-pointer"
                        >
                          <i className="fa-solid fa-magnifying-glass text-[10px] text-white/20 group-hover:text-cyan-400 transition-colors"></i>
                          <span className="text-xs font-bold text-white group-hover:text-cyan-300 truncate transition-colors">"{term}"</span>
                        </button>
                        <button
                          onClick={() => {
                            const updated = recentSearches.filter((_, i) => i !== index);
                            setRecentSearches(updated);
                            localStorage.setItem('quantinum_recent_searches', JSON.stringify(updated));
                          }}
                          className="p-1 text-white/30 hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete query"
                        >
                          <i className="fa-solid fa-xmark text-xs"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-3.5 bg-black/40 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-white/40 tracking-wider">
          <span>Alt + S / Global Index Searcher</span>
          <span className="uppercase text-cyan-400/70 font-bold">Quantinum Global Indexing Service v1.0</span>
        </div>
      </div>
    </div>
  );
};
