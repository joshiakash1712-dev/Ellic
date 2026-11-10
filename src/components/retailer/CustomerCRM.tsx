import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { CustomerProfile, InvoiceTemplate } from '../../types';
import { Skeleton } from '../common/skeletons/SkeletonBase';
import {
  Users,
  Plus,
  Search,
  Phone,
  CreditCard,
  Award,
  CheckCircle,
  AlertCircle,
  X,
  History,
  DollarSign,
  Palette,
  CheckSquare,
  Square,
  SlidersHorizontal,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldAlert,
  FileCheck,
  Check,
  Store as StoreIcon,
  Loader2
} from 'lucide-react';

export const CustomerCRM: React.FC = () => {
  const {
    customers,
    addCustomer,
    receiveCreditPayment,
    invoices,
    invoiceTemplates,
    batchAssignInvoiceTemplate,
    updateCustomerSegment,
    isDataLoading,
    activeStore
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'vip' | 'b2b' | 'credit' | 'loyalty'>('all');
  const [selectedCustId, setSelectedCustId] = useState<string | null>(customers[0]?.id || null);
  const selectedCust = customers.find(c => c.id === selectedCustId) || customers[0] || null;
  const setSelectedCust = (cust: CustomerProfile | null) => setSelectedCustId(cust ? cust.id : null);

  // Multi-selection state for Batch Operations
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [targetTemplateId, setTargetTemplateId] = useState<string>('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPayCreditOpen, setIsPayCreditOpen] = useState(false);
  const [creditPayAmount, setCreditPayAmount] = useState<number>(500);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [segment, setSegment] = useState<'VIP / Corporate' | 'Wholesale Buyers' | 'Regular Retail' | 'B2B Clients'>('Regular Retail');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter customers by search + tier preset
  const filteredCustomers = customers.filter(c => {
    const matchesQuery =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.segment && c.segment.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesQuery) return false;

    if (tierFilter === 'vip') return c.totalPurchases >= 25000 || c.segment === 'VIP / Corporate';
    if (tierFilter === 'b2b') return c.segment === 'B2B Clients' || c.segment === 'Wholesale Buyers';
    if (tierFilter === 'credit') return c.creditBalance > 0;
    if (tierFilter === 'loyalty') return c.loyaltyPoints >= 300;

    return true;
  });

  // Toggle single checkbox
  const toggleSelectCustomer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCustomerIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Select all visible
  const handleSelectAllFiltered = () => {
    const filteredIds = filteredCustomers.map(c => c.id);
    const allSelected = filteredIds.every(id => selectedCustomerIds.includes(id));
    if (allSelected) {
      setSelectedCustomerIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedCustomerIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const validateCustomer = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = 'Enter customer name.';
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (!phone.trim()) {
      errs.phone = 'Enter customer phone number.';
    } else if (cleanPhone.length < 10) {
      errs.phone = 'Enter a valid 10-digit mobile number.';
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Enter a valid email address.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCustomer()) return;
    const defaultTpl = invoiceTemplates.find(t => t.targetSegment === segment) || invoiceTemplates[0];
    const created = addCustomer({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      creditBalance: 0,
      loyaltyPoints: 100,
      phoneVerified: true,
      savedAddresses: address ? [address] : [],
      segment,
      assignedTemplateId: defaultTpl?.id
    });
    setSelectedCust(created);
    setIsAddModalOpen(false);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setErrors({});
  };

  const handleCreditPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCust || creditPayAmount <= 0) return;
    receiveCreditPayment(selectedCust.id, creditPayAmount);
    setIsPayCreditOpen(false);
  };

  const handleExecuteBatchAssign = () => {
    if (!targetTemplateId || selectedCustomerIds.length === 0) return;
    batchAssignInvoiceTemplate(selectedCustomerIds, targetTemplateId);
    setIsBatchModalOpen(false);
    setSelectedCustomerIds([]);
  };

  // Smart Auto-Group & Batch Assignment by Purchase History Tier
  const handleAutoGroupSmartAssign = () => {
    let vipCount = 0;
    let b2bCount = 0;
    let retailCount = 0;

    const vipTpl = invoiceTemplates.find(t => t.targetSegment === 'VIP / Corporate') || invoiceTemplates[0];
    const b2bTpl = invoiceTemplates.find(t => t.targetSegment === 'B2B Clients' || t.targetSegment === 'Wholesale Buyers') || invoiceTemplates[0];
    const retailTpl = invoiceTemplates.find(t => t.targetSegment === 'Regular Retail') || invoiceTemplates[0];

    const vipIds: string[] = [];
    const b2bIds: string[] = [];
    const retailIds: string[] = [];

    customers.forEach(cust => {
      if (cust.totalPurchases >= 25000 || cust.segment === 'VIP / Corporate') {
        vipIds.push(cust.id);
        vipCount++;
      } else if (cust.segment === 'B2B Clients' || cust.segment === 'Wholesale Buyers' || cust.creditBalance > 5000) {
        b2bIds.push(cust.id);
        b2bCount++;
      } else {
        retailIds.push(cust.id);
        retailCount++;
      }
    });

    if (vipIds.length > 0 && vipTpl) batchAssignInvoiceTemplate(vipIds, vipTpl.id);
    if (b2bIds.length > 0 && b2bTpl) batchAssignInvoiceTemplate(b2bIds, b2bTpl.id);
    if (retailIds.length > 0 && retailTpl) batchAssignInvoiceTemplate(retailIds, retailTpl.id);

    setSelectedCustomerIds([]);
  };

  const selectedCustInvoices = selectedCust
    ? invoices.filter(inv => inv.customerPhone === selectedCust.phone)
    : [];

  const getTemplateById = (tplId?: string): InvoiceTemplate | undefined => {
    return invoiceTemplates.find(t => t.id === tplId);
  };

  if (isDataLoading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading CRM Profiles">
        {/* Active Store Loading Banner */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <StoreIcon className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="font-extrabold text-white flex items-center gap-2 truncate">
                <span className="truncate">{activeStore?.name || 'Active Store'}</span>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  CRM Active Store
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate">Loading customer accounts, Khata ledgers and loyalty balances...</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono font-semibold shrink-0">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="hidden sm:inline">Loading customers...</span>
          </div>
        </div>

        {/* Skeleton content */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-6 items-start">
          <div className="xl:col-span-5 space-y-3">
            <Skeleton className="h-11 w-full rounded-xl" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          </div>
          <div className="xl:col-span-7">
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Module Header & High-Level Actions */}
      <div className="p-5 rounded-xl bg-[#121826] border border-slate-800 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2 flex-wrap">
            <Users className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Customer CRM & Batch Template Assignment</span>
            <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold tabular-nums">
              {customers.length} Profiles
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Segment customer groups based on purchase tier and batch assign custom invoice branding templates.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <button
            onClick={handleAutoGroupSmartAssign}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
            title="Automatically group customers by purchase volume tier and assign matching invoice designs"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Smart Auto-Assign All</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Customer Profile</span>
          </button>
        </div>
      </div>

      {/* Quick Tier Preset Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none tabular-nums">
        <span className="text-[11px] font-bold text-slate-500 shrink-0 uppercase tracking-wider flex items-center gap-1">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Tier Filter:</span>
        </span>
        {[
          { id: 'all', label: 'All Profiles', count: customers.length },
          { id: 'vip', label: 'VIP / High Spenders (> ₹25k)', count: customers.filter(c => c.totalPurchases >= 25000 || c.segment === 'VIP / Corporate').length },
          { id: 'b2b', label: 'B2B & Wholesale', count: customers.filter(c => c.segment === 'B2B Clients' || c.segment === 'Wholesale Buyers').length },
          { id: 'credit', label: 'Outstanding Credit', count: customers.filter(c => c.creditBalance > 0).length },
          { id: 'loyalty', label: 'High Loyalty (> 300 Pts)', count: customers.filter(c => c.loyaltyPoints >= 300).length }
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setTierFilter(filter.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
              tierFilter === filter.id
                ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/20'
                : 'bg-[#121826] text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>{filter.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
              tierFilter === filter.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Floating / Sticky Batch Action Bar when items selected */}
      {selectedCustomerIds.length > 0 && (
        <div className="p-4 rounded-xl glass-panel relative shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200 overflow-hidden">
          {/* Subtle brand refraction backdrop */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-600/15 via-teal-600/10 to-emerald-600/15 pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-extrabold text-sm tabular-nums">
              {selectedCustomerIds.length}
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Batch Selection Active</span>
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-extrabold uppercase tabular-nums">
                  {selectedCustomerIds.length} Customer(s)
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Choose a custom invoice design template to apply to all selected customer profiles.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto sm:justify-end">
            <button
              onClick={() => {
                setTargetTemplateId(invoiceTemplates[0]?.id || '');
                setIsBatchModalOpen(true);
              }}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all active:scale-95"
            >
              <Palette className="w-4 h-4" />
              <span>Assign Invoice Template</span>
            </button>

            <button
              onClick={() => setSelectedCustomerIds([])}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Directory + Details Ledger */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-6">
        
        {/* Left Column: Customer Directory with Checkboxes */}
        <div className="xl:col-span-5 p-4 rounded-xl bg-[#121826] border border-slate-800 shadow-lg space-y-3">
          
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search name, phone, tier..."
                className="w-full bg-[#0A0E1A] border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={handleSelectAllFiltered}
              className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 shrink-0 flex items-center gap-1"
              title="Select all visible filtered profiles"
            >
              {filteredCustomers.length > 0 && filteredCustomers.every(c => selectedCustomerIds.includes(c.id)) ? (
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>Select All</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredCustomers.length === 0 ? (
              <div className="py-12 px-4 text-center text-xs text-slate-400 space-y-2.5 bg-[#0A0E1A]/60 rounded-xl border border-slate-800">
                <Users className="w-9 h-9 text-slate-600 mx-auto" />
                <div className="font-bold text-white text-sm">
                  {searchQuery ? 'No matching customers found' : 'No customers added yet'}
                </div>
                <p className="text-slate-400 max-w-xs mx-auto">
                  {searchQuery
                    ? 'Try searching with a different name, phone number, or segment.'
                    : 'Customer profiles are automatically saved when generating bills at the POS, or you can track customer Khata (Store Credit) balances.'}
                </p>
              </div>
            ) : (
              filteredCustomers.map(cust => {
                const isSelected = selectedCustomerIds.includes(cust.id);
                const isActive = selectedCust?.id === cust.id;
                const assignedTpl = getTemplateById(cust.assignedTemplateId);

                return (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCust(cust)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 tabular-nums ${
                      isActive
                        ? 'bg-[#161D2C] border-emerald-500 ring-1 ring-emerald-500/30 shadow-md'
                        : 'bg-[#0A0E1A]/70 border-slate-800 hover:bg-[#161D2C]/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Checkbox for batch */}
                      <button
                        type="button"
                        onClick={e => toggleSelectCustomer(cust.id, e)}
                        className="p-1 rounded text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                          <span className="truncate">{cust.name}</span>
                          {cust.phoneVerified && (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" title="Phone Verified" />
                          )}
                        </div>

                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{cust.phone}</span>
                          <span className="text-slate-600">•</span>
                          <span className="px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-300 font-semibold border border-slate-700/80">
                            {cust.segment || 'Regular Retail'}
                          </span>
                        </div>

                        {/* Assigned Template Tag */}
                        <div className="mt-1 flex items-center gap-1 text-[10px]">
                          <Palette className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="text-slate-400 font-medium truncate">
                            {assignedTpl ? assignedTpl.name : 'Default Template'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`text-xs font-black ${cust.creditBalance > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                        ₹{cust.creditBalance} Credit
                      </div>
                      <div className="text-[10px] text-emerald-400 font-semibold">
                        ₹{cust.totalPurchases.toLocaleString()} Spent
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Customer Profile & Template Customizer */}
        <div className="xl:col-span-7 p-5 rounded-xl bg-[#121826] border border-slate-800 shadow-lg space-y-5 tabular-nums">
          {selectedCust ? (
            <>
              {/* Profile Top Summary */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-4 flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white">{selectedCust.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      {selectedCust.segment || 'VERIFIED CUSTOMER'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      {selectedCust.phone}
                    </span>
                    {selectedCust.email && <span>{selectedCust.email}</span>}
                  </div>
                </div>

                {selectedCust.creditBalance > 0 && (
                  <button
                    onClick={() => {
                      setCreditPayAmount(selectedCust.creditBalance);
                      setIsPayCreditOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Clear Credit Payment</span>
                  </button>
                )}
              </div>

              {/* Individual Invoice Template Assignment Control */}
              <div className="p-4 rounded-xl bg-[#0A0E1A] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Assigned Invoice Design Template
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Auto-used in Billing POS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Customer Segment Category
                    </label>
                    <select
                      value={selectedCust.segment || 'Regular Retail'}
                      onChange={e => updateCustomerSegment(selectedCust.id, e.target.value)}
                      className="w-full bg-[#121826] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    >
                      <option value="VIP / Corporate">VIP / Corporate</option>
                      <option value="Wholesale Buyers">Wholesale Buyers</option>
                      <option value="Regular Retail">Regular Retail</option>
                      <option value="B2B Clients">B2B Clients</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Target Invoice Template
                    </label>
                    <select
                      value={selectedCust.assignedTemplateId || ''}
                      onChange={e => batchAssignInvoiceTemplate([selectedCust.id], e.target.value)}
                      className="w-full bg-[#121826] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    >
                      {invoiceTemplates.map(tpl => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.name} ({tpl.targetSegment})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Show Preview of currently assigned template */}
                {(() => {
                  const tpl = getTemplateById(selectedCust.assignedTemplateId) || invoiceTemplates[0];
                  if (!tpl) return null;
                  return (
                    <div className="p-3 rounded-lg bg-[#121826] border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full inline-block border border-slate-600"
                          style={{ backgroundColor: tpl.branding.primaryColor }}
                        />
                        <span className="font-bold text-slate-200">{tpl.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono uppercase">({tpl.paperSize})</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        Header: {tpl.branding.storeDisplayName || 'Default'}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-[#0A0E1A]/80 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Outstanding Credit</span>
                  <span className={`text-base font-black ${selectedCust.creditBalance > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                    ₹{selectedCust.creditBalance}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#0A0E1A]/80 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Loyalty Points</span>
                  <span className="text-base font-black text-emerald-400">
                    {selectedCust.loyaltyPoints} Pts
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#0A0E1A]/80 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Lifetime Spent</span>
                  <span className="text-base font-black text-white">
                    ₹{selectedCust.totalPurchases.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Purchase History Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Purchase History Ledger</span>
                </h4>

                {selectedCustInvoices.length === 0 ? (
                  <div className="text-xs text-slate-500 py-6 text-center bg-[#0A0E1A]/80 rounded-xl border border-slate-800">
                    No transactions logged for this customer.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedCustInvoices.map(inv => (
                      <div
                        key={inv.id}
                        className="p-3 rounded-xl bg-[#0A0E1A]/80 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-white font-mono">{inv.invoiceNumber}</div>
                          <div className="text-[10px] text-slate-400">{inv.date} • {inv.items.length} Items</div>
                        </div>

                        <div className="text-right">
                          <div className="font-black text-emerald-400">₹{inv.grandTotal}</div>
                          <div className="text-[10px] text-slate-400 uppercase">{inv.paymentMethod}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-20 px-6 text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Customer & Khata (Store Credit) Details</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Select any customer from the directory to review their purchase history, Khata outstanding balance, and assigned invoice template.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Batch Invoice Template Assignment Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A0E1A]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#161D2C] border border-slate-700/80 text-slate-100 rounded-2xl w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#121826] shrink-0">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Batch Assign Invoice Template</h3>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span>Assigning Template to {selectedCustomerIds.length} Selected Profile(s)</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  All future billing invoices issued for these selected customers will default to this customized design.
                </p>
              </div>

              {/* List selected customer badges */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  Selected Customer Profiles ({selectedCustomerIds.length}):
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-[#0A0E1A] rounded-xl border border-slate-800">
                  {selectedCustomerIds.map(id => {
                    const cust = customers.find(c => c.id === id);
                    return (
                      <span
                        key={id}
                        className="px-2 py-1 rounded-lg bg-slate-800 text-slate-200 text-[10px] font-bold border border-slate-700 flex items-center gap-1"
                      >
                        <span>{cust?.name || id}</span>
                        <span className="text-[9px] text-slate-400">({cust?.segment || 'Retail'})</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Template Selection */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  Choose Invoice Design Template:
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {invoiceTemplates.map(tpl => {
                    const isChoice = targetTemplateId === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => setTargetTemplateId(tpl.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isChoice
                            ? 'bg-[#121826] border-emerald-500 ring-1 ring-emerald-500/40'
                            : 'bg-[#0A0E1A]/80 border-slate-800 hover:bg-[#121826]/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-4 h-4 rounded-full border border-slate-600 shrink-0"
                            style={{ backgroundColor: tpl.branding.primaryColor }}
                          />
                          <div>
                            <div className="font-bold text-white text-xs">{tpl.name}</div>
                            <div className="text-[10px] text-slate-400">
                              Segment: <span className="text-emerald-400 font-medium">{tpl.targetSegment}</span> • Format: {tpl.paperSize.toUpperCase()}
                            </div>
                          </div>
                        </div>

                        {isChoice && (
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-[#121826] flex items-center justify-end gap-2 shrink-0">
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteBatchAssign}
                disabled={!targetTemplateId}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Batch Assignment</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* New Customer Profile Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A0E1A]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#161D2C] border border-slate-700/80 text-slate-100 rounded-2xl w-full max-w-md max-h-[88vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#121826] shrink-0">
              <h3 className="text-base font-bold text-white">New Customer Profile</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-5 sm:p-6 space-y-3 text-xs overflow-y-auto flex-1">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    if (errors.name) setErrors(prev => { const n = { ...prev }; delete n.name; return n; });
                  }}
                  placeholder="e.g. Rahul Deshmukh"
                  className={`w-full bg-[#0A0E1A] border rounded-lg p-2.5 text-white transition-colors ${
                    errors.name
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20'
                      : 'border-slate-700/80 focus:border-emerald-500'
                  }`}
                />
                {errors.name && (
                  <p className="text-[10px] text-rose-400 mt-1 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Phone Number (+91) *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors(prev => { const n = { ...prev }; delete n.phone; return n; });
                  }}
                  placeholder="+91 98211 22334"
                  className={`w-full bg-[#0A0E1A] border rounded-lg p-2.5 text-white transition-colors ${
                    errors.phone
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20'
                      : 'border-slate-700/80 focus:border-emerald-500'
                  }`}
                />
                {errors.phone && (
                  <p className="text-[10px] text-rose-400 mt-1 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.phone}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Customer Segment Tier</label>
                <select
                  value={segment}
                  onChange={e => setSegment(e.target.value as any)}
                  className="w-full bg-[#0A0E1A] border border-slate-700/80 rounded-lg p-2.5 text-white"
                >
                  <option value="Regular Retail">Regular Retail</option>
                  <option value="VIP / Corporate">VIP / Corporate</option>
                  <option value="Wholesale Buyers">Wholesale Buyers</option>
                  <option value="B2B Clients">B2B Clients</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => { const n = { ...prev }; delete n.email; return n; });
                  }}
                  placeholder="e.g. rahul@example.com"
                  className={`w-full bg-[#0A0E1A] border rounded-lg p-2.5 text-white transition-colors ${
                    errors.email
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20'
                      : 'border-slate-700/80 focus:border-emerald-500'
                  }`}
                />
                {errors.email && (
                  <p className="text-[10px] text-rose-400 mt-1 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Primary Address</label>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full bg-[#0A0E1A] border border-slate-700/80 rounded-lg p-2.5 text-white h-16"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors active:scale-[0.99]"
              >
                Create Profile & Issue Welcome Points
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Pay Credit Modal */}
      {isPayCreditOpen && selectedCust && (
        <div className="fixed inset-0 z-50 bg-[#0A0E1A]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#161D2C] border border-slate-700/80 text-slate-100 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#121826]">
              <h3 className="text-sm font-bold text-white">Receive Credit Payment</h3>
              <button onClick={() => setIsPayCreditOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreditPaymentSubmit} className="p-5 sm:p-6 space-y-4 text-xs tabular-nums">
              <div>
                <span className="text-slate-400">Current Credit Outstanding:</span>
                <div className="text-lg font-black text-amber-400">₹{selectedCust.creditBalance}</div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Amount Received ₹</label>
                <input
                  type="number"
                  required
                  value={creditPayAmount}
                  onChange={e => setCreditPayAmount(Number(e.target.value))}
                  className="w-full bg-[#0A0E1A] border border-slate-700/80 rounded-lg p-2.5 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors active:scale-[0.99]"
              >
                Confirm Receipt & Update Credit Ledger
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
