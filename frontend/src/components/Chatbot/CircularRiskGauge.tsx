import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

interface CircularRiskGaugeProps {
  score: number; // 0 - 100
  size?: number; // width/height in px, default 110
}

export const CircularRiskGauge: React.FC<CircularRiskGaugeProps> = ({ score, size = 110 }) => {
  const radius = (size - 18) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const offset = circumference - (clampedScore / 100) * circumference;

  // Determine risk profile
  const isLow = clampedScore <= 35;
  const isMedium = clampedScore > 35 && clampedScore <= 65;
  const isHigh = clampedScore > 65;

  const colorConfig = isLow
    ? {
        stroke: '#10b981',
        strokeGradient: 'url(#gradientEmerald)',
        textColor: 'text-emerald-400',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        label: 'LOW RISK',
        sublabel: 'Legitimate Claim',
        icon: ShieldCheck,
        glow: 'shadow-neon-emerald'
      }
    : isMedium
    ? {
        stroke: '#f59e0b',
        strokeGradient: 'url(#gradientAmber)',
        textColor: 'text-amber-400',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        label: 'SUSPICIOUS',
        sublabel: 'Inconclusive Factors',
        icon: AlertTriangle,
        glow: 'shadow-[0_0_20px_rgba(245,158,11,0.35)]'
      }
    : {
        stroke: '#f43f5e',
        strokeGradient: 'url(#gradientRose)',
        textColor: 'text-rose-400',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        label: 'HIGH RISK',
        sublabel: 'Suspected Fraud',
        icon: AlertOctagon,
        glow: 'shadow-neon-rose'
      };

  const Icon = colorConfig.icon;

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Background glow behind gauge */}
        <div 
          className="absolute inset-2 rounded-full blur-[14px] pointer-events-none opacity-40 transition-all"
          style={{ backgroundColor: colorConfig.stroke }}
        />

        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id="gradientEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="gradientAmber" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="gradientRose" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
          </defs>

          {/* Background meter track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1e293b"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray="4 4"
          />

          {/* Active progress stroke */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colorConfig.strokeGradient}
            strokeWidth="9"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center numeric readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`font-mono font-black text-xl leading-none ${colorConfig.textColor}`}>
            {clampedScore}
          </span>
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mt-0.5">
            / 100
          </span>
        </div>
      </div>

      {/* Risk Badge */}
      <div className={`mt-2 px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold flex items-center space-x-1 ${colorConfig.badgeColor}`}>
        <Icon className="w-3 h-3 shrink-0" />
        <span>{colorConfig.label}</span>
      </div>
      <span className="text-[10px] text-slate-400 font-mono mt-0.5">
        {colorConfig.sublabel}
      </span>
    </div>
  );
};