import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { useTranslation } from '../hooks/useTranslation';
import './LanguageCurrencyModal.css';

function LanguageCurrencyModal({ isOpen, onClose, initialTab = 'language' }) {
  const {
    language,
    currency,
    autoTranslate,
    setLanguage,
    setCurrency,
    setAutoTranslate,
    supportedLanguages,
    supportedCurrencies,
    getCurrentLanguage,
    getCurrentCurrency,
  } = useLocalization();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [translateEnabled, setTranslateEnabled] = useState(autoTranslate);

  if (!isOpen) return null;

  const handleSave = () => {
    setLanguage(selectedLanguage);
    setCurrency(selectedCurrency);
    setAutoTranslate(translateEnabled);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Suggested languages (Canadian)
  const suggestedLanguages = supportedLanguages.filter(l => l.region === 'Canada');

  return (
    <div className="lcm-backdrop" onClick={handleBackdropClick}>
      <div className="lcm-modal">
        {/* Close Button */}
        <button className="lcm-close-btn" onClick={onClose} aria-label="Close">
          <i className="fas fa-times"></i>
        </button>

        {/* Tabs */}
        <div className="lcm-tabs">
          <button
            className={`lcm-tab ${activeTab === 'language' ? 'lcm-tab-active' : ''}`}
            onClick={() => setActiveTab('language')}
          >
            {t('localization.language')}
          </button>
          <button
            className={`lcm-tab ${activeTab === 'currency' ? 'lcm-tab-active' : ''}`}
            onClick={() => setActiveTab('currency')}
          >
            {t('localization.currency')}
          </button>
        </div>

        {/* Content */}
        <div className="lcm-content">
          {activeTab === 'language' ? (
            <div className="lcm-language-content">
              {/* Auto-translate toggle */}
              <div className="lcm-translate-section">
                <div className="lcm-translate-row">
                  <div className="lcm-translate-info">
                    <span className="lcm-translate-label">
                      {t('localization.autoTranslate')}
                      <i className="fas fa-language" style={{ marginLeft: '8px', opacity: 0.6 }}></i>
                    </span>
                    <span className="lcm-translate-desc">
                      {t('localization.autoTranslateDesc')}
                    </span>
                  </div>
                  <label className="lcm-toggle">
                    <input
                      type="checkbox"
                      checked={translateEnabled}
                      onChange={(e) => setTranslateEnabled(e.target.checked)}
                    />
                    <span className="lcm-toggle-slider"></span>
                  </label>
                </div>
              </div>

              {/* Suggested Languages */}
              <div className="lcm-section">
                <h3 className="lcm-section-title">{t('localization.suggestedLanguages')}</h3>
                <div className="lcm-options-grid">
                  {suggestedLanguages.map((lang) => (
                    <button
                      key={`${lang.code}-${lang.region}`}
                      className={`lcm-option ${selectedLanguage === lang.code ? 'lcm-option-selected' : ''}`}
                      onClick={() => setSelectedLanguage(lang.code)}
                    >
                      <span className="lcm-option-name">{lang.name}</span>
                      <span className="lcm-option-region">{lang.region}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* All Languages */}
              <div className="lcm-section">
                <h3 className="lcm-section-title">{t('localization.chooseLanguage')}</h3>
                <div className="lcm-options-grid">
                  {supportedLanguages.map((lang) => (
                    <button
                      key={`${lang.code}-${lang.region}`}
                      className={`lcm-option ${selectedLanguage === lang.code ? 'lcm-option-selected' : ''}`}
                      onClick={() => setSelectedLanguage(lang.code)}
                    >
                      <span className="lcm-option-name">{lang.name}</span>
                      <span className="lcm-option-region">{lang.region}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="lcm-currency-content">
              <div className="lcm-section">
                <h3 className="lcm-section-title">{t('localization.chooseCurrency')}</h3>
                <p className="lcm-section-desc">
                  {t('localization.currencyDesc', 'Prices will be shown in your selected currency. CAD is recommended for Canadian users.')}
                </p>
                <div className="lcm-options-grid lcm-currency-grid">
                  {supportedCurrencies.map((curr) => {
                    const isDisabled = curr.code !== 'CAD';
                    return (
                      <button
                        key={curr.code}
                        className={`lcm-option ${selectedCurrency === curr.code ? 'lcm-option-selected' : ''} ${isDisabled ? 'lcm-option-disabled' : ''}`}
                        onClick={() => !isDisabled && setSelectedCurrency(curr.code)}
                        disabled={isDisabled}
                        title={isDisabled ? 'Coming soon - Currently only CAD is available' : ''}
                      >
                        <span className="lcm-option-name">{curr.name}</span>
                        <span className="lcm-option-region">{curr.code} – {curr.symbol}</span>
                        {isDisabled && <span className="lcm-coming-soon">Coming soon</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="lcm-footer">
          <button className="lcm-btn lcm-btn-secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className="lcm-btn lcm-btn-primary" onClick={handleSave}>
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LanguageCurrencyModal;
