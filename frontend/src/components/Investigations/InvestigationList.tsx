import React, { useState, useEffect } from 'react';
import { 
  FileSearch, Search, Filter, Eye, ShieldCheck, 
  AlertTriangle, CheckCircle2, Clock, Calendar, ArrowRight 
} from 'lucide-react';
import { api } from '../../api/client';
import { Investigation } from '../../types';

interface InvestigationListProps {
  onSelectInvestigation: (inv: Investigation) => void;
}

export const InvestigationList: React.FC<InvestigationListProps> = ({
  onSelectInvestigation
}) => {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [verdictFilter, setVerdictFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const fetchInvestigations = async () => {
    setLoading(true);
    try {
      const data = await api.investigations.list({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        verdict: verdictFilter !== 'all' ? verdictFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined
      });
      setInvestigations(data);
    } catch (err) {
      console.error('Error fetching investigations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestigations();
  }, [statusFilter, verdictFilter, categoryFilter]);

  const filtered = investigations.filter(inv => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      inv.investigation_code.toLowerCase().includes(term) ||
      inv.complaint_category.toLowerCase().includes(term) ||
      inv.original_query.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-white/10 bg-[#0a0f1d]/90">
        <div>
          <div className="flex items-center space-x-2">
            <FileSearch className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-black text-white tracking-wide">DISPUTE INVESTIGATION ARCHIVE</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete immutable ledger of customer complaints, computer vision telemetry, and forensic decisions
          </p>
        </div>

        <div className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/30">
          Total Records: {filtered.length}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-[#0c1222]/80 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, order #, or complaint keyword..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-400 text-xs"
          >
            <option value="all">All Categories</option>
            <option value="Missing">Missing Ingredient</option>
            <option value="Package">Package Tampering</option>
            <option value="Spillage">Food Spillage</option>
            <option value="Foreign">Foreign Object</option>
          </select>

          <select
            value={verdictFilter}
            onChange={(e) => setVerdictFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-400 text-xs"
          >
            <option value="all">All Verdicts</option>
            <option value="Verified Issue">Verified Issue</option>
            <option value="Requires Manual Investigation">Requires Review</option>
            <option value="Confirmed Fraud">Confirmed Fraud</option>
            <option value="No Issue Detected">No Issue Detected</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-400 text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Investigations Table */}
      <div className="glass-panel rounded-2xl border border-white/10 bg-[#0c1222]/80 overflow-hidden shadow-glass">
        {loading ? (
          <div className="p-12 text-center text-cyan-400 font-mono text-xs">
            Loading investigation records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono text-xs">
            No matching dispute investigations found in database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 bg-slate-900/60 text-slate-400 text-[11px]">
                  <th className="py-3 px-4">INVESTIGATION CODE</th>
                  <th className="py-3 px-4">COMPLAINT CATEGORY</th>
                  <th className="py-3 px-4">MODEL DISPATCHED</th>
                  <th className="py-3 px-4">RISK INDEX</th>
                  <th className="py-3 px-4">ADJUDICATION VERDICT</th>
                  <th className="py-3 px-4">RESPONSIBLE</th>
                  <th className="py-3 px-4">DATE</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-bold text-cyan-400">{inv.investigation_code}</td>
                    <td className="py-3 px-4 text-slate-200 max-w-[180px] truncate">{inv.complaint_category}</td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-[160px]">{inv.selected_model.split(':')[0]}</td>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${
                        inv.risk_score > 60 ? 'text-rose-400' : 'text-cyan-400'
                      }`}>
                        {inv.risk_score} / 100
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        inv.final_verdict === 'Verified Issue'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : inv.final_verdict === 'Confirmed Fraud'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}>
                        {inv.final_verdict}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-semibold">{inv.responsible_party}</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectInvestigation(inv)}
                        className="py-1 px-3 rounded-lg bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/30 font-semibold transition-all"
                      >
                        Inspect Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
