
import React, { useState } from 'react';
import { fetchCountryIntel } from '../services/gemini';

interface CountryData {
  name: string;
  population: string;
  futurePlans: string[];
  military: {
    armySize: string;
    soldiers: string;
    keyWeapons: string[];
  };
  famousThings: string[];
  sweetsAndFood: string[];
  worldRecords: string[];
  majorIndustries: string[];
}

export const CountryInformer: React.FC = () => {
  const [countryName, setCountryName] = useState('');
  const [data, setData] = useState<CountryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!countryName.trim() || isLoading) return;

    setIsLoading(true);
    setError('');
    setData(null);

    const result = await fetchCountryIntel(countryName);
    if (result) {
      setData(result);
    } else {
      setError('Could not retrieve information for this region. Please verify the region name.');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 bg-black/20 font-sans overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        {/* Search Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter animate-gradient-text">Cosmic Country Informer</h1>
          <p className="text-white/40 font-mono text-xs uppercase tracking-widest">Universal Geopolitical Data Link Access</p>
          
          <form onSubmit={handleSearch} className="w-full max-w-2xl relative group mt-6">
            <div className="absolute inset-0 bg-cyan-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
            <input 
              type="text" 
              value={countryName}
              onChange={(e) => setCountryName(e.target.value)}
              placeholder="Enter Country Name (e.g. India, Japan, USA)..."
              className="w-full bg-white/5 border border-white/10 rounded-full px-10 py-5 text-lg text-white outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all relative z-10"
            />
            <button 
              type="submit"
              disabled={isLoading || !countryName.trim()}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-cyan-500 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-20 z-20"
            >
              <i className={`fas ${isLoading ? 'fa-circle-notch fa-spin' : 'fa-search'}`}></i>
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-center font-black uppercase tracking-widest text-xs">
            {error}
          </div>
        )}

        {/* Results Grid */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Basic Info Card */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <i className="fa-solid fa-users text-4xl"></i>
              </div>
              <h3 className="text-cyan-400 font-black uppercase tracking-widest text-[10px] mb-2">Demographics</h3>
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-white">{data.name}</h2>
                <div className="flex flex-col">
                  <span className="text-white/40 text-[10px] uppercase font-bold">Total Population</span>
                  <span className="text-xl font-bold text-white">{data.population}</span>
                </div>
              </div>
            </div>

            {/* Military Card */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl relative overflow-hidden group border-l-4 border-l-red-500/50">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <i className="fa-solid fa-shield-halved text-4xl"></i>
              </div>
              <h3 className="text-red-400 font-black uppercase tracking-widest text-[10px] mb-4">Military Might</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-white/40 text-[10px] uppercase font-bold">Army Size</span>
                    <p className="font-bold text-white">{data.military.armySize}</p>
                  </div>
                  <div>
                    <span className="text-white/40 text-[10px] uppercase font-bold">Active Soldiers</span>
                    <p className="font-bold text-white">{data.military.soldiers}</p>
                  </div>
                </div>
                <div>
                  <span className="text-white/40 text-[10px] uppercase font-bold mb-2 block">Key Armaments</span>
                  <div className="flex flex-wrap gap-2">
                    {data.military.keyWeapons.map((w, i) => (
                      <span key={i} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-white/60">{w}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Industries Card */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <i className="fa-solid fa-industry text-4xl"></i>
              </div>
              <h3 className="text-emerald-400 font-black uppercase tracking-widest text-[10px] mb-4">Industrial Sectors</h3>
              <ul className="space-y-3">
                {data.majorIndustries.map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-sm font-bold text-white/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Future Plans */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl md:col-span-2 lg:col-span-1">
              <h3 className="text-violet-400 font-black uppercase tracking-widest text-[10px] mb-4">Strategic Vision</h3>
              <ul className="space-y-4">
                {data.futurePlans.map((plan, i) => (
                  <li key={i} className="bg-white/5 border border-white/5 p-4 rounded-xl text-sm text-white/70 italic">
                    "{plan}"
                  </li>
                ))}
              </ul>
            </div>

            {/* Culture & Sweets */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl">
              <h3 className="text-pink-400 font-black uppercase tracking-widest text-[10px] mb-4">Cultural Delights</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-white/40 text-[10px] uppercase font-bold mb-2 block">Famous Things</span>
                  <div className="flex flex-wrap gap-2">
                    {data.famousThings.map((t, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-[10px] text-pink-300">{t}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-white/40 text-[10px] uppercase font-bold mb-2 block">Traditional Sweets & Food</span>
                  <div className="flex flex-wrap gap-2">
                    {data.sweetsAndFood.map((s, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] text-orange-300">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* World Records */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl">
              <h3 className="text-yellow-400 font-black uppercase tracking-widest text-[10px] mb-4">Global Records</h3>
              <ul className="space-y-4">
                {data.worldRecords.map((rec, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <i className="fa-solid fa-trophy text-yellow-500 text-xs mt-1"></i>
                    <span className="text-sm font-bold text-white/80">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {!data && !isLoading && (
          <div className="h-64 flex flex-col items-center justify-center text-center opacity-20">
            <i className="fa-solid fa-earth-asia text-6xl mb-4"></i>
            <p className="font-black uppercase tracking-[0.3em]">Select a region to establish link</p>
          </div>
        )}
      </div>
    </div>
  );
};
