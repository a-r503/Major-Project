import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, ShieldCheck, Clock, CheckCircle2, 
  AlertCircle, DollarSign, ArrowRight, Bot, ChevronRight, Eye 
} from 'lucide-react';
import { api } from '../../api/client';
import { User, Order, Investigation } from '../../types';
import { ChatbotInterface } from '../Chatbot/ChatbotInterface';

interface CustomerDashboardProps {
  currentUser: User;
  onOpenAuth: () => void;
  onViewInvestigation: (inv: Investigation) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  currentUser,
  onOpenAuth,
  onViewInvestigation
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'orders' | 'disputes'>('chat');
  const [roleStats, setRoleStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrderForDispute, setSelectedOrderForDispute] = useState<string | null>(null);

  const fetchStats = () => {
    setLoading(true);
    api.dashboard.getRoleStats()
      .then(data => setRoleStats(data))
      .catch(err => console.error('Failed to fetch customer stats:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, [currentUser]);

  const handleStartDisputeForOrder = (orderNumber: string) => {
    setSelectedOrderForDispute(orderNumber);
    setActiveSubTab('chat');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      {/* Top Customer Hero Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#0c1424] via-[#0f172a] to-[#0a0f1d] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-glass">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-mono font-bold tracking-wider uppercase">
              CUSTOMER DISPUTE PORTAL
            </span>
            <span className="text-xs text-slate-400 font-mono">• Account: {currentUser.email}</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide mt-1">
            Welcome back, {currentUser.full_name.split(' ')[0]}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            File orders disputes, verify missing toppings via Computer Vision, and track approved refunds.
          </p>
        </div>

        {/* Customer Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 block uppercase">My Orders</span>
            <span className="text-lg font-bold text-white">{roleStats?.total_orders ?? 0}</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 block uppercase">Under Review</span>
            <span className="text-lg font-bold text-amber-400">{roleStats?.active_disputes ?? 0}</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 block uppercase">Claims Verified</span>
            <span className="text-lg font-bold text-emerald-400">{roleStats?.verified_claims ?? 0}</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-cyan-500/20 text-center">
            <span className="text-[10px] text-cyan-400 block uppercase">Refunded</span>
            <span className="text-lg font-bold text-cyan-300">${roleStats?.total_refunded?.toFixed(2) ?? '0.00'}</span>
          </div>
        </div>
      </div>

      {/* Customer Navigation Bar */}
      <div className="flex border-b border-white/10 pb-3 gap-2">
        <button
          onClick={() => setActiveSubTab('chat')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'chat'
              ? 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bot className="w-4 h-4 text-cyan-400" />
          <span>AI Dispute Investigator</span>
        </button>

        <button
          onClick={() => setActiveSubTab('orders')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'orders'
              ? 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-cyan-400" />
          <span>My Orders ({roleStats?.total_orders ?? 0})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('disputes')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'disputes'
              ? 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>My Disputes & Refunds ({roleStats?.recent_disputes?.length ?? 0})</span>
        </button>
      </div>

      {/* TAB 1: AI CHATBOT INVESTIGATOR */}
      {activeSubTab === 'chat' && (
        <ChatbotInterface
          currentUser={currentUser}
          onOpenAuth={onOpenAuth}
          onViewInvestigation={onViewInvestigation}
          initialOrderNumber={selectedOrderForDispute || undefined}
        />
      )}

      {/* TAB 2: MY ORDERS */}
      {activeSubTab === 'orders' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#0a0f1d]/90 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">My Food Orders</h2>
              <p className="text-xs text-slate-400">Review delivered items, ingredients, and report an issue</p>
            </div>
            <span className="text-xs font-mono text-cyan-400">Total: {roleStats?.recent_orders?.length ?? 0}</span>
          </div>

          <div className="space-y-3">
            {roleStats?.recent_orders?.map((ord: any) => (
              <div 
                key={ord.id} 
                className="p-4 rounded-xl bg-slate-900/70 border border-white/5 hover:border-cyan-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-cyan-400 text-xs">{ord.order_number}</span>
                    <span className="text-[10px] uppercase px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                      {ord.status}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">• {new Date(ord.order_date).toLocaleDateString()}</span>
                  </div>
                  <div className="text-xs font-semibold text-white">
                    {ord.items.map((it: any) => `${it.quantity}x ${it.item}`).join(', ')}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Toppings: {ord.items[0]?.ingredients?.join(', ') || 'Standard recipe'}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="font-mono font-bold text-white text-sm">${ord.total_amount?.toFixed(2)}</span>
                  <button
                    onClick={() => handleStartDisputeForOrder(ord.order_number)}
                    className="py-1.5 px-3 rounded-lg text-xs font-bold bg-cyan-400 text-black hover:bg-cyan-300 shadow-neon-cyan transition-all flex items-center space-x-1"
                  >
                    <span>Report Issue</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MY DISPUTES & REFUNDS */}
      {activeSubTab === 'disputes' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#0a0f1d]/90 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">My Dispute History</h2>
              <p className="text-xs text-slate-400">Track AI verification status, evidence risk scores, and refunds</p>
            </div>
            <button
              onClick={() => setActiveSubTab('chat')}
              className="py-1 px-3 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/40 hover:bg-cyan-500/30"
            >
              + File New Complaint
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 text-slate-500 text-[11px]">
                  <th className="py-2.5">DISPUTE CODE</th>
                  <th className="py-2.5">COMPLAINT</th>
                  <th className="py-2.5">CATEGORY</th>
                  <th className="py-2.5">STATUS</th>
                  <th className="py-2.5">AI VERDICT</th>
                  <th className="py-2.5">RISK</th>
                  <th className="py-2.5 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {roleStats?.recent_disputes?.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 font-bold text-cyan-400">{inv.investigation_code}</td>
                    <td className="py-3 text-slate-200 max-w-[200px] truncate italic">"{inv.original_query}"</td>
                    <td className="py-3 text-slate-400">{inv.complaint_category}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.status === 'resolved' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-300'
                      }`}>
                        {inv.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.final_verdict === 'Verified Issue'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {inv.final_verdict}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-slate-300">{inv.risk_score}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onViewInvestigation(inv)}
                        className="text-cyan-400 hover:text-cyan-300 font-bold underline"
                      >
                        Inspect Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
