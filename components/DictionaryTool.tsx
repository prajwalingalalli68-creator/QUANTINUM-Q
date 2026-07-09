
import React, { useState } from 'react';
import { generateResponse } from '../services/gemini';
import { Book, Search, Sparkles, Volume2 } from 'lucide-react';

export const DictionaryTool: React.FC = () => {
  const [word, setWord] = useState('');
  const [definition, setDefinition] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!word.trim()) return;
    setIsLoading(true);
    try {
      const response = await generateResponse(`Provide a full Oxford-style dictionary entry for the word: "${word}"`, 'DICTIONARY');
      setDefinition(response);
    } catch (error) {
      console.error(error);
      setDefinition("Error retrieving definition.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-200 bg-white flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Book size={24} />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tighter uppercase">Oxford Lexicon</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Quantinum Knowledge Base</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center custom-scrollbar">
        <div className="w-full max-w-3xl space-y-8">
          <div className="relative group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search size={20} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input 
              value={word}
              onChange={(e) => setWord(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search the universal lexicon..."
              className="w-full bg-white border-2 border-slate-100 rounded-[2rem] pl-16 pr-32 py-6 text-lg font-medium focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-xl shadow-slate-200/50"
            />
            <button 
              onClick={handleSearch}
              disabled={isLoading}
              className="absolute right-3 top-3 bottom-3 px-8 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Sparkles size={14} />}
              Define
            </button>
          </div>

          {definition && (
            <div className="bg-white rounded-[2.5rem] p-12 shadow-2xl shadow-slate-200 border border-slate-100 animate-in fade-in slide-in-from-bottom-8 duration-500">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                <h2 className="text-5xl font-black tracking-tighter text-slate-900 uppercase">{word}</h2>
                <button className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-indigo-100 hover:text-indigo-600 transition-all">
                  <Volume2 size={20} />
                </button>
              </div>
              <div className="prose prose-slate max-w-none">
                <div className="text-lg leading-relaxed text-slate-700 whitespace-pre-wrap font-serif italic">
                  {definition}
                </div>
              </div>
            </div>
          )}

          {!definition && !isLoading && (
            <div className="py-20 text-center opacity-20">
              <Book size={120} className="mx-auto mb-6" />
              <p className="text-2xl font-black uppercase tracking-[0.4em]">Awaiting Query</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
