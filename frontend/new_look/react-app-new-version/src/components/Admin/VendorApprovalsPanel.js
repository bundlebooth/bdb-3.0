import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { showBanner } from '../../utils/helpers';

const VendorApprovalsPanel = () => {
  const [pendingProfiles, setPendingProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [fullProfileData, setFullProfileData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
  const [activeTab, setActiveTab] = useState('overview'); // overview, services, gallery, hours, features

  useEffect(() => {
    fetchProfiles();
  }, [filter]);

  // Fetch full profile details when a profile is selected
  useEffect(() => {
    if (selectedProfile) {
      fetchFullProfileDetails(selectedProfile.VendorProfileID);
    } else {
      setFullProfileData(null);
      setActiveTab('overview');
    }
  }, [selectedProfile]);

  const fetchFullProfileDetails = async (vendorProfileId) => {
    try {
      setLoadingDetails(true);
      const response = await fetch(`${API_BASE_URL}/admin/vendor-approvals/${vendorProfileId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFullProfileData(data.profile);
      } else {
        console.error('Failed to load vendor details, status:', response.status);
        showBanner('Failed to load vendor details', 'error');
      }
    } catch (error) {
      console.error('Error fetching vendor details:', error);
      showBanner('Failed to load vendor details', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/vendor-approvals?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingProfiles(data.profiles || []);
      } else {
        // Fallback to existing endpoint
        const fallbackResponse = await fetch(`${API_BASE_URL}/vendors/admin/pending-reviews`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          setPendingProfiles(data.profiles || []);
        }
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      showBanner('Failed to load vendor profiles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (vendorProfileId) => {
    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/vendors/${vendorProfileId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ adminNotes })
      });

      if (response.ok) {
        showBanner('Vendor approved and now visible on the platform!', 'success');
        setSelectedProfile(null);
        setAdminNotes('');
        fetchProfiles();
      } else {
        throw new Error('Failed to approve');
      }
    } catch (error) {
      showBanner('Failed to approve vendor', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (vendorProfileId) => {
    if (!rejectionReason.trim()) {
      showBanner('Please provide a rejection reason', 'error');
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/vendors/${vendorProfileId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason: rejectionReason, adminNotes })
      });

      if (response.ok) {
        showBanner('Vendor rejected and hidden from platform.', 'success');
        setSelectedProfile(null);
        setRejectionReason('');
        setAdminNotes('');
        fetchProfiles();
      } else {
        throw new Error('Failed to reject');
      }
    } catch (error) {
      showBanner('Failed to reject vendor', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleVisibility = async (vendorProfileId, currentVisibility) => {
    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/vendors/${vendorProfileId}/visibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ visible: !currentVisibility })
      });

      if (response.ok) {
        const data = await response.json();
        showBanner(data.message, 'success');
        fetchProfiles();
        // Refresh full profile data if modal is open
        if (selectedProfile?.VendorProfileID === vendorProfileId) {
          fetchFullProfileDetails(vendorProfileId);
        }
      } else {
        throw new Error('Failed to toggle visibility');
      }
    } catch (error) {
      showBanner('Failed to toggle visibility', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async (vendorProfileId) => {
    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/vendors/${vendorProfileId}/suspend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason: adminNotes || 'Suspended by admin' })
      });

      if (response.ok) {
        showBanner('Vendor suspended and hidden from platform.', 'success');
        setSelectedProfile(null);
        setAdminNotes('');
        fetchProfiles();
      } else {
        throw new Error('Failed to suspend');
      }
    } catch (error) {
      showBanner('Failed to suspend vendor', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending_review': { class: 'badge-warning', label: 'Pending Review', icon: 'fa-clock' },
      'Pending': { class: 'badge-warning', label: 'Pending Review', icon: 'fa-clock' },
      'approved': { class: 'badge-success', label: 'Approved', icon: 'fa-check-circle' },
      'Approved': { class: 'badge-success', label: 'Approved', icon: 'fa-check-circle' },
      'rejected': { class: 'badge-danger', label: 'Rejected', icon: 'fa-times-circle' },
      'Rejected': { class: 'badge-danger', label: 'Rejected', icon: 'fa-times-circle' },
      'Suspended': { class: 'badge-danger', label: 'Suspended', icon: 'fa-ban' }
    };
    const config = statusMap[status] || { class: 'badge-secondary', label: status, icon: 'fa-question' };
    return (
      <span className={`status-badge ${config.class}`}>
        <i className={`fas ${config.icon}`}></i> {config.label}
      </span>
    );
  };

  const getVisibilityBadge = (isVisible) => {
    if (isVisible) {
      return (
        <span className="status-badge badge-success" style={{ marginLeft: '0.5rem' }}>
          <i className="fas fa-eye"></i> Visible
        </span>
      );
    }
    return (
      <span className="status-badge badge-secondary" style={{ marginLeft: '0.5rem' }}>
        <i className="fas fa-eye-slash"></i> Hidden
      </span>
    );
  };

  const formatDayOfWeek = (day) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day] || day;
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    try {
      const [hours, minutes] = time.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  const data = fullProfileData || selectedProfile;

  return (
    <div className="admin-panel vendor-approvals-panel">
      {/* Toolbar */}
      <div className="panel-toolbar">
        <div className="toolbar-left">
          <div className="filter-tabs">
            {['pending', 'approved', 'rejected', 'all'].map(status => (
              <button
                key={status}
                className={`filter-tab ${filter === status ? 'active' : ''}`}
                onClick={() => setFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status === 'pending' && pendingProfiles.length > 0 && filter !== 'pending' && (
                  <span className="badge">{pendingProfiles.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="toolbar-right">
          <button className="btn-primary" onClick={fetchProfiles}>
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {/* Profiles List */}
      <div className="approvals-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading vendor applications...</p>
          </div>
        ) : pendingProfiles.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-clipboard-check"></i>
            <h3>No {filter === 'all' ? '' : filter} vendor applications</h3>
            <p>{filter === 'pending' ? 'All caught up! No vendors waiting for review.' : 'No vendors match this filter.'}</p>
          </div>
        ) : (
          <div className="profiles-grid">
            {pendingProfiles.map(profile => (
              <div 
                key={profile.VendorProfileID} 
                className={`profile-card ${selectedProfile?.VendorProfileID === profile.VendorProfileID ? 'selected' : ''}`}
                onClick={() => setSelectedProfile(profile)}
              >
                <div className="profile-header">
                  <div className="profile-image">
                    {profile.PrimaryImage ? (
                      <img src={profile.PrimaryImage} alt={profile.BusinessName} />
                    ) : (
                      <div className="image-placeholder">
                        <i className="fas fa-store"></i>
                      </div>
                    )}
                  </div>
                  <div className="profile-title">
                    <h3>{profile.BusinessName}</h3>
                    <p className="owner-info">
                      <i className="fas fa-user"></i> {profile.OwnerName || profile.Name}
                    </p>
                    <p className="email-info">
                      <i className="fas fa-envelope"></i> {profile.OwnerEmail || profile.Email}
                    </p>
                  </div>
                  <div className="profile-badges">
                    {getStatusBadge(profile.ProfileStatus)}
                    {getVisibilityBadge(profile.IsVisible)}
                  </div>
                </div>

                <div className="profile-details">
                  <div className="detail-row">
                    <span className="label"><i className="fas fa-map-marker-alt"></i> Location:</span>
                    <span className="value">{profile.City}{profile.State ? `, ${profile.State}` : ''}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label"><i className="fas fa-tags"></i> Category:</span>
                    <span className="value">{profile.Categories || profile.Category || 'Not specified'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label"><i className="fas fa-calendar"></i> Submitted:</span>
                    <span className="value">{formatDate(profile.CreatedAt)}</span>
                  </div>
                  {profile.BusinessPhone && (
                    <div className="detail-row">
                      <span className="label"><i className="fas fa-phone"></i> Phone:</span>
                      <span className="value">{profile.BusinessPhone}</span>
                    </div>
                  )}
                </div>

                {profile.BusinessDescription && (
                  <div className="profile-description">
                    <p>{profile.BusinessDescription.substring(0, 200)}{profile.BusinessDescription.length > 200 ? '...' : ''}</p>
                  </div>
                )}

                <div className="profile-actions">
                  {(profile.ProfileStatus === 'pending_review' || profile.ProfileStatus === 'Pending') && (
                    <button 
                      className="btn-approve"
                      onClick={(e) => { e.stopPropagation(); setSelectedProfile(profile); }}
                    >
                      <i className="fas fa-check"></i> Review & Approve
                    </button>
                  )}
                  {(profile.ProfileStatus === 'approved' || profile.ProfileStatus === 'Approved') && (
                    <button 
                      className={profile.IsVisible ? 'btn-secondary' : 'btn-success'}
                      onClick={(e) => { e.stopPropagation(); handleToggleVisibility(profile.VendorProfileID, profile.IsVisible); }}
                      disabled={actionLoading}
                    >
                      <i className={`fas ${profile.IsVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      {profile.IsVisible ? ' Hide' : ' Show'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedProfile && (
        <div className="modal-overlay" onClick={() => setSelectedProfile(null)}>
          <div className="modal-content review-modal large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-content">
                <h2>Review Vendor Application</h2>
                <div className="vendor-quick-info">
                  <span className="vendor-name">{selectedProfile.BusinessName}</span>
                  {getStatusBadge(selectedProfile.ProfileStatus)}
                  {getVisibilityBadge(fullProfileData?.IsVisible ?? selectedProfile.IsVisible)}
                </div>
              </div>
              <button className="close-btn" onClick={() => setSelectedProfile(null)}>
                
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="modal-tabs">
              {[
                { id: 'overview', label: 'Overview', icon: 'fa-info-circle' },
                { id: 'services', label: 'Services', icon: 'fa-concierge-bell' },
                { id: 'gallery', label: 'Gallery', icon: 'fa-images' },
                { id: 'hours', label: 'Hours & Availability', icon: 'fa-clock' },
                { id: 'features', label: 'Features & Areas', icon: 'fa-list-check' },
                { id: 'action', label: 'Review Action', icon: 'fa-gavel' }
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`modal-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <i className={`fas ${tab.icon}`}></i>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="modal-body">
              {loadingDetails ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading vendor details...</p>
                </div>
              ) : (
                <>
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="tab-content">
                      {/* Business Info */}
                      <div className="review-section">
                        <h3><i className="fas fa-store"></i> Business Information</h3>
                        <div className="info-grid">
                          <div className="info-item">
                            <label>Business Name</label>
                            <p>{data?.BusinessName}</p>
                          </div>
                          <div className="info-item">
                            <label>Display Name</label>
                            <p>{data?.DisplayName || data?.BusinessName}</p>
                          </div>
                          <div className="info-item">
                            <label>Categories</label>
                            <p>{Array.isArray(data?.Categories) ? data.Categories.join(', ') : (data?.Categories || 'Not specified')}</p>
                          </div>
                          <div className="info-item">
                            <label>Business Email</label>
                            <p>{data?.BusinessEmail || 'Not provided'}</p>
                          </div>
                          <div className="info-item">
                            <label>Business Phone</label>
                            <p>{data?.BusinessPhone || 'Not provided'}</p>
                          </div>
                          <div className="info-item">
                            <label>Website</label>
                            <p>{data?.Website ? <a href={data.Website} target="_blank" rel="noopener noreferrer">{data.Website}</a> : 'Not provided'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="review-section">
                        <h3><i className="fas fa-map-marker-alt"></i> Location</h3>
                        <div className="info-grid">
                          <div className="info-item full-width">
                            <label>Full Address</label>
                            <p>
                              {data?.StreetAddress && `${data.StreetAddress}, `}
                              {data?.City}{data?.State ? `, ${data.State}` : ''} {data?.PostalCode}
                              {data?.Country && `, ${data.Country}`}
                            </p>
                          </div>
                          {data?.Latitude && data?.Longitude && (
                            <div className="info-item">
                              <label>Coordinates</label>
                              <p>{data.Latitude}, {data.Longitude}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Owner Info */}
                      <div className="review-section">
                        <h3><i className="fas fa-user"></i> Owner Information</h3>
                        <div className="info-grid">
                          <div className="info-item">
                            <label>Owner Name</label>
                            <p>{data?.OwnerName}</p>
                          </div>
                          <div className="info-item">
                            <label>Owner Email</label>
                            <p>{data?.OwnerEmail}</p>
                          </div>
                          <div className="info-item">
                            <label>Owner Phone</label>
                            <p>{data?.OwnerPhone || 'Not provided'}</p>
                          </div>
                          <div className="info-item">
                            <label>Account Created</label>
                            <p>{formatDate(data?.UserCreatedAt)}</p>
                          </div>
                          <div className="info-item">
                            <label>Profile Submitted</label>
                            <p>{formatDate(data?.CreatedAt)}</p>
                          </div>
                          <div className="info-item">
                            <label>Last Updated</label>
                            <p>{formatDate(data?.UpdatedAt)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="review-section">
                        <h3><i className="fas fa-align-left"></i> Business Description</h3>
                        <div className="description-box">
                          <p>{data?.BusinessDescription || 'No description provided'}</p>
                        </div>
                      </div>

                      {/* Social Links */}
                      {data?.SocialLinks && data.SocialLinks.length > 0 && (
                        <div className="review-section">
                          <h3><i className="fas fa-share-alt"></i> Social Links</h3>
                          <div className="social-links-list">
                            {data.SocialLinks.map((link, idx) => (
                              <a key={idx} href={link.URL} target="_blank" rel="noopener noreferrer" className="social-link">
                                <i className={`fab fa-${link.Platform?.toLowerCase() || 'link'}`}></i>
                                {link.Platform}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Google Reviews Settings */}
                      {data?.GooglePlaceId && (
                        <div className="review-section">
                          <h3><i className="fab fa-google"></i> Google Reviews Integration</h3>
                          <div className="info-grid">
                            <div className="info-item">
                              <label>Google Place ID</label>
                              <p>{data.GooglePlaceId}</p>
                            </div>
                            <div className="info-item">
                              <label>Show Google Reviews</label>
                              <p>{data.ShowGoogleReviews ? 'Yes' : 'No'}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Stripe Status */}
                      <div className="review-section">
                        <h3><i className="fas fa-credit-card"></i> Payment Setup</h3>
                        <div className="info-grid">
                          <div className="info-item">
                            <label>Stripe Connected</label>
                            <p className={data?.StripeStatus?.connected || data?.StripeAccountId ? 'text-success' : 'text-warning'}>
                              {data?.StripeStatus?.connected || data?.StripeAccountId ? (
                                <><i className="fas fa-check-circle"></i> Connected</>
                              ) : (
                                <><i className="fas fa-exclamation-circle"></i> Not Connected</>
                              )}
                            </p>
                          </div>
                          {(data?.StripeStatus?.accountId || data?.StripeAccountId) && (
                            <div className="info-item">
                              <label>Stripe Account ID</label>
                              <p>{data?.StripeStatus?.accountId || data?.StripeAccountId}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Services Tab */}
                  {activeTab === 'services' && (
                    <div className="tab-content">
                      <div className="review-section">
                        <h3><i className="fas fa-concierge-bell"></i> Services Offered ({data?.Services?.length || 0})</h3>
                        {data?.Services && data.Services.length > 0 ? (
                          <div className="services-table">
                            <table>
                              <thead>
                                <tr>
                                  <th>Service Name</th>
                                  <th>Category</th>
                                  <th>Price</th>
                                  <th>Duration</th>
                                  <th>Max Attendees</th>
                                  <th>Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                {data.Services.map((service, idx) => (
                                  <tr key={idx}>
                                    <td><strong>{service.ServiceName}</strong></td>
                                    <td>{service.CategoryName || '-'}</td>
                                    <td className="price">${service.Price || 0}</td>
                                    <td>{service.DurationMinutes ? `${service.DurationMinutes} min` : '-'}</td>
                                    <td>{service.MaxAttendees || '-'}</td>
                                    <td className="description">{service.ServiceDescription || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="empty-section">
                            <i className="fas fa-inbox"></i>
                            <p>No services have been added yet</p>
                          </div>
                        )}
                      </div>

                      {/* FAQs */}
                      {data?.FAQs && data.FAQs.length > 0 && (
                        <div className="review-section">
                          <h3><i className="fas fa-question-circle"></i> FAQs ({data.FAQs.length})</h3>
                          <div className="faqs-list">
                            {data.FAQs.map((faq, idx) => (
                              <div key={idx} className="faq-item">
                                <div className="faq-question"><strong>Q:</strong> {faq.Question}</div>
                                <div className="faq-answer"><strong>A:</strong> {faq.Answer}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Gallery Tab */}
                  {activeTab === 'gallery' && (
                    <div className="tab-content">
                      <div className="review-section">
                        <h3><i className="fas fa-images"></i> Business Photos ({data?.Images?.length || 0})</h3>
                        {data?.Images && data.Images.length > 0 ? (
                          <div className="gallery-grid">
                            {data.Images.map((image, idx) => (
                              <div key={idx} className={`gallery-item ${image.IsPrimary ? 'primary' : ''}`}>
                                <img src={image.ImageURL} alt={image.Caption || `Photo ${idx + 1}`} />
                                {image.IsPrimary && <span className="primary-badge">Primary</span>}
                                {image.Caption && <p className="image-caption">{image.Caption}</p>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="empty-section">
                            <i className="fas fa-image"></i>
                            <p>No photos have been uploaded yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Hours & Availability Tab */}
                  {activeTab === 'hours' && (
                    <div className="tab-content">
                      <div className="review-section">
                        <h3><i className="fas fa-clock"></i> Business Hours</h3>
                        {data?.BusinessHours?.[0]?.Timezone && (
                          <p className="timezone-info">
                            <i className="fas fa-globe"></i> Timezone: <strong>{data.BusinessHours[0].Timezone}</strong>
                          </p>
                        )}
                        {data?.BusinessHours && data.BusinessHours.length > 0 ? (
                          <div className="hours-list">
                            {data.BusinessHours.map((hour, idx) => (
                              <div key={idx} className={`hour-row ${hour.IsAvailable === false || hour.IsClosed ? 'closed' : ''}`}>
                                <span className="day">{formatDayOfWeek(hour.DayOfWeek)}</span>
                                <span className="time">
                                  {hour.IsAvailable === false || hour.IsClosed 
                                    ? 'Closed' 
                                    : `${formatTime(hour.OpenTime)} - ${formatTime(hour.CloseTime)}`
                                  }
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="empty-section">
                            <i className="fas fa-calendar-times"></i>
                            <p>No business hours have been set</p>
                          </div>
                        )}
                      </div>

                      {/* Availability Exceptions */}
                      {data?.AvailabilityExceptions && data.AvailabilityExceptions.length > 0 && (
                        <div className="review-section">
                          <h3><i className="fas fa-calendar-alt"></i> Availability Exceptions</h3>
                          <div className="exceptions-list">
                            {data.AvailabilityExceptions.map((exc, idx) => (
                              <div key={idx} className="exception-item">
                                <span className="date">{formatDate(exc.ExceptionDate)}</span>
                                <span className={`type ${exc.IsAvailable ? 'available' : 'unavailable'}`}>
                                  {exc.IsAvailable ? 'Available' : 'Unavailable'}
                                </span>
                                {exc.Reason && <span className="reason">{exc.Reason}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Features & Areas Tab */}
                  {activeTab === 'features' && (
                    <div className="tab-content">
                      {/* Questionnaire Answers */}
                      <div className="review-section">
                        <h3><i className="fas fa-clipboard-list"></i> Questionnaire Answers ({data?.CategoryAnswers?.length || 0})</h3>
                        {data?.CategoryAnswers && data.CategoryAnswers.length > 0 ? (
                          <div className="questionnaire-list">
                            {data.CategoryAnswers.map((qa, idx) => (
                              <div key={idx} className="questionnaire-item">
                                <div className="question">
                                  <i className="fas fa-question-circle"></i>
                                  {qa.QuestionText}
                                </div>
                                <div className="answer">
                                  <i className="fas fa-reply"></i>
                                  {qa.Answer || 'No answer provided'}
                                </div>
                                {qa.Category && <span className="qa-category">{qa.Category}</span>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="empty-section">
                            <i className="fas fa-clipboard"></i>
                            <p>No questionnaire answers have been submitted</p>
                          </div>
                        )}
                      </div>

                      {/* Features/Amenities */}
                      <div className="review-section">
                        <h3><i className="fas fa-list-check"></i> Features & Amenities ({data?.Features?.length || 0})</h3>
                        {data?.Features && data.Features.length > 0 ? (
                          <div className="features-grid">
                            {data.Features.map((feature, idx) => (
                              <div key={idx} className="feature-tag">
                                <i className={feature.FeatureIcon || feature.CategoryIcon || 'fas fa-check'}></i>
                                {feature.FeatureName || feature.FeatureKey}
                                {feature.CategoryName && <span className="feature-category">({feature.CategoryName})</span>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="empty-section">
                            <i className="fas fa-list"></i>
                            <p>No features have been selected</p>
                          </div>
                        )}
                      </div>

                      {/* Service Areas with Map */}
                      <div className="review-section">
                        <h3><i className="fas fa-map"></i> Service Areas ({data?.ServiceAreas?.length || 0})</h3>
                        {data?.ServiceAreas && data.ServiceAreas.length > 0 ? (
                          <>
                            {/* Google Map */}
                            <div className="service-areas-map">
                              <iframe
                                title="Service Areas Map"
                                width="100%"
                                height="300"
                                style={{ border: 0, borderRadius: '8px' }}
                                loading="lazy"
                                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyCPhhp2rAt1VTrIzjgagJXZPZ_nc7K_BVo&q=${encodeURIComponent(
                                  data.ServiceAreas.map(a => `${a.CityName || a.City}, ${a.StateProvince || a.State || ''}`).join('|')
                                )}&zoom=8`}
                              />
                            </div>
                            {/* Areas List */}
                            <div className="areas-list" style={{ marginTop: '1rem' }}>
                              {data.ServiceAreas.map((area, idx) => (
                                <span key={idx} className="area-tag">
                                  <i className="fas fa-map-marker-alt"></i>
                                  {area.CityName || area.City}{area.StateProvince || area.State ? `, ${area.StateProvince || area.State}` : ''}
                                  {area.ServiceRadius ? ` (${area.ServiceRadius}km radius)` : ''}
                                </span>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="empty-section">
                            <i className="fas fa-map-marked-alt"></i>
                            <p>No service areas have been defined</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Tab */}
                  {activeTab === 'action' && (
                    <div className="tab-content">
                      {/* Summary Stats */}
                      <div className="review-section">
                        <h3><i className="fas fa-chart-bar"></i> Profile Completeness</h3>
                        <div className="completeness-grid">
                          <div className={`completeness-item ${data?.BusinessDescription ? 'complete' : 'incomplete'}`}>
                            <i className={`fas ${data?.BusinessDescription ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                            <span>Description</span>
                          </div>
                          <div className={`completeness-item ${data?.Images?.length > 0 ? 'complete' : 'incomplete'}`}>
                            <i className={`fas ${data?.Images?.length > 0 ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                            <span>Photos ({data?.Images?.length || 0})</span>
                          </div>
                          <div className={`completeness-item ${data?.Services?.length > 0 ? 'complete' : 'incomplete'}`}>
                            <i className={`fas ${data?.Services?.length > 0 ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                            <span>Services ({data?.Services?.length || 0})</span>
                          </div>
                          <div className={`completeness-item ${data?.BusinessHours?.length > 0 ? 'complete' : 'incomplete'}`}>
                            <i className={`fas ${data?.BusinessHours?.length > 0 ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                            <span>Business Hours</span>
                          </div>
                          <div className={`completeness-item ${data?.StripeStatus?.connected || data?.StripeAccountId ? 'complete' : 'incomplete'}`}>
                            <i className={`fas ${data?.StripeStatus?.connected || data?.StripeAccountId ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                            <span>Stripe Connected</span>
                          </div>
                          <div className={`completeness-item ${Array.isArray(data?.Categories) && data.Categories.length > 0 ? 'complete' : 'incomplete'}`}>
                            <i className={`fas ${Array.isArray(data?.Categories) && data.Categories.length > 0 ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                            <span>Categories</span>
                          </div>
                        </div>
                      </div>

                      {/* Admin Notes */}
                      <div className="review-section">
                        <h3><i className="fas fa-sticky-note"></i> Admin Notes (Optional)</h3>
                        <textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Add any internal notes about this vendor..."
                          rows={3}
                        />
                      </div>

                      {/* Rejection Reason */}
                      {(selectedProfile.ProfileStatus === 'pending_review' || selectedProfile.ProfileStatus === 'Pending') && (
                        <div className="review-section rejection-section">
                          <h3><i className="fas fa-exclamation-triangle"></i> Rejection Reason (Required for rejection)</h3>
                          <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="If rejecting, explain why so the vendor can address the issues..."
                            rows={3}
                          />
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="action-buttons-section">
                        {(selectedProfile.ProfileStatus === 'pending_review' || selectedProfile.ProfileStatus === 'Pending') ? (
                          <>
                            <button 
                              className="btn-danger btn-large"
                              onClick={() => handleReject(selectedProfile.VendorProfileID)}
                              disabled={actionLoading}
                            >
                              {actionLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-times"></i>}
                              Reject Application
                            </button>
                            <button 
                              className="btn-success btn-large"
                              onClick={() => handleApprove(selectedProfile.VendorProfileID)}
                              disabled={actionLoading}
                            >
                              {actionLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
                              Approve & Make Visible
                            </button>
                          </>
                        ) : (selectedProfile.ProfileStatus === 'approved' || selectedProfile.ProfileStatus === 'Approved') ? (
                          <div className="approved-actions">
                            <div className="visibility-control">
                              <h4><i className="fas fa-eye"></i> Visibility Control</h4>
                              <p>Control whether this vendor appears on the main page.</p>
                              <div className="visibility-buttons">
                                <button 
                                  className={(fullProfileData?.IsVisible ?? selectedProfile.IsVisible) ? 'btn-warning btn-large' : 'btn-success btn-large'}
                                  onClick={() => handleToggleVisibility(selectedProfile.VendorProfileID, fullProfileData?.IsVisible ?? selectedProfile.IsVisible)}
                                  disabled={actionLoading}
                                >
                                  {actionLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className={`fas ${(fullProfileData?.IsVisible ?? selectedProfile.IsVisible) ? 'fa-eye-slash' : 'fa-eye'}`}></i>}
                                  {(fullProfileData?.IsVisible ?? selectedProfile.IsVisible) ? ' Hide from Platform' : ' Show on Platform'}
                                </button>
                                <button 
                                  className="btn-danger btn-large"
                                  onClick={() => handleSuspend(selectedProfile.VendorProfileID)}
                                  disabled={actionLoading}
                                >
                                  {actionLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-ban"></i>}
                                  Suspend Vendor
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="already-reviewed">
                            <i className="fas fa-times-circle"></i>
                            <p>This vendor has been {selectedProfile.ProfileStatus === 'Rejected' || selectedProfile.ProfileStatus === 'rejected' ? 'rejected' : 'suspended'}</p>
                            <button 
                              className="btn-success btn-large"
                              onClick={() => handleApprove(selectedProfile.VendorProfileID)}
                              disabled={actionLoading}
                              style={{ marginTop: '1rem' }}
                            >
                              {actionLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
                              Re-approve & Make Visible
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setSelectedProfile(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorApprovalsPanel;
