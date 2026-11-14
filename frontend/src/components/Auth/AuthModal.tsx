import React, { useState } from 'react';
import { X, ShieldCheck, Mail, Lock, User as UserIcon, Building2, Bike, KeyRound, ArrowRight } from 'lucide-react';
import { api } from '../../api/client';
import { User, UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  currentUser: User | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentUser
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        const res = await api.auth.register(fullName, email, password, role);
        onSuccess(res.user);
        onClose();
      } else {
        const res = await api.auth.login(email, password);
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.login(demoEmail, demoPass);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md glass-panel rounded-2xl border border-white/10 p-6 sm:p-8 bg-[#0b101b] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-cyan-400 mb-3 shadow-neon-cyan">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            {isRegister ? 'Register Identity' : 'Platform Sign In'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Access FoodGuard AI multi-role dispute & investigation portal
          </p>
        </div>

        {/* Quick Demo Role Selector */}
        <div className="mb-6 bg-slate-900/60 p-3 rounded-xl border border-white/5">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block mb-2">
            Instant Demo Profiles:
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@foodguard.ai', 'Admin@2026')}
              className="flex items-center space-x-1.5 p-2 rounded-lg bg-violet-500/10 border border-violet-500/25 hover:bg-violet-500/20 text-violet-300 font-medium text-left transition-all"
            >
              <KeyRound className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              <div className="truncate">
                <span className="block text-[11px] font-bold">Admin</span>
                <span className="text-[9px] text-slate-400">Chief Officer</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('alex@foodguard.ai', 'Customer@2026')}
              className="flex items-center space-x-1.5 p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/25 hover:bg-cyan-500/20 text-cyan-300 font-medium text-left transition-all"
            >
              <UserIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <div className="truncate">
                <span className="block text-[11px] font-bold">Customer</span>
                <span className="text-[9px] text-slate-400">Alex Mercer</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('manager@bellapizza.com', 'Partner@2026')}
              className="flex items-center space-x-1.5 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 text-emerald-300 font-medium text-left transition-all"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div className="truncate">
                <span className="block text-[11px] font-bold">Restaurant</span>
                <span className="text-[9px] text-slate-400">Bella Napoli</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('rider@speedydrop.com', 'Rider@2026')}
              className="flex items-center space-x-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 text-amber-300 font-medium text-left transition-all"
            >
              <Bike className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div className="truncate">
                <span className="block text-[11px] font-bold">Courier</span>
                <span className="text-[9px] text-slate-400">SpeedyDrop</span>
              </div>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sarah Vance"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Role Type</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="customer">Customer</option>
                <option value="restaurant">Restaurant Partner</option>
                <option value="delivery_partner">Delivery Partner (Courier)</option>
                <option value="admin">Administrator / Reviewer</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 text-black hover:opacity-95 shadow-neon-cyan flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Processing...' : (isRegister ? 'Create Account' : 'Authenticate')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(null); }}
            className="text-xs text-cyan-400 hover:underline font-medium"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
};
