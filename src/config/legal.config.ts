/**
 * ELLIX CONNECT — CENTRALIZED INDIA LEGAL, PRIVACY, SECURITY & COMPLIANCE CONFIGURATION
 *
 * IMPORTANT LEGAL & COMPLIANCE NOTICE:
 * - Never hard-code fake registrations, licenses, certifications, GSTIN, CIN, LLPIN,
 *   grievance officer details, or registered addresses.
 * - Where actual business/legal information has not yet been supplied, clearly marked
 *   configuration placeholders ("[REPLACE ...]") are used so they can be identified
 *   and updated prior to commercial launch after review by qualified legal/tax counsel in India.
 */

export interface LegalConfigType {
  legalBusinessName: string;
  brandName: string;
  businessAddress: string;
  supportEmail: string;
  supportPhone: string;
  privacyEmail: string;
  grievanceOfficerName: string;
  grievanceOfficerDesignation: string;
  grievanceOfficerEmail: string;
  grievanceOfficerPhone: string;
  gstin: string;
  cin: string;
  llpin: string;
  jurisdiction: string;
  effectiveDate: string;
  privacyPolicyVersion: string;
  termsVersion: string;
}

export const LEGAL_CONFIG: LegalConfigType = {
  legalBusinessName: "[REPLACE WITH LEGAL ENTITY NAME]",
  brandName: "Ellic",
  businessAddress: "[REPLACE WITH REGISTERED/BUSINESS ADDRESS]",
  supportEmail: "support@ellic.com",
  supportPhone: "[REPLACE WITH SUPPORT PHONE]",
  privacyEmail: "[REPLACE WITH PRIVACY CONTACT]",
  grievanceOfficerName: "[REPLACE IF APPLICABLE]",
  grievanceOfficerDesignation: "[REPLACE IF APPLICABLE]",
  grievanceOfficerEmail: "[REPLACE IF APPLICABLE]",
  grievanceOfficerPhone: "[REPLACE IF APPLICABLE]",
  gstin: "[REPLACE IF APPLICABLE]",
  cin: "[REPLACE IF APPLICABLE]",
  llpin: "[REPLACE IF APPLICABLE]",
  jurisdiction: "[REPLACE AFTER LEGAL REVIEW]",
  effectiveDate: "[REPLACE]",
  privacyPolicyVersion: "1.0",
  termsVersion: "1.0",
};

/**
 * Configurable applicability & operational compliance settings.
 * Items marked `requiresLegalOrAccountingReview: true` depend on the operator's
 * specific corporate structure, turnover, payment flow, or registration status.
 */
export const COMPLIANCE_APPLICABILITY_CONFIG = {
  platformScope: {
    targetMarket: "Small businesses, retail stores, supermarkets, and wholesalers in India (excluding restaurants)",
    excludesRestaurants: true,
  },
  regulatoryFrameworks: {
    dpdpa2023: true, // Digital Personal Data Protection Act, 2023 & Rules, 2025
    itAct2000: true, // Information Technology Act, 2000 & applicable IT Rules
    consumerProtectionAct2019: true, // Consumer Protection Act, 2019
    ecommerceRules2020Applicable: false, // Set to true after legal review if direct online paid subscription checkout is enabled
    certInDirectionsApplicable: true, // Security log & incident reporting readiness under CERT-In directions
    gstDocumentGenerationDisclaimer: true, // Platform generates GST invoices/reports from merchant inputs; merchant remains responsible for filings
  },
  timelines: {
    grievanceAcknowledgeHours: 24, // Acknowledge grievances within 24 hours
    grievanceResolutionDays: 15, // Resolve grievances within 15 days (or shorter statutory period where applicable)
    dataExportRetentionDaysAfterCancellation: 30, // Window for merchants to export CSV/PDF ledgers post-cancellation
  },
  reviewChecklist: [
    {
      id: "entity_details",
      label: "Legal Entity Name, Registered Address & CIN/LLPIN",
      status: "pending_review" as const,
      note: "Replace placeholders in LEGAL_CONFIG once corporate entity registration details are finalized.",
    },
    {
      id: "gst_registration",
      label: "GSTIN & Tax Invoicing Applicability",
      status: "pending_review" as const,
      note: "Confirm with Chartered Accountant whether GSTIN is required based on turnover and interstate SaaS supply.",
    },
    {
      id: "grievance_officer",
      label: "Grievance Officer & Privacy Contact Designation",
      status: "pending_review" as const,
      note: "Designate an officer and dedicated contact email/phone in accordance with IT Rules and DPDPA 2023.",
    },
    {
      id: "jurisdiction_clause",
      label: "Exclusive Court Jurisdiction & Arbitration Venue",
      status: "pending_review" as const,
      note: "Confirm governing city/state courts in India with legal counsel.",
    },
  ],
};

export type LegalPageSlug =
  | "privacy-policy"
  | "terms-of-service"
  | "cancellation-refund-policy"
  | "cookie-policy"
  | "data-privacy-rights"
  | "security"
  | "grievance-redressal"
  | "support";

export const LEGAL_PAGE_ROUTES: Record<
  LegalPageSlug,
  { path: string; title: string; shortLabel: string; description: string }
> = {
  "privacy-policy": {
    path: "/privacy-policy",
    title: "Privacy Policy",
    shortLabel: "Privacy Policy",
    description:
      "Read the Ellic Privacy Policy covering personal and business data collection, Cloud Firestore storage, local browser caching, and India DPDPA 2023 disclosures.",
  },
  "terms-of-service": {
    path: "/terms-of-service",
    title: "Terms of Service",
    shortLabel: "Terms of Service",
    description:
      "Review the Ellic Terms of Service governing retail billing, GST invoice formatting, direct UPI QR settlement, and merchant responsibilities.",
  },
  "cancellation-refund-policy": {
    path: "/cancellation-refund-policy",
    title: "Cancellation & Refund Policy",
    shortLabel: "Cancellation & Refund Policy",
    description:
      "Understand Ellic subscription cancellation terms, data export retention windows, and refund eligibility for retail merchants.",
  },
  "cookie-policy": {
    path: "/cookie-policy",
    title: "Cookie & Local Storage Policy",
    shortLabel: "Cookie Policy",
    description:
      "Learn how Ellic uses essential cookies and browser local storage for authentication, offline POS continuity, and user preference controls.",
  },
  "data-privacy-rights": {
    path: "/data-privacy-rights",
    title: "Data & Privacy Rights (Data Principal Center)",
    shortLabel: "Data & Privacy Rights",
    description:
      "Submit and track Data Principal requests for data access summaries, correction, erasure, consent withdrawal, or nominee registration under India DPDPA 2023.",
  },
  "security": {
    path: "/security",
    title: "Security & Data Protection Practices",
    shortLabel: "Security",
    description:
      "Explore Ellic security practices, HTTPS/TLS transport encryption, Google Cloud Firestore storage, role-based access control, and transparent compliance disclosures.",
  },
  "grievance-redressal": {
    path: "/grievance-redressal",
    title: "Grievance Redressal Mechanism",
    shortLabel: "Grievance Redressal",
    description:
      "Submit formal privacy, billing, or account grievances and review acknowledgment and resolution timelines under Indian Information Technology rules.",
  },
  "support": {
    path: "/support",
    title: "Help, Support & Contact Center",
    shortLabel: "Help / Support",
    description:
      "Get help with Ellic retail billing, inventory management, customer Khata ledgers, and account support for local retailers and small businesses.",
  },
};

/**
 * Checks whether a field in LEGAL_CONFIG has been populated with real data
 * rather than a `[REPLACE ...]` placeholder or empty string.
 */
export function isConfiguredLegalValue(value?: string | null): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("[REPLACE") || trimmed.includes("[REPLACE")) {
    return false;
  }
  return true;
}

/**
 * Safely returns a configured legal field value, or a fallback string.
 */
export function getConfiguredOrFallback(value: string | undefined, fallback: string): string {
  return isConfiguredLegalValue(value) ? value!.trim() : fallback;
}

/**
 * Returns the list of keys in LEGAL_CONFIG that still contain `[REPLACE ...]` placeholders.
 */
export function getUnconfiguredLegalKeys(): (keyof LegalConfigType)[] {
  return (Object.keys(LEGAL_CONFIG) as (keyof LegalConfigType)[]).filter(
    (key) => !isConfiguredLegalValue(LEGAL_CONFIG[key])
  );
}

export function isDevelopmentEnvironment(): boolean {
  try {
    return Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV);
  } catch {
    return false;
  }
}

/**
 * Detects if the current URL pathname or hash corresponds to one of the legal/support routes.
 */
export function getLegalSlugFromLocation(): LegalPageSlug | null {
  if (typeof window === "undefined") return null;
  const pathname = window.location.pathname.replace(/\/+$/, "").toLowerCase();
  const hash = window.location.hash.replace(/^#\/?/, "").toLowerCase();

  const aliases: Record<string, LegalPageSlug> = {
    "/privacy-policy": "privacy-policy",
    "/privacy": "privacy-policy",
    "/terms-of-service": "terms-of-service",
    "/terms": "terms-of-service",
    "/cancellation-refund-policy": "cancellation-refund-policy",
    "/refund-policy": "cancellation-refund-policy",
    "/cookie-policy": "cookie-policy",
    "/cookies": "cookie-policy",
    "/data-privacy-rights": "data-privacy-rights",
    "/privacy-rights": "data-privacy-rights",
    "/security": "security",
    "/grievance-redressal": "grievance-redressal",
    "/grievance": "grievance-redressal",
    "/support": "support",
    "/help": "support",
    "/contact": "support",
  };

  if (aliases[pathname]) return aliases[pathname];
  if (hash && aliases[`/${hash}`]) return aliases[`/${hash}`];
  return null;
}

// ============================================================================
// CONSENT, COOKIE PREFERENCES & DATA PRINCIPAL REQUEST STORAGE HELPERS
// ============================================================================

export interface CookiePreferencesState {
  essentialAuthAndSecurity: true; // Always required for Firebase Auth & security rules
  offlinePosAndInventoryCache: true; // Required for core offline-first POS & theme state
  functionalPreferences: boolean;
  analyticsAndDiagnostics: boolean;
  updatedAt: string;
  policyVersion: string;
}

export interface ConsentAuditRecord {
  id: string;
  context: "registration" | "onboarding_inquiry" | "contact_support" | "cookie_banner" | "privacy_center";
  subjectIdentifier?: string;
  privacyPolicyVersion: string;
  termsVersion: string;
  consentedAt: string;
  purposeSummary: string;
}

export interface DataPrincipalRequestRecord {
  id: string;
  requestType:
    | "access_summary"
    | "correction_update"
    | "erasure_deletion"
    | "withdraw_consent"
    | "nominate_representative";
  requesterName: string;
  requesterEmailOrPhone: string;
  accountRole: string;
  details: string;
  status: "Submitted — Under Review" | "Resolved";
  createdAt: string;
}

export interface GrievanceTicketRecord {
  ticketId: string;
  complainantName: string;
  complainantContact: string;
  category:
    | "privacy_dpdpa"
    | "billing_subscription"
    | "account_access"
    | "security_concern"
    | "other_grievance";
  subject: string;
  description: string;
  status: "Acknowledged — Pending Officer Review";
  createdAt: string;
}

const COOKIE_PREFS_KEY = "ellix_cookie_preferences_v1";
const CONSENT_LOG_KEY = "ellix_consent_audit_log_v1";
const DP_REQUESTS_KEY = "ellix_data_principal_requests_v1";
const GRIEVANCE_TICKETS_KEY = "ellix_grievance_tickets_v1";

export function getSavedCookiePreferences(): CookiePreferencesState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_PREFS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookiePreferencesState;
  } catch {
    return null;
  }
}

export function saveCookiePreferences(prefs: {
  functionalPreferences: boolean;
  analyticsAndDiagnostics: boolean;
}): CookiePreferencesState {
  const state: CookiePreferencesState = {
    essentialAuthAndSecurity: true,
    offlinePosAndInventoryCache: true,
    functionalPreferences: prefs.functionalPreferences,
    analyticsAndDiagnostics: prefs.analyticsAndDiagnostics,
    updatedAt: new Date().toISOString(),
    policyVersion: LEGAL_CONFIG.privacyPolicyVersion,
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(COOKIE_PREFS_KEY, JSON.stringify(state));
    } catch {
      // ignore storage quota errors
    }
  }
  recordConsentAudit({
    context: "cookie_banner",
    purposeSummary: `Cookie preferences saved (Functional: ${prefs.functionalPreferences ? "Enabled" : "Disabled"}, Analytics: ${prefs.analyticsAndDiagnostics ? "Enabled" : "Disabled"})`,
  });
  return state;
}

export function recordConsentAudit(params: {
  context: ConsentAuditRecord["context"];
  subjectIdentifier?: string;
  purposeSummary: string;
}): ConsentAuditRecord {
  const entry: ConsentAuditRecord = {
    id: `CNS-${Date.now().toString(36).toUpperCase()}`,
    context: params.context,
    subjectIdentifier: params.subjectIdentifier,
    privacyPolicyVersion: LEGAL_CONFIG.privacyPolicyVersion,
    termsVersion: LEGAL_CONFIG.termsVersion,
    consentedAt: new Date().toISOString(),
    purposeSummary: params.purposeSummary,
  };
  if (typeof window !== "undefined") {
    try {
      const existingRaw = window.localStorage.getItem(CONSENT_LOG_KEY);
      const existing: ConsentAuditRecord[] = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = [entry, ...existing].slice(0, 50);
      window.localStorage.setItem(CONSENT_LOG_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
  return entry;
}

export function getConsentAuditHistory(): ConsentAuditRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CONSENT_LOG_KEY);
    return raw ? (JSON.parse(raw) as ConsentAuditRecord[]) : [];
  } catch {
    return [];
  }
}

export function submitDataPrincipalRequest(
  input: Omit<DataPrincipalRequestRecord, "id" | "status" | "createdAt">
): DataPrincipalRequestRecord {
  const record: DataPrincipalRequestRecord = {
    ...input,
    id: `DPR-${Date.now().toString(36).toUpperCase()}`,
    status: "Submitted — Under Review",
    createdAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    try {
      const existingRaw = window.localStorage.getItem(DP_REQUESTS_KEY);
      const existing: DataPrincipalRequestRecord[] = existingRaw ? JSON.parse(existingRaw) : [];
      window.localStorage.setItem(DP_REQUESTS_KEY, JSON.stringify([record, ...existing].slice(0, 30)));
    } catch {
      // ignore
    }
  }
  return record;
}

export function getDataPrincipalRequests(): DataPrincipalRequestRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DP_REQUESTS_KEY);
    return raw ? (JSON.parse(raw) as DataPrincipalRequestRecord[]) : [];
  } catch {
    return [];
  }
}

export function submitGrievanceTicket(
  input: Omit<GrievanceTicketRecord, "ticketId" | "status" | "createdAt">
): GrievanceTicketRecord {
  const record: GrievanceTicketRecord = {
    ...input,
    ticketId: `GRV-${Date.now().toString(36).toUpperCase()}`,
    status: "Acknowledged — Pending Officer Review",
    createdAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    try {
      const existingRaw = window.localStorage.getItem(GRIEVANCE_TICKETS_KEY);
      const existing: GrievanceTicketRecord[] = existingRaw ? JSON.parse(existingRaw) : [];
      window.localStorage.setItem(GRIEVANCE_TICKETS_KEY, JSON.stringify([record, ...existing].slice(0, 30)));
    } catch {
      // ignore
    }
  }
  return record;
}

export function getGrievanceTickets(): GrievanceTicketRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GRIEVANCE_TICKETS_KEY);
    return raw ? (JSON.parse(raw) as GrievanceTicketRecord[]) : [];
  } catch {
    return [];
  }
}
