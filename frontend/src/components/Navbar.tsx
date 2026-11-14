import React from 'react';
import { 
  ShieldCheck, User as UserIcon, LogOut, Building2, Bike, Cpu
} from 'lucide-react';
import { User, ModelStatusCard, UserRole } from '../types';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  modelsStatus: ModelStatusCard[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  modelsStatus
}) => {
  const roleThemes: Record<UserRole, { label: string; color: string; border: string; bg: string; icon: any }> = {
    customer: { 
      label: 'Customer Portal', 
      color: 'text-cyan-300', 
      border: 'border-cyan-500/40', 
      bg: 'bg-cyan-500/15', 
      icon: UserIcon 
    },
    restaurant: { 
      label: 'Kitchen Partner', 
      color: 'text-emerald-300', 
      border: 'border-emerald-500/40', 
      bg: 'bg-emerald-500/15', 
      icon: Building2 
    },
    delivery_partner: { 
      label: 'Fleet Courier', 
      color: 'text-amber-300', 
      border: 'border-amber-500/40', 
      bg: 'bg-amber-500/15', 
      icon: Bike 
    },
    admin: { 
      label: 'Chief Investigator (Admin)', 
      color: 'text-violet-300', 
      border: 'border-violet-500/40', 
      bg: 'bg-violet-500/15', 
      icon: ShieldCheck 
    }
  };

  const currentTheme = currentUser ? roleThemes[currentUser.role] : roleThemes.customer;
  const RoleIcon = currentTheme.icon;

  const onlineModelsCount = modelsStatus.filter(m => m.status === 'ready' || m.status === 'custom_loaded').length || 4;

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 bg-[#080c14]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 group">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-violet-500/20 border border-cyan-500/40 shadow-neon-cyan transition-all">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-wider text-white">FOODGUARD</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 font-mono text-cyan-400 font-semibold">AI v2.4</span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wider uppercase font-mono">Autonomous Dispute Resolution</p>
          </div>
        </div>

        {/* Center: System Status telemetry */}
        <div className="hidden md:flex items-center space-x-3 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-white/5 font-mono text-xs">
          <div className="flex items-center space-x-2 text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>NEURAL ENGINES:</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-400 font-bold">{onlineModelsCount}/4 MODELS ACTIVE</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 text-[11px]">ORB+SSIM • YOLOv8 • INGESTION</span>
        </div>

        {/* Right Info: Authenticated Role & Sign Out */}
        <div className="flex items-center space-x-3">
          {currentUser && (
            <div className="flex items-center space-x-3 pl-2">
              {/* Authenticated Identity Pill */}
              <div className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border ${currentTheme.border} ${currentTheme.bg}`}>
                <RoleIcon className={`w-4 h-4 ${currentTheme.color}`} />
                <div className="text-left">
                  <div className={`text-xs font-bold ${currentTheme.color} leading-tight`}>
                    {currentUser.full_name}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block leading-tight">
                    {currentTheme.label}
                  </span>
                </div>
              </div>

              {/* Secure Sign Out Button */}
              <button
                onClick={onLogout}
                title="Sign Out"
                className="flex items-center space-x-1 px-3 py-1.5 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/30 transition-all font-mono text-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};