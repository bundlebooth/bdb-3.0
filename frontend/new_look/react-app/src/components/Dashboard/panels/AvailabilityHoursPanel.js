import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';

function AvailabilityHoursPanel({ onBack, vendorProfileId }) {
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState({
    monday: { open: '09:00', close: '17:00', closed: false },
    tuesday: { open: '09:00', close: '17:00', closed: false },
    wednesday: { open: '09:00', close: '17:00', closed: false },
    thursday: { open: '09:00', close: '17:00', closed: false },
    friday: { open: '09:00', close: '17:00', closed: false },
    saturday: { open: '10:00', close: '16:00', closed: false },
    sunday: { open: '10:00', close: '16:00', closed: true }
  });

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  useEffect(() => {
    if (vendorProfileId) {
      loadHours();
    } else {
      setLoading(false);
    }
  }, [vendorProfileId]);

  const loadHours = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/hours`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.hours) {
          setHours(data.hours);
        }
      }
    } catch (error) {
      console.error('Error loading hours:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHourChange = (day, field, value) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleToggleClosed = (day) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        closed: !prev[day].closed
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Convert hours object to array format for API
      const hoursArray = Object.entries(hours).map(([day, data]) => ({
        dayOfWeek: day,
        openTime: data.open,
        closeTime: data.close,
        isAvailable: !data.closed
      }));

      // Send each day separately as the API expects
      const promises = hoursArray.map(dayData =>
        fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/business-hours/upsert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(dayData)
        })
      );

      const responses = await Promise.all(promises);
      const allSuccess = responses.every(r => r.ok);
      
      if (!allSuccess) {
        throw new Error('Failed to update some hours');
      }

      const response = { ok: true };
      
      if (response.ok) {
        showBanner('Business hours updated successfully!', 'success');
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      console.error('Error saving:', error);
      showBanner('Failed to save changes', 'error');
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
        <h2 className="dashboard-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '1.1rem' }}>
            <i className="fas fa-clock"></i>
          </span>
          Availability & Business Hours
        </h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Set your regular business hours so clients know when you're available.
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {daysOfWeek.map(day => (
              <div
                key={day.key}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr auto',
                  gap: '1rem',
                  alignItems: 'center',
                  padding: '1rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  background: hours[day.key].closed ? '#f9fafb' : 'white'
                }}
              >
                <div style={{ fontWeight: 600 }}>{day.label}</div>
                
                {!hours[day.key].closed ? (
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Open:</label>
                      <input
                        type="time"
                        value={hours[day.key].open}
                        onChange={(e) => handleHourChange(day.key, 'open', e.target.value)}
                        style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                      />
                    </div>
                    <span style={{ color: 'var(--text-light)' }}>-</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Close:</label>
                      <input
                        type="time"
                        value={hours[day.key].close}
                        onChange={(e) => handleHourChange(day.key, 'close', e.target.value)}
                        style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>
                    Closed
                  </div>
                )}

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={hours[day.key].closed}
                    onChange={() => handleToggleClosed(day.key)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.9rem' }}>Closed</span>
                </label>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f7ff', borderRadius: 'var(--radius)', border: '1px solid #bfdbfe' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'start' }}>
              <i className="fas fa-info-circle" style={{ color: 'var(--primary)', marginTop: '0.25rem' }}></i>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text)' }}>
                These hours will be displayed on your public profile. You can still accept bookings outside these hours by arrangement.
              </p>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
            Save Business Hours
          </button>
        </form>
      </div>
    </div>
  );
}

export default AvailabilityHoursPanel;
