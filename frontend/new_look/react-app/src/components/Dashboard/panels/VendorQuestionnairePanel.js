import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';

function VendorQuestionnairePanel({ onBack, vendorProfileId }) {
  const [loading, setLoading] = useState(true);
  const [selectedFeatures, setSelectedFeatures] = useState([]);

  const featureOptions = [
    { id: 'customization', label: 'Customization Available', icon: 'fa-palette' },
    { id: 'packages', label: 'Package Deals', icon: 'fa-box' },
    { id: 'consultation', label: 'Free Consultation', icon: 'fa-handshake' },
    { id: 'delivery', label: 'Delivery/Setup Included', icon: 'fa-truck' },
    { id: 'insurance', label: 'Insured & Licensed', icon: 'fa-shield-alt' },
    { id: 'eco-friendly', label: 'Eco-Friendly Options', icon: 'fa-leaf' },
    { id: 'rush-service', label: 'Rush Service Available', icon: 'fa-bolt' },
    { id: 'payment-plans', label: 'Payment Plans', icon: 'fa-credit-card' },
    { id: 'satisfaction', label: 'Satisfaction Guarantee', icon: 'fa-check-circle' },
    { id: 'experience', label: '10+ Years Experience', icon: 'fa-award' },
    { id: 'references', label: 'References Available', icon: 'fa-users' },
    { id: 'portfolio', label: 'Portfolio Available', icon: 'fa-images' }
  ];

  useEffect(() => {
    if (vendorProfileId) {
      loadQuestionnaire();
    } else {
      setLoading(false);
    }
  }, [vendorProfileId]);

  const loadQuestionnaire = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/category-answers`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Extract features from answers
        const answers = data.answers || [];
        const features = answers.map(a => a.questionId).filter(Boolean);
        setSelectedFeatures(features);
      }
    } catch (error) {
      console.error('Error loading questionnaire:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeature = (featureId) => {
    setSelectedFeatures(prev =>
      prev.includes(featureId)
        ? prev.filter(f => f !== featureId)
        : [...prev, featureId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Convert selected features to answers format
      const answers = selectedFeatures.map(featureId => ({
        questionId: featureId,
        answer: 'yes'
      }));

      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/category-answers/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ answers })
      });
      
      if (response.ok) {
        showBanner('Features updated successfully!', 'success');
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
            <i className="fas fa-clipboard-check"></i>
          </span>
          Vendor Setup Questionnaire
        </h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Select features that describe your services to help clients find you.
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {featureOptions.map(feature => (
              <label
                key={feature.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  border: selectedFeatures.includes(feature.id) ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  background: selectedFeatures.includes(feature.id) ? '#f0f7ff' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedFeatures.includes(feature.id)}
                  onChange={() => handleToggleFeature(feature.id)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <i className={`fas ${feature.icon}`} style={{ color: 'var(--primary)', fontSize: '1.2rem' }}></i>
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{feature.label}</span>
              </label>
            ))}
          </div>

          <button type="submit" className="btn btn-primary">Save Features</button>
        </form>
      </div>
    </div>
  );
}

export default VendorQuestionnairePanel;
