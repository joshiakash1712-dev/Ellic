import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { Product, PaymentMethod, CustomerProfile, POSInvoice, normalizeCanonicalRole } from '../../types';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';
import { InvoiceModal } from '../common/InvoiceModal';
import { POSSkeleton } from '../common/skeletons/POSSkeleton';
import { POSShortcutsModal } from './POSShortcutsModal';
import {
  Scan,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  QrCode,
  DollarSign,
  User,
  Tag,
  CheckCircle,
  Percent,
  Receipt,
  RotateCcw,
  Sparkles,
  Layers,
  Palette,
  MessageSquare,
  Phone,
  ShoppingBag,
  ArrowRight,
  UserPlus,
  Keyboard,
  Zap,
  Lock,
  Building2,
  BookOpen,
  AlertCircle,
  Clock
} from 'lucide-react';
import { StockStatusBadge } from '../common/StockStatusBadge';

export interface BillingPOSProps {
  isLoading?: boolean;
}

export const BillingPOS: React.FC<BillingPOSProps> = ({ isLoading }) => {
  const {
    products,
    customers,
    createInvoice,
    activeStore,
    addCustomer,
    updateCustomer,
    invoiceTemplates,
    isDataLoading,
    activeRole,
    currentUser: storeUser
  } = useStore();

  const { userProfile } = useAuth();
  const isCrew = normalizeCanonicalRole(activeRole) === 'crew' || normalizeCanonicalRole(userProfile?.role) === 'crew';

  const isActuallyLoading = isLoading ?? isDataLoading;

  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cart, setCart] = useState<{ product: Product; quantity: number; discount: number }[]>([]);
  
  // Invoice settings
  const [isGSTInvoice, setIsGSTInvoice] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    const def = invoiceTemplates.find(t => t.isDefault) || invoiceTemplates[0];
    return def?.id || '';
  });
  
  // Split payment state
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitCard, setSplitCard] = useState<number>(0);
  const [splitUpi, setSplitUpi] = useState<number>(0);
  const [splitBank, setSplitBank] = useState<number>(0);

  // Bank transfer reference
  const [bankRefNumber, setBankRefNumber] = useState<string>('');

  // Customer state
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(customers[0] || null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [redeemPoints, setRedeemPoints] = useState<boolean>(false);
  const [autoWhatsAppShare, setAutoWhatsAppShare] = useState<boolean>(true);

  // Bill-level discount state (Client/Store Owner only)
  const [billDiscountPercent, setBillDiscountPercent] = useState<number>(0);
  const [flatDiscountInput, setFlatDiscountInput] = useState<string>('');

  // Field-level error validation for inline customer add
  const [newCustNameError, setNewCustNameError] = useState<string | null>(null);
  const [newCustPhoneError, setNewCustPhoneError] = useState<string | null>(null);

  // Focus refs for inputs (triggered only on explicit user interaction)
  const searchInputRef = useRef<HTMLInputElement>(null);
  const splitCashRef = useRef<HTMLInputElement>(null);
  const newCustNameRef = useRef<HTMLInputElement>(null);

  // Keep selectedCustomer synchronized with authoritative store customers state
  useEffect(() => {
    if (!selectedCustomer) return;
    const latest = customers.find(c => c.id === selectedCustomer.id);
    if (
      latest &&
      (latest.totalPurchases !== selectedCustomer.totalPurchases ||
        latest.loyaltyPoints !== selectedCustomer.loyaltyPoints ||
        latest.creditBalance !== selectedCustomer.creditBalance)
    ) {
      setSelectedCustomer(latest);
    }
  }, [customers, selectedCustomer]);

  // Auto-match template when customer segment changes
  useEffect(() => {
    if (!selectedCustomer) return;
    const custSegment = selectedCustomer.segment || 'Regular Retail';
    const matchingTemplate = invoiceTemplates.find(t => t.targetSegment === custSegment && t.isDefault) ||
      invoiceTemplates.find(t => t.targetSegment === custSegment) ||
      invoiceTemplates.find(t => t.isDefault) ||
      invoiceTemplates[0];

    if (matchingTemplate) {
      setSelectedTemplateId(matchingTemplate.id);
    }
  }, [selectedCustomer, invoiceTemplates]);

  // Modals & Shortcuts
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [shortcutNotice, setShortcutNotice] = useState<string | null>(null);
  const [generatedInvoice, setGeneratedInvoice] = useState<POSInvoice | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const isCheckingOutRef = useRef(false);
  const checkoutAttemptIdRef = useRef<string | null>(null);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const addToCart = (product: Product) => {
    const liveProduct = products.find(p => p.id === product.id) || product;
    if (liveProduct.stock <= 0) {
      triggerShortcutNotice(`⚠️ "${liveProduct.name}" is out of stock.`);
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.product.id === liveProduct.id);
      if (existing) {
        if (existing.quantity >= liveProduct.stock) {
          triggerShortcutNotice(`⚠️ Only ${liveProduct.stock} units of "${liveProduct.name}" available in stock.`);
          return prev; // Limit to stock
        }
        return prev.map(item =>
          item.product.id === liveProduct.id ? { ...item, product: liveProduct, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product: liveProduct, quantity: 1, discount: 0 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    const liveProduct = products.find(p => p.id === productId);
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const maxStock = liveProduct ? liveProduct.stock : item.product.stock;
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (delta > 0 && newQty > maxStock) {
              triggerShortcutNotice(`⚠️ Only ${maxStock} units of "${item.product.name}" available in stock.`);
              return item;
            }
            return { ...item, product: liveProduct || item.product, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as { product: Product; quantity: number; discount: number }[]
    );
  };

  const updateItemDiscount = (productId: string, discountAmount: number) => {
    if (isCrew) {
      triggerShortcutNotice('🔒 Discounts are available to the Store Owner only.');
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, discount: Math.max(0, discountAmount) } : item
      )
    );
  };

  const handleApplyPercentDiscount = (pct: number) => {
    if (isCrew) return;
    if (billDiscountPercent === pct) {
      setBillDiscountPercent(0);
    } else {
      setBillDiscountPercent(pct);
      setFlatDiscountInput('');
    }
  };

  const handleFlatDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isCrew) return;
    setFlatDiscountInput(e.target.value);
    setBillDiscountPercent(0);
  };

  const clearBillDiscount = () => {
    setBillDiscountPercent(0);
    setFlatDiscountInput('');
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setBillDiscountPercent(0);
    setFlatDiscountInput('');
  };

  // Subtotal, Discounts & Per-Line GST Calculations
  const subtotal = Number(
    cart.reduce((acc, item) => acc + item.product.sellingPrice * item.quantity, 0).toFixed(2)
  );
  const itemDiscountsTotal = isCrew
    ? 0
    : Number(
        cart
          .reduce(
            (acc, item) =>
              acc + Math.min(item.product.sellingPrice * item.quantity, Math.max(0, item.discount)),
            0
          )
          .toFixed(2)
      );
  const flatDiscountVal = isCrew ? 0 : (parseFloat(flatDiscountInput) || 0);
  const percentDiscountAmount = isCrew ? 0 : Number(((subtotal * billDiscountPercent) / 100).toFixed(2));
  const billDiscountAmount = isCrew
    ? 0
    : billDiscountPercent > 0
    ? percentDiscountAmount
    : Math.min(subtotal, flatDiscountVal);
  const loyaltyDiscount =
    !isCrew && redeemPoints && selectedCustomer
      ? Math.min(subtotal, selectedCustomer.loyaltyPoints)
      : 0;
  const totalDiscount = isCrew
    ? 0
    : Number(Math.min(subtotal, itemDiscountsTotal + billDiscountAmount + loyaltyDiscount).toFixed(2));

  const taxableAmount = Number(Math.max(0, subtotal - totalDiscount).toFixed(2));
  const netAfterItemDiscounts = Number(Math.max(0, subtotal - itemDiscountsTotal).toFixed(2));
  const extraBillDiscount = Number(Math.max(0, totalDiscount - itemDiscountsTotal).toFixed(2));

  // Calculate GST separately for each cart line using that product's own taxRate
  let allocatedBillDiscount = 0;
  const lineCalculations = cart.map((item, idx) => {
    const lineGross = Number((item.product.sellingPrice * item.quantity).toFixed(2));
    const lineItemDiscount = isCrew
      ? 0
      : Number(Math.min(lineGross, Math.max(0, item.discount)).toFixed(2));
    const lineAfterItemDiscount = Number(Math.max(0, lineGross - lineItemDiscount).toFixed(2));

    let lineBillDiscountShare = 0;
    if (extraBillDiscount > 0 && netAfterItemDiscounts > 0) {
      if (idx === cart.length - 1) {
        lineBillDiscountShare = Number(
          Math.max(0, extraBillDiscount - allocatedBillDiscount).toFixed(2)
        );
      } else {
        lineBillDiscountShare = Number(
          ((lineAfterItemDiscount / netAfterItemDiscounts) * extraBillDiscount).toFixed(2)
        );
        allocatedBillDiscount = Number((allocatedBillDiscount + lineBillDiscountShare).toFixed(2));
      }
    }

    const effectiveLineDiscount = Number(
      Math.min(lineGross, lineItemDiscount + lineBillDiscountShare).toFixed(2)
    );
    const lineTaxable = Number(Math.max(0, lineGross - effectiveLineDiscount).toFixed(2));
    const rate = Number(item.product.taxRate) || 0;
    const rawLineTax = isGSTInvoice ? (lineTaxable * rate) / 100 : 0;
    const lineCgst = isGSTInvoice ? Number((rawLineTax / 2).toFixed(2)) : 0;
    const lineSgst = isGSTInvoice ? Number((rawLineTax / 2).toFixed(2)) : 0;
    const lineTax = isGSTInvoice ? Number((lineCgst + lineSgst).toFixed(2)) : 0;
    const lineTotal = Number((lineTaxable + lineTax).toFixed(2));

    return {
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: item.product.sellingPrice,
      discount: effectiveLineDiscount,
      taxRate: rate,
      cgstAmount: lineCgst,
      sgstAmount: lineSgst,
      taxAmount: lineTax,
      total: lineTotal
    };
  });

  const cgst = isGSTInvoice
    ? Number(lineCalculations.reduce((acc, item) => acc + item.cgstAmount, 0).toFixed(2))
    : 0;
  const sgst = isGSTInvoice
    ? Number(lineCalculations.reduce((acc, item) => acc + item.sgstAmount, 0).toFixed(2))
    : 0;
  const igst = 0;
  const totalTaxAmount = isGSTInvoice ? Number((cgst + sgst + igst).toFixed(2)) : 0;
  const grandTotal = Number(
    lineCalculations.reduce((acc, item) => acc + item.total, 0).toFixed(2)
  );

  const distinctTaxRates = Array.from(
    new Set<number>(cart.map(i => Number(i.product.taxRate) || 0))
  ).sort((a, b) => a - b);
  const gstSlabsLabel =
    distinctTaxRates.length > 0
      ? distinctTaxRates.map(r => `${r}%`).join(', ')
      : '0%';

  // Split payment dynamic calculations (Automatic Remaining Balance & Overpayment check)
  const totalSplitTendered = Number(
    (
      (Number(splitCash) || 0) +
      (Number(splitCard) || 0) +
      (Number(splitUpi) || 0) +
      (Number(splitBank) || 0)
    ).toFixed(2)
  );
  const splitRemaining = Number(Math.max(0, grandTotal - totalSplitTendered).toFixed(2));
  const splitOverpayment = Number(Math.max(0, totalSplitTendered - grandTotal).toFixed(2));
  const isSplitValid =
    paymentMethod !== 'split' ||
    (Math.abs(totalSplitTendered - grandTotal) < 0.01 && grandTotal > 0);

  const handleCreateNewCustomer = () => {
    let hasErr = false;
    if (!newCustName.trim()) {
      setNewCustNameError('Enter customer name.');
      hasErr = true;
    } else {
      setNewCustNameError(null);
    }
    const cleanPhone = newCustPhone.replace(/\D/g, '');
    if (!newCustPhone.trim()) {
      setNewCustPhoneError('Enter customer mobile number.');
      hasErr = true;
    } else if (cleanPhone.length < 10) {
      setNewCustPhoneError('Enter a valid 10-digit mobile number.');
      hasErr = true;
    } else {
      setNewCustPhoneError(null);
    }
    if (hasErr) return;

    const created = addCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      creditBalance: 0,
      loyaltyPoints: 50,
      phoneVerified: true
    });
    setSelectedCustomer(created);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustNameError(null);
    setNewCustPhoneError(null);
    setShowAddCustomer(false);
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || isCheckingOutRef.current) return;

    // Validate live stock availability for all items in cart before checkout
    for (const item of cart) {
      const liveProd = products.find(p => p.id === item.product.id);
      const available = liveProd ? Number(liveProd.stock ?? 0) : 0;
      if (!liveProd || item.quantity <= 0 || available < item.quantity) {
        triggerShortcutNotice(
          `⚠️ Insufficient stock for "${item.product.name}" (Available: ${Math.max(0, available)}, Requested: ${item.quantity}).`
        );
        return;
      }
    }

    const itemsData = lineCalculations.map(
      ({ cgstAmount: _cgst, sgstAmount: _sgst, ...lineItem }) => lineItem
    );

    if (paymentMethod === 'credit') {
      if (!selectedCustomer) {
        triggerShortcutNotice('⚠️ Customer Required: A customer profile must be selected for Credit / Khata sales.');
        return;
      }
    }

    if (paymentMethod === 'split') {
      if (totalSplitTendered > grandTotal) {
        triggerShortcutNotice(`⚠️ Payment exceeds bill total by ₹${totalSplitTendered - grandTotal}.`);
        return;
      }
      if (totalSplitTendered < grandTotal) {
        triggerShortcutNotice(`⚠️ Incomplete split payment: ₹${grandTotal - totalSplitTendered} remaining.`);
        return;
      }
      if (totalSplitTendered === 0 && grandTotal > 0) {
        triggerShortcutNotice('⚠️ Please enter split payment amounts.');
        return;
      }
    }

    const earnedPoints = Math.round(grandTotal * 0.05);
    const redeemedPoints = isCrew ? 0 : (redeemPoints ? loyaltyDiscount : 0);

    isCheckingOutRef.current = true;
    setIsCheckingOut(true);

    if (!checkoutAttemptIdRef.current) {
      checkoutAttemptIdRef.current = `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    }
    const currentAttemptId = checkoutAttemptIdRef.current;

    try {
      const inv = await createInvoice({
        id: currentAttemptId,
        storeId: activeStore.id,
        storeName: activeStore.name,
        storeGSTIN: activeStore.gstin,
        storeAddress: activeStore.address,
        customerId: selectedCustomer ? selectedCustomer.id : undefined,
        customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in Retail Customer',
        customerPhone: selectedCustomer ? selectedCustomer.phone : '+91 99999 00000',
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        isGSTInvoice,
        items: itemsData,
        subtotal,
        discountTotal: isCrew ? 0 : totalDiscount,
        cgst,
        sgst,
        igst: 0,
        grandTotal,
        paymentMethod,
        splitDetails: paymentMethod === 'split' ? {
          cashAmount: splitCash || 0,
          cardAmount: splitCard || 0,
          upiAmount: splitUpi || 0,
          bankAmount: splitBank || 0
        } : undefined,
        referenceNumber: paymentMethod === 'bank_transfer' ? (bankRefNumber || 'NEFT/IMPS') : undefined,
        upiTxnRef: paymentMethod === 'upi' ? `UPI/${Math.floor(100000000 + Math.random() * 900000000)}/OKAXIS` : undefined,
        loyaltyPointsEarned: earnedPoints,
        loyaltyPointsRedeemed: redeemedPoints,
        templateId: selectedTemplateId
      });

      if (selectedCustomer) {
        setSelectedCustomer(prev =>
          prev
            ? {
                ...prev,
                totalPurchases: (Number(prev.totalPurchases) || 0) + grandTotal,
                loyaltyPoints: Math.max(0, (Number(prev.loyaltyPoints) || 0) - redeemedPoints + earnedPoints),
                creditBalance:
                  paymentMethod === 'credit'
                    ? (Number(prev.creditBalance) || 0) + grandTotal
                    : prev.creditBalance
              }
            : null
        );
      }

      checkoutAttemptIdRef.current = null;
      setGeneratedInvoice(inv);
      setIsInvoiceModalOpen(true);
      setCart([]);
      setBankRefNumber('');
      setSplitCash(0);
      setSplitCard(0);
      setSplitUpi(0);
      setSplitBank(0);

      if (autoWhatsAppShare) {
        const targetPhone = inv.customerPhone || '+91 99999 00000';
        const cleanDigits = targetPhone.replace(/[^0-9]/g, '');
        const formattedPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
        const pdfInvoiceUrl = `https://ellic.com/invoices/pdf/${inv.invoiceNumber}.pdf`;

        const cashierName = inv.cashierName || userProfile?.name || 'Staff Cashier';
        const whatsappText = `*TAX INVOICE / OFFICIAL BILL* 🧾
*Store:* ${inv.storeName}
*Cashier / Billed by:* ${cashierName}
--------------------------------
*Invoice No:* #${inv.invoiceNumber}
*Date & Time:* ${inv.date}
*Customer:* ${inv.customerName}

*Items:*
${inv.items.map(it => `• ${it.productName} (${it.quantity}x @ ₹${it.unitPrice}) = ₹${it.total}`).join('\n')}

--------------------------------
*Subtotal:* ₹${inv.subtotal}
${inv.cgst ? `*GST:* ₹${(inv.cgst + inv.sgst).toFixed(2)}\n` : ''}*Grand Total:* ₹${inv.grandTotal} (${inv.paymentMethod.toUpperCase()})

*Download Official PDF Invoice:*
${pdfInvoiceUrl}

Thank you for shopping with ${inv.storeName}!`;

        const waApiUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(whatsappText)}`;
        try {
          window.open(waApiUrl, '_blank');
        } catch (err) {
          console.warn('Unable to launch WhatsApp window in sandbox:', err);
        }
      }
    } catch (err: any) {
      triggerShortcutNotice(`⚠️ ${err?.message || 'Sale rejected due to insufficient stock.'}`);
    } finally {
      isCheckingOutRef.current = false;
      setIsCheckingOut(false);
    }
  };

  // Transient keyboard shortcut feedback notice
  const triggerShortcutNotice = (msg: string) => {
    setShortcutNotice(msg);
  };

  useEffect(() => {
    if (!shortcutNotice) return;
    const t = setTimeout(() => setShortcutNotice(null), 1600);
    return () => clearTimeout(t);
  }, [shortcutNotice]);

  useEffect(() => {
    checkoutAttemptIdRef.current = null;
  }, [cart, activeStore.id, selectedCustomer?.id, paymentMethod, isGSTInvoice, totalDiscount]);

  // F2: Start New Sale / Reset Cart
  const handleStartNewSale = () => {
    checkoutAttemptIdRef.current = null;
    setIsInvoiceModalOpen(false);
    setIsScannerOpen(false);
    setIsShortcutsModalOpen(false);
    setShowAddCustomer(false);
    setCart([]);
    setSearchQuery('');
    setSelectedCategory('All');
    setRedeemPoints(false);
    setMobileTab('catalog');
    triggerShortcutNotice('New Sale Started (F2)');
  };

  // F8: Complete Sale / Checkout
  const handleCompleteSaleShortcut = () => {
    if (cart.length === 0) {
      triggerShortcutNotice('Cart is empty: add items first');
      return;
    }
    triggerShortcutNotice('Completing Transaction (F8)...');
    handleCheckout();
  };

  // F3: Focus Product Search
  const handleFocusSearch = () => {
    setMobileTab('catalog');
    searchInputRef.current?.focus();
    searchInputRef.current?.select();
    triggerShortcutNotice('Product Search Focused (F3)');
  };

  // F7: Toggle Barcode Scanner Modal
  const handleToggleScanner = () => {
    setIsScannerOpen(prev => !prev);
  };

  // F4: Select Cash
  const handleSelectCash = () => {
    setPaymentMethod('cash');
    triggerShortcutNotice('Payment: Cash (F4)');
  };

  // F9: Select UPI
  const handleSelectUPI = () => {
    setPaymentMethod('upi');
    triggerShortcutNotice('Payment: UPI QR (F9)');
  };

  // F10: Select Card
  const handleSelectCard = () => {
    setPaymentMethod('card');
    triggerShortcutNotice('Payment: Card (F10)');
  };

  // F1: Toggle Shortcuts Guide
  const handleToggleShortcutsGuide = () => {
    setIsShortcutsModalOpen(prev => !prev);
  };

  // Esc: Close open dialogs or clear search
  const handleEscapeKey = () => {
    if (isShortcutsModalOpen) {
      setIsShortcutsModalOpen(false);
    } else if (isScannerOpen) {
      setIsScannerOpen(false);
    } else if (isInvoiceModalOpen) {
      setIsInvoiceModalOpen(false);
    } else if (showAddCustomer) {
      setShowAddCustomer(false);
    } else if (searchQuery) {
      setSearchQuery('');
    }
  };

  // Synchronize latest references for event listener to avoid stale state closures
  const cartRef = useRef(cart);
  cartRef.current = cart;

  const handleStartNewSaleRef = useRef(handleStartNewSale);
  handleStartNewSaleRef.current = handleStartNewSale;

  const handleCompleteSaleShortcutRef = useRef(handleCompleteSaleShortcut);
  handleCompleteSaleShortcutRef.current = handleCompleteSaleShortcut;

  const handleFocusSearchRef = useRef(handleFocusSearch);
  handleFocusSearchRef.current = handleFocusSearch;

  const handleToggleScannerRef = useRef(handleToggleScanner);
  handleToggleScannerRef.current = handleToggleScanner;

  const handleSelectCashRef = useRef(handleSelectCash);
  handleSelectCashRef.current = handleSelectCash;

  const handleSelectUPIRef = useRef(handleSelectUPI);
  handleSelectUPIRef.current = handleSelectUPI;

  const handleSelectCardRef = useRef(handleSelectCard);
  handleSelectCardRef.current = handleSelectCard;

  const handleToggleShortcutsGuideRef = useRef(handleToggleShortcutsGuide);
  handleToggleShortcutsGuideRef.current = handleToggleShortcutsGuide;

  const handleEscapeKeyRef = useRef(handleEscapeKey);
  handleEscapeKeyRef.current = handleEscapeKey;

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);

      if (e.key === 'F2') {
        e.preventDefault();
        handleStartNewSaleRef.current();
      } else if (e.key === 'F8') {
        e.preventDefault();
        handleCompleteSaleShortcutRef.current();
      } else if (e.key === 'F3') {
        e.preventDefault();
        handleFocusSearchRef.current();
      } else if (e.key === 'F7') {
        e.preventDefault();
        handleToggleScannerRef.current();
      } else if (e.key === 'F4') {
        e.preventDefault();
        handleSelectCashRef.current();
      } else if (e.key === 'F9') {
        e.preventDefault();
        handleSelectUPIRef.current();
      } else if (e.key === 'F10') {
        e.preventDefault();
        handleSelectCardRef.current();
      } else if (e.key === 'F1') {
        e.preventDefault();
        handleToggleShortcutsGuideRef.current();
      } else if (e.key === 'Escape') {
        handleEscapeKeyRef.current();
      } else if (!isInput && (e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k'))) {
        e.preventDefault();
        handleFocusSearchRef.current();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Handle Enter key inside the search input for rapid barcode scanner gun or exact match item addition
  const handleSearchInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const query = searchQuery.trim();
      if (!query) return;
      e.preventDefault();

      // 1. Check exact barcode match
      const exactBarcode = products.find(p => p.barcode.trim().toLowerCase() === query.toLowerCase());
      if (exactBarcode) {
        addToCart(exactBarcode);
        setSearchQuery('');
        triggerShortcutNotice(`Added ${exactBarcode.name}`);
        return;
      }

      // 2. Check exact product name match
      const exactName = products.find(p => p.name.trim().toLowerCase() === query.toLowerCase());
      if (exactName) {
        addToCart(exactName);
        setSearchQuery('');
        triggerShortcutNotice(`Added ${exactName.name}`);
        return;
      }

      // 3. If filtered products has exactly 1 matching item
      if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        setSearchQuery('');
        triggerShortcutNotice(`Added ${filteredProducts[0].name}`);
        return;
      }
    }
  };

  if (isActuallyLoading) {
    return <POSSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Active Store Visibility Header (FIX 3: Immediate Active Store Identification) */}
      <div className="bg-[#121826] border border-emerald-500/25 rounded-xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-slate-400 font-medium">Active Store:</span>
          <span className="font-extrabold text-white truncate">
            {activeStore.name}{activeStore.city ? ` · ${activeStore.city}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>Cashier: <strong className="text-slate-200">{userProfile?.displayName || storeUser?.name || (isCrew ? 'Store Crew' : 'Store Owner')}</strong></span>
        </div>
      </div>

      {/* Mobile POS Navigation Segment (lg:hidden) */}
      <div className="flex lg:hidden bg-[#121826] p-1.5 rounded-xl border border-slate-800 gap-1 shadow-lg">
        <button
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 min-h-[44px] rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            mobileTab === 'catalog'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Catalog ({filteredProducts.length})</span>
        </button>

        <button
          onClick={() => setMobileTab('cart')}
          className={`flex-1 min-h-[44px] rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all relative ${
            mobileTab === 'cart'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Cart ({cart.reduce((a, c) => a + c.quantity, 0)})</span>
          {cart.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-lg bg-emerald-400 text-slate-950 text-[10px] font-black tabular-nums">
              ₹{grandTotal}
            </span>
          )}
        </button>
      </div>

      {/* Retail POS Quick Keyboard Shortcut Bar */}
      <div className="bg-[#121826] border border-slate-800 rounded-xl px-3.5 py-2 flex items-center justify-between gap-2 overflow-x-auto text-xs shadow-md">
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Speed Keys:</span>
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleStartNewSale}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] transition-colors"
              title="Start a fresh sale transaction and reset cart (F2)"
            >
              <kbd className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">F2</kbd>
              <span>New Sale</span>
            </button>

            <button
              type="button"
              onClick={handleCompleteSaleShortcut}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] transition-colors"
              title="Complete sale transaction and generate bill (F8)"
            >
              <kbd className="px-1 py-0.2 rounded bg-teal-500/20 text-teal-300 font-mono text-[10px] font-bold">F8</kbd>
              <span>Checkout</span>
            </button>

            <button
              type="button"
              onClick={handleFocusSearch}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] transition-colors"
              title="Focus product search bar (F3)"
            >
              <kbd className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">F3</kbd>
              <span>Search</span>
            </button>

            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] transition-colors"
              title="Open Barcode Scanner (F7)"
            >
              <kbd className="px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold">F7</kbd>
              <span>Scanner</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsShortcutsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition-colors shrink-0 ml-auto"
          title="Open full keyboard shortcuts guide (F1)"
        >
          <Keyboard className="w-3.5 h-3.5 text-emerald-400" />
          <span>All Shortcuts</span>
          <kbd className="px-1 py-0.2 rounded bg-slate-900 border border-emerald-500/40 text-emerald-300 font-mono text-[9px]">F1</kbd>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Selection Catalog */}
        <div
          className={`lg:col-span-7 space-y-4 ${
            mobileTab === 'catalog' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Search & Barcode Scan Bar */}
          <div className="p-4 rounded-xl bg-[#121826] border border-slate-800 shadow-lg space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-pos-product-search"
                  ref={searchInputRef}
                  type="search"
                  inputMode="search"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchInputKeyDown}
                  placeholder="Search products by Name, Barcode, or Brand... (F3)"
                  className="w-full bg-[#0A0E1A] border border-slate-700/80 rounded-lg pl-9 pr-14 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 min-h-[44px] transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 pointer-events-none">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-400">
                    F3
                  </kbd>
                </span>
              </div>

              <button
                onClick={() => setIsScannerOpen(true)}
                title="Scan Barcode (F7)"
                className="px-4 py-2.5 min-h-[44px] rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95 shrink-0"
              >
                <Scan className="w-4 h-4" />
                <span className="hidden sm:inline">Scan Barcode</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-black/20 border border-white/20 text-[10px] font-mono text-emerald-200">
                  F7
                </kbd>
              </button>
            </div>

            {/* Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2.5 sm:gap-3">
            {filteredProducts.map(prod => {
              const inCartItem = cart.find(i => i.product.id === prod.id);
              const isLowStock = prod.stock <= prod.minThreshold;

              return (
                <div
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  className={`p-3 rounded-xl bg-[#121826] border transition-all cursor-pointer flex flex-col justify-between relative group active:scale-[0.98] ${
                    inCartItem
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-[#161D2C]'
                      : 'border-slate-800 hover:border-slate-700 hover:bg-[#161D2C]'
                  }`}
                >
                  {inCartItem && (
                    <span className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-emerald-500 text-xs font-black text-white flex items-center justify-center shadow-md tabular-nums">
                      {inCartItem.quantity}
                    </span>
                  )}

                  <div className="space-y-2">
                    <div className="h-24 w-full rounded-lg overflow-hidden bg-slate-800 relative">
                      <img
                        src={
                          prod.image ||
                          'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300'
                        }
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute bottom-1.5 left-1.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#0A0E1A]/85 text-slate-300 backdrop-blur-sm border border-slate-700">
                        {prod.category}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-emerald-300 transition-colors">
                        {prod.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">{prod.brand}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between tabular-nums">
                    <div>
                      <div className="text-sm font-black text-emerald-400">₹{prod.sellingPrice}</div>
                      <div className="text-[9px] text-slate-500 line-through">MRP ₹{prod.mrp}</div>
                    </div>
                    <StockStatusBadge stock={prod.stock} unit={prod.unit} showQuantity={true} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: POS Billing Cart & Checkout Terminal */}
        <div
          className={`lg:col-span-5 p-4 sm:p-5 rounded-xl bg-[#121826] border border-slate-800 shadow-2xl space-y-4 ${
            mobileTab === 'cart' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Terminal Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">POS Checkout Terminal</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleStartNewSale}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700 flex items-center gap-1.5"
                title="Start a fresh new sale (F2)"
              >
                <RotateCcw className="w-3 h-3 text-emerald-400" />
                <span>New Sale</span>
                <kbd className="px-1 py-0.2 rounded bg-slate-900 border border-slate-600 text-[10px] font-mono text-emerald-300">
                  F2
                </kbd>
              </button>
              <button
                onClick={() => setIsGSTInvoice(!isGSTInvoice)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  isGSTInvoice
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {isGSTInvoice ? 'GST Invoice' : 'Non-GST Bill'}
              </button>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Clear Cart"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Customer Selector / Quick Add */}
          <div className="p-3 rounded-xl bg-[#161D2C] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Customer Link</span>
              </span>
              <div className="flex items-center gap-2">
                {selectedCustomer && (
                  <span className="text-[10px] text-emerald-400 font-bold tabular-nums">
                    {selectedCustomer.loyaltyPoints} Pts
                  </span>
                )}
                <button
                  type="button"
                  id="btn-pos-toggle-add-customer"
                  onClick={() => setShowAddCustomer(!showAddCustomer)}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 hover:underline"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>{showAddCustomer ? 'Select Existing' : '+ Quick Add'}</span>
                </button>
              </div>
            </div>

            {showAddCustomer ? (
              <div className="p-2.5 rounded-xl bg-[#0A0E1A] border border-emerald-500/30 space-y-2">
                <div className="text-[11px] font-semibold text-emerald-400 flex items-center justify-between">
                  <span>New Customer Registration</span>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomer(false)}
                    className="text-slate-400 hover:text-white text-[10px]"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <input
                      id="input-pos-cust-name"
                      ref={newCustNameRef}
                      type="text"
                      inputMode="text"
                      autoCapitalize="words"
                      placeholder="Customer Full Name *"
                      value={newCustName}
                      onChange={e => {
                        setNewCustName(e.target.value);
                        if (newCustNameError) setNewCustNameError(null);
                      }}
                      className={`w-full bg-slate-800 border rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                        newCustNameError
                          ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20'
                          : 'border-slate-700 focus:border-emerald-500'
                      }`}
                    />
                    {newCustNameError && (
                      <p className="text-[10px] text-rose-400 mt-1 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{newCustNameError}</span>
                      </p>
                    )}
                  </div>
                  <div>
                    <input
                      id="input-pos-cust-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      pattern="[0-9]*"
                      placeholder="Mobile (e.g. 9876543210) *"
                      value={newCustPhone}
                      onChange={e => {
                        setNewCustPhone(e.target.value);
                        if (newCustPhoneError) setNewCustPhoneError(null);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          handleCreateNewCustomer();
                        }
                      }}
                      className={`w-full bg-slate-800 border rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                        newCustPhoneError
                          ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20'
                          : 'border-slate-700 focus:border-emerald-500'
                      }`}
                    />
                    {newCustPhoneError && (
                      <p className="text-[10px] text-rose-400 mt-1 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{newCustPhoneError}</span>
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  id="btn-pos-save-customer"
                  onClick={handleCreateNewCustomer}
                  className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                >
                  Save & Link Customer
                </button>
              </div>
            ) : (
              <select
                id="select-pos-customer"
                value={selectedCustomer?.id || ''}
                onChange={e => {
                  const found = customers.find(c => c.id === e.target.value);
                  setSelectedCustomer(found || null);
                }}
                className="w-full bg-[#0A0E1A] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 min-h-[44px]"
              >
                <option value="">Walk-in Retail Customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) - Bal: ₹{c.creditBalance}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Cart Itemized List */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-10 text-slate-500 space-y-2 bg-[#0A0E1A]/60 rounded-xl border border-slate-800/80">
                <ShoppingCart className="w-9 h-9 text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-300">Cart is empty</p>
                <p className="text-[11px] text-slate-400">Scan barcode or select products to start billing.</p>
              </div>
            ) : (
              cart.map(item => (
                <div
                  key={item.product.id}
                  className="p-3 rounded-xl bg-[#161D2C] border border-slate-800 flex items-center justify-between gap-2 tabular-nums"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{item.product.name}</div>
                    <div className="text-[10px] text-slate-400">
                      ₹{item.product.sellingPrice} x {item.quantity} | Tax: {item.product.taxRate}%
                    </div>
                    {!isCrew ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-slate-400">Disc:</span>
                        <div className="relative">
                          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">₹</span>
                          <input
                            type="number"
                            min="0"
                            max={item.product.sellingPrice * item.quantity}
                            value={item.discount > 0 ? item.discount : ''}
                            placeholder="0"
                            onChange={e => updateItemDiscount(item.product.id, Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-16 bg-[#0A0E1A] border border-slate-700 rounded-lg pl-4 pr-1 py-0.5 text-[10px] text-white focus:outline-none focus:border-emerald-500 font-mono"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                        <Lock className="w-2.5 h-2.5 text-amber-400/80 shrink-0" />
                        <span className="italic">Discounts are available to the Store Owner only.</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-[#0A0E1A] rounded-lg border border-slate-700 overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-9 h-9 flex items-center justify-center hover:text-rose-400 text-slate-300 active:bg-slate-800"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 text-xs font-extrabold text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-9 h-9 flex items-center justify-center hover:text-emerald-400 text-slate-300 active:bg-slate-800"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right min-w-[60px]">
                      <div className="text-xs font-black text-white">
                        ₹{item.product.sellingPrice * item.quantity - item.discount}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        {/* Calculation & Discount Section */}
        {cart.length > 0 && (
          <div className="pt-3 border-t border-slate-800 space-y-2 text-xs text-slate-300 tabular-nums">
            <div className="flex justify-between">
              <span className="text-slate-400">Subtotal:</span>
              <span className="font-semibold text-white">₹{subtotal}</span>
            </div>

            {/* Discount Section: Owner controls or Crew Lock Banner */}
            {isCrew ? (
              <div className="p-2.5 rounded-xl bg-[#0A0E1A] border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-2 font-medium text-slate-300">
                  <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Discounts are available to the Store Owner only.</span>
                </span>
                <span className="text-[10px] text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded-lg font-semibold border border-amber-500/20">
                  Owner Only
                </span>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-[#161D2C] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Bill Discount</span>
                  </span>
                  {(billDiscountPercent > 0 || (flatDiscountInput && parseFloat(flatDiscountInput) > 0)) && (
                    <button
                      type="button"
                      onClick={clearBillDiscount}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold"
                    >
                      Clear Discount
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[5, 10, 15, 20].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleApplyPercentDiscount(pct)}
                      className={`py-1 px-2 rounded-lg text-xs font-bold border transition-colors ${
                        billDiscountPercent === pct
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-[#0A0E1A] text-slate-300 border-slate-700 hover:border-slate-600 hover:text-white'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-slate-400">Or Flat Amount:</span>
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      max={subtotal}
                      value={flatDiscountInput}
                      onChange={handleFlatDiscountChange}
                      placeholder="0"
                      className="w-full bg-[#0A0E1A] border border-slate-700 rounded-lg pl-5 pr-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {!isCrew && itemDiscountsTotal > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Item Discounts Total:</span>
                <span className="font-semibold">-₹{itemDiscountsTotal}</span>
              </div>
            )}

            {!isCrew && billDiscountAmount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Bill Discount ({billDiscountPercent > 0 ? `${billDiscountPercent}%` : 'Flat'}):</span>
                <span className="font-semibold">-₹{billDiscountAmount}</span>
              </div>
            )}

            {selectedCustomer && selectedCustomer.loyaltyPoints > 0 && (
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                {isCrew ? (
                  <div className="flex items-center justify-between text-xs text-amber-300">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Customer Points: {selectedCustomer.loyaltyPoints}</span>
                    </span>
                    <span className="text-[10px] text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded-lg font-semibold border border-amber-500/20">
                      Discounts are available to the Store Owner only.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-300">
                      <input
                        type="checkbox"
                        checked={redeemPoints}
                        onChange={e => setRedeemPoints(e.target.checked)}
                        className="accent-emerald-500 rounded"
                      />
                      <span>Redeem {selectedCustomer.loyaltyPoints} Loyalty Points</span>
                    </label>
                    <span className="font-extrabold text-emerald-400">-₹{loyaltyDiscount}</span>
                  </div>
                )}
              </div>
            )}

            {isGSTInvoice && (
              <div className="flex justify-between text-slate-400">
                <span>GST (CGST + SGST · {gstSlabsLabel}):</span>
                <span className="font-semibold text-slate-200">₹{totalTaxAmount}</span>
              </div>
            )}

            <div className="flex justify-between text-lg font-black text-white pt-2 border-t border-slate-800">
              <span>Grand Total:</span>
              <span className="text-emerald-400">₹{grandTotal}</span>
            </div>

            {/* Template Selector */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Invoice Design Template</span>
                </span>
                {selectedCustomer && (
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    Auto-Matched ({selectedCustomer.segment})
                  </span>
                )}
              </div>
              <select
                value={selectedTemplateId}
                onChange={e => setSelectedTemplateId(e.target.value)}
                className="w-full bg-[#0A0E1A] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-blue-500"
              >
                {invoiceTemplates.map(tpl => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} : [{tpl.targetSegment}] ({tpl.paperSize.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Payment Method Selector */}
        {cart.length > 0 && (
          <div className="space-y-2 tabular-nums">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Payment Method
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {[
                { id: 'upi', label: 'UPI QR', icon: <QrCode className="w-3.5 h-3.5" />, shortcut: 'F9' },
                { id: 'cash', label: 'Cash', icon: <DollarSign className="w-3.5 h-3.5" />, shortcut: 'F4' },
                { id: 'card', label: 'Card', icon: <CreditCard className="w-3.5 h-3.5" />, shortcut: 'F10' },
                { id: 'bank_transfer', label: 'Bank / NEFT', icon: <Building2 className="w-3.5 h-3.5" /> },
                { id: 'credit', label: 'Khata / Credit', icon: <BookOpen className="w-3.5 h-3.5" /> },
                { id: 'split', label: 'Split', icon: <Layers className="w-3.5 h-3.5" /> }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                  className={`p-2 rounded-lg text-xs font-bold border flex flex-col items-center justify-center gap-1 transition-all relative ${
                    paymentMethod === m.id
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/20'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {m.shortcut && (
                    <span className="absolute top-1 right-1 text-[8px] font-mono px-1 rounded bg-[#0A0E1A]/80 text-slate-400 border border-slate-700">
                      {m.shortcut}
                    </span>
                  )}
                  {m.icon}
                  <span className="text-[11px] truncate w-full text-center">{m.label}</span>
                </button>
              ))}
            </div>

            {/* Bank Transfer Details Form */}
            {paymentMethod === 'bank_transfer' && (
              <div className="p-3 rounded-xl bg-[#0A0E1A] border border-slate-800 space-y-2 text-xs">
                <label className="text-[11px] font-semibold text-slate-300 block">
                  Bank Reference / UTR Number
                </label>
                <input
                  type="text"
                  value={bankRefNumber}
                  onChange={e => setBankRefNumber(e.target.value)}
                  placeholder="e.g. UTR/IMPS/2026042109841"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400">
                  Record the bank payment receipt or UTR number for reconciliation.
                </p>
              </div>
            )}

            {/* Credit / Khata Details Form */}
            {paymentMethod === 'credit' && (
              <div className="p-3 rounded-xl bg-[#0A0E1A] border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-300">Customer Credit / Khata</span>
                  {selectedCustomer && (
                    <span className="text-amber-400 font-mono font-bold">
                      Current Due: ₹{selectedCustomer.creditBalance || 0}
                    </span>
                  )}
                </div>
                {!selectedCustomer ? (
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
                    ⚠️ Customer profile required. Please select or register a customer above for Credit / Khata billing.
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-300">
                    Grand total (₹{grandTotal}) will be added to <strong>{selectedCustomer.name}</strong>'s credit ledger.
                    New balance: <strong className="text-amber-400 font-mono">₹{(Number(selectedCustomer.creditBalance) || 0) + grandTotal}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Split Payment Form */}
            {paymentMethod === 'split' && (
              <div id="pos-split-payment-container" className="p-3.5 rounded-xl bg-[#0A0E1A] border border-slate-800 space-y-3 text-xs">
                {/* Header Summary Row */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Bill Total</span>
                    <div className="text-base font-black text-white">₹{grandTotal}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Remaining</span>
                    <div
                      id="split-remaining-indicator"
                      className={`text-base font-black font-mono ${
                        splitOverpayment > 0
                          ? 'text-rose-400'
                          : splitRemaining === 0
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      ₹{splitRemaining}
                    </div>
                  </div>
                </div>

                {/* Overpayment Alert */}
                {splitOverpayment > 0 && (
                  <div
                    id="alert-split-overpayment"
                    className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/35 text-rose-300 flex items-center gap-2 text-xs font-semibold"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>Payment exceeds bill total by ₹{splitOverpayment}.</span>
                  </div>
                )}

                {/* Incomplete Balance Indicator */}
                {splitOverpayment === 0 && splitRemaining > 0 && totalSplitTendered > 0 && (
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center justify-between">
                    <span>Remaining to be collected:</span>
                    <span className="font-bold font-mono text-xs">₹{splitRemaining}</span>
                  </div>
                )}

                {/* All Four Tenders with "Pay Remaining" Smart Quick Action */}
                <div className="space-y-2.5 pt-1">
                  {/* Cash */}
                  <div className="bg-[#121826] p-2 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="input-split-cash" className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <span>💵 Cash</span>
                          <span className="text-[10px] text-slate-500 font-normal">₹</span>
                        </label>
                        {splitRemaining > 0 && (
                          <button
                            type="button"
                            onClick={() => setSplitCash((prev) => prev + splitRemaining)}
                            className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/25 transition-colors"
                          >
                            Pay Remaining ₹{splitRemaining}
                          </button>
                        )}
                      </div>
                      <input
                        id="input-split-cash"
                        ref={splitCashRef}
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min="0"
                        step="any"
                        placeholder="0"
                        value={splitCash || ''}
                        onChange={e => setSplitCash(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-[#0A0E1A] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500 min-h-[38px]"
                      />
                    </div>
                  </div>

                  {/* Card */}
                  <div className="bg-[#121826] p-2 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="input-split-card" className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <span>💳 Card</span>
                          <span className="text-[10px] text-slate-500 font-normal">₹</span>
                        </label>
                        {splitRemaining > 0 && (
                          <button
                            type="button"
                            onClick={() => setSplitCard((prev) => prev + splitRemaining)}
                            className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/25 transition-colors"
                          >
                            Pay Remaining ₹{splitRemaining}
                          </button>
                        )}
                      </div>
                      <input
                        id="input-split-card"
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min="0"
                        step="any"
                        placeholder="0"
                        value={splitCard || ''}
                        onChange={e => setSplitCard(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-[#0A0E1A] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500 min-h-[38px]"
                      />
                    </div>
                  </div>

                  {/* UPI */}
                  <div className="bg-[#121826] p-2 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="input-split-upi" className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <span>📱 UPI / QR</span>
                          <span className="text-[10px] text-slate-500 font-normal">₹</span>
                        </label>
                        {splitRemaining > 0 && (
                          <button
                            type="button"
                            onClick={() => setSplitUpi((prev) => prev + splitRemaining)}
                            className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/25 transition-colors"
                          >
                            Pay Remaining ₹{splitRemaining}
                          </button>
                        )}
                      </div>
                      <input
                        id="input-split-upi"
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min="0"
                        step="any"
                        placeholder="0"
                        value={splitUpi || ''}
                        onChange={e => setSplitUpi(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-[#0A0E1A] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500 min-h-[38px]"
                      />
                    </div>
                  </div>

                  {/* Bank Transfer */}
                  <div className="bg-[#121826] p-2 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="input-split-bank" className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <span>🏛️ Bank Transfer</span>
                          <span className="text-[10px] text-slate-500 font-normal">₹</span>
                        </label>
                        {splitRemaining > 0 && (
                          <button
                            type="button"
                            onClick={() => setSplitBank((prev) => prev + splitRemaining)}
                            className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/25 transition-colors"
                          >
                            Pay Remaining ₹{splitRemaining}
                          </button>
                        )}
                      </div>
                      <input
                        id="input-split-bank"
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min="0"
                        step="any"
                        placeholder="0"
                        value={splitBank || ''}
                        onChange={e => setSplitBank(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-[#0A0E1A] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500 min-h-[38px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Tender Total Sum */}
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80">
                  <span>Total Tendered:</span>
                  <span className="font-mono font-bold text-white">₹{totalSplitTendered} / ₹{grandTotal}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* WhatsApp Share Control Toggle */}
        {cart.length > 0 && (
          <div className="p-3 rounded-xl bg-[#0A0E1A] border border-slate-800 flex items-center justify-between text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-300 font-bold select-none">
              <input
                type="checkbox"
                checked={autoWhatsAppShare}
                onChange={e => setAutoWhatsAppShare(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Auto-Share PDF Invoice on WhatsApp</span>
              </span>
            </label>

            <span className="text-[10px] text-slate-400 font-mono font-semibold tabular-nums">
              {selectedCustomer ? selectedCustomer.phone : '+91 Registered Mobile'}
            </span>
          </div>
        )}

        {/* Complete Payment Button */}
        {cart.length > 0 && (
          <button
            id="btn-pos-complete-sale"
            onClick={handleCheckout}
            disabled={isCheckingOut || (paymentMethod === 'split' && !isSplitValid)}
            title={
              paymentMethod === 'split' && !isSplitValid
                ? splitOverpayment > 0
                  ? `Payment exceeds bill total by ₹${splitOverpayment}`
                  : `Incomplete split payment (₹${splitRemaining} remaining)`
                : "Complete Sale & Generate Invoice (F8)"
            }
            className={`w-full py-3 rounded-lg text-sm font-black shadow-xl flex items-center justify-center gap-2 transition-all tabular-nums ${
              isCheckingOut || (paymentMethod === 'split' && !isSplitValid)
                ? 'bg-slate-800/90 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/25 active:scale-[0.99]'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>
              {paymentMethod === 'split' && !isSplitValid
                ? splitOverpayment > 0
                  ? `Overpaid by ₹${splitOverpayment} - Adjust Amounts`
                  : `Split Balance Remaining: ₹${splitRemaining}`
                : `Complete Sale & Generate Invoice (₹${grandTotal})`}
            </span>
            {(!paymentMethod || paymentMethod !== 'split' || isSplitValid) && (
              <kbd className="px-1.5 py-0.5 rounded bg-black/30 border border-white/20 text-[10px] font-mono tracking-wider ml-1">
                F8
              </kbd>
            )}
          </button>
        )}

      </div>
    </div>

      {/* Floating Sticky Mobile Quick Checkout Bar */}
      {cart.length > 0 && mobileTab === 'catalog' && (
        <div className="fixed bottom-[4.5rem] md:bottom-4 left-3 right-3 z-30 lg:hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 rounded-xl p-3 shadow-2xl border border-emerald-400/40 flex items-center justify-between text-white animate-in slide-in-from-bottom duration-200 tabular-nums">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-100">
              Cart ({cart.reduce((a, c) => a + c.quantity, 0)} Items)
            </div>
            <div className="text-base font-black">₹{grandTotal}</div>
          </div>
          <button
            onClick={() => setMobileTab('cart')}
            className="px-4 py-2.5 rounded-lg bg-[#0A0E1A] text-white text-xs font-black flex items-center gap-1.5 shadow-lg active:scale-95 transition-transform"
          >
            <span>View Cart & Pay</span>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={p => addToCart(p)}
      />

      {/* Generated GST Invoice Modal */}
      <InvoiceModal
        invoice={generatedInvoice}
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
      />

      {/* POS Keyboard Shortcuts Modal */}
      <POSShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Transient Keyboard Shortcut Feedback Toast */}
      {shortcutNotice && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900/95 backdrop-blur-md text-white font-bold text-xs px-3.5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-emerald-500/60 animate-in slide-in-from-top-2 duration-150 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-slate-200">{shortcutNotice}</span>
        </div>
      )}

    </div>
  );
};
