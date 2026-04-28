import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { useNavigate } from 'react-router';
import { ArrowDown, Sparkles, BrainCircuit, Mic, BarChart3, ChevronRight } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // Track overall scroll progress of the container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Smooth out the scroll progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // --------------
  // SCROLL ANIMATION CONFIGURATION
  // --------------

  // HERO TEXT ANIMATIONS (0% to 30% scroll)
  const titleScale = useTransform(smoothProgress, [0, 0.25], [1, 20]);
  const titleOpacity = useTransform(smoothProgress, [0, 0.2, 0.25], [1, 1, 0]);
  const titleY = useTransform(smoothProgress, [0, 0.25], ["0%", "-50%"]);
  
  // LOGO / VOID BACKGROUND TINT (0% to 30%)
  const bgOpacity = useTransform(smoothProgress, [0, 0.25], [1, 0.6]);

  // FEATURES SECTION REVEAL (25% to 50% scroll)
  const featuresOpacity = useTransform(smoothProgress, [0.2, 0.35], [0, 1]);
  const featuresY = useTransform(smoothProgress, [0.2, 0.35], ["100px", "0px"]);

  // DASHBOARD MOCKUP REVEAL (40% to 70% scroll)
  const dashboardOpacity = useTransform(smoothProgress, [0.4, 0.55], [0, 1]);
  const dashboardY = useTransform(smoothProgress, [0.4, 0.55], ["150px", "0px"]);
  const dashboardScale = useTransform(smoothProgress, [0.4, 0.55, 1], [0.9, 1, 1]);

  // CTA SECTION REVEAL (70% to 100% scroll)
  const ctaOpacity = useTransform(smoothProgress, [0.7, 0.85], [0, 1]);
  const ctaY = useTransform(smoothProgress, [0.7, 0.85], ["50px", "0px"]);

  return (
    // The container is super tall to allow scrolling over several viewport heights (e.g. 400vh)
    <div ref={containerRef} className="h-[400vh] bg-[#0F1115] text-white selection:bg-blue-500/30">
      
      {/* 
        STICKY WRAPPER
        This layer stays stuck to the viewport while we scroll down the tall container. 
        It handles all visual elements depending on the scroll position.
      */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center">
        
        {/* Background Noise / Grid Overlay */}
        <motion.div 
          style={{ opacity: bgOpacity }}
          className="absolute inset-0 pointer-events-none"
        >
          {/* Subtle Grid */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3Ryb2tlPSIjMjAyNDMwIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiPjxwYXRoIGQ9Ik02MCAwTDAgMDBtMCA2MEwwIDB6Ii8+PC9nPjwvc3ZnPg==')] opacity-20" />
          {/* Radial Gradient for depth */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0F1115] via-[#0F1115]/80 to-[#1e3a8a]/20" />
        </motion.div>

        {/* ═══════════════════════════════════════════════ */}
        {/* SECTION 1: THE CINEMATIC HERO VOID                 */}
        {/* ═══════════════════════════════════════════════ */}
        <motion.div 
          style={{ 
            scale: titleScale, 
            opacity: titleOpacity, 
            y: titleY,
            z: 10
          }}
          className="absolute inset-0 flex flex-col items-center justify-center origin-center pointer-events-none"
        >
          <h1 className="text-[12vw] tracking-tighter leading-none hero-slant font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 select-none">
            Klyvora <span className="opacity-80">AI</span>
          </h1>
          
          <motion.div 
            animate={{ y: [0, 10, 0], opacity: [0.3, 1, 0.3] }} 
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-16 text-cyan-500 flex flex-col items-center gap-2"
          >
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase">Begin</span>
            <ArrowDown className="w-5 h-5" />
          </motion.div>
        </motion.div>

        {/* Header (Top Right CTA) - Appears after Hero fades slightly */}
        <motion.div 
          style={{ opacity: featuresOpacity }}
          className="absolute top-6 right-8 flex items-center gap-4 z-50 w-full justify-end"
        >
          <button 
            onClick={() => navigate('/login')}
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="text-sm font-bold bg-white text-black px-5 py-2.5 rounded-full hover:bg-slate-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          >
            Getting Started
          </button>
        </motion.div>

        {/* ═══════════════════════════════════════════════ */}
        {/* SECTION 2: FEATURES & LOGIC REVEAL                 */}
        {/* ═══════════════════════════════════════════════ */}
        <motion.div 
          style={{ 
            opacity: featuresOpacity,
            y: featuresY,
            z: 20
          }}
          className="absolute top-24 md:top-36 w-full max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center pointer-events-none"
        >
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-mono font-bold tracking-wider uppercase mb-4 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <Sparkles className="w-3 h-3" /> Reimagining Feedback
            </div>
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1]">
              Hear what they mean, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                not just what they say.
              </span>
            </h2>
            <p className="text-lg text-slate-400 max-w-lg leading-relaxed font-medium">
              Klyvora transforms raw customer voice into instantaneous, actionable intelligence using advanced vocal and sentiment analytics.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <GlassCard icon={<Mic className="w-6 h-6 text-emerald-400"/>} title="Native Voice" desc="Zero-friction acoustic capture." />
            <GlassCard icon={<BrainCircuit className="w-6 h-6 text-purple-400"/>} title="Neural Llama-3" desc="Deep context extraction." />
            <GlassCard icon={<BarChart3 className="w-6 h-6 text-blue-400"/>} title="Live Intel" desc="Streaming dashboard metrics." />
            <GlassCard icon={<Sparkles className="w-6 h-6 text-amber-400"/>} title="Smart Alerts" desc="Priority sentiment flagged." />
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════ */}
        {/* SECTION 3: DASHBOARD PEEK & CTA                    */}
        {/* ═══════════════════════════════════════════════ */}
        <motion.div
           style={{
             opacity: dashboardOpacity,
             y: dashboardY,
             scale: dashboardScale,
             z: 30
           }}
           className="absolute bottom-[-10vh] md:bottom-[-20vh] w-full max-w-[1200px] mx-auto pointer-events-auto"
        >
          {/* Abstract Dashboard Mockup */}
          <div className="w-full aspect-[21/9] rounded-t-[2.5rem] border-t border-x border-white/10 bg-[#161B22]/80 backdrop-blur-2xl shadow-[0_-20px_60px_-15px_rgba(59,130,246,0.2)] p-2 relative overflow-hidden">
             
             {/* The CTA overlaying the dashboard */}
             <motion.div 
                style={{ opacity: ctaOpacity, y: ctaY }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-50 rounded-t-[2.5rem]"
             >
                <div className="max-w-2xl text-center px-6">
                  <h3 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">Deploy your intelligence hub instantly.</h3>
                  <button 
                    onClick={() => navigate('/login')}
                    className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold text-lg overflow-hidden transition-transform hover:scale-105 active:scale-95"
                  >
                    <span className="relative z-10">Access The Portal</span>
                    <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-slate-200 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <p className="mt-6 text-sm text-slate-400 font-mono">Secure Firebase Authentication Engine.</p>
                </div>
             </motion.div>

             {/* Faux Dashboard UI Elements */}
             <div className="w-full h-full border border-white/5 bg-[#0D1117] rounded-t-[2rem] p-8 flex gap-6 opacity-30">
                <div className="w-64 h-full hidden lg:flex flex-col gap-4 border-r border-white/5 pr-6">
                  <div className="w-32 h-6 bg-white/10 rounded-full mb-8"></div>
                  {[1,2,3,4,5].map(i => <div key={i} className="w-full h-10 bg-white/5 rounded-xl"></div>)}
                </div>
                <div className="flex-1 flex flex-col gap-6">
                  <div className="flex gap-4 h-32">
                    <div className="flex-1 bg-white/5 rounded-2xl border border-white/5"></div>
                    <div className="flex-1 bg-white/5 rounded-2xl border border-white/5"></div>
                    <div className="flex-1 bg-blue-500/20 rounded-2xl border border-blue-500/20"></div>
                  </div>
                  <div className="flex-1 bg-white/5 rounded-2xl border border-white/5 p-6 flex flex-col gap-4">
                    <div className="w-1/4 h-6 bg-white/10 rounded-full"></div>
                    <div className="w-full flex-1 border-b border-dashed border-white/10"></div>
                  </div>
                </div>
             </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

// Subcomponent: Glass Card
function GlassCard({ icon, title, desc }) {
  return (
    <div className="p-6 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl flex flex-col gap-4 hover:bg-white/10 transition-colors">
      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/5 shadow-inner">
        {icon}
      </div>
      <div>
        <h4 className="text-white font-bold text-lg tracking-tight mb-1">{title}</h4>
        <p className="text-slate-400 text-sm font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
