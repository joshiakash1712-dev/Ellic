import React, { useState } from 'react';
import { MarketingModal } from './MarketingModal';
import { EllixConnectLogo } from '../../branding/EllixConnectLogo';
import { Mail, Phone, Clock, CheckCircle2, Send, Scale, Building2, ShieldAlert } from 'lucide-react';
import {
  LEGAL_CONFIG,
  LegalPageSlug,
  isConfiguredLegalValue,
  recordConsentAudit,
} from '../../../config/legal.config';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLegalPage?: (slug: LegalPageSlug) => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  onOpenLegalPage,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [sentNotice, setSentNotice] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentChecked) return;
    recordConsentAudit({
      context: 'contact_support',
      subjectIdentifier: email.trim(),
      purposeSummary: 'Consent to process contact inquiry details for merchant support follow-up',
    });
    setSentNotice(true);
  };

  const hasSupportEmail = isConfiguredLegalValue(LEGAL_CONFIG.supportEmail);
  const hasSupportPhone = isConfiguredLegalValue(LEGAL_CONFIG.supportPhone);

  return (
    <MarketingModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Contact ${LEGAL_CONFIG.brandName}`}
      subtitle="Have questions about POS setup, billing workflows, or account support? We're here to help."
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        {/* Brand Logo Header */}
        <div className="flex justify-center pb-1">
          <EllixConnectLogo size="sm" />
        </div>

        {/* Contact Info Cards (Dynamically rendered from LEGAL_CONFIG) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
            <div className="w-8 h-8 mx-auto rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-400 flex items-center justify-center mb-2">
              <Mail className="w-4 h-4" />
            </div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Support Email
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 break-words">
              {hasSupportEmail ? (
                <a href={`mailto:${LEGAL_CONFIG.supportEmail}`} className="hover:underline">
                  {LEGAL_CONFIG.supportEmail}
                </a>
              ) : (
                LEGAL_CONFIG.supportEmail
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
            <div className="w-8 h-8 mx-auto rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 flex items-center justify-center mb-2">
              <Phone className="w-4 h-4" />
            </div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Support Phone
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 break-words">
              {hasSupportPhone ? (
                <a href={`tel:${LEGAL_CONFIG.supportPhone}`} className="hover:underline">
                  {LEGAL_CONFIG.supportPhone}
                </a>
              ) : (
                LEGAL_CONFIG.supportPhone
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
            <div className="w-8 h-8 mx-auto rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 flex items-center justify-center mb-2">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Privacy Contact
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 break-words">
              {LEGAL_CONFIG.privacyEmail}
            </div>
          </div>
        </div>

        {/* Registered Business & Grievance Contact Particulars from LEGAL_CONFIG */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0" />
            <span>Business &amp; Grievance Contact Details</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
            <div>
              <span className="font-semibold text-slate-500 dark:text-slate-400">Legal Entity: </span>
              <span>{LEGAL_CONFIG.legalBusinessName}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500 dark:text-slate-400">GSTIN: </span>
              <span className="font-mono">{LEGAL_CONFIG.gstin}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Registered Address: </span>
              <span>{LEGAL_CONFIG.businessAddress}</span>
            </div>
            <div className="sm:col-span-2 pt-1 border-t border-slate-200/70 dark:border-slate-700/70 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                Grievance Officer: {LEGAL_CONFIG.grievanceOfficerName} ({LEGAL_CONFIG.grievanceOfficerDesignation})
              </span>
              <span>Email: {LEGAL_CONFIG.grievanceOfficerEmail}</span>
              <span>Phone: {LEGAL_CONFIG.grievanceOfficerPhone}</span>
            </div>
          </div>
        </div>

        {/* 24/7 Instant Assistant Banner */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-500/10 via-sky-500/10 to-transparent border border-blue-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-sm p-1">
              <EllixConnectLogo variant="symbol" size={24} alt="Ellic Assistant" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Need Instant Product Answers?</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Ask our support assistant about barcode billing, inventory batches, or GST workflows.
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-contact-modal-launch-chatbot"
            onClick={() => {
              onClose();
              window.dispatchEvent(new CustomEvent('open-support-chat'));
            }}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 transition-colors shadow-sm"
          >
            Start Chat
          </button>
        </div>

        {/* Contact Inquiry Form with Affirmative Consent */}
        {sentNotice ? (
          <div className="p-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
            <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <div className="text-sm font-bold text-slate-950 dark:text-white">
              Inquiry Recorded
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Thank you for reaching out. Our merchant support team will review your inquiry and follow up using your provided contact details.
            </p>
              <button
                type="button"
                onClick={() => {
                  setSentNotice(false);
                  setName('');
                  setEmail('');
                  setMessage('');
                  setConsentChecked(false);
                }}
                className="mt-2 text-xs font-semibold text-blue-700 dark:text-sky-400 hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="contact-name-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Your Name *
                  </label>
                  <input
                    id="contact-name-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="contact-email-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Your Email or Phone *
                  </label>
                  <input
                    id="contact-email-input"
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@business.com or +91..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-message-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  How can we help your business? *
                </label>
                <textarea
                  id="contact-message-input"
                  rows={3}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your store, billing setup, or support question..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white resize-none"
                />
              </div>

              {/* DPDPA Affirmative Consent Checkbox */}
              <label htmlFor="contact-consent-checkbox" className="flex items-start gap-2.5 pt-1 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  id="contact-consent-checkbox"
                  type="checkbox"
                  required
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-blue-600 shrink-0"
                />
                <span className="leading-relaxed">
                  I consent to {LEGAL_CONFIG.brandName} processing my contact details to respond to this inquiry in accordance with the{' '}
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenLegalPage) {
                        onClose();
                        onOpenLegalPage('privacy-policy');
                      }
                    }}
                    className="text-blue-600 dark:text-sky-400 font-semibold hover:underline"
                  >
                    Privacy Policy
                  </button>.
                </span>
              </label>

              <button
                type="submit"
                disabled={!consentChecked}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Support Inquiry</span>
              </button>
            </form>
          )}

        {onOpenLegalPage && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
              <span>Need formal grievance escalation?</span>
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLegalPage('grievance-redressal');
              }}
              className="text-blue-600 dark:text-sky-400 font-semibold hover:underline"
            >
              Grievance Redressal →
            </button>
          </div>
        )}
      </div>
    </MarketingModal>
  );
};
