import React from 'react';
import { 
  Crosshair, Layers, AlertCircle, ShieldAlert, Sparkles, ArrowUpRight 
} from 'lucide-react';

export interface PromptScenario {
  id: string;
  category: string;
  orderNumber: string;
  complaintText: string;
  targetIngredient: string;
  evidence1Path: string;
  evidence2Path?: string;
  title: string;
  description: string;
  modelBadge: string;
  accentColor: string;
  borderColor: string;
  icon: any;
}

interface SuggestedPromptsProps {
  onSelectScenario: (scenario: PromptScenario, autoRun?: boolean) => void;
}

export const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ onSelectScenario }) => {
  const scenarios: PromptScenario[] = [
    {
      id: 'missing-topping',
      category: 'Missing Food Item / Ingredient',
      orderNumber: 'ORD-8942-X',
      complaintText: 'I ordered a Paneer Pizza, but there is no paneer on it.',
      targetIngredient: 'paneer',
      evidence1Path: '/static/uploads/sample_pizza_nopaneer.jpg',
      title: 'Missing Topping (Paneer Pizza)',
      description: 'Detects visible pizza crust, cheese & veggies. Verifies paneer absence using YOLOv8.',
      modelBadge: 'Model 1: Food YOLO',
      accentColor: 'text-cyan-300',
      borderColor: 'border-cyan-500/30 hover:border-cyan-400 hover:shadow-neon-cyan',
      icon: Crosshair
    },
    {
      id: 'package-tampering',
      category: 'Package Tampering / Condition Change',
      orderNumber: 'ORD-8942-X',
      complaintText: 'The package security seal was broken and cut when delivered by the courier.',
      targetIngredient: '',
      evidence1Path: '/static/uploads/sample_pkg_dispatch.jpg',
      evidence2Path: '/static/uploads/sample_pkg_tampered.jpg',
      title: 'Package Seal Cut / Tampering',
      description: 'Aligns dispatch vs handover photo using ORB homography & SSIM to detect broken security seal.',
      modelBadge: 'Model 2: Package Verifier',
      accentColor: 'text-violet-300',
      borderColor: 'border-violet-500/30 hover:border-violet-400 hover:shadow-neon-violet',
      icon: Layers
    },
    {
      id: 'food-spillage',
      category: 'Food Spillage / Leakage',
      orderNumber: 'ORD-7721-B',
      complaintText: 'The curry container ruptured in the thermal transit bag and spilled liquid everywhere.',
      targetIngredient: '',
      evidence1Path: '/static/uploads/sample_spill.jpg',
      title: 'Liquid Spillage & Broken Container',
      description: 'Scans for fluid pooling, stains, and container deformation inside delivery bag.',
      modelBadge: 'Model 3: Spillage YOLO',
      accentColor: 'text-amber-300',
      borderColor: 'border-amber-500/30 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]',
      icon: AlertCircle
    },
    {
      id: 'foreign-contaminant',
      category: 'Foreign Object in Food',
      orderNumber: 'ORD-4419-C',
      complaintText: 'There was an unwanted foreign hair strand inside the food dish.',
      targetIngredient: 'hair',
      evidence1Path: '/static/uploads/sample_foreign_hair.jpg',
      title: 'Foreign Contaminant in Dish',
      description: 'High-resolution scan for foreign hair strands, plastic shards, or insects.',
      modelBadge: 'Model 4: Foreign Object',
      accentColor: 'text-rose-300',
      borderColor: 'border-rose-500/30 hover:border-rose-400 hover:shadow-neon-rose',
      icon: ShieldAlert
    }
  ];

  return (
    <div className="py-2 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase font-mono font-bold tracking-wider text-slate-400 flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Interactive Forensic Presets (1-Click Run):</span>
        </span>
        <span className="text-[10px] text-slate-500 font-mono">Select scenario to auto-populate</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          return (
            <div
              key={sc.id}
              onClick={() => onSelectScenario(sc, false)}
              className={`group p-3.5 rounded-2xl bg-slate-900/80 border ${sc.borderColor} cursor-pointer transition-all duration-300 relative overflow-hidden backdrop-blur-sm`}
            >
              {/* Subtle accent glow gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-white/10 group-hover:scale-105 transition-transform">
                    <Icon className={`w-4 h-4 ${sc.accentColor}`} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-950 text-slate-300 border border-white/10 block w-fit">
                      {sc.modelBadge}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectScenario(sc, true);
                  }}
                  title="Auto-fill and execute immediately"
                  className="px-2 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-mono flex items-center space-x-1 border border-cyan-500/30 transition-all opacity-80 group-hover:opacity-100"
                >
                  <span>Run Now</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              <h4 className="text-xs font-bold text-white group-hover:text-cyan-200 transition-colors">
                {sc.title}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                {sc.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};