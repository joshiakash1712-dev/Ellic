import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { RestockOrder, RetailerWholesalerConnection } from '../../types';
import { SupplierPerformanceDashboard } from './SupplierPerformanceDashboard';
import { StockStatusBadge } from '../common/StockStatusBadge';
import {
  Truck,
  Building2,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Send,
  Zap,
  Lock,
  Eye,
  FileText,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  BarChart2,
  Activity
} from 'lucide-react';

export const WholesalerPortal: React.FC = () => {
  const {
    wholesalers,
    wholesalerProducts,
    connections,
    toggleConnectionStatus,
    restockOrders,
    updateRestockOrder,
    updateWholesalerProductStock,
    products
  } = useStore();

  const [activeTab, setActiveTab] = useState<'quotations' | 'performance' | 'products' | 'retailers'>('quotations');
  const activeWholesaler = wholesalers[0];

  // Quotation Edit Form State
  const [editingOrder, setEditingOrder] = useState<RestockOrder | null>(null);
  const [quotedUnitPrice, setQuotedUnitPrice] = useState<number>(390);
  const [quotedQty, setQuotedQty] = useState<number>(20);
  const [deliveryDate, setDeliveryDate] = useState<string>('2026-08-08');

  const sharedRetailerProducts = products.filter(p => p.sharedWithWholesalers === true);

  const pendingRestockRequests = activeWholesaler
    ? restockOrders.filter(ro => ro.wholesalerId === activeWholesaler.id && ro.status === 'suggested')
    : restockOrders.filter(ro => ro.status === 'suggested');

  const activeQuotations = activeWholesaler
    ? restockOrders.filter(ro => ro.wholesalerId === activeWholesaler.id && ro.status !== 'suggested')
    : restockOrders.filter(ro => ro.status !== 'suggested');

  const handleSendQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    updateRestockOrder(editingOrder.id, 'quotation_sent', {
      quotedQty,
      quotedUnitPrice,
      totalQuotedAmount: quotedQty * quotedUnitPrice,
      deliveryDate
    });

    setEditingOrder(null);
  };

  const handleMarkDispatched = (orderId: string) => {
    updateRestockOrder(orderId, 'dispatched', {
      trackingNumber: `LOGX-${Math.floor(100000 + Math.random() * 900000)}`
    });
  };

  const handleMarkDelivered = (orderId: string) => {
    updateRestockOrder(orderId, 'delivered');
  };

  return (
    <div className="space-y-6">
      
      {/* Wholesaler Header Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
              Wholesaler B2B Portal
            </span>
            <span className="text-xs text-slate-400">GSTIN: {activeWholesaler?.gstin || '27AAACM1234F1Z2'}</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {activeWholesaler?.name || 'Wholesale Partner Portal'}
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Connected to <strong>{connections.filter(c => c.status === 'connected').length} Retailers</strong>. Real-time auto-restock triggers & quotation pipeline active.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Pending Requests</span>
            <span className="text-lg font-black text-amber-400">{pendingRestockRequests.length} Pending</span>
          </div>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 gap-2 flex-wrap sm:flex-nowrap">
        <button
          onClick={() => setActiveTab('quotations')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'quotations'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Restock Orders ({restockOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'performance'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-300" />
          <span>Supplier Performance SLA</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'products'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Bulk Product Catalog ({wholesalerProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('retailers')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'retailers'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Connected Retailers ({connections.length})</span>
        </button>
      </div>

      {/* Tab 2: Supplier Performance SLA Dashboard */}
      {activeTab === 'performance' && (
        <SupplierPerformanceDashboard />
      )}

      {/* Tab 1: Restock Suggestions & Quotation Pipeline */}
      {activeTab === 'quotations' && (
        <div className="space-y-6">
          
          {/* Pending Restock Suggestions Section */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>Auto-Restock Suggestions from Retailers</span>
              </span>
              <span className="text-xs text-slate-400">{pendingRestockRequests.length} Suggestions</span>
            </h3>

            {pendingRestockRequests.length === 0 ? (
              <div className="text-xs text-slate-500 py-8 text-center bg-slate-950/50 rounded-xl border border-slate-800">
                No pending stock threshold alerts from retailers. All store inventories are optimal.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRestockRequests.map(req => (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl bg-slate-800/80 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{req.productName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                          AUTO SUGGESTION
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 mt-1">
                        Retail Outlet: <strong>{req.retailerName}</strong> | Suggested Qty: <strong>{req.suggestedQty} Units</strong>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{req.notes}</div>
                    </div>

                    <button
                      onClick={() => {
                        setEditingOrder(req);
                        setQuotedQty(req.suggestedQty);
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Prepare Wholesale Quote</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Quotations & Dispatch Tracking Table */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>Purchase Orders & Delivery Dispatch Pipeline</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">PO Reference</th>
                    <th className="pb-3">Retailer Store</th>
                    <th className="pb-3">Item & Quantity</th>
                    <th className="pb-3">Total Amount</th>
                    <th className="pb-3">Status Stage</th>
                    <th className="pb-3 text-right">Dispatch Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {activeQuotations.map(ro => (
                    <tr key={ro.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 font-mono font-bold text-emerald-400">{ro.id}</td>
                      <td className="py-3 font-semibold text-white">{ro.retailerName}</td>
                      <td className="py-3">
                        <div className="font-bold text-slate-200">{ro.productName}</div>
                        <div className="text-[10px] text-slate-400">{ro.quotedQty || ro.suggestedQty} Units @ ₹{ro.quotedUnitPrice || 390}/unit</div>
                      </td>
                      <td className="py-3 font-black text-white">₹{ro.totalQuotedAmount || 7800}</td>
                      <td className="py-3">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase border ${
                          ro.status === 'delivered'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : ro.status === 'dispatched'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          {ro.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {ro.status === 'po_created' || ro.status === 'quotation_sent' ? (
                          <button
                            onClick={() => handleMarkDispatched(ro.id)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-md transition-colors"
                          >
                            Mark Dispatched
                          </button>
                        ) : ro.status === 'dispatched' ? (
                          <button
                            onClick={() => handleMarkDelivered(ro.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-md transition-colors"
                          >
                            Mark Delivered
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-bold flex items-center justify-end gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Bulk Product Catalog */}
      {activeTab === 'products' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center justify-between">
            <span>Wholesale Bulk Product Catalog & Tier Prices</span>
            <span className="text-xs text-slate-400">{wholesalerProducts.length} Items</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {wholesalerProducts.map(item => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3"
              >
                <div className="h-28 w-full rounded-xl overflow-hidden bg-slate-900">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=300'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h4 className="text-xs font-extrabold text-white">{item.name}</h4>
                  <div className="text-[10px] text-slate-400">{item.brand} • MOQ: {item.moq} {item.unit}</div>
                </div>

                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Wholesale Rate</span>
                    <span className="font-extrabold text-emerald-400">₹{item.wholesalePrice} / {item.unit}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Stock Available</span>
                    <span className="font-bold text-white tabular-nums">{item.stockAvailable} {item.unit}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[10px] text-slate-400 font-semibold">Adjust Bulk Stock</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateWholesalerProductStock(item.id, Math.max(0, item.stockAvailable - 10))}
                      disabled={item.stockAvailable <= 0}
                      className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 text-[11px] font-bold transition-colors"
                    >
                      -10
                    </button>
                    <button
                      type="button"
                      onClick={() => updateWholesalerProductStock(item.id, item.stockAvailable + 10)}
                      className="px-2 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-colors"
                    >
                      +10
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Connected Retailers & Access Permissions */}
      {activeTab === 'retailers' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Connected Retail Outlets & Data Sharing</h3>
              <p className="text-xs text-slate-400">
                Wholesalers only see inventory items retailers explicitly choose to share.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {connections.map(conn => (
              <div
                key={conn.id}
                className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">{conn.retailerName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase border ${
                      conn.status === 'connected'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {conn.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <Lock className="w-3 h-3 text-slate-500" />
                    <span>
                      Shared Product Visibility: <strong>{conn.sharedProductIds.length} Items Shared</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {conn.status === 'pending' && (
                    <button
                      onClick={() => toggleConnectionStatus(conn.id, 'connected')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                    >
                      Approve Connection
                    </button>
                  )}
                  {conn.status === 'connected' && (
                    <button
                      onClick={() => toggleConnectionStatus(conn.id, 'revoked')}
                      className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-rose-600 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                    >
                      Revoke Connection
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Shared Retailer Stock Levels
              </h4>
              <span className="text-[11px] text-slate-400">
                {sharedRetailerProducts.length} Shared SKUs
              </span>
            </div>

            {sharedRetailerProducts.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 text-center">
                No retailer products are currently marked as shared with wholesalers.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sharedRetailerProducts.map(prod => (
                  <div
                    key={prod.id}
                    className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/80 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{prod.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {prod.brand} · Min Threshold: {prod.minThreshold} {prod.unit}
                      </div>
                    </div>
                    <StockStatusBadge stock={prod.stock} unit={prod.unit} showQuantity size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prepare Quotation Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Prepare Wholesale Quotation</h3>
              <button onClick={() => setEditingOrder(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendQuotation} className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                <span className="text-slate-400 block">Retail Store:</span>
                <span className="font-bold text-white block">{editingOrder.retailerName}</span>
                <span className="text-slate-400 block mt-1">Item:</span>
                <span className="font-bold text-emerald-400 block">{editingOrder.productName}</span>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Quoted Quantity (Units)</label>
                <input
                  type="number"
                  required
                  value={quotedQty}
                  onChange={e => setQuotedQty(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Quoted Unit Price ₹</label>
                <input
                  type="number"
                  required
                  value={quotedUnitPrice}
                  onChange={e => setQuotedUnitPrice(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Estimated Delivery Date</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 text-[10px] block">Total Quote Amount</span>
                  <span className="text-base font-black text-emerald-400">₹{quotedQty * quotedUnitPrice}</span>
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg"
                >
                  Send Quote to Retailer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
