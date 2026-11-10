import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { Supplier, normalizeCanonicalRole } from '../../types';
import { Skeleton } from '../common/skeletons/SkeletonBase';
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Tag,
  ShieldAlert,
  Info,
  AlertCircle,
  Store as StoreIcon,
  Loader2
} from 'lucide-react';

export const SupplierManager: React.FC = () => {
  const {
    suppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    activeStore,
    activeRole,
    isDataLoading
  } = useStore();
  const { userProfile } = useAuth();

  const isCrew = normalizeCanonicalRole(activeRole) === 'crew' || normalizeCanonicalRole(userProfile?.role) === 'crew';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplierId, setDeletingSupplierId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    categories: 'Groceries, FMCG',
    paymentTerms: 'Net 30'
  });

  const [feedback, setFeedback] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Store-isolated suppliers
  const storeSuppliers = suppliers.filter(
    s => !s.storeId || s.storeId === activeStore.id
  );

  // Derive categories list
  const allCategories = [
    'All',
    ...Array.from(
      new Set(
        storeSuppliers.flatMap(s => (Array.isArray(s.categories) ? s.categories : []))
      )
    )
  ];

  const filteredSuppliers = storeSuppliers.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.phone && s.phone.includes(searchQuery)) ||
      (s.gstin && s.gstin.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'All' ||
      (Array.isArray(s.categories) && s.categories.includes(selectedCategory));

    return matchesSearch && matchesCategory;
  });

  const handleOpenAdd = () => {
    if (isCrew) return;
    setEditingSupplier(null);
    setErrors({});
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      gstin: '',
      categories: 'Groceries, Staples',
      paymentTerms: 'Net 30'
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    if (isCrew) return;
    setEditingSupplier(sup);
    setErrors({});
    setFormData({
      name: sup.name,
      contactPerson: sup.contactPerson || '',
      phone: sup.phone || '',
      email: sup.email || '',
      address: sup.address || '',
      gstin: sup.gstin || '',
      categories: Array.isArray(sup.categories) ? sup.categories.join(', ') : '',
      paymentTerms: sup.paymentTerms || 'Net 30'
    });
    setIsAddModalOpen(true);
  };

  const validateSupplier = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) {
      errs.name = 'Enter a supplier name.';
    }
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (formData.phone.trim() && cleanPhone.length < 10) {
      errs.phone = 'Enter a valid 10-digit phone number.';
    }
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Enter a valid email address.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCrew) return;

    if (!validateSupplier()) return;

    const categoriesArray = formData.categories
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, {
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        gstin: formData.gstin.trim(),
        categories: categoriesArray,
        paymentTerms: formData.paymentTerms
      });
      setFeedback(`Supplier "${formData.name}" updated successfully.`);
    } else {
      addSupplier({
        storeId: activeStore.id,
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        gstin: formData.gstin.trim(),
        categories: categoriesArray,
        paymentTerms: formData.paymentTerms
      });
      setFeedback(`Supplier "${formData.name}" added successfully.`);
    }

    setIsAddModalOpen(false);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleDelete = (id: string) => {
    if (isCrew) return;
    deleteSupplier(id);
    setDeletingSupplierId(null);
    setFeedback('Supplier deleted successfully.');
    setTimeout(() => setFeedback(null), 3500);
  };

  if (isDataLoading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading Store Suppliers">
        {/* Active Store Loading Banner */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <StoreIcon className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="font-extrabold text-white flex items-center gap-2 truncate">
                <span className="truncate">{activeStore?.name || 'Active Store'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  Suppliers Active Outlet
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate">Loading authorized vendors, restock terms and contact details...</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono font-semibold shrink-0">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="hidden sm:inline">Loading suppliers...</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-5 rounded-xl bg-[#121826] border border-slate-800 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            <span>Store Suppliers & Vendors</span>
            <span className="text-xs px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold tabular-nums">
              {storeSuppliers.length} Active
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage authorized suppliers, distributor contacts, GSTIN tax records, and restock terms for{' '}
            <strong className="text-white">{activeStore.name}</strong>.
          </p>
        </div>

        {!isCrew ? (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        ) : (
          <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" />
            <span>Read-Only (Crew Access)</span>
          </div>
        )}
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{feedback}</span>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-[#121826] border border-slate-800 shadow-lg flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search suppliers by name, contact person, phone, or GSTIN..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0A0E1A] border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full md:w-auto px-3 py-2 rounded-lg bg-[#0A0E1A] border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-500"
          >
            {allCategories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Suppliers Grid */}
      {filteredSuppliers.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#121826] border border-slate-800 space-y-3">
          <Truck className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-sm font-bold text-white">
            {searchQuery ? 'No suppliers match your search' : 'No suppliers added yet.'}
          </div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? 'No suppliers match your current search query or category filter.'
              : isCrew
              ? 'No suppliers have been added for this store yet. Store Owners can add suppliers to record received restocks.'
              : 'Add a supplier so received stock can be recorded during restocking.'}
          </p>
          {!isCrew && (
            <button
              onClick={handleOpenAdd}
              className="mt-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 inline-flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Supplier</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3.5 sm:gap-4">
          {filteredSuppliers.map(sup => (
            <div
              key={sup.id}
              className="p-4 rounded-xl bg-[#121826] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-md"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      <span>{sup.name}</span>
                    </h3>
                    {sup.contactPerson && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Rep: <span className="text-slate-300 font-medium">{sup.contactPerson}</span>
                      </p>
                    )}
                  </div>
                  {sup.gstin && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-[#0A0E1A] text-emerald-300 border border-slate-700/80">
                      GSTIN: {sup.gstin}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                  {sup.phone && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{sup.phone}</span>
                    </div>
                  )}
                  {sup.email && (
                    <div className="flex items-center gap-2 text-slate-300 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{sup.email}</span>
                    </div>
                  )}
                  {sup.address && (
                    <div className="flex items-center gap-2 text-slate-400 text-[11px] truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{sup.address}</span>
                    </div>
                  )}
                </div>

                {Array.isArray(sup.categories) && sup.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {sup.categories.map((c, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  onClick={() => setViewingSupplier(sup)}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>

                {!isCrew && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(sup)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit Supplier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingSupplierId(sup.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                      title="Delete Supplier"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Supplier Modal */}
      {isAddModalOpen && !isCrew && (
        <div className="fixed inset-0 z-50 bg-[#0A0E1A]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#161D2C] border border-slate-700/80 rounded-2xl w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#121826] shrink-0">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">
                  Supplier / Company Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors(prev => { const n = { ...prev }; delete n.name; return n; });
                  }}
                  placeholder="e.g. Metro Wholesale Pvt Ltd"
                  className={`w-full bg-[#0A0E1A] border rounded-lg p-2.5 text-white focus:outline-none transition-colors ${
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Representative Name</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full bg-[#0A0E1A] border border-slate-700/80 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (errors.phone) setErrors(prev => { const n = { ...prev }; delete n.phone; return n; });
                    }}
                    placeholder="+91 98765 43210"
                    className={`w-full bg-[#0A0E1A] border rounded-lg p-2.5 text-white focus:outline-none transition-colors ${
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors(prev => { const n = { ...prev }; delete n.email; return n; });
                    }}
                    placeholder="orders@supplier.com"
                    className={`w-full bg-[#0A0E1A] border rounded-lg p-2.5 text-white focus:outline-none transition-colors ${
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
                  <label className="text-slate-400 font-semibold block mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    placeholder="27ABCDE1234F1Z5"
                    className="w-full bg-[#0A0E1A] border border-slate-700/80 rounded-lg p-2.5 text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Business Address / Depot</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Plot 42, MIDC Industrial Area, Pune"
                  className="w-full bg-[#0A0E1A] border border-slate-700/80 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Product Categories (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.categories}
                    onChange={e => setFormData({ ...formData, categories: e.target.value })}
                    placeholder="Dairy, Beverages, Snacks"
                    className="w-full bg-[#0A0E1A] border border-slate-700/80 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Payment Terms</label>
                  <select
                    value={formData.paymentTerms}
                    onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="w-full bg-[#0A0E1A] border border-slate-700/80 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Immediate / COD">Immediate / Cash on Delivery</option>
                    <option value="Net 7">Net 7 Days</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Consignment">Consignment Stock</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-[0.98]"
                >
                  {editingSupplier ? 'Save Changes' : 'Create Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSupplierId && !isCrew && (
        <div className="fixed inset-0 z-50 bg-[#0A0E1A]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#161D2C] border border-slate-700/80 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-bold text-white">Delete Supplier?</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to remove this supplier? Historic restock records referencing this vendor will be retained.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingSupplierId(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingSupplierId)}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Supplier Details Modal */}
      {viewingSupplier && (
        <div className="fixed inset-0 z-50 bg-[#0A0E1A]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#161D2C] border border-slate-700/80 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">{viewingSupplier.name}</h3>
              </div>
              <button
                onClick={() => setViewingSupplier(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#0A0E1A] border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">Representative</span>
                  <span className="font-bold text-white">{viewingSupplier.contactPerson || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">GSTIN</span>
                  <span className="font-mono text-emerald-400 font-bold">{viewingSupplier.gstin || 'Not Provided'}</span>
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl bg-[#0A0E1A] border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-mono">Contact Details</div>
                <div className="text-slate-300">Phone: {viewingSupplier.phone || 'N/A'}</div>
                <div className="text-slate-300">Email: {viewingSupplier.email || 'N/A'}</div>
                <div className="text-slate-300">Address: {viewingSupplier.address || 'N/A'}</div>
                <div className="text-slate-300">Terms: {viewingSupplier.paymentTerms || 'Standard'}</div>
              </div>

              {Array.isArray(viewingSupplier.categories) && (
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-mono mb-1">Supplied Categories</span>
                  <div className="flex flex-wrap gap-1">
                    {viewingSupplier.categories.map((c, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewingSupplier(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
