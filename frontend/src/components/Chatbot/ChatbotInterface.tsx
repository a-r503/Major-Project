import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Send, Upload, Sparkles, AlertCircle, CheckCircle2, 
  HelpCircle, RefreshCw, Eye, ArrowRight, ShieldAlert, 
  FileText, Download, ChevronRight, Layers, Camera, Crosshair, Zap,
  Copy, Check, RotateCcw, Image as ImageIcon, X, Maximize2
} from 'lucide-react';
import { api } from '../../api/client';
import { Investigation, Order, User } from '../../types';
import { AIOrb } from './AIOrb';
import { CircularRiskGauge } from './CircularRiskGauge';
import { SuggestedPrompts, PromptScenario } from './SuggestedPrompts';

interface ChatbotInterfaceProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onViewInvestigation: (inv: Investigation) => void;
  initialOrderNumber?: string;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  stages?: { stage: number; label: string; done: boolean }[];
  investigationReport?: Investigation;
  isUnsupported?: boolean;
}

export const ChatbotInterface: React.FC<ChatbotInterfaceProps> = ({
  currentUser,
  onOpenAuth,
  onViewInvestigation,
  initialOrderNumber
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: "Greetings. I am FoodGuard AI, your autonomous forensic dispute resolution investigator.\n\nI ingest food delivery dispute claims and execute 4 specialized computer vision neural engines:\n• **Model 1**: Food Ingredient YOLO (missing toppings, paneer, toppings)\n• **Model 2**: Package Integrity & Tamper Verifier (ORB homography + SSIM seal inspection)\n• **Model 3**: Spillage & Leakage YOLO (ruptured lids & transit bag pooling)\n• **Model 4**: Foreign Object YOLO (hair strands, plastic shards, contaminants)\n\nSelect a forensic preset below or describe your issue with photo evidence.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [category, setCategory] = useState<string>('Missing Food Item / Ingredient');
  const [orderNumber, setOrderNumber] = useState<string>(initialOrderNumber || 'ORD-8942-X');
  const [complaintText, setComplaintText] = useState<string>('I ordered a Paneer Pizza, but there is no paneer on it.');
  const [targetIngredient, setTargetIngredient] = useState<string>('paneer');
  
  useEffect(() => {
    if (initialOrderNumber) {
      setOrderNumber(initialOrderNumber);
    }
  }, [initialOrderNumber]);
  
  // Images
  const [file1, setFile1] = useState<File | null>(null);
  const [file1Preview, setFile1Preview] = useState<string | null>('/static/uploads/sample_pizza_nopaneer.jpg');
  const [file2, setFile2] = useState<File | null>(null);
  const [file2Preview, setFile2Preview] = useState<string | null>(null);

  // Scoped orders
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);

  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStage, analyzing]);

  // Load user's scoped orders on mount
  useEffect(() => {
    setOrdersLoading(true);
    api.orders.list()
      .then(orders => {
        setUserOrders(orders);
        if (orders.length > 0 && !orderNumber) {
          setOrderNumber(orders[0].order_number);
        }
      })
      .catch(err => console.log('Could not prefetch orders:', err))
      .finally(() => setOrdersLoading(false));
  }, [currentUser]);

  // Predefined Complaint Categories
  const categories = [
    { id: 'Missing Food Item / Ingredient', label: 'Missing Ingredient / Item', icon: Crosshair, model: 'Model 1: Food YOLO' },
    { id: 'Package Tampering / Condition Change', label: 'Package Tampering / Seal Cut', icon: Layers, model: 'Model 2: Package Verifier' },
    { id: 'Food Spillage / Leakage', label: 'Food Spillage / Container Leak', icon: AlertCircle, model: 'Model 3: Spillage YOLO' },
    { id: 'Foreign Object in Food', label: 'Foreign Object / Contaminant', icon: ShieldAlert, model: 'Model 4: Foreign Object' },
    { id: 'Other Order Issues', label: 'Other Issues (Taste / Delay)', icon: HelpCircle, model: 'Support Desk' },
  ];

  // Auto-extract target ingredient when user types in Missing Food category
  const handleComplaintChange = (text: string) => {
    setComplaintText(text);
    if (category === 'Missing Food Item / Ingredient') {
      const lower = text.toLowerCase();
      const known = ['paneer', 'cheese', 'onion', 'tomato', 'capsicum', 'mushroom', 'olive', 'pepperoni', 'chicken', 'patty', 'lettuce'];
      for (const k of known) {
        if (lower.includes(k)) {
          setTargetIngredient(k);
          break;
        }
      }
    }
  };

  // Switch category and pre-load realistic test evidence
  const handleSelectCategory = (catId: string) => {
    setCategory(catId);
    if (catId === 'Missing Food Item / Ingredient') {
      setOrderNumber('ORD-8942-X');
      setComplaintText('I ordered a Paneer Pizza, but there is no paneer on it.');
      setTargetIngredient('paneer');
      setFile1Preview('/static/uploads/sample_pizza_nopaneer.jpg');
      setFile1(null);
      setFile2Preview(null);
      setFile2(null);
    } else if (catId === 'Package Tampering / Condition Change') {
      setOrderNumber('ORD-8942-X');
      setComplaintText('The package security seal was broken and cut when delivered by the courier.');
      setTargetIngredient('');
      setFile1Preview('/static/uploads/sample_pkg_dispatch.jpg');
      setFile2Preview('/static/uploads/sample_pkg_tampered.jpg');
      setFile1(null);
      setFile2(null);
    } else if (catId === 'Food Spillage / Leakage') {
      setOrderNumber('ORD-7721-B');
      setComplaintText('The curry container ruptured in the thermal transit bag and spilled liquid everywhere.');
      setTargetIngredient('');
      setFile1Preview('/static/uploads/sample_spill.jpg');
      setFile1(null);
      setFile2Preview(null);
      setFile2(null);
    } else if (catId === 'Foreign Object in Food') {
      setOrderNumber('ORD-4419-C');
      setComplaintText('There was an unwanted foreign hair strand inside the food dish.');
      setTargetIngredient('hair');
      setFile1Preview('/static/uploads/sample_foreign_hair.jpg');
      setFile1(null);
      setFile2Preview(null);
      setFile2(null);
    } else {
      setOrderNumber('ORD-1082-S');
      setComplaintText('The food was cold and took over 50 minutes to arrive.');
      setTargetIngredient('');
      setFile1Preview(null);
      setFile2Preview(null);
      setFile1(null);
      setFile2(null);
    }
  };

  const handleSelectScenario = (scenario: PromptScenario, autoRun: boolean = false) => {
    setCategory(scenario.category);
    setOrderNumber(scenario.orderNumber);
    setComplaintText(scenario.complaintText);
    setTargetIngredient(scenario.targetIngredient);
    setFile1Preview(scenario.evidence1Path);
    setFile1(null);
    if (scenario.evidence2Path) {
      setFile2Preview(scenario.evidence2Path);
      setFile2(null);
    } else {
      setFile2Preview(null);
      setFile2(null);
    }

    if (autoRun) {
      setTimeout(() => {
        executeInvestigation(
          scenario.category,
          scenario.orderNumber,
          scenario.complaintText,
          scenario.targetIngredient,
          scenario.evidence1Path,
          scenario.evidence2Path
        );
      }, 100);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isSecond: boolean = false) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      if (isSecond) {
        setFile2(file);
        setFile2Preview(previewUrl);
      } else {
        setFile1(file);
        setFile1Preview(previewUrl);
      }
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const executeInvestigation = async (
    runCategory = category,
    runOrder = orderNumber,
    runText = complaintText,
    runTarget = targetIngredient,
    runFile1Preview = file1Preview,
    runFile2Preview = file2Preview
  ) => {
    if (!runText.trim()) return;

    // Check if unsupported non-visual complaint
    if (runCategory === 'Other Order Issues') {
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: `[${runOrder}] ${runText}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `Claim Evaluation for Order #${runOrder}:\n\nYour reported issue regarding non-visual factors ("${runText}") cannot be independently verified by our 4 computer vision models (Food Ingredient YOLO, Package Tamper Verifier, Spillage Detection, Foreign Contaminants). Our models exclusively evaluate photographic evidence.\n\nYour ticket has been transferred directly to our Human Customer Support desk for manual adjudication without automated penalties.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isUnsupported: true
      };

      setMessages(prev => [...prev, userMsg, aiMsg]);
      return;
    }

    setAnalyzing(true);
    setCurrentStage(1);

    // Add user message to conversation
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: `[${runOrder} • ${runCategory}]\n${runText}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      // Stage progression animation
      setTimeout(() => setCurrentStage(2), 600);
      setTimeout(() => setCurrentStage(3), 1200);
      setTimeout(() => setCurrentStage(4), 1800);
      setTimeout(() => setCurrentStage(5), 2400);

      // Build FormData
      const formData = new FormData();
      formData.append('order_number', runOrder);
      formData.append('complaint_category', runCategory);
      formData.append('complaint_description', runText);
      if (runTarget) formData.append('target_ingredient', runTarget);

      // File 1
      if (file1) {
        formData.append('evidence_image_1', file1);
      } else if (runFile1Preview) {
        const resp1 = await fetch(runFile1Preview);
        const blob1 = await resp1.blob();
        formData.append('evidence_image_1', blob1, 'evidence_1.jpg');
      }

      // File 2 (for package tamper verification)
      if (runCategory === 'Package Tampering / Condition Change') {
        if (file2) {
          formData.append('evidence_image_2', file2);
        } else if (runFile2Preview) {
          const resp2 = await fetch(runFile2Preview);
          const blob2 = await resp2.blob();
          formData.append('evidence_image_2', blob2, 'evidence_2.jpg');
        }
      }

      const investigation = await api.investigations.submit(formData);
      setCurrentStage(6);

      setTimeout(() => {
        setAnalyzing(false);
        const aiResponse: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `### Forensic Investigation Dossier ${investigation.investigation_code}\n\n**Selected Vision Engine**: \`${investigation.selected_model}\`\n**Adjudication Verdict**: **${investigation.final_verdict}**\n**Attributed Responsibility**: **${investigation.responsible_party}**\n**Calculated Fraud Risk**: **${investigation.risk_score} / 100**\n\n${investigation.report?.summary_text || ''}\n\n${investigation.report?.ai_explanation || ''}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          investigationReport: investigation
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 700);

    } catch (err: any) {
      setAnalyzing(false);
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: `Dispute investigation error: ${err.message || 'Verification pipeline encountered an issue'}. Please verify order number and evidence photograph.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const stagesList = [
    { stage: 1, label: 'Parsing natural-language dispute claim & entity extraction...' },
    { stage: 2, label: 'Validating order # in authenticated ledger...' },
    { stage: 3, label: 'Standardizing visual evidence & normalizing color channels...' },
    { stage: 4, label: 'Executing computer vision neural network...' },
    { stage: 5, label: 'Evaluating multi-factor risk score & liability matrix...' },
    { stage: 6, label: 'Synthesizing verified AI explanation dossier...' }
  ];

  // Helper to render basic markdown formatting cleanly
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-sm font-bold text-cyan-300 font-mono mt-2 mb-1">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('• ')) {
            return (
              <div key={idx} className="flex items-start space-x-2 text-xs text-slate-300 ml-1">
                <span className="text-cyan-400 font-bold">•</span>
                <span>{renderInlineMarkdown(line.substring(2))}</span>
              </div>
            );
          }
          if (line.trim() === '') {
            return <div key={idx} className="h-1" />;
          }
          return (
            <p key={idx} className="text-xs sm:text-sm leading-relaxed">
              {renderInlineMarkdown(line)}
            </p>
          );
        })}
      </div>
    );
  };

  const renderInlineMarkdown = (content: string) => {
    // Basic bold and code span replacements
    const parts = content.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-black/50 text-cyan-300 font-mono text-[11px] border border-cyan-500/30">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-[calc(100vh-5rem)]">
      
      {/* LEFT: Autonomous AI Investigation Terminal & Chat Stream */}
      <div className="flex-1 flex flex-col glass-panel rounded-2xl border border-white/10 bg-[#0a0f1d]/85 overflow-hidden shadow-2xl relative">
        
        {/* Subtle Ambient Glows inside Chat Canvas */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-10 w-80 h-80 bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Animated AI Identity Hero (Orb & Status) */}
        <div className="border-b border-white/10 bg-slate-950/60 relative">
          <AIOrb status={analyzing ? 'analyzing' : currentStage === 6 ? 'responding' : 'idle'} />
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5 max-h-[520px] relative z-10">
          
          {/* Interactive Suggestion Cards (Shown when chat has only greeting) */}
          {messages.length === 1 && (
            <div className="mb-4">
              <SuggestedPrompts onSelectScenario={handleSelectScenario} />
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div className={`max-w-2xl rounded-2xl p-4 sm:p-5 relative group ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-cyan-600/25 via-blue-600/25 to-cyan-500/20 border border-cyan-500/40 text-slate-100 rounded-tr-none shadow-glass'
                  : 'bg-slate-900/90 border border-white/10 text-slate-200 rounded-tl-none shadow-glass backdrop-blur-md'
              }`}>
                
                {/* Sender badge & Actions */}
                <div className="flex items-center justify-between mb-2 text-[10px] font-mono text-slate-400">
                  <div className="flex items-center space-x-2">
                    <span className={msg.sender === 'user' ? 'text-cyan-400 font-bold' : 'text-violet-400 font-bold'}>
                      {msg.sender === 'user' ? 'DISPUTE CLAIM' : 'FOODGUARD FORENSIC AI'}
                    </span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Copy button for AI responses */}
                  {msg.sender === 'ai' && (
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleCopyText(msg.id, msg.text)}
                        title="Copy to clipboard"
                        className="p-1 text-slate-400 hover:text-cyan-300 rounded hover:bg-white/5 transition-colors flex items-center space-x-1"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-[9px] text-emerald-400 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span className="text-[9px]">Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Message Body with Clean Formatting */}
                <div className="text-slate-200">
                  {renderFormattedText(msg.text)}
                </div>

                {/* Unsupported Non-visual Claim Notice */}
                {msg.isUnsupported && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Computer Vision Non-Applicable:</span>
                      Taste, temperature, and courier punctuality cannot be independently verified via computer vision.
                      Ticket logged to customer support queue without automated penalty.
                    </div>
                  </div>
                )}

                {/* High-Tech Investigation Dossier Card */}
                {msg.investigationReport && (
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                    
                    {/* Header: Dossier code, Verdict badge, and Circular Risk Gauge */}
                    <div className="p-4 rounded-xl bg-slate-950/70 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-1.5 text-center sm:text-left">
                        <div className="flex items-center space-x-2 justify-center sm:justify-start">
                          <span className="font-mono text-xs font-bold text-cyan-400">
                            {msg.investigationReport.investigation_code}
                          </span>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            msg.investigationReport.final_verdict === 'Verified Issue'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : msg.investigationReport.final_verdict === 'Confirmed Fraud'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {msg.investigationReport.final_verdict}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Liability: <strong className="text-white">{msg.investigationReport.responsible_party}</strong>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Engine: {msg.investigationReport.selected_model}
                        </div>
                      </div>

                      {/* Visual Circular Risk Progress Gauge */}
                      <CircularRiskGauge score={msg.investigationReport.risk_score} size={100} />
                    </div>

                    {/* Annotated Computer Vision Result View */}
                    {msg.investigationReport.predictions && msg.investigationReport.predictions[0]?.annotated_image_path && (
                      <div className="rounded-xl overflow-hidden border border-white/10 bg-black/60 relative group">
                        <img 
                          src={msg.investigationReport.predictions[0].annotated_image_path} 
                          alt="Annotated Evidence" 
                          className="w-full max-h-64 object-contain mx-auto cursor-pointer"
                          onClick={() => setPreviewModalImg(msg.investigationReport?.predictions?.[0]?.annotated_image_path || null)}
                        />
                        <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 flex items-center space-x-1.5 shadow-md">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Computer Vision Bounding Box Overlay</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewModalImg(msg.investigationReport?.predictions?.[0]?.annotated_image_path || null)}
                          className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/80 border border-white/20 text-slate-300 hover:text-white hover:border-cyan-400 text-xs font-mono flex items-center space-x-1"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Expand</span>
                        </button>
                      </div>
                    )}

                    {/* Detections List Chips */}
                    {msg.investigationReport.predictions && msg.investigationReport.predictions[0]?.bounding_boxes && msg.investigationReport.predictions[0].bounding_boxes.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                          Visual Detections ({msg.investigationReport.predictions[0].bounding_boxes.length} objects):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.investigationReport.predictions[0].bounding_boxes.map((det, dIdx) => (
                            <span 
                              key={dIdx} 
                              className="px-2 py-0.5 rounded-lg bg-slate-900 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] flex items-center space-x-1"
                            >
                              <span className="font-bold">{det.label}</span>
                              <span className="text-slate-500">{(det.confidence * 100).toFixed(0)}%</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dynamic Target Ingredient Verification HUD (Model 1) */}
                    {msg.investigationReport.target_ingredient && (
                      <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono ${
                        msg.investigationReport.predictions?.[0]?.target_verified
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <Crosshair className="w-4 h-4" />
                          <span>TARGET TOPPING: <strong>{msg.investigationReport.target_ingredient.toUpperCase()}</strong></span>
                        </div>
                        <span className="font-bold">
                          {msg.investigationReport.predictions?.[0]?.target_verified
                            ? 'DETECTED IN PHOTO (Claim Unverified)'
                            : 'NOT DETECTED (Missing Claim Supported)'}
                        </span>
                      </div>
                    )}

                    {/* Detailed AI Explanation Text */}
                    {msg.investigationReport.report && (
                      <div className="bg-slate-950/70 p-3.5 rounded-xl border border-white/5 text-xs text-slate-300 space-y-2">
                        <p className="font-semibold text-white">{msg.investigationReport.report.summary_text}</p>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          {msg.investigationReport.report.ai_explanation}
                        </p>
                        {msg.investigationReport.report.uncertainty_notes && (
                          <p className="text-amber-400/80 text-[10px] italic border-t border-white/5 pt-1.5 flex items-start space-x-1">
                            <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                            <span>Caveat: {msg.investigationReport.report.uncertainty_notes}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => executeInvestigation()}
                        disabled={analyzing}
                        className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Re-test Complaint</span>
                      </button>
                      <button
                        onClick={() => onViewInvestigation(msg.investigationReport!)}
                        className="flex items-center space-x-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <span>Inspect Full Dossier</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Live Investigation Analysis Progression HUD */}
          {analyzing && (
            <div className="bg-slate-900/95 border border-cyan-500/40 rounded-2xl p-5 shadow-neon-cyan animate-pulse">
              <div className="flex items-center space-x-2.5 mb-3.5">
                <Zap className="w-4 h-4 text-cyan-400 animate-bounce" />
                <span className="text-xs font-bold font-mono text-cyan-300 uppercase tracking-wider">
                  Autonomous Multi-Model Vision Pipeline Active...
                </span>
              </div>
              <div className="space-y-2">
                {stagesList.map((s) => {
                  const isCurrent = s.stage === currentStage;
                  const isDone = s.stage < currentStage;
                  return (
                    <div key={s.stage} className="flex items-center space-x-2.5 text-xs font-mono">
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : isCurrent ? (
                        <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
                      )}
                      <span className={isCurrent ? 'text-cyan-300 font-bold' : (isDone ? 'text-slate-400 line-through' : 'text-slate-600')}>
                        Stage {s.stage}: {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Futuristic Message Composer at Bottom */}
        <div className="p-4 border-t border-white/10 bg-slate-950/80 backdrop-blur-md">
          {/* Active Evidence Preview Pill */}
          {file1Preview && (
            <div className="mb-2 flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs w-fit">
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-300 font-mono text-[11px] truncate max-w-xs">
                Photo Attached ({category.includes('Tampering') ? 'Dual Ingestion' : '1 Evidence File'})
              </span>
              <button
                type="button"
                onClick={() => { setFile1(null); setFile1Preview(null); }}
                className="p-0.5 hover:text-rose-400 text-slate-500"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="relative flex items-center space-x-2 bg-slate-900/90 border border-white/10 rounded-2xl p-1.5 transition-all focus-within:border-cyan-400 focus-within:shadow-neon-cyan">
            {/* Quick Camera File Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef1.current?.click()}
              title="Attach Evidence Photograph"
              className="p-2 text-slate-400 hover:text-cyan-300 rounded-xl hover:bg-white/5 transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef1}
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, false)}
            />

            {/* Complaint Text Input */}
            <input
              type="text"
              value={complaintText}
              onChange={(e) => handleComplaintChange(e.target.value)}
              placeholder="Ask the AI investigation assistant or describe food dispute..."
              disabled={analyzing}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !analyzing) {
                  e.preventDefault();
                  executeInvestigation();
                }
              }}
              className="flex-1 bg-transparent px-2 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
            />

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => executeInvestigation()}
              disabled={analyzing || !complaintText.trim()}
              className="py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 text-black hover:opacity-95 shadow-neon-cyan flex items-center space-x-1.5 transition-all disabled:opacity-50 shrink-0"
            >
              <span>{analyzing ? 'Analyzing...' : 'Investigate'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-1.5 px-1">
            <span>Press Enter to run • Shift+Enter for newline</span>
            <span>FoodGuard Neural Core v2.4</span>
          </div>
        </div>
      </div>

      {/* RIGHT: Dynamic Dispute Controls & Evidence Configuration Panel */}
      <div className="w-full lg:w-96 flex flex-col space-y-4">
        
        {/* Category Selector Card */}
        <div className="glass-panel rounded-2xl border border-white/10 p-5 bg-[#0a0f1d]/85 shadow-lg">
          <div className="flex items-center space-x-2 mb-3">
            <Crosshair className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Complaint Category</h4>
          </div>
          
          <div className="space-y-1.5">
            {categories.map((c) => {
              const Icon = c.icon;
              const isSelected = category === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectCategory(c.id)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-white/5 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span className="truncate">{c.label}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-slate-400 shrink-0 ml-1">
                    {c.model.split(':')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Order Details & Role-Scoped Order Selector */}
        <div className="glass-panel rounded-2xl border border-white/10 p-5 bg-[#0a0f1d]/85 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Order Reference</h4>
            {userOrders.length > 0 && (
              <span className="text-[10px] font-mono text-cyan-400">
                {userOrders.length} Linked Orders
              </span>
            )}
          </div>

          {/* Quick Select from User's Scoped Orders */}
          {userOrders.length > 0 ? (
            <div>
              <label className="block text-[11px] text-slate-400 mb-1 font-mono">
                Select from Your Orders
              </label>
              <select
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
              >
                {userOrders.map((ord) => (
                  <option key={ord.id} value={ord.order_number}>
                    {ord.order_number} - {ord.items_json?.[0]?.item || 'Food Order'} (${ord.total_amount})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] text-slate-400 mb-1 font-mono">
                Order Tracking ID
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="e.g. ORD-8942-X"
                className="w-full px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
              />
            </div>
          )}

          {category === 'Missing Food Item / Ingredient' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-slate-400 font-mono">Target Ingredient to Verify</label>
                <span className="text-[10px] font-mono text-cyan-400">NLP EXTRACTED</span>
              </div>
              <input
                type="text"
                value={targetIngredient}
                onChange={(e) => setTargetIngredient(e.target.value.toLowerCase())}
                placeholder="e.g. paneer, onion, cheese"
                className="w-full px-3 py-2 bg-slate-950/80 border border-cyan-500/30 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Model checks if this specific ingredient is detected in the image.
              </span>
            </div>
          )}
        </div>

        {/* Dynamic Image Upload Zone */}
        <div className="glass-panel rounded-2xl border border-white/10 p-5 bg-[#0a0f1d]/85 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              {category === 'Package Tampering / Condition Change' ? 'Dual Evidence Photographs' : 'Evidence Photograph'}
            </h4>
            <span className="text-[10px] font-mono text-slate-400">
              {category === 'Package Tampering / Condition Change' ? 'Dispatch + Handover' : '1 Photo Required'}
            </span>
          </div>

          {/* Primary Evidence Photo */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-mono">
              {category === 'Package Tampering / Condition Change' ? '1. Restaurant Dispatch Photo' : 'Customer Food / Package Photo'}
            </label>
            <div className="relative border-2 border-dashed border-white/15 hover:border-cyan-400/50 rounded-xl p-3 text-center transition-colors bg-slate-950/50">
              {file1Preview ? (
                <div className="relative group">
                  <img src={file1Preview} alt="Evidence 1" className="w-full h-28 object-contain rounded-lg mx-auto" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <span className="text-[11px] font-mono text-cyan-300">Click to Replace</span>
                  </div>
                </div>
              ) : (
                <div className="py-4">
                  <Camera className="w-6 h-6 text-slate-500 mx-auto mb-1" />
                  <span className="text-xs text-slate-400 block font-medium">Drag & drop or browse</span>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleFileChange(e, false)} 
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Secondary Photo (For Package Verification) */}
          {category === 'Package Tampering / Condition Change' && (
            <div>
              <label className="block text-[11px] text-slate-400 mb-1 font-mono">
                2. Courier Handover Photo (Analysis Target)
              </label>
              <div className="relative border-2 border-dashed border-white/15 hover:border-violet-400/50 rounded-xl p-3 text-center transition-colors bg-slate-950/50">
                {file2Preview ? (
                  <div className="relative group">
                    <img src={file2Preview} alt="Evidence 2" className="w-full h-28 object-contain rounded-lg mx-auto" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                      <span className="text-[11px] font-mono text-violet-300">Click to Replace</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-4">
                    <Camera className="w-6 h-6 text-slate-500 mx-auto mb-1" />
                    <span className="text-xs text-slate-400 block font-medium">Upload courier handover photo</span>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef2}
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, true)} 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Quick Scenario Buttons */}
          <div className="pt-2 border-t border-white/5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
              Quick Test Scenarios:
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => handleSelectCategory('Missing Food Item / Ingredient')}
                className="p-1.5 rounded-lg bg-slate-900 border border-white/10 hover:border-cyan-400 text-slate-300 text-left truncate transition-colors"
              >
                🍕 Missing Paneer
              </button>
              <button
                type="button"
                onClick={() => handleSelectCategory('Package Tampering / Condition Change')}
                className="p-1.5 rounded-lg bg-slate-900 border border-white/10 hover:border-violet-400 text-slate-300 text-left truncate transition-colors"
              >
                📦 Tampered Seal
              </button>
              <button
                type="button"
                onClick={() => handleSelectCategory('Food Spillage / Leakage')}
                className="p-1.5 rounded-lg bg-slate-900 border border-white/10 hover:border-amber-400 text-slate-300 text-left truncate transition-colors"
              >
                🍜 Spilled Curry
              </button>
              <button
                type="button"
                onClick={() => handleSelectCategory('Foreign Object in Food')}
                className="p-1.5 rounded-lg bg-slate-900 border border-white/10 hover:border-rose-400 text-slate-300 text-left truncate transition-colors"
              >
                ⚠️ Hair Contaminant
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* High-Resolution Fullscreen Image Preview Modal */}
      {previewModalImg && (
        <div 
          onClick={() => setPreviewModalImg(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fade-in cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[85vh] bg-[#0c1220] rounded-2xl border border-cyan-500/40 p-2 overflow-hidden shadow-2xl">
            <img 
              src={previewModalImg} 
              alt="High-Res Inspection" 
              className="max-h-[80vh] w-auto object-contain mx-auto rounded-xl"
            />
            <div className="absolute top-4 right-4 p-2 bg-black/80 rounded-xl text-slate-300 hover:text-white border border-white/10">
              <X className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};