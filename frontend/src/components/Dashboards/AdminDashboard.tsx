import React, { useState } from 'react';
import { 
  ShieldCheck, BarChart3, FileSearch, Users, 
  Cpu, Bot, AlertTriangle, Eye, ArrowUpRight, TrendingUp 
} from 'lucide-react';
import { DashboardStats, Investigation, ModelStatusCard, User } from '../../types';
import { MainDashboard } from '../Dashboard/MainDashboard';
import { InvestigationList } from '../Investigations/InvestigationList';
import { AdminPanel } from '../Admin/AdminPanel';
import { ModelsLab } from '../ModelsLab/ModelsLab';
import { ChatbotInterface } from '../Chatbot/ChatbotInterface';

interface AdminDashboardProps {
  currentUser: User;
  stats: DashboardStats | null;
  onViewInvestigation: (inv: Investigation) => void;
  onOpenAuth: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  stats,
  onViewInvestigation,
  onOpenAuth
}) => {
  const [adminTab, setAdminTab] = useState<'overview' | 'investigations' | 'audit' | 'models' | 'simulator'>('overview');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      {/* Admin Hero Header */}
      <div className="glass-panel p-6 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-[#170e28] via-[#1b122f] to-[#0a0f1d] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-glass">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/40 text-violet-300 font-mono font-bold tracking-wider uppercase">
              FORENSIC OPERATIONS & AUDIT CENTER
            </span>
            <span className="text-xs text-slate-400 font-mono">• Investigator: {currentUser.full_name}</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide mt-1">
            Global Dispute Oversight & Adjudication
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Full platform authority: multi-party dispute resolution, computer vision telemetry, security audit logs, and retraining curation.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-4 py-2 rounded-xl bg-slate-900 border border-violet-500/30 text-right font-mono">
            <span className="text-[10px] text-slate-400 uppercase block">Global Risk Index</span>
            <span className="text-lg font-bold text-violet-300">{stats?.avg_risk_score ?? 45.0} / 100</span>
          </div>
        </div>
      </div>

      {/* Admin Sub-Navigation */}
      <div className="flex flex-wrap border-b border-white/10 pb-3 gap-2">
        <button
          onClick={() => setAdminTab('overview')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            adminTab === 'overview'
              ? 'bg-gradient-to-r from-violet-500/25 to-indigo-500/25 text-violet-300 border border-violet-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-violet-400" />
          <span>Global Risk Radar</span>
        </button>

        <button
          onClick={() => setAdminTab('investigations')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            adminTab === 'investigations'
              ? 'bg-gradient-to-r from-violet-500/25 to-indigo-500/25 text-violet-300 border border-violet-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileSearch className="w-4 h-4 text-violet-400" />
          <span>Dispute Dossiers & Adjudication</span>
        </button>

        <button
          onClick={() => setAdminTab('audit')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            adminTab === 'audit'
              ? 'bg-gradient-to-r from-violet-500/25 to-indigo-500/25 text-violet-300 border border-violet-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4 text-violet-400" />
          <span>Platform Audit Hub</span>
        </button>

        <button
          onClick={() => setAdminTab('models')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            adminTab === 'models'
              ? 'bg-gradient-to-r from-violet-500/25 to-indigo-500/25 text-violet-300 border border-violet-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Cpu className="w-4 h-4 text-violet-400" />
          <span>Vision Lab & Weights Ingestion</span>
        </button>

        <button
          onClick={() => setAdminTab('simulator')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            adminTab === 'simulator'
              ? 'bg-gradient-to-r from-violet-500/25 to-indigo-500/25 text-violet-300 border border-violet-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bot className="w-4 h-4 text-violet-400" />
          <span>Forensic Simulator (AI Chatbot)</span>
        </button>
      </div>

      {/* RENDER ACTIVE ADMIN TAB */}
      {adminTab === 'overview' && (
        <MainDashboard
          stats={stats}
          onViewInvestigation={onViewInvestigation}
          onNavigateTab={(tab) => {
            if (tab === 'chatbot') setAdminTab('simulator');
            else if (tab === 'investigations') setAdminTab('investigations');
            else if (tab === 'models') setAdminTab('models');
          }}
        />
      )}

      {adminTab === 'investigations' && (
        <InvestigationList
          onSelectInvestigation={onViewInvestigation}
        />
      )}

      {adminTab === 'audit' && (
        <AdminPanel
          onViewInvestigation={onViewInvestigation}
        />
      )}

      {adminTab === 'models' && (
        <ModelsLab />
      )}

      {adminTab === 'simulator' && (
        <ChatbotInterface
          currentUser={currentUser}
          onOpenAuth={onOpenAuth}
          onViewInvestigation={onViewInvestigation}
        />
      )}
    </div>
  );
};
