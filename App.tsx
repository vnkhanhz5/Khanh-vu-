import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Settings2, 
  Maximize2, 
  Palette, 
  Zap, 
  Download, 
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Sun,
  Lock,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppState, AspectRatio, ImageSize, GenerationOptions, LightDirection } from './types';
import { transformProductImage } from './utils/geminiService';

const ASPECT_RATIOS: { label: string; value: AspectRatio }[] = [
  { label: '1:1', value: '1:1' },
  { label: '4:3', value: '4:3' },
  { label: '3:4', value: '3:4' },
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
];

const IMAGE_SIZES: { label: string; value: ImageSize }[] = [
  { label: '1K', value: '1K' },
  { label: '2K', value: '2K' },
  { label: '4K Ultra', value: '4K' },
];

const LIGHT_DIRECTIONS: { label: string; value: LightDirection; icon: string }[] = [
  { label: 'Top Left', value: 'top-left', icon: '↖️' },
  { label: 'Top', value: 'top', icon: '⬆️' },
  { label: 'Top Right', value: 'top-right', icon: '↗️' },
  { label: 'Left', value: 'left', icon: '⬅️' },
  { label: 'Front', value: 'front', icon: '⏺️' },
  { label: 'Right', value: 'right', icon: '➡️' },
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [options, setOptions] = useState<GenerationOptions>({
    aspectRatio: '1:1',
    imageSize: '1K',
    backgroundColor: '#ffffff',
    isTransparent: false,
    customPrompt: '',
    lightDirection: 'top-left',
    showShadow: true,
  });

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      setState(AppState.NEEDS_KEY);
    }
  };

  const handleOpenKeySelector = async () => {
    // @ts-ignore
    await window.aistudio.openSelectKey();
    setState(AppState.IDLE);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setOriginalImage(event.target?.result as string);
        setGeneratedImage(null);
        setError(null);
        setState(AppState.IDLE);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!originalImage) return;
    
    setState(AppState.GENERATING);
    setError(null);
    
    try {
      const mimeType = originalImage.split(';')[0].split(':')[1];
      const result = await transformProductImage(originalImage, mimeType, options);
      setGeneratedImage(result);
      setState(AppState.SUCCESS);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        setState(AppState.NEEDS_KEY);
      } else {
        setError(err.message || "An error occurred during generation.");
        setState(AppState.ERROR);
      }
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `studio-product-${Date.now()}.png`;
    link.click();
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'hanhTAY') {
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
      setPasswordInput('');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111] border border-white/10 rounded-[32px] p-10 max-w-md w-full text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Lock className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Studio Pro Security</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-8">
            Please enter the access password to use the professional product enhancer.
          </p>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="relative">
              <input 
                type="password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password"
                className={`w-full py-4 px-6 bg-white/5 border rounded-2xl outline-none transition-all text-center ${
                  authError ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-emerald-500/50'
                }`}
                autoFocus
              />
              {authError && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 text-[10px] mt-2 font-bold uppercase tracking-widest"
                >
                  Incorrect Password
                </motion.p>
              )}
            </div>
            <button 
              type="submit"
              className="w-full py-4 bg-emerald-500 text-black rounded-2xl font-bold hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 group"
            >
              Access Studio
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Studio Pro</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {state === AppState.NEEDS_KEY && (
            <button 
              onClick={handleOpenKeySelector}
              className="px-4 py-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-xs font-medium hover:bg-amber-500/20 transition-colors"
            >
              Select API Key
            </button>
          )}
          <div className="h-4 w-px bg-white/10" />
          <span className="text-xs text-zinc-500 font-mono">v1.0.2</span>
        </div>
      </header>

      <main className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Sidebar Controls */}
        <aside className="w-80 border-r border-white/5 bg-[#0d0d0d] overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar">
          {/* Upload Section */}
          <section>
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-4 block">Source Image</label>
            <div 
              className={`relative group cursor-pointer border-2 border-dashed rounded-2xl transition-all duration-300 ${
                originalImage ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              }`}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input 
                id="file-upload" 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload}
              />
              <div className="p-8 flex flex-col items-center text-center gap-3">
                {originalImage ? (
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-white/10">
                    <img src={originalImage} className="w-full h-full object-cover" alt="Original" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-white" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-zinc-400" />
                    </div>
                    <p className="text-sm text-zinc-400">Click or drag to upload product photo</p>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Background Section */}
          <section className="flex flex-col gap-4">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block">Background</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setOptions(prev => ({ ...prev, isTransparent: false, backgroundColor: '#ffffff' }))}
                className={`p-3 rounded-xl border text-xs font-medium transition-all ${
                  !options.isTransparent && options.backgroundColor === '#ffffff' 
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                    : 'border-white/5 bg-white/5 text-zinc-400 hover:bg-white/10'
                }`}
              >
                Studio White
              </button>
              <button 
                onClick={() => setOptions(prev => ({ ...prev, isTransparent: true }))}
                className={`p-3 rounded-xl border text-xs font-medium transition-all ${
                  options.isTransparent 
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                    : 'border-white/5 bg-white/5 text-zinc-400 hover:bg-white/10'
                }`}
              >
                Transparent (PNG)
              </button>
            </div>
            
            {!options.isTransparent && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <Palette className="w-4 h-4 text-zinc-500" />
                <input 
                  type="color" 
                  value={options.backgroundColor}
                  onChange={(e) => setOptions(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                />
                <input 
                  type="text" 
                  value={options.backgroundColor}
                  onChange={(e) => setOptions(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  className="bg-transparent text-xs font-mono text-zinc-300 w-full outline-none"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(options.backgroundColor);
                  }}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Copy Hex Code"
                >
                  <Download className="w-3 h-3 text-zinc-500 rotate-180" />
                </button>
              </div>
            )}
          </section>

          {/* Light Direction Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block">Lighting & Shadows</label>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-zinc-500 font-medium">Show Shadow</span>
                <button 
                  onClick={() => setOptions(prev => ({ ...prev, showShadow: !prev.showShadow }))}
                  className={`w-8 h-4 rounded-full relative transition-colors ${options.showShadow ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${options.showShadow ? 'left-4.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
            <div className={`grid grid-cols-3 gap-2 transition-opacity ${options.showShadow ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              {LIGHT_DIRECTIONS.map((dir) => (
                <button
                  key={dir.value}
                  onClick={() => setOptions(prev => ({ ...prev, lightDirection: dir.value }))}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                    options.lightDirection === dir.value 
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                      : 'border-white/5 bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-400'
                  }`}
                >
                  <span className="text-lg">{dir.icon}</span>
                  <span className="text-[9px] font-medium whitespace-nowrap">{dir.label}</span>
                </button>
              ))}
            </div>
            {options.showShadow && (
              <p className="mt-2 text-[9px] text-zinc-600 italic">Shadows will be cast in the opposite direction automatically.</p>
            )}
          </section>

          {/* Aspect Ratio */}
          <section>
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-4 block">Aspect Ratio</label>
            <div className="flex flex-wrap gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.value}
                  onClick={() => setOptions(prev => ({ ...prev, aspectRatio: ratio.value }))}
                  className={`px-3 py-2 rounded-lg border text-[11px] font-medium transition-all ${
                    options.aspectRatio === ratio.value 
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                      : 'border-white/5 bg-white/5 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  {ratio.label}
                </button>
              ))}
            </div>
          </section>

          {/* Quality */}
          <section>
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-4 block">Output Quality</label>
            <div className="grid grid-cols-3 gap-2">
              {IMAGE_SIZES.map((size) => (
                <button
                  key={size.value}
                  onClick={() => setOptions(prev => ({ ...prev, imageSize: size.value }))}
                  className={`py-2 rounded-lg border text-[11px] font-medium transition-all ${
                    options.imageSize === size.value 
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                      : 'border-white/5 bg-white/5 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </section>

          {/* Prompt Intervention */}
          <section>
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-4 block">Prompt Intervention</label>
            <textarea 
              placeholder="Add or remove details (e.g., 'add a wooden table', 'remove reflections')"
              className="w-full h-24 bg-white/5 border border-white/5 rounded-xl p-3 text-xs text-zinc-300 outline-none focus:border-emerald-500/50 transition-colors resize-none"
              value={options.customPrompt}
              onChange={(e) => setOptions(prev => ({ ...prev, customPrompt: e.target.value }))}
            />
          </section>

          {/* Action Button */}
          <button
            onClick={handleGenerate}
            disabled={!originalImage || state === AppState.GENERATING || state === AppState.NEEDS_KEY}
            className={`mt-auto w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm transition-all shadow-xl ${
              !originalImage || state === AppState.GENERATING || state === AppState.NEEDS_KEY
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-emerald-500 text-black hover:bg-emerald-400 active:scale-[0.98] shadow-emerald-500/20'
            }`}
          >
            {state === AppState.GENERATING ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Generating Studio Shot...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-current" />
                Transform to Studio
              </>
            )}
          </button>
        </aside>

        {/* Main Preview Area */}
        <div className="flex-1 bg-[#050505] relative overflow-hidden flex items-center justify-center p-12">
          <AnimatePresence mode="wait">
            {!originalImage ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center gap-6 text-center max-w-md"
              >
                <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10">
                  <ImageIcon className="w-10 h-10 text-zinc-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Ready to transform?</h2>
                  <p className="text-zinc-500 text-sm leading-relaxed">
                    Upload a product photo taken with your phone, and we'll turn it into a professional studio masterpiece.
                  </p>
                </div>
                <button 
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="px-6 py-3 bg-white text-black rounded-full font-bold text-sm hover:bg-zinc-200 transition-colors"
                >
                  Get Started
                </button>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-full flex flex-col gap-6"
              >
                <div className="flex-1 relative rounded-3xl overflow-hidden border border-white/5 bg-[#0d0d0d] shadow-2xl">
                  {/* Background Grid */}
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                  
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    {state === AppState.GENERATING ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500" />
                        </div>
                        <p className="text-emerald-500 font-mono text-xs tracking-widest uppercase animate-pulse">Processing Lighting & Shadows</p>
                      </div>
                    ) : generatedImage ? (
                      <motion.img 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        src={generatedImage} 
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                        alt="Generated"
                      />
                    ) : (
                      <img 
                        src={originalImage} 
                        className="max-w-full max-h-full object-contain opacity-50 grayscale blur-sm"
                        alt="Original Preview"
                      />
                    )}
                  </div>

                  {/* Status Badges */}
                  <div className="absolute top-6 left-6 flex gap-2">
                    {generatedImage && (
                      <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Studio Enhanced</span>
                      </div>
                    )}
                    <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
                      <Maximize2 className="w-3 h-3 text-zinc-400" />
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{options.aspectRatio} • {options.imageSize}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {generatedImage && state !== AppState.GENERATING && (
                    <div className="absolute bottom-6 right-6 flex gap-3">
                      <button 
                        onClick={downloadImage}
                        className="p-3 bg-white text-black rounded-xl hover:bg-zinc-200 transition-all shadow-lg flex items-center gap-2 px-4 font-bold text-xs"
                      >
                        <Download className="w-4 h-4" />
                        Download Result
                      </button>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* API Key Modal */}
      <AnimatePresence>
        {state === AppState.NEEDS_KEY && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#111] border border-white/10 rounded-[32px] p-10 max-w-md w-full text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <AlertCircle className="w-10 h-10 text-amber-500" />
              </div>
              <h2 className="text-2xl font-bold mb-4">API Key Required</h2>
              <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                To generate high-quality 4K studio images, you need to select a Gemini API key from a paid project.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleOpenKeySelector}
                  className="w-full py-4 bg-amber-500 text-black rounded-2xl font-bold hover:bg-amber-400 transition-colors"
                >
                  Select API Key
                </button>
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-4"
                >
                  Learn about billing and API keys
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default App;
