import React, { useState, useEffect, useRef } from 'react';
import { clearChatHistory } from '../services/indexedDBCache';
import { clearClipboard, getWordDocuments, getExcelDocuments, getPythonDocuments } from '../services/documentStorage';

interface CommandItem {
  id: string;
  label: string;
  category: string;
  icon: string;
  shortcut?: string;
  isDoc?: boolean;
  docType?: 'word' | 'excel' | 'python';
  docId?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (state: any) => void;
  onNavigateHome: () => void;
  onToggleTheme: () => void;
  activeView?: string;
}

const BASE_COMMANDS: CommandItem[] = [
  { id: 'go-home', label: 'Go to System Home', category: 'Navigation', icon: 'fa-house', shortcut: 'Ctrl+H' },
  { id: 'open-oracle', label: 'Open Cosmic Oracle AI Advisor', category: 'Tools', icon: 'fa-eye' },
  { id: 'open-image', label: 'Open Cosmic Image Generator', category: 'Tools', icon: 'fa-wand-magic-sparkles' },
  { id: 'open-banner-creator', label: 'Open Cosmic Banner Creator / Designer', category: 'Tools', icon: 'fa-panorama' },
  { id: 'open-certificate', label: 'Open Cosmic Certificate Suite', category: 'Tools', icon: 'fa-certificate' },
  { id: 'open-country-informer', label: 'Universal Country Informer', category: 'Tools', icon: 'fa-earth-asia' },
  { id: 'open-python', label: 'Open Cosmic Python Editor (Pyodide)', category: 'Tools', icon: 'fa-brands fa-python' },
  { id: 'open-editor', label: 'Open Cosmic Chat Editor & Terminal', category: 'Tools', icon: 'fa-pen-nib' },
  { id: 'open-excel', label: 'Open Cosmic Excel Spreadsheet', category: 'Tools', icon: 'fa-table' },
  { id: 'open-word', label: 'Open Cosmic Word Document Editor', category: 'Tools', icon: 'fa-file-word' },
  { id: 'open-powerpoint', label: 'Open Cosmic PowerPoint Presenter', category: 'Tools', icon: 'fa-presentation-screen' },
  { id: 'open-games', label: 'Open Cosmic Game Zone', category: 'Tools', icon: 'fa-gamepad' },
  { id: 'open-project-maker', label: 'Open Cosmic Project Maker', category: 'Tools', icon: 'fa-rocket' },
  { id: 'open-video-gen', label: 'Open Cosmic Video Generator', category: 'Tools', icon: 'fa-video' },
  { id: 'open-translator', label: 'Universal Translator Sub-routine', category: 'Tools', icon: 'fa-language' },
  { id: 'open-dictionary', label: 'Oxford Lexicon / Dictionary', category: 'Tools', icon: 'fa-book' },
  { id: 'open-history', label: 'Open Activity History Timeline', category: 'Diagnostics', icon: 'fa-timeline' },
  { id: 'open-performance', label: 'Open Live Telemetry & Performance', category: 'Diagnostics', icon: 'fa-chart-pie' },
  { id: 'open-architect', label: 'Open Cosmic Architect Design Studio', category: 'Tools', icon: 'fa-pencil-ruler' },
  { id: 'open-watch', label: 'Open Cosmic Alarms & World Watch', category: 'Tools', icon: 'fa-clock' },
  { id: 'change-theme', label: 'Toggle Visual Theme Mode', category: 'Appearance', icon: 'fa-palette', shortcut: 'Alt+T' },
  { id: 'toggle-density', label: 'Toggle Interface Density (Comfortable/Compact)', category: 'Appearance', icon: 'fa-compress', shortcut: 'Alt+D' },
  { id: 'clear-cache', label: 'Clear Cache & Chat History (IndexedDB)', category: 'System', icon: 'fa-trash-can' },
  { id: 'toggle-shortcuts', label: 'Toggle Keyboard Shortcuts Guide', category: 'System', icon: 'fa-circle-question', shortcut: 'Shift+?' },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onNavigateHome,
  onToggleTheme,
  activeView,
}) => {
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dynamicCommands, setDynamicCommands] = useState<CommandItem[]>(BASE_COMMANDS);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load dynamic files and tools index on open
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setActiveIndex(0);
      
      const wordDocs = getWordDocuments();
      const excelDocs = getExcelDocuments();
      const pythonDocs = getPythonDocuments();

      const smartSuggestions: CommandItem[] = [];
      if (activeView === 'COSMIC_EXCEL') {
        smartSuggestions.push(
          { id: 'excel-export-csv', label: 'Smart Rule: Export Spreadsheet to CSV Format', category: 'Smart Suggestions (Excel)', icon: 'fa-file-csv text-emerald-400' },
          { id: 'excel-sum-range', label: 'Smart Rule: Sum Selected Cell Range', category: 'Smart Suggestions (Excel)', icon: 'fa-calculator text-emerald-400' },
          { id: 'excel-clear', label: 'Smart Rule: Reset and Clear Spreadsheet Grid', category: 'Smart Suggestions (Excel)', icon: 'fa-eraser text-emerald-400' }
        );
      } else if (activeView === 'COSMIC_WORD') {
        smartSuggestions.push(
          { id: 'word-word-count', label: 'Smart Rule: Analyze prose word count & metrics', category: 'Smart Suggestions (Word)', icon: 'fa-calculator text-blue-400' },
          { id: 'word-export-text', label: 'Smart Rule: Export document to plain text (.txt)', category: 'Smart Suggestions (Word)', icon: 'fa-file-export text-blue-400' },
          { id: 'word-ai-proofread', label: 'Smart Rule: Run grammar & vocabulary analyzer', category: 'Smart Suggestions (Word)', icon: 'fa-wand-magic-sparkles text-blue-400' }
        );
      } else if (activeView === 'PYTHON') {
        smartSuggestions.push(
          { id: 'python-run', label: 'Smart Rule: Execute active code with Pyodide sandbox', category: 'Smart Suggestions (Python)', icon: 'fa-play text-cyan-400' },
          { id: 'python-reset', label: 'Smart Rule: Clear active code block editor', category: 'Smart Suggestions (Python)', icon: 'fa-rotate text-cyan-400' }
        );
      } else if (activeView === 'CHAT') {
        smartSuggestions.push(
          { id: 'chat-clear', label: 'Smart Rule: Purge active thread logs', category: 'Smart Suggestions (Chat)', icon: 'fa-trash text-indigo-400' },
          { id: 'chat-copy', label: 'Smart Rule: Copy final response to clipboard', category: 'Smart Suggestions (Chat)', icon: 'fa-copy text-indigo-400' }
        );
      } else if (activeView === 'BANNER_GEN') {
        smartSuggestions.push(
          { id: 'banner-export', label: 'Smart Rule: Download generated graphics asset (PNG)', category: 'Smart Suggestions (Banner)', icon: 'fa-download text-pink-400' }
        );
      }

      const docCommands: CommandItem[] = [
        ...wordDocs.map(doc => ({
          id: `doc-word-${doc.id}`,
          label: `Word Document: ${doc.title}`,
          category: 'Recent Activity / Word Files',
          icon: 'fa-file-word text-blue-400',
          isDoc: true,
          docType: 'word' as const,
          docId: doc.id
        })),
        ...excelDocs.map(doc => ({
          id: `doc-excel-${doc.id}`,
          label: `Excel Spreadsheet: ${doc.title}`,
          category: 'Recent Activity / Excel Files',
          icon: 'fa-file-excel text-emerald-400',
          isDoc: true,
          docType: 'excel' as const,
          docId: doc.id
        })),
        ...pythonDocs.map(doc => ({
          id: `doc-python-${doc.id}`,
          label: `Python Script: ${doc.title}`,
          category: 'Recent Activity / Python Files',
          icon: 'fa-brands fa-python text-cyan-400',
          isDoc: true,
          docType: 'python' as const,
          docId: doc.id
        }))
      ];

      setDynamicCommands([...smartSuggestions, ...BASE_COMMANDS, ...docCommands]);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, activeView]);

  // Handle outside click to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('mousedown', handleOutsideClick);
    }
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose]);

  // Filter commands based on search
  const filtered = dynamicCommands.filter((cmd) =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleExecute = async (cmd: CommandItem) => {
    if (cmd.isDoc) {
      if (cmd.docType === 'word') {
        onNavigate('COSMIC_WORD');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('cosmic-open-document', {
            detail: { id: cmd.docId, type: 'word' }
          }));
        }, 150);
      } else if (cmd.docType === 'excel') {
        onNavigate('COSMIC_EXCEL');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('cosmic-open-document', {
            detail: { id: cmd.docId, type: 'excel' }
          }));
        }, 150);
      } else if (cmd.docType === 'python') {
        onNavigate('PYTHON');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('cosmic-open-document', {
            detail: { id: cmd.docId, type: 'python' }
          }));
        }, 150);
      }
      onClose();
      return;
    }

    switch (cmd.id) {
      case 'go-home':
        onNavigateHome();
        onClose();
        break;
      case 'open-oracle':
        onNavigate('COSMIC_LINK');
        onClose();
        break;
      case 'open-image':
        onNavigate('IMAGE_GEN');
        onClose();
        break;
      case 'open-banner-creator':
        onNavigate('BANNER_GEN');
        onClose();
        break;
      case 'open-certificate':
        onNavigate('COSMIC_CERTIFICATE');
        onClose();
        break;
      case 'open-country-informer':
        onNavigate('COUNTRY_INTEL');
        onClose();
        break;
      case 'open-python':
        onNavigate('PYTHON');
        onClose();
        break;
      case 'open-editor':
        onNavigate('CHAT');
        onClose();
        break;
      case 'open-excel':
        onNavigate('COSMIC_EXCEL');
        onClose();
        break;
      case 'open-word':
        onNavigate('COSMIC_WORD');
        onClose();
        break;
      case 'open-powerpoint':
        onNavigate('COSMIC_POWER_POINT');
        onClose();
        break;
      case 'open-games':
        onNavigate('GAMES');
        onClose();
        break;
      case 'open-project-maker':
        onNavigate('PROJECT_MAKER');
        onClose();
        break;
      case 'open-video-gen':
        onNavigate('VIDEO_GEN');
        onClose();
        break;
      case 'open-translator':
        onNavigate('TRANSLATOR');
        onClose();
        break;
      case 'open-dictionary':
        onNavigate('DICTIONARY');
        onClose();
        break;
      case 'open-history':
        onNavigate('HISTORY');
        onClose();
        break;
      case 'open-performance':
        onNavigate('PERFORMANCE');
        onClose();
        break;
      case 'open-architect':
        onNavigate('CHAT');
        onClose();
        break;
      case 'open-watch':
        onNavigate('COSMIC_WATCH');
        onClose();
        break;
      case 'change-theme':
        onToggleTheme();
        triggerToast('Theme changed successfully');
        break;
      case 'toggle-density': {
        const currentDensity = localStorage.getItem('quantinum_interface_density') || 'comfortable';
        const newDensity = currentDensity === 'comfortable' ? 'compact' : 'comfortable';
        localStorage.setItem('quantinum_interface_density', newDensity);
        window.dispatchEvent(new CustomEvent('cosmic-density-change', { detail: { density: newDensity } }));
        window.dispatchEvent(new CustomEvent('cosmic-notification', {
          detail: {
            title: 'Interface Density Changed',
            message: `Document layout density set to ${newDensity.toUpperCase()}`,
            type: 'info'
          }
        }));
        triggerToast(`Density: ${newDensity.toUpperCase()}`);
        onClose();
        break;
      }
      case 'clear-cache':
        try {
          await clearChatHistory();
          clearClipboard();
          // Flush local storage settings
          localStorage.removeItem('quantinum_theme');
          localStorage.removeItem('quantinum_custom_colors');
          localStorage.removeItem('quantinum_active_tasks');
          triggerToast('Cache and persistent logs purged successfully.');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } catch (err) {
          triggerToast('Failed to clear some cache sectors.');
        }
        break;
      case 'toggle-shortcuts':
        window.dispatchEvent(new CustomEvent('toggle-shortcuts'));
        onClose();
        break;

      // Smart Commands Dispatch
      case 'excel-export-csv':
        window.dispatchEvent(new CustomEvent('cosmic-excel-command', { detail: { action: 'export-csv' } }));
        triggerToast('Executed Export CSV instruction');
        onClose();
        break;
      case 'excel-sum-range':
        window.dispatchEvent(new CustomEvent('cosmic-excel-command', { detail: { action: 'sum-range' } }));
        triggerToast('Executed Sum Range instruction');
        onClose();
        break;
      case 'excel-clear':
        window.dispatchEvent(new CustomEvent('cosmic-excel-command', { detail: { action: 'clear' } }));
        triggerToast('Executed Clear Spreadsheet grid');
        onClose();
        break;
      case 'word-word-count':
        window.dispatchEvent(new CustomEvent('cosmic-word-command', { detail: { action: 'word-count' } }));
        triggerToast('Executed Word Count analysis');
        onClose();
        break;
      case 'word-export-text':
        window.dispatchEvent(new CustomEvent('cosmic-word-command', { detail: { action: 'export-text' } }));
        triggerToast('Executed Export Text instruction');
        onClose();
        break;
      case 'word-ai-proofread':
        window.dispatchEvent(new CustomEvent('cosmic-word-command', { detail: { action: 'ai-proofread' } }));
        triggerToast('Executed AI Proofreader analyzer');
        onClose();
        break;
      case 'python-run':
        window.dispatchEvent(new CustomEvent('cosmic-python-command', { detail: { action: 'run' } }));
        triggerToast('Executed Sandbox code runner');
        onClose();
        break;
      case 'python-reset':
        window.dispatchEvent(new CustomEvent('cosmic-python-command', { detail: { action: 'reset' } }));
        triggerToast('Reset python sandbox code');
        onClose();
        break;
      case 'chat-clear':
        window.dispatchEvent(new CustomEvent('cosmic-chat-command', { detail: { action: 'clear' } }));
        triggerToast('Cleared active thread conversation');
        onClose();
        break;
      case 'chat-copy':
        window.dispatchEvent(new CustomEvent('cosmic-chat-command', { detail: { action: 'copy' } }));
        triggerToast('Copied latest message response');
        onClose();
        break;
      case 'banner-export':
        window.dispatchEvent(new CustomEvent('cosmic-banner-command', { detail: { action: 'export' } }));
        triggerToast('Downloaded banner graphic asset');
        onClose();
        break;

      default:
        break;
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[activeIndex]) {
          handleExecute(filtered[activeIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeIndex, filtered]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 md:p-10 animate-fade-in select-none">
      <div 
        ref={containerRef}
        className="w-full max-w-2xl bg-slate-900/90 border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500"></div>

        {/* Input area */}
        <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-white/5">
          <i className="fa-solid fa-terminal text-cyan-400 text-lg animate-pulse"></i>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Type a command or search action..."
            className="flex-1 bg-transparent text-white text-base focus:outline-none placeholder-white/30 font-mono"
          />
          <span className="text-[9px] bg-white/10 px-2 py-1 rounded-md text-white/40 font-mono tracking-widest uppercase">
            Esc to exit
          </span>
        </div>

        {/* Action Lists */}
        <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-3 space-y-1">
          {filtered.length > 0 ? (
            filtered.map((cmd, idx) => {
              const isSelected = idx === activeIndex;
              const isSmart = cmd.category.startsWith('Smart');
              return (
                <button
                  key={cmd.id}
                  onClick={() => handleExecute(cmd)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all text-left ${
                    isSelected 
                      ? 'bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 text-white shadow-lg' 
                      : isSmart
                        ? 'bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/10 text-cyan-100 hover:text-white'
                        : 'hover:bg-white/5 border border-transparent text-white/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
                      isSelected 
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' 
                        : isSmart
                          ? 'bg-cyan-950/40 border-cyan-500/20 text-cyan-300 animate-pulse'
                          : 'bg-white/5 border-white/10 text-white/40'
                    }`}>
                      <i className={`fa-solid ${cmd.icon} text-sm`}></i>
                    </div>
                    <div>
                      <div className="text-xs font-bold font-sans tracking-wide flex items-center gap-2">
                        {cmd.label}
                        {isSmart && (
                          <span className="text-[7px] font-mono bg-cyan-500/20 border border-cyan-400/30 text-cyan-400 px-1 py-0.5 rounded tracking-widest uppercase font-black">
                            Smart Suggestion
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] font-mono text-white/30 uppercase mt-0.5 tracking-wider">{cmd.category}</div>
                    </div>
                  </div>
                  {cmd.shortcut && (
                    <span className="text-[8px] font-mono border border-white/10 rounded px-1.5 py-0.5 text-white/40 uppercase">
                      {cmd.shortcut}
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="text-center py-8 text-white/30 font-mono text-xs uppercase tracking-widest">
              No system commands matched "{search}"
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-3.5 bg-black/40 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-white/40 tracking-wider">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><i className="fa-solid fa-arrow-down-up-across-line text-[10px]"></i> Move</span>
            <span className="flex items-center gap-1.5"><i className="fa-solid fa-turn-down text-[10px] rotate-90"></i> Execute</span>
          </div>
          <span className="uppercase text-cyan-500/70 font-bold">Quantinum Core OS Command Hub v1.1</span>
        </div>

        {/* Toast Notification inside modal */}
        {toastMessage && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] uppercase tracking-widest font-bold rounded-full shadow-2xl animate-fade-in flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
};
