import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config';

function VendorAnalyticsSection() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    views: 0,
    bookings: 0,
    revenue: 0,
    conversionRate: 0,
    monthlyData: []
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/analytics`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics || analytics);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div id="vendor-analytics-section">
        <div className="dashboard-card">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="vendor-analytics-section">
      <div className="dashboard-card">
        <h2 className="dashboard-card-title">Performance Analytics</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>Profile Views</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>{analytics.views}</div>
          </div>
          
          <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>Total Bookings</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>{analytics.bookings}</div>
          </div>
          
          <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>Total Revenue</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#059669' }}>${analytics.revenue.toLocaleString()}</div>
          </div>
          
          <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>Conversion Rate</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#8b5cf6' }}>{analytics.conversionRate}%</div>
          </div>
        </div>

        <div style={{ padding: '2rem', backgroundColor: '#f8fafc', borderRadius: '12px', textAlign: 'center' }}>
          <i className="fas fa-chart-line" style={{ fontSize: '3rem', color: 'var(--text-light)', marginBottom: '1rem' }}></i>
          <p style={{ color: 'var(--text-light)' }}>Detailed analytics charts coming soon</p>
        </div>
      </div>
    </div>
  );
}

export default VendorAnalyticsSection;
