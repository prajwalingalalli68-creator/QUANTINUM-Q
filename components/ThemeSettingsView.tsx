import React from 'react';

interface ThemeSettingsViewProps {
  customColors: { primary: string; secondary: string; background: string };
  setCustomColors: (colors: { primary: string; secondary: string; background: string }) => void;
}

export const ThemeSettingsView: React.FC<ThemeSettingsViewProps> = ({ customColors, setCustomColors }) => {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-8 custom-scrollbar">
      <div className="max-w-2xl mx-auto w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/5 border border-white/10 mb-6 relative group">
            <div className="absolute inset-0 bg-pink-500 blur-xl opacity-20 rounded-full group-hover:opacity-40 transition-opacity"></div>
            <i className="fas fa-palette text-4xl text-pink-400 relative z-10"></i>
          </div>
          <h2 className="text-4xl font-black uppercase tracking-[0.2em] mb-4">Environment Settings</h2>
          <p className="text-white/60 font-mono text-sm tracking-wider">Configure your custom environment colors.</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 space-y-8">
          
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-[0.2em] text-white/80 block">Primary Accent</label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={customColors.primary}
                onChange={(e) => setCustomColors({ ...customColors, primary: e.target.value })}
                className="w-16 h-16 rounded-2xl cursor-pointer border-0 bg-transparent p-0"
              />
              <input
                type="text"
                value={customColors.primary}
                onChange={(e) => setCustomColors({ ...customColors, primary: e.target.value })}
                className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white font-mono flex-1 focus:outline-none focus:border-pink-500/50"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-[0.2em] text-white/80 block">Secondary Accent</label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={customColors.secondary}
                onChange={(e) => setCustomColors({ ...customColors, secondary: e.target.value })}
                className="w-16 h-16 rounded-2xl cursor-pointer border-0 bg-transparent p-0"
              />
              <input
                type="text"
                value={customColors.secondary}
                onChange={(e) => setCustomColors({ ...customColors, secondary: e.target.value })}
                className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white font-mono flex-1 focus:outline-none focus:border-pink-500/50"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-[0.2em] text-white/80 block">Background Color</label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={customColors.background}
                onChange={(e) => setCustomColors({ ...customColors, background: e.target.value })}
                className="w-16 h-16 rounded-2xl cursor-pointer border-0 bg-transparent p-0"
              />
              <input
                type="text"
                value={customColors.background}
                onChange={(e) => setCustomColors({ ...customColors, background: e.target.value })}
                className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white font-mono flex-1 focus:outline-none focus:border-pink-500/50"
              />
            </div>
          </div>

          <div className="mt-8 p-6 rounded-2xl border border-white/10" style={{
            background: `linear-gradient(to bottom right, ${customColors.background}, ${customColors.primary})`
          }}>
            <h3 className="text-lg font-black uppercase tracking-wider mb-2">Preview</h3>
            <p className="font-mono text-sm opacity-80 mb-4">This is how your environment will look with the custom theme active.</p>
            <button className="px-6 py-2 rounded-xl text-white font-bold text-sm shadow-xl" style={{ backgroundColor: customColors.secondary }}>
              Action Button
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
