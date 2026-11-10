import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  InvoiceTemplate,
  InvoiceTemplateBranding,
  InvoiceTemplateVariableFields,
  InternationalTradeSettings,
  CurrencyInfo
} from '../../types';
import {
  FileText,
  Plus,
  Palette,
  Eye,
  Check,
  Star,
  Copy,
  Trash2,
  Edit3,
  Sliders,
  Sparkles,
  QrCode,
  Layers,
  Building2,
  Printer,
  X,
  Upload,
  Image as ImageIcon,
  Globe,
  DollarSign,
  ArrowRightLeft,
  ShieldCheck,
  Landmark,
  Calculator,
  RefreshCw,
  Info,
  ChevronDown
} from 'lucide-react';
import {
  SUPPORTED_CURRENCIES,
  DEFAULT_USD_EXCHANGE_RATES,
  fetchLiveExchangeRates,
  convertCurrency,
  formatCurrency,
  getExchangeRate,
  INCOTERMS_OPTIONS,
  LiveRatesState
} from '../../utils/currencyUtils';
import { CurrencyConverterTool } from './CurrencyConverterTool';

const LOGO_PRESETS = [
  { name: 'Gold Luxury Emblem', url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=200' },
  { name: 'Fresh Retail Express', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200' },
  { name: 'Corporate Supply Direct', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=200' }
];

const COLOR_PRESETS = [
  { name: 'Luxury Gold & Dark Slate', primary: '#0f172a', accent: '#d97706' },
  { name: 'Sapphire Electric', primary: '#1D4ED8', accent: '#2563EB' },
  { name: 'Corporate Navy', primary: '#1e3a8a', accent: '#2563eb' },
  { name: 'Global Ocean Blue', primary: '#092340', accent: '#3b82f6' },
  { name: 'Cyber Cobalt', primary: '#0f172a', accent: '#38bdf8' },
  { name: 'Royal Violet', primary: '#581c87', accent: '#a855f7' }
];

const SAMPLE_INVOICE_DATA = {
  invoiceNumber: 'INV-2026-0805-VIP',
  date: '2026-08-05 15:45',
  customerName: 'Global Distributors & Wholesalers LLC',
  customerPhone: '+1 (555) 382-9910',
  gstin: '27AAAAA0000A1Z5',
  items: [
    { name: 'Organic Whole Milk 1L (Crate of 12)', qty: 2, price: 66, taxRate: 5, total: 132 },
    { name: 'Extra Virgin Olive Oil 1L (Case of 6)', qty: 1, price: 1150, taxRate: 12, total: 1150 }
  ],
  subtotal: 1282,
  discount: 50,
  taxTotal: 142,
  grandTotal: 1374,
  paymentMethod: 'SWIFT Wire / UPI',
  upiRef: 'WIRE/981273912/CITI',
  loyaltyEarned: 68
};

export const InvoiceTemplates: React.FC = () => {
  const {
    invoiceTemplates,
    addInvoiceTemplate,
    updateInvoiceTemplate,
    deleteInvoiceTemplate,
    setDefaultInvoiceTemplate,
    activeStore
  } = useStore();

  const [selectedSegment, setSelectedSegment] = useState<string>('All');
  const [editingTemplate, setEditingTemplate] = useState<InvoiceTemplate | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [previewTemplate, setPreviewTemplate] = useState<InvoiceTemplate | null>(null);

  // Live Currency FX State
  const [showFxHub, setShowFxHub] = useState<boolean>(false);
  const [ratesState, setRatesState] = useState<LiveRatesState>({
    base: 'USD',
    rates: { ...DEFAULT_USD_EXCHANGE_RATES },
    lastUpdated: new Date().toISOString(),
    source: 'fallback',
    isFetching: false
  });

  // Active currency preview in editor & standalone modal
  const [editorPreviewCurrency, setEditorPreviewCurrency] = useState<string>('USD');
  const [standalonePreviewCurrency, setStandalonePreviewCurrency] = useState<string>('USD');

  // Form states for template builder
  const [templateName, setTemplateName] = useState('');
  const [targetSegment, setTargetSegment] = useState<InvoiceTemplate['targetSegment']>('Wholesale Buyers');
  const [paperSize, setPaperSize] = useState<InvoiceTemplate['paperSize']>('a4');
  const [isDefault, setIsDefault] = useState(false);

  // Branding
  const [storeDisplayName, setStoreDisplayName] = useState('');
  const [headerTagline, setHeaderTagline] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0f172a');
  const [accentColor, setAccentColor] = useState('#d97706');
  const [footerNote, setFooterNote] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');

  // Variable Fields
  const [varFields, setVarFields] = useState<InvoiceTemplateVariableFields>({
    showGSTIN: true,
    showCustomerPhone: true,
    showLoyaltyPoints: true,
    showUPIRef: true,
    showBarcodeQR: true,
    showItemTaxBreakdown: true,
    showItemDiscount: true,
    showPaymentSplitDetails: true,
    showInternationalTradeDetails: true,
    showDualCurrencySummary: true,
    customHeaderFieldLabel: '',
    customHeaderFieldValue: ''
  });

  // International Multi-Currency Settings
  const [intlSettings, setIntlSettings] = useState<InternationalTradeSettings>({
    primaryCurrency: 'USD',
    enableDualCurrency: true,
    secondaryCurrency: 'AED',
    fxSpreadPercentage: 0.5,
    showExchangeRateOnBill: true,
    showSwiftIban: true,
    swiftCode: 'ELLXUS33NYC',
    ibanNumber: 'US89 3000 1234 5678 9012 34',
    bankName: 'Global International Trade Bank NA',
    beneficiaryName: 'Ellic Global Supply Corp.',
    incoterms: 'CIF',
    portOfLoadingOrDischarge: 'Port of Nhava Sheva / Port of Rotterdam',
    countryOfOrigin: 'India',
    customsTariffHSN: 'HSN 0402.10.00 / 1509.10.00',
    vatTaxRegistrationNumber: 'EU-VAT-992384102'
  });

  // Load live exchange rates
  useEffect(() => {
    let isMounted = true;
    const loadRates = async () => {
      const live = await fetchLiveExchangeRates();
      if (isMounted) {
        setRatesState(live);
      }
    };
    loadRates();
    return () => {
      isMounted = false;
    };
  }, []);

  const segments = ['All', 'Wholesale Buyers', 'VIP / Corporate', 'Regular Retail', 'B2B Clients'];

  const filteredTemplates = invoiceTemplates.filter(t => {
    if (selectedSegment === 'All') return true;
    return t.targetSegment === selectedSegment;
  });

  const handleOpenCreateNew = (presetType?: 'wholesale' | 'standard') => {
    setEditingTemplate(null);
    if (presetType === 'wholesale') {
      setTemplateName('International Export Wholesale (USD / Multi-Currency)');
      setTargetSegment('Wholesale Buyers');
      setPaperSize('a4');
      setIsDefault(false);
      setStoreDisplayName('Ellic Global Trade & Wholesale Supply');
      setHeaderTagline('Cross-Border Supply Chain & International Distribution');
      setLogoUrl(LOGO_PRESETS[2].url);
      setPrimaryColor('#092340');
      setAccentColor('#2563eb');
      setFooterNote('International Trade Certified Bill. Payment via Telegraphic Transfer (T/T) or SWIFT Wire.');
      setTermsAndConditions('1. Standard Incoterms 2020 apply.\n2. FX rates benchmarked against Interbank Spot.\n3. Marine cargo insurance covered.');
      setVarFields({
        showGSTIN: true,
        showCustomerPhone: true,
        showLoyaltyPoints: false,
        showUPIRef: false,
        showBarcodeQR: true,
        showItemTaxBreakdown: true,
        showItemDiscount: true,
        showPaymentSplitDetails: false,
        showInternationalTradeDetails: true,
        showDualCurrencySummary: true,
        customHeaderFieldLabel: 'Bill of Lading / Export Ref',
        customHeaderFieldValue: 'EXP-GLB-2026-884'
      });
      setIntlSettings({
        primaryCurrency: 'USD',
        enableDualCurrency: true,
        secondaryCurrency: 'EUR',
        fxSpreadPercentage: 0.75,
        showExchangeRateOnBill: true,
        showSwiftIban: true,
        swiftCode: 'ELLXUS33NYC',
        ibanNumber: 'US89 3000 1234 5678 9012 34',
        bankName: 'Global International Trade Bank NA',
        beneficiaryName: 'Ellic Global Supply Corp.',
        incoterms: 'CIF',
        portOfLoadingOrDischarge: 'Port of Nhava Sheva / Port of Rotterdam',
        countryOfOrigin: 'India',
        customsTariffHSN: 'HSN 0402.10.00 / 1509.10.00',
        vatTaxRegistrationNumber: 'EU-VAT-992384102'
      });
      setEditorPreviewCurrency('USD');
    } else {
      setTemplateName('Custom Invoice Design');
      setTargetSegment('VIP / Corporate');
      setPaperSize('a4');
      setIsDefault(false);
      setStoreDisplayName(activeStore.name);
      setHeaderTagline('Curated Excellence & Premium Convenience');
      setLogoUrl(LOGO_PRESETS[0].url);
      setPrimaryColor('#0f172a');
      setAccentColor('#d97706');
      setFooterNote('Thank you for shopping with us! For support call +91 98765 43210.');
      setTermsAndConditions('1. Goods returnable within 7 days with valid bill.\n2. Warranty handled as per brand policy.');
      setVarFields({
        showGSTIN: true,
        showCustomerPhone: true,
        showLoyaltyPoints: true,
        showUPIRef: true,
        showBarcodeQR: true,
        showItemTaxBreakdown: true,
        showItemDiscount: true,
        showPaymentSplitDetails: true,
        showInternationalTradeDetails: false,
        showDualCurrencySummary: false,
        customHeaderFieldLabel: 'Client Tier',
        customHeaderFieldValue: 'VIP Gold Account'
      });
      setIntlSettings({
        primaryCurrency: 'INR',
        enableDualCurrency: false,
        secondaryCurrency: 'USD',
        fxSpreadPercentage: 0.5,
        showExchangeRateOnBill: false,
        showSwiftIban: false
      });
      setEditorPreviewCurrency('INR');
    }
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (tpl: InvoiceTemplate) => {
    setEditingTemplate(tpl);
    setTemplateName(tpl.name);
    setTargetSegment(tpl.targetSegment);
    setPaperSize(tpl.paperSize);
    setIsDefault(tpl.isDefault);
    setStoreDisplayName(tpl.branding.storeDisplayName || activeStore.name);
    setHeaderTagline(tpl.branding.headerTagline || '');
    setLogoUrl(tpl.branding.logoUrl || '');
    setPrimaryColor(tpl.branding.primaryColor || '#0f172a');
    setAccentColor(tpl.branding.accentColor || '#d97706');
    setFooterNote(tpl.branding.footerNote || '');
    setTermsAndConditions(tpl.branding.termsAndConditions || '');
    setVarFields({ ...tpl.variableFields });

    const intl = tpl.internationalSettings || {
      primaryCurrency: 'USD',
      enableDualCurrency: false,
      secondaryCurrency: 'EUR',
      fxSpreadPercentage: 0.5,
      showExchangeRateOnBill: true,
      showSwiftIban: false
    };
    setIntlSettings(intl);
    setEditorPreviewCurrency(intl.primaryCurrency || 'USD');
    setIsEditorOpen(true);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;

    const templateData = {
      name: templateName,
      targetSegment,
      paperSize,
      isDefault,
      branding: {
        storeDisplayName,
        headerTagline,
        logoUrl,
        primaryColor,
        accentColor,
        footerNote,
        termsAndConditions
      },
      variableFields: varFields,
      internationalSettings: intlSettings
    };

    if (editingTemplate) {
      updateInvoiceTemplate(editingTemplate.id, templateData);
    } else {
      addInvoiceTemplate(templateData);
    }

    setIsEditorOpen(false);
  };

  const handleDuplicate = (tpl: InvoiceTemplate) => {
    addInvoiceTemplate({
      name: `${tpl.name} (Copy)`,
      targetSegment: tpl.targetSegment,
      paperSize: tpl.paperSize,
      isDefault: false,
      branding: { ...tpl.branding },
      variableFields: { ...tpl.variableFields },
      internationalSettings: tpl.internationalSettings ? { ...tpl.internationalSettings } : undefined
    });
  };

  const handleApplyFxSettings = (applied: {
    primaryCurrency: string;
    secondaryCurrency: string;
    fxSpread: number;
  }) => {
    setIntlSettings(prev => ({
      ...prev,
      primaryCurrency: applied.primaryCurrency,
      secondaryCurrency: applied.secondaryCurrency,
      enableDualCurrency: true,
      fxSpreadPercentage: applied.fxSpread,
      showExchangeRateOnBill: true
    }));
    setVarFields(prev => ({
      ...prev,
      showDualCurrencySummary: true
    }));
    setEditorPreviewCurrency(applied.primaryCurrency);
  };

  // Calculation helper for invoice preview
  const getRenderedAmounts = (
    baseSubtotal: number,
    baseGrandTotal: number,
    displayCurrency: string,
    intl?: InternationalTradeSettings
  ) => {
    const primary = intl?.primaryCurrency || 'INR';
    const rateToDisplay = getExchangeRate(primary, displayCurrency, ratesState.rates, 0);

    const convertedSubtotal = baseSubtotal * rateToDisplay;
    const convertedGrandTotal = baseGrandTotal * rateToDisplay;

    // Dual Currency converted total
    let dualCurrencyText = '';
    let rateNotice = '';
    if (intl?.enableDualCurrency && intl.secondaryCurrency) {
      const secCurrency = intl.secondaryCurrency;
      const secRate = getExchangeRate(primary, secCurrency, ratesState.rates, intl.fxSpreadPercentage || 0);
      const secGrandTotal = baseGrandTotal * secRate;
      dualCurrencyText = `${formatCurrency(secGrandTotal, secCurrency, true)}`;
      rateNotice = `1 ${primary} = ${secRate.toFixed(4)} ${secCurrency} (Spot FX Ref)`;
    }

    return {
      convertedSubtotal,
      convertedGrandTotal,
      dualCurrencyText,
      rateNotice
    };
  };

  return (
    <div className="space-y-6">
      
      {/* Module Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Palette className="w-6 h-6 text-sky-400" />
            <h2 className="text-lg font-bold text-white">Invoice & Bill Design Templates</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/20 text-sky-300 border border-sky-500/30">
              Multi-Currency & POS
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
              <Globe className="w-3 h-3 text-blue-400" />
              Global FX Enabled
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Create custom invoice branding, thermal receipts, and real-time multi-currency export templates for international wholesale buyers.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* FX Converter Hub Toggle Button */}
          <button
            onClick={() => setShowFxHub(prev => !prev)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shadow-md ${
              showFxHub
                ? 'bg-blue-600 text-white border-blue-400 shadow-blue-600/20'
                : 'bg-slate-800 text-slate-200 hover:text-white border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Globe className="w-4 h-4 text-blue-400" />
            <span>{showFxHub ? 'Hide Currency Tool' : 'Real-Time Currency Tool'}</span>
          </button>

          <button
            onClick={() => handleOpenCreateNew('wholesale')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>+ Global Wholesale Template</span>
          </button>

          <button
            onClick={() => handleOpenCreateNew('standard')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white text-xs font-bold shadow-lg shadow-blue-600/25 flex items-center gap-1.5 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Template</span>
          </button>
        </div>
      </div>

      {/* Embedded Real-Time Currency Conversion Tool */}
      {showFxHub && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-200">
          <CurrencyConverterTool
            initialAmount={SAMPLE_INVOICE_DATA.grandTotal}
            initialBaseCurrency="USD"
            initialTargetCurrency="AED"
            onApplyToTemplate={applied => {
              handleOpenCreateNew('wholesale');
              handleApplyFxSettings(applied);
            }}
          />
        </div>
      )}

      {/* Segment Filter Bar */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-2">
          {segments.map(seg => (
            <button
              key={seg}
              onClick={() => setSelectedSegment(seg)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedSegment === seg
                  ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-blue-500/20'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              {seg}
            </button>
          ))}
        </div>

        {/* Real-time rates pulse info */}
        <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
          <RefreshCw className={`w-3 h-3 text-sky-400 ${ratesState.isFetching ? 'animate-spin' : ''}`} />
          <span>Spot Rates: <strong className="text-white">1 USD = ₹{ratesState.rates.INR?.toFixed(2)} / AED {ratesState.rates.AED?.toFixed(2)} / €{ratesState.rates.EUR?.toFixed(2)}</strong></span>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
        {filteredTemplates.map(tpl => {
          const isIntl = !!tpl.internationalSettings?.primaryCurrency && tpl.internationalSettings.primaryCurrency !== 'INR';
          const primaryCurr = tpl.internationalSettings?.primaryCurrency || 'INR';
          const secCurr = tpl.internationalSettings?.secondaryCurrency;
          const currObj = SUPPORTED_CURRENCIES[primaryCurr] || SUPPORTED_CURRENCIES.INR;

          return (
            <div
              key={tpl.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all group relative overflow-hidden"
            >
              {/* Top Accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: tpl.branding.primaryColor || '#0f172a' }}
              />

              <div className="space-y-3 pt-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {tpl.targetSegment}
                      </span>
                      {isIntl && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                          <span>{currObj.flag}</span>
                          <span>{primaryCurr}</span>
                          {secCurr && <span>/ {secCurr}</span>}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white mt-2 group-hover:text-sky-300 transition-colors">
                      {tpl.name}
                    </h3>
                  </div>

                  {tpl.isDefault ? (
                    <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[10px] font-extrabold flex items-center gap-1 border border-amber-500/30 shrink-0">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      Default
                    </span>
                  ) : (
                    <button
                      onClick={() => setDefaultInvoiceTemplate(tpl.id)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-300 text-[10px] font-semibold transition-colors shrink-0"
                    >
                      Set Default
                    </button>
                  )}
                </div>

                {/* Template Specs & Swatches */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span
                        className="w-4 h-4 rounded-full border border-slate-700 inline-block"
                        style={{ backgroundColor: tpl.branding.primaryColor }}
                        title={`Primary: ${tpl.branding.primaryColor}`}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-slate-700 inline-block"
                        style={{ backgroundColor: tpl.branding.accentColor }}
                        title={`Accent: ${tpl.branding.accentColor}`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">
                      {tpl.paperSize} Format
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-semibold">
                    Currency: <strong className="text-sky-400">{currObj.symbol} {primaryCurr}</strong>
                  </span>
                </div>

                {/* Variable Toggles summary */}
                <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-slate-400">
                  <div className="flex items-center gap-1">
                    <Check className={`w-3 h-3 ${tpl.variableFields.showGSTIN ? 'text-sky-400' : 'text-slate-600'}`} />
                    <span>Tax / GSTIN</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className={`w-3 h-3 ${tpl.internationalSettings?.enableDualCurrency ? 'text-blue-400' : 'text-slate-600'}`} />
                    <span>Dual-FX Total</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className={`w-3 h-3 ${tpl.internationalSettings?.showSwiftIban ? 'text-blue-400' : 'text-slate-600'}`} />
                    <span>SWIFT Wire</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className={`w-3 h-3 ${tpl.variableFields.showBarcodeQR ? 'text-sky-400' : 'text-slate-600'}`} />
                    <span>Verify QR</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setPreviewTemplate(tpl);
                    setStandalonePreviewCurrency(tpl.internationalSettings?.primaryCurrency || 'USD');
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                  <span>Preview</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicate(tpl)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                    title="Duplicate Template"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(tpl)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-sky-400"
                    title="Edit Design & FX Settings"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {invoiceTemplates.length > 1 && (
                    <button
                      onClick={() => deleteInvoiceTemplate(tpl.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                      title="Delete Template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Editor Modal: Full customization with Multi-Currency & Live Preview */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl max-h-[94vh] overflow-hidden shadow-2xl flex flex-col my-auto">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 shrink-0">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingTemplate ? `Edit Template: ${editingTemplate.name}` : 'Design Custom Invoice & Multi-Currency Template'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Configure visual layout, branding, global currency conversion, and international wire instructions.</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Controls & Live Preview Split */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-950">
              
              {/* Left Column: Customization Controls */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Section 1: Template Info */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4" />
                    <span>Template Setup & Target Segment</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Template Name *
                      </label>
                      <input
                        type="text"
                        value={templateName}
                        onChange={e => setTemplateName(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                        placeholder="e.g. Global Export Wholesale Proforma"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Target Customer Segment *
                      </label>
                      <select
                        value={targetSegment}
                        onChange={e => setTargetSegment(e.target.value as InvoiceTemplate['targetSegment'])}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                      >
                        <option value="Wholesale Buyers">Wholesale Buyers</option>
                        <option value="VIP / Corporate">VIP / Corporate</option>
                        <option value="Regular Retail">Regular Retail</option>
                        <option value="B2B Clients">B2B Clients</option>
                        <option value="All Segments">All Segments</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Paper Format
                      </label>
                      <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                        {(['a4', 'thermal', 'a5'] as const).map(fmt => (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => setPaperSize(fmt)}
                            className={`py-1 rounded text-[10px] font-extrabold uppercase transition-all ${
                              paperSize === fmt ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {fmt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                        <input
                          type="checkbox"
                          checked={isDefault}
                          onChange={e => setIsDefault(e.target.checked)}
                          className="accent-blue-500 rounded"
                        />
                        <span>Set as Default for {targetSegment}</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Section 2: International Multi-Currency & Cross-Border Wholesaler Engine */}
                <div className="p-4 rounded-xl bg-slate-900 border border-blue-500/30 space-y-4 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Globe className="w-4 h-4" />
                      <span>Multi-Currency & International Trade Engine</span>
                    </h4>
                    <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      Live FX Enabled
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Primary Billing Currency */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Primary Invoice Currency
                      </label>
                      <select
                        value={intlSettings.primaryCurrency}
                        onChange={e => {
                          const newPrimary = e.target.value;
                          setIntlSettings(prev => ({ ...prev, primaryCurrency: newPrimary }));
                          setEditorPreviewCurrency(newPrimary);
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer font-semibold"
                      >
                        {Object.values(SUPPORTED_CURRENCIES).map(curr => (
                          <option key={curr.code} value={curr.code}>
                            {curr.flag} {curr.code} - {curr.name} ({curr.symbol})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Secondary Dual Currency */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-300">
                          Secondary Dual-Currency Total
                        </label>
                        <label className="flex items-center gap-1 text-[10px] text-sky-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={intlSettings.enableDualCurrency}
                            onChange={e => setIntlSettings(prev => ({ ...prev, enableDualCurrency: e.target.checked }))}
                            className="accent-blue-500 rounded"
                          />
                          <span>Show Dual Total</span>
                        </label>
                      </div>
                      <select
                        disabled={!intlSettings.enableDualCurrency}
                        value={intlSettings.secondaryCurrency || 'AED'}
                        onChange={e => setIntlSettings(prev => ({ ...prev, secondaryCurrency: e.target.value }))}
                        className="w-full bg-slate-800 disabled:opacity-50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        {Object.values(SUPPORTED_CURRENCIES).map(curr => (
                          <option key={curr.code} value={curr.code}>
                            {curr.flag} {curr.code} - {curr.name} ({curr.symbol})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Spread & Exchange Rate Stamp */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Forex Hedging Margin / Spread Buffer: <strong className="text-white">+{intlSettings.fxSpreadPercentage || 0}%</strong>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="3"
                        step="0.1"
                        value={intlSettings.fxSpreadPercentage || 0}
                        onChange={e => setIntlSettings(prev => ({ ...prev, fxSpreadPercentage: Number(e.target.value) }))}
                        className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                    </div>

                    <div className="flex items-center pt-3">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                        <input
                          type="checkbox"
                          checked={intlSettings.showExchangeRateOnBill}
                          onChange={e => setIntlSettings(prev => ({ ...prev, showExchangeRateOnBill: e.target.checked }))}
                          className="accent-blue-500 rounded"
                        />
                        <span>Print Live FX Rate Stamp on Bill</span>
                      </label>
                    </div>
                  </div>

                  {/* International Wire Transfer / SWIFT / IBAN Section */}
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200">
                        <Landmark className="w-4 h-4 text-sky-400" />
                        <span>Include SWIFT Wire & Bank Settlement Details</span>
                        <input
                          type="checkbox"
                          checked={intlSettings.showSwiftIban}
                          onChange={e => setIntlSettings(prev => ({ ...prev, showSwiftIban: e.target.checked }))}
                          className="accent-blue-500 rounded ml-1"
                        />
                      </label>
                    </div>

                    {intlSettings.showSwiftIban && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                            SWIFT / BIC Code
                          </label>
                          <input
                            type="text"
                            value={intlSettings.swiftCode || ''}
                            onChange={e => setIntlSettings(prev => ({ ...prev, swiftCode: e.target.value }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono uppercase"
                            placeholder="e.g. ELLXUS33NYC"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                            IBAN / International Account Number
                          </label>
                          <input
                            type="text"
                            value={intlSettings.ibanNumber || ''}
                            onChange={e => setIntlSettings(prev => ({ ...prev, ibanNumber: e.target.value }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                            placeholder="e.g. US89 3000 1234 5678 9012 34"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                            Bank Name & Branch
                          </label>
                          <input
                            type="text"
                            value={intlSettings.bankName || ''}
                            onChange={e => setIntlSettings(prev => ({ ...prev, bankName: e.target.value }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                            placeholder="e.g. Global Trade Bank NA"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                            Incoterms 2020 (Delivery Term)
                          </label>
                          <select
                            value={intlSettings.incoterms || 'CIF'}
                            onChange={e => setIntlSettings(prev => ({ ...prev, incoterms: e.target.value }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white cursor-pointer"
                          >
                            {INCOTERMS_OPTIONS.map(inco => (
                              <option key={inco.code} value={inco.code}>
                                {inco.code} - {inco.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                            Port of Loading / Destination & Customs HSN
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={intlSettings.portOfLoadingOrDischarge || ''}
                              onChange={e => setIntlSettings(prev => ({ ...prev, portOfLoadingOrDischarge: e.target.value }))}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                              placeholder="Port of Origin / Discharge"
                            />
                            <input
                              type="text"
                              value={intlSettings.customsTariffHSN || ''}
                              onChange={e => setIntlSettings(prev => ({ ...prev, customsTariffHSN: e.target.value }))}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                              placeholder="HSN Tariff Code"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 3: Branding & Colors */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-4 h-4" />
                    <span>Branding, Logo & Color Styling</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Store Display Header Name
                      </label>
                      <input
                        type="text"
                        value={storeDisplayName}
                        onChange={e => setStoreDisplayName(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Header Tagline / Slogan
                      </label>
                      <input
                        type="text"
                        value={headerTagline}
                        onChange={e => setHeaderTagline(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                        placeholder="e.g. Cross-Border Supply & Wholesale"
                      />
                    </div>
                  </div>

                  {/* Logo Selection */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                      Brand Logo URL / Preset
                    </label>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={logoUrl}
                        onChange={e => setLogoUrl(e.target.value)}
                        placeholder="https://... logo image URL"
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                      {logoUrl && (
                        <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                          <img src={logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      <span className="text-[10px] text-slate-500 font-bold shrink-0">Presets:</span>
                      {LOGO_PRESETS.map((lp, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setLogoUrl(lp.url)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-semibold border border-slate-700 shrink-0"
                        >
                          {lp.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Palettes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Primary Color (Header / Titles)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={e => setPrimaryColor(e.target.value)}
                          className="w-8 h-8 rounded border border-slate-700 bg-slate-800 cursor-pointer p-0"
                        />
                        <input
                          type="text"
                          value={primaryColor}
                          onChange={e => setPrimaryColor(e.target.value)}
                          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Accent Color (Badges / Highlights)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={accentColor}
                          onChange={e => setAccentColor(e.target.value)}
                          className="w-8 h-8 rounded border border-slate-700 bg-slate-800 cursor-pointer p-0"
                        />
                        <input
                          type="text"
                          value={accentColor}
                          onChange={e => setAccentColor(e.target.value)}
                          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Color Presets */}
                  <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                    <span className="text-[10px] text-slate-500 font-bold shrink-0">Color Presets:</span>
                    {COLOR_PRESETS.map((cp, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setPrimaryColor(cp.primary);
                          setAccentColor(cp.accent);
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 border border-slate-700 hover:border-slate-500 text-[10px] text-slate-300 shrink-0"
                      >
                        <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: cp.primary }} />
                        <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: cp.accent }} />
                        <span>{cp.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Footer & Terms */}
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Footer Note / Customer Greeting
                      </label>
                      <input
                        type="text"
                        value={footerNote}
                        onChange={e => setFooterNote(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                        placeholder="Certified International Trade Tax Invoice."
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Terms & Conditions Notice
                      </label>
                      <textarea
                        rows={2}
                        value={termsAndConditions}
                        onChange={e => setTermsAndConditions(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 resize-none"
                        placeholder="1. Standard Incoterms apply. 2. Payments via SWIFT Wire."
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Variable Display Fields */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    <span>Variable Display Fields</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {[
                      { key: 'showGSTIN', label: 'Store GSTIN / Tax ID' },
                      { key: 'showCustomerPhone', label: 'Customer Phone' },
                      { key: 'showLoyaltyPoints', label: 'Loyalty Points' },
                      { key: 'showUPIRef', label: 'Wire / UPI Ref' },
                      { key: 'showBarcodeQR', label: 'Verification QR' },
                      { key: 'showItemTaxBreakdown', label: 'Itemized Tax/VAT' },
                      { key: 'showItemDiscount', label: 'Wholesale Discounts' },
                      { key: 'showPaymentSplitDetails', label: 'Payment Split' }
                    ].map(field => (
                      <label
                        key={field.key}
                        className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center gap-2 cursor-pointer hover:border-blue-500/50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={!!varFields[field.key as keyof InvoiceTemplateVariableFields]}
                          onChange={e => setVarFields(prev => ({ ...prev, [field.key]: e.target.checked }))}
                          className="accent-blue-500 rounded"
                        />
                        <span className="text-[11px] font-medium text-slate-300 line-clamp-1">{field.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Custom Field */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                        Custom Header Field Label
                      </label>
                      <input
                        type="text"
                        value={varFields.customHeaderFieldLabel || ''}
                        onChange={e => setVarFields(prev => ({ ...prev, customHeaderFieldLabel: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                        placeholder="e.g. Export Contract Ref"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                        Custom Field Default Value
                      </label>
                      <input
                        type="text"
                        value={varFields.customHeaderFieldValue || ''}
                        onChange={e => setVarFields(prev => ({ ...prev, customHeaderFieldValue: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                        placeholder="e.g. EXP-2026-X99"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Live Rendered Multi-Currency Invoice Preview */}
              <div className="lg:col-span-5 space-y-3 sticky top-0">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 flex-wrap gap-2">
                  <span className="flex items-center gap-1.5 text-sky-400">
                    <Sparkles className="w-4 h-4" />
                    <span>Real-Time Visual Preview</span>
                  </span>

                  {/* Preview Currency Switcher */}
                  <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                    <Globe className="w-3 h-3 text-blue-400" />
                    <select
                      value={editorPreviewCurrency}
                      onChange={e => setEditorPreviewCurrency(e.target.value)}
                      className="bg-transparent text-white font-bold text-[10px] focus:outline-none cursor-pointer"
                    >
                      {['USD', 'EUR', 'AED', 'SAR', 'GBP', 'INR', 'SGD', 'JPY', 'CAD', 'AUD'].map(c => (
                        <option key={c} value={c} className="bg-slate-900">
                          {c} ({SUPPORTED_CURRENCIES[c]?.symbol})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-2xl flex justify-center max-h-[78vh] overflow-y-auto">
                  {paperSize === 'thermal' ? (
                    /* Thermal Preview */
                    <div className="w-64 bg-white text-slate-900 p-4 rounded shadow-xl font-mono text-[10px] leading-snug">
                      <div className="text-center border-b border-dashed border-slate-400 pb-2 mb-2">
                        {logoUrl && (
                          <img src={logoUrl} alt="logo" className="h-8 mx-auto mb-1 object-contain" />
                        )}
                        <div className="font-bold text-xs uppercase" style={{ color: primaryColor }}>
                          {storeDisplayName || activeStore.name}
                        </div>
                        {headerTagline && (
                          <div className="text-[9px] text-slate-500 italic">{headerTagline}</div>
                        )}
                        {varFields.showGSTIN && (
                          <div className="text-[9px] font-semibold mt-0.5">GSTIN: {SAMPLE_INVOICE_DATA.gstin}</div>
                        )}
                      </div>

                      <div className="flex justify-between border-b border-dashed border-slate-400 pb-1 mb-2">
                        <span>{SAMPLE_INVOICE_DATA.invoiceNumber}</span>
                        <span>{SAMPLE_INVOICE_DATA.date.slice(11)}</span>
                      </div>

                      <div className="space-y-1 border-b border-dashed border-slate-400 pb-2 mb-2">
                        {SAMPLE_INVOICE_DATA.items.map((it, idx) => {
                          const rate = getExchangeRate('USD', editorPreviewCurrency, ratesState.rates, 0);
                          const convTotal = (it.total / 83.45) * rate; // Normalized sample
                          return (
                            <div key={idx} className="flex justify-between">
                              <span>{it.qty}x {it.name.slice(0, 18)}</span>
                              <span>{formatCurrency(convTotal, editorPreviewCurrency)}</span>
                            </div>
                          );
                        })}
                      </div>

                      {(() => {
                        const { convertedSubtotal, convertedGrandTotal, dualCurrencyText } =
                          getRenderedAmounts(15.4, 16.5, editorPreviewCurrency, intlSettings);
                        return (
                          <div className="space-y-0.5 text-right font-bold">
                            <div className="flex justify-between font-normal text-slate-600">
                              <span>Subtotal:</span>
                              <span>{formatCurrency(convertedSubtotal, editorPreviewCurrency)}</span>
                            </div>
                            <div className="flex justify-between text-xs font-black pt-1 border-t border-slate-800" style={{ color: primaryColor }}>
                              <span>TOTAL:</span>
                              <span>{formatCurrency(convertedGrandTotal, editorPreviewCurrency)}</span>
                            </div>
                            {dualCurrencyText && (
                              <div className="text-[9px] text-blue-700 font-bold pt-1">
                                Equiv: {dualCurrencyText}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {footerNote && (
                        <div className="text-center text-[9px] text-slate-600 mt-3 pt-2 border-t border-dashed border-slate-400">
                          {footerNote}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* A4 / A5 Layout Preview with Multi-Currency & International Trade */
                    <div className="w-full bg-white text-slate-900 p-5 rounded-lg shadow-xl border border-slate-300 font-sans text-xs">
                      
                      {/* Top Header */}
                      <div className="flex justify-between items-start border-b pb-3 mb-3" style={{ borderColor: primaryColor }}>
                        <div className="flex items-center gap-3">
                          {logoUrl && (
                            <img src={logoUrl} alt="Logo" className="w-10 h-10 object-cover rounded border border-slate-200" />
                          )}
                          <div>
                            <h2 className="text-base font-extrabold" style={{ color: primaryColor }}>
                              {storeDisplayName || activeStore.name}
                            </h2>
                            {headerTagline && (
                              <p className="text-[10px] text-slate-500 font-medium">{headerTagline}</p>
                            )}
                            {varFields.showGSTIN && (
                              <p className="text-[10px] font-semibold text-slate-700 mt-0.5">
                                GSTIN / TRN: {intlSettings.vatTaxRegistrationNumber || SAMPLE_INVOICE_DATA.gstin}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className="inline-block px-2 py-0.5 font-black text-[9px] uppercase rounded mb-1 text-white"
                            style={{ backgroundColor: accentColor }}
                          >
                            {targetSegment === 'Wholesale Buyers' ? 'INTERNATIONAL PROFORMA' : 'TAX INVOICE'}
                          </span>
                          <div className="font-bold text-slate-800 text-[11px]">#{SAMPLE_INVOICE_DATA.invoiceNumber}</div>
                          <div className="text-[10px] text-slate-500">{SAMPLE_INVOICE_DATA.date}</div>
                        </div>
                      </div>

                      {/* Custom Header Field if enabled */}
                      {varFields.customHeaderFieldLabel && (
                        <div className="bg-slate-50 p-2 rounded border border-slate-200 mb-3 flex justify-between text-[10px]">
                          <span className="font-bold text-slate-600">{varFields.customHeaderFieldLabel}:</span>
                          <span className="font-extrabold" style={{ color: accentColor }}>
                            {varFields.customHeaderFieldValue || 'N/A'}
                          </span>
                        </div>
                      )}

                      {/* Customer Info */}
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-200 mb-3 flex justify-between text-[11px]">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Billed Customer:</span>
                          <span className="font-bold text-slate-900">{SAMPLE_INVOICE_DATA.customerName}</span>
                          {varFields.showCustomerPhone && (
                            <span className="block text-slate-600 text-[10px]">{SAMPLE_INVOICE_DATA.customerPhone}</span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Payment / Settlement:</span>
                          <span className="font-bold text-blue-700">{SAMPLE_INVOICE_DATA.paymentMethod}</span>
                          {varFields.showUPIRef && (
                            <span className="block text-[9px] text-slate-500 font-mono">{SAMPLE_INVOICE_DATA.upiRef}</span>
                          )}
                        </div>
                      </div>

                      {/* Items Table */}
                      <table className="w-full text-[11px] text-left mb-3">
                        <thead>
                          <tr className="border-b text-slate-500 uppercase text-[9px] font-bold" style={{ borderColor: primaryColor }}>
                            <th className="py-1">Description / Item</th>
                            <th className="py-1 text-center">Qty</th>
                            <th className="py-1 text-right">Unit Price</th>
                            {varFields.showItemTaxBreakdown && <th className="py-1 text-right">Tax/VAT</th>}
                            <th className="py-1 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {SAMPLE_INVOICE_DATA.items.map((it, idx) => {
                            const rate = getExchangeRate('USD', editorPreviewCurrency, ratesState.rates, 0);
                            const unitPriceConv = (it.price / 83.45) * rate;
                            const totalConv = (it.total / 83.45) * rate;

                            return (
                              <tr key={idx}>
                                <td className="py-1.5 font-semibold text-slate-800">{it.name}</td>
                                <td className="py-1.5 text-center">{it.qty}</td>
                                <td className="py-1.5 text-right">{formatCurrency(unitPriceConv, editorPreviewCurrency)}</td>
                                {varFields.showItemTaxBreakdown && <td className="py-1.5 text-right text-slate-500">{it.taxRate}%</td>}
                                <td className="py-1.5 text-right font-bold">{formatCurrency(totalConv, editorPreviewCurrency)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {/* Summary with Multi-Currency Calculations */}
                      {(() => {
                        const { convertedSubtotal, convertedGrandTotal, dualCurrencyText, rateNotice } =
                          getRenderedAmounts(15.4, 16.5, editorPreviewCurrency, intlSettings);

                        return (
                          <div className="border-t border-slate-200 pt-2 space-y-2 text-[10px]">
                            <div className="flex justify-between items-end">
                              <div>
                                {varFields.showLoyaltyPoints && (
                                  <span className="text-blue-700 font-bold block">
                                    + {SAMPLE_INVOICE_DATA.loyaltyEarned} Rewards Credited
                                  </span>
                                )}
                                {intlSettings.showExchangeRateOnBill && rateNotice && (
                                  <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                                    💱 {rateNotice}
                                  </span>
                                )}
                              </div>
                              <div className="text-right space-y-0.5">
                                <div>Subtotal: {formatCurrency(convertedSubtotal, editorPreviewCurrency)}</div>
                                {varFields.showItemDiscount && (
                                  <div className="text-rose-600">Discount: -{formatCurrency(convertedSubtotal * 0.05, editorPreviewCurrency)}</div>
                                )}
                                <div className="text-xs font-black pt-1 border-t border-slate-300" style={{ color: primaryColor }}>
                                  Payable Total: {formatCurrency(convertedGrandTotal, editorPreviewCurrency)}
                                </div>
                              </div>
                            </div>

                            {/* Dual Currency Highlight Box on Invoice */}
                            {intlSettings.enableDualCurrency && dualCurrencyText && (
                              <div className="p-2 rounded bg-blue-50 border border-blue-200 flex justify-between items-center text-[10px]">
                                <span className="font-bold text-blue-900 flex items-center gap-1">
                                  <Globe className="w-3 h-3 text-blue-600" />
                                  <span>Dual-Currency Equivalent Total ({intlSettings.secondaryCurrency}):</span>
                                </span>
                                <span className="font-mono font-black text-blue-700 text-xs">
                                  {dualCurrencyText}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* International Wire Transfer & Incoterms Box */}
                      {intlSettings.showSwiftIban && (
                        <div className="mt-3 p-2 rounded bg-slate-50 border border-slate-200 text-[9px] text-slate-700 space-y-1">
                          <div className="flex justify-between font-bold text-slate-900 border-b border-slate-200 pb-1">
                            <span>International Wire Settlement:</span>
                            <span className="text-blue-700 font-mono">Incoterms: {intlSettings.incoterms || 'CIF'}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 pt-0.5">
                            <div>Bank: <strong>{intlSettings.bankName || 'Global Bank'}</strong></div>
                            <div>SWIFT/BIC: <strong className="font-mono">{intlSettings.swiftCode || 'ELLXUS33'}</strong></div>
                            <div className="col-span-2">IBAN: <strong className="font-mono">{intlSettings.ibanNumber || 'US89 3000...'}</strong></div>
                          </div>
                        </div>
                      )}

                      {/* Footer & QR */}
                      <div className="mt-4 pt-2 border-t border-dashed border-slate-300 flex items-center justify-between text-[9px]">
                        {varFields.showBarcodeQR && (
                          <div className="flex items-center gap-1.5">
                            <QrCode className="w-6 h-6 text-slate-800" />
                            <span className="text-slate-500 font-medium">Verify International Bill</span>
                          </div>
                        )}
                        {footerNote && (
                          <span className="text-slate-600 italic font-medium">{footerNote}</span>
                        )}
                      </div>

                      {termsAndConditions && (
                        <div className="mt-2 text-[8px] text-slate-400 border-t border-slate-100 pt-1 whitespace-pre-line">
                          {termsAndConditions}
                        </div>
                      )}

                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTemplate}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white text-xs font-bold shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all hover:scale-105"
              >
                <Check className="w-4 h-4" />
                <span>Save Design Template</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Standalone Preview Modal with Live Currency Switcher */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{previewTemplate.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    {previewTemplate.targetSegment}
                  </span>
                </h3>
              </div>

              {/* Dynamic Currency Switcher */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700 text-xs">
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  <select
                    value={standalonePreviewCurrency}
                    onChange={e => setStandalonePreviewCurrency(e.target.value)}
                    className="bg-slate-800 text-white font-bold text-xs focus:outline-none cursor-pointer"
                  >
                    {['USD', 'EUR', 'AED', 'SAR', 'GBP', 'INR', 'SGD', 'JPY', 'CAD', 'AUD'].map(c => (
                      <option key={c} value={c}>
                        {SUPPORTED_CURRENCIES[c]?.flag} {c} ({SUPPORTED_CURRENCIES[c]?.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-slate-950 p-6 rounded-xl flex justify-center max-h-[70vh] overflow-y-auto">
              <div className="w-full max-w-md bg-white text-slate-900 p-5 rounded-lg shadow-xl border border-slate-300 font-sans text-xs">
                
                {/* Header */}
                <div className="flex justify-between items-start border-b pb-3 mb-3" style={{ borderColor: previewTemplate.branding.primaryColor }}>
                  <div>
                    <h2 className="text-base font-extrabold" style={{ color: previewTemplate.branding.primaryColor }}>
                      {previewTemplate.branding.storeDisplayName || activeStore.name}
                    </h2>
                    {previewTemplate.branding.headerTagline && (
                      <p className="text-[10px] text-slate-500 font-medium">{previewTemplate.branding.headerTagline}</p>
                    )}
                  </div>
                  <span className="px-2 py-0.5 text-[9px] font-bold text-white rounded" style={{ backgroundColor: previewTemplate.branding.accentColor }}>
                    TAX INVOICE
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded mb-3 flex justify-between text-[11px]">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Billed Customer:</span>
                    <span className="font-bold text-slate-900">{SAMPLE_INVOICE_DATA.customerName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Currency:</span>
                    <span className="font-bold text-blue-700">{standalonePreviewCurrency}</span>
                  </div>
                </div>

                <table className="w-full text-[11px] text-left mb-3">
                  <thead>
                    <tr className="border-b text-slate-500 uppercase text-[9px] font-bold" style={{ borderColor: previewTemplate.branding.primaryColor }}>
                      <th className="py-1">Item</th>
                      <th className="py-1 text-center">Qty</th>
                      <th className="py-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_INVOICE_DATA.items.map((it, idx) => {
                      const rate = getExchangeRate('USD', standalonePreviewCurrency, ratesState.rates, 0);
                      const conv = (it.total / 83.45) * rate;
                      return (
                        <tr key={idx}>
                          <td className="py-1 font-semibold">{it.name}</td>
                          <td className="py-1 text-center">{it.qty}</td>
                          <td className="py-1 text-right font-bold">{formatCurrency(conv, standalonePreviewCurrency)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {(() => {
                  const { convertedGrandTotal, dualCurrencyText, rateNotice } =
                    getRenderedAmounts(15.4, 16.5, standalonePreviewCurrency, previewTemplate.internationalSettings);

                  return (
                    <div className="space-y-2">
                      <div className="border-t pt-2 flex justify-between items-center font-bold text-xs" style={{ color: previewTemplate.branding.primaryColor }}>
                        <span>Total Payable:</span>
                        <span>{formatCurrency(convertedGrandTotal, standalonePreviewCurrency)}</span>
                      </div>

                      {dualCurrencyText && (
                        <div className="p-2 rounded bg-blue-50 border border-blue-200 flex justify-between text-[10px] text-blue-900">
                          <span className="font-bold">Dual Currency ({previewTemplate.internationalSettings?.secondaryCurrency}):</span>
                          <span className="font-black">{dualCurrencyText}</span>
                        </div>
                      )}

                      {rateNotice && (
                        <div className="text-[9px] text-slate-500 font-mono text-right">
                          {rateNotice}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {previewTemplate.branding.footerNote && (
                  <div className="mt-4 pt-2 border-t border-dashed text-center text-[9px] text-slate-500">
                    {previewTemplate.branding.footerNote}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 bg-slate-800 text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
