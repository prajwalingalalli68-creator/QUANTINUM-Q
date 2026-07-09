
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { generateResponse } from '../services/gemini';
import { 
  Presentation, 
  Plus, 
  Trash2, 
  Play, 
  Layout, 
  Type, 
  Image as ImageIcon, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  Download,
  Palette
} from 'lucide-react';

interface Slide {
  id: string;
  title: string;
  content: string;
  layout: 'centered' | 'split' | 'image-full';
  bgGradient: string;
}

export const CosmicPresentator: React.FC = () => {
  const [slides, setSlides] = useState<Slide[]>([
    { 
      id: '1', 
      title: 'Welcome to Quantinum', 
      content: 'The future of cosmic presentations starts here.', 
      layout: 'centered',
      bgGradient: 'from-indigo-600 to-violet-700'
    }
  ]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const addSlide = () => {
    const newSlide: Slide = {
      id: Date.now().toString(),
      title: 'New Slide',
      content: 'Add your cosmic content here...',
      layout: 'centered',
      bgGradient: 'from-slate-800 to-slate-900'
    };
    setSlides([...slides, newSlide]);
    setCurrentSlideIndex(slides.length);
  };

  const deleteSlide = (index: number) => {
    if (slides.length <= 1) return;
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    setCurrentSlideIndex(Math.max(0, index - 1));
  };

  const updateSlide = (updates: Partial<Slide>) => {
    const newSlides = [...slides];
    newSlides[currentSlideIndex] = { ...newSlides[currentSlideIndex], ...updates };
    setSlides(newSlides);
  };

  const handleAIGenerate = async () => {
    const topic = prompt("What's the topic for this slide?");
    if (!topic) return;

    setIsGenerating(true);
    try {
      const promptText = `Generate a presentation slide content for the topic: "${topic}". 
      Return the response in JSON format with "title" and "content" (bullet points).`;
      const response = await generateResponse(promptText, 'COSMIC_POWER_POINT');
      
      // Try to parse JSON if model returned it, otherwise use text
      try {
        const data = JSON.parse(response);
        updateSlide({ title: data.title, content: data.content });
      } catch {
        const lines = response.split('\n');
        updateSlide({ title: lines[0], content: lines.slice(1).join('\n') });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMagicDesign = async () => {
    const topic = prompt("What is the topic for your entire presentation?");
    if (!topic) return;

    setIsGenerating(true);
    try {
      const promptText = `Generate a full presentation with 5 slides for the topic: "${topic}". 
      Return the response as a JSON array of objects, each with "title", "content", and "bgGradient". 
      Gradients should be Tailwind classes like 'from-blue-600 to-indigo-700'.`;
      
      const response = await generateResponse(promptText, 'COSMIC_POWER_POINT');
      const data = JSON.parse(response);
      
      if (Array.isArray(data)) {
        const newSlides = data.map((s: any, i: number) => ({
          id: (Date.now() + i).toString(),
          title: s.title,
          content: s.content,
          layout: 'centered' as const,
          bgGradient: s.bgGradient || 'from-slate-800 to-slate-900'
        }));
        setSlides(newSlides);
        setCurrentSlideIndex(0);
      }
    } catch (error) {
      console.error("Magic Design failed:", error);
      alert("The cosmic link was too weak to generate a full deck. Try a single slide instead.");
    } finally {
      setIsGenerating(false);
    }
  };

  const currentSlide = slides[currentSlideIndex];

  if (isPreviewMode) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, scale: 0.9, x: 100 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 1.1, x: -100 }}
            transition={{ duration: 0.5, ease: "circOut" }}
            className={`w-full h-full flex flex-col items-center justify-center p-20 bg-gradient-to-br ${currentSlide.bgGradient} text-white text-center`}
          >
            <h1 className="text-7xl font-black mb-12 tracking-tighter uppercase drop-shadow-2xl">
              {currentSlide.title}
            </h1>
            <div className="text-3xl font-medium max-w-4xl leading-relaxed opacity-90 whitespace-pre-wrap">
              {currentSlide.content}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-8 text-white/40">
          <button 
            onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
            className="hover:text-white transition-colors"
          >
            <ChevronLeft size={48} />
          </button>
          <span className="font-mono text-xl font-bold tracking-widest">
            {currentSlideIndex + 1} / {slides.length}
          </span>
          <button 
            onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
            className="hover:text-white transition-colors"
          >
            <ChevronRight size={48} />
          </button>
        </div>

        <button 
          onClick={() => setIsPreviewMode(false)}
          className="absolute top-10 right-10 text-white/40 hover:text-white transition-colors uppercase font-black tracking-widest text-sm"
        >
          Exit Presentation
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-white font-sans overflow-hidden">
      {/* Header */}
      <div className="px-8 py-4 border-b border-white/10 bg-slate-950/50 backdrop-blur-xl flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Presentation size={20} />
          </div>
          <div>
            <h1 className="font-black text-sm tracking-widest uppercase">Cosmic Power Point</h1>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em]">Neural Presentation Suite v2.0</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleMagicDesign}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all disabled:opacity-50"
          >
            {isGenerating ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Sparkles size={14} />}
            Magic Design
          </button>
          <button 
            onClick={handleAIGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50"
          >
            {isGenerating ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Sparkles size={14} className="text-orange-400" />}
            AI Slide
          </button>
          <button 
            onClick={() => setIsPreviewMode(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:scale-105 transition-all"
          >
            <Play size={14} fill="currentColor" /> Present
          </button>
        </div>
      </div>

      {/* Ribbon Toolbar */}
      <div className="px-8 py-2 bg-slate-900 border-b border-white/5 flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-white/40">
        <button className="text-orange-400 border-b-2 border-orange-400 pb-1">Home</button>
        <button className="hover:text-white transition-colors">Insert</button>
        <button className="hover:text-white transition-colors">Design</button>
        <button className="hover:text-white transition-colors">Transitions</button>
        <button className="hover:text-white transition-colors">Animations</button>
        <button className="hover:text-white transition-colors">Slide Show</button>
        <button className="hover:text-white transition-colors">Review</button>
        <button className="hover:text-white transition-colors">View</button>
      </div>

      {/* Formatting Toolbar */}
      <div className="px-8 py-3 bg-slate-950/30 border-b border-white/5 flex items-center gap-4">
        <div className="flex items-center gap-1 border-r border-white/10 pr-4">
          <button className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-all"><Type size={16} /></button>
          <button className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-all font-bold">B</button>
          <button className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-all italic">I</button>
          <button className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-all underline">U</button>
        </div>
        <div className="flex items-center gap-1 border-r border-white/10 pr-4">
          <button className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-all"><Layout size={16} /></button>
          <button className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-all"><ImageIcon size={16} /></button>
          <button className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-all"><Palette size={16} /></button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Font Size</span>
          <select className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] outline-none">
            <option>18</option>
            <option>24</option>
            <option>32</option>
            <option>48</option>
            <option>72</option>
          </select>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Slide Thumbnails */}
        <div className="w-64 border-r border-white/10 bg-slate-950/30 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {slides.map((slide, index) => (
            <div 
              key={slide.id}
              onClick={() => setCurrentSlideIndex(index)}
              className={`group relative aspect-video rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                currentSlideIndex === index ? 'border-orange-500 scale-[1.02] shadow-xl shadow-orange-500/10' : 'border-white/5 hover:border-white/20'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${slide.bgGradient} opacity-40`}></div>
              <div className="absolute inset-0 flex flex-col p-3 justify-center items-center text-center">
                <span className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">Slide {index + 1}</span>
                <span className="text-[10px] font-bold line-clamp-2">{slide.title}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteSlide(index); }}
                className="absolute top-2 right-2 p-1.5 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
          <button 
            onClick={addSlide}
            className="w-full aspect-video rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-white/20 hover:text-white/40 hover:border-white/20 transition-all"
          >
            <Plus size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest">Add Slide</span>
          </button>
        </div>

        {/* Main Editor */}
        <div className="flex-1 bg-slate-900/50 p-12 overflow-y-auto custom-scrollbar flex flex-col items-center">
          <div className="w-full max-w-5xl aspect-video bg-slate-950 rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-white/5 flex flex-col">
            <div className={`flex-1 flex flex-col items-center justify-center p-20 bg-gradient-to-br ${currentSlide.bgGradient} transition-all duration-700`}>
              <input 
                value={currentSlide.title}
                onChange={(e) => updateSlide({ title: e.target.value })}
                className="w-full bg-transparent text-center text-5xl font-black tracking-tighter uppercase outline-none placeholder:text-white/20 mb-8"
                placeholder="Slide Title"
              />
              <textarea 
                value={currentSlide.content}
                onChange={(e) => updateSlide({ content: e.target.value })}
                className="w-full flex-1 bg-transparent text-center text-xl font-medium opacity-80 outline-none resize-none placeholder:text-white/10 leading-relaxed"
                placeholder="Slide Content..."
              />
            </div>
            
            {/* Slide Controls Overlay */}
            <div className="absolute bottom-8 right-8 flex items-center gap-3">
              <button className="p-3 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                <Palette size={18} className="text-orange-400" />
              </button>
              <button className="p-3 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                <Layout size={18} className="text-blue-400" />
              </button>
            </div>
          </div>

          {/* Quick Settings */}
          <div className="mt-12 w-full max-w-5xl grid grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4">Background Theme</h4>
              <div className="flex gap-3">
                {['from-indigo-600 to-violet-700', 'from-emerald-600 to-teal-700', 'from-rose-600 to-orange-700', 'from-slate-800 to-slate-900'].map(grad => (
                  <button 
                    key={grad}
                    onClick={() => updateSlide({ bgGradient: grad })}
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${grad} border-2 ${currentSlide.bgGradient === grad ? 'border-white' : 'border-transparent'}`}
                  />
                ))}
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4">Slide Layout</h4>
              <div className="flex gap-3">
                <button className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all"><Layout size={16} /></button>
                <button className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all"><Type size={16} /></button>
                <button className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all"><ImageIcon size={16} /></button>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center justify-between">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Export Deck</h4>
                <p className="text-[8px] font-bold text-white/20 uppercase">PDF / PPTX / PNG</p>
              </div>
              <button className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                <Download size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
