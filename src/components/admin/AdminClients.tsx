import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  ShieldCheck,
  CreditCard,
  Users,
  Search,
  Filter,
  Check,
  AlertCircle,
  Store as StoreIcon,
  Calendar,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  UserPlus,
  Mail,
  Shield,
  PauseCircle,
  PlayCircle,
  AlertTriangle
} from 'lucide-react';
import { BusinessApplication, normalizeCanonicalRole } from '../../types';

interface AdminMember {
  uid: string;
  name: string;
  email: string;
  role: 'super_admin' | 'ellix_admin';
  status: 'active' | 'revoked';
  department?: string;
  createdAt?: string;
}

export const AdminClients: React.FC = () => {
  const {
    businessApplications,
    approveBusinessApplication,
    rejectBusinessApplication,
    stores,
    subscription,
    updateSubscription,
    toggleStorePause,
    activeRole
  } = useStore();

  const { userProfile, currentUser: authUser } = useAuth();
  const isSuperAdmin =
    normalizeCanonicalRole(activeRole) === 'super_admin' ||
    normalizeCanonicalRole(userProfile?.role) === 'super_admin';

  const [activeSubTab, setActiveSubTab] = useState<'applications' | 'clients' | 'plans' | 'admins'>('applications');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState<BusinessApplication | null>(null);
  const [appToApprove, setAppToApprove] = useState<BusinessApplication | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Admin Team Management State (Super Admin Only)
  const [adminTeam, setAdminTeam] = useState<AdminMember[]>([
    {
      uid: 'sa-sole-superadmin',
      name: 'Sole Super Admin',
      email: 'ellixorrr@gmail.com',
      role: 'super_admin',
      status: 'active',
      department: 'Platform Governance & Executive',
      createdAt: '2026-01-01'
    },
    {
      uid: 'ea-ops-ellic-admin',
      name: 'Ellic Admin',
      email: 'ellic.admin11@gmail.com',
      role: 'ellix_admin',
      status: 'active',
      department: 'Client & Store Governance',
      createdAt: '2026-10-25'
    }
  ]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDept, setInviteDept] = useState('Operations & Onboarding');
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  // Fetch admin team on tab switch
  React.useEffect(() => {
    if (activeSubTab === 'admins' && isSuperAdmin && authUser) {
      const fetchTeam = async () => {
        setIsLoadingTeam(true);
        try {
          const token = await authUser.getIdToken();
          if (!token || token.split('.').length !== 3) {
            return;
          }
          const res = await fetch('/api/admin/team', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.team) && data.team.length > 0) {
              setAdminTeam(data.team);
            }
          }
        } catch (e) {
          console.warn('Could not load remote admin team list:', e);
        } finally {
          setIsLoadingTeam(false);
        }
      };
      fetchTeam();
    }
  }, [activeSubTab, isSuperAdmin, authUser]);

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Please provide both full name and email address.' });
      return;
    }
    setIsSubmittingInvite(true);
    try {
      let token = '';
      if (authUser) {
        token = await authUser.getIdToken();
      }
      const res = await fetch('/api/admin/team/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: inviteName.trim(),
          email: inviteEmail.trim(),
          department: inviteDept
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to provision Ellic Admin');
      }

      setAdminTeam(prev => [
        ...prev.filter(m => m.email !== inviteEmail.trim()),
        data.admin
      ]);
      setFeedbackMsg({ type: 'success', text: `Ellic Admin authority successfully provisioned for ${inviteName}.` });
      setShowInviteModal(false);
      setInviteName('');
      setInviteEmail('');
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to create Ellic Admin.' });
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleRevokeAdmin = async (uid: string, name: string) => {
    if (!window.confirm(`Are you sure you want to revoke Ellic Admin authority for ${name}?`)) {
      return;
    }
    try {
      let token = '';
      if (authUser) {
        token = await authUser.getIdToken();
      }
      const res = await fetch('/api/admin/team/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ uid })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to revoke admin authority');
      }

      setAdminTeam(prev => prev.map(m => m.uid === uid ? { ...m, status: 'revoked' } : m));
      setFeedbackMsg({ type: 'success', text: `Admin authority revoked for ${name}.` });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to revoke admin access.' });
    }
  };

  // Filtered applications
  const pendingApps = businessApplications.filter(a => a.status === 'pending');
  const processedApps = businessApplications.filter(a => a.status !== 'pending');

  const filteredApps = (activeSubTab === 'applications' ? businessApplications : []).filter(app =>
    app.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConfirmApproval = async () => {
    if (!appToApprove) return;
    setIsApproving(true);
    try {
      await approveBusinessApplication(appToApprove.id, reviewNotes || 'Application verified and approved by Ellic Admin');
      setFeedbackMsg({ type: 'success', text: 'Application approved! Business workspace and initial store setup activated.' });
      setSelectedApp(null);
      setAppToApprove(null);
      setReviewNotes('');
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to approve application. Please try again.' });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = (appId: string) => {
    rejectBusinessApplication(appId, reviewNotes || 'Requirements not met at this time.');
    setFeedbackMsg({ type: 'error', text: 'Application rejected.' });
    setSelectedApp(null);
    setReviewNotes('');
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  return (
    <div className="space-y-6 tabular-nums">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#121826] border border-slate-800 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-black text-white">Client Management & Subscriptions</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Approve onboarding applications, govern client subscriptions, and configure platform tiers.
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0A0E1A] border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveSubTab('applications')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'applications'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Applications</span>
            {pendingApps.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/30">
                {pendingApps.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('clients')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'clients'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <StoreIcon className="w-3.5 h-3.5" />
            <span>Clients & Outlets</span>
          </button>

          <button
            onClick={() => setActiveSubTab('plans')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'plans'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Pricing Plans</span>
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setActiveSubTab('admins')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeSubTab === 'admins'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ellic Admins</span>
            </button>
          )}
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 border ${
            feedbackMsg.type === 'success'
              ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}
        >
          {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* 1. APPLICATIONS QUEUE */}
      {activeSubTab === 'applications' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search business or owner..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0A0E1A] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 self-end sm:self-auto">
              <span className="font-semibold">{pendingApps.length} Pending Review</span>
              <span>•</span>
              <span>{processedApps.length} Processed</span>
            </div>
          </div>

          {filteredApps.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-[#121826] border border-slate-800">
              <CheckCircle2 className="w-10 h-10 text-sky-500/40 mx-auto mb-2" />
              <div className="text-sm font-bold text-white">No applications match your filter</div>
              <p className="text-xs text-slate-400 mt-1">Pending onboarding submissions will appear here for verification.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredApps.map(app => (
                <div
                  key={app.id}
                  className="p-5 rounded-xl bg-[#121826] border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">{app.businessName}</span>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg border ${
                            app.status === 'approved'
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                              : app.status === 'rejected'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{app.businessType} • {app.city || 'National'}</div>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-lg bg-[#0A0E1A] border border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Owner</span>
                      <span className="text-white font-semibold">{app.ownerName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Contact</span>
                      <span className="text-slate-300 font-semibold">{app.phone}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Email</span>
                      <span className="text-slate-300 truncate block">{app.email}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Estimated Outlets</span>
                      <span className="text-sky-400 font-bold">{app.storeCount || 1} Outlets</span>
                    </div>
                  </div>

                  {app.status === 'pending' ? (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setAppToApprove(app)}
                        className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Provision</span>
                      </button>
                      <button
                        onClick={() => handleReject(app.id)}
                        className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 bg-[#0A0E1A] p-2.5 rounded-lg border border-slate-800">
                      <span className="font-semibold text-slate-300">Decision Note: </span>
                      {app.reviewNotes || 'Actioned by Platform Admin'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. CLIENTS & OUTLETS */}
      {activeSubTab === 'clients' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-[#121826] border border-slate-800 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white">Active Tenant Accounts</h3>
                <p className="text-xs text-slate-400">Total client organizations operating on Ellic.</p>
              </div>
              <div className="px-3 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-extrabold">
                {stores.length} Retail Stores Deployed
              </div>
            </div>

            <div className="divide-y divide-slate-800">
              {stores.map(st => {
                const isPaused = st.status === 'paused' || st.subscriptionStatus === 'unpaid';

                return (
                  <div key={st.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg border flex items-center justify-center font-black text-sm shrink-0 ${
                        isPaused
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                      }`}>
                        {st.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white">{st.name}</span>
                          {isPaused ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>UNPAID / PAUSED</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>PAID & ACTIVE</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {st.city} • GSTIN: {st.gstin || 'Unregistered'} • Owner: {st.ownerName}
                        </div>
                        {isPaused && st.pausedReason && (
                          <div className="text-[11px] text-amber-300/80 mt-1">
                            Paused reason: {st.pausedReason}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-medium text-xs">
                        Plan: {subscription.planName || 'Growth Pro'}
                      </span>
                      <button
                        onClick={async () => {
                          try {
                            await toggleStorePause(st.id, !isPaused, isPaused ? undefined : 'Unpaid subscription renewal');
                            setFeedbackMsg({
                              type: 'success',
                              text: isPaused
                                ? `Client store "${st.name}" successfully activated! Subscription marked paid.`
                                : `Client store "${st.name}" paused! Access restricted until subscription payment.`
                            });
                          } catch (err: any) {
                            setFeedbackMsg({
                              type: 'error',
                              text: `Failed to update store status: ${err?.message || 'Error'}`
                            });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 shadow-sm ${
                          isPaused
                            ? 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border-emerald-500/30'
                            : 'bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                        }`}
                        title={isPaused ? "Reactivate store and mark subscription paid" : "Pause store access until subscription is paid"}
                      >
                        {isPaused ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                        <span>{isPaused ? 'Reactivate Store' : 'Pause Store (Unpaid)'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. PRICING PLANS */}
      {activeSubTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-xl bg-[#121826] border border-slate-800 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-400">Starter</span>
              <span className="text-xs text-sky-400 font-extrabold">Single Store</span>
            </div>
            <div>
              <span className="text-2xl font-black text-white">₹799</span>
              <span className="text-xs text-slate-400"> / month</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-2 border-t border-slate-800 pt-3">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-sky-400" /> POS & Billing (Fast Shift)</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-sky-400" /> Inventory alerts (Low stock)</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-sky-400" /> Customer ledger & GST invoicing</li>
            </ul>
          </div>

          <div className="p-5 rounded-xl bg-blue-950/30 border border-sky-500/40 shadow-xl space-y-4 relative">
            <div className="absolute -top-3 right-4 px-2 py-0.5 rounded-lg bg-sky-500 text-slate-950 font-black text-[10px] uppercase">
              Most Popular
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-sky-300">Growth Pro</span>
              <span className="text-xs text-sky-400 font-extrabold">Up to 3 Outlets</span>
            </div>
            <div>
              <span className="text-2xl font-black text-white">₹1,999</span>
              <span className="text-xs text-slate-400"> / month</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-2 border-t border-blue-900/60 pt-3">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-sky-400" /> Multi-store synchronization</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-sky-400" /> Crew RBAC & Discount controls</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-sky-400" /> B2B Wholesaler restock orders</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-sky-400" /> WhatsApp & PDF receipt delivery</li>
            </ul>
          </div>

          <div className="p-5 rounded-xl bg-[#121826] border border-slate-800 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-400">Enterprise</span>
              <span className="text-xs text-indigo-400 font-extrabold">Unlimited Outlets</span>
            </div>
            <div>
              <span className="text-2xl font-black text-white">₹4,999</span>
              <span className="text-xs text-slate-400"> / month</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-2 border-t border-slate-800 pt-3">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-400" /> Unlimited outlets & franchises</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-400" /> Automated GST E-Way Bill 2.0</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-400" /> Dedicated account manager</li>
            </ul>
          </div>
        </div>
      )}

      {/* 4. ELLIC ADMINS (SUPER ADMIN ONLY) */}
      {activeSubTab === 'admins' && isSuperAdmin && (
        <div className="p-5 rounded-xl bg-[#121826] border border-slate-800 space-y-5 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-black text-white">Ellic Admin Team Governance</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Super Admin exclusive controls to provision and govern Level 2 Operations Admins.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite / Add Ellic Admin</span>
              </button>
            </div>
          </div>

          {isLoadingTeam ? (
            <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Loading admin roster from secure server...</span>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {adminTeam.map((member) => {
                const isRoot = member.email === 'ellixorrr@gmail.com' || member.role === 'super_admin';
                const isRevoked = member.status === 'revoked';

                return (
                  <div
                    key={member.uid}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                      isRevoked
                        ? 'bg-[#0A0E1A]/60 border-slate-800/60 opacity-60'
                        : isRoot
                        ? 'bg-indigo-950/20 border-indigo-500/30'
                        : 'bg-[#0A0E1A] border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0 ${
                          isRoot
                            ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300'
                            : isRevoked
                            ? 'bg-slate-800 border border-slate-700 text-slate-500'
                            : 'bg-sky-500/20 border border-sky-500/40 text-sky-300'
                        }`}
                      >
                        {isRoot ? 'SA' : isRevoked ? 'REV' : 'EA'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">{member.name}</span>
                          {isRoot && (
                            <span className="px-1.5 py-0.2 rounded-md text-[9px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                              Super Admin
                            </span>
                          )}
                          {!isRoot && !isRevoked && (
                            <span className="px-1.5 py-0.2 rounded-md text-[9px] font-extrabold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/40">
                              Ellic Admin
                            </span>
                          )}
                          {isRevoked && (
                            <span className="px-1.5 py-0.2 rounded-md text-[9px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              Revoked
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{member.email}</span>
                          <span>•</span>
                          <span>{member.department || 'Operations'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {isRoot ? (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20">
                          Root Executive Authority
                        </span>
                      ) : isRevoked ? (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20">
                          Access Revoked
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRevokeAdmin(member.uid, member.name)}
                          className="px-3 py-1 rounded-lg text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all flex items-center gap-1.5"
                          title="Revoke Ellic Admin authority"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Revoke Access</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Super Admin Notice Card */}
          <div className="p-3.5 rounded-xl bg-[#0A0E1A] border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <Shield className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Security Architecture:</strong> Super Admin is the sole authority permitted to provision and revoke Ellic Admin roles. Ellic Admins cannot invite, elevate, or modify other administrators.
            </div>
          </div>
        </div>
      )}

      {/* Invite Ellic Admin Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0E1A]/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#161D2C] border border-slate-700/80 rounded-2xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-black text-white">Provision New Ellic Admin</h4>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteAdmin} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0E1A] border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. priya.admin@ellic.com"
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0E1A] border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Department / Assignment</label>
                <select
                  value={inviteDept}
                  onChange={(e) => setInviteDept(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0E1A] border border-slate-700/80 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Operations & Onboarding">Operations & Onboarding</option>
                  <option value="Client Compliance & Verification">Client Compliance & Verification</option>
                  <option value="Subscription Governance">Subscription Governance</option>
                  <option value="Technical Operations & POS Support">Technical Operations & POS Support</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300">
                The account will be provisioned with Level 2 <code>ellix_admin</code> permissions via Firebase Admin SDK.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInvite}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                >
                  {isSubmittingInvite ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Provisioning...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Provision Ellic Admin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FIX 16: New Business Approval Confirmation Modal */}
      {appToApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0E1A]/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#161D2C] border border-slate-700/80 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Approve Business Application</h3>
                <p className="text-xs text-slate-400">Onboarding verification safeguard</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0A0E1A] border border-slate-800 space-y-2 text-xs">
              <p className="text-slate-200 leading-relaxed font-medium">
                Approving this application will create the business workspace and activate the initial store setup.
              </p>
              <div className="pt-2 border-t border-slate-800/80 space-y-1 text-slate-400">
                <div>Business: <strong className="text-white">{appToApprove.businessName}</strong></div>
                <div>Owner: <span className="text-slate-200">{appToApprove.ownerName}</span></div>
                <div>City: <span className="text-slate-200">{appToApprove.city || 'India'}</span></div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setAppToApprove(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isApproving}
                onClick={handleConfirmApproval}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>{isApproving ? 'Activating Workspace...' : 'Approve Application'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
