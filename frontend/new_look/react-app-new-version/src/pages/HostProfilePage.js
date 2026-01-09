import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { PageLayout } from '../components/PageWrapper';
import Header from '../components/Header';
import Footer from '../components/Footer';
import VendorCard from '../components/VendorCard';
import ProfileModal from '../components/ProfileModal';
import DashboardModal from '../components/DashboardModal';
import { showBanner } from '../utils/helpers';
import './HostProfilePage.css';

function HostProfilePage() {
  const { hostId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [host, setHost] = useState(null);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [dashboardModalOpen, setDashboardModalOpen] = useState(false);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const reviewsPerPage = 5;

  // Load host profile data
  const loadHostProfile = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load vendor profile to get host info
      const response = await fetch(`${API_BASE_URL}/vendors/${hostId}`);
      if (!response.ok) {
        throw new Error('Failed to load host profile');
      }

      const data = await response.json();
      const vendorData = data.data;
      
      // Extract host info from vendor profile
      const hostInfo = {
        id: hostId,
        name: vendorData.profile?.HostName || vendorData.profile?.ContactName || vendorData.profile?.BusinessName?.split(' ')[0] || 'Host',
        profileImage: vendorData.profile?.HostProfileImage || vendorData.profile?.LogoURL || vendorData.profile?.FeaturedImageURL,
        bio: vendorData.profile?.HostBio || vendorData.profile?.BusinessDescription || '',
        memberSince: vendorData.profile?.CreatedAt || vendorData.profile?.JoinDate,
        responseRating: vendorData.profile?.ResponseRating || 'Excellent',
        responseTime: vendorData.profile?.ResponseTime || 'A few hours',
        reviewCount: vendorData.reviews?.length || 0,
        isVerified: vendorData.profile?.IsVerified || false,
        isEmailConfirmed: true,
        isPhoneConfirmed: vendorData.profile?.Phone ? true : false,
        isSuperhost: vendorData.profile?.IsSuperhost || false
      };
      
      setHost(hostInfo);
      setReviews(vendorData.reviews || []);
      
      // Load all listings by this host (vendor's other listings)
      // For now, we'll show the current vendor as the only listing
      // In a real implementation, you'd fetch all vendors owned by this user
      setListings([{
        id: hostId,
        businessName: vendorData.profile?.BusinessName,
        featuredImage: vendorData.images?.[0]?.url || vendorData.images?.[0]?.URL || vendorData.profile?.FeaturedImageURL,
        city: vendorData.profile?.City,
        state: vendorData.profile?.State,
        rating: 5.0,
        reviewCount: vendorData.reviews?.length || 0,
        category: vendorData.profile?.PrimaryCategory || vendorData.profile?.CategoryName
      }]);

      document.title = `${hostInfo.name} - Host Profile | PlanBeau`;
    } catch (error) {
      console.error('Error loading host profile:', error);
      showBanner('Failed to load host profile', 'error');
    } finally {
      setLoading(false);
    }
  }, [hostId]);

  useEffect(() => {
    loadHostProfile();
  }, [loadHostProfile]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Pagination for reviews
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const paginatedReviews = reviews.slice(
    (currentReviewPage - 1) * reviewsPerPage,
    currentReviewPage * reviewsPerPage
  );

  if (loading) {
    return (
      <>
        <Header onSearch={() => {}} onProfileClick={() => setProfileModalOpen(true)} />
        <div className="host-profile-page">
          <div className="host-profile-container">
            <div className="host-profile-loading">
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

  if (!host) {
    return (
      <>
        <Header onSearch={() => {}} onProfileClick={() => setProfileModalOpen(true)} />
        <div className="host-profile-page">
          <div className="host-profile-container">
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <h2>Host not found</h2>
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
    <PageLayout variant="fullWidth" pageClassName="host-profile-page-layout">
      <Header 
        onSearch={() => {}} 
        onProfileClick={() => {
          if (currentUser) {
            setDashboardModalOpen(true);
          } else {
            setProfileModalOpen(true);
          }
        }}
      />
      <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
      <DashboardModal isOpen={dashboardModalOpen} onClose={() => setDashboardModalOpen(false)} />
      
      <div className="host-profile-page">
        <div className="host-profile-container">
          {/* Host Header */}
          <div className="host-header">
            <div className="host-avatar-section">
              <div className="host-avatar">
                <img 
                  src={host.profileImage || 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png'}
                  alt={host.name}
                  onError={(e) => { e.target.src = 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png'; }}
                />
                {host.isSuperhost && (
                  <div className="superhost-badge">
                    <i className="fas fa-award"></i>
                  </div>
                )}
              </div>
            </div>
            
            <div className="host-info-section">
              <div className="host-name-row">
                <h1>{host.name}</h1>
                {host.isSuperhost && (
                  <span className="superhost-tag">
                    <i className="fas fa-award"></i> Superhost
                  </span>
                )}
              </div>
              
              <button className="share-btn">
                <i className="fas fa-share-alt"></i> Share
              </button>
            </div>
          </div>

          {/* About Section */}
          <div className="host-about-section">
            <h2>About</h2>
            <p className="host-bio">
              {host.bio || `Welcome! I'm ${host.name}, and I'm passionate about helping create memorable events. Feel free to reach out with any questions about my listings.`}
            </p>
            
            {/* Host Stats */}
            <div className="host-stats">
              <div className="host-stat">
                <i className="fas fa-calendar-alt"></i>
                <span>Member since: {formatDate(host.memberSince)}</span>
              </div>
              <div className="host-stat">
                <i className="fas fa-star"></i>
                <span>Response rating: {host.responseRating}</span>
              </div>
              <div className="host-stat">
                <i className="fas fa-clock"></i>
                <span>Response speed: {host.responseTime}</span>
              </div>
              <div className="host-stat">
                <i className="fas fa-comment"></i>
                <span>Reviews: {host.reviewCount}</span>
              </div>
            </div>

            {/* Verification Badges */}
            <div className="host-verifications">
              {host.isEmailConfirmed && (
                <div className="verification-badge">
                  <i className="fas fa-check-circle"></i> Email confirmed
                </div>
              )}
              {host.isPhoneConfirmed && (
                <div className="verification-badge">
                  <i className="fas fa-check-circle"></i> Phone confirmed
                </div>
              )}
              {host.isVerified && (
                <div className="verification-badge">
                  <i className="fas fa-check-circle"></i> Identity verified
                </div>
              )}
            </div>
          </div>

          {/* Listings Section */}
          <div className="host-listings-section">
            <h2>{host.name}'s {listings.length} listing{listings.length !== 1 ? 's' : ''}</h2>
            <div className="host-listings-grid">
              {listings.map((listing) => (
                <div 
                  key={listing.id} 
                  className="host-listing-card"
                  onClick={() => navigate(`/vendor/${listing.id}`)}
                >
                  <div className="listing-image">
                    <img 
                      src={listing.featuredImage || 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png'}
                      alt={listing.businessName}
                      onError={(e) => { e.target.src = 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png'; }}
                    />
                  </div>
                  <div className="listing-info">
                    <h3>{listing.businessName}</h3>
                    <p className="listing-location">{listing.city}, {listing.state}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="host-reviews-section">
            <h2>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</h2>
            
            {paginatedReviews.length > 0 ? (
              <div className="host-reviews-list">
                {paginatedReviews.map((review, index) => (
                  <div key={index} className="host-review-item">
                    <div className="review-header">
                      <div className="reviewer-avatar">
                        <img 
                          src={review.ReviewerImage || 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png'}
                          alt={review.ReviewerName || 'Reviewer'}
                          onError={(e) => { e.target.src = 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png'; }}
                        />
                      </div>
                      <div className="reviewer-info">
                        <div className="reviewer-name">{review.ReviewerName || 'Anonymous'}</div>
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
                            {review.CreatedAt ? new Date(review.CreatedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}
                          </span>
                          {review.VendorName && (
                            <span className="review-listing">• {review.VendorName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="review-content">{review.Comment || review.ReviewText || 'Great experience!'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-reviews">No reviews yet.</p>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="reviews-pagination">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    className={`pagination-btn ${currentReviewPage === i + 1 ? 'active' : ''}`}
                    onClick={() => setCurrentReviewPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
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
                    className="pagination-btn pagination-next"
                    onClick={() => setCurrentReviewPage(prev => prev + 1)}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Report Link */}
          <div className="host-report-section">
            <button className="report-link">
              <i className="fas fa-flag"></i> Report user
            </button>
          </div>
        </div>
      </div>
      
      <Footer />
    </PageLayout>
  );
}

export default HostProfilePage;
