import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CustomerDashboard } from './components/Dashboards/CustomerDashboard';
import { RestaurantDashboard } from './components/Dashboards/RestaurantDashboard';
import { DeliveryDashboard } from './components/Dashboards/DeliveryDashboard';
import { AdminDashboard } from './components/Dashboards/AdminDashboard';
import { InvestigationDetailModal } from './components/Investigations/InvestigationDetailModal';
import { AuthPage } from './components/Auth/AuthPage';
import { api, getStoredUser, clearAuthToken, setStoredUser, getAuthToken } from './api/client';
import { User, DashboardStats, ModelStatusCard, Investigation } from './types';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser());
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [modelsStatus, setModelsStatus] = useState<ModelStatusCard[]>([]);
  const [selectedInvestigation, setSelectedInvestigation] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Authenticate session and sync telemetry on mount
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      // Validate current session against backend token endpoint
      api.auth.getMe()
        .then(verifiedUser => {
          setCurrentUser(verifiedUser);
          setStoredUser(verifiedUser);
          refreshTelemetry();
        })
        .catch(err => {
          console.warn('Stored session invalidated or expired:', err);
          clearAuthToken();
          setCurrentUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      // No token present; show Login/Register authentication page
      clearAuthToken();
      setCurrentUser(null);
      setLoading(false);
    }
  }, []);

  const refreshTelemetry = () => {
    api.dashboard.getStats()
      .then(stats => {
        setDashboardStats(stats);
        setModelsStatus(stats.models_status);
      })
      .catch(err => console.error('Dashboard telemetry sync failed:', err));
  };

  const handleLogout = () => {
    clearAuthToken();
    setCurrentUser(null);
    setDashboardStats(null);
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setStoredUser(user);
    refreshTelemetry();
  };

  const handleInvestigationUpdated = (updated: Investigation) => {
    setSelectedInvestigation(updated);
    refreshTelemetry();
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] text-slate-100 flex items-center justify-center font-mono text-xs">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-cyan-400 tracking-wider uppercase">Loading Security Ledger...</span>
        </div>
      </div>
    );
  }

  // FIRST SCREEN ENFORCEMENT: Unauthenticated users MUST see the Login/Register page first!
  if (!currentUser) {
    return <AuthPage onSuccess={handleAuthSuccess} />;
  }

  // AUTHENTICATED APPLICATION: Render role-specific layout & dashboard
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col relative selection:bg-cyan-400 selection:text-black">
      {/* Background Cyber Grid Accent */}
      <div className="fixed inset-0 bg-grid-cyber pointer-events-none opacity-40 z-0" />
      
      {/* Ambient Lighting Spheres */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Top Navbar with Authenticated Role Details & Sign Out */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        modelsStatus={modelsStatus}
      />

      {/* Role-Based Dynamic Dashboard Rendering */}
      <main className="flex-1 relative z-10">
        {currentUser.role === 'customer' ? (
          /* ROLE 1: CUSTOMER DASHBOARD */
          <CustomerDashboard
            currentUser={currentUser}
            onOpenAuth={() => {}}
            onViewInvestigation={(inv) => setSelectedInvestigation(inv)}
          />
        ) : currentUser.role === 'restaurant' ? (
          /* ROLE 2: RESTAURANT DASHBOARD */
          <RestaurantDashboard
            currentUser={currentUser}
            onViewInvestigation={(inv) => setSelectedInvestigation(inv)}
          />
        ) : currentUser.role === 'delivery_partner' ? (
          /* ROLE 3: DELIVERY PARTNER DASHBOARD */
          <DeliveryDashboard
            currentUser={currentUser}
            onViewInvestigation={(inv) => setSelectedInvestigation(inv)}
          />
        ) : (
          /* ROLE 4: ADMIN / FORENSIC OFFICER DASHBOARD */
          <AdminDashboard
            currentUser={currentUser}
            stats={dashboardStats}
            onViewInvestigation={(inv) => setSelectedInvestigation(inv)}
            onOpenAuth={() => {}}
          />
        )}
      </main>

      {/* Investigation Dossier Detail Modal */}
      <InvestigationDetailModal
        investigation={selectedInvestigation}
        onClose={() => setSelectedInvestigation(null)}
        onUpdated={handleInvestigationUpdated}
        currentUser={currentUser}
      />
    </div>
  );
};