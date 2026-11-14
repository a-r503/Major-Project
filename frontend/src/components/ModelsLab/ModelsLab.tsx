import React, { useState, useEffect } from 'react';
import { 
  Cpu, Upload, CheckCircle2, Download, AlertTriangle, 
  Layers, Crosshair, Droplets, ShieldAlert, FileCode2, Database
} from 'lucide-react';
import { api } from '../../api/client';
import { ModelStatusCard } from '../../types';

export const ModelsLab: React.FC = () => {
  const [models, setModels] = useState<ModelStatusCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Custom weights upload
  const [selectedModelId, setSelectedModelId] = useState<string>('model_1');
  const [weightsFile, setWeightsFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // Retraining feedback review
  const [splitFilter, setSplitFilter] = useState<string>('train');
  const [exportData, setExportData] = useState<any>(null);
  const [exporting, setExporting] = useState<boolean>(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await api.models.getStatus();
      setModels(data);
    } catch (err) {
      console.error('Failed to fetch models status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleUploadWeights = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weightsFile) return;

    setUploading(true);
    setUploadMessage(null);
    try {
      const res = await api.models.uploadWeights(selectedModelId, weightsFile);
      setUploadMessage(`Success: ${res.message} (${res.file_size_mb} MB)`);
      setWeightsFile(null);
      fetchStatus();
    } catch (err: any) {
      setUploadMessage(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleExportRetrainingData = async () => {
    setExporting(true);
    try {
      const res = await api.feedback.exportDataset(splitFilter);
      setExportData(res);

      // Trigger file download
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FOODGUARD_RETRAINING_CORPUS_${splitFilter.toUpperCase()}_v2.4.json`;
      a.click();
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#0a0f1d]/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Cpu className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-black text-white tracking-wide">COMPUTER VISION MODELS & RETRAINING LAB</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time inference telemetry, weights ingestion pipeline, and human-verified training dataset curation
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            4 / 4 Engines Operational
          </span>
        </div>
      </div>

      {/* 4 Models Detailed Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {models.map((m) => (
          <div
            key={m.id}
            className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#0c1222]/90 space-y-4 hover:border-cyan-500/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 uppercase font-bold">
                {m.id.replace('_', ' ').toUpperCase()}
              </span>
              <span className="flex items-center space-x-1.5 text-xs font-mono text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>{m.status === 'custom_loaded' ? 'CUSTOM WEIGHTS LOADED' : 'INFERENCE ENGINE ACTIVE'}</span>
              </span>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">{m.name}</h2>
              <span className="text-xs text-slate-400 font-mono block mt-0.5">{m.type} • {m.version}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Weights Target:</span>
                <span className="text-cyan-300 truncate max-w-[220px]">{m.weights_path.split('\\').slice(-1)[0]}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Inference Latency:</span>
                <span className="text-white font-bold">{m.latency_ms} ms</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Benchmark Metric:</span>
                <span className="text-emerald-400 font-bold">{m.accuracy_metric}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                Supported Class Labels ({m.classes_count}):
              </span>
              <div className="flex flex-wrap gap-1">
                {m.classes_sample.map((cls) => (
                  <span
                    key={cls}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/5"
                  >
                    {cls}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two Control Sections: Weights Ingestion & Dataset Retraining Export */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Custom Weights Upload Form */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#0c1222]/80 space-y-4">
          <div className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Dynamic Model Weights Ingestion</h3>
          </div>
          <p className="text-xs text-slate-400">
            Upload custom pre-trained PyTorch / Ultralytics <code className="text-cyan-400">.pt</code> weights to dynamically update the active model.
          </p>

          <form onSubmit={handleUploadWeights} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Model</label>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
              >
                <option value="model_1">Model 1: food_ingredient_yolo.pt (Food Item & Ingredient YOLO)</option>
                <option value="model_2">Model 2: package_tamper.pt (Package Tampering Verifier)</option>
                <option value="model_3">Model 3: spillage_yolo.pt (Food Spillage & Leakage YOLO)</option>
                <option value="model_4">Model 4: foreign_object_yolo.pt (Foreign Object Detection)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Select .pt Weights File</label>
              <input
                type="file"
                accept=".pt,.pth,.bin,.onnx"
                onChange={(e) => setWeightsFile(e.target.files ? e.target.files[0] : null)}
                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20"
              />
            </div>

            {uploadMessage && (
              <div className="p-3 rounded-xl bg-slate-900 border border-white/10 text-xs text-cyan-300 font-mono">
                {uploadMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !weightsFile}
              className="py-2.5 px-5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:opacity-95 shadow-neon-cyan flex items-center space-x-2 transition-all disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'Deploying Weights...' : 'Deploy Model Weights'}</span>
            </button>
          </form>
        </div>

        {/* Retraining Dataset Feedback & Export */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#0c1222]/80 space-y-4">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-violet-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Curated Retraining Corpus Pipeline</h3>
          </div>
          <p className="text-xs text-slate-400">
            Export human-reviewed dispute evidence and verified annotation labels for future fine-tuning. Only includes samples marked as <code className="text-violet-400">suitable_for_training</code>.
          </p>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Dataset Partition</label>
              <select
                value={splitFilter}
                onChange={(e) => setSplitFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
              >
                <option value="train">Training Split (train)</option>
                <option value="val">Validation Split (val)</option>
                <option value="test">Test Split (test)</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 text-xs text-slate-400 space-y-1 font-mono">
              <div>Corpus Standard: <strong className="text-slate-200">YOLOv8 & COCO Annotation Schema</strong></div>
              <div>Security Isolation: <strong className="text-emerald-400">Unverified uploads strictly quarantined</strong></div>
            </div>

            <button
              onClick={handleExportRetrainingData}
              disabled={exporting}
              className="py-2.5 px-5 rounded-xl font-bold text-xs bg-gradient-to-r from-violet-500 to-indigo-600 text-white hover:opacity-95 shadow-neon-violet flex items-center space-x-2 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{exporting ? 'Generating Corpus...' : 'Export Curated Dataset JSON'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
