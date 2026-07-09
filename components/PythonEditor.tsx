import React, { useState, useEffect, useRef } from 'react';
import { getPythonDocuments, savePythonDocument, PythonDocument } from '../services/documentStorage';
import { getSetting } from '../services/indexedDBCache';

declare global {
  interface Window {
    loadPyodide: any;
  }
}

export const PythonEditor: React.FC = () => {
  const [docs, setDocs] = useState<PythonDocument[]>([]);
  const [activeId, setActiveId] = useState<string>('python-neural-net');
  const [title, setTitle] = useState<string>('Neural Net Lab');
  const [code, setCode] = useState<string>('');
  
  const [output, setOutput] = useState<string>('');
  const [pyodide, setPyodide] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const outputRef = useRef<HTMLDivElement>(null);

  // Initialize Pyodide
  useEffect(() => {
    async function initPyodide() {
      try {
        if (!window.loadPyodide) {
           console.error("Pyodide script not loaded correctly.");
           setIsLoading(false);
           return;
        }
        const py = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/",
        });
        setPyodide(py);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load Pyodide:", err);
        setIsLoading(false);
      }
    }
    initPyodide();
  }, []);

  // Sync scroll on console output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const hasRecoveredRef = useRef(false);

  // Load and cache documents
  useEffect(() => {
    const pyDocs = getPythonDocuments();
    setDocs(pyDocs);
    
    if (!hasRecoveredRef.current) {
      hasRecoveredRef.current = true;
      getSetting<any>('autosave_active_tool_state').then(autosave => {
        if (autosave && autosave.type === 'python') {
          setActiveId(autosave.id);
          setCode(autosave.code || '');
          setTitle(autosave.title || 'Untitled Script');
          
          window.dispatchEvent(new CustomEvent('cosmic-notification', {
            detail: {
              title: 'Auto-Recovery Active',
              message: `Workspace restored successfully! Unsaved script "${autosave.title || 'Untitled Script'}" loaded.`,
              type: 'success'
            }
          }));
        } else {
          const found = pyDocs.find(d => d.id === activeId);
          if (found) {
            setCode(found.code);
            setTitle(found.title);
          } else if (pyDocs.length > 0) {
            setActiveId(pyDocs[0].id);
            setCode(pyDocs[0].code);
            setTitle(pyDocs[0].title);
          }
        }
      });
    } else {
      const found = pyDocs.find(d => d.id === activeId);
      if (found) {
        setCode(found.code);
        setTitle(found.title);
      }
    }
  }, [activeId]);

  // Listen for global open document events
  useEffect(() => {
    const handleOpenDoc = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.type === 'python') {
        const pyDocs = getPythonDocuments();
        const found = pyDocs.find(d => d.id === customEvent.detail.id);
        if (found) {
          setActiveId(found.id);
          setCode(found.code);
          setTitle(found.title);
        }
      }
    };
    window.addEventListener('cosmic-open-document', handleOpenDoc);
    return () => window.removeEventListener('cosmic-open-document', handleOpenDoc);
  }, []);

  // Listen for IndexedDB auto-save trigger
  useEffect(() => {
    const handleAutosaveRequest = () => {
      import('../services/indexedDBCache').then(({ saveSetting }) => {
        saveSetting('autosave_active_tool_state', {
          type: 'python',
          id: activeId,
          title: title || 'Untitled Script',
          code: code,
          timestamp: Date.now()
        }).then(() => {
          window.dispatchEvent(new CustomEvent('cosmic-notification', {
            detail: {
              title: 'Auto-Save Synchronized',
              message: `Auto-saved "${title || 'Untitled Script'}" to IndexedDB secure cache.`,
              type: 'success'
            }
          }));
          window.dispatchEvent(new CustomEvent('cosmic-health-api-call', {
            detail: { api: 'IndexedDB.saveSetting (Auto-save Python)', status: 'Success' }
          }));
        });
      });
    };
    window.addEventListener('cosmic-request-autosave', handleAutosaveRequest);
    return () => window.removeEventListener('cosmic-request-autosave', handleAutosaveRequest);
  }, [activeId, title, code]);

  const handleSave = (currentCode = code, currentTitle = title) => {
    const updated: PythonDocument = {
      id: activeId,
      title: currentTitle || 'Untitled Script',
      code: currentCode,
      updatedAt: Date.now()
    };
    savePythonDocument(updated);
    setDocs(getPythonDocuments());
  };

  const handleCreateNew = () => {
    const pyDocs = getPythonDocuments();
    const newId = `python-script-${Date.now()}`;
    const newTitle = `Untitled Script ${pyDocs.length + 1}`;
    const newDoc: PythonDocument = {
      id: newId,
      title: newTitle,
      code: `# ${newTitle}\nimport sys\n\nprint("Hello from custom script!")\n`,
      updatedAt: Date.now()
    };
    savePythonDocument(newDoc);
    setDocs(getPythonDocuments());
    setActiveId(newId);
    setCode(newDoc.code);
    setTitle(newDoc.title);
  };

  const runCode = async () => {
    if (!pyodide || isRunning) return;
    
    // Auto-save before running
    handleSave(code, title);

    setIsRunning(true);
    setOutput(prev => prev + "\n> Executing script...\n");

    try {
      // Setup stdout redirection
      pyodide.runPython(`
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
      `);

      await pyodide.runPythonAsync(code);

      const stdout = pyodide.runPython("sys.stdout.getvalue()");
      const stderr = pyodide.runPython("sys.stderr.getvalue()");

      if (stdout) setOutput(prev => prev + stdout);
      if (stderr) setOutput(prev => prev + "\nERROR:\n" + stderr);
      if (!stdout && !stderr) setOutput(prev => prev + "(No output)\n");

    } catch (err: any) {
      setOutput(prev => prev + `\nSYSTEM FAILURE:\n${err.message}\n`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearOutput = () => setOutput('');

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xl">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-t-2 border-cyan-500 animate-spin"></div>
          <i className="fa-brands fa-python absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl text-cyan-400"></i>
        </div>
        <p className="mt-6 text-sm font-black uppercase tracking-[0.5em] text-cyan-400/60 animate-pulse">Initializing Python Core</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-black/20 font-mono">
      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between bg-white/5 gap-3">
        <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
          <button 
            onClick={runCode}
            disabled={isRunning}
            className={`px-6 py-1.5 rounded-lg flex items-center gap-2 transition-all font-black uppercase tracking-widest text-[10px] shrink-0 ${
              isRunning 
                ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
            }`}
          >
            <i className={`fas ${isRunning ? 'fa-spinner fa-spin' : 'fa-play'}`}></i>
            {isRunning ? 'Running' : 'Run Script'}
          </button>
          <button 
            onClick={clearOutput}
            className="px-4 py-1.5 rounded-lg bg-white/5 text-white/40 border border-white/10 hover:text-white hover:bg-white/10 transition-all font-black uppercase tracking-widest text-[10px] shrink-0"
          >
            Clear Console
          </button>
          
          <div className="h-6 w-px bg-white/10 shrink-0"></div>

          <button 
            onClick={handleCreateNew}
            className="px-4 py-1.5 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all font-black uppercase tracking-widest text-[10px] shrink-0"
          >
            <i className="fa-solid fa-plus mr-1"></i> New Script
          </button>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={activeId}
            onChange={(e) => setActiveId(e.target.value)}
            className="bg-black/40 border border-white/10 text-white text-xs px-3 py-1.5 rounded-lg font-mono focus:outline-none focus:border-cyan-500 max-w-[150px] truncate"
          >
            {docs.map(d => (
              <option key={d.id} value={d.id} className="bg-slate-900 text-white">{d.title}</option>
            ))}
          </select>

          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              handleSave(code, e.target.value);
            }}
            placeholder="Script Name"
            className="bg-black/20 border border-white/5 text-white text-xs px-3 py-1.5 rounded-lg font-mono focus:outline-none focus:border-cyan-500 w-36 max-w-[150px]"
          />

          <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-md hidden lg:block shrink-0">
            <span className="text-[9px] text-blue-400 font-black uppercase tracking-widest">Environment: WASM</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10 overflow-hidden">
        {/* Editor Area */}
        <div className="flex-1 flex flex-col h-1/2 md:h-full bg-black/40">
           <div className="px-4 py-1 border-b border-white/5 bg-white/5 flex items-center gap-2">
              <i className="fa-solid fa-code text-[10px] text-cyan-400"></i>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Source Code</span>
           </div>
           <textarea
             value={code}
             onChange={(e) => {
               setCode(e.target.value);
               handleSave(e.target.value, title);
             }}
             spellCheck={false}
             className="flex-1 w-full bg-transparent p-6 text-sm leading-relaxed text-cyan-50/90 outline-none resize-none custom-scrollbar font-mono selection:bg-cyan-500/30"
             placeholder="Enter Python code here..."
           />
        </div>

        {/* Output Console */}
        <div className="flex-1 flex flex-col h-1/2 md:h-full bg-black/60">
           <div className="px-4 py-1 border-b border-white/5 bg-white/5 flex items-center gap-2">
              <i className="fa-solid fa-terminal text-[10px] text-emerald-400"></i>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Quantinum Console</span>
           </div>
           <div 
             ref={outputRef}
             className="flex-1 p-6 text-sm text-emerald-400/90 whitespace-pre-wrap overflow-y-auto custom-scrollbar leading-relaxed font-mono"
           >
             {output || ">>> System idle. Standing by for script execution."}
             {isRunning && <span className="inline-block w-2 h-4 bg-emerald-400 ml-1 animate-pulse"></span>}
           </div>
        </div>
      </div>
    </div>
  );
};
