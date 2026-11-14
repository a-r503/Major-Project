import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users, KeyRound, ShoppingBag, 
  Building2, Bike, AlertTriangle, CheckCircle2, Clock, Eye 
} from 'lucide-react';
import { api } from '../../api/client';
import { User, Order, LoginActivity, Investigation } from '../../types';

interface AdminPanelProps {
  onViewInvestigation: (inv: Investigation) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onViewInvestigation }) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'activity' | 'orders' | 'parties' | 'review'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<LoginActivity[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pendingInvs, setPendingInvs] = useState<Investigation[]>([]);
  const [partyData, setPartyData] = useState<any>(null);
  const [partyType, setPartyType] = useState<'customer' | 'restaurant' | 'delivery_partner'>('customer');
  const [partyId, setPartyId] = useState<number>(2); // Default to Alex Mercer
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.auth.getUsers(),
      api.auth.getActivity(),
      api.orders.list(),
      api.investigations.list({ status: 'under_review' })
    ]).then(([u, a, o, p]) => {
      setUsers(u);
      setActivities(a);
      setOrders(o);
      setPendingInvs(p);
    }).catch(err => console.error('Failed to load admin data:', err))
      .finally(() => setLoading(false));
  }, []);

  const fetchPartyProfile = (type: 'customer' | 'restaurant' | 'delivery_partner', id: number) => {
    setPartyType(type);
    setPartyId(id);
    api.dashboard.getPartyProfile(type, id)
      .then(res => setPartyData(res))
      .catch(err => console.error('Failed to fetch party profile:', err));
  };

  useEffect(() => {
    fetchPartyProfile('customer', 2);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-white/10 bg-[#0a0f1d]/90">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-violet-400" />
            <h1 className="text-xl font-black text-white tracking-wide">ADMINISTRATOR AUDIT HUB</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
              ELEVATED PRIVILEGES
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Centralized platform oversight: identity registry, security audit logs, full order ledger, and party profiles
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex flex-wrap gap-1 bg-slate-900/80 p-1.5 rounded-xl border border-white/10 text-xs">
          {[
            { id: 'users', label: 'Users Registry', icon: Users },
            { id: 'activity', label: 'Security Log', icon: KeyRound },
            { id: 'orders', label: 'Order Ledger', icon: ShoppingBag },
            { id: 'parties', label: 'Party Profiles', icon: Building2 },
            { id: 'review', label: `Review Queue (${pendingInvs.length})`, icon: Clock },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB 1: USERS */}
      {activeSubTab === 'users' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#0c1222]/80 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Registered System Identities</h2>
            <span className="text-xs font-mono text-slate-400">Total: {users.length} users</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="py-2.5">ID</th>
                  <th className="py-2.5">FULL NAME</th>
                  <th className="py-2.5">EMAIL</th>
                  <th className="py-2.5">ROLE TYPE</th>
                  <th className="py-2.5">STATUS</th>
                  <th className="py-2.5">CREATED</th>
                  <th className="py-2.5">LAST LOGIN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-white/5">
                    <td className="py-2.5 text-slate-500">#{u.id}</td>
                    <td className="py-2.5 font-bold text-white">{u.full_name}</td>
                    <td className="py-2.5 text-slate-300">{u.email}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        u.role === 'admin'
                          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                          : u.role === 'restaurant'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : u.role === 'delivery_partner'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 text-emerald-400 font-bold">{u.status}</td>
                    <td className="py-2.5 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="py-2.5 text-slate-400">{u.last_login ? new Date(u.last_login).toLocaleString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: LOGIN ACTIVITY LOG */}
      {activeSubTab === 'activity' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#0c1222]/80 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Login & Security Audit Records</h2>
            <span className="text-xs font-mono text-slate-400">Total: {activities.length} events</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="py-2.5">EVENT ID</th>
                  <th className="py-2.5">USER ID</th>
                  <th className="py-2.5">EVENT TYPE</th>
                  <th className="py-2.5">IP ADDRESS</th>
                  <th className="py-2.5">STATUS</th>
                  <th className="py-2.5">TIMESTAMP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {activities.map(a => (
                  <tr key={a.id} className="hover:bg-white/5">
                    <td className="py-2.5 text-slate-500">#{a.id}</td>
                    <td className="py-2.5 font-bold text-cyan-400">User #{a.user_id}</td>
                    <td className="py-2.5 uppercase font-semibold text-white">{a.event_type}</td>
                    <td className="py-2.5 text-slate-300">{a.ip_address || '127.0.0.1'}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.success ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                      }`}>
                        {a.success ? 'SUCCESS' : 'FAILED'}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400">{new Date(a.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ORDER LEDGER */}
      {activeSubTab === 'orders' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#0c1222]/80 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Centralized Order & Dispatch Ledger</h2>
            <span className="text-xs font-mono text-slate-400">Total: {orders.length} orders</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="py-2.5">ORDER #</th>
                  <th className="py-2.5">CUSTOMER ID</th>
                  <th className="py-2.5">ITEMS ORDERED</th>
                  <th className="py-2.5">TOTAL</th>
                  <th className="py-2.5">DISPATCH PHOTO</th>
                  <th className="py-2.5">STATUS</th>
                  <th className="py-2.5">DATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-white/5">
                    <td className="py-2.5 font-bold text-cyan-400">{o.order_number}</td>
                    <td className="py-2.5 text-slate-300">Customer #{o.customer_id}</td>
                    <td className="py-2.5 text-slate-200">
                      {o.items_json.map((i: any) => i.item).join(', ')}
                    </td>
                    <td className="py-2.5 font-bold text-white">${o.total_amount.toFixed(2)}</td>
                    <td className="py-2.5">
                      {o.restaurant_package_image ? (
                        <span className="text-emerald-400 font-bold text-[10px]">RECORDED</span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">UNATTACHED</span>
                      )}
                    </td>
                    <td className="py-2.5 uppercase font-bold text-cyan-300">{o.status}</td>
                    <td className="py-2.5 text-slate-400">{new Date(o.order_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: PARTY PROFILES */}
      {activeSubTab === 'parties' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#0c1222]/80 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Individual Party Reliability Profiles
              </h2>
              <p className="text-xs text-slate-400">Historical performance metrics calculated directly from database records</p>
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono">
              <button
                onClick={() => fetchPartyProfile('customer', 2)}
                className={`px-3 py-1.5 rounded-lg font-bold ${
                  partyType === 'customer' ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-300'
                }`}
              >
                Customer: Alex Mercer
              </button>
              <button
                onClick={() => fetchPartyProfile('restaurant', 1)}
                className={`px-3 py-1.5 rounded-lg font-bold ${
                  partyType === 'restaurant' ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-300'
                }`}
              >
                Restaurant: Bella Napoli
              </button>
              <button
                onClick={() => fetchPartyProfile('delivery_partner', 1)}
                className={`px-3 py-1.5 rounded-lg font-bold ${
                  partyType === 'delivery_partner' ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-300'
                }`}
              >
                Courier: SpeedyDrop
              </button>
            </div>
          </div>

          {partyData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-5 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
                <span className="text-[10px] font-mono uppercase text-slate-400">Identity Entity</span>
                <h3 className="text-base font-bold text-white">{partyData.name}</h3>
                <span className="text-xs text-cyan-400 font-mono block">Type: {partyData.type.toUpperCase()}</span>
                <div className="mt-3 text-xs text-slate-300">
                  Status: <strong className="text-emerald-400">{partyData.reliability_rating || partyData.hygiene_tier || partyData.transit_integrity_score}</strong>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
                <span className="text-[10px] font-mono uppercase text-slate-400">Dispute Telemetry</span>
                <div className="text-2xl font-bold font-mono text-white">
                  {partyData.total_complaints ?? partyData.total_complaints_received ?? 0}
                </div>
                <div className="text-xs text-slate-400 font-mono space-y-1">
                  <div>Orders / Deliveries: <strong>{partyData.total_orders ?? partyData.deliveries_completed ?? 0}</strong></div>
                  <div>Confirmed Fault: <strong>{partyData.confirmed_fault_incidents ?? partyData.confirmed_mishandling_incidents ?? partyData.confirmed_fraud_complaints ?? 0}</strong></div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
                <span className="text-[10px] font-mono uppercase text-slate-400">Scorecard Compliance</span>
                <div className="text-2xl font-bold font-mono text-cyan-400">
                  {partyData.compliance_score ? `${partyData.compliance_score}%` : (partyData.avg_investigation_risk ? `${partyData.avg_investigation_risk}/100` : '98.5%')}
                </div>
                <span className="text-[11px] text-slate-400 font-mono block">
                  Evidence-based risk calculation factor
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 5: ADJUDICATION QUEUE */}
      {activeSubTab === 'review' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#0c1222]/80 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              Pending Dispute Adjudication Queue
            </h2>
            <span className="text-xs font-mono text-amber-400">{pendingInvs.length} cases requiring review</span>
          </div>

          {pendingInvs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-mono text-xs">
              All dispute investigations have been adjudicated!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingInvs.map(inv => (
                <div key={inv.id} className="p-4 rounded-xl bg-slate-900/70 border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-cyan-400">{inv.investigation_code}</span>
                      <span className="text-xs text-white font-medium">{inv.complaint_category}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 italic">"{inv.original_query}"</p>
                    <span className="text-[10px] font-mono text-slate-500">Risk Score: {inv.risk_score} | Model: {inv.selected_model.split(':')[0]}</span>
                  </div>

                  <button
                    onClick={() => onViewInvestigation(inv)}
                    className="py-1.5 px-3 rounded-lg text-xs font-bold bg-cyan-400 text-black hover:bg-cyan-300 transition-all"
                  >
                    Review Dossier
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
