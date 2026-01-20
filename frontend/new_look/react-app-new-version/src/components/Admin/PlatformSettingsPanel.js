import React, { useState, useEffect } from 'react';
import { showBanner } from '../../utils/helpers';
import { apiGet, apiPost, apiPut } from '../../utils/api';
import { LoadingState } from '../common/AdminComponents';

const PlatformSettingsPanel = () => {
  const [activeTab, setActiveTab] = useState('general'); // general, appearance, api, restrictions, fees
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [commissionSettings, setCommissionSettings] = useState({
    platformFeePercent: 5,
    stripeFeePercent: 2.9,
    stripeFeeFixed: 0.30,
    taxPercent: 13,
    currency: 'CAD'
  });
  const [savingCommission, setSavingCommission] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchCommissionSettings();
  }, []);

  const fetchCommissionSettings = async () => {
    try {
      const response = await apiGet('/admin/commission-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings && Array.isArray(data.settings)) {
          // Parse settings from array format to object
          const settingsObj = {};
          data.settings.forEach(s => {
            settingsObj[s.SettingKey] = parseFloat(s.SettingValue) || 0;
          });
          setCommissionSettings({
            platformFeePercent: settingsObj['platform_fee_percent'] ?? 5,
            stripeFeePercent: settingsObj['stripe_fee_percent'] ?? 2.9,
            stripeFeeFixed: settingsObj['stripe_fee_fixed'] ?? 0.30,
            taxPercent: settingsObj['tax_percent'] ?? 13,
            currency: 'CAD'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching commission settings:', error);
    }
  };

  const saveCommissionSettings = async () => {
    try {
      setSavingCommission(true);
      const response = await apiPut('/admin/commission-settings', commissionSettings);
      if (response.ok) {
        showBanner('Commission settings saved successfully', 'success');
      } else {
        showBanner('Failed to save commission settings', 'error');
      }
    } catch (error) {
      showBanner('Failed to save commission settings', 'error');
    } finally {
      setSavingCommission(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await apiGet('/admin/settings');

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || getDefaultSettings());
      } else {
        setSettings(getDefaultSettings());
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setSettings(getDefaultSettings());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultSettings = () => ({
    platformName: 'Planbeau',
    tagline: 'Find and book the perfect vendors for your events',
    supportEmail: 'support@planbeau.com',
    supportPhone: '',
    logoUrl: '/planbeau_logo.png',
    faviconUrl: '/favicon.ico',
    primaryColor: '#5e72e4',
    secondaryColor: '#2dce89',
    maintenanceMode: false,
    maintenanceMessage: 'We are currently performing maintenance. Please check back soon.',
    stripePublicKey: '',
    stripeSecretKey: '',
    googleMapsApiKey: '',
    firebaseConfig: '',
    serviceAreaRestrictions: ['Ontario', 'British Columbia', 'Alberta'],
    allowedCountries: ['Canada'],
    minBookingAmount: 50,
    maxBookingAdvanceDays: 365
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await apiPut('/admin/settings', settings);

      if (response.ok) {
        showBanner('Settings saved successfully', 'success');
      }
    } catch (error) {
      showBanner('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleMaintenanceToggle = async () => {
    const newValue = !settings.maintenanceMode;
    if (newValue && !window.confirm('Are you sure you want to enable maintenance mode? Users will not be able to access the platform.')) {
      return;
    }

    setSettings({ ...settings, maintenanceMode: newValue });
    
    try {
      await apiPost('/admin/settings/maintenance', { enabled: newValue });
      showBanner(`Maintenance mode ${newValue ? 'enabled' : 'disabled'}`, 'success');
    } catch (error) {
      showBanner('Failed to update maintenance mode', 'error');
    }
  };

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel platform-settings">
      {/* Tabs */}
      <div className="panel-tabs">
        <button
          className={`tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <i className="fas fa-cog"></i> General
        </button>
        <button
          className={`tab ${activeTab === 'appearance' ? 'active' : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          <i className="fas fa-palette"></i> Appearance
        </button>
        <button
          className={`tab ${activeTab === 'api' ? 'active' : ''}`}
          onClick={() => setActiveTab('api')}
        >
          <i className="fas fa-key"></i> API Keys
        </button>
        <button
          className={`tab ${activeTab === 'restrictions' ? 'active' : ''}`}
          onClick={() => setActiveTab('restrictions')}
        >
          <i className="fas fa-map-marker-alt"></i> Restrictions
        </button>
        <button
          className={`tab ${activeTab === 'fees' ? 'active' : ''}`}
          onClick={() => setActiveTab('fees')}
        >
          <i className="fas fa-percentage"></i> Fees & Commission
        </button>
      </div>

      {/* Fees & Commission Settings */}
      {activeTab === 'fees' && (
        <div className="settings-section">
          <div className="section-card">
            <h3><i className="fas fa-dollar-sign"></i> Platform Fees & Commission</h3>
            <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
              Configure the fees charged to customers on each booking. These fees are added to the service price at checkout.
            </p>
            
            <div className="form-row">
              <div className="form-group">
                <label>Platform Service Fee (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={commissionSettings.platformFeePercent}
                  onChange={e => setCommissionSettings({ ...commissionSettings, platformFeePercent: parseFloat(e.target.value) || 0 })}
                />
                <small style={{ color: '#888' }}>Fee charged to customers for using the platform</small>
              </div>
              <div className="form-group">
                <label>Tax Rate (HST/GST %)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="30"
                  value={commissionSettings.taxPercent}
                  onChange={e => setCommissionSettings({ ...commissionSettings, taxPercent: parseFloat(e.target.value) || 0 })}
                />
                <small style={{ color: '#888' }}>Tax applied to subtotal + platform fee</small>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Payment Processing Fee (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={commissionSettings.stripeFeePercent}
                  onChange={e => setCommissionSettings({ ...commissionSettings, stripeFeePercent: parseFloat(e.target.value) || 0 })}
                />
                <small style={{ color: '#888' }}>Stripe processing fee percentage</small>
              </div>
              <div className="form-group">
                <label>Payment Processing Fixed Fee ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={commissionSettings.stripeFeeFixed}
                  onChange={e => setCommissionSettings({ ...commissionSettings, stripeFeeFixed: parseFloat(e.target.value) || 0 })}
                />
                <small style={{ color: '#888' }}>Fixed fee per transaction (e.g., $0.30)</small>
              </div>
            </div>
            
            <div className="form-group">
              <label>Currency</label>
              <select
                value={commissionSettings.currency}
                onChange={e => setCommissionSettings({ ...commissionSettings, currency: e.target.value })}
              >
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="USD">USD - US Dollar</option>
              </select>
            </div>
            
            {/* Fee Preview */}
            <div style={{ 
              background: '#f8f9fa', 
              padding: '16px', 
              borderRadius: '8px', 
              marginTop: '20px',
              border: '1px solid #e9ecef'
            }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
                <i className="fas fa-calculator"></i> Fee Preview (for $100 service)
              </h4>
              <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Service Price:</span>
                  <span>$100.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Platform Fee ({commissionSettings.platformFeePercent}%):</span>
                  <span>${(100 * commissionSettings.platformFeePercent / 100).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tax ({commissionSettings.taxPercent}%):</span>
                  <span>${((100 + 100 * commissionSettings.platformFeePercent / 100) * commissionSettings.taxPercent / 100).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Processing Fee ({commissionSettings.stripeFeePercent}% + ${commissionSettings.stripeFeeFixed}):</span>
                  <span>${(100 * commissionSettings.stripeFeePercent / 100 + commissionSettings.stripeFeeFixed).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, borderTop: '1px solid #dee2e6', paddingTop: '8px', marginTop: '4px' }}>
                  <span>Total Customer Pays:</span>
                  <span>${(
                    100 + 
                    100 * commissionSettings.platformFeePercent / 100 + 
                    (100 + 100 * commissionSettings.platformFeePercent / 100) * commissionSettings.taxPercent / 100 +
                    100 * commissionSettings.stripeFeePercent / 100 + commissionSettings.stripeFeeFixed
                  ).toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '20px' }}>
              <button 
                className="btn-primary" 
                onClick={saveCommissionSettings}
                disabled={savingCommission}
              >
                {savingCommission ? 'Saving...' : 'Save Fee Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="settings-section">
          <div className="section-card">
            <h3><i className="fas fa-info-circle"></i> Platform Information</h3>
            <div className="form-group">
              <label>Platform Name</label>
              <input
                type="text"
                value={settings.platformName}
                onChange={e => setSettings({ ...settings, platformName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={e => setSettings({ ...settings, tagline: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Support Email</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Support Phone</label>
                <input
                  type="text"
                  value={settings.supportPhone}
                  onChange={e => setSettings({ ...settings, supportPhone: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="section-card">
            <h3><i className="fas fa-map-marker-alt"></i> Location Settings</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Location Session Duration (hours)</label>
                <input
                  type="number"
                  min="1"
                  max="720"
                  value={localStorage.getItem('planbeau_location_session_hours') || 24}
                  onChange={e => {
                    const hours = Math.max(1, Math.min(720, parseInt(e.target.value) || 24));
                    localStorage.setItem('planbeau_location_session_hours', hours.toString());
                    showBanner(`Location session duration set to ${hours} hours`, 'success');
                  }}
                />
                <small style={{ color: '#888' }}>
                  How long a user's selected location persists before reverting to IP-based detection. 
                  Default: 24 hours. Max: 720 hours (30 days).
                </small>
              </div>
              <div className="form-group">
                <label>Current Setting</label>
                <div style={{ 
                  padding: '12px', 
                  background: '#f0f9ff', 
                  borderRadius: '8px', 
                  border: '1px solid #bae6fd',
                  fontSize: '14px',
                  color: '#0369a1'
                }}>
                  <i className="fas fa-clock" style={{ marginRight: '8px' }}></i>
                  User locations persist for <strong>{localStorage.getItem('planbeau_location_session_hours') || 24} hours</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="section-card warning">
            <h3><i className="fas fa-tools"></i> Maintenance Mode</h3>
            <div className="maintenance-toggle">
              <div className="toggle-info">
                <p>When enabled, users will see a maintenance page instead of the platform.</p>
                <span className={`status ${settings.maintenanceMode ? 'active' : 'inactive'}`}>
                  {settings.maintenanceMode ? 'Currently Active' : 'Currently Inactive'}
                </span>
              </div>
              <label className="toggle-switch large">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={handleMaintenanceToggle}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            {settings.maintenanceMode && (
              <div className="form-group">
                <label>Maintenance Message</label>
                <textarea
                  value={settings.maintenanceMessage}
                  onChange={e => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                  rows={3}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Appearance Settings */}
      {activeTab === 'appearance' && (
        <div className="settings-section">
          <div className="section-card">
            <h3><i className="fas fa-image"></i> Branding</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Logo URL</label>
                <input
                  type="text"
                  value={settings.logoUrl}
                  onChange={e => setSettings({ ...settings, logoUrl: e.target.value })}
                />
                {settings.logoUrl && (
                  <div className="preview-box">
                    <img src={settings.logoUrl} alt="Logo Preview" style={{ maxHeight: '50px' }} />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Favicon URL</label>
                <input
                  type="text"
                  value={settings.faviconUrl}
                  onChange={e => setSettings({ ...settings, faviconUrl: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="section-card">
            <h3><i className="fas fa-palette"></i> Theme Colors</h3>
            <div className="color-pickers">
              <div className="color-picker-group">
                <label>Primary Color</label>
                <div className="color-input">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={e => setSettings({ ...settings, primaryColor: e.target.value })}
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={e => setSettings({ ...settings, primaryColor: e.target.value })}
                  />
                </div>
              </div>
              <div className="color-picker-group">
                <label>Secondary Color</label>
                <div className="color-input">
                  <input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={e => setSettings({ ...settings, secondaryColor: e.target.value })}
                  />
                  <input
                    type="text"
                    value={settings.secondaryColor}
                    onChange={e => setSettings({ ...settings, secondaryColor: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="color-preview">
              <div className="preview-button" style={{ background: settings.primaryColor }}>
                Primary Button
              </div>
              <div className="preview-button" style={{ background: settings.secondaryColor }}>
                Secondary Button
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Keys Settings */}
      {activeTab === 'api' && (
        <div className="settings-section">
          <div className="section-card">
            <h3><i className="fab fa-stripe"></i> Stripe Configuration</h3>
            <div className="form-group">
              <label>Stripe Public Key</label>
              <input
                type="text"
                value={settings.stripePublicKey}
                onChange={e => setSettings({ ...settings, stripePublicKey: e.target.value })}
                placeholder="pk_live_..."
              />
            </div>
            <div className="form-group">
              <label>Stripe Secret Key</label>
              <input
                type="password"
                value={settings.stripeSecretKey}
                onChange={e => setSettings({ ...settings, stripeSecretKey: e.target.value })}
                placeholder="sk_live_..."
              />
              <small className="help-text">⚠️ Keep this key secure. Never share it publicly.</small>
            </div>
          </div>

          <div className="section-card">
            <h3><i className="fab fa-google"></i> Google Services</h3>
            <div className="form-group">
              <label>Google Maps API Key</label>
              <input
                type="text"
                value={settings.googleMapsApiKey}
                onChange={e => setSettings({ ...settings, googleMapsApiKey: e.target.value })}
                placeholder="AIza..."
              />
            </div>
          </div>

          <div className="section-card">
            <h3><i className="fas fa-fire"></i> Firebase Configuration</h3>
            <div className="form-group">
              <label>Firebase Config (JSON)</label>
              <textarea
                value={settings.firebaseConfig}
                onChange={e => setSettings({ ...settings, firebaseConfig: e.target.value })}
                placeholder='{"apiKey": "...", "authDomain": "...", ...}'
                rows={6}
              />
            </div>
          </div>
        </div>
      )}

      {/* Restrictions Settings */}
      {activeTab === 'restrictions' && (
        <div className="settings-section">
          <div className="section-card">
            <h3><i className="fas fa-globe"></i> Geographic Restrictions</h3>
            <div className="form-group">
              <label>Allowed Countries</label>
              <div className="tags-input">
                {settings.allowedCountries?.map((country, index) => (
                  <span key={index} className="tag">
                    {country}
                    <button onClick={() => {
                      const newCountries = settings.allowedCountries.filter((_, i) => i !== index);
                      setSettings({ ...settings, allowedCountries: newCountries });
                    }}>×</button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="Add country..."
                  onKeyPress={e => {
                    if (e.key === 'Enter' && e.target.value) {
                      setSettings({
                        ...settings,
                        allowedCountries: [...(settings.allowedCountries || []), e.target.value]
                      });
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Service Area Restrictions (Provinces/States)</label>
              <div className="tags-input">
                {settings.serviceAreaRestrictions?.map((area, index) => (
                  <span key={index} className="tag">
                    {area}
                    <button onClick={() => {
                      const newAreas = settings.serviceAreaRestrictions.filter((_, i) => i !== index);
                      setSettings({ ...settings, serviceAreaRestrictions: newAreas });
                    }}>×</button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="Add province/state..."
                  onKeyPress={e => {
                    if (e.key === 'Enter' && e.target.value) {
                      setSettings({
                        ...settings,
                        serviceAreaRestrictions: [...(settings.serviceAreaRestrictions || []), e.target.value]
                      });
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="section-card">
            <h3><i className="fas fa-calendar-alt"></i> Booking Restrictions</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Minimum Booking Amount ($)</label>
                <input
                  type="number"
                  value={settings.minBookingAmount}
                  onChange={e => setSettings({ ...settings, minBookingAmount: parseInt(e.target.value) })}
                  min={0}
                />
              </div>
              <div className="form-group">
                <label>Max Advance Booking (Days)</label>
                <input
                  type="number"
                  value={settings.maxBookingAdvanceDays}
                  onChange={e => setSettings({ ...settings, maxBookingAdvanceDays: parseInt(e.target.value) })}
                  min={1}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="settings-footer">
        <button className="btn-secondary" onClick={fetchSettings}>
          <i className="fas fa-undo"></i> Reset
        </button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default PlatformSettingsPanel;
