
import React, { useState, useEffect } from 'react';
import { generateResponse, checkGrammar } from '../services/gemini';
import { FileText, Sparkles, Download, Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Plus, Copy, Check, SpellCheck, X, FolderOpen, Trash2, Volume2 } from 'lucide-react';
import { getWordDocuments, saveWordDocument, deleteWordDocument, addClipboardItem, WordDocument } from '../services/documentStorage';
import { getSetting } from '../services/indexedDBCache';

interface CosmicWordProps {
  initialContent?: string;
}

interface GrammarSuggestion {
  original: string;
  suggested: string;
  explanation: string;
}

export const CosmicWord: React.FC<CosmicWordProps> = ({ initialContent = '' }) => {
  const [savedDocs, setSavedDocs] = useState<WordDocument[]>([]);
  const [docId, setDocId] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [title, setTitle] = useState<string>('Untitled Document');
  const [isGenerating, setIsGenerating] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [suggestions, setSuggestions] = useState<GrammarSuggestion[]>([]);
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showDocSelector, setShowDocSelector] = useState(false);

  const [density, setDensity] = useState<'comfortable' | 'compact'>(() => {
    return (localStorage.getItem('quantinum_interface_density') as 'comfortable' | 'compact') || 'comfortable';
  });

  useEffect(() => {
    const handleDensityChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.density) {
        setDensity(customEvent.detail.density);
      }
    };
    window.addEventListener('cosmic-density-change', handleDensityChange);
    return () => window.removeEventListener('cosmic-density-change', handleDensityChange);
  }, []);

  // Initialize and load saved documents
  useEffect(() => {
    const docs = getWordDocuments();
    setSavedDocs(docs);
    
    getSetting<any>('autosave_active_tool_state').then(autosave => {
      if (autosave && autosave.type === 'word') {
        setDocId(autosave.id);
        setTitle(autosave.title || 'Untitled Document');
        setContent(autosave.content || '');
        
        window.dispatchEvent(new CustomEvent('cosmic-notification', {
          detail: {
            title: 'Auto-Recovery Active',
            message: `Workspace restored successfully! Unsaved document "${autosave.title || 'Untitled Document'}" loaded.`,
            type: 'success'
          }
        }));
      } else if (initialContent) {
        const newId = 'doc-' + Date.now();
        setDocId(newId);
        setTitle('AI Document');
        setContent(initialContent);
      } else if (docs.length > 0) {
        setDocId(docs[0].id);
        setTitle(docs[0].title);
        setContent(docs[0].content);
      } else {
        const newId = 'doc-' + Date.now();
        setDocId(newId);
        setTitle('Untitled Document');
        setContent('');
      }
    });
  }, [initialContent]);

  // Handle auto-saving to local storage
  useEffect(() => {
    if (!docId) return;
    const timeout = setTimeout(() => {
      saveWordDocument({
        id: docId,
        title: title || 'Untitled Document',
        content: content,
        updatedAt: Date.now()
      });
      // Refresh documents list
      setSavedDocs(getWordDocuments());
    }, 800);
    return () => clearTimeout(timeout);
  }, [docId, title, content]);

  // Listen for IndexedDB auto-save trigger
  useEffect(() => {
    const handleAutosaveRequest = () => {
      import('../services/indexedDBCache').then(({ saveSetting }) => {
        saveSetting('autosave_active_tool_state', {
          type: 'word',
          id: docId,
          title: title || 'Untitled Document',
          content: content,
          timestamp: Date.now()
        }).then(() => {
          window.dispatchEvent(new CustomEvent('cosmic-notification', {
            detail: {
              title: 'Auto-Save Synchronized',
              message: `Auto-saved "${title || 'Untitled Document'}" to IndexedDB secure cache.`,
              type: 'success'
            }
          }));
          window.dispatchEvent(new CustomEvent('cosmic-health-api-call', {
            detail: { api: 'IndexedDB.saveSetting (Auto-save Word)', status: 'Success' }
          }));
        });
      });
    };
    window.addEventListener('cosmic-request-autosave', handleAutosaveRequest);
    return () => window.removeEventListener('cosmic-request-autosave', handleAutosaveRequest);
  }, [docId, title, content]);

  // Listen for paste event from Clipboard Manager
  useEffect(() => {
    const handlePaste = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.text) {
        const textToPaste = customEvent.detail.text;
        setContent(prev => {
          if (!prev) return textToPaste;
          return prev + '\n' + textToPaste;
        });
      }
    };
    window.addEventListener('cosmic-paste', handlePaste);
    return () => window.removeEventListener('cosmic-paste', handlePaste);
  }, []);

  // Listen for open most recent word doc macro trigger
  useEffect(() => {
    const handleOpenRecent = () => {
      const docs = getWordDocuments();
      if (docs.length > 0) {
        const sorted = [...docs].sort((a, b) => b.updatedAt - a.updatedAt);
        setDocId(sorted[0].id);
        setTitle(sorted[0].title);
        setContent(sorted[0].content);
        window.dispatchEvent(new CustomEvent('cosmic-notification', {
          detail: {
            title: 'Macro: Document Loaded',
            message: `Loaded your most recent file: "${sorted[0].title}".`,
            type: 'success'
          }
        }));
      } else {
        window.dispatchEvent(new CustomEvent('cosmic-notification', {
          detail: {
            title: 'Macro Action Fail',
            message: 'No saved document history found.',
            type: 'error'
          }
        }));
      }
    };
    window.addEventListener('cosmic-open-recent-word', handleOpenRecent);
    return () => window.removeEventListener('cosmic-open-recent-word', handleOpenRecent);
  }, []);

  // Listen for text-to-speech start reading macro trigger
  useEffect(() => {
    const handleStartReading = () => {
      if (!content.trim()) {
        window.dispatchEvent(new CustomEvent('cosmic-notification', {
          detail: { title: 'Read Aloud Error', message: 'No document text found to read aloud.', type: 'info' }
        }));
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      
      window.dispatchEvent(new CustomEvent('cosmic-notification', {
        detail: {
          title: 'Macro: Read Aloud Active',
          message: 'Synthesizing speech engine output for this document...',
          type: 'success'
        }
      }));
      window.speechSynthesis.speak(utterance);
    };
    window.addEventListener('cosmic-start-reading', handleStartReading);
    return () => {
      window.removeEventListener('cosmic-start-reading', handleStartReading);
      window.speechSynthesis.cancel();
    };
  }, [content]);

  // Listen for global open document event (from Search results!)
  useEffect(() => {
    const handleOpenDoc = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.type === 'word') {
        const docs = getWordDocuments();
        const found = docs.find(d => d.id === customEvent.detail.id);
        if (found) {
          setDocId(found.id);
          setTitle(found.title);
          setContent(found.content);
        }
      }
    };
    window.addEventListener('cosmic-open-document', handleOpenDoc);
    return () => window.removeEventListener('cosmic-open-document', handleOpenDoc);
  }, []);

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
  }, [content]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      addClipboardItem(content, 'word'); // Add to Clipboard Manager
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleAICompose = async () => {
    if (!content.trim()) return;
    setIsGenerating(true);
    try {
      const prompt = `Continue writing this document or improve it based on the following content: ${content}`;
      const response = await generateResponse(prompt, 'COSMIC_WORD');
      if (response) {
        setContent(prev => prev + '\n\n' + response);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAISummarize = async () => {
    if (!content.trim()) return;
    setIsGenerating(true);
    try {
      const prompt = `Summarize the following document content into a concise summary: ${content}`;
      const response = await generateResponse(prompt, 'COSMIC_WORD');
      if (response) {
        setContent(prev => "SUMMARY:\n" + response + "\n\n---\n\n" + prev);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCheckGrammar = async () => {
    if (!content.trim()) return;
    setIsCheckingGrammar(true);
    setShowSuggestions(true);
    try {
      const result = await checkGrammar(content);
      // Filter out suggestions where the original text is not found in the content
      const validSuggestions = result.filter((s: GrammarSuggestion) => content.includes(s.original));
      setSuggestions(validSuggestions);
    } catch (error) {
      console.error(error);
    } finally {
      setIsCheckingGrammar(false);
    }
  };

  const acceptSuggestion = (suggestion: GrammarSuggestion, index: number) => {
    setContent(prev => prev.replace(suggestion.original, suggestion.suggested));
    setSuggestions(prev => prev.filter((_, i) => i !== index));
  };

  const dismissSuggestion = (index: number) => {
    setSuggestions(prev => prev.filter((_, i) => i !== index));
  };

  const downloadDoc = () => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${title}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  const newDoc = () => {
    const newId = 'doc-' + Date.now();
    setDocId(newId);
    setContent('');
    setTitle('Untitled Document');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-50 text-stone-900 font-sans overflow-hidden">
      {/* Toolbar */}
      <div className={`${density === 'compact' ? 'px-4 py-1.5' : 'px-6 py-3'} border-b border-stone-200 bg-white flex items-center justify-between shadow-sm z-10`}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 relative">
            <div 
              className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 cursor-pointer hover:scale-105 transition-all"
              onClick={() => setShowDocSelector(!showDocSelector)}
              title="Toggle Documents List"
            >
              <FileText size={20} />
            </div>
            <div className="flex items-center gap-1.5">
              <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-bold text-lg bg-transparent border-none focus:outline-none focus:ring-0 w-44 font-sans"
              />
              <button
                onClick={() => setShowDocSelector(!showDocSelector)}
                className={`p-1.5 rounded-lg transition-colors ${showDocSelector ? 'bg-blue-50 text-blue-600' : 'hover:bg-stone-100 text-stone-500'}`}
                title="Document Manager"
              >
                <FolderOpen size={16} />
              </button>
            </div>

            {/* Floating Documents Selector */}
            {showDocSelector && (
              <div className="absolute top-12 left-0 w-72 bg-white border border-stone-200 rounded-2xl p-4 shadow-2xl z-50 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest font-mono">Document Manager</span>
                  <button onClick={() => setShowDocSelector(false)} className="text-stone-400 hover:text-stone-600">
                    <X size={14} />
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto flex flex-col gap-1.5 custom-scrollbar">
                  {savedDocs.map(doc => (
                    <div key={doc.id} className={`flex items-center justify-between px-2.5 py-2 rounded-xl border transition-all ${doc.id === docId ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'hover:bg-stone-50 border-transparent text-stone-700'}`}>
                      <button
                        onClick={() => {
                          setDocId(doc.id);
                          setTitle(doc.title);
                          setContent(doc.content);
                          setShowDocSelector(false);
                        }}
                        className="flex-1 text-left truncate text-xs font-bold font-sans"
                      >
                        {doc.title}
                      </button>
                      {savedDocs.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteWordDocument(doc.id);
                            const updated = getWordDocuments();
                            setSavedDocs(updated);
                            if (docId === doc.id && updated.length > 0) {
                              setDocId(updated[0].id);
                              setTitle(updated[0].title);
                              setContent(updated[0].content);
                            }
                          }}
                          className="text-stone-400 hover:text-rose-500 p-1 rounded hover:bg-stone-100 transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const newId = 'doc-' + Date.now();
                    setDocId(newId);
                    setTitle('Untitled Document');
                    setContent('');
                    setShowDocSelector(false);
                  }}
                  className="w-full py-2 bg-stone-900 text-white text-xs font-black rounded-xl hover:bg-stone-800 transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} /> NEW DOCUMENT
                </button>
              </div>
            )}
          </div>
          
          <div className="h-8 w-[1px] bg-stone-200 mx-1"></div>
          
          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-stone-100 rounded-lg transition-colors text-stone-600"><Bold size={18} /></button>
            <button className="p-2 hover:bg-stone-100 rounded-lg transition-colors text-stone-600"><Italic size={18} /></button>
            <div className="h-6 w-[1px] bg-stone-200 mx-1"></div>
            <button className="p-2 hover:bg-stone-100 rounded-lg transition-colors text-stone-600"><AlignLeft size={18} /></button>
            <button className="p-2 hover:bg-stone-100 rounded-lg transition-colors text-stone-600"><AlignCenter size={18} /></button>
            <button className="p-2 hover:bg-stone-100 rounded-lg transition-colors text-stone-600"><AlignRight size={18} /></button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={newDoc}
            className="p-2.5 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-all"
            title="New Document"
          >
            <Plus size={20} />
          </button>
          <button 
            onClick={handleAICompose}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:scale-105 transition-all disabled:opacity-50"
          >
            {isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Sparkles size={16} />}
            AI Compose
          </button>
          <button 
            onClick={handleAISummarize}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 text-stone-600 rounded-xl font-bold text-sm hover:bg-stone-50 transition-all disabled:opacity-50"
          >
            Summarize
          </button>
          <button 
            onClick={handleCheckGrammar}
            disabled={isCheckingGrammar}
            className={`flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${showSuggestions ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
          >
            {isCheckingGrammar ? <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin"></div> : <SpellCheck size={16} />}
            Grammar
          </button>
          <button 
            onClick={() => window.dispatchEvent(new Event('cosmic-start-reading'))}
            className="p-2.5 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-all flex items-center justify-center"
            title="Read Document Aloud (TTS)"
          >
            <Volume2 size={20} />
          </button>
          <button 
            onClick={downloadDoc}
            className="p-2.5 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-all"
            title="Download Document"
          >
            <Download size={20} />
          </button>
          <button 
            onClick={copyToClipboard}
            className={`p-2.5 rounded-xl transition-all ${copied ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
            title="Copy to Clipboard"
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-hidden flex bg-stone-100/50">
        <div className={`flex-1 overflow-y-auto ${density === 'compact' ? 'p-4' : 'p-12'} flex justify-center custom-scrollbar`}>
          <div className="w-full max-w-4xl bg-white shadow-2xl shadow-stone-200 min-h-[1056px] rounded-sm border border-stone-200 relative">
            
            {/* Highlights Backdrop (pushes height) */}
            <div className={`${density === 'compact' ? 'p-8 text-sm' : 'p-20 text-lg'} whitespace-pre-wrap break-words leading-relaxed font-serif text-transparent z-0 min-h-[800px]`}>
              {(() => {
                if (!showSuggestions || suggestions.length === 0) return content + ' '; // Add space to ensure empty lines are rendered
                
                let highlightedText = [];
                let currentIndex = 0;
                
                // Sort suggestions by their appearance in the text
                const sortedSuggestions = [...suggestions].sort((a, b) => {
                  return content.indexOf(a.original) - content.indexOf(b.original);
                });

                for (let i = 0; i < sortedSuggestions.length; i++) {
                  const suggestion = sortedSuggestions[i];
                  const index = content.indexOf(suggestion.original, currentIndex);
                  
                  if (index !== -1) {
                    // Add text before the highlight
                    highlightedText.push(content.substring(currentIndex, index));
                    // Add the highlighted text
                    highlightedText.push(
                      <span key={i} className="bg-rose-200/50 border-b-2 border-rose-400 rounded-sm">
                        {suggestion.original}
                      </span>
                    );
                    currentIndex = index + suggestion.original.length;
                  }
                }
                
                // Add remaining text
                highlightedText.push(content.substring(currentIndex) + ' ');
                return highlightedText;
              })()}
            </div>

            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (showSuggestions) setSuggestions([]); // Clear suggestions on edit to avoid misalignment
              }}
              placeholder="Start typing your cosmic masterpiece..."
              className={`absolute inset-0 ${density === 'compact' ? 'p-8 text-sm' : 'p-20 text-lg'} w-full h-full bg-transparent resize-none outline-none leading-relaxed text-stone-800 placeholder:text-stone-300 font-serif z-10 overflow-hidden`}
              spellCheck={false}
            />
            
            {/* Watermark */}
            <div className="absolute bottom-10 right-10 opacity-10 pointer-events-none flex items-center gap-2">
              <span className="font-display font-black tracking-widest text-xs uppercase">Quantinum Word</span>
            </div>
          </div>
        </div>

        {/* Suggestions Sidebar */}
        {showSuggestions && (
          <div className="w-80 bg-white border-l border-stone-200 flex flex-col shadow-xl z-20">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2 text-stone-800 font-bold">
                <SpellCheck size={18} className="text-emerald-600" />
                <span>Suggestions</span>
              </div>
              <button onClick={() => setShowSuggestions(false)} className="p-1 hover:bg-stone-200 rounded-md text-stone-500 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {isCheckingGrammar ? (
                <div className="flex flex-col items-center justify-center h-40 text-stone-400 gap-3">
                  <div className="w-6 h-6 border-2 border-stone-200 border-t-emerald-500 rounded-full animate-spin"></div>
                  <span className="text-sm font-medium">Analyzing text...</span>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-stone-400 gap-2 text-center">
                  <Check size={32} className="text-emerald-400 mb-2" />
                  <span className="text-sm font-medium text-stone-600">Looking good!</span>
                  <span className="text-xs">No grammar or spelling issues found.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {suggestions.map((suggestion, idx) => (
                    <div key={idx} className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-md line-through">
                          {suggestion.original}
                        </span>
                        <button onClick={() => dismissSuggestion(idx)} className="text-stone-400 hover:text-stone-600">
                          <X size={14} />
                        </button>
                      </div>
                      <div className="mb-3">
                        <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                          {suggestion.suggested}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mb-4 leading-relaxed">
                        {suggestion.explanation}
                      </p>
                      <button 
                        onClick={() => acceptSuggestion(suggestion, idx)}
                        className="w-full py-2 bg-stone-900 text-white text-xs font-bold rounded-lg hover:bg-stone-800 transition-colors"
                      >
                        Accept Suggestion
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="px-6 py-2 border-t border-stone-200 bg-white flex items-center justify-between text-[10px] font-bold text-stone-400 uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <span>Words: {wordCount}</span>
          <span>Characters: {content.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span>Cloud Synced</span>
        </div>
      </div>
    </div>
  );
};
