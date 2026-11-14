import React from 'react';
import { 
  BarChart3, ShieldAlert, CheckCircle2, Clock, 
  Cpu, ArrowUpRight, TrendingUp, AlertTriangle, Eye, Layers, Crosshair, Droplets
} from 'lucide-react';
import { DashboardStats, Investigation, ModelStatusCard } from '../../types';

interface MainDashboardProps {
  stats: DashboardStats | null;
  onViewInvestigation: (inv: Investigation) => void;
  onNavigateTab: (tab: string) => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  stats,
  onViewInvestigation,
  onNavigateTab
}) => {
  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-3 text-cyan-400 font-mono text-sm">
          <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>Synchronizing FoodGuard Telemetry Engine...</span>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total Investigations',
      value: stats.total_investigations,
      desc: 'Dispute inquiries processed',
      icon: BarChart3,
      color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30'
    },
    {
      label: 'Verified Claims',
      value: stats.verified_claims,
      desc: 'Photographically substantiated',
      icon: CheckCircle2,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30'
    },
    {
      label: 'Under Human Review',
      value: stats.claims_requiring_review,
      desc: 'Requires officer assessment',
      icon: Clock,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30'
    },
    {
      label: 'Suspicious Anomalies',
      value: stats.potential_suspicious_activity,
      desc: 'High dispute discrepancy',
      icon: ShieldAlert,
      color: 'from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Welcome & Health Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-white/10 bg-[#0a0f1d]/90">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-white tracking-wide">OPERATIONAL INTELLIGENCE</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono border border-cyan-500/30">
              REAL-TIME DISPUTE RADAR
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Centralized food delivery fraud mitigation, packaging integrity, and multi-model computer vision telemetry
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-right">
            <span className="text-[10px] text-slate-400 font-mono block">Aggregate Risk Index</span>
            <span className="text-lg font-bold font-mono text-cyan-400">{stats.avg_risk_score} / 100</span>
          </div>
          <button
            onClick={() => onNavigateTab('chatbot')}
            className="py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 text-black hover:opacity-95 shadow-neon-cyan flex items-center space-x-2 transition-all"
          >
            <span>Launch Investigator</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="glass-panel p-5 rounded-2xl border border-white/10 bg-[#0c1222]/80 hover:border-cyan-500/30 transition-all shadow-glass"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">{kpi.label}</span>
                <div className={`p-2 rounded-xl bg-gradient-to-tr ${kpi.color} border`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white font-mono tracking-tight">{kpi.value}</div>
              <div className="text-[11px] text-slate-500 mt-1">{kpi.desc}</div>
            </div>
          );
        })}
      </div>

      {/* 4 Computer Vision Model Status Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Integrated Computer Vision Engines
            </h2>
          </div>
          <button 
            onClick={() => onNavigateTab('models')}
            className="text-xs text-cyan-400 hover:underline font-mono"
          >
            Manage Model Weights & Retraining →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.models_status.map((m) => (
            <div
              key={m.id}
              className="glass-panel p-5 rounded-2xl border border-white/10 bg-[#0d1424]/90 flex flex-col justify-between hover:border-cyan-500/30 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase font-semibold">
                    {m.id.toUpperCase().replace('_', ' ')}
                  </span>
                  <span className="flex items-center space-x-1 text-[11px] font-mono text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>ONLINE</span>
                  </span>
                </div>

                <h3 className="font-bold text-white text-sm line-clamp-1">{m.name}</h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">{m.type}</p>

                <div className="mt-4 space-y-1.5 text-[11px] font-mono border-t border-white/5 pt-3">
                  <div className="flex justify-between text-slate-400">
                    <span>Version:</span>
                    <span className="text-slate-200">{m.version}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Latency:</span>
                    <span className="text-cyan-400">{m.latency_ms} ms</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Performance:</span>
                    <span className="text-emerald-400">{m.accuracy_metric}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Class Vocabulary:</span>
                    <span className="text-slate-200">{m.classes_count} classes</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5">
                <span className="text-[9px] text-slate-500 font-mono truncate block">
                  Path: {m.weights_path.split('\\').slice(-2).join('/')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Breakdown & Recent Investigations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Usage Telemetry Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-[#0c1222]/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Dispute Model Dispatch</h3>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="space-y-3">
            {Object.entries(stats.model_usage).map(([name, count]) => {
              const maxVal = Math.max(...Object.values(stats.model_usage), 1);
              const pct = Math.round((count / maxVal) * 100);
              return (
                <div key={name} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300 truncate">{name}</span>
                    <span className="text-cyan-400 font-bold">{count}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(8, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-[11px] text-slate-400">
            Model dispatch is determined autonomously via complaint entity parsing and selected category.
          </div>
        </div>

        {/* Recent Investigations Stream */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-white/10 bg-[#0c1222]/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Recent Dispute Inquiries</h3>
            <button
              onClick={() => onNavigateTab('investigations')}
              className="text-xs text-cyan-400 hover:underline font-mono"
            >
              View All ({stats.total_investigations}) →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 text-slate-500 text-[11px]">
                  <th className="pb-2">CODE</th>
                  <th className="pb-2">CATEGORY</th>
                  <th className="pb-2">MODEL</th>
                  <th className="pb-2">VERDICT</th>
                  <th className="pb-2">RISK</th>
                  <th className="pb-2 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.recent_investigations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 font-bold text-cyan-400">{inv.investigation_code}</td>
                    <td className="py-2.5 text-slate-300 max-w-[140px] truncate">{inv.complaint_category}</td>
                    <td className="py-2.5 text-slate-400 truncate max-w-[120px]">{inv.selected_model.split(':')[0]}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.final_verdict === 'Verified Issue'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : inv.final_verdict === 'Confirmed Fraud'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}>
                        {inv.final_verdict}
                      </span>
                    </td>
                    <td className="py-2.5 font-bold text-slate-200">{inv.risk_score}</td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => onViewInvestigation(inv)}
                        className="text-cyan-400 hover:text-cyan-300 underline font-semibold"
                      >
                        Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
