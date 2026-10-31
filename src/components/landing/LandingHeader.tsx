import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, ShieldCheck, Cloud, LogIn, LayoutDashboard, Shield, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeToggle } from '../ThemeToggle';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { useAuth } from '../../context/AuthContext';
import { EllixConnectLogo } from '../branding/EllixConnectLogo';
import { normalizeCanonicalRole } from '../../types';

interface NavItem {
  name: string;
  href: string;
  id: string;
}

const navItems: NavItem[] = [];

interface LandingHeaderProps {
  onOpenSignIn?: () => void;
  onOpenGetStarted?: () => void;
  onOpenAppPreview?: () => void;
  onOpenGuide?: () => void;
  guideProgressStep?: number;
  guideCompleted?: boolean;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  onOpenSignIn,
  onOpenGetStarted,
  onOpenAppPreview,
  onOpenGuide,
  guideProgressStep,
  guideCompleted,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  // Handle scroll detection with requestAnimationFrame & layout caching for 60/120fps smoothness
  useEffect(() => {
    let rafId: number | null = null;
    let sectionBounds: Array<{ id: string; top: number; height: number }> = [];

    const measureSections = () => {
      sectionBounds = [];
      for (let i = 0; i < navItems.length; i++) {
        const item = navItems[i];
        const element = document.getElementById(item.id);
        if (element) {
          sectionBounds.push({
            id: item.id,
            top: element.offsetTop,
            height: element.offsetHeight,
          });
        }
      }
    };

    const handleScroll = () => {
      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        const currentScrollY = window.scrollY;

        // 1. Detect if scrolled past top (only update state if value actually changed)
        const nextScrolled = currentScrollY > 20;
        setIsScrolled((prev) => (prev !== nextScrolled ? nextScrolled : prev));

        // 2. Detect active section based on cached scroll offsets
        if (navItems.length === 0) return;

        if (currentScrollY < 180) {
          setActiveSection((prev) => (prev !== '' ? '' : prev));
          return;
        }

        if (sectionBounds.length === 0) {
          measureSections();
        }

        const scrollPosition = currentScrollY + 140;
        let matchedSection = '';
        for (let i = sectionBounds.length - 1; i >= 0; i--) {
          const bound = sectionBounds[i];
          if (scrollPosition >= bound.top && scrollPosition < bound.top + bound.height) {
            matchedSection = bound.id;
            break;
          }
        }
        setActiveSection((prev) => (prev !== matchedSection ? matchedSection : prev));
      });
    };

    measureSections();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', measureSections, { passive: true });
    handleScroll();
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', measureSections);
    };
  }, []);

  // Smooth scroll handler with header offset
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string, itemId?: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (itemId === 'guide' && onOpenGuide) {
      onOpenGuide();
      return;
    }

    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);

    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Update URL hash smoothly without jump
      window.history.pushState(null, '', href);
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] border-b relative ${
        isScrolled
          ? 'bg-white/95 dark:bg-slate-950/92 backdrop-blur-xl shadow-md border-slate-200/90 dark:border-slate-800/90'
          : 'bg-white/80 dark:bg-slate-950/75 backdrop-blur-md border-transparent'
      }`}
    >
      {/* Subtle brand gradient backdrop BEHIND the glass header for frosted refraction */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-600/10 via-teal-500/5 to-emerald-600/10 pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-[height] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isScrolled ? 'h-14 sm:h-[4.25rem]' : 'h-16 sm:h-20'
        }`}
      >
        
        {/* Brand Logo & Tagline */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-3 group cursor-pointer"
          aria-label="Ellic - Business management, without the complexity"
        >
          {/* Official Full Logo for desktop & tablet */}
          <div className="hidden sm:block">
            <EllixConnectLogo size="md" />
          </div>
          {/* Compact Symbol for small mobile */}
          <div className="sm:hidden flex items-center gap-2">
            <EllixConnectLogo variant="symbol" size={34} />
            <span className="font-extrabold text-base tracking-tight text-slate-950 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
              Ellic
            </span>
          </div>
        </a>

        {/* Desktop Navigation with Smooth Scroll & Active Indicator */}
        {navItems.length > 0 && (
          <nav className="hidden md:flex items-center gap-0.5 lg:gap-1.5 text-sm font-medium shrink-0">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              const isGuide = item.id === 'guide';
              return (
                <a
                  key={item.id}
                  href={item.href}
                  data-cursor="hover"
                  onClick={(e) => scrollToSection(e, item.href, item.id)}
                  className={`website-nav-hover relative px-2.5 lg:px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50/80 dark:bg-emerald-950/40'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span>{item.name}</span>
                  {isGuide && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      {guideCompleted
                        ? '✓'
                        : guideProgressStep && guideProgressStep > 0
                        ? `${guideProgressStep}/12`
                        : 'Tour'}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </a>
              );
            })}
          </nav>
        )}

        {/* Static Header Actions & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Support 24/7 Text Trigger */}
          <button
            type="button"
            id="btn-header-support-24-7"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-support-chat', { detail: { toggle: true } }));
            }}
            className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer whitespace-nowrap px-1.5 sm:px-2 py-1"
            title="24/7 Customer Support & Help"
          >
            Support 24/7
          </button>

          {/* Global Language Switcher */}
          <LanguageSwitcher variant="landing" />

          {/* Theme Toggle Button */}
          <div data-cursor="hover">
            <ThemeToggle id="btn-theme-toggle-header" />
          </div>

          {/* Desktop Auth Actions */}
          <div className="hidden md:flex items-center gap-2 lg:gap-2.5 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-2">
                {(() => {
                  const userCanonicalRole = normalizeCanonicalRole(userProfile?.role);
                  const isSuperAdmin = userCanonicalRole === 'super_admin';
                  const isEllixAdmin = userCanonicalRole === 'ellix_admin';
                  const isCustomer = userCanonicalRole === 'customer';
                  const roleLabel = isSuperAdmin
                    ? 'Super Admin'
                    : isEllixAdmin
                    ? 'Admin'
                    : isCustomer
                    ? 'Customer'
                    : userCanonicalRole === 'crew'
                    ? 'Store Crew'
                    : 'Store Owner';
                  const consoleButtonLabel = (isSuperAdmin || isEllixAdmin)
                    ? 'Admin Console'
                    : isCustomer
                    ? 'Customer Portal'
                    : 'Open Console';

                  return (
                    <>
                      <button
                        id="btn-nav-auth-user"
                        type="button"
                        data-cursor="hover"
                        onClick={onOpenSignIn}
                        className="website-btn-glow flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-left transition-all cursor-pointer group"
                      >
                        {currentUser.photoURL ? (
                          <img
                            src={currentUser.photoURL}
                            alt={currentUser.displayName || 'User'}
                            className="w-6 h-6 rounded-lg object-cover"
                          />
                        ) : (
                          <div className={`w-6 h-6 rounded-lg text-white text-[11px] font-bold flex items-center justify-center ${
                            isSuperAdmin ? 'bg-rose-600' : isEllixAdmin ? 'bg-sky-600' : isCustomer ? 'bg-emerald-600' : 'bg-indigo-600'
                          }`}>
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
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" title="Cloud Database Synced" />
                      </button>

                      {onOpenAppPreview && (
                        <button
                          id="btn-nav-open-console"
                          type="button"
                          data-cursor="hover"
                          onClick={onOpenAppPreview}
                          className="website-btn-glow px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg shadow-sm hover:shadow-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          <span>{consoleButtonLabel}</span>
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <>
                <button
                  id="btn-nav-signin"
                  type="button"
                  data-cursor="hover"
                  onClick={onOpenSignIn}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-[1.5px] active:scale-[0.98] cursor-pointer"
                >
                  Sign In
                </button>

                {onOpenAppPreview && (
                  <button
                    id="btn-nav-launch-preview"
                    type="button"
                    data-cursor="hover"
                    onClick={onOpenAppPreview}
                    className="website-btn-glow hidden xl:flex px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800/80 rounded-lg transition-all hover:border-emerald-500 hover:shadow-sm cursor-pointer items-center gap-1 whitespace-nowrap"
                    title="Explore interactive application demo on the website"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>App Demo</span>
                  </button>
                )}

                <button
                  id="btn-nav-getstarted"
                  type="button"
                  data-cursor="hover"
                  onClick={onOpenGetStarted}
                  className="website-btn-glow px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 active:bg-slate-950 rounded-lg shadow-sm hover:shadow-emerald-500/20 transition-all flex items-center gap-2 group cursor-pointer"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 text-emerald-400 dark:text-emerald-100 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </>
            )}
          </div>

          {/* Mobile menu toggle button */}
          <button
            id="btn-nav-mobile-toggle"
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </motion.div>

      {/* Mobile Drawer / Collapsible Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-slate-900/98 backdrop-blur-md px-4 pt-3 pb-6 space-y-4 shadow-xl overflow-hidden"
          >
            {navItems.length > 0 && (
              <div className="flex flex-col space-y-1 text-sm font-semibold">
                {navItems.map((item) => {
                  const isActive = activeSection === item.id;
                  const isGuide = item.id === 'guide';
                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      onClick={(e) => scrollToSection(e, item.href, item.id)}
                      className={`px-3 py-2.5 rounded-xl transition-colors flex items-center justify-between ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{item.name}</span>
                        {isGuide && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            {guideCompleted
                              ? 'Completed ✓'
                              : guideProgressStep && guideProgressStep > 0
                              ? `Step ${guideProgressStep}/12`
                              : '12-Step Tour'}
                          </span>
                        )}
                      </span>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                    </a>
                  );
                })}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
              {/* Mobile Support 24/7 Text Trigger */}
              <button
                type="button"
                id="btn-mobile-drawer-support-24-7"
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.dispatchEvent(new CustomEvent('open-support-chat', { detail: { toggle: true } }));
                }}
                className="w-full py-2.5 px-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center justify-between"
              >
                <span>Support 24/7</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">Live</span>
              </button>

              <div className="flex items-center justify-between py-1.5 px-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Theme</span>
                <ThemeToggle id="btn-theme-toggle-mobile" showLabel />
              </div>

              {currentUser && (() => {
                const userCanonicalRole = normalizeCanonicalRole(userProfile?.role);
                const isSuperAdmin = userCanonicalRole === 'super_admin';
                const isEllixAdmin = userCanonicalRole === 'ellix_admin';
                const isCustomer = userCanonicalRole === 'customer';
                const roleLabel = isSuperAdmin
                  ? 'Super Admin'
                  : isEllixAdmin
                  ? 'Admin'
                  : isCustomer
                  ? 'Customer'
                  : userCanonicalRole === 'crew'
                  ? 'Store Crew'
                  : 'Store Owner';

                return (
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <div className={`w-8 h-8 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0 ${
                      isSuperAdmin ? 'bg-rose-600' : isEllixAdmin ? 'bg-sky-600' : isCustomer ? 'bg-emerald-600' : 'bg-indigo-600'
                    }`}>
                      {(currentUser.displayName || currentUser.email || 'U').slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1 text-xs">
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {currentUser.displayName || 'Account'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{roleLabel}</span>
                        <span>·</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Cloud Synced</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {onOpenAppPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAppPreview();
                  }}
                  className="w-full py-2.5 text-center text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>
                    {(() => {
                      const userCanonicalRole = normalizeCanonicalRole(userProfile?.role);
                      if (userCanonicalRole === 'super_admin' || userCanonicalRole === 'ellix_admin') return 'Open Admin Console';
                      if (userCanonicalRole === 'customer') return 'Open Customer Portal';
                      return 'Open Merchant Console';
                    })()}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSignIn?.();
                }}
                className="w-full py-2.5 text-center text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                {currentUser ? 'Manage Account & Credentials' : 'Sign In'}
              </button>
              {!currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenGetStarted?.();
                  }}
                  className="w-full py-2.5 text-center text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 text-emerald-400 dark:text-emerald-100" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

