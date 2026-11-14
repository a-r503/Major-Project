import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, Eye, Download, Printer, CheckCircle2, 
  AlertTriangle, Clock, Layers, Crosshair, ArrowRight, Save
} from 'lucide-react';
import { api } from '../../api/client';
import { Investigation, User } from '../../types';

interface InvestigationDetailModalProps {
  investigation: Investigation | null;
  onClose: () => void;
  onUpdated: (updated: Investigation) => void;
  currentUser: User | null;
}

export const InvestigationDetailModal: React.FC<InvestigationDetailModalProps> = ({
  investigation,
  onClose,
  onUpdated,
  currentUser
}) => {
  const [detail, setDetail] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [verdict, setVerdict] = useState<string>('Verified Issue');
  const [responsibleParty, setResponsibleParty] = useState<string>('Restaurant');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [savingVerdict, setSavingVerdict] = useState<boolean>(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (investigation) {
      setLoading(true);
      api.investigations.get(investigation.id)
        .then(res => {
          setDetail(res);
          setVerdict(res.final_verdict || 'Verified Issue');
          setResponsibleParty(res.responsible_party || 'Undetermined');
          setResolutionNotes(res.resolution_notes || '');
        })
        .catch(err => console.error('Failed to load detail:', err))
        .finally(() => setLoading(false));
    }
  }, [investigation]);

  if (!investigation) return null;

  const handleSaveVerdict = async () => {
    if (!detail) return;
    setSavingVerdict(true);
    try {
      const updated = await api.investigations.updateVerdict(detail.id, {
        final_verdict: verdict,
        responsible_party: responsibleParty,
        status: 'resolved',
        resolution_notes: resolutionNotes
      });
      setDetail(updated);
      onUpdated(updated);
      setFeedbackSuccess(true);
      setTimeout(() => setFeedbackSuccess(false), 3000);
    } catch (err: any) {
      alert(`Failed to update verdict: ${err.message}`);
    } finally {
      setSavingVerdict(false);
    }
  };

  const handleDownloadJSON = () => {
    if (!detail) return;
    const blob = new Blob([JSON.stringify(detail, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FOODGUARD_DOSSIER_${detail.investigation_code}.json`;
    a.click();
  };

  const prediction = detail?.predictions && detail.predictions.length > 0 ? detail.predictions[0] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl glass-panel rounded-2xl border border-white/10 bg-[#090d18] shadow-2xl my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-slate-900/80 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white font-mono tracking-wide">
                  {detail?.investigation_code || investigation.investigation_code}
                </h2>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  (detail?.final_verdict || investigation.final_verdict) === 'Verified Issue'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : (detail?.final_verdict || investigation.final_verdict) === 'Confirmed Fraud'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {detail?.final_verdict || investigation.final_verdict}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Order Reference: <span className="text-cyan-300 font-semibold">{detail?.order?.order_number || 'ORD-REF'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadJSON}
              title="Download JSON Dossier"
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.print()}
              title="Print Investigation Report"
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-rose-500/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Dispute Context Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-500">Complaint Category</span>
              <p className="text-xs font-bold text-white">{detail?.complaint_category}</p>
              <span className="text-[11px] text-cyan-400 font-mono block">Model: {detail?.selected_model.split(':')[0]}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-500">Complainant / Order ID</span>
              <p className="text-xs font-bold text-white">{detail?.customer?.full_name || 'Customer'}</p>
              <span className="text-[11px] text-slate-400 font-mono block">{detail?.customer?.email}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-500">Evidence Risk Score</span>
              <div className="flex items-center space-x-2">
                <span className={`text-xl font-black font-mono ${
                  (detail?.risk_score || 0) > 60 ? 'text-rose-400' : 'text-cyan-400'
                }`}>
                  {detail?.risk_score} / 100
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Priority: {detail?.risk_assessment?.priority_level || 'Medium'}
                </span>
              </div>
            </div>
          </div>

          {/* Original Statement */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10">
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
              Complainant Statement:
            </span>
            <p className="text-xs sm:text-sm text-slate-200 italic">
              "{detail?.original_query}"
            </p>
            {detail?.target_ingredient && (
              <div className="mt-2 text-[11px] font-mono text-cyan-400">
                Extracted Target Ingredient: <strong>{detail.target_ingredient}</strong>
              </div>
            )}
          </div>

          {/* Computer Vision Evidence & Visual Overlays */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Computer Vision Evidence Analysis</span>
            </h3>

            {prediction?.annotated_image_path ? (
              <div className="rounded-xl overflow-hidden border border-white/15 bg-black/60 relative group p-2">
                <img 
                  src={prediction.annotated_image_path} 
                  alt="Forensic Evidence" 
                  className="w-full max-h-96 object-contain rounded-lg mx-auto"
                />
                <div className="p-3 bg-slate-900/80 rounded-lg mt-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-400">Classes Detected:</span>
                    <span className="text-cyan-300 font-bold">
                      {prediction.detected_classes.length > 0 ? prediction.detected_classes.join(', ') : 'None'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-slate-400">
                    <span>Confidence: <strong className="text-emerald-400">{Math.round(prediction.confidence * 100)}%</strong></span>
                    <span>Latency: <strong className="text-white">{prediction.execution_time_ms} ms</strong></span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 font-mono text-xs rounded-xl bg-slate-900/40 border border-white/5">
                No visual evidence required or available for this non-visual complaint.
              </div>
            )}
          </div>

          {/* AI Explanation & Uncertainty Disclosures */}
          {detail?.report && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">AI Forensic Explanation</h3>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-2 text-xs">
                <p className="font-semibold text-white">{detail.report.summary_text}</p>
                <p className="text-slate-300 leading-relaxed">{detail.report.ai_explanation}</p>
                {detail.report.uncertainty_notes && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px]">
                    <strong>Uncertainty & Optical Caveats:</strong> {detail.report.uncertainty_notes}
                  </div>
                )}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Action Recommended:</span>
                  <span className="text-cyan-300 font-bold">{detail.report.recommended_action}</span>
                </div>
              </div>
            </div>
          )}

          {/* Risk Factors Breakdown */}
          {detail?.risk_assessment && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Decision Engine Mathematical Breakdown</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                  <span className="text-[10px] text-slate-500 block">Model Confidence</span>
                  <span className="text-cyan-400 font-bold">{Math.round(detail.risk_assessment.model_confidence_factor * 100)}%</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                  <span className="text-[10px] text-slate-500 block">Evidence Discrepancy</span>
                  <span className="text-white font-bold">{detail.risk_assessment.evidence_discrepancy_factor}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                  <span className="text-[10px] text-slate-500 block">Customer Dispute Hist</span>
                  <span className="text-amber-400 font-bold">+{detail.risk_assessment.customer_history_factor}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                  <span className="text-[10px] text-slate-500 block">Restaurant Audit Hist</span>
                  <span className="text-emerald-400 font-bold">+{detail.risk_assessment.restaurant_history_factor}</span>
                </div>
              </div>
            </div>
          )}

          {/* Admin Adjudication Toolbar */}
          <div className="p-5 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Dispute Adjudication & Human Review</span>
              </h3>
              {feedbackSuccess && (
                <span className="text-xs text-emerald-400 font-mono flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verdict Recorded!</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Final Verdict</label>
                <select
                  value={verdict}
                  onChange={(e) => setVerdict(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="Verified Issue">Verified Issue (Claim Upheld)</option>
                  <option value="Confirmed Fraud">Confirmed Fraud (False Claim)</option>
                  <option value="Requires Manual Investigation">Requires Manual Investigation</option>
                  <option value="No Issue Detected">No Issue Detected</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Responsible Party</label>
                <select
                  value={responsibleParty}
                  onChange={(e) => setResponsibleParty(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="Customer">Customer</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Delivery Partner">Delivery Partner (Courier)</option>
                  <option value="Multiple Parties">Multiple Parties</option>
                  <option value="Undetermined">Undetermined</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Adjudication Notes</label>
              <input
                type="text"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Enter review notes e.g. Customer issued full refund; kitchen alerted on recipe compliance..."
                className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveVerdict}
                disabled={savingVerdict}
                className="py-2 px-5 rounded-xl text-xs font-bold bg-cyan-400 text-black hover:bg-cyan-300 transition-all flex items-center space-x-2"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingVerdict ? 'Saving Verdict...' : 'Commit Adjudication Verdict'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
