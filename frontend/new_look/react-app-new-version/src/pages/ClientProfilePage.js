import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { apiGet } from '../utils/api';
import { PageLayout } from '../components/PageWrapper';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProfileModal from '../components/ProfileModal';
import { showBanner, formatMonthYear } from '../utils/helpers';
import './ClientProfilePage.css';

function ClientProfilePage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [client, setClient] = useState(null);
  const [associatedVendors, setAssociatedVendors] = useState([]);
  const [reviewsGiven, setReviewsGiven] = useState([]);
  const [reviewsReceived, setReviewsReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('given'); // 'given' or 'received'
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const reviewsPerPage = 5;

  // Check if viewing own profile
  const isOwnProfile = currentUser?.id === parseInt(clientId);

  // Load client profile data
  const loadClientProfile = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load user profile
      const profileResp = await fetch(`${API_BASE_URL}/users/${clientId}/profile`);
      if (!profileResp.ok) {
        throw new Error('Failed to load client profile');
      }
      const profileData = await profileResp.json();
      
      // Load reviews given by this user
      const reviewsResp = await fetch(`${API_BASE_URL}/users/${clientId}/reviews`);
      const reviewsData = reviewsResp.ok ? await reviewsResp.json() : [];
      
      // Load bookings to get associated vendors
      const bookingsResp = await fetch(`${API_BASE_URL}/users/${clientId}/bookings/all`);
      const bookingsData = bookingsResp.ok ? await bookingsResp.json() : [];
      
      // Extract unique vendors from bookings
      const vendorMap = new Map();
      (Array.isArray(bookingsData) ? bookingsData : []).forEach(booking => {
        if (booking.VendorProfileID && !vendorMap.has(booking.VendorProfileID)) {
          vendorMap.set(booking.VendorProfileID, {
            id: booking.VendorProfileID,
            businessName: booking.VendorBusinessName || booking.BusinessName,
            featuredImage: booking.VendorImage || booking.FeaturedImageURL,
            city: booking.VendorCity || booking.City,
            state: booking.VendorState || booking.State,
            category: booking.VendorCategory || booking.CategoryName,
            bookingCount: 1
          });
        } else if (booking.VendorProfileID) {
          const existing = vendorMap.get(booking.VendorProfileID);
          existing.bookingCount++;
        }
      });
      
      const clientInfo = {
        id: clientId,
        name: profileData.profile?.Name || profileData.profile?.DisplayName || 'Client',
        email: profileData.profile?.Email,
        profileImage: profileData.profile?.ProfileImageURL || profileData.profile?.Avatar,
        bio: profileData.profile?.Bio || '',
        memberSince: profileData.profile?.CreatedAt || profileData.profile?.JoinDate,
        province: profileData.profile?.Province || profileData.profile?.State,
        city: profileData.profile?.City,
        phone: profileData.profile?.Phone,
        isEmailConfirmed: profileData.profile?.IsEmailConfirmed || profileData.profile?.EmailVerified,
        isPhoneConfirmed: profileData.profile?.IsPhoneConfirmed || !!profileData.profile?.Phone,
        reviewCount: Array.isArray(reviewsData) ? reviewsData.length : 0
      };
      
      setClient(clientInfo);
      setReviewsGiven(Array.isArray(reviewsData) ? reviewsData : []);
      setAssociatedVendors(Array.from(vendorMap.values()));
      
      // TODO: Load reviews received from vendors (if applicable)
      // For now, this would require a separate endpoint
      setReviewsReceived([]);

      document.title = `${clientInfo.name} - Client Profile | Planbeau`;
    } catch (error) {
      console.error('Error loading client profile:', error);
      showBanner('Failed to load client profile', 'error');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadClientProfile();
  }, [loadClientProfile]);

  const formatDate = formatMonthYear;

  // Get current reviews based on active tab
  const currentReviews = activeTab === 'given' ? reviewsGiven : reviewsReceived;
  const totalPages = Math.ceil(currentReviews.length / reviewsPerPage);
  const paginatedReviews = currentReviews.slice(
    (currentReviewPage - 1) * reviewsPerPage,
    currentReviewPage * reviewsPerPage
  );

  // Reset page when tab changes
  useEffect(() => {
    setCurrentReviewPage(1);
  }, [activeTab]);

  if (loading) {
    return (
      <>
        <Header onSearch={() => {}} onProfileClick={() => setProfileModalOpen(true)} />
        <div className="client-profile-page">
          <div className="client-profile-container">
            <div className="client-profile-loading">
              <div className="skeleton" style={{ width: '120px', height: '120px', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
              <div className="skeleton" style={{ width: '200px', height: '28px', margin: '0 auto 0.5rem' }}></div>
              <div className="skeleton" style={{ width: '150px', height: '20px', margin: '0 auto' }}></div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!client) {
    return (
      <>
        <Header onSearch={() => {}} onProfileClick={() => setProfileModalOpen(true)} />
        <div className="client-profile-page">
          <div className="client-profile-container">
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <h2>Client not found</h2>
              <button className="btn btn-primary" onClick={() => navigate('/')}>
                Back to Home
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <PageLayout variant="fullWidth" pageClassName="client-profile-page-layout">
      <Header 
        onSearch={() => {}} 
        onProfileClick={() => {
          if (currentUser) {
            navigate('/dashboard');
          } else {
            setProfileModalOpen(true);
          }
        }}
      />
      <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
      
      <div className="client-profile-page">
        <div className="client-profile-container">
          {/* Client Header */}
          <div className="client-header">
            <div className="client-avatar-section">
              <div className="client-avatar">
                {client.profileImage ? (
                  <img 
                    src={client.profileImage}
                    alt={client.name}
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                <div className="client-avatar-initials" style={{ display: client.profileImage ? 'none' : 'flex' }}>
                  {client.name?.charAt(0)?.toUpperCase() || 'C'}
                </div>
              </div>
            </div>
            
            <div className="client-info-section">
              <div className="client-name-row">
                <h1>{client.name}</h1>
              </div>
              
              <div className="client-actions">
                {isOwnProfile && (
                  <button className="edit-profile-btn" onClick={() => navigate('/dashboard?section=settings')}>
                    <i className="fas fa-edit"></i> Edit Profile
                  </button>
                )}
                <button className="share-btn">
                  <i className="fas fa-share-alt"></i> Share
                </button>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="client-about-section">
            <h2>About</h2>
            <p className="client-bio">
              {client.bio || `Welcome! I'm ${client.name}, and I love discovering amazing event vendors on Planbeau.`}
            </p>
            
            {/* Client Stats */}
            <div className="client-stats">
              <div className="client-stat">
                <i className="fas fa-calendar-alt"></i>
                <span>Member since: {formatDate(client.memberSince)}</span>
              </div>
              {client.city && client.province && (
                <div className="client-stat">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{client.city}, {client.province}</span>
                </div>
              )}
              <div className="client-stat">
                <i className="fas fa-star"></i>
                <span>Reviews given: {reviewsGiven.length}</span>
              </div>
              <div className="client-stat">
                <i className="fas fa-store"></i>
                <span>Vendors worked with: {associatedVendors.length}</span>
              </div>
            </div>

            {/* Verification Badges */}
            <div className="client-verifications">
              {client.isEmailConfirmed && (
                <div className="verification-badge">
                  <i className="fas fa-check-circle"></i> Email confirmed
                </div>
              )}
              {client.isPhoneConfirmed && (
                <div className="verification-badge">
                  <i className="fas fa-check-circle"></i> Phone confirmed
                </div>
              )}
            </div>
          </div>

          {/* Associated Vendors Section */}
          {associatedVendors.length > 0 && (
            <div className="client-vendors-section">
              <h2>Vendors I've worked with</h2>
              <div className="client-vendors-grid">
                {associatedVendors.map((vendor) => (
                  <div 
                    key={vendor.id} 
                    className="client-vendor-card"
                    onClick={() => navigate(`/vendor/${vendor.id}`)}
                  >
                    <div className="vendor-image">
                      <img 
                        src={vendor.featuredImage || 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png'}
                        alt={vendor.businessName}
                        onError={(e) => { e.target.src = 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png'; }}
                      />
                    </div>
                    <div className="vendor-info">
                      <h3>{vendor.businessName}</h3>
                      <p className="vendor-location">{vendor.city}, {vendor.state}</p>
                      {vendor.category && <span className="vendor-category">{vendor.category}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Section */}
          <div className="client-reviews-section">
            <div className="reviews-header">
              <h2>Reviews</h2>
              <div className="reviews-tabs">
                <button 
                  className={`review-tab ${activeTab === 'given' ? 'active' : ''}`}
                  onClick={() => setActiveTab('given')}
                >
                  Given ({reviewsGiven.length})
                </button>
                <button 
                  className={`review-tab ${activeTab === 'received' ? 'active' : ''}`}
                  onClick={() => setActiveTab('received')}
                >
                  Received ({reviewsReceived.length})
                </button>
              </div>
            </div>
            
            {paginatedReviews.length > 0 ? (
              <div className="client-reviews-list">
                {paginatedReviews.map((review, index) => (
                  <div key={index} className="client-review-item">
                    <div className="review-header">
                      <div className="reviewer-avatar">
                        {activeTab === 'given' ? (
                          <img 
                            src={review.VendorImage || 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png'}
                            alt={review.VendorName || 'Vendor'}
                            onError={(e) => { e.target.src = 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png'; }}
                          />
                        ) : (
                          <img 
                            src={review.ReviewerImage || 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png'}
                            alt={review.ReviewerName || 'Reviewer'}
                            onError={(e) => { e.target.src = 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png'; }}
                          />
                        )}
                      </div>
                      <div className="reviewer-info">
                        <div className="reviewer-name">
                          {activeTab === 'given' 
                            ? (review.VendorName || review.BusinessName || 'Vendor')
                            : (review.ReviewerName || 'Anonymous')
                          }
                        </div>
                        <div className="review-meta">
                          <span className="review-rating">
                            {[...Array(5)].map((_, i) => (
                              <i 
                                key={i} 
                                className={`fas fa-star ${i < (review.Rating || 5) ? 'filled' : ''}`}
                              ></i>
                            ))}
                          </span>
                          <span className="review-date">
                            {review.CreatedAt ? new Date(review.CreatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {review.Title && <h4 className="review-title">{review.Title}</h4>}
                    <p className="review-content">{review.Comment || review.ReviewText || 'Great experience!'}</p>
                    {activeTab === 'given' && review.VendorName && (
                      <button 
                        className="view-vendor-btn"
                        onClick={(e) => { e.stopPropagation(); navigate(`/vendor/${review.VendorProfileID}`); }}
                      >
                        View {review.VendorName} →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-reviews">
                {activeTab === 'given' 
                  ? "No reviews given yet. Book a vendor and share your experience!"
                  : "No reviews received yet."
                }
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="reviews-pagination">
                {currentReviewPage > 1 && (
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentReviewPage(prev => prev - 1)}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                )}
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={i}
                      className={`pagination-btn ${currentReviewPage === pageNum ? 'active' : ''}`}
                      onClick={() => setCurrentReviewPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && currentReviewPage < totalPages - 2 && (
                  <>
                    <span className="pagination-ellipsis">...</span>
                    <button
                      className="pagination-btn"
                      onClick={() => setCurrentReviewPage(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                {currentReviewPage < totalPages && (
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentReviewPage(prev => prev + 1)}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Report Link */}
          {!isOwnProfile && (
            <div className="client-report-section">
              <button className="report-link">
                <i className="fas fa-flag"></i> Report user
              </button>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </PageLayout>
  );
}

export default ClientProfilePage;
