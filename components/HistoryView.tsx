import React, { useState, useEffect } from 'react';
import { HistoryItem, getHistory, clearHistory, searchHistory } from '../services/history';

export const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      setHistory(searchHistory(searchQuery));
    } else {
      setHistory(getHistory());
    }
  }, [searchQuery]);

  const handleClear = () => {
    clearHistory();
    setHistory([]);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'IMAGE': return 'fa-image text-pink-400';
      case 'VIDEO': return 'fa-video text-rose-400';
      case 'BANNER': return 'fa-panorama text-orange-400';
      case 'DOCUMENT': return 'fa-file-word text-blue-400';
      case 'CHAT': return 'fa-comment text-cyan-400';
      default: return 'fa-clock text-white/50';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="relative flex-1 max-w-md">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-white/30"></i>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono text-sm"
            />
          </div>
          <button 
            onClick={handleClear}
            className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-black uppercase tracking-widest text-[10px] rounded-xl border border-red-500/20 transition-all"
          >
            Clear All
          </button>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-20 opacity-40">
            <i className="fas fa-history text-6xl mb-6"></i>
            <h3 className="text-xl font-black uppercase tracking-widest">No History Found</h3>
            <p className="text-sm font-mono mt-2">Your actions will be recorded here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map(item => (
              <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-black/20 flex flex-shrink-0 items-center justify-center border border-white/5`}>
                  <i className={`fas ${getIconForType(item.type)} text-xl`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                    <span className="text-[10px] font-black tracking-widest text-white/40 uppercase whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 font-mono break-words">
                    {typeof item.data === 'string' ? item.data : JSON.stringify(item.data)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
