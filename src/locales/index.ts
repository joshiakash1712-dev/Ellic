import en from './en.json';
import hi from './hi.json';
import mr from './mr.json';

export type LocaleMessages = Record<string, any>;

export type TranslationParams = Record<string, string | number | boolean | undefined | null>;

export interface TranslateOptions {
  defaultValue?: string;
  params?: TranslationParams;
  [key: string]: any;
}

export const LOCALE_RESOURCES: Record<string, LocaleMessages> = {
  en,
  hi,
  mr
};

/**
 * Flattens a nested JSON locale object into dot-notation keys:
 * e.g., { nav: { dashboard: "Dashboard" } } -> { "nav.dashboard": "Dashboard" }
 */
export function flattenLocaleObject(
  obj: LocaleMessages,
  prefix = '',
  result: Record<string, string> = {}
): Record<string, string> {
  if (!obj || typeof obj !== 'object') return result;
  for (const [key, value] of Object.entries(obj)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      flattenLocaleObject(value, nextKey, result);
    } else if (typeof value === 'string') {
      result[nextKey] = value;
    }
  }
  return result;
}

// Precompute flattened key maps for all bundled locale files
const FLATTENED_KEY_MAPS: Record<string, Record<string, string>> = {};
for (const [langCode, messages] of Object.entries(LOCALE_RESOURCES)) {
  FLATTENED_KEY_MAPS[langCode] = flattenLocaleObject(messages);
}

const EN_FLATTENED_KEYS: Record<string, string> = FLATTENED_KEY_MAPS.en || {};

// Precompute English-phrase -> Target-language-phrase lookup tables from the structured locale files
const PHRASE_DICTIONARIES: Record<string, Record<string, string>> = {};
for (const [langCode, flatMap] of Object.entries(FLATTENED_KEY_MAPS)) {
  if (langCode === 'en') continue;
  const phraseMap: Record<string, string> = {};
  for (const [dotKey, enPhrase] of Object.entries(EN_FLATTENED_KEYS)) {
    const localizedPhrase = flatMap[dotKey];
    if (enPhrase && localizedPhrase) {
      phraseMap[enPhrase] = localizedPhrase;
    }
  }
  PHRASE_DICTIONARIES[langCode] = phraseMap;
}

/**
 * Interpolates {{param}} or {param} tokens inside a translated string.
 */
export function interpolateTranslation(
  template: string,
  params?: TranslationParams
): string {
  if (!template || !params) return template;
  return template
    .replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, token) => {
      const val = params[token];
      return val !== undefined && val !== null ? String(val) : match;
    })
    .replace(/\{\s*([a-zA-Z0-9_]+)\s*\}/g, (match, token) => {
      const val = params[token];
      return val !== undefined && val !== null ? String(val) : match;
    });
}

/**
 * Returns the flattened dot-key map for a given language code (with normalized base code fallback).
 */
export function getFlattenedKeyMap(lang: string): Record<string, string> {
  if (!lang) return EN_FLATTENED_KEYS;
  const exact = FLATTENED_KEY_MAPS[lang];
  if (exact) return exact;
  const base = lang.split('-')[0].toLowerCase();
  return FLATTENED_KEY_MAPS[base] || {};
}

/**
 * Returns the English-phrase -> Localized-phrase dictionary derived from src/locales/*.json
 */
export function getLocalePhraseDictionary(lang: string): Record<string, string> {
  if (!lang || lang === 'en') return {};
  const exact = PHRASE_DICTIONARIES[lang];
  if (exact) return exact;
  const base = lang.split('-')[0].toLowerCase();
  return PHRASE_DICTIONARIES[base] || {};
}

/**
 * Resolves a dot-notation key (e.g., "nav.dashboard", "common.save") or raw phrase
 * against the active locale's JSON dictionary, dynamic cache, and English fallback.
 */
export function translateWithKeyOrPhrase(
  keyOrPhrase: string,
  lang: string,
  dynamicCache?: Record<string, string>,
  optionsOrParams?: TranslateOptions | string
): string {
  if (!keyOrPhrase) return '';

  const trimmed = keyOrPhrase.trim();
  const defaultValue =
    typeof optionsOrParams === 'string'
      ? optionsOrParams
      : typeof optionsOrParams?.defaultValue === 'string'
        ? optionsOrParams.defaultValue
        : undefined;

  const interpolationParams: TranslationParams | undefined =
    optionsOrParams && typeof optionsOrParams === 'object'
      ? optionsOrParams.params || optionsOrParams
      : undefined;

  const langKeyMap = getFlattenedKeyMap(lang);
  const enKeyMap = EN_FLATTENED_KEYS;

  // 1. Check if keyOrPhrase matches a structured dot-notation key in the active locale (e.g. "nav.dashboard")
  if (lang !== 'en' && langKeyMap[trimmed]) {
    return interpolateTranslation(langKeyMap[trimmed], interpolationParams);
  }

  // 2. Check if keyOrPhrase is a structured key in en.json (either when lang === 'en' or when falling back/translating via cache)
  if (enKeyMap[trimmed]) {
    const englishResolved = enKeyMap[trimmed];
    if (lang === 'en') {
      return interpolateTranslation(englishResolved, interpolationParams);
    }
    // If dynamicCache has a translation for the English value or the key itself, use it
    if (dynamicCache) {
      if (dynamicCache[trimmed]) {
        return interpolateTranslation(dynamicCache[trimmed], interpolationParams);
      }
      if (dynamicCache[englishResolved]) {
        return interpolateTranslation(dynamicCache[englishResolved], interpolationParams);
      }
    }
    return interpolateTranslation(englishResolved, interpolationParams);
  }

  // 3. Direct phrase lookup in dynamicCache / phrase dictionary when lang !== 'en'
  if (lang !== 'en' && dynamicCache) {
    if (dynamicCache[trimmed]) {
      const replaced = keyOrPhrase.replace(trimmed, dynamicCache[trimmed]);
      return interpolateTranslation(replaced, interpolationParams);
    }
  }

  // 4. Fallback to defaultValue or original text
  const fallbackText = defaultValue !== undefined ? defaultValue : keyOrPhrase;
  if (lang !== 'en' && dynamicCache && dynamicCache[fallbackText.trim()]) {
    return interpolateTranslation(dynamicCache[fallbackText.trim()], interpolationParams);
  }
  return interpolateTranslation(fallbackText, interpolationParams);
}
