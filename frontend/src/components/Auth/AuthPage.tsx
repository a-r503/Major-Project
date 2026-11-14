import React, { useState } from 'react';
import { 
  ShieldCheck, Mail, Lock, Eye, EyeOff, User as UserIcon, 
  Building2, Bike, KeyRound, ArrowRight, Sparkles, AlertCircle, 
  CheckCircle2, RefreshCw, Cpu, Layers
} from 'lucide-react';
import { api } from '../../api/client';
import { User, UserRole } from '../../types';

interface AuthPageProps {
  onSuccess: (user: User) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Forgot password modal state
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide both email address and password.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessNotice(null);

    try {
      const res = await api.auth.login(email.trim(), password);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required for identity registration.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    if (password.length < 6) {
      setError('Security policy requires at least 6 characters for passkey.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Role is automatically enforced to 'customer' by the backend for public signups
      const res = await api.auth.register(fullName.trim(), email.trim(), password, 'customer');
      setSuccessNotice('Account successfully created! Directing to Customer Portal...');
      setTimeout(() => {
        onSuccess(res.user);
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Registration failed. An account with this email may already exist.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string, demoPass: string, roleName: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    setError(null);
    setSuccessNotice(`Authenticating as verified ${roleName}...`);

    try {
      const res = await api.auth.login(demoEmail, demoPass);
      setTimeout(() => {
        onSuccess(res.user);
      }, 350);
    } catch (err: any) {
      setError(err.message || `Demo authentication failed for ${roleName}.`);
      setSuccessNotice(null);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    setForgotStatus(null);
    try {
      const res = await api.auth.forgotPassword(forgotEmail.trim());
      setForgotStatus(res.message || 'Password reset link sent to your registered email.');
    } catch (err: any) {
      setForgotStatus('Request dispatched. Please check your inbox if the account exists.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative selection:bg-cyan-400 selection:text-black overflow-x-hidden">
      {/* Background Cyber Grid Accent */}
      <div className="fixed inset-0 bg-grid-cyber pointer-events-none opacity-40 z-0" />

      {/* Ambient Cyber Lighting Spheres */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-violet-600/15 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[160px] pointer-events-none z-0" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-xl mx-auto space-y-6">
        
        {/* Top Brand Identity */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-violet-500/20 border border-cyan-500/40 shadow-neon-cyan relative group">
            <ShieldCheck className="w-9 h-9 text-cyan-400" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center justify-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-white">
                FOODGUARD <span className="text-cyan-400">AI</span>
              </h1>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                v2.4
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1 tracking-wide">
              Autonomous Food Delivery Fraud & Dispute Resolution Platform
            </p>
          </div>

          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/80 border border-white/10 text-[11px] font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>SYSTEM STATUS: 4 COMPUTER VISION MODELS ONLINE</span>
          </div>
        </div>

        {/* Evaluation / Quick Demo Role Selector */}
        <div className="glass-panel rounded-2xl border border-white/10 p-4 bg-[#0c1220]/80 shadow-glass">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] uppercase font-mono font-bold tracking-wider text-slate-400 flex items-center space-x-1.5">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span>Instant Evaluator Profiles (1-Click Authenticate):</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Role Verification</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Admin */}
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('admin@foodguard.ai', 'Admin@2026', 'Chief Investigator')}
              disabled={loading}
              className="group p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/30 hover:border-violet-400 hover:bg-violet-500/20 text-left transition-all duration-200 disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1">
                <ShieldCheck className="w-4 h-4 text-violet-400 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-violet-500/20 text-violet-300 font-bold">
                  ADMIN
                </span>
              </div>
              <div className="text-xs font-bold text-white group-hover:text-violet-200 truncate">
                Admin
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                Chief Officer
              </div>
            </button>

            {/* Customer */}
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('alex@foodguard.ai', 'Customer@2026', 'Customer')}
              disabled={loading}
              className="group p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/20 text-left transition-all duration-200 disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1">
                <UserIcon className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                  CLIENT
                </span>
              </div>
              <div className="text-xs font-bold text-white group-hover:text-cyan-200 truncate">
                Alex Mercer
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                Customer
              </div>
            </button>

            {/* Restaurant */}
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('manager@bellapizza.com', 'Partner@2026', 'Restaurant Partner')}
              disabled={loading}
              className="group p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/20 text-left transition-all duration-200 disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1">
                <Building2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  KITCHEN
                </span>
              </div>
              <div className="text-xs font-bold text-white group-hover:text-emerald-200 truncate">
                Bella Napoli
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                Restaurant
              </div>
            </button>

            {/* Courier */}
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('rider@speedydrop.com', 'Rider@2026', 'Delivery Partner')}
              disabled={loading}
              className="group p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/20 text-left transition-all duration-200 disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1">
                <Bike className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                  FLEET
                </span>
              </div>
              <div className="text-xs font-bold text-white group-hover:text-amber-200 truncate">
                Devon Carter
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                Courier
              </div>
            </button>
          </div>
        </div>

        {/* Main Authentication Card */}
        <div className="glass-panel rounded-2xl border border-white/10 p-6 sm:p-8 bg-[#0c1220]/90 shadow-2xl backdrop-blur-xl">
          {/* Mode Switch Tabs */}
          <div className="flex rounded-xl bg-slate-900/80 p-1 border border-white/5 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setSuccessNotice(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In to Platform
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); setSuccessNotice(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register Account
            </button>
          </div>

          {/* Feedback Notices */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {successNotice && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start space-x-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{successNotice}</div>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. alex@foodguard.ai"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300 font-mono">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setIsForgotOpen(true); setForgotStatus(null); setForgotEmail(email); }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 text-black hover:opacity-95 shadow-neon-cyan flex items-center justify-center space-x-2 transition-all disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Security Ledger...</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate Identity</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* REGISTER FORM (Restricted to Customer role) */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                  Full Legal Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Sarah Vance"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. sarah@domain.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Verified Customer Role Notice */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-cyan-500/20 text-xs text-slate-300 space-y-1">
                <div className="flex items-center space-x-2 text-cyan-400 font-mono font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Role: Customer Account (Dispute Reporter)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Public self-service creates verified Customer identities. Merchant Kitchen and Fleet Courier accounts are provisioned via administrative governance.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 text-black hover:opacity-95 shadow-neon-cyan flex items-center justify-center space-x-2 transition-all disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Provisioning Customer Identity...</span>
                  </>
                ) : (
                  <>
                    <span>Create Customer Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Security Badges */}
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-500 gap-2">
            <span className="flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-500" />
              <span>JWT Signed • Role Isolated</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-violet-500" />
              <span>FoodGuard Neural Core 2026</span>
            </span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md glass-panel rounded-2xl border border-white/10 p-6 bg-[#0c1220] shadow-2xl">
            <div className="flex items-center space-x-2.5 mb-3 text-cyan-400">
              <KeyRound className="w-5 h-5" />
              <h3 className="font-bold text-white text-base">Reset Account Credentials</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Enter the registered email associated with your account. A secure password reset token will be dispatched to your inbox.
            </p>

            {forgotStatus && (
              <div className="mb-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
                {forgotStatus}
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 font-mono">
                  Registered Email
                </label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-400 text-black hover:bg-cyan-300 transition-colors disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {forgotLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Send Reset Link</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};