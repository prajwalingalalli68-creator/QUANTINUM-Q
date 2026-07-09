
import React, { useState, useEffect, useRef } from 'react';
import { View, TaskMode, ThemeMode, ChatMessage, BannerData } from '../types';
import { generateResponse, generateImage, generateVideo, generateBannerData, SYSTEM_INSTRUCTIONS } from '../services/gemini';
import { PythonEditor } from './PythonEditor';
import { TranslatorTool } from './TranslatorTool';
import { CountryInformer } from './CountryInformer';
import { BannerCreator } from './BannerCreator';
import { CertificateGenerator } from './CertificateGenerator';
import { CosmicExcel } from './CosmicExcel';
import { CosmicWord } from './CosmicWord';
import { CosmicPresentator } from './CosmicPresentator';
import { DictionaryTool } from './DictionaryTool';
import { HistoryView } from './HistoryView';
import { ThemeSettingsView } from './ThemeSettingsView';
import { GameZone } from './GameZone';
import { PerformanceDashboard } from './PerformanceDashboard';
import { CosmicWatch } from './CosmicWatch';
import { saveToHistory } from '../services/history';
import { searchAllDocuments, getClipboardItems, clearClipboard, addClipboardItem, ClipboardItem, SearchResult } from '../services/documentStorage';
import { getChatHistory, saveChatHistory, clearChatHistory } from '../services/indexedDBCache';

interface ChatInterfaceProps {
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  initialTask: TaskMode;
  initialView: View;
  onBackToHome: () => void;
  customColors: { primary: string; secondary: string; background: string };
  setCustomColors: (colors: { primary: string; secondary: string; background: string }) => void;
}

const BannerComponent: React.FC<{ data: BannerData }> = ({ data }) => {
  return (
    <div className={`w-full max-w-2xl rounded-3xl p-8 bg-gradient-to-br ${data.gradient} shadow-2xl overflow-hidden relative group transition-all duration-500 hover:scale-[1.01]`}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/20 transition-all"></div>
      
      <div className="relative z-10">
        <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-1 drop-shadow-lg leading-tight">
          {data.title}
        </h1>
        <p className="text-sm md:text-base font-bold text-white/80 tracking-widest uppercase mb-6 drop-shadow-md">
          {data.subtitle}
        </p>
        
        <div className="space-y-4">
          {data.sections.map((section, i) => (
            <div key={i} className="bg-black/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl transform transition-transform hover:translate-x-1">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-2 border-b border-white/10 pb-1">
                {section.heading}
              </h3>
              <ul className="space-y-1">
                {section.points.map((point, pi) => (
                  <li key={pi} className="flex items-start gap-2 text-[10px] font-bold text-white/80 leading-tight">
                    <div className="w-1 h-1 rounded-full bg-white/40 mt-1 shrink-0"></div>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      
      <div className="absolute bottom-4 right-6 flex items-center gap-2 opacity-30">
        <i className="fas fa-atom text-white text-[10px] animate-spin-slow"></i>
        <span className="text-[8px] font-black text-white tracking-[0.3em] uppercase">Quantinum Banner</span>
      </div>
    </div>
  );
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  themeMode,
  onToggleTheme,
  initialTask,
  initialView,
  onBackToHome,
  customColors,
  setCustomColors
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load chat history from IndexedDB on mount
  useEffect(() => {
    getChatHistory<ChatMessage[]>().then((cached) => {
      if (cached && cached.length > 0) {
        setMessages(cached);
      }
    });
  }, []);

  // Save chat history to IndexedDB when messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages);
    }
  }, [messages]);
  const [currentView, setCurrentView] = useState<View>(initialView);
  const [wordInitialContent, setWordInitialContent] = useState('');
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [showUtilityPanel, setShowUtilityPanel] = useState(false);
  const [utilityTab, setUtilityTab] = useState<'search' | 'clipboard'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [clipboardItems, setClipboardItems] = useState<ClipboardItem[]>([]);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);

  useEffect(() => {
    setClipboardItems(getClipboardItems());
    
    const handleClipUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setClipboardItems(customEvent.detail);
      }
    };
    
    window.addEventListener('cosmic-clipboard-update', handleClipUpdate);
    return () => window.removeEventListener('cosmic-clipboard-update', handleClipUpdate);
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      setSearchResults(searchAllDocuments(searchQuery));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);
    } else {
      setProgress(100);
      const timer = setTimeout(() => setProgress(0), 500);
      return () => clearTimeout(timer);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const getTaskKey = (view: View): string => {
    switch (view) {
      case View.COSMIC_LINK: return 'COSMIC_LINK';
      case View.TRANSLATOR: return 'TRANSLATOR';
      case View.DICTIONARY: return 'DICTIONARY';
      case View.PRESENTATION_VIEW: return 'PRESENTATION';
      case View.PROJECT_MAKER: return 'PROJECT_MAKER';
      case View.COUNTRY_INTEL: return 'COUNTRY_INTEL';
      case View.COSMIC_PAPER_GEN: return 'COSMIC_PAPER_GEN';
      case View.COSMIC_WORD: return 'COSMIC_WORD';
      case View.COSMIC_EXCEL: return 'COSMIC_EXCEL';
      case View.COSMIC_WATCH: return 'COSMIC_WATCH';
      case View.HISTORY: return 'HISTORY';
      case View.IMAGE_GEN: return 'IMAGE_GEN';
      case View.PYTHON: return 'PYTHON';
      case View.BANNER_GEN: return 'BANNER_GEN';
      case View.COSMIC_CERTIFICATE: return 'COSMIC_CERTIFICATE';
      default: return 'GENERAL';
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    if (inputValue.trim().toLowerCase().startsWith('/search ')) {
      const query = inputValue.trim().substring(8);
      const results = searchAllDocuments(query);
      
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: inputValue,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, userMsg]);
      setInputValue('');
      setIsLoading(true);
      
      setProgress(10);
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return prev;
          return prev + 15;
        });
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        setProgress(100);
        setIsLoading(false);
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: results.length > 0 
            ? `Indexed Search Sub-routine finished. Found **${results.length}** matches across documents and sheets:`
            : `Search sub-routine finished. No files matched the query: "${query}".`,
          timestamp: Date.now(),
          type: 'data',
          bannerData: {
            title: `Search Query: "${query}"`,
            subtitle: `${results.length} matches found`,
            sections: results.map(r => ({
              heading: r.type === 'word' ? `📝 Word: ${r.title}` : `📊 Sheet: ${r.title}`,
              points: [
                `Context: "${r.snippet}"`,
                `Click 'Open' in utility side bar to edit. Matches score: ${r.score}.`,
                `ID:${r.id}:${r.type}`
              ]
            })),
            gradient: 'from-cyan-900 to-indigo-950'
          }
        };
        setMessages(prev => [...prev, assistantMsg]);
      }, 700);
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      if (currentView === View.BANNER_GEN) {
        saveToHistory({ type: 'BANNER', title: `Banner: ${inputValue}`, data: inputValue });
        const bannerData = await generateBannerData(inputValue);
        if (bannerData) {
          const assistantMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: "The aesthetic parameters have been successfully synthesized.",
            timestamp: Date.now(),
            type: 'banner',
            bannerData
          };
          setMessages(prev => [...prev, assistantMsg]);
        } else {
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: "Synthesizer failed. Ensure theme complexity is within bounds.",
            timestamp: Date.now()
          }]);
        }
      } else if (currentView === View.IMAGE_GEN) {
        saveToHistory({ type: 'IMAGE', title: `Image: ${inputValue}`, data: inputValue });
        const imageUrl = await generateImage(inputValue);
        if (imageUrl) {
          const assistantMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: "Behold, the visual manifestation synthesized by Quantinum.",
            timestamp: Date.now(),
            type: 'image',
            mediaUrl: imageUrl
          };
          setMessages(prev => [...prev, assistantMsg]);
        } else {
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: "The Quantinum fabric failed to render your vision.",
            timestamp: Date.now()
          }]);
        }
      } else if (currentView === View.VIDEO_GEN) {
        saveToHistory({ type: 'VIDEO', title: `Video: ${inputValue}`, data: inputValue });
        const videoUrl = await generateVideo(inputValue);
        if (videoUrl) {
          const assistantMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: "The temporal visual stream has been successfully synthesized.",
            timestamp: Date.now(),
            type: 'video',
            mediaUrl: videoUrl
          };
          setMessages(prev => [...prev, assistantMsg]);
        } else {
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: "The Cinematic Engine encountered a temporal anomaly.",
            timestamp: Date.now()
          }]);
        }
      } else {
        const taskKey = getTaskKey(currentView);
        saveToHistory({ type: 'CHAT', title: `${taskKey}: ${inputValue.substring(0, 30)}...`, data: inputValue });
        const response = await generateResponse(inputValue, taskKey);
        if (response) {
          const assistantMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, assistantMsg]);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getViewIcon = (v: View) => {
    switch (v) {
      case View.CHAT: return 'fa-comment';
      case View.IMAGE_GEN: return 'fa-image';
      case View.BANNER_GEN: return 'fa-panorama';
      case View.VIDEO_GEN: return 'fa-video';
      case View.GAME_ZONE: return 'fa-gamepad';
      case View.DICTIONARY: return 'fa-book';
      case View.TRANSLATOR: return 'fa-language';
      case View.COSMIC_LINK: return 'fa-link-slash';
      case View.COSMIC_EXCEL: return 'fa-table';
      case View.COSMIC_WORD: return 'fa-file-lines';
      case View.COSMIC_POWER_POINT: return 'fa-display';
      case View.PROJECT_MAKER: return 'fa-rocket';
      case View.COSMIC_PAPER_GEN: return 'fa-file-signature';
      case View.COUNTRY_INTEL: return 'fa-globe-americas';
      case View.COSMIC_WATCH: return 'fa-clock';
      case View.HISTORY: return 'fa-timeline';
      case View.PLAYSTORE: return 'fa-store';
      case View.YOUTUBE: return 'fa-brands fa-youtube';
      case View.PYTHON: return 'fa-brands fa-python';
      case View.THEMES: return 'fa-palette';
      case View.PERFORMANCE: return 'fa-chart-pie';
      case View.COSMIC_CERTIFICATE: return 'fa-certificate';
      default: return 'fa-star';
    }
  };

  const isCosmicLink = currentView === View.COSMIC_LINK;
  const isPython = currentView === View.PYTHON;
  const isTranslator = currentView === View.TRANSLATOR;
  const isCountryInformer = currentView === View.COUNTRY_INTEL;
  const isBannerCreator = currentView === View.BANNER_GEN;
  const isExcel = currentView === View.COSMIC_EXCEL;
  const isWord = currentView === View.COSMIC_WORD;
  const isPresentator = currentView === View.COSMIC_POWER_POINT;
  const isDictionary = currentView === View.DICTIONARY;
  const isCertificate = currentView === View.COSMIC_CERTIFICATE;

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans relative">
      {/* Global Rainbow Background Layer */}
      <div className="absolute inset-0 z-0 animate-rainbow-bg opacity-5 pointer-events-none"></div>
      
      <div className="w-20 sm:w-64 border-r border-white/10 flex flex-col bg-black/60 backdrop-blur-3xl transition-all duration-300 relative z-10">
        <div className="absolute top-0 left-0 w-1 h-full animate-rainbow-bg opacity-30"></div>
        
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center border border-white/20 shadow-lg shadow-cyan-500/20">
              <i className="fas fa-atom text-sm text-white animate-spin-slow"></i>
            </div>
            <span className="hidden sm:inline font-display font-black tracking-widest uppercase text-[10px] text-gradient">System views</span>
          </div>
          <button onClick={onBackToHome} className="text-white/40 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
            <i className="fa-solid fa-house text-sm"></i>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          {Object.values(View).map((v) => {
            const isSelected = currentView === v;
            return (
              <button
                key={v}
                onClick={() => {
                  setCurrentView(v);
                }}
                className={`w-full flex items-center gap-4 px-6 py-4 transition-all relative group ${
                  isSelected 
                    ? 'bg-white/10 text-white' 
                    : 'hover:bg-white/5 opacity-50 hover:opacity-100'
                } cursor-pointer`}
              >
                <i className={`fa-solid ${getViewIcon(v)} text-base w-6 text-center`}></i>
                <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest truncate">
                  {v.replace(/_/g, ' ')}
                </span>
                {isSelected && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 animate-rainbow-bg shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
                )}
                {isSelected && (
                  <div className="absolute left-1 w-1.5 h-1.5 animate-rainbow-bg rounded-full shadow-[0_0_10px_white]"></div>
                )}
              </button>
            );
          })}
        </div>

      </div>

      <div className="flex-1 flex flex-col bg-black/10">
        <div className="px-8 py-5 border-b border-white/10 flex items-center justify-between bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
              currentView === View.COSMIC_LINK ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
            }`}>
              <i className={`fa-solid ${getViewIcon(currentView)} text-lg`}></i>
            </div>
            <div>
              <h2 className="font-display font-black tracking-[0.2em] uppercase text-xs">
                {currentView.replace(/_/g, ' ')}
              </h2>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active Link</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setMessages([]);
                clearChatHistory();
              }}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/10 text-[9px] font-black uppercase tracking-widest"
            >
              Clear History
            </button>
            <button 
              onClick={() => {
                setUtilityTab('search');
                setShowUtilityPanel(!showUtilityPanel || utilityTab !== 'search');
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                showUtilityPanel && utilityTab === 'search' 
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' 
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
              }`}
              title="Search Index Panel"
            >
              <i className="fa-solid fa-magnifying-glass text-sm"></i>
            </button>
            <button 
              onClick={() => {
                setUtilityTab('clipboard');
                setShowUtilityPanel(!showUtilityPanel || utilityTab !== 'clipboard');
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                showUtilityPanel && utilityTab === 'clipboard' 
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
              }`}
              title="Clipboard Manager"
            >
              <i className="fa-solid fa-clipboard text-sm"></i>
            </button>
            <button 
              onClick={onToggleTheme} 
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/10 group"
              title={`Switch Theme (Current: ${themeMode})`}
            >
              <i className={`fas ${
                themeMode === ThemeMode.DARK ? 'fa-moon text-blue-400' : 
                themeMode === ThemeMode.LIGHT ? 'fa-sun text-yellow-400' : 
                'fa-palette text-pink-400'
              } group-hover:scale-110 transition-transform`}></i>
            </button>
          </div>
        </div>

        {progress > 0 && (
          <div className={`h-1 w-full bg-white/5 relative z-20 transition-opacity duration-300 ${progress >= 100 ? 'opacity-0' : 'opacity-100'}`}>
            <div 
              className="h-full transition-all duration-300 ease-out rounded-r-full"
              style={{ 
                width: `${progress}%`,
                backgroundColor: themeMode === ThemeMode.CUSTOM ? customColors.primary : '#06b6d4',
                boxShadow: `0 0 10px ${themeMode === ThemeMode.CUSTOM ? customColors.primary : '#06b6d4'}`
              }}
            ></div>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 overflow-hidden relative flex flex-col">
            {isPython ? (
            <PythonEditor />
          ) : isTranslator ? (
            <TranslatorTool />
          ) : isCountryInformer ? (
            <CountryInformer />
          ) : isBannerCreator ? (
            <BannerCreator />
          ) : isCertificate ? (
            <CertificateGenerator />
          ) : isExcel ? (
            <CosmicExcel />
          ) : isWord ? (
            <CosmicWord initialContent={wordInitialContent} />
          ) : isPresentator ? (
            <CosmicPresentator />
          ) : isDictionary ? (
            <DictionaryTool />
          ) : currentView === View.COSMIC_WATCH ? (
            <CosmicWatch themeMode={themeMode} />
          ) : currentView === View.HISTORY ? (
            <HistoryView />
          ) : currentView === View.THEMES ? (
            <ThemeSettingsView customColors={customColors} setCustomColors={setCustomColors} />
          ) : currentView === View.GAME_ZONE ? (
            <GameZone />
          ) : currentView === View.PERFORMANCE ? (
            <PerformanceDashboard />
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 z-10 custom-scrollbar">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-cyan-500 blur-3xl opacity-30 rounded-full animate-pulse"></div>
                      <i className={`fa-solid ${getViewIcon(currentView)} text-[120px] relative z-10`}></i>
                    </div>
                    <p className="text-2xl font-black uppercase tracking-[0.4em] mb-4">Initialize Session</p>
                    <p className="max-w-md mx-auto text-sm leading-relaxed tracking-wider font-mono uppercase">
                      The {currentView.replace(/_/g, ' ')} sub-routine is ready.
                    </p>
                  </div>
                )}
                
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`max-w-[85%] rounded-[2rem] px-8 py-5 shadow-2xl transition-all ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-br-none' 
                        : `backdrop-blur-xl border rounded-bl-none ${isCosmicLink ? 'bg-indigo-950/40 border-indigo-500/30' : 'bg-white/5 border-white/10'}`
                    }`}>
                      {msg.type === 'image' && msg.mediaUrl ? (
                        <div className="space-y-6">
                          <img src={msg.mediaUrl} alt="Generated" className="w-full max-w-lg rounded-2xl border border-white/10" />
                          <p className="text-sm opacity-90 leading-relaxed font-medium italic">"{msg.content}"</p>
                        </div>
                      ) : msg.type === 'video' && msg.mediaUrl ? (
                        <div className="space-y-6">
                          <video src={msg.mediaUrl} controls className="w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl" />
                          <p className="text-sm opacity-90 leading-relaxed font-medium italic">"{msg.content}"</p>
                        </div>
                      ) : msg.type === 'banner' && msg.bannerData ? (
                        <div className="space-y-4">
                           <p className="text-sm opacity-70 mb-4">{msg.content}</p>
                           <BannerComponent data={msg.bannerData} />
                        </div>
                      ) : msg.type === 'data' && msg.bannerData ? (
                        <div className="space-y-4 max-w-xl w-full">
                          <p className="text-sm opacity-80 mb-4 font-sans leading-relaxed">{msg.content}</p>
                          <div className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                              <span className="text-xs font-black uppercase text-cyan-400 tracking-wider">Search Results Index</span>
                              <span className="text-[10px] font-mono text-white/40">{msg.bannerData.subtitle}</span>
                            </div>
                            <div className="space-y-2.5">
                              {msg.bannerData.sections.map((section, sidx) => {
                                const idPoint = section.points[2] || '';
                                const [, docId, docType] = idPoint.split(':');
                                return (
                                  <div key={sidx} className="p-3 bg-white/5 border border-white/5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/10 transition-all group">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-xs font-black text-white truncate group-hover:text-cyan-400 transition-colors">{section.heading}</h4>
                                      <p className="text-[11px] text-white/60 italic mt-1 line-clamp-2">"{section.points[0].replace('Context: "', '').replace('"', '')}"</p>
                                    </div>
                                    {docId && (
                                      <button
                                        onClick={() => {
                                          if (docType === 'word') {
                                            setCurrentView(View.COSMIC_WORD);
                                            setTimeout(() => {
                                              window.dispatchEvent(new CustomEvent('cosmic-open-document', { detail: { id: docId, type: 'word' } }));
                                            }, 100);
                                          } else if (docType === 'excel') {
                                            setCurrentView(View.COSMIC_EXCEL);
                                            setTimeout(() => {
                                              window.dispatchEvent(new CustomEvent('cosmic-open-document', { detail: { id: docId, type: 'excel' } }));
                                            }, 100);
                                          }
                                        }}
                                        className="shrink-0 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all self-end sm:self-center"
                                      >
                                        Open File
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                          {msg.content}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-4 border-t border-white/5 pt-3 gap-2 flex-wrap">
                        <p className="text-[9px] opacity-30 font-black uppercase tracking-[0.2em]">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <span className="text-[9px] font-black tracking-widest uppercase opacity-40">
                          {msg.role === 'user' ? 'Stardust' : 'Quantinum Core'}
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(msg.content);
                                addClipboardItem(msg.content, 'chat');
                                window.dispatchEvent(new CustomEvent('cosmic-notification', {
                                  detail: {
                                    title: 'Copied to Clipboard',
                                    message: 'Message text copied and logged to Clipboard Manager.',
                                    type: 'success'
                                  }
                                }));
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="text-[9px] font-black tracking-widest uppercase text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                            title="Copy to Clipboard Manager"
                          >
                            <i className="fa-solid fa-copy"></i>
                            Copy Message
                          </button>
                          {!msg.type && (
                            <button 
                              onClick={() => {
                                setWordInitialContent(msg.content);
                                setCurrentView(View.COSMIC_WORD);
                              }}
                              className="text-[9px] font-black tracking-widest uppercase text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                            >
                              <i className="fa-solid fa-file-word"></i>
                              {msg.role === 'user' ? 'Edit in Word' : 'Open in Word'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start animate-fade-in w-full max-w-xl">
                    <div className="backdrop-blur-2xl border border-cyan-500/30 bg-black/40 rounded-[2rem] p-6 rounded-bl-none flex flex-col gap-4 w-full shadow-[0_0_50px_rgba(6,182,212,0.15)]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-cyan-500/15 flex items-center justify-center border border-cyan-500/30">
                            <i className="fas fa-atom text-cyan-400 animate-spin-slow text-sm"></i>
                          </div>
                          <div>
                            <span className="text-xs font-black tracking-widest text-cyan-400 uppercase font-mono">Quantinum Agent</span>
                            <p className="text-[10px] text-white/50 font-mono mt-0.5 uppercase tracking-wide">AI Sub-Routine Pipeline</p>
                          </div>
                        </div>
                        <span className="text-sm font-black font-mono text-cyan-400 tabular-nums">
                          {Math.round(progress)}%
                        </span>
                      </div>

                      {/* Progress Bar Container */}
                      <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden border border-white/5 relative p-[1px]">
                        <div 
                          className="bg-gradient-to-r from-cyan-400 via-teal-400 to-indigo-500 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                          style={{ width: `${Math.round(progress)}%` }}
                        ></div>
                      </div>

                      {/* Current Step Status */}
                      <div className="flex items-center justify-between text-[11px] font-mono text-white/80">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                          <span className="truncate tracking-wide font-medium">
                            {progress < 25 ? (
                              currentView === View.COSMIC_WORD ? 'Initializing Cosmic Word Engine...' :
                              currentView === View.COSMIC_EXCEL ? 'Loading Cosmic Excel Spreadsheet Parser...' :
                              currentView === View.PYTHON ? 'Bootstrapping Pyodide sandbox container...' :
                              currentView === View.IMAGE_GEN ? 'Warming up Diffusion weights...' :
                              currentView === View.VIDEO_GEN ? 'Calibrating CineFlow rendering pipeline...' :
                              'Initializing AI sub-routine...'
                            ) : progress < 55 ? (
                              currentView === View.COSMIC_WORD ? 'Analyzing context structures & prose blueprints...' :
                              currentView === View.COSMIC_EXCEL ? 'Synthesizing formulas and sheet data columns...' :
                              currentView === View.PYTHON ? 'Compiling AST and loading Python modules...' :
                              currentView === View.IMAGE_GEN ? 'De-noising latent matrices (Step 15/30)...' :
                              currentView === View.VIDEO_GEN ? 'Interpolating temporal flow vectors...' :
                              'Synthesizing knowledge graph embeddings...'
                            ) : progress < 85 ? (
                              currentView === View.COSMIC_WORD ? 'Rendering high-fidelity document layout...' :
                              currentView === View.COSMIC_EXCEL ? 'Injecting pivot arrays & table styling schema...' :
                              currentView === View.PYTHON ? 'Executing safe main-thread interpreter...' :
                              currentView === View.IMAGE_GEN ? 'Up-scaling pixel fidelity to ultra-HD...' :
                              currentView === View.VIDEO_GEN ? 'Compiling high-frame-rate MP4/WebM slices...' :
                              'Formatting output stream...'
                            ) : progress < 98 ? (
                              currentView === View.COSMIC_WORD ? 'Polishing typography and formatting tags...' :
                              currentView === View.COSMIC_EXCEL ? 'Finalizing column widths and chart data...' :
                              currentView === View.PYTHON ? 'Finalizing print buffers and stdout streams...' :
                              currentView === View.IMAGE_GEN ? 'Applying contrast & aesthetic color correction...' :
                              currentView === View.VIDEO_GEN ? 'Running temporal antialiasing filters...' :
                              'Securing and completing data handshake...'
                            ) : (
                              'Finalizing rendering. Output ready.'
                            )}
                          </span>
                        </div>
                        <span className="text-white/40 text-[9px] uppercase tracking-widest font-black shrink-0 ml-2">
                          ACTIVE PROCESS
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-white/10 bg-black/40 backdrop-blur-3xl z-20">
                <div className="max-w-5xl mx-auto">
                  <div className="relative flex items-end gap-5">
                    <button className="mb-2 w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 border border-white/5">
                      <i className="fa-solid fa-plus"></i>
                    </button>
                    <div className="relative flex-1 group">
                      <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder={currentView === View.BANNER_GEN ? "Describe the banner theme (e.g. AI Tech Conference)..." : "Transmit data..."}
                        className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 resize-none h-16 min-h-[64px] max-h-[200px] transition-all relative z-10 text-sm font-medium tracking-wide placeholder:text-white/20 custom-scrollbar"
                      />
                    </div>
                    <button 
                      onClick={handleSend}
                      disabled={isLoading || !inputValue.trim()}
                      className="mb-2 w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white transition-all disabled:opacity-20 group"
                    >
                      <i className={`fa-solid ${isLoading ? 'fa-circle-notch animate-spin' : 'fa-arrow-up'} text-lg`}></i>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
          </div>

          {/* Right Collapsible Utility Sidebar */}
          {showUtilityPanel && (
            <div className="w-80 border-l border-white/10 bg-black/50 backdrop-blur-3xl flex flex-col z-30 transition-all duration-300 relative">
              {/* Header Tabs */}
              <div className="flex border-b border-white/10 shrink-0">
                <button
                  onClick={() => setUtilityTab('search')}
                  className={`flex-1 py-4 text-center font-black text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                    utilityTab === 'search' ? 'text-cyan-400 bg-white/5 border-b-2 border-cyan-400' : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  <i className="fa-solid fa-magnifying-glass"></i>
                  SEARCH INDEX
                </button>
                <button
                  onClick={() => setUtilityTab('clipboard')}
                  className={`flex-1 py-4 text-center font-black text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                    utilityTab === 'clipboard' ? 'text-indigo-400 bg-white/5 border-b-2 border-indigo-400' : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  <i className="fa-solid fa-clipboard"></i>
                  CLIPBOARD
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {utilityTab === 'search' ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search word docs & sheets..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 text-white placeholder:text-white/20"
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-white/40 hover:text-white/80">
                          <i className="fa-solid fa-xmark text-xs"></i>
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {!searchQuery.trim() ? (
                        <div className="text-center py-12 text-white/30 text-xs font-mono uppercase tracking-wider">
                          <i className="fa-solid fa-database text-2xl mb-3 block opacity-35"></i>
                          Enter query keywords to query saved index...
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="text-center py-12 text-white/30 text-xs font-mono uppercase tracking-wider">
                          <i className="fa-solid fa-circle-exclamation text-2xl mb-3 block opacity-35"></i>
                          No matches indexed in storage
                        </div>
                      ) : (
                        searchResults.map((res) => (
                          <div key={res.id} className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all group relative">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded ${
                                res.type === 'word' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/25' : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/25'
                              }`}>
                                {res.type === 'word' ? 'Word' : 'Excel'}
                              </span>
                              <span className="text-[9px] font-mono text-white/30">Score: {res.score}</span>
                            </div>
                            <h4 className="text-xs font-black text-white truncate pr-6">{res.title}</h4>
                            <p className="text-[10px] text-white/50 italic mt-1 line-clamp-2">"{res.snippet}"</p>
                            
                            <button
                              onClick={() => {
                                if (res.type === 'word') {
                                  setCurrentView(View.COSMIC_WORD);
                                  setTimeout(() => {
                                    window.dispatchEvent(new CustomEvent('cosmic-open-document', { detail: { id: res.id, type: 'word' } }));
                                  }, 100);
                                } else {
                                  setCurrentView(View.COSMIC_EXCEL);
                                  setTimeout(() => {
                                    window.dispatchEvent(new CustomEvent('cosmic-open-document', { detail: { id: res.id, type: 'excel' } }));
                                  }, 100);
                                }
                              }}
                              className="w-full mt-2.5 py-1.5 bg-white/5 group-hover:bg-cyan-600 text-white group-hover:text-white transition-all text-[9px] font-black uppercase tracking-widest rounded-lg border border-white/5 group-hover:border-transparent"
                            >
                              OPEN FILE
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-[10px] font-black text-white/40 tracking-wider">RECENTS HISTORY</span>
                      {clipboardItems.length > 0 && (
                        <button
                          onClick={() => {
                            clearClipboard();
                            setClipboardItems([]);
                          }}
                          className="text-[9px] font-black text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest flex items-center gap-1"
                        >
                          <i className="fa-solid fa-trash-can text-[10px]"></i>
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {clipboardItems.length === 0 ? (
                        <div className="text-center py-12 text-white/30 text-xs font-mono uppercase tracking-wider">
                          <i className="fa-solid fa-copy text-2xl mb-3 block opacity-35"></i>
                          History is empty. Copy text in Word or Excel cells to populate...
                        </div>
                      ) : (
                        clipboardItems.map((item) => (
                          <div key={item.id} className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all flex flex-col gap-2 group">
                            <div className="flex items-center justify-between">
                              <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded border uppercase tracking-wider ${
                                item.source === 'word' ? 'bg-blue-600/10 text-blue-400 border-blue-500/20' : 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20'
                              }`}>
                                {item.source}
                              </span>
                              <span className="text-[8px] font-mono text-white/30">
                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-white/80 font-mono break-all line-clamp-3 bg-black/20 p-2 rounded border border-white/5 select-all">
                              {item.text}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <button
                                onClick={async () => {
                                  await navigator.clipboard.writeText(item.text);
                                  setCopiedItemId(item.id);
                                  setTimeout(() => setCopiedItemId(null), 1500);
                                }}
                                className="flex-1 py-1 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest rounded border border-white/5 flex items-center justify-center gap-1"
                              >
                                {copiedItemId === item.id ? (
                                  <>
                                    <i className="fa-solid fa-check text-emerald-400"></i>
                                    COPIED!
                                  </>
                                ) : (
                                  <>
                                    <i className="fa-solid fa-copy"></i>
                                    COPY TEXT
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  window.dispatchEvent(new CustomEvent('cosmic-paste', { detail: { text: item.text } }));
                                }}
                                className="flex-1 py-1 bg-cyan-600 hover:bg-cyan-500 text-white transition-all text-[9px] font-black uppercase tracking-widest rounded flex items-center justify-center gap-1"
                                title="Paste directly into current cursor or active cell"
                              >
                                <i className="fa-solid fa-arrow-right-to-bracket"></i>
                                INSERT
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
