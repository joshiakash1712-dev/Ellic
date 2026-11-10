import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Sliders,
  Bell,
  CheckCircle2,
  Radio,
  Building2,
  Users,
  Activity,
  Layers,
  Zap,
  ShieldCheck,
  HardDrive,
  Cpu,
  RefreshCw,
  Server,
  Wifi,
  Sparkles,
  AlertTriangle,
  FileCheck,
  Send
} from 'lucide-react';

interface AdminOverviewProps {
  onNavigateTab: (tab: string) => void;
  onOpenAddStore: () => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  onNavigateTab,
  onOpenAddStore
}) => {
  const {
    stores,
    wholesalers,
    employees,
    auditLogs,
    addAuditLog,
    products,
    invoices,
    customers,
    activeStore,
    activeRole,
    userProfile
  } = useStore();

  const isSuperAdmin = activeRole === 'super_admin' || userProfile?.role === 'super_admin';

  // Feature Flags
  const [featureFlags, setFeatureFlags] = useState({
    whatsAppInvoices: true,
    realtimeSync: true,
    twoFactorAuth: true,
    escPosHardwareDriver: true,
    gstEWayBillSync: false,
    offlineIndexedDBCache: true,
    autoBackupHourly: true,
    smartInventoryAlerts: true
  });

  // Announcement State
  const [announcement, setAnnouncement] = useState('');
  const [announcementTarget, setAnnouncementTarget] = useState<'all' | 'retailers' | 'wholesalers' | 'staff'>('all');
  const [announcementPriority, setAnnouncementPriority] = useState<'info' | 'urgent' | 'tax_compliance'>('info');
  const [announcementPosted, setAnnouncementPosted] = useState(false);

  // Broadcast History
  const [broadcastHistory, setBroadcastHistory] = useState([
    {
      id: 'bc-1',
      target: 'all',
      priority: 'urgent',
      message: 'GST E-Way Bill 2.0 portal integration update scheduled for Sunday midnight.',
      timestamp: '2 hours ago',
      author: 'Platform Admin'
    },
    {
      id: 'bc-2',
      target: 'retailers',
      priority: 'info',
      message: 'New Wholesale Monsoon Catalog with 15% bulk discounts is now live.',
      timestamp: 'Yesterday',
      author: 'Wholesale Ops'
    }
  ]);

  const toggleFlag = (flag: keyof typeof featureFlags) => {
    const nextVal = !featureFlags[flag];
    setFeatureFlags(prev => ({ ...prev, [flag]: nextVal }));
    addAuditLog('Feature Flag Toggled', `Flag ${String(flag)} changed to ${nextVal}`);
  };

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcement.trim()) return;

    const newBroadcast = {
      id: `bc-${Date.now()}`,
      target: announcementTarget,
      priority: announcementPriority,
      message: announcement.trim(),
      timestamp: 'Just now',
      author: 'Superadmin'
    };

    setBroadcastHistory(prev => [newBroadcast, ...prev]);
    setAnnouncementPosted(true);
    addAuditLog('Platform Broadcast Dispatched', `Target: ${announcementTarget} | Priority: ${announcementPriority} | Message: "${announcement}"`);
    
    setTimeout(() => {
      setAnnouncementPosted(false);
      setAnnouncement('');
    }, 3500);
  };

  const deleteBroadcast = (id: string) => {
    setBroadcastHistory(prev => prev.filter(b => b.id !== id));
    addAuditLog('Broadcast Notice Removed', `Deleted broadcast message ID ${id}`);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. SYSTEM HEALTH & TELEMETRY MONITOR */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 tabular-nums">
        
        {/* Cloud Sync & Node Telemetry */}
        <div className="p-5 rounded-xl bg-[#121826] border border-slate-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Server className="w-4 h-4 text-sky-400" />
              <span>Multi-Tenant Cluster Health</span>
            </span>
            <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20">
              99.98% SLA
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Cluster Ingress Latency</span>
              <span className="font-mono font-bold text-sky-400">18 ms</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>WebSockets Active Channels</span>
              <span className="font-mono font-bold text-white">{stores.length * 3 + 4} Live</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Memory Footprint (Worker)</span>
              <span className="font-mono font-bold text-slate-300">48.2 MB / 512 MB</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-sky-500 h-full w-[9.4%]" />
            </div>
          </div>
        </div>

        {/* Multi-Store Fleet Overview */}
        <div className="p-5 rounded-xl bg-[#121826] border border-slate-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-400" />
              <span>Branch Fleet Status</span>
            </span>
            <button
              onClick={() => onNavigateTab('stores')}
              className="text-[11px] font-semibold text-sky-400 hover:underline"
            >
              View All ({stores.length})
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Active Online Stores</span>
              <span className="font-mono font-bold text-sky-400">{stores.filter(s => s.status !== 'paused').length} Operational</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Paused Stores (Unpaid)</span>
              <span className={`font-mono font-bold ${stores.filter(s => s.status === 'paused').length > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                {stores.filter(s => s.status === 'paused').length} Paused
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Total Customers in Ledger</span>
              <span className="font-mono font-bold text-slate-300">{customers.length} Accounts</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-sky-500 h-full w-[85%]" />
            </div>
          </div>
        </div>

        {/* Security & RBAC Enforcement */}
        <div className="p-5 rounded-xl bg-[#121826] border border-slate-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Security & RBAC Enforcement</span>
            </span>
            {isSuperAdmin && (
              <button
                onClick={() => onNavigateTab('security')}
                className="text-[11px] font-semibold text-indigo-400 hover:underline"
              >
                Configure
              </button>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>2FA Admin Policy</span>
              <span className="font-bold text-sky-400">Enforced</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Manager PIN on Discounts</span>
              <span className="font-bold text-sky-400">Active</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Audit Records Stored</span>
              <span className="font-mono font-bold text-indigo-400">{auditLogs.length} Events</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full w-[100%]" />
            </div>
          </div>
        </div>

      </div>

      {/* 2. FEATURE FLAGS & BROADCAST DISPATCHER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Feature Flags Matrix */}
        <div className="p-5 sm:p-6 rounded-xl bg-[#121826] border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-400" />
                <span>Enterprise Feature Flags</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Toggle platform capabilities and canary rollouts in real-time.
              </p>
            </div>
            <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20">
              Dynamic Canary
            </span>
          </div>

          <div className="space-y-2">
            {Object.entries(featureFlags).map(([key, val]) => (
              <div
                key={key}
                className="p-3 rounded-xl bg-[#0A0E1A]/80 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
              >
                <div className="pr-2">
                  <span className="font-semibold text-slate-200 capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {val ? 'Enabled across all active franchise terminals' : 'Disabled / Restricted'}
                  </span>
                </div>
                <button
                  id={`flag-toggle-${key}`}
                  onClick={() => toggleFlag(key as any)}
                  className={`w-11 h-6 rounded-full transition-colors p-1 flex items-center shrink-0 ${
                    val ? 'bg-sky-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                  title={val ? 'Click to disable' : 'Click to enable'}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Global Broadcast Center */}
        <div className="p-5 sm:p-6 rounded-xl bg-[#121826] border border-slate-800 shadow-lg space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-sky-400" />
                <span>Broadcast System Announcement</span>
              </h3>
              <span className="text-[10px] text-slate-400">Push to all POS & Portals</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Instantly push critical alerts, tax compliance notifications, or maintenance warnings.
            </p>

            <form onSubmit={handlePostAnnouncement} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Target Audience</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['all', 'retailers', 'wholesalers', 'staff'] as const).map(target => (
                      <button
                        key={target}
                        type="button"
                        onClick={() => setAnnouncementTarget(target)}
                        className={`px-2 py-1.5 rounded-lg font-bold capitalize text-[11px] transition-colors ${
                          announcementTarget === target
                            ? 'bg-blue-600 text-white shadow'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {target}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Notice Priority</label>
                  <div className="space-y-1">
                    {(['info', 'urgent', 'tax_compliance'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setAnnouncementPriority(p)}
                        className={`w-full px-2 py-1 rounded-lg font-semibold text-[10px] uppercase text-left transition-colors ${
                          announcementPriority === p
                            ? p === 'urgent'
                              ? 'bg-rose-500 text-white'
                              : p === 'tax_compliance'
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {p.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Broadcast Message Body *</label>
                <textarea
                  value={announcement}
                  onChange={e => setAnnouncement(e.target.value)}
                  placeholder="e.g. GST E-Way Bill 2.0 portal maintenance scheduled at 11:00 PM tonight. Please sync pending invoices before 10:30 PM..."
                  rows={3}
                  className="w-full bg-[#0A0E1A] border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-sky-500 placeholder-slate-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Radio className="w-4 h-4" />
                <span>Dispatch Instant Broadcast</span>
              </button>
            </form>
          </div>

          {announcementPosted && (
            <div className="text-xs text-sky-400 font-bold bg-sky-500/10 p-3 rounded-xl border border-sky-500/30 flex items-center gap-2 mt-3">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Broadcast dispatched successfully to active sessions and recorded in audit log.</span>
            </div>
          )}

          {/* Broadcast History */}
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2">
              Recent Broadcast Feed ({broadcastHistory.length})
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {broadcastHistory.map(b => (
                <div
                  key={b.id}
                  className="p-2.5 rounded-xl bg-[#0A0E1A]/80 border border-slate-800 flex items-start justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-lg ${
                        b.priority === 'urgent'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {b.priority}
                      </span>
                      <span className="text-[10px] text-slate-400">Target: {b.target} • {b.timestamp}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{b.message}</p>
                  </div>
                  <button
                    onClick={() => deleteBroadcast(b.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                    title="Remove broadcast"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
