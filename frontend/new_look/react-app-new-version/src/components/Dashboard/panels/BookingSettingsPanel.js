import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';

function BookingSettingsPanel({ onBack, vendorProfileId }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [instantBookingEnabled, setInstantBookingEnabled] = useState(false);
  const [minBookingLeadTimeHours, setMinBookingLeadTimeHours] = useState(24);
  const [leadTimeOptions, setLeadTimeOptions] = useState([]);

  useEffect(() => {
    loadData();
  }, [vendorProfileId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Load lead time options
      const optionsRes = await fetch(`${API_BASE_URL}/vendors/lookup/lead-times`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (optionsRes.ok) {
        const optionsData = await optionsRes.json();
        setLeadTimeOptions(optionsData.leadTimes || []);
      }
      
      // Load current settings
      const res = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}/attributes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setInstantBookingEnabled(data.attributes?.instantBookingEnabled || false);
        setMinBookingLeadTimeHours(data.attributes?.minBookingLeadTimeHours || 24);
      }
    } catch (error) {
      console.error('Error loading booking settings:', error);
      showBanner('Failed to load booking settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}/booking-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          instantBookingEnabled,
          minBookingLeadTimeHours
        })
      });
      
      if (res.ok) {
        showBanner('Booking settings saved successfully!', 'success');
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving booking settings:', error);
      showBanner('Failed to save booking settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <button className="btn btn-outline back-to-menu-btn" style={{ marginBottom: '1rem' }} onClick={onBack}>
          <i className="fas fa-arrow-left"></i> Back to Business Profile Menu
        </button>
        <div className="dashboard-card">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button className="btn btn-outline back-to-menu-btn" style={{ marginBottom: '1rem' }} onClick={onBack}>
        <i className="fas fa-arrow-left"></i> Back to Business Profile Menu
      </button>
      <div className="dashboard-card">
        <h2 className="dashboard-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="fas fa-calendar-check" style={{ color: 'var(--primary)' }}></i>
          Booking Settings
        </h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Configure how clients can book your services, including instant booking and lead time requirements.
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />
        {/* Instant Booking Toggle */}
        <div style={{ 
          background: '#f9fafb', 
          borderRadius: '12px', 
          padding: '1.5rem',
          marginBottom: '1.5rem',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
                Instant Booking
              </h3>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.5 }}>
                When enabled, clients can book and pay immediately without waiting for your approval. 
                Your profile will display an "Instant Booking" badge.
              </p>
            </div>
            <label className="toggle-switch" style={{ flexShrink: 0 }}>
              <input
                type="checkbox"
                checked={instantBookingEnabled}
                onChange={(e) => setInstantBookingEnabled(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          {instantBookingEnabled && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              background: '#eff6ff', 
              borderRadius: '8px',
              border: '1px solid #bfdbfe'
            }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e40af' }}>
                With instant booking enabled, clients can book available time slots directly. 
                Make sure your availability calendar is up to date.
              </p>
            </div>
          )}
        </div>

        {/* Minimum Lead Time */}
        <div style={{ 
          background: '#f9fafb', 
          borderRadius: '12px', 
          padding: '1.5rem',
          marginBottom: '2rem',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
            Minimum Booking Lead Time
          </h3>
          <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.5 }}>
            Set the minimum advance notice required for bookings. Dates that don't meet this requirement 
            will be blocked on your booking calendar.
          </p>
          
          <select
            value={minBookingLeadTimeHours}
            onChange={(e) => setMinBookingLeadTimeHours(parseInt(e.target.value))}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '1rem',
              background: 'white'
            }}
          >
            {leadTimeOptions.map(option => (
              <option key={option.hours} value={option.hours}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

export default BookingSettingsPanel;
