import React, { createContext, useContext, useState, useEffect } from 'react';

// Supported languages - starting with Canadian languages
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', region: 'Canada', flag: '🇨🇦' },
  { code: 'fr', name: 'Français', region: 'Canada', flag: '🇨🇦' },
];

// Supported currencies - CAD is default, others for future expansion
const SUPPORTED_CURRENCIES = [
  { code: 'CAD', name: 'Canadian dollar', symbol: '$', locale: 'en-CA' },
  { code: 'USD', name: 'United States dollar', symbol: '$', locale: 'en-US' },
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de-DE' },
  { code: 'GBP', name: 'Pound sterling', symbol: '£', locale: 'en-GB' },
  { code: 'AUD', name: 'Australian dollar', symbol: '$', locale: 'en-AU' },
  { code: 'MXN', name: 'Mexican peso', symbol: '$', locale: 'es-MX' },
];

const LocalizationContext = createContext();

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
}

export function LocalizationProvider({ children }) {
  // Initialize from localStorage or defaults (CAD and English for Canada launch)
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('planbeau_language');
    return saved || 'en';
  });

  const [currency, setCurrencyState] = useState(() => {
    const saved = localStorage.getItem('planbeau_currency');
    return saved || 'CAD';
  });

  const [autoTranslate, setAutoTranslateState] = useState(() => {
    const saved = localStorage.getItem('planbeau_auto_translate');
    return saved === 'true';
  });

  // Persist to localStorage when values change
  useEffect(() => {
    localStorage.setItem('planbeau_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('planbeau_currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('planbeau_auto_translate', autoTranslate.toString());
  }, [autoTranslate]);

  // Set language with validation
  const setLanguage = (langCode) => {
    const isValid = SUPPORTED_LANGUAGES.some(l => l.code === langCode);
    if (isValid) {
      setLanguageState(langCode);
    }
  };

  // Set currency with validation
  const setCurrency = (currencyCode) => {
    const isValid = SUPPORTED_CURRENCIES.some(c => c.code === currencyCode);
    if (isValid) {
      setCurrencyState(currencyCode);
    }
  };

  // Toggle auto-translate
  const setAutoTranslate = (value) => {
    setAutoTranslateState(value);
  };

  // Format currency amount - displays as "C $500" format with currency prefix
  const formatCurrency = (amount, currencyOverride = null, options = {}) => {
    if (amount == null || isNaN(amount)) return 'C $0.00';
    
    const currencyCode = currencyOverride || currency;
    const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
    const { showCents = true } = options;
    
    // Currency prefix mapping (e.g., CAD -> "C", USD -> "US", EUR -> "€")
    const currencyPrefixes = {
      CAD: 'C',
      USD: 'US',
      EUR: '€',
      GBP: '£',
      AUD: 'AU',
      MXN: 'MX'
    };
    
    const prefix = currencyPrefixes[currencyCode] || currencyCode;
    const numValue = Number(amount);
    
    if (!currencyInfo) {
      const formatted = showCents ? numValue.toFixed(2) : Math.round(numValue).toString();
      return `${prefix} $${formatted}`;
    }

    try {
      // Format the number without currency symbol
      const formatted = new Intl.NumberFormat(currencyInfo.locale, {
        minimumFractionDigits: showCents ? 2 : 0,
        maximumFractionDigits: showCents ? 2 : 0,
      }).format(numValue);
      
      // Return with prefix format: "C $500.00"
      return `${prefix} $${formatted}`;
    } catch (error) {
      const formatted = showCents ? numValue.toFixed(2) : Math.round(numValue).toString();
      return `${prefix} $${formatted}`;
    }
  };

  // Get current language info
  const getCurrentLanguage = () => {
    return SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];
  };

  // Get current currency info
  const getCurrentCurrency = () => {
    return SUPPORTED_CURRENCIES.find(c => c.code === currency) || SUPPORTED_CURRENCIES[0];
  };

  const value = {
    // Current values
    language,
    currency,
    autoTranslate,
    
    // Setters
    setLanguage,
    setCurrency,
    setAutoTranslate,
    
    // Utilities
    formatCurrency,
    getCurrentLanguage,
    getCurrentCurrency,
    
    // Available options
    supportedLanguages: SUPPORTED_LANGUAGES,
    supportedCurrencies: SUPPORTED_CURRENCIES,
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export default LocalizationContext;
