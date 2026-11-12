import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Check, Search, X, RotateCcw, ChevronDown, Loader2 } from 'lucide-react';
import { useLanguage, LanguageOption } from '../../context/LanguageContext';
import { LanguageIcon } from './LanguageIcon';

interface LanguageSwitcherProps {
  variant?: 'compact' | 'landing' | 'panel';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'compact',
  className = ''
}) => {
  const {
    language,
    setLanguage,
    currentLanguageInfo,
    languages,
    isTranslating,
    t,
    resetLanguage
  } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return languages.filter(lang => {
      if (!q) return true;
      return (
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q)
      );
    });
  }, [languages, searchQuery]);

  const handleSelectLanguage = (lang: LanguageOption) => {
    setLanguage(lang.code);
    setIsOpen(false);
    setSearchQuery('');
  };

  if (variant === 'panel') {
    return (
      <div className={`space-y-4 ${className}`} data-no-translate="true">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500/15 via-sky-500/10 to-indigo-500/15 dark:from-blue-500/25 dark:via-sky-400/20 dark:to-indigo-500/20 border border-blue-500/20 dark:border-sky-400/30 flex items-center justify-center text-blue-600 dark:text-sky-400 shadow-xs">
              <LanguageIcon className="h-4.5 w-4.5" variant="gradient" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {t('settings.selectLanguage', 'Select Language')}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                English, हिन्दी & मराठी
              </p>
            </div>
            {language !== 'en' && (
              <button
                type="button"
                onClick={resetLanguage}
                className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                title="Reset to English"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                English
              </button>
            )}
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search language..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-sky-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {filteredLanguages.map(lang => {
            const isSelected = language.toLowerCase() === lang.code.toLowerCase();
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-sky-50/90 dark:bg-blue-950/40 border-sky-500 dark:border-sky-500/80 ring-2 ring-blue-500/30 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className={`text-sm font-bold truncate ${isSelected ? 'text-blue-700 dark:text-sky-300' : 'text-slate-900 dark:text-white'}`}>
                    {lang.nativeName}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                    <span>{lang.name}</span>
                    <span className="text-[9px] uppercase px-1 py-0.2 bg-slate-100 dark:bg-slate-800 rounded text-slate-400">
                      {lang.code}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <div className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`} data-no-translate="true">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={
          variant === 'landing'
            ? 'inline-flex items-center gap-1.5 sm:gap-2 p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 transition-all shrink-0'
            : 'flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700 hover:border-slate-600 text-xs font-semibold text-slate-200 hover:text-white transition-all shrink-0'
        }
        title="Change Application Language"
        aria-label="Change Application Language"
      >
        {isTranslating ? (
          <Loader2 className="h-4 w-4 text-sky-500 animate-spin shrink-0" />
        ) : (
          <LanguageIcon className="h-4 w-4 text-blue-600 dark:text-sky-400 shrink-0" />
        )}
        <span className="hidden sm:inline max-w-[92px] truncate font-bold">
          {currentLanguageInfo.nativeName}
        </span>
        <ChevronDown className={`hidden sm:inline h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-80 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden z-[120] animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500/15 via-sky-500/10 to-indigo-500/15 dark:from-blue-500/25 dark:via-sky-400/20 dark:to-indigo-500/20 border border-blue-500/20 dark:border-sky-400/30 flex items-center justify-center text-blue-600 dark:text-sky-400 shadow-xs">
                  <LanguageIcon className="h-4.5 w-4.5" variant="gradient" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {t('settings.selectLanguage', 'Select Language')}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    English, हिन्दी & मराठी
                  </p>
                </div>
              </div>
              {language !== 'en' && (
                <button
                  type="button"
                  onClick={() => {
                    resetLanguage();
                    setIsOpen(false);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-blue-700 dark:text-sky-300 bg-sky-50 dark:bg-blue-950/60 hover:bg-sky-100 dark:hover:bg-blue-900/60 rounded-lg transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  {t('settings.resetLanguage', 'Reset to English')}
                </button>
              )}
            </div>
          </div>

          {/* Language List */}
          <div className="p-2 space-y-1.5 custom-scrollbar">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map(lang => {
                const isSelected = language.toLowerCase() === lang.code.toLowerCase();
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelectLanguage(lang)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all border ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-blue-950/50 border-sky-500/80 text-blue-700 dark:text-sky-300 ring-1 ring-blue-500/30'
                        : 'bg-transparent border-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="min-w-0 pr-1.5">
                      <div className="text-xs font-bold truncate">{lang.nativeName}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                        <span>{lang.name}</span>
                        <span className="text-[9px] uppercase px-1 py-0.2 bg-slate-100 dark:bg-slate-800 rounded text-slate-400">
                          {lang.code}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No matching language found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
