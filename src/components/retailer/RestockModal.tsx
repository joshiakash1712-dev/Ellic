import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { Product, normalizeCanonicalRole } from '../../types';
import {
  PackagePlus,
  Truck,
  X,
  CheckCircle2,
  AlertTriangle,
  Building,
  Layers,
  ArrowRight,
  ShieldCheck,
  Plus,
  Phone,
  Mail,
  MapPin,
  FileText,
  User
} from 'lucide-react';

interface RestockModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

export const RestockModal: React.FC<RestockModalProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { suppliers, activeStore, addRestockLog, currentUser, activeRole, addSupplier } = useStore();
  const { userProfile, currentUser: authUser } = useAuth();

  const isCrew =
    normalizeCanonicalRole(activeRole) === 'crew' ||
    normalizeCanonicalRole(userProfile?.role) === 'crew' ||
    normalizeCanonicalRole(currentUser?.role) === 'crew';

  // Current store suppliers only
  const storeSuppliers = suppliers.filter(
    s => !s.storeId || s.storeId === activeStore.id
  );

  const [quantityToAdd, setQuantityToAdd] = useState<number>(10);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Quick Add Supplier state
  const [isQuickAddSupplierOpen, setIsQuickAddSupplierOpen] = useState<boolean>(false);
  const [quickSupplierForm, setQuickSupplierForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    gstin: '',
    address: ''
  });
  const [quickSupplierErrors, setQuickSupplierErrors] = useState<Record<string, string>>({});
  const [quickSupplierSuccess, setQuickSupplierSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && product) {
      setQuantityToAdd(Math.max(1, product.minThreshold || 10));
      setSelectedSupplierId(storeSuppliers[0]?.id || 'direct-procurement');
      setNotes('');
      setErrorMsg(null);
      setIsSubmitting(false);
      setIsQuickAddSupplierOpen(false);
      setQuickSupplierSuccess(null);
    }
  }, [isOpen, product?.id]);

  if (!isOpen || !product) return null;

  const validateQuickSupplier = (): boolean => {
    const errs: Record<string, string> = {};
    if (!quickSupplierForm.name.trim()) {
      errs.name = 'Supplier name is required.';
    }
    const cleanPhone = quickSupplierForm.phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errs.phone = 'Enter a valid 10-digit phone number.';
    }
    if (quickSupplierForm.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(quickSupplierForm.email.trim())) {
      errs.email = 'Enter a valid email address.';
    }
    if (quickSupplierForm.gstin.trim() && quickSupplierForm.gstin.trim().length !== 15) {
      errs.gstin = 'GSTIN must be exactly 15 alphanumeric characters.';
    }
    setQuickSupplierErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCrew) return;

    if (!validateQuickSupplier()) return;

    const newSupplier = addSupplier({
      storeId: activeStore.id,
      name: quickSupplierForm.name.trim(),
      contactPerson: quickSupplierForm.contactPerson.trim(),
      phone: quickSupplierForm.phone.trim(),
      email: quickSupplierForm.email.trim(),
      gstin: quickSupplierForm.gstin.trim().toUpperCase(),
      address: quickSupplierForm.address.trim(),
      categories: [product.category || 'General'],
      paymentTerms: 'Net 30'
    });

    // Auto-select the newly created supplier
    setSelectedSupplierId(newSupplier.id);
    setQuickSupplierSuccess(`Created and selected "${newSupplier.name}".`);
    setIsQuickAddSupplierOpen(false);
    // Reset quick form
    setQuickSupplierForm({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      gstin: '',
      address: ''
    });
    setQuickSupplierErrors({});
    setTimeout(() => setQuickSupplierSuccess(null), 4000);
  };

  const handleConfirmRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const qty = Number(quantityToAdd);
    if (!qty || qty <= 0) {
      setErrorMsg('Please enter a valid restocking quantity greater than 0.');
      return;
    }

    const supplier = storeSuppliers.find(s => s.id === selectedSupplierId);
    const supplierId = supplier ? supplier.id : 'direct-procurement';
    const supplierName = supplier ? supplier.name : 'Direct Store Intake';

    setIsSubmitting(true);

    try {
      // 1. Current stock
      const previousStock = Number(product.stock) || 0;
      const newStock = previousStock + qty;

      // 2. Authenticated user recording
      const actorName = userProfile?.name || currentUser?.name || authUser?.displayName || 'Crew Member';
      const actorId = authUser?.uid || currentUser?.id || 'staff';

      // 3. Atomically record restock log and update product stock via WebSocket & Firestore
      addRestockLog({
        storeId: activeStore.id,
        productId: product.id,
        productName: product.name,
        quantityAdded: qty,
        previousStock,
        newStock,
        addedBy: actorName,
        addedById: actorId,
        supplierId,
        supplierName,
        notes: notes.trim() || `Restocked ${qty} units via ${supplierName}`
      });

      const successText = `Successfully restocked ${qty} ${product.unit} of ${product.name}. New stock: ${newStock}`;
      if (onSuccess) onSuccess(successText);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to complete restocking.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0E1A]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#161D2C] border border-slate-700/80 rounded-2xl w-full max-w-md max-h-[88vh] flex flex-col overflow-hidden shadow-2xl animate-scaleUp relative">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-[#121826] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Restock Product Inventory</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Snapshot */}
        <div className="p-4 bg-[#121826]/80 border-b border-slate-800/80 space-y-2 text-xs shrink-0 tabular-nums">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-bold text-white text-sm">{product.name}</div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                {product.category} • <span className="text-slate-300 font-mono">{product.barcode}</span>
              </div>
            </div>
            <span className="text-emerald-400 font-mono font-bold text-sm">
              ₹{product.sellingPrice}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60">
            <div className="p-2 rounded-lg bg-[#0A0E1A] border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Current Stock</span>
              <span className="text-sm font-black text-amber-400">
                {product.stock} {product.unit}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-[#0A0E1A] border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Min Threshold</span>
              <span className="text-sm font-black text-slate-300">
                {product.minThreshold} {product.unit}
              </span>
            </div>
          </div>
        </div>

        {/* Restock Form */}
        <form onSubmit={handleConfirmRestock} className="p-5 space-y-4 text-xs overflow-y-auto">
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">
              Quantity to Add ({product.unit}) <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={quantityToAdd}
              onChange={e => {
                setQuantityToAdd(Number(e.target.value));
                if (errorMsg) setErrorMsg(null);
              }}
              className={`w-full bg-[#0A0E1A] border rounded-lg p-2.5 text-white font-mono text-sm font-bold focus:outline-none transition-colors ${
                errorMsg
                  ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20'
                  : 'border-slate-700 focus:border-emerald-500'
              }`}
            />
            {errorMsg && (
              <p className="text-[11px] text-rose-400 mt-1 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </p>
            )}
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 tabular-nums">
              <span>Projected Total Stock:</span>
              <span className="text-emerald-400 font-bold font-mono">
                {Number(product.stock) + (Number(quantityToAdd) || 0)} {product.unit}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-semibold block">
                Select Supplier ({activeStore.name})
              </label>
              {!isCrew && (
                <button
                  type="button"
                  id="btn-restock-quick-add-supplier"
                  onClick={() => setIsQuickAddSupplierOpen(true)}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/25 transition-all"
                  title="Register a new supplier for this store"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Supplier</span>
                </button>
              )}
            </div>

            {quickSupplierSuccess && (
              <div className="mb-2 p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-1.5 animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{quickSupplierSuccess}</span>
              </div>
            )}

            {storeSuppliers.length > 0 ? (
              <select
                id="select-restock-supplier"
                value={selectedSupplierId}
                onChange={e => setSelectedSupplierId(e.target.value)}
                className="w-full bg-[#0A0E1A] border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 font-medium"
              >
                {storeSuppliers.map(sup => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name} {sup.contactPerson ? `(${sup.contactPerson})` : ''}
                  </option>
                ))}
                <option value="direct-procurement">Direct Intake / Non-contract Vendor</option>
              </select>
            ) : (
              <div className="p-2.5 rounded-lg bg-[#0A0E1A] border border-slate-800 text-slate-400 text-xs">
                <span>No registered suppliers for this store. Using </span>
                <strong className="text-emerald-400">Direct Store Intake</strong>.
              </div>
            )}
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">Restock Notes / Invoice Ref</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Received PO-8821 in good condition"
              className="w-full bg-[#0A0E1A] border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Restock operator recorded as:{' '}
              <strong className="text-white">
                {userProfile?.name || currentUser?.name || authUser?.displayName || 'Authenticated Staff'}
              </strong>
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 active:scale-[0.98]"
            >
              <PackagePlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : 'Confirm Restock'}</span>
            </button>
          </div>
        </form>

        {/* Quick Add Supplier Nested Sub-Modal */}
        {isQuickAddSupplierOpen && (
          <div className="absolute inset-0 z-20 bg-[#161D2C] backdrop-blur-md flex flex-col justify-between p-5 overflow-y-auto animate-fadeIn">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Add Store Supplier</h4>
                    <p className="text-[10px] text-slate-400">Saving to: {activeStore.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickAddSupplierOpen(false);
                    setQuickSupplierErrors({});
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form id="form-quick-add-supplier" onSubmit={handleCreateSupplier} className="space-y-3 pt-3 text-xs">
                {/* Supplier Name */}
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    Supplier / Vendor Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ABC Distributors Pvt Ltd"
                    value={quickSupplierForm.name}
                    onChange={e => {
                      setQuickSupplierForm({ ...quickSupplierForm, name: e.target.value });
                      if (quickSupplierErrors.name) setQuickSupplierErrors(prev => { const n = { ...prev }; delete n.name; return n; });
                    }}
                    className={`w-full bg-[#0A0E1A] border rounded-lg p-2 text-white text-xs focus:outline-none ${
                      quickSupplierErrors.name ? 'border-rose-500' : 'border-slate-700 focus:border-emerald-500'
                    }`}
                  />
                  {quickSupplierErrors.name && (
                    <span className="text-[10px] text-rose-400 mt-0.5 block">{quickSupplierErrors.name}</span>
                  )}
                </div>

                {/* Phone & Contact Person */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">
                      Phone Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile"
                      value={quickSupplierForm.phone}
                      onChange={e => {
                        setQuickSupplierForm({ ...quickSupplierForm, phone: e.target.value });
                        if (quickSupplierErrors.phone) setQuickSupplierErrors(prev => { const n = { ...prev }; delete n.phone; return n; });
                      }}
                      className={`w-full bg-slate-800 border rounded-lg p-2 text-white text-xs focus:outline-none ${
                        quickSupplierErrors.phone ? 'border-rose-500' : 'border-slate-700 focus:border-emerald-500'
                      }`}
                    />
                    {quickSupplierErrors.phone && (
                      <span className="text-[10px] text-rose-400 mt-0.5 block">{quickSupplierErrors.phone}</span>
                    )}
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Contact Person</label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Sharma"
                      value={quickSupplierForm.contactPerson}
                      onChange={e => setQuickSupplierForm({ ...quickSupplierForm, contactPerson: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Email & GSTIN */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Email (Optional)</label>
                    <input
                      type="email"
                      placeholder="vendor@example.com"
                      value={quickSupplierForm.email}
                      onChange={e => {
                        setQuickSupplierForm({ ...quickSupplierForm, email: e.target.value });
                        if (quickSupplierErrors.email) setQuickSupplierErrors(prev => { const n = { ...prev }; delete n.email; return n; });
                      }}
                      className={`w-full bg-slate-800 border rounded-lg p-2 text-white text-xs focus:outline-none ${
                        quickSupplierErrors.email ? 'border-rose-500' : 'border-slate-700 focus:border-emerald-500'
                      }`}
                    />
                    {quickSupplierErrors.email && (
                      <span className="text-[10px] text-rose-400 mt-0.5 block">{quickSupplierErrors.email}</span>
                    )}
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">GSTIN (Optional)</label>
                    <input
                      type="text"
                      maxLength={15}
                      placeholder="15-digit GSTIN"
                      value={quickSupplierForm.gstin}
                      onChange={e => {
                        setQuickSupplierForm({ ...quickSupplierForm, gstin: e.target.value.toUpperCase() });
                        if (quickSupplierErrors.gstin) setQuickSupplierErrors(prev => { const n = { ...prev }; delete n.gstin; return n; });
                      }}
                      className={`w-full bg-slate-800 border rounded-lg p-2 text-white text-xs uppercase font-mono focus:outline-none ${
                        quickSupplierErrors.gstin ? 'border-rose-500' : 'border-slate-700 focus:border-emerald-500'
                      }`}
                    />
                    {quickSupplierErrors.gstin && (
                      <span className="text-[10px] text-rose-400 mt-0.5 block">{quickSupplierErrors.gstin}</span>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Address / Warehouse</label>
                  <input
                    type="text"
                    placeholder="e.g. Plot 12, APMC Market, Vashi"
                    value={quickSupplierForm.address}
                    onChange={e => setQuickSupplierForm({ ...quickSupplierForm, address: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </form>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsQuickAddSupplierOpen(false);
                  setQuickSupplierErrors({});
                }}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="form-quick-add-supplier"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shadow-emerald-600/20 text-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save & Select</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

