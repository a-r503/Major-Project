import React from 'react';
import { Cpu, Sparkles, Activity } from 'lucide-react';

interface AIOrbProps {
  status: 'idle' | 'analyzing' | 'responding';
}

export const AIOrb: React.FC<AIOrbProps> = ({ status }) => {
  const isAnalyzing = status === 'analyzing';
  const isResponding = status === 'responding';

  return (
    <div className="relative flex flex-col items-center justify-center py-6 px-4 select-none">
      {/* Background Ambient Glow Halo */}
      <div 
        className={`absolute w-44 h-44 rounded-full blur-[60px] pointer-events-none transition-all duration-700 ${
          isAnalyzing 
            ? 'bg-cyan-400/35 scale-125' 
            : isResponding 
            ? 'bg-violet-500/35 scale-110' 
            : 'bg-cyan-500/20 scale-100'
        }`} 
      />

      {/* Outer Rotating Energy Rings Container */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        
        {/* Ring 1 - Large outer dashed orbit */}
        <div 
          className={`absolute inset-0 rounded-full border border-dashed border-cyan-400/40 pointer-events-none transition-all duration-500 ${
            isAnalyzing ? 'animate-spin-fast border-cyan-300' : 'animate-spin-slow'
          }`} 
        />

        {/* Ring 2 - Middle reverse orbit with neon accent notches */}
        <div 
          className={`absolute inset-2.5 rounded-full border border-violet-500/30 border-t-transparent border-b-transparent pointer-events-none transition-all duration-500 ${
            isAnalyzing ? 'animate-spin-reverse-fast border-violet-400' : 'animate-spin-reverse-slow'
          }`} 
        />

        {/* Ring 3 - Inner high-frequency energy halo */}
        <div 
          className={`absolute inset-5 rounded-full border-2 border-cyan-500/20 pointer-events-none transition-all duration-700 ${
            isAnalyzing ? 'scale-110 border-cyan-400 shadow-neon-cyan animate-pulse' : 'scale-100'
          }`} 
        />

        {/* Floating Particle Specks */}
        <div className="absolute -top-1 left-8 w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse-glow" />
        <div className="absolute top-10 -right-1 w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse-glow delay-200" />
        <div className="absolute -bottom-1 right-10 w-2 h-2 rounded-full bg-blue-400 animate-pulse-glow delay-500" />
        <div className="absolute bottom-8 -left-2 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse-glow delay-700" />

        {/* Core Luminous AI Orb Sphere */}
        <div 
          className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-700 ${
            isAnalyzing 
              ? 'scale-110 shadow-neon-cyan animate-pulse' 
              : 'animate-float-slow shadow-neon-cyan hover:scale-105'
          }`}
          style={{
            background: isAnalyzing 
              ? 'radial-gradient(circle at 35% 35%, #67e8f9 0%, #06b6d4 40%, #0369a1 70%, #0f172a 100%)'
              : isResponding
              ? 'radial-gradient(circle at 35% 35%, #c084fc 0%, #a855f7 40%, #7e22ce 70%, #0f172a 100%)'
              : 'radial-gradient(circle at 35% 35%, #38bdf8 0%, #0284c7 45%, #1e1b4b 80%, #080c14 100%)',
            boxShadow: isAnalyzing 
              ? '0 0 40px rgba(6, 182, 212, 0.7), inset 0 0 20px rgba(255, 255, 255, 0.6)'
              : '0 0 30px rgba(56, 189, 248, 0.45), inset 0 0 15px rgba(255, 255, 255, 0.4)'
          }}
        >
          {/* Specular Inner Highlight */}
          <div className="absolute top-2.5 left-3.5 w-5 h-3 rounded-full bg-white/40 blur-[1px] transform -rotate-45" />

          {/* Center Neural Core Icon */}
          <div className="relative z-10 flex items-center justify-center text-white">
            {isAnalyzing ? (
              <Sparkles className="w-8 h-8 text-cyan-200 animate-spin" />
            ) : isResponding ? (
              <Activity className="w-8 h-8 text-violet-200 animate-pulse" />
            ) : (
              <Cpu className="w-8 h-8 text-cyan-100 opacity-90 transition-transform hover:scale-110" />
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Soundwave Equalizer / Waveform (shown when responding or analyzing) */}
      <div className="flex items-center space-x-1.5 h-6 mt-3">
        {isResponding || isAnalyzing ? (
          <>
            <span className="w-1 bg-cyan-400 rounded-full animate-equalizer-1 shadow-sm" />
            <span className="w-1 bg-cyan-300 rounded-full animate-equalizer-2 shadow-sm" />
            <span className="w-1 bg-violet-400 rounded-full animate-equalizer-3 shadow-sm" />
            <span className="w-1 bg-cyan-400 rounded-full animate-equalizer-4 shadow-sm" />
            <span className="w-1 bg-violet-300 rounded-full animate-equalizer-5 shadow-sm" />
            <span className="w-1 bg-cyan-400 rounded-full animate-equalizer-2 shadow-sm" />
            <span className="w-1 bg-blue-400 rounded-full animate-equalizer-1 shadow-sm" />
          </>
        ) : (
          <div className="flex items-center space-x-1 opacity-40">
            <span className="w-1 h-1.5 bg-slate-500 rounded-full" />
            <span className="w-1 h-2 bg-slate-500 rounded-full" />
            <span className="w-1 h-3 bg-cyan-500 rounded-full" />
            <span className="w-1 h-2 bg-slate-500 rounded-full" />
            <span className="w-1 h-1.5 bg-slate-500 rounded-full" />
          </div>
        )}
      </div>

      {/* Online Status Pill */}
      <div className="mt-2 inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/90 border border-cyan-500/30 text-[11px] font-mono shadow-sm">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-emerald-300 font-semibold tracking-wider">ONLINE</span>
        <span className="text-slate-600">•</span>
        <span className="text-cyan-400 font-mono">NEURAL FORENSIC v2.4</span>
      </div>

      {/* Assistant Identity & Dynamic State Caption */}
      <div className="text-center mt-2 space-y-0.5">
        <h3 className="font-black text-sm tracking-wider text-white">
          FOODGUARD NEURAL INVESTIGATOR
        </h3>
        <p className="text-[11px] font-mono text-slate-400">
          {isAnalyzing 
            ? 'Running Computer Vision Ingestion Pipeline...' 
            : isResponding 
            ? 'Synthesizing Forensic Adjudication Report...' 
            : 'Autonomous Dispute Resolution & Vision Core'}
        </p>
      </div>
    </div>
  );
};