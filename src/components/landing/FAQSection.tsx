import React, { useState, useId } from 'react';
import { ChevronDown, HelpCircle, Search, Sparkles, MessageCircle, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: 'what-is-ellix',
    question: 'What is Ellic?',
    category: 'General',
    answer:
      'Ellic is a modern, unified business management platform engineered for local retailers, specialized merchants, and wholesalers. It replaces clunky legacy billing software and fragmented paper books with a calm, connected solution that handles counter billing, live inventory sync, customer Khata, multi-tender payments, and instant business intelligence.'
  },
  {
    id: 'who-is-it-for',
    question: 'Who is Ellic for?',
    category: 'General',
    answer:
      'Ellic is designed specifically for grocery stores, supermarkets, electronics and mobile shops, apparel boutiques, hardware distributors, and general retail merchants. Whether you operate a single counter or a busy multi-register store, Ellic scales effortlessly.'
  },
  {
    id: 'only-for-billing',
    question: 'Is Ellic only for billing?',
    category: 'Features',
    answer:
      'No. While high-speed billing and counter checkout are core capabilities, Ellic is a comprehensive operations platform. Every sale automatically updates inventory stock levels, logs customer loyalty and credit (Khata), verifies register drawer cash, and updates day-end profit reports in real time without manual reconciliation.'
  },
  {
    id: 'auto-inventory',
    question: 'Does inventory update automatically?',
    category: 'Inventory',
    answer:
      'Yes. The instant a barcode is scanned and a bill is settled, the corresponding batch stock is decremented immediately across your store database. When items drop below your configured reorder threshold, the system flags low-stock warnings and prepares automated restock purchase drafts.'
  },
  {
    id: 'manage-customers',
    question: 'Can I manage customers?',
    category: 'Customers',
    answer:
      'Yes. Ellic includes a built-in digital Khata and customer CRM. You can track customer purchase histories, assign loyalty reward points, manage credit ledgers with partial repayment records, and send automated WhatsApp billing receipts and gentle payment reminders.'
  },
  {
    id: 'track-payments',
    question: 'Can I track payments?',
    category: 'Payments',
    answer:
      'Absolutely. Ellic supports multi-tender checkout including Dynamic UPI QR codes (scanned directly from customer smartphones), debit/credit cards, cash drawer management, and split-payment transactions. At closing, your register cash matches digital records to the exact cent.'
  },
  {
    id: 'view-reports',
    question: 'Can I view business reports?',
    category: 'Reports',
    answer:
      'Yes. With a single click, store owners can view real-time sales summaries, gross profit margins, top-selling products versus dead stock, cashier shift closing balances, and audit-ready GST tax sheets that can be directly exported to Excel or PDF for your accountant.'
  },
  {
    id: 'web-application',
    question: 'Is Ellic a web application?',
    category: 'Technology',
    answer:
      'Ellic is built as a progressive, offline-first web and desktop platform. It works on any modern laptop, desktop PC, tablet, or POS terminal without expensive proprietary hardware. Crucially, it continues to bill customers smoothly even if your internet connection drops, syncing seamlessly once back online.'
  }
];

interface FAQSectionProps {
  onOpenContact?: () => void;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ onOpenContact }) => {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'what-is-ellix': true,
    'only-for-billing': true
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAll = () => {
    const allOpen = faqData.reduce<Record<string, boolean>>((acc, item) => {
      acc[item.id] = true;
      return acc;
    }, {});
    setOpenItems(allOpen);
  };

  const collapseAll = () => {
    setOpenItems({});
  };

  // Filter items
  const filteredFaqs = faqData.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || item.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <section id="faq" className="py-20 md:py-28 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="flex items-center justify-center gap-2 text-xs font-bold tracking-widest text-blue-600 dark:text-sky-400 uppercase select-none mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-sky-400 shadow-[0_0_8px_rgba(37,99,235,0.7)]" />
            <span>Frequently Asked Questions</span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-slate-500 dark:text-slate-400 font-semibold normal-case tracking-normal">Common Questions Answered</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white tracking-tight">
            Clear answers to common questions.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Everything you need to know about adopting Ellic for your store operations.
          </p>
        </div>

        {/* Search & Controls */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                data-cursor="hover"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions (e.g., inventory, offline, billing)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400 hover:border-blue-500/40"
              />
            </div>

            {/* Quick Action Toggle Buttons */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 self-end sm:self-auto">
              <button
                type="button"
                data-cursor="hover"
                onClick={expandAll}
                className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Expand All
              </button>
              <span>·</span>
              <button
                type="button"
                data-cursor="hover"
                onClick={collapseAll}
                className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3.5">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((item) => {
              const isOpen = Boolean(openItems[item.id]);

              return (
                <div
                  key={item.id}
                  id={`faq-item-${item.id}`}
                  className={`website-card-hover rounded-2xl border transition-all overflow-hidden ${
                    isOpen
                      ? 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-500/40'
                  }`}
                >
                  <button
                    type="button"
                    data-cursor="hover"
                    onClick={() => toggleItem(item.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${item.id}`}
                    className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
                  >
                    <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-3">
                      <HelpCircle className={`w-5 h-5 shrink-0 transition-colors ${isOpen ? 'text-blue-600 dark:text-sky-400' : 'text-slate-400'}`} />
                      <span>{item.question}</span>
                    </span>

                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        isOpen
                          ? 'rotate-180 bg-sky-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-answer-${item.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <div className="px-5 sm:px-6 pb-5 pt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700/60">
                          {item.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-sm font-medium">
                No matching questions found for "{searchQuery}".
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs font-semibold text-blue-600 dark:text-sky-400 hover:underline"
              >
                Clear search filter
              </button>
            </div>
          )}
        </div>

        {/* Support Callout Box */}
        <div className="mt-12 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-sky-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Have a specific question about your retail store?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Our retail software specialists can assess your store hardware and setup.
              </p>
            </div>
          </div>

          <button
            type="button"
            data-cursor="hover"
            onClick={onOpenContact}
            className="website-btn-glow px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all shrink-0 cursor-pointer flex items-center gap-2"
          >
            <span>Contact Merchant Support</span>
            <ArrowRight className="w-3.5 h-3.5 text-sky-200" />
          </button>
        </div>

      </div>
    </section>
  );
};
