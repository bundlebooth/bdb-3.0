import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';

function PopularFiltersPanel({ onBack, vendorProfileId }) {
  const [loading, setLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState([]);

  const filterOptions = [
    { id: 'lgbtq-friendly', label: 'LGBTQ+ Friendly', icon: 'fa-rainbow', color: '#ec4899' },
    { id: 'eco-friendly', label: 'Eco-Friendly', icon: 'fa-leaf', color: '#10b981' },
    { id: 'pet-friendly', label: 'Pet-Friendly', icon: 'fa-paw', color: '#f59e0b' },
    { id: 'wheelchair-accessible', label: 'Wheelchair Accessible', icon: 'fa-wheelchair', color: '#3b82f6' },
    { id: 'family-friendly', label: 'Family-Friendly', icon: 'fa-users', color: '#8b5cf6' },
    { id: 'outdoor-venue', label: 'Outdoor Venue', icon: 'fa-tree', color: '#059669' },
    { id: 'indoor-venue', label: 'Indoor Venue', icon: 'fa-building', color: '#6366f1' },
    { id: 'parking-available', label: 'Parking Available', icon: 'fa-parking', color: '#0891b2' },
    { id: 'catering-available', label: 'Catering Available', icon: 'fa-utensils', color: '#dc2626' },
    { id: 'alcohol-permitted', label: 'Alcohol Permitted', icon: 'fa-wine-glass', color: '#7c3aed' },
    { id: 'live-music', label: 'Live Music Allowed', icon: 'fa-music', color: '#db2777' },
    { id: 'photography-allowed', label: 'Photography Allowed', icon: 'fa-camera', color: '#0284c7' },
    { id: 'customizable', label: 'Highly Customizable', icon: 'fa-sliders-h', color: '#ea580c' },
    { id: 'all-inclusive', label: 'All-Inclusive Packages', icon: 'fa-check-double', color: '#16a34a' },
    { id: 'budget-friendly', label: 'Budget-Friendly', icon: 'fa-dollar-sign', color: '#65a30d' },
    { id: 'luxury', label: 'Luxury Service', icon: 'fa-gem', color: '#a855f7' }
  ];

  useEffect(() => {
    if (vendorProfileId) {
      loadFilters();
    } else {
      setLoading(false);
    }
  }, [vendorProfileId]);

  const loadFilters = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/filters`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedFilters(data.filters ? data.filters.split(',') : []);
      }
    } catch (error) {
      console.error('Error loading filters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFilter = (filterId) => {
    setSelectedFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/filters`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          filters: selectedFilters.join(',')
        })
      });
      
      if (response.ok) {
        showBanner('Filters updated successfully!', 'success');
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
            <i className="fas fa-tags"></i>
          </span>
          Popular Filters
        </h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Enable special badges that help clients find your business based on their preferences.
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f0f7ff', borderRadius: 'var(--radius)', border: '1px solid #bfdbfe' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'start' }}>
              <i className="fas fa-info-circle" style={{ color: 'var(--primary)', marginTop: '0.25rem' }}></i>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text)' }}>
                Selected filters will appear as badges on your profile and help clients find you when they search with these criteria.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {filterOptions.map(filter => (
              <label
                key={filter.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  border: selectedFilters.includes(filter.id) ? `2px solid ${filter.color}` : '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  background: selectedFilters.includes(filter.id) ? `${filter.color}10` : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedFilters.includes(filter.id)}
                  onChange={() => handleToggleFilter(filter.id)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <i 
                  className={`fas ${filter.icon}`} 
                  style={{ color: filter.color, fontSize: '1.2rem' }}
                ></i>
                <span style={{ fontSize: '0.9rem', fontWeight: 500, flex: 1 }}>
                  {filter.label}
                </span>
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary">
              Save Filters
            </button>
            <span style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
              {selectedFilters.length} filter{selectedFilters.length !== 1 ? 's' : ''} selected
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PopularFiltersPanel;
