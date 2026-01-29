import React, { useState } from 'react';
import { useLocalization } from '../../../context/LocalizationContext';

function LanguageCurrencyPanel({ onBack }) {
  const {
    language,
    currency,
    autoTranslate,
    distanceUnit,
    setLanguage,
    setCurrency,
    setAutoTranslate,
    setDistanceUnit,
    supportedLanguages,
    supportedCurrencies,
    supportedDistanceUnits,
    getCurrentLanguage,
    getCurrentCurrency,
  } = useLocalization();

  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [selectedDistanceUnit, setSelectedDistanceUnit] = useState(distanceUnit);
  const [translateEnabled, setTranslateEnabled] = useState(autoTranslate);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setLanguage(selectedLanguage);
    setCurrency(selectedCurrency);
    setDistanceUnit(selectedDistanceUnit);
    setAutoTranslate(translateEnabled);
    
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 300);
  };

  const hasChanges = 
    selectedLanguage !== language || 
    selectedCurrency !== currency || 
    selectedDistanceUnit !== distanceUnit ||
    translateEnabled !== autoTranslate;

  return (
    <div className="settings-panel">
      {/* Panel Header */}
      <div className="panel-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button 
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <i className="fas fa-arrow-left" style={{ fontSize: '18px', color: '#374151' }}></i>
        </button>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Language & Currency</h2>
      </div>

      {/* Auto-translate Section */}
      <div style={{
        background: '#f9fafb',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '15px', color: '#111827', marginBottom: '4px' }}>
              <i className="fas fa-language" style={{ marginRight: '8px', opacity: 0.7 }}></i>
              Auto-translate
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>
              Automatically translate descriptions and reviews to your language.
            </div>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '28px' }}>
            <input
              type="checkbox"
              checked={translateEnabled}
              onChange={(e) => setTranslateEnabled(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute',
              cursor: 'pointer',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: translateEnabled ? '#111827' : '#d1d5db',
              transition: '0.3s',
              borderRadius: '28px'
            }}>
              <span style={{
                position: 'absolute',
                content: '""',
                height: '22px',
                width: '22px',
                left: translateEnabled ? '23px' : '3px',
                bottom: '3px',
                backgroundColor: 'white',
                transition: '0.3s',
                borderRadius: '50%',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
              }}></span>
            </span>
          </label>
        </div>
      </div>

      {/* Language Section */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>
          Language
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
          {supportedLanguages.map((lang) => (
            <button
              key={`${lang.code}-${lang.region}`}
              onClick={() => setSelectedLanguage(lang.code)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '14px 16px',
                border: selectedLanguage === lang.code ? '2px solid #111827' : '1px solid #e5e7eb',
                borderRadius: '10px',
                background: selectedLanguage === lang.code ? '#fafafa' : 'white',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827', marginBottom: '2px' }}>
                {lang.name}
              </span>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                {lang.region}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Currency Section */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
          Currency
        </h3>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
          Prices will be shown in your selected currency. CAD is recommended for Canadian users.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px' }}>
          {supportedCurrencies.map((curr) => (
            <button
              key={curr.code}
              onClick={() => setSelectedCurrency(curr.code)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '14px 16px',
                border: selectedCurrency === curr.code ? '2px solid #111827' : '1px solid #e5e7eb',
                borderRadius: '10px',
                background: selectedCurrency === curr.code ? '#fafafa' : 'white',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827', marginBottom: '2px' }}>
                {curr.name}
              </span>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                {curr.code} – {curr.symbol}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Distance Unit Section */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
          Distance Unit
        </h3>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
          Choose how distances are displayed. Kilometers is the default for Canada.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
          {supportedDistanceUnits.map((unit) => (
            <button
              key={unit.code}
              onClick={() => setSelectedDistanceUnit(unit.code)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '14px 16px',
                border: selectedDistanceUnit === unit.code ? '2px solid #111827' : '1px solid #e5e7eb',
                borderRadius: '10px',
                background: selectedDistanceUnit === unit.code ? '#fafafa' : 'white',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827', marginBottom: '2px' }}>
                {unit.name}
              </span>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                {unit.abbreviation}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
        <button
          onClick={onBack}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            background: 'white',
            color: '#374151',
            fontWeight: 500,
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          style={{
            padding: '10px 24px',
            borderRadius: '8px',
            border: 'none',
            background: hasChanges ? '#111827' : '#9ca3af',
            color: 'white',
            fontWeight: 500,
            fontSize: '14px',
            cursor: hasChanges ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {saving ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Saving...
            </>
          ) : saved ? (
            <>
              <i className="fas fa-check"></i>
              Saved!
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </div>
  );
}

export default LanguageCurrencyPanel;
