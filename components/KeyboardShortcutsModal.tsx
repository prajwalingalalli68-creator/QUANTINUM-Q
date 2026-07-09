import React, { useState } from 'react';

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'keyboard' | 'voice' | 'macros'>('keyboard');
  const [searchQuery, setSearchQuery] = useState('');

  const [macros, setMacros] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('quantinum_voice_macros');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'macro-1',
        name: 'prepare reading',
        actions: ['Launch Word', 'Open Recent File', 'Start Reading']
      }
    ];
  });

  const [newMacroName, setNewMacroName] = useState('');
  const [newMacroSteps, setNewMacroSteps] = useState<string[]>(['Launch Word', 'Open Recent File', 'Start Reading']);
  const [isCreating, setIsCreating] = useState(false);

  const AVAILABLE_ACTIONS = [
    'Launch Word',
    'Open Recent File',
    'Start Reading',
    'Launch Excel',
    'Launch Python',
    'Go to Home',
    'Activate Focus / DND'
  ];

  const handleSaveMacro = () => {
    if (!newMacroName.trim()) {
      window.dispatchEvent(new CustomEvent('cosmic-notification', {
        detail: { title: 'Input Needed', message: 'Please specify a voice trigger phrase.', type: 'info' }
      }));
      return;
    }
    const cleanSteps = newMacroSteps.filter(s => s && AVAILABLE_ACTIONS.includes(s));
    if (cleanSteps.length === 0) {
      window.dispatchEvent(new CustomEvent('cosmic-notification', {
        detail: { title: 'No Steps Selected', message: 'Please configure at least one macro action step.', type: 'info' }
      }));
      return;
    }

    const newMacro = {
      id: 'macro-' + Date.now(),
      name: newMacroName.trim().toLowerCase(),
      actions: cleanSteps
    };

    const updated = [...macros, newMacro];
    setMacros(updated);
    localStorage.setItem('quantinum_voice_macros', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('cosmic-macros-update', { detail: updated }));
    
    // reset form
    setNewMacroName('');
    setNewMacroSteps(['Launch Word', 'Open Recent File', 'Start Reading']);
    setIsCreating(false);

    window.dispatchEvent(new CustomEvent('cosmic-notification', {
      detail: {
        title: 'Voice Macro Saved',
        message: `Speak "${newMacro.name}" when voice nav is active to trigger.`,
        type: 'success'
      }
    }));
  };

  const handleDeleteMacro = (id: string) => {
    const updated = macros.filter(m => m.id !== id);
    setMacros(updated);
    localStorage.setItem('quantinum_voice_macros', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('cosmic-macros-update', { detail: updated }));

    window.dispatchEvent(new CustomEvent('cosmic-notification', {
      detail: {
        title: 'Macro Deleted',
        message: 'Voice macro removed successfully.',
        type: 'info'
      }
    }));
  };

  const shortcuts = [
    { key: 'Shift + ?', description: 'Show this shortcuts menu' },
    { key: 'Esc', description: 'Close current view or modal' },
    { key: 'Ctrl + /', description: 'Toggle Voice Navigation' },
    { key: 'Ctrl + H', description: 'Return to Home Screen' },
    { key: 'Alt + T', description: 'Switch Theme' },
    { key: 'Alt + S', description: 'Trigger Omni Search' },
  ];

  const voiceCommands = [
    { command: '"go home", "home"', description: 'Navigate to the Home screen' },
    { command: '"open shortcuts", "keyboard shortcuts"', description: 'Open this shortcuts and voice command menu' },
    { command: '"close modal", "go back", "back"', description: 'Close this shortcuts menu or go back' },
    { command: '"word", "document"', description: 'Launch Cosmic Word editor' },
    { command: '"excel", "spreadsheet", "sheet"', description: 'Launch Cosmic Excel spreadsheets' },
    { command: '"powerpoint", "presentation"', description: 'Launch Cosmic PowerPoint slides' },
    { command: '"python", "code"', description: 'Launch Python compiler and code environment' },
    { command: '"image", "picture", "generate image"', description: 'Open AI Image Generator' },
    { command: '"video", "generate video"', description: 'Open AI Video Generator' },
    { command: '"banner", "banner creator"', description: 'Open Cosmic Banner Creator' },
    { command: '"translate", "translator"', description: 'Open Language Translator' },
    { command: '"dictionary", "word meaning"', description: 'Open Dictionary & word search tool' },
    { command: '"country", "country informer"', description: 'Open Country Intelligence informer' },
    { command: '"oracle", "link"', description: 'Open Oracle Cosmic Link portal' },
    { command: '"exam", "paper", "question paper"', description: 'Open Exam Question Paper generator' },
    { command: '"watch", "clock", "time"', description: 'Open Cosmic Watch / Time' },
    { command: '"history", "log"', description: 'View application event log & history' },
    { command: '"chat", "assistant", "ask"', description: 'Start high-fidelity chat assistant' },
    { command: '"theme", "customize", "color"', description: 'Open theme customizer settings' },
    { command: '"performance", "telemetry", "metrics"', description: 'Open System Telemetry diagnostics' },
    { command: '"game", "chess", "ludo", "tic tac toe"', description: 'Open Retro Game Zone' },
  ];

  const filteredShortcuts = shortcuts.filter(s => 
    s.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVoice = voiceCommands.filter(v => 
    v.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.command.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-slate-700/60 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-white/50 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5"
        >
          <i className="fas fa-times text-lg"></i>
        </button>

        <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-4 flex items-center gap-3">
          <i className="fas fa-terminal text-cyan-400"></i>
          Command Center
        </h2>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 mb-4">
          <button
            onClick={() => { setActiveTab('keyboard'); setSearchQuery(''); }}
            className={`flex-1 pb-3 text-xs md:text-sm font-bold tracking-widest uppercase transition-colors relative ${
              activeTab === 'keyboard' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Keyboard
            {activeTab === 'keyboard' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full"></div>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('voice'); setSearchQuery(''); }}
            className={`flex-1 pb-3 text-xs md:text-sm font-bold tracking-widest uppercase transition-colors relative flex items-center justify-center gap-2 ${
              activeTab === 'voice' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fas fa-microphone text-xs"></i>
            Voice Cheat Sheet
            {activeTab === 'voice' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full"></div>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('macros'); setSearchQuery(''); }}
            className={`flex-1 pb-3 text-xs md:text-sm font-bold tracking-widest uppercase transition-colors relative flex items-center justify-center gap-2 ${
              activeTab === 'macros' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fas fa-bolt text-xs"></i>
            Macros Builder
            {activeTab === 'macros' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full"></div>
            )}
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'keyboard' ? "Search keys..." : activeTab === 'voice' ? "Search spoken commands..." : "Search custom macros..."}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors font-mono"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-mono"
            >
              CLEAR
            </button>
          )}
        </div>

        {activeTab === 'voice' && (
          <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-2xl p-3 mb-4 flex gap-2.5 items-start">
            <i className="fas fa-microphone-lines text-cyan-400 mt-0.5 text-xs"></i>
            <div className="text-[10px] font-mono leading-relaxed text-slate-400">
              <span className="text-cyan-300 font-bold block uppercase tracking-wider mb-0.5">Vocal Assistant Cheat Sheet</span>
              Speak these commands while Voice Navigation is active to pilot the desktop or open individual workspaces directly.
            </div>
          </div>
        )}

        {/* Content Container */}
        <div className="overflow-y-auto space-y-2.5 pr-1 custom-scrollbar max-h-[50vh]">
          {activeTab === 'keyboard' ? (
            filteredShortcuts.length > 0 ? (
              filteredShortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between bg-slate-950/50 p-3 rounded-2xl border border-slate-800/60 hover:border-slate-700/60 transition-colors">
                  <span className="text-xs font-mono text-slate-300 font-medium">{shortcut.description}</span>
                  <span className="bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 text-[10px] font-bold text-cyan-400 tracking-wider font-mono">
                    {shortcut.key}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 font-mono text-xs">
                No shortcuts match your search.
              </div>
            )
          ) : activeTab === 'voice' ? (
            filteredVoice.length > 0 ? (
              filteredVoice.map((voice, index) => (
                <div key={index} className="flex flex-col gap-1.5 bg-slate-950/50 p-3 rounded-2xl border border-slate-800/60 hover:border-slate-700/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-cyan-400 font-mono tracking-wider uppercase">
                      Spoken Phrase
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                  </div>
                  <div className="text-xs font-mono text-indigo-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-semibold leading-relaxed">
                    {voice.command}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 px-1 mt-0.5">
                    {voice.description}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 font-mono text-xs">
                No voice commands match your search.
              </div>
            )
          ) : (
            /* Voice Macros Builder View */
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-xs font-bold text-cyan-400 block tracking-wider uppercase font-mono">Custom Actions Sequencer</span>
                  <p className="text-[10px] text-slate-400 font-mono leading-relaxed mt-0.5">
                    Define custom voice triggers that execute a chain of workspace actions.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreating(!isCreating)}
                  className={`px-3 py-1.5 rounded-xl font-bold font-mono text-[10px] tracking-wider transition-all uppercase ${
                    isCreating ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                  }`}
                >
                  {isCreating ? 'Cancel' : 'Add Macro'}
                </button>
              </div>

              {isCreating ? (
                <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl flex flex-col gap-3.5 animate-fade-in">
                  <div>
                    <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase font-mono block mb-1.5">
                      1. Spoken Trigger Name
                    </label>
                    <input
                      type="text"
                      value={newMacroName}
                      onChange={e => setNewMacroName(e.target.value)}
                      placeholder="e.g. 'daily routine', 'morning digest'"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono font-medium"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase font-mono">
                        2. Action Sequences ({newMacroSteps.length})
                      </label>
                      <button
                        onClick={() => setNewMacroSteps([...newMacroSteps, AVAILABLE_ACTIONS[0]])}
                        className="text-[9px] font-bold text-cyan-400 font-mono hover:text-cyan-300 transition-colors"
                      >
                        + Add Step
                      </button>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                      {newMacroSteps.map((step, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <span className="text-[10px] font-mono text-slate-500 w-12 flex-shrink-0">Step {idx + 1}:</span>
                          <select
                            value={step}
                            onChange={e => {
                              const next = [...newMacroSteps];
                              next[idx] = e.target.value;
                              setNewMacroSteps(next);
                            }}
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                          >
                            {AVAILABLE_ACTIONS.map(action => (
                              <option key={action} value={action}>{action}</option>
                            ))}
                          </select>
                          {newMacroSteps.length > 1 && (
                            <button
                              onClick={() => setNewMacroSteps(newMacroSteps.filter((_, i) => i !== idx))}
                              className="p-1.5 text-rose-400 hover:text-rose-300 transition-colors"
                              title="Delete step"
                            >
                              <i className="fas fa-trash-alt text-xs"></i>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleSaveMacro}
                    className="w-full py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-black font-mono text-xs rounded-xl tracking-wider uppercase transition-all"
                  >
                    Save Custom Voice Macro
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1 custom-scrollbar">
                  {macros
                    .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((macro) => (
                      <div key={macro.id} className="bg-slate-950/30 p-4 rounded-2xl border border-slate-800/80 flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold text-cyan-400 font-mono bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              Trigger Phrase
                            </span>
                            <span className="text-xs font-mono font-black text-indigo-300 truncate">
                              "{macro.name}"
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {macro.actions.map((act: string, aIdx: number) => (
                              <React.Fragment key={aIdx}>
                                <span className="bg-slate-900/90 border border-slate-800 px-2 py-1 rounded-lg text-[9px] font-bold font-mono text-slate-300">
                                  {act}
                                </span>
                                {aIdx < macro.actions.length - 1 && (
                                  <i className="fas fa-chevron-right text-[8px] text-slate-600"></i>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>

                        {/* System macros cannot be deleted, but custom can */}
                        {macro.id !== 'macro-1' && (
                          <button
                            onClick={() => handleDeleteMacro(macro.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                            title="Delete custom macro"
                          >
                            <i className="fas fa-trash text-xs"></i>
                          </button>
                        )}
                      </div>
                    ))}
                  {macros.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <div className="text-center py-8 text-slate-500 font-mono text-xs">
                      No macros found matching your search.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {activeTab !== 'keyboard' && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 flex items-center gap-2">
            <i className="fas fa-info-circle text-cyan-400"></i>
            <span>Press <kbd className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-[9px]">Ctrl + /</kbd> to toggle voice navigation directly.</span>
          </div>
        )}
      </div>
    </div>
  );
};
