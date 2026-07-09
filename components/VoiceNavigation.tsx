import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from '../types';

interface VoiceNavigationProps {
  onNavigate: (state: AppState) => void;
  onNavigateHome: () => void;
}

export const VoiceNavigation: React.FC<VoiceNavigationProps> = ({ onNavigate, onNavigateHome }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);

  // Dragging state
  const [position, setPosition] = useState({ x: window.innerWidth - 80, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 80),
        y: Math.min(prev.y, window.innerHeight - 80)
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setHasMoved(false);
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging && dragRef.current) {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        setHasMoved(true);
      }
      setPosition({
        x: Math.min(Math.max(0, dragRef.current.initialX + dx), window.innerWidth - 60),
        y: Math.min(Math.max(0, dragRef.current.initialY + dy), window.innerHeight - 60)
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  useEffect(() => {
    // Initialize SpeechRecognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const last = event.results.length - 1;
        const command = event.results[last][0].transcript.toLowerCase();
        setTranscript(command);
        handleCommand(command);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    } else {
      console.warn('Web Speech API is not supported in this browser.');
    }
  }, []);

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

  useEffect(() => {
    const handleMacrosUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setMacros(customEvent.detail);
      }
    };
    window.addEventListener('cosmic-macros-update', handleMacrosUpdate);
    return () => window.removeEventListener('cosmic-macros-update', handleMacrosUpdate);
  }, []);

  const runMacroActions = useCallback(async (actions: string[]) => {
    window.dispatchEvent(new CustomEvent('cosmic-notification', {
      detail: {
        title: 'Executing Macro Sequence',
        message: `Running ${actions.length} sequential operations hands-free.`,
        type: 'info'
      }
    }));

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      
      // Flash small visual indicator
      window.dispatchEvent(new CustomEvent('cosmic-notification', {
        detail: {
          title: `Step ${i + 1} of ${actions.length}`,
          message: `Running: ${action}...`,
          type: 'info'
        }
      }));

      if (action === 'Launch Word') {
        onNavigate('COSMIC_WORD');
      } else if (action === 'Launch Excel') {
        onNavigate('COSMIC_EXCEL');
      } else if (action === 'Launch Python') {
        onNavigate('PYTHON');
      } else if (action === 'Go to Home') {
        onNavigateHome();
      } else if (action === 'Open Recent File') {
        window.dispatchEvent(new Event('cosmic-open-recent-word'));
      } else if (action === 'Start Reading') {
        window.dispatchEvent(new Event('cosmic-start-reading'));
      } else if (action === 'Activate Focus / DND') {
        window.dispatchEvent(new CustomEvent('cosmic-set-dnd', { detail: { dnd: true } }));
      }

      if (i < actions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1800));
      }
    }
  }, [onNavigate, onNavigateHome]);

  const handleCommand = useCallback((commandStr: string) => {
    const command = commandStr.trim().toLowerCase();
    
    // Check if command matches any macro name (e.g. "prepare reading" or custom trigger name)
    const matchedMacro = macros.find(m => command === m.name.toLowerCase() || command.includes(m.name.toLowerCase()));
    if (matchedMacro) {
      runMacroActions(matchedMacro.actions);
      return;
    }

    if (command.includes('home') || command.includes('go to home') || command.includes('go home')) {
      onNavigateHome();
      return;
    }
    
    // Interface control commands
    if (command.includes('show shortcuts') || command.includes('open shortcuts') || command.includes('keyboard shortcuts')) {
      window.dispatchEvent(new CustomEvent('open-shortcuts'));
      return;
    }
    if (command.includes('hide shortcuts') || command.includes('close shortcuts') || command.includes('close modal') || command.includes('go back') || command.includes('back')) {
      window.dispatchEvent(new CustomEvent('close-shortcuts'));
      return;
    }

    // Map spoken words to AppState View modes
    if (command.includes('word') || command.includes('document')) onNavigate('COSMIC_WORD');
    else if (command.includes('excel') || command.includes('spreadsheet') || command.includes('sheet')) onNavigate('COSMIC_EXCEL');
    else if (command.includes('power point') || command.includes('presentation') || command.includes('powerpoint')) onNavigate('COSMIC_POWER_POINT');
    else if (command.includes('python') || command.includes('code editor') || command.includes('code')) onNavigate('PYTHON');
    else if (command.includes('image') || command.includes('picture') || command.includes('generate image')) onNavigate('IMAGE_GEN');
    else if (command.includes('video') || command.includes('generate video')) onNavigate('VIDEO_GEN');
    else if (command.includes('banner') || command.includes('banner creator')) onNavigate('BANNER_GEN');
    else if (command.includes('translator') || command.includes('translate')) onNavigate('TRANSLATOR');
    else if (command.includes('dictionary') || command.includes('word meaning')) onNavigate('DICTIONARY');
    else if (command.includes('country') || command.includes('country informer')) onNavigate('COUNTRY_INTEL');
    else if (command.includes('link') || command.includes('oracle')) onNavigate('COSMIC_LINK');
    else if (command.includes('paper') || command.includes('exam') || command.includes('question paper')) onNavigate('QUESTION_PAPER');
    else if (command.includes('watch') || command.includes('clock') || command.includes('time')) onNavigate('COSMIC_WATCH');
    else if (command.includes('history') || command.includes('log')) onNavigate('HISTORY');
    else if (command.includes('chat') || command.includes('assistant') || command.includes('ask')) onNavigate('CHAT');
    else if (command.includes('theme') || command.includes('customize') || command.includes('color')) onNavigate('THEMES');
    else if (command.includes('performance') || command.includes('dashboard') || command.includes('telemetry') || command.includes('metrics')) onNavigate('PERFORMANCE');
    else if (command.includes('game') || command.includes('chess') || command.includes('ludo') || command.includes('tic tac toe') || command.includes('games')) onNavigate('GAMES');

  }, [onNavigate, onNavigateHome]);

  const toggleListen = () => {
    if (hasMoved) return; // Prevent toggle if dragging
    if (!recognition) {
      alert('Your browser does not support Voice Navigation (Web Speech API).');
      return;
    }
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
        setTranscript('');
      } catch (e) {
        console.error("Speech recognition error:", e);
      }
    }
  };

  return (
    <div 
      className="fixed z-50 flex flex-col items-end gap-3 pointer-events-none"
      style={{ left: position.x, top: position.y }}
    >
      <div className="flex items-center gap-3">
        {isListening && (
          <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/60 p-4 rounded-2xl w-64 shadow-2xl pointer-events-auto text-xs flex flex-col gap-2 mr-2 animate-fade-in">
            <div className="font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5 border-b border-white/10 pb-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              Hands-Free Assistant
            </div>
            <ul className="space-y-1.5 font-mono text-white/70">
              <li>• <span className="text-indigo-400">"open [word / excel / python]"</span></li>
              <li>• <span className="text-indigo-400">"open [games / performance]"</span></li>
              <li>• <span className="text-indigo-400">"open theme settings"</span></li>
              <li>• <span className="text-indigo-400">"show / hide shortcuts"</span></li>
              <li>• <span className="text-indigo-400">"go home"</span> / <span className="text-indigo-400">"back"</span></li>
            </ul>
          </div>
        )}

        <div 
          className="relative pointer-events-auto touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {isListening && (
            <>
              <div className="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-75"></div>
              <div className="absolute -inset-2 bg-rose-500/30 rounded-full animate-pulse"></div>
            </>
          )}
          <button 
            onClick={toggleListen}
            className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-2xl shadow-[0_0_20px_rgba(0,0,0,0.3)] cursor-move ${
              isListening 
                ? 'bg-rose-500 scale-110 hover:bg-rose-600' 
                : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-105'
            }`}
            title={isListening ? "Listening... Click to stop" : "Voice Navigation"}
          >
            <i className={`fas fa-microphone text-white text-xl ${isListening ? 'animate-bounce' : ''}`}></i>
          </button>
        </div>
      </div>
      {transcript && (
        <div className="bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-mono border border-white/20 animate-fade-in shadow-2xl mr-2">
          "{transcript}"
        </div>
      )}
    </div>
  );
};
