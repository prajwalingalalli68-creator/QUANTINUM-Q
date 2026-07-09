
import React, { useState, useEffect } from 'react';
import { translateText, speakText } from '../services/gemini';

const LANGUAGES = [
  { code: 'auto', name: 'Detect Language' },
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ru', name: 'Russian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'bn', name: 'Bengali' },
  { code: 'kn', name: 'Kannada' },
  { code: 'te', name: 'Telugu' },
  { code: 'ta', name: 'Tamil' },
  { code: 'ml', name: 'Malayalam' },
];

export const TranslatorTool: React.FC = () => {
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('hi');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (inputText.trim()) {
        handleTranslate();
      } else {
        setOutputText('');
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [inputText, sourceLang, targetLang]);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setIsTranslating(true);
    const result = await translateText(inputText, sourceLang, targetLang);
    setOutputText(result);
    setIsTranslating(false);
  };

  const swapLanguages = () => {
    if (sourceLang === 'auto') return;
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    setInputText(outputText);
    setOutputText(inputText);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 bg-black/20 font-sans overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 p-2 rounded-2xl">
          {/* Source Controls */}
          <div className="flex-1 w-full space-y-2">
            <select 
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="w-full bg-transparent text-white font-black uppercase tracking-widest text-[10px] p-4 outline-none border-b border-white/5 focus:border-cyan-500/50 transition-colors"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code} className="bg-slate-900">{lang.name}</option>
              ))}
            </select>
            <div className="relative group">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter text to translate..."
                className="w-full h-48 md:h-64 bg-white/5 rounded-xl p-6 text-lg text-white/90 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 resize-none transition-all placeholder:text-white/10"
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => speakText(inputText)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <i className="fa-solid fa-volume-high text-xs"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <button 
            onClick={swapLanguages}
            disabled={sourceLang === 'auto'}
            className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center hover:bg-cyan-500/20 transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed group"
          >
            <i className="fa-solid fa-right-left text-cyan-400 group-hover:rotate-180 transition-transform duration-500"></i>
          </button>

          {/* Target Controls */}
          <div className="flex-1 w-full space-y-2">
            <select 
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full bg-transparent text-white font-black uppercase tracking-widest text-[10px] p-4 outline-none border-b border-white/5 focus:border-emerald-500/50 transition-colors"
            >
              {LANGUAGES.filter(l => l.code !== 'auto').map(lang => (
                <option key={lang.code} value={lang.code} className="bg-slate-900">{lang.name}</option>
              ))}
            </select>
            <div className="relative group">
              <div className="w-full h-48 md:h-64 bg-white/10 rounded-xl p-6 text-lg text-white flex flex-col justify-between border border-white/5 overflow-y-auto custom-scrollbar">
                <div className={isTranslating ? 'opacity-20 transition-opacity' : 'opacity-100'}>
                  {outputText || <span className="text-white/10 italic">Translation will appear here...</span>}
                </div>
                {isTranslating && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-t-2 border-cyan-500 rounded-full animate-spin"></div>
                  </div>
                )}
                <div className="flex items-center justify-end gap-2 mt-4">
                  <button onClick={() => speakText(outputText)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <i className="fa-solid fa-volume-high text-xs"></i>
                  </button>
                  <button onClick={() => copyToClipboard(outputText)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <i className="fa-solid fa-copy text-xs"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
           <div className="px-6 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-white/5 flex items-center gap-3">
              <i className="fa-solid fa-shield-halved text-cyan-400 text-[10px]"></i>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Neural Translation Core V2.4 Active</span>
           </div>
        </div>
      </div>
    </div>
  );
};
