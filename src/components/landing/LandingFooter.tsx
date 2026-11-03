import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { EllixConnectLogo } from '../branding/EllixConnectLogo';
import {
  LEGAL_CONFIG,
  LegalPageSlug,
  isConfiguredLegalValue,
} from '../../config/legal.config';

interface LandingFooterProps {
  onOpenSignIn?: () => void;
  onOpenContact?: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  onOpenLegalPage?: (slug: LegalPageSlug) => void;
  onOpenAiMetadata?: () => void;
  onOpenGuide?: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  onOpenSignIn,
  onOpenContact,
  onOpenPrivacy,
  onOpenTerms,
  onOpenLegalPage,
  onOpenAiMetadata,
  onOpenGuide,
}) => {
  const handleLegalClick = (slug: LegalPageSlug) => {
    if (onOpenLegalPage) {
      onOpenLegalPage(slug);
      return;
    }
    if (slug === 'privacy-policy' && onOpenPrivacy) {
      onOpenPrivacy();
      return;
    }
    if (slug === 'terms-of-service' && onOpenTerms) {
      onOpenTerms();
    }
  };

  const hasBusinessName = isConfiguredLegalValue(LEGAL_CONFIG.legalBusinessName);
  const hasBusinessAddress = isConfiguredLegalValue(LEGAL_CONFIG.businessAddress);
  const hasSupportEmail = isConfiguredLegalValue(LEGAL_CONFIG.supportEmail);
  const hasSupportPhone = isConfiguredLegalValue(LEGAL_CONFIG.supportPhone);
  const hasGstin = isConfiguredLegalValue(LEGAL_CONFIG.gstin);

  const hasAnyConfiguredBusinessInfo =
    hasBusinessName || hasBusinessAddress || hasSupportEmail || hasSupportPhone || hasGstin;

  return (
    <footer className="bg-slate-100/90 dark:bg-slate-950 border-t-2 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 md:py-16">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-8 sm:gap-6 lg:gap-10">
          
          {/* Col 1 & 2: Brand & Tagline */}
          <div className="sm:col-span-2 space-y-3 sm:space-y-4">
            <div className="flex items-center gap-3">
              <EllixConnectLogo size="sm" alt="Ellic Official Logo" />
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <div className="font-bold text-slate-950 dark:text-white text-sm">
                {LEGAL_CONFIG.brandName}
              </div>
              <p className="text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed text-xs sm:text-sm">
                Business management, without the complexity.
              </p>
            </div>

            <div className="flex items-start sm:items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs pt-1">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0 mt-0.5 sm:mt-0" />
              <span>Designed for retail stores, supermarkets &amp; wholesalers in India (excluding restaurants).</span>
            </div>
          </div>

          {/* Col 3: Product */}
          <div className="space-y-3">
            <div className="font-bold text-slate-950 dark:text-white uppercase tracking-wider text-[11px]">
              Product
            </div>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400">
              <li>
                <a href="#features" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#guide"
                  onClick={(e) => {
                    if (onOpenGuide) {
                      e.preventDefault();
                      onOpenGuide();
                    }
                  }}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors"
                >
                  Guide
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenContact}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors text-left cursor-pointer"
                >
                  Contact
                </button>
              </li>
              {onOpenSignIn && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenSignIn}
                    className="hover:text-slate-950 dark:hover:text-white transition-colors text-left cursor-pointer"
                  >
                    Sign In
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Col 4: Legal */}
          <div className="space-y-3">
            <div className="font-bold text-slate-950 dark:text-white uppercase tracking-wider text-[11px]">
              Legal
            </div>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => handleLegalClick('privacy-policy')}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors text-left cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleLegalClick('terms-of-service')}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors text-left cursor-pointer"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleLegalClick('cancellation-refund-policy')}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors text-left cursor-pointer"
                >
                  Cancellation &amp; Refund Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleLegalClick('cookie-policy')}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors text-left cursor-pointer"
                >
                  Cookie Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleLegalClick('data-privacy-rights')}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors text-left cursor-pointer"
                >
                  Data &amp; Privacy Rights
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleLegalClick('security')}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors text-left cursor-pointer"
                >
                  Security
                </button>
              </li>
            </ul>
          </div>

          {/* Col 5: Support */}
          <div className="space-y-3">
            <div className="font-bold text-slate-950 dark:text-white uppercase tracking-wider text-[11px]">
              Support
            </div>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => handleLegalClick('support')}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors text-left cursor-pointer"
                >
                  Help / Support
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenContact}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors text-left cursor-pointer"
                >
                  Contact Support
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleLegalClick('grievance-redressal')}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors text-left cursor-pointer"
                >
                  Grievance Redressal
                </button>
              </li>
              {onOpenAiMetadata && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenAiMetadata}
                    className="text-blue-700 dark:text-sky-400 hover:text-blue-800 dark:hover:text-sky-300 font-medium transition-colors text-left cursor-pointer"
                  >
                    AI &amp; Crawler Spec
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Col 6: Business Information (Dynamically rendered from LEGAL_CONFIG) */}
          <div className="space-y-3">
            <div className="font-bold text-slate-950 dark:text-white uppercase tracking-wider text-[11px]">
              Business Information
            </div>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400">
              {LEGAL_CONFIG.legalBusinessName && (
                <li className="font-semibold text-slate-900 dark:text-slate-200">
                  {LEGAL_CONFIG.legalBusinessName}
                </li>
              )}
              {LEGAL_CONFIG.businessAddress && (
                <li className="leading-relaxed">
                  {LEGAL_CONFIG.businessAddress}
                </li>
              )}
              {LEGAL_CONFIG.supportEmail && (
                <li>
                  {hasSupportEmail ? (
                    <a
                      href={`mailto:${LEGAL_CONFIG.supportEmail}`}
                      className="hover:text-slate-950 dark:hover:text-white transition-colors break-all"
                    >
                      {LEGAL_CONFIG.supportEmail}
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={onOpenContact}
                      className="hover:text-slate-950 dark:hover:text-white transition-colors break-all text-left cursor-pointer"
                    >
                      {LEGAL_CONFIG.supportEmail}
                    </button>
                  )}
                </li>
              )}
              {LEGAL_CONFIG.supportPhone && (
                <li>
                  {hasSupportPhone ? (
                    <a
                      href={`tel:${LEGAL_CONFIG.supportPhone}`}
                      className="hover:text-slate-950 dark:hover:text-white transition-colors"
                    >
                      {LEGAL_CONFIG.supportPhone}
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={onOpenContact}
                      className="hover:text-slate-950 dark:hover:text-white transition-colors text-left cursor-pointer"
                    >
                      {LEGAL_CONFIG.supportPhone}
                    </button>
                  )}
                </li>
              )}
              {LEGAL_CONFIG.gstin && (
                <li className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  GSTIN: {LEGAL_CONFIG.gstin}
                </li>
              )}
            </ul>
          </div>

        </div>

        {/* Bottom Copyright & Legal Links Row */}
        <div className="pt-6 sm:pt-8 mt-8 sm:mt-12 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-[11px] text-slate-500 dark:text-slate-400 text-center sm:text-left">
          <div>
            © 2026 {LEGAL_CONFIG.brandName}. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-2 sm:gap-6">
            <button
              type="button"
              data-cursor="hover"
              onClick={() => handleLegalClick('privacy-policy')}
              className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              data-cursor="hover"
              onClick={() => handleLegalClick('terms-of-service')}
              className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              type="button"
              data-cursor="hover"
              onClick={() => handleLegalClick('data-privacy-rights')}
              className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Data &amp; Privacy Rights
            </button>
            <button
              type="button"
              data-cursor="hover"
              onClick={() => handleLegalClick('grievance-redressal')}
              className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Grievance Redressal
            </button>
            <button
              type="button"
              data-cursor="hover"
              onClick={onOpenContact}
              className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Contact
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
