import React, { useState, useEffect } from 'react';
import { 
  Building2, ShieldCheck, CheckCircle2, AlertTriangle, 
  Upload, Camera, FileText, Send, Eye, RefreshCw, ChefHat, Layers
} from 'lucide-react';
import { api } from '../../api/client';
import { User, Investigation } from '../../types';

interface RestaurantDashboardProps {
  currentUser: User;
  onViewInvestigation: (inv: Investigation) => void;
}

export const RestaurantDashboard: React.FC<RestaurantDashboardProps> = ({
  currentUser,
  onViewInvestigation
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'orders' | 'disputes' | 'recipes'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Dispatch photo upload state
  const [uploadingOrder, setUploadingOrder] = useState<string | null>(null);
  const [dispatchFile, setDispatchFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Dispute response state
  const [respondingInvId, setRespondingInvId] = useState<number | null>(null);
  const [responseText, setResponseText] = useState<string>('');
  const [submittingResp, setSubmittingResp] = useState<boolean>(false);

  const fetchStats = () => {
    setLoading(true);
    api.dashboard.getRoleStats()
      .then(data => setStats(data))
      .catch(err => console.error('Failed to load restaurant stats:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, [currentUser]);

  const handleUploadDispatch = async (orderNumber: string) => {
    if (!dispatchFile) return;
    setUploadStatus('Uploading dispatch proof...');
    try {
      await api.orders.uploadDispatchPhoto(orderNumber, dispatchFile);
      setUploadStatus('Dispatch proof photo recorded successfully!');
      setDispatchFile(null);
      setUploadingOrder(null);
      fetchStats();
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (err: any) {
      setUploadStatus(`Upload failed: ${err.message}`);
    }
  };

  const handleSubmitResponse = async (invId: number) => {
    if (!responseText.trim()) return;
    setSubmittingResp(true);
    try {
      await api.investigations.submitRestaurantResponse(invId, responseText);
      setResponseText('');
      setRespondingInvId(null);
      fetchStats();
    } catch (err: any) {
      alert(`Error submitting response: ${err.message}`);
    } finally {
      setSubmittingResp(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      {/* Restaurant Header */}
      <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-[#0a1816] via-[#0b1f1a] to-[#0a0f1d] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-glass">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono font-bold tracking-wider uppercase">
              RESTAURANT KITCHEN OPERATIONS
            </span>
            <span className="text-xs text-slate-400 font-mono">• {stats?.restaurant_name || 'Bella Napoli Gourmet Pizza'}</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide mt-1">
            Kitchen Compliance & Dispute Defense
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Log dispatch packaging evidence, review customer topping allegations, and submit kitchen verification notes.
          </p>
        </div>

        {/* Kitchen Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 block uppercase">Compliance</span>
            <span className="text-lg font-bold text-emerald-400">{stats?.compliance_score ?? 97.5}%</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 block uppercase">Orders Baked</span>
            <span className="text-lg font-bold text-white">{stats?.total_orders_prepared ?? 0}</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 block uppercase">Disputes</span>
            <span className="text-lg font-bold text-amber-400">{stats?.disputes_received ?? 0}</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 block uppercase">Confirmed Fault</span>
            <span className="text-lg font-bold text-slate-300">{stats?.confirmed_faults ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Restaurant Navigation Bar */}
      <div className="flex border-b border-white/10 pb-3 gap-2">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'overview'
              ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span>Kitchen Overview</span>
        </button>

        <button
          onClick={() => setActiveSubTab('orders')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'orders'
              ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Camera className="w-4 h-4 text-emerald-400" />
          <span>Kitchen Orders & Dispatch Proof ({stats?.recent_orders?.length ?? 0})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('disputes')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'disputes'
              ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Dispute Inquiries & Defense ({stats?.disputes?.length ?? 0})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('recipes')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'recipes'
              ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ChefHat className="w-4 h-4 text-emerald-400" />
          <span>Recipe & Ingredient Specs</span>
        </button>
      </div>

      {uploadStatus && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
          {uploadStatus}
        </div>
      )}

      {/* SUB-TAB 1: KITCHEN OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#0c1222]/80 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Dispute Category Breakdown</h3>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900/60">
                <span className="text-slate-300">Missing Topping Claims:</span>
                <span className="text-cyan-400 font-bold">{stats?.missing_ingredient_claims ?? 0}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900/60">
                <span className="text-slate-300">Food Spillage Claims:</span>
                <span className="text-amber-400 font-bold">{stats?.spillage_claims ?? 0}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900/60">
                <span className="text-slate-300">Packaging Discrepancies:</span>
                <span className="text-violet-400 font-bold">{stats?.packaging_claims ?? 0}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Dispatch proof photos reduce false missing ingredient claims by over 88%.
            </p>
          </div>

          <div className="md:col-span-2 glass-panel p-6 rounded-2xl border border-white/10 bg-[#0c1222]/80 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Active Kitchen Dispute Inquiries</h3>
              <button 
                onClick={() => setActiveSubTab('disputes')}
                className="text-xs text-emerald-400 font-mono hover:underline"
              >
                View Dispute Response Desk →
              </button>
            </div>

            <div className="space-y-2.5">
              {stats?.disputes?.slice(0, 3).map((d: any) => (
                <div key={d.id} className="p-3.5 rounded-xl bg-slate-900/70 border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-emerald-400 text-xs">{d.investigation_code}</span>
                      <span className="text-xs text-white font-medium">{d.complaint_category}</span>
                    </div>
                    <p className="text-xs text-slate-400 italic mt-0.5">"{d.original_query}"</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 block mb-1">
                      {d.final_verdict}
                    </span>
                    <button
                      onClick={() => onViewInvestigation(d)}
                      className="text-emerald-400 hover:text-emerald-300 text-xs underline font-semibold"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: KITCHEN ORDERS & DISPATCH PROOF */}
      {activeSubTab === 'orders' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#0c1222]/80 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Orders Baked & Dispatch Proof Capture
              </h2>
              <p className="text-xs text-slate-400">
                Upload packaging proof before handing order to courier to safeguard against false claims.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400">{stats?.recent_orders?.length ?? 0} orders</span>
          </div>

          <div className="space-y-3">
            {stats?.recent_orders?.map((ord: any) => (
              <div 
                key={ord.id}
                className="p-4 rounded-xl bg-slate-900/70 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-emerald-400 text-xs">{ord.order_number}</span>
                    <span className="text-xs text-slate-400 font-mono">• {new Date(ord.order_date).toLocaleDateString()}</span>
                  </div>
                  <div className="text-xs font-bold text-white">
                    {ord.items.map((i: any) => `${i.quantity}x ${i.item}`).join(', ')}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Toppings: {ord.items[0]?.ingredients?.join(', ') || 'Standard recipe'}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {ord.has_dispatch_photo ? (
                    <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>DISPATCH PROOF ON FILE</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {uploadingOrder === ord.order_number ? (
                        <div className="flex items-center space-x-2">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => setDispatchFile(e.target.files ? e.target.files[0] : null)}
                            className="text-xs text-slate-400 file:py-1 file:px-2 file:rounded file:bg-slate-800 file:text-emerald-400 file:border-0"
                          />
                          <button
                            onClick={() => handleUploadDispatch(ord.order_number)}
                            disabled={!dispatchFile}
                            className="py-1 px-3 bg-emerald-400 text-black text-xs font-bold rounded-lg hover:bg-emerald-300 disabled:opacity-50"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setUploadingOrder(ord.order_number)}
                          className="py-1.5 px-3 rounded-lg text-xs font-bold bg-slate-800 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 flex items-center space-x-1"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Attach Packaging Proof</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DISPUTE INQUIRIES & DEFENSE DESK */}
      {activeSubTab === 'disputes' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#0c1222]/80 space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">Kitchen Dispute Defense Desk</h2>
            <p className="text-xs text-slate-400">
              Submit kitchen recipe verification notes and counter-evidence for customer complaints.
            </p>
          </div>

          <div className="space-y-4">
            {stats?.disputes?.map((inv: any) => (
              <div key={inv.id} className="p-5 rounded-xl bg-slate-900/80 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-emerald-400 text-xs">{inv.investigation_code}</span>
                    <span className="text-xs text-white font-medium">{inv.complaint_category}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                    Risk Score: {inv.risk_score}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/70 border border-white/5 text-xs text-slate-300">
                  <span className="text-[10px] text-slate-500 font-mono uppercase block mb-0.5">Customer Allegation:</span>
                  <p className="italic">"{inv.original_query}"</p>
                </div>

                {inv.has_response ? (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300">
                    <span className="text-[10px] font-bold uppercase font-mono block mb-0.5">Kitchen Statement Recorded:</span>
                    <p>{inv.restaurant_response}</p>
                  </div>
                ) : (
                  <div>
                    {respondingInvId === inv.id ? (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          placeholder="Enter kitchen explanation e.g. 'Station #2 confirmed paneer was weighed at 120g and baked; dispatch photo on record verifies sealed packaging'..."
                          className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/40 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSubmitResponse(inv.id)}
                            disabled={submittingResp || !responseText.trim()}
                            className="py-1.5 px-3 bg-emerald-400 text-black text-xs font-bold rounded-lg hover:bg-emerald-300 disabled:opacity-50"
                          >
                            {submittingResp ? 'Submitting...' : 'Submit Kitchen Statement'}
                          </button>
                          <button
                            onClick={() => { setRespondingInvId(null); setResponseText(''); }}
                            className="py-1.5 px-3 bg-slate-800 text-slate-400 text-xs rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setRespondingInvId(inv.id); setResponseText(''); }}
                        className="py-1 px-3 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/25"
                      >
                        + Submit Kitchen Explanation
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: RECIPE SPECS */}
      {activeSubTab === 'recipes' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#0c1222]/80 space-y-4">
          <div className="flex items-center space-x-2">
            <ChefHat className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              FoodGuard AI Recipe Ingredient Standards
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Official ingredient classes recognized by Model 1 (Food Ingredient YOLO) to ensure verified compliance:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {[
              { item: 'Paneer (Cottage Cheese)', spec: '100g - 130g cubed', aiClass: 'paneer' },
              { item: 'Mozzarella Cheese', spec: 'Full surface coverage', aiClass: 'cheese' },
              { item: 'San Marzano Tomato Sauce', spec: 'Base spread 80g', aiClass: 'tomato' },
              { item: 'Red Onions', spec: 'Sliced rings', aiClass: 'onion' },
              { item: 'Green Bell Pepper', spec: 'Diced capsicum', aiClass: 'capsicum' },
              { item: 'Pizza Crust', spec: 'Golden brown baked edge', aiClass: 'crust' }
            ].map((r, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
                <span className="text-xs font-bold text-white block">{r.item}</span>
                <span className="text-[11px] text-slate-400 block font-mono">Kitchen Spec: {r.spec}</span>
                <span className="text-[10px] text-emerald-400 font-mono block">YOLO Target: {r.aiClass}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
