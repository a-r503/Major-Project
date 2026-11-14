import React, { useState, useEffect } from 'react';
import { 
  Bike, ShieldCheck, CheckCircle2, AlertTriangle, 
  Camera, Upload, Eye, FileText, Send, Layers, Droplets 
} from 'lucide-react';
import { api } from '../../api/client';
import { User, Investigation } from '../../types';

interface DeliveryDashboardProps {
  currentUser: User;
  onViewInvestigation: (inv: Investigation) => void;
}

export const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({
  currentUser,
  onViewInvestigation
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'deliveries' | 'disputes'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Handover photo upload state
  const [uploadingOrder, setUploadingOrder] = useState<string | null>(null);
  const [handoverFile, setHandoverFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Courier statement state
  const [statementInvId, setStatementInvId] = useState<number | null>(null);
  const [statementText, setStatementText] = useState<string>('');
  const [submittingStmt, setSubmittingStmt] = useState<boolean>(false);

  const fetchStats = () => {
    setLoading(true);
    api.dashboard.getRoleStats()
      .then(data => setStats(data))
      .catch(err => console.error('Failed to load courier stats:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, [currentUser]);

  const handleUploadHandover = async (orderNumber: string) => {
    if (!handoverFile) return;
    setUploadStatus('Recording doorstep handover proof...');
    try {
      await api.orders.uploadHandoverPhoto(orderNumber, handoverFile);
      setUploadStatus('Doorstep handover proof recorded successfully!');
      setHandoverFile(null);
      setUploadingOrder(null);
      fetchStats();
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (err: any) {
      setUploadStatus(`Upload failed: ${err.message}`);
    }
  };

  const handleSubmitStatement = async (invId: number) => {
    if (!statementText.trim()) return;
    setSubmittingStmt(true);
    try {
      await api.investigations.submitCourierStatement(invId, statementText);
      setStatementText('');
      setStatementInvId(null);
      fetchStats();
    } catch (err: any) {
      alert(`Error submitting transit statement: ${err.message}`);
    } finally {
      setSubmittingStmt(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      {/* Courier Header */}
      <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-[#18120a] via-[#1f170b] to-[#0a0f1d] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-glass">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono font-bold tracking-wider uppercase">
              DELIVERY COURIER TERMINAL
            </span>
            <span className="text-xs text-slate-400 font-mono">• {stats?.courier_name || 'SwiftRider Express'} ({stats?.vehicle_type || 'Electric Scooter'})</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide mt-1">
            Transit Integrity & Handover Proof
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Record doorstep delivery photos, protect courier ratings, and respond to package tampering allegations.
          </p>
        </div>

        {/* Courier Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 block uppercase">Transit Integrity</span>
            <span className="text-lg font-bold text-amber-400">{stats?.transit_integrity_score ?? 98.2}%</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 block uppercase">Completed</span>
            <span className="text-lg font-bold text-white">{stats?.deliveries_completed ?? 0}</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 block uppercase">Tamper Inquiries</span>
            <span className="text-lg font-bold text-amber-300">{stats?.tampering_allegations ?? 0}</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 block uppercase">Spillage Inquiries</span>
            <span className="text-lg font-bold text-slate-300">{stats?.spillage_allegations ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Courier Navigation Bar */}
      <div className="flex border-b border-white/10 pb-3 gap-2">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'overview'
              ? 'bg-gradient-to-r from-amber-500/25 to-orange-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bike className="w-4 h-4 text-amber-400" />
          <span>Transit Overview</span>
        </button>

        <button
          onClick={() => setActiveSubTab('deliveries')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'deliveries'
              ? 'bg-gradient-to-r from-amber-500/25 to-orange-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Camera className="w-4 h-4 text-amber-400" />
          <span>Assigned Deliveries & Handover Proof ({stats?.recent_deliveries?.length ?? 0})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('disputes')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'disputes'
              ? 'bg-gradient-to-r from-amber-500/25 to-orange-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Transit Disputes & Tamper Checks ({stats?.transit_disputes?.length ?? 0})</span>
        </button>
      </div>

      {uploadStatus && (
        <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono">
          {uploadStatus}
        </div>
      )}

      {/* SUB-TAB 1: COURIER OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#0c1222]/80 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Transit Dispute Safeguards</h3>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900/60">
                <span className="text-slate-300">Package Tamper Claims:</span>
                <span className="text-amber-400 font-bold">{stats?.tampering_allegations ?? 0}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900/60">
                <span className="text-slate-300">Spillage Incidents:</span>
                <span className="text-rose-400 font-bold">{stats?.spillage_allegations ?? 0}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900/60">
                <span className="text-slate-300">Confirmed Courier Fault:</span>
                <span className="text-slate-300 font-bold">{stats?.confirmed_mishandling ?? 0}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Doorstep handover photos provide undeniable proof that security seals were unbroken upon customer receipt.
            </p>
          </div>

          <div className="md:col-span-2 glass-panel p-6 rounded-2xl border border-white/10 bg-[#0c1222]/80 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Transit Allegations Requiring Statement</h3>
              <button 
                onClick={() => setActiveSubTab('disputes')}
                className="text-xs text-amber-400 font-mono hover:underline"
              >
                View Transit Disputes →
              </button>
            </div>

            <div className="space-y-2.5">
              {stats?.transit_disputes?.slice(0, 3).map((d: any) => (
                <div key={d.id} className="p-3.5 rounded-xl bg-slate-900/70 border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-amber-400 text-xs">{d.investigation_code}</span>
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
                      className="text-amber-400 hover:text-amber-300 text-xs underline font-semibold"
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

      {/* SUB-TAB 2: ASSIGNED DELIVERIES */}
      {activeSubTab === 'deliveries' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#0c1222]/80 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Assigned Deliveries & Doorstep Handover Proof
              </h2>
              <p className="text-xs text-slate-400">
                Capture photograph of package condition and unbroken seal upon doorstep delivery.
              </p>
            </div>
            <span className="text-xs font-mono text-amber-400">{stats?.recent_deliveries?.length ?? 0} deliveries</span>
          </div>

          <div className="space-y-3">
            {stats?.recent_deliveries?.map((ord: any) => (
              <div 
                key={ord.id}
                className="p-4 rounded-xl bg-slate-900/70 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-amber-400 text-xs">{ord.order_number}</span>
                    <span className="text-xs text-slate-400 font-mono">• {new Date(ord.order_date).toLocaleDateString()}</span>
                  </div>
                  <div className="text-xs font-bold text-white">
                    {ord.items.map((i: any) => `${i.quantity}x ${i.item}`).join(', ')}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {ord.has_handover_photo ? (
                    <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>HANDOVER PROOF RECORDED</span>
                    </div>
                  ) : (
                    <div>
                      {uploadingOrder === ord.order_number ? (
                        <div className="flex items-center space-x-2">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => setHandoverFile(e.target.files ? e.target.files[0] : null)}
                            className="text-xs text-slate-400 file:py-1 file:px-2 file:rounded file:bg-slate-800 file:text-amber-400 file:border-0"
                          />
                          <button
                            onClick={() => handleUploadHandover(ord.order_number)}
                            disabled={!handoverFile}
                            className="py-1 px-3 bg-amber-400 text-black text-xs font-bold rounded-lg hover:bg-amber-300 disabled:opacity-50"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setUploadingOrder(ord.order_number)}
                          className="py-1.5 px-3 rounded-lg text-xs font-bold bg-slate-800 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 flex items-center space-x-1"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Attach Doorstep Proof</span>
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

      {/* SUB-TAB 3: TRANSIT DISPUTES DESK */}
      {activeSubTab === 'disputes' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#0c1222]/80 space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">Transit Dispute Statements Desk</h2>
            <p className="text-xs text-slate-400">
              Submit courier transit explanations regarding packaging seal condition or liquid spillage allegations.
            </p>
          </div>

          <div className="space-y-4">
            {stats?.transit_disputes?.map((inv: any) => (
              <div key={inv.id} className="p-5 rounded-xl bg-slate-900/80 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-amber-400 text-xs">{inv.investigation_code}</span>
                    <span className="text-xs text-white font-medium">{inv.complaint_category}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                    Risk Score: {inv.risk_score}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/70 border border-white/5 text-xs text-slate-300">
                  <span className="text-[10px] text-slate-500 font-mono uppercase block mb-0.5">Transit Allegation:</span>
                  <p className="italic">"{inv.original_query}"</p>
                </div>

                {inv.has_statement ? (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300">
                    <span className="text-[10px] font-bold uppercase font-mono block mb-0.5">Courier Statement on Record:</span>
                    <p>{inv.courier_statement}</p>
                  </div>
                ) : (
                  <div>
                    {statementInvId === inv.id ? (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          value={statementText}
                          onChange={(e) => setStatementText(e.target.value)}
                          placeholder="Enter courier statement e.g. 'Order was kept upright in insulated thermal box; green security tape was intact and inspected at customer doorstep'..."
                          className="w-full px-3 py-2 bg-slate-950 border border-amber-500/40 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSubmitStatement(inv.id)}
                            disabled={submittingStmt || !statementText.trim()}
                            className="py-1.5 px-3 bg-amber-400 text-black text-xs font-bold rounded-lg hover:bg-amber-300 disabled:opacity-50"
                          >
                            {submittingStmt ? 'Recording...' : 'Record Courier Statement'}
                          </button>
                          <button
                            onClick={() => { setStatementInvId(null); setStatementText(''); }}
                            className="py-1.5 px-3 bg-slate-800 text-slate-400 text-xs rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setStatementInvId(inv.id); setStatementText(''); }}
                        className="py-1 px-3 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/25"
                      >
                        + Submit Courier Statement
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
