import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert,
  Sliders,
  Database,
  Building2,
  Users,
  Lock,
  Activity,
  Truck,
  Layers,
  Sparkles
} from 'lucide-react';
import { AdminOverview } from './AdminOverview';
import { AdminOverviewSummary } from './AdminOverviewSummary';
import { AdminStores } from './AdminStores';
import { AdminWholesalers } from './AdminWholesalers';
import { AdminUsersRBAC } from './AdminUsersRBAC';
import { AdminDatabaseSync } from './AdminDatabaseSync';
import { AdminSecurity } from './AdminSecurity';
import { AdminAuditTrail } from './AdminAuditTrail';
import { AdminClients } from './AdminClients';
import { normalizeCanonicalRole } from '../../types';

export type AdminTab = 'overview' | 'clients' | 'stores' | 'wholesalers' | 'users' | 'database' | 'security' | 'audit';

interface AdminPanelProps {
  initialTab?: AdminTab;
  onTabChange?: (tab: AdminTab) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  initialTab = 'overview',
  onTabChange
}) => {
  const {
    stores,
    wholesalers,
    employees,
    products,
    invoices,
    customers,
    auditLogs,
    businessApplications,
    activeRole
  } = useStore();
  const { userProfile, currentUser: rawAuthUser } = useAuth();
  const authUser = rawAuthUser;

  const isSuperAdmin =
    authUser?.email?.toLowerCase() === 'ellixorrr@gmail.com' ||
    authUser?.email?.toLowerCase() === 'joshiakash1712@gmail.com' ||
    authUser?.email?.toLowerCase() === 'superadmin@ellic.com' ||
    normalizeCanonicalRole(activeRole) === 'super_admin' ||
    normalizeCanonicalRole(userProfile?.role) === 'super_admin';

  const isPlatformAdmin =
    isSuperAdmin ||
    normalizeCanonicalRole(activeRole) === 'ellix_admin' ||
    normalizeCanonicalRole(userProfile?.role) === 'ellix_admin';

  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    if (!isSuperAdmin && (initialTab === 'security' || initialTab === 'database')) {
      return 'overview';
    }
    return initialTab;
  });

  useEffect(() => {
    if (initialTab) {
      if (!isSuperAdmin && (initialTab === 'security' || initialTab === 'database')) {
        setActiveTab('overview');
      } else {
        setActiveTab(initialTab);
      }
    }
  }, [initialTab, isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin && (activeTab === 'security' || activeTab === 'database')) {
      setActiveTab('overview');
    }
  }, [isSuperAdmin, activeTab]);

  const handleSelectTab = (tab: AdminTab) => {
    if (!isSuperAdmin && (tab === 'security' || tab === 'database')) {
      return;
    }
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const pendingAppsCount = businessApplications?.filter(a => a.status === 'pending').length || 0;

  const navTabs: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    { id: 'overview', label: 'Platform Console', icon: <Sliders className="w-4 h-4" /> },
    {
      id: 'clients',
      label: 'Clients & Subscriptions',
      icon: <Building2 className="w-4 h-4" />,
      badge: pendingAppsCount > 0 ? `${pendingAppsCount} Pending` : undefined
    },
    { id: 'stores', label: 'Stores & Franchises', icon: <Building2 className="w-4 h-4" />, badge: stores.length },
    {
      id: 'users',
      label: isSuperAdmin ? 'Crew & RBAC Governance' : 'Client & User Access',
      icon: <Users className="w-4 h-4" />,
      badge: employees.length
    },
    { id: 'wholesalers', label: 'Wholesale Hub', icon: <Truck className="w-4 h-4" />, badge: wholesalers.length },
    ...(isSuperAdmin ? [
      { id: 'database' as AdminTab, label: 'Database & Sync', icon: <Database className="w-4 h-4" /> },
      { id: 'security' as AdminTab, label: 'Security & Hardware', icon: <Lock className="w-4 h-4" /> }
    ] : []),
    { id: 'audit', label: 'Audit Trail', icon: <Activity className="w-4 h-4" />, badge: auditLogs.length }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* 1. TOP ENTERPRISE BANNER & QUICK STATS */}
      <div className="p-5 sm:p-6 rounded-xl bg-gradient-to-r from-[#121826] via-[#121826] to-blue-950/30 border border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-white tracking-tight">
                  {isSuperAdmin ? 'Superadmin Control Center' : 'Ellic Admin Operations Console'}
                </h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  {isSuperAdmin ? 'Tenant Superuser (L1)' : 'Operational Admin (L2)'}
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                  {authUser?.email || 'Platform Active'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isSuperAdmin
                  ? 'Centralized governance for multi-store franchise stores, B2B supplier hubs, staff RBAC, and JSON backups.'
                  : 'Operational governance for onboarding reviews, client subscriptions, and franchise store monitoring.'}
              </p>
            </div>
          </div>
        </div>

        {/* Global Cluster Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs tabular-nums shrink-0">
          <button
            type="button"
            onClick={() => handleSelectTab('stores')}
            className="text-left p-3 rounded-xl bg-[#0A0E1A]/80 border border-slate-800 hover:border-sky-500/40 cursor-pointer transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500"
            aria-label={`View Active Stores: ${stores.length} Stores`}
          >
            <span className="text-[10px] text-slate-400 block font-semibold">Active Stores</span>
            <span className="text-lg font-black text-white">{stores.length} Stores</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectTab('wholesalers')}
            className="text-left p-3 rounded-xl bg-[#0A0E1A]/80 border border-slate-800 hover:border-sky-500/40 cursor-pointer transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500"
            aria-label={`View Wholesalers: ${wholesalers.length} Suppliers`}
          >
            <span className="text-[10px] text-slate-400 block font-semibold">Wholesalers</span>
            <span className="text-lg font-black text-sky-400">{wholesalers.length} Suppliers</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectTab('users')}
            className="text-left p-3 rounded-xl bg-[#0A0E1A]/80 border border-slate-800 hover:border-sky-500/40 cursor-pointer transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500"
            aria-label={`View Roster Staff: ${employees.length} Users`}
          >
            <span className="text-[10px] text-slate-400 block font-semibold">Roster Staff</span>
            <span className="text-lg font-black text-sky-400">{employees.length} Users</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectTab('audit')}
            className="text-left p-3 rounded-xl bg-[#0A0E1A]/80 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500"
            aria-label="View Compliance Audit Trail: 100% Audit"
          >
            <span className="text-[10px] text-slate-400 block font-semibold">Compliance</span>
            <span className="text-lg font-black text-indigo-400">100% Audit</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#121826] border border-slate-800 shadow-lg overflow-x-auto no-scrollbar">
        {navTabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSelectTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-lg tabular-nums ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. ACTIVE SUB-VIEW RENDER */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <AdminOverviewSummary onNavigateTab={handleSelectTab} />
            <AdminOverview
              onNavigateTab={(tab) => handleSelectTab(tab as AdminTab)}
              onOpenAddStore={() => handleSelectTab('stores')}
            />
          </div>
        )}

        {activeTab === 'clients' && <AdminClients />}

        {activeTab === 'stores' && <AdminStores />}

        {activeTab === 'wholesalers' && <AdminWholesalers />}

        {activeTab === 'users' && <AdminUsersRBAC />}

        {activeTab === 'database' && <AdminDatabaseSync />}

        {activeTab === 'security' && <AdminSecurity />}

        {activeTab === 'audit' && <AdminAuditTrail />}
      </div>

    </div>
  );
};
