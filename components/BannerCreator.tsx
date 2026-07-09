
import React, { useState } from 'react';
import { BannerData } from '../types';
import { generateBannerData } from '../services/gemini';

export const BannerCreator: React.FC = () => {
  const [theme, setTheme] = useState('');
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!theme.trim() || isLoading) return;

    setIsLoading(true);
    const data = await generateBannerData(theme);
    if (data) {
      setBanner(data);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 bg-black/20 font-sans overflow-y-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto w-full space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter animate-gradient-text">
            Cosmic Banner Creator
          </h1>
          <p className="text-white/40 font-mono text-[10px] uppercase tracking-[0.5em]">
            Visual Aesthetic Synthesis Engine
          </p>
        </div>

        {/* Input Section */}
        <form onSubmit={handleGenerate} className="max-w-2xl mx-auto w-full relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-pink-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"></div>
          <div className="relative flex items-center gap-4 bg-white/5 border border-white/10 p-2 rounded-3xl backdrop-blur-xl">
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Enter your theme (e.g., Cyberpunk City, AI Revolution)..."
              className="flex-1 bg-transparent px-6 py-4 text-white outline-none placeholder:text-white/20 font-medium"
            />
            <button
              type="submit"
              disabled={isLoading || !theme.trim()}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-rose-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-20"
            >
              {isLoading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-wand-magic-sparkles mr-2"></i>}
              Synthesize
            </button>
          </div>
        </form>

        {/* Results Section */}
        <div className="flex flex-col items-center">
          {isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-t-2 border-orange-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <i className="fas fa-palette text-orange-400 text-2xl animate-pulse"></i>
                </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-400/60">
                Arranging Color Atoms...
              </p>
            </div>
          ) : banner ? (
            <div className="w-full animate-fade-in space-y-8">
              <div className={`w-full min-h-[500px] rounded-[2.5rem] p-12 bg-gradient-to-br ${banner.gradient} shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden group border border-white/10 flex flex-col`}>
                {/* Dynamic Background Noise/Effects */}
                <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-white/10 rounded-full -mr-40 -mt-40 blur-[100px] animate-pulse-slow"></div>
                
                <div className="relative z-10 flex flex-col flex-1">
                  <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none mb-2 drop-shadow-[0_5px_15px_rgba(0,0,0,0.3)]">
                    {banner.title}
                  </h2>
                  <p className="text-xl md:text-2xl font-black text-white/80 uppercase tracking-[0.2em] mb-12 drop-shadow-md border-l-4 border-white/30 pl-6">
                    {banner.subtitle}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1">
                    {banner.sections.map((section, i) => (
                      <div key={i} className="bg-black/20 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col group/section hover:bg-black/30 transition-all duration-300">
                        <h3 className="text-white font-black uppercase tracking-widest text-sm mb-4 border-b border-white/10 pb-2 group-hover/section:text-cyan-400 transition-colors">
                          {section.heading}
                        </h3>
                        <ul className="space-y-3">
                          {section.points.map((point, pi) => (
                            <li key={pi} className="flex gap-3 text-white/70 text-xs font-medium leading-relaxed">
                              <div className="w-1.5 h-1.5 rounded-full bg-white/40 mt-1 shrink-0"></div>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="absolute bottom-8 right-10 flex items-center gap-3">
                  <div className="text-right">
                     <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Rendered by</p>
                     <p className="text-[10px] font-black text-white uppercase tracking-widest">QUANTINUM-Q CORE</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
                    <i className="fas fa-atom text-white text-sm animate-spin-slow"></i>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => {
                    alert("Banner data exported. Quantum link secured.");
                  }}
                  className="px-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all flex items-center gap-3"
                >
                  <i className="fas fa-download"></i>
                  Export High-Res
                </button>
              </div>
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center opacity-10">
              <i className="fas fa-panorama text-[120px] mb-8"></i>
              <p className="text-xl font-black uppercase tracking-[0.5em]">Input Theme for Synthesis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
