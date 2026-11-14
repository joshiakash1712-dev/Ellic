import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  LayoutDashboard,
  Receipt,
  Boxes,
  Users,
  BarChart3,
  MessageSquare,
  BookOpen,
  ShieldCheck,
  ShoppingBag,
  Shirt,
  Wrench,
  Truck,
  Zap,
  HelpCircle,
  PhoneCall,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeToggle } from '../ThemeToggle';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { useAuth } from '../../context/AuthContext';
import { EllixConnectLogo } from '../branding/EllixConnectLogo';
import { normalizeCanonicalRole } from '../../types';

interface LandingHeaderProps {
  onOpenSignIn?: () => void;
  onOpenGetStarted?: () => void;
  onOpenAppPreview?: () => void;
  onOpenGuide?: () => void;
  onOpenContact?: () => void;
  guideProgressStep?: number;
  guideCompleted?: boolean;
}

type DropdownId = 'product' | 'solutions' | 'support' | null;

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  onOpenSignIn,
  onOpenGetStarted,
  onOpenAppPreview,
  onOpenGuide,
  onOpenContact,
  guideProgressStep,
  guideCompleted,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState<DropdownId>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<DropdownId>(null);
  const [activeSection, setActiveSection] = useState<string>('');

  const headerRef = useRef<HTMLElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  // Track sections for scroll-spy active state
  useEffect(() => {
    let rafId: number | null = null;
    const sectionIds = ['features', 'workflow', 'solutions', 'who-its-for', 'pricing'];

    const handleScroll = () => {
      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        const currentScrollY = window.scrollY;
        setIsScrolled(currentScrollY > 20);

        if (currentScrollY < 180) {
          setActiveSection('');
          return;
        }

        const scrollPosition = currentScrollY + 160;
        let matched = '';

        for (let i = sectionIds.length - 1; i >= 0; i--) {
          const el = document.getElementById(sectionIds[i]);
          if (el) {
            const top = el.offsetTop;
            const height = el.offsetHeight;
            if (scrollPosition >= top && scrollPosition < top + height) {
              matched = sectionIds[i];
              if (matched === 'who-its-for') matched = 'solutions';
              break;
            }
          }
        }
        setActiveSection(matched);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Dropdown hover & keyboard management with grace timeout
  const handleMouseEnter = (dropdownId: DropdownId) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setActiveDropdown(dropdownId);
  };

  const handleMouseLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = window.setTimeout(() => {
      setActiveDropdown(null);
    }, 160);
  };

  const toggleDropdown = (dropdownId: DropdownId) => {
    setActiveDropdown((prev) => (prev === dropdownId ? null : dropdownId));
  };

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveDropdown(null);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Smooth scroll handler
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, targetId: string) => {
    e.preventDefault();
    setActiveDropdown(null);
    setMobileMenuOpen(false);

    const cleanId = targetId.replace('#', '');
    let el = document.getElementById(cleanId);
    if (!el && cleanId === 'solutions') {
      el = document.getElementById('who-its-for');
    }

    if (el) {
      const headerOffset = 80;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });

      try {
        window.history.pushState(null, '', `#${cleanId}`);
      } catch {
        // ignore history error
      }
    }
  };

  const handleTriggerSupportChat = () => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    window.dispatchEvent(new CustomEvent('open-support-chat', { detail: { toggle: true } }));
  };

  // Check current user role details
  const canonicalRole = normalizeCanonicalRole(userProfile?.role);
  const isSuperAdmin = canonicalRole === 'super_admin';
  const isEllixAdmin = canonicalRole === 'ellix_admin';
  const isCustomer = canonicalRole === 'customer';
  const isAdministrator = isSuperAdmin || isEllixAdmin;

  const roleLabel = isSuperAdmin
    ? 'Super Admin'
    : isEllixAdmin
    ? 'Admin'
    : isCustomer
    ? 'Customer'
    : canonicalRole === 'crew'
    ? 'Store Crew'
    : 'Store Owner';

  const consoleButtonLabel = isAdministrator
    ? 'Admin Console'
    : isCustomer
    ? 'Customer Portal'
    : 'Open Console';

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 w-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] border-b ${
        isScrolled
          ? 'bg-white/95 dark:bg-[#070B14]/95 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/30 border-slate-200/90 dark:border-slate-800/90'
          : 'bg-white/80 dark:bg-[#070B14]/75 backdrop-blur-md border-transparent'
      }`}
    >
      {/* Subtle brand refraction highlight behind the header */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-600/5 via-sky-500/5 to-cyan-500/5 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-[height] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isScrolled ? 'h-14 sm:h-[4.25rem]' : 'h-16 sm:h-20'
        }`}
      >
        {/* Brand Logo & Homepage Reset */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-3 group cursor-pointer shrink-0"
          aria-label="Ellic - Business management, without the complexity"
        >
          <div className="hidden sm:block">
            <EllixConnectLogo size="md" />
          </div>
          <div className="sm:hidden flex items-center gap-2">
            <EllixConnectLogo variant="symbol" size={32} />
            <span className="font-extrabold text-base tracking-tight text-slate-950 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
              Ellic
            </span>
          </div>
        </a>

        {/* Desktop Public SaaS Navigation */}
        <nav
          className="hidden lg:flex items-center gap-0.5 xl:gap-1.5 text-[13px] xl:text-sm font-medium shrink-0"
          aria-label="Public website navigation"
        >
          {/* 1. Product Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('product')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              id="nav-dropdown-product-btn"
              onClick={() => toggleDropdown('product')}
              aria-expanded={activeDropdown === 'product'}
              aria-haspopup="true"
              className={`px-2 xl:px-3 py-1.5 xl:py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer select-none whitespace-nowrap ${
                activeDropdown === 'product' || activeSection === 'features'
                  ? 'text-blue-600 dark:text-sky-400 bg-blue-50/80 dark:bg-sky-950/40 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
              }`}
            >
              <span>Product</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  activeDropdown === 'product' ? 'rotate-180 text-blue-600 dark:text-sky-400' : 'text-slate-400'
                }`}
              />
            </button>

            <AnimatePresence>
              {activeDropdown === 'product' && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-full left-0 mt-1.5 w-[380px] rounded-2xl bg-white/95 dark:bg-[#0c1222]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl p-2.5 z-50"
                  role="menu"
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/70 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                      Core Platform Modules
                    </span>
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-sky-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Sub-0.2s POS
                    </span>
                  </div>

                  <div className="py-1 space-y-0.5">
                    <a
                      href="#features"
                      role="menuitem"
                      onClick={(e) => scrollToSection(e, '#features')}
                      className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>Billing &amp; Thermal POS</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-sky-300 rounded font-normal">
                            Fast Scan
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          Optical barcode scanning, instant 58/80mm receipts, and UPI QR codes.
                        </p>
                      </div>
                    </a>

                    <a
                      href="#features"
                      role="menuitem"
                      onClick={(e) => scrollToSection(e, '#features')}
                      className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-cyan-500/10 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Boxes className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          Smart Inventory &amp; Stock Sync
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          Real-time deductions, batch FIFO tracking &amp; proactive restock alerts.
                        </p>
                      </div>
                    </a>

                    <a
                      href="#features"
                      role="menuitem"
                      onClick={(e) => scrollToSection(e, '#features')}
                      className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          Customer Khata &amp; Credit CRM
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          Credit limits, customer ledgers &amp; 1-click WhatsApp bill notifications.
                        </p>
                      </div>
                    </a>

                    <a
                      href="#features"
                      role="menuitem"
                      onClick={(e) => scrollToSection(e, '#features')}
                      className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          GST Schedules &amp; Audit Records
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          End-of-day Z-reports, GSTR-1 CSV exports &amp; cashier cash tallies.
                        </p>
                      </div>
                    </a>
                  </div>

                  {/* Dropdown Footer CTA */}
                  <div className="mt-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <a
                      href="#product"
                      onClick={(e) => scrollToSection(e, '#product')}
                      className="text-xs font-semibold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span>Live Counter Simulator</span>
                    </a>
                    <a
                      href="#workflow"
                      onClick={(e) => scrollToSection(e, '#workflow')}
                      className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-0.5"
                    >
                      <span>Full Flow</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 2. How It Works (Direct Smooth Scroll Link) */}
          <a
            href="#workflow"
            id="nav-link-how-it-works"
            onClick={(e) => scrollToSection(e, '#workflow')}
            className={`px-2 xl:px-3 py-1.5 xl:py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'workflow'
                ? 'text-blue-600 dark:text-sky-400 bg-blue-50/80 dark:bg-sky-950/40 font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
            }`}
          >
            How It Works
          </a>

          {/* 3. Solutions Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('solutions')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              id="nav-dropdown-solutions-btn"
              onClick={() => toggleDropdown('solutions')}
              aria-expanded={activeDropdown === 'solutions'}
              aria-haspopup="true"
              className={`px-2 xl:px-3 py-1.5 xl:py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer select-none whitespace-nowrap ${
                activeDropdown === 'solutions' || activeSection === 'solutions'
                  ? 'text-blue-600 dark:text-sky-400 bg-blue-50/80 dark:bg-sky-950/40 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
              }`}
            >
              <span>Solutions</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  activeDropdown === 'solutions' ? 'rotate-180 text-blue-600 dark:text-sky-400' : 'text-slate-400'
                }`}
              />
            </button>

            <AnimatePresence>
              {activeDropdown === 'solutions' && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-full left-0 mt-1.5 w-[360px] rounded-2xl bg-white/95 dark:bg-[#0c1222]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl p-2.5 z-50"
                  role="menu"
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/70">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                      Retail Segments &amp; Industry Presets
                    </span>
                  </div>

                  <div className="py-1 space-y-0.5">
                    <a
                      href="#solutions"
                      role="menuitem"
                      onClick={(e) => scrollToSection(e, '#solutions')}
                      className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          Supermarkets &amp; Kirana
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          High-volume barcode queues, FIFO batch expiry &amp; 4,000+ FMCG SKUs.
                        </p>
                      </div>
                    </a>

                    <a
                      href="#solutions"
                      role="menuitem"
                      onClick={(e) => scrollToSection(e, '#solutions')}
                      className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Shirt className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          Retail &amp; Fashion
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          Size &amp; color variant matrix, custom hang-tag barcodes &amp; seasonal discounts.
                        </p>
                      </div>
                    </a>

                    <a
                      href="#solutions"
                      role="menuitem"
                      onClick={(e) => scrollToSection(e, '#solutions')}
                      className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          Electronics &amp; Hardware
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          Item serial numbers, warranty recording &amp; statutory GST tax slabs.
                        </p>
                      </div>
                    </a>

                    <a
                      href="#solutions"
                      role="menuitem"
                      onClick={(e) => scrollToSection(e, '#solutions')}
                      className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          B2B Wholesalers &amp; Distributors
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          Bulk trade pricing tiers, customer credit enforcement &amp; e-invoices.
                        </p>
                      </div>
                    </a>
                  </div>

                  <div className="mt-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0" />
                    <span>Exclusively tailored for retail &amp; wholesale stores in India.</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 4. Pricing (Smooth Scroll to Pricing Section) */}
          <a
            href="#pricing"
            id="nav-link-pricing"
            onClick={(e) => scrollToSection(e, '#pricing')}
            className={`px-2 xl:px-3 py-1.5 xl:py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'pricing'
                ? 'text-blue-600 dark:text-sky-400 bg-blue-50/80 dark:bg-sky-950/40 font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
            }`}
          >
            Pricing
          </a>

          {/* 5. Support Dropdown (Houses Support 24/7, Help Desk, Guided Tour) */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('support')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              id="nav-dropdown-support-btn"
              onClick={() => toggleDropdown('support')}
              aria-expanded={activeDropdown === 'support'}
              aria-haspopup="true"
              className={`px-2 xl:px-3 py-1.5 xl:py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer select-none whitespace-nowrap ${
                activeDropdown === 'support'
                  ? 'text-blue-600 dark:text-sky-400 bg-blue-50/80 dark:bg-sky-950/40 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
              }`}
            >
              <span>Support</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  activeDropdown === 'support' ? 'rotate-180 text-blue-600 dark:text-sky-400' : 'text-slate-400'
                }`}
              />
            </button>

            <AnimatePresence>
              {activeDropdown === 'support' && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-full right-0 mt-1.5 w-[330px] rounded-2xl bg-white/95 dark:bg-[#0c1222]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl p-2.5 z-50"
                  role="menu"
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/70 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                      Merchant Support
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-sky-400">
                      Live 24/7
                    </span>
                  </div>

                  <div className="py-1 space-y-0.5">
                    {/* Integrated Support 24/7 Live Trigger */}
                    <button
                      type="button"
                      id="dropdown-item-support-chat"
                      role="menuitem"
                      onClick={handleTriggerSupportChat}
                      className="w-full text-left group flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>Support 24/7</span>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/20">
                            Instant
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          Direct live chat for hardware, bills, or software questions.
                        </p>
                      </div>
                    </button>

                    {/* Merchant Help Desk / Contact Modal */}
                    {onOpenContact && (
                      <button
                        type="button"
                        id="dropdown-item-contact"
                        role="menuitem"
                        onClick={() => {
                          setActiveDropdown(null);
                          onOpenContact();
                        }}
                        className="w-full text-left group flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                          <PhoneCall className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-slate-900 dark:text-white">
                            Contact Onboarding Desk
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            Schedule a walkthrough or request counter hardware setup.
                          </p>
                        </div>
                      </button>
                    )}

                    {/* Interactive Guided Tour */}
                    {onOpenGuide && (
                      <button
                        type="button"
                        id="dropdown-item-guide"
                        role="menuitem"
                        onClick={() => {
                          setActiveDropdown(null);
                          onOpenGuide();
                        }}
                        className="w-full text-left group flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>12-Step Product Tour</span>
                            {guideCompleted ? (
                              <span className="text-[10px] text-emerald-600 font-bold">Done ✓</span>
                            ) : guideProgressStep && guideProgressStep > 0 ? (
                              <span className="text-[10px] text-blue-600 font-bold">{guideProgressStep}/12</span>
                            ) : null}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            Interactive visual walkthrough of counter operations.
                          </p>
                        </div>
                      </button>
                    )}

                    {/* Frequently Asked Questions */}
                    <a
                      href="#faq"
                      id="dropdown-item-faq"
                      role="menuitem"
                      onClick={(e) => scrollToSection(e, '#faq')}
                      className="w-full text-left group flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          Frequently Asked Questions
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          Hardware, thermal printers, offline mode &amp; GST filing.
                        </p>
                      </div>
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Header Right Actions (Language, Theme, and Conditional Auth/Admin) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Language Switcher */}
          <LanguageSwitcher variant="landing" />

          {/* Theme Toggle Button */}
          <div data-cursor="hover">
            <ThemeToggle id="btn-theme-toggle-header" />
          </div>

          {/* Tablet Quick Action (sm to lg) */}
          <div className="hidden sm:flex lg:hidden items-center gap-2 shrink-0">
            {currentUser ? (
              onOpenAppPreview && (
                <button
                  type="button"
                  data-cursor="hover"
                  onClick={onOpenAppPreview}
                  className="website-btn-glow px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>{consoleButtonLabel}</span>
                </button>
              )
            ) : (
              <button
                type="button"
                data-cursor="hover"
                onClick={onOpenGetStarted}
                className="website-btn-glow px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Desktop Auth State Handling (lg and above so 1024px & 125%-150% zoom stay clean) */}
          <div className="hidden lg:flex items-center gap-1.5 xl:gap-2.5 shrink-0">
            {currentUser ? (
              /* Authenticated User: Shows Profile & Respective Console (Admin Console strictly authenticated) */
              <div className="flex items-center gap-2">
                <button
                  id="btn-nav-auth-user"
                  type="button"
                  data-cursor="hover"
                  onClick={onOpenSignIn}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-left transition-all cursor-pointer group"
                  title="Manage account & session"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      className="w-6 h-6 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className={`w-6 h-6 rounded-lg text-white text-[11px] font-bold flex items-center justify-center ${
                        isSuperAdmin
                          ? 'bg-rose-600'
                          : isEllixAdmin
                          ? 'bg-blue-600'
                          : isCustomer
                          ? 'bg-emerald-600'
                          : 'bg-indigo-600'
                      }`}
                    >
                      {(currentUser.displayName || currentUser.email || 'U').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] truncate leading-tight">
                      {currentUser.displayName || 'Account'}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                      {roleLabel}
                    </span>
                  </div>
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"
                    title="Active Cloud Session"
                  />
                </button>

                {onOpenAppPreview && (
                  <button
                    id="btn-nav-open-console"
                    type="button"
                    data-cursor="hover"
                    onClick={onOpenAppPreview}
                    className="website-btn-glow px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 rounded-xl shadow-sm hover:shadow-blue-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>{consoleButtonLabel}</span>
                  </button>
                )}
              </div>
            ) : (
              /* Public / Unauthenticated Visitor: Strictly Public SaaS Actions (NO admin buttons) */
              <>
                <button
                  id="btn-nav-signin"
                  type="button"
                  data-cursor="hover"
                  onClick={onOpenSignIn}
                  className="px-2.5 xl:px-3.5 py-1.5 xl:py-2 text-[13px] xl:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                >
                  Sign In
                </button>

                <button
                  id="btn-nav-getstarted"
                  type="button"
                  data-cursor="hover"
                  onClick={onOpenGetStarted}
                  className="website-btn-glow px-3 xl:px-5 py-1.5 xl:py-2 text-[13px] xl:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center gap-1.5 group cursor-pointer whitespace-nowrap"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5 text-sky-200 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </>
            )}
          </div>

          {/* Mobile/Tablet Menu Toggle Button */}
          <button
            id="btn-nav-mobile-toggle"
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer shrink-0"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.div>

      {/* Mobile & Tablet Drawer / Collapsible Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-[#070B14]/98 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-3 shadow-2xl max-h-[85vh] overflow-y-auto"
          >
            {/* Mobile Navigation List */}
            <div className="flex flex-col space-y-1 text-sm font-semibold">
              {/* Product Accordion */}
              <div>
                <button
                  type="button"
                  onClick={() =>
                    setMobileAccordion((prev) => (prev === 'product' ? null : 'product'))
                  }
                  className="w-full px-3 py-2.5 rounded-xl transition-colors flex items-center justify-between text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span>Product</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      mobileAccordion === 'product' ? 'rotate-180 text-blue-600 dark:text-sky-400' : 'text-slate-400'
                    }`}
                  />
                </button>
                {mobileAccordion === 'product' && (
                  <div className="pl-3 pr-2 py-1 space-y-1 text-xs">
                    <a
                      href="#features"
                      onClick={(e) => scrollToSection(e, '#features')}
                      className="block px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Billing &amp; Thermal POS
                    </a>
                    <a
                      href="#features"
                      onClick={(e) => scrollToSection(e, '#features')}
                      className="block px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Smart Inventory &amp; Stock Sync
                    </a>
                    <a
                      href="#features"
                      onClick={(e) => scrollToSection(e, '#features')}
                      className="block px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Khata CRM &amp; Digital Ledgers
                    </a>
                    <a
                      href="#product"
                      onClick={(e) => scrollToSection(e, '#product')}
                      className="block px-3 py-2 rounded-lg text-blue-600 dark:text-sky-400 font-medium"
                    >
                      Live Counter Simulator →
                    </a>
                  </div>
                )}
              </div>

              {/* How It Works Link */}
              <a
                href="#workflow"
                onClick={(e) => scrollToSection(e, '#workflow')}
                className={`px-3 py-2.5 rounded-xl transition-colors flex items-center justify-between ${
                  activeSection === 'workflow'
                    ? 'bg-blue-50 dark:bg-sky-950/60 text-blue-600 dark:text-sky-400 font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>How It Works</span>
                <span className="text-xs text-slate-400">Workflow</span>
              </a>

              {/* Solutions Accordion */}
              <div>
                <button
                  type="button"
                  onClick={() =>
                    setMobileAccordion((prev) => (prev === 'solutions' ? null : 'solutions'))
                  }
                  className="w-full px-3 py-2.5 rounded-xl transition-colors flex items-center justify-between text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span>Solutions</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      mobileAccordion === 'solutions' ? 'rotate-180 text-blue-600 dark:text-sky-400' : 'text-slate-400'
                    }`}
                  />
                </button>
                {mobileAccordion === 'solutions' && (
                  <div className="pl-3 pr-2 py-1 space-y-1 text-xs">
                    <a
                      href="#solutions"
                      onClick={(e) => scrollToSection(e, '#solutions')}
                      className="block px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Supermarkets &amp; Kirana
                    </a>
                    <a
                      href="#solutions"
                      onClick={(e) => scrollToSection(e, '#solutions')}
                      className="block px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Retail &amp; Fashion
                    </a>
                    <a
                      href="#solutions"
                      onClick={(e) => scrollToSection(e, '#solutions')}
                      className="block px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Electronics &amp; Hardware
                    </a>
                    <a
                      href="#solutions"
                      onClick={(e) => scrollToSection(e, '#solutions')}
                      className="block px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      B2B Wholesalers &amp; Distributors
                    </a>
                  </div>
                )}
              </div>

              {/* Pricing Link */}
              <a
                href="#pricing"
                onClick={(e) => scrollToSection(e, '#pricing')}
                className={`px-3 py-2.5 rounded-xl transition-colors flex items-center justify-between ${
                  activeSection === 'pricing'
                    ? 'bg-blue-50 dark:bg-sky-950/60 text-blue-600 dark:text-sky-400 font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>Pricing</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">14-Day Free</span>
              </a>

              {/* Support Accordion */}
              <div>
                <button
                  type="button"
                  onClick={() =>
                    setMobileAccordion((prev) => (prev === 'support' ? null : 'support'))
                  }
                  className="w-full px-3 py-2.5 rounded-xl transition-colors flex items-center justify-between text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span className="flex items-center gap-1.5">
                    <span>Support</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      mobileAccordion === 'support' ? 'rotate-180 text-blue-600 dark:text-sky-400' : 'text-slate-400'
                    }`}
                  />
                </button>
                {mobileAccordion === 'support' && (
                  <div className="pl-3 pr-2 py-1 space-y-1 text-xs">
                    <button
                      type="button"
                      onClick={handleTriggerSupportChat}
                      className="w-full text-left px-3 py-2 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold flex items-center justify-between"
                    >
                      <span>Support 24/7 Live Chat</span>
                      <span className="text-[10px] font-mono">Active</span>
                    </button>
                    {onOpenContact && (
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onOpenContact();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Contact Merchant Desk
                      </button>
                    )}
                    {onOpenGuide && (
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onOpenGuide();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Interactive 12-Step Tour
                      </button>
                    )}
                    <a
                      href="#faq"
                      onClick={(e) => scrollToSection(e, '#faq')}
                      className="block px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Frequently Asked Questions (FAQ)
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Footer Area */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2.5">
              <div className="flex items-center justify-between py-1.5 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Theme</span>
                <ThemeToggle id="btn-theme-toggle-mobile" showLabel />
              </div>

              {/* Authenticated User Info */}
              {currentUser && (
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div
                    className={`w-8 h-8 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0 ${
                      isSuperAdmin
                        ? 'bg-rose-600'
                        : isEllixAdmin
                        ? 'bg-blue-600'
                        : isCustomer
                        ? 'bg-emerald-600'
                        : 'bg-indigo-600'
                    }`}
                  >
                    {(currentUser.displayName || currentUser.email || 'U').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1 text-xs">
                    <div className="font-bold text-slate-900 dark:text-white truncate">
                      {currentUser.displayName || 'Account'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                      <span className="font-semibold text-blue-600 dark:text-sky-400">{roleLabel}</span>
                      <span>·</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Online</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Open Console for Authenticated User */}
              {currentUser && onOpenAppPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAppPreview();
                  }}
                  className="w-full py-2.5 text-center text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{consoleButtonLabel}</span>
                </button>
              )}

              {/* Sign In & Get Started for Unauthenticated */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSignIn?.();
                }}
                className="w-full py-2.5 text-center text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                {currentUser ? 'Manage Account Credentials' : 'Sign In'}
              </button>

              {!currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenGetStarted?.();
                  }}
                  className="w-full py-2.5 text-center text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-500/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 text-sky-200" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
