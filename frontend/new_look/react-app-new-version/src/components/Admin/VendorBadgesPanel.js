import React, { useState, useEffect } from 'react';
import { showBanner } from '../../utils/helpers';
import { apiGet, apiPost, apiDelete } from '../../utils/api';
import { LoadingState, EmptyState } from '../common/AdminComponents';
import { ActionButtonGroup, ActionButton as IconActionButton, ViewButton } from '../common/UIComponents';

const VendorBadgesPanel = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorBadges, setVendorBadges] = useState([]);
  const [badgeTypes, setBadgeTypes] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    badgeType: '',
    badgeName: '',
    year: new Date().getFullYear(),
    imageURL: '',
    description: ''
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Default badge types
  const defaultBadgeTypes = [
    { BadgeType: 'new_vendor', BadgeName: 'New Vendor', Description: 'Recently joined vendor', Icon: 'fa-sparkles', Color: '#0369a1' },
    { BadgeType: 'top_rated', BadgeName: 'Top Rated', Description: 'Highly rated by clients', Icon: 'fa-star', Color: '#d97706' },
    { BadgeType: 'choice_award', BadgeName: 'Choice Award', Description: 'Winner of choice awards', Icon: 'fa-award', Color: '#dc2626' },
    { BadgeType: 'premium', BadgeName: 'Premium', Description: 'Premium vendor status', Icon: 'fa-crown', Color: '#7c3aed' },
    { BadgeType: 'verified', BadgeName: 'Verified', Description: 'Identity verified', Icon: 'fa-check-circle', Color: '#059669' },
    { BadgeType: 'featured', BadgeName: 'Featured', Description: 'Featured vendor', Icon: 'fa-fire', Color: '#db2777' }
  ];

  useEffect(() => {
    fetchVendors();
    fetchBadgeTypes();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await apiGet('/admin/vendors?status=approved&limit=100');
      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors || []);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      showBanner('Failed to load vendors', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchBadgeTypes = async () => {
    try {
      const response = await apiGet('/admin/badges');

      if (response.ok) {
        const data = await response.json();
        setBadgeTypes(data.badgeTypes || defaultBadgeTypes);
      } else {
        setBadgeTypes(defaultBadgeTypes);
      }
    } catch (error) {
      console.error('Error fetching badge types:', error);
      setBadgeTypes(defaultBadgeTypes);
    }
  };

  const fetchVendorBadges = async (vendorId) => {
    try {
      const response = await apiGet(`/admin/vendors/${vendorId}/badges`);

      if (response.ok) {
        const data = await response.json();
        setVendorBadges(data.badges || []);
      }
    } catch (error) {
      console.error('Error fetching vendor badges:', error);
      setVendorBadges([]);
    }
  };

  const handleSelectVendor = async (vendor) => {
    setSelectedVendor(vendor);
    await fetchVendorBadges(vendor.VendorProfileID);
  };

  const handleAssignBadge = async () => {
    if (!selectedVendor || !assignForm.badgeType) {
      showBanner('Please select a badge type', 'error');
      return;
    }

    try {
      setActionLoading(true);
      const response = await apiPost(`/admin/vendors/${selectedVendor.VendorProfileID}/badges`, assignForm);

      if (response.ok) {
        showBanner('Badge assigned successfully!', 'success');
        setShowAssignModal(false);
        setAssignForm({
          badgeType: '',
          badgeName: '',
          year: new Date().getFullYear(),
          imageURL: '',
          description: ''
        });
        await fetchVendorBadges(selectedVendor.VendorProfileID);
      } else {
        const data = await response.json();
        showBanner(data.message || 'Failed to assign badge', 'error');
      }
    } catch (error) {
      console.error('Error assigning badge:', error);
      showBanner('Failed to assign badge', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveBadge = async (badgeId) => {
    if (!window.confirm('Are you sure you want to remove this badge?')) return;

    try {
      setActionLoading(true);
      const response = await apiDelete(`/admin/vendors/${selectedVendor.VendorProfileID}/badges/${badgeId}`);

      if (response.ok) {
        showBanner('Badge removed successfully!', 'success');
        await fetchVendorBadges(selectedVendor.VendorProfileID);
      } else {
        showBanner('Failed to remove badge', 'error');
      }
    } catch (error) {
      console.error('Error removing badge:', error);
      showBanner('Failed to remove badge', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getBadgeStyle = (badgeType) => {
    const styles = {
      'new_vendor': { bg: '#e0f2fe', color: '#0369a1', icon: 'fa-sparkles' },
      'top_rated': { bg: '#fef3c7', color: '#d97706', icon: 'fa-star' },
      'choice_award': { bg: '#fee2e2', color: '#dc2626', icon: 'fa-award' },
      'premium': { bg: '#f3e8ff', color: '#7c3aed', icon: 'fa-crown' },
      'verified': { bg: '#d1fae5', color: '#059669', icon: 'fa-check-circle' },
      'featured': { bg: '#fce7f3', color: '#db2777', icon: 'fa-fire' }
    };
    return styles[badgeType] || { bg: '#f3f4f6', color: '#6b7280', icon: 'fa-certificate' };
  };

  const filteredVendors = vendors.filter(v => 
    (v.BusinessName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.Email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-panel vendor-badges-panel">
      <div className="panel-header">
        <h2><i className="fas fa-award"></i> Vendor Badges Management</h2>
        <p className="panel-description">Assign and manage badges for vendors (New, Top Rated, Choice Awards, Premium, etc.)</p>
      </div>

      {/* Toolbar */}
      <div className="panel-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="toolbar-right">
          <button className="btn-secondary" onClick={fetchVendors}>
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="data-table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading vendors...</p>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-store"></i>
            <h3>No vendors found</h3>
            <p>Try adjusting your search term</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Category</th>
                <th>Current Badges</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.map(vendor => (
                <tr 
                  key={vendor.VendorProfileID}
                  style={{ background: selectedVendor?.VendorProfileID === vendor.VendorProfileID ? '#f0f4ff' : 'transparent' }}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {vendor.LogoURL ? (
                        <img 
                          src={vendor.LogoURL} 
                          alt={vendor.BusinessName}
                          style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '8px', 
                          background: '#f3f4f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <i className="fas fa-store" style={{ color: '#9ca3af' }}></i>
                        </div>
                      )}
                      <div>
                        <strong style={{ display: 'block', color: '#1f2937' }}>{vendor.BusinessName}</strong>
                        <small style={{ color: '#9ca3af', fontSize: '0.75rem' }}>ID: {vendor.VendorProfileID}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      background: '#f3f4f6', 
                      color: '#6b7280', 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '12px',
                      fontSize: '0.85rem'
                    }}>
                      {vendor.Categories || 'No category'}
                    </span>
                  </td>
                  <td>
                    {selectedVendor?.VendorProfileID === vendor.VendorProfileID && vendorBadges.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {vendorBadges.map(badge => {
                          const style = getBadgeStyle(badge.BadgeType);
                          return (
                            <span 
                              key={badge.BadgeID}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.2rem 0.5rem',
                                background: style.bg,
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                color: style.color,
                                fontWeight: 500
                              }}
                            >
                              <i className={`fas ${style.icon}`} style={{ fontSize: '0.65rem' }}></i>
                              {badge.BadgeName || badge.BadgeType}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRemoveBadge(badge.BadgeID); }}
                                style={{
                                  background: 'rgba(0,0,0,0.1)',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '14px',
                                  height: '14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  marginLeft: '0.15rem',
                                  padding: 0
                                }}
                              >
                                <i className="fas fa-times" style={{ fontSize: '0.5rem', color: '#6b7280' }}></i>
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.85rem', fontStyle: 'italic' }}>
                        {selectedVendor?.VendorProfileID === vendor.VendorProfileID ? 'No badges' : 'Click to view'}
                      </span>
                    )}
                  </td>
                  <td>
                    <ActionButtonGroup>
                      <ViewButton onClick={() => handleSelectVendor(vendor)} title="View Badges" />
                      <IconActionButton action="add" onClick={() => { handleSelectVendor(vendor); setShowAssignModal(true); }} title="Assign Badge" />
                    </ActionButtonGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Assign Badge Modal */}
      {showAssignModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowAssignModal(false)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Assign Badge to {selectedVendor?.BusinessName}</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Badge Type *</label>
              <select
                value={assignForm.badgeType}
                onChange={(e) => {
                  const selected = badgeTypes.find(b => b.BadgeType === e.target.value);
                  setAssignForm({
                    ...assignForm,
                    badgeType: e.target.value,
                    badgeName: selected?.BadgeName || ''
                  });
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
              >
                <option value="">Select a badge type...</option>
                {badgeTypes.map(badge => (
                  <option key={badge.BadgeType} value={badge.BadgeType}>
                    {badge.BadgeName} - {badge.Description}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Custom Badge Name</label>
              <input
                type="text"
                value={assignForm.badgeName}
                onChange={(e) => setAssignForm({ ...assignForm, badgeName: e.target.value })}
                placeholder="e.g., Toronto's Choice Award"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Year</label>
              <input
                type="number"
                value={assignForm.year}
                onChange={(e) => setAssignForm({ ...assignForm, year: parseInt(e.target.value) || '' })}
                placeholder="2024"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Custom Badge Image URL</label>
              <input
                type="text"
                value={assignForm.imageURL}
                onChange={(e) => setAssignForm({ ...assignForm, imageURL: e.target.value })}
                placeholder="https://example.com/badge.png"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Description</label>
              <textarea
                value={assignForm.description}
                onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })}
                placeholder="Optional description for this badge..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAssignModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignBadge}
                disabled={actionLoading || !assignForm.badgeType}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#5e72e4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  opacity: actionLoading || !assignForm.badgeType ? 0.6 : 1
                }}
              >
                {actionLoading ? 'Assigning...' : 'Assign Badge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorBadgesPanel;
