import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { apiGet } from '../utils/api';
import { PageLayout } from '../components/PageWrapper';
import Header from '../components/Header';
import Footer from '../components/Footer';
import VendorCard from '../components/VendorCard';
import ProfileModal from '../components/ProfileModal';
import { showBanner, formatMonthYear } from '../utils/helpers';
import './HostProfilePage.css';

// Airbnb-style profile info item component
const ProfileInfoItem = ({ icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="profile-info-item">
      <i className={`fas fa-${icon}`}></i>
      <div className="profile-info-content">
        <span className="profile-info-label">{label}</span>
        <span className="profile-info-value">{value}</span>
      </div>
    </div>
  );
};

// Interest tag component
const InterestTag = ({ interest, category }) => (
  <span className="interest-tag" data-category={category}>
    {interest}
  </span>
);

function HostProfilePage() {
  const { hostId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [host, setHost] = useState(null);
  const [enhancedProfile, setEnhancedProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [isUserProfile, setIsUserProfile] = useState(false);
  const [showAllAbout, setShowAllAbout] = useState(false);
  const reviewsPerPage = 5;

  // Load host profile data - fetches USER data, not vendor data
  const loadHostProfile = useCallback(async () => {
    try {
      setLoading(true);
      
      // First try to load user profile directly
      const profileResp = await fetch(`${API_BASE_URL}/users/${hostId}/profile`);
      
      if (profileResp.ok) {
        // User profile found - show client/user info
        const profileData = await profileResp.json();
        const userProfile = profileData.profile;
        
        // Try to get user profile data from UserProfiles table
        let enhancedData = null;
        try {
          const userProfileResp = await fetch(`${API_BASE_URL}/users/${hostId}/user-profile`);
          if (userProfileResp.ok) {
            const userProfileJson = await userProfileResp.json();
            enhancedData = {
              ...userProfileJson.profile,
              Interests: userProfileJson.interests || [],
              MemberSince: userProfileJson.user?.JoinYear
            };
          }
        } catch (e) {
          console.warn('User profile not available:', e.message);
        }
        
        // Load reviews given by this user
        const reviewsResp = await fetch(`${API_BASE_URL}/users/${hostId}/reviews`);
        const reviewsData = reviewsResp.ok ? await reviewsResp.json() : [];
        
        // Load bookings to get associated vendors (for clients)
        const bookingsResp = await fetch(`${API_BASE_URL}/users/${hostId}/bookings/all`);
        const bookingsData = bookingsResp.ok ? await bookingsResp.json() : [];
        
        // Check if user has a vendor profile to get response metrics
        let vendorResponseRating = null;
        let vendorResponseTime = null;
        let vendorListings = [];
        let vendorReviews = [];
        
        if (userProfile?.VendorProfileID) {
          // User is a vendor - fetch their vendor data for response metrics
          try {
            const vendorResp = await fetch(`${API_BASE_URL}/vendors/${userProfile.VendorProfileID}`);
            if (vendorResp.ok) {
              const vendorData = await vendorResp.json();
              const vp = vendorData.data?.profile;
              vendorResponseRating = vp?.ResponseRating;
              vendorResponseTime = vp?.ResponseTime;
              vendorReviews = vendorData.data?.reviews || [];
              
              // Add their vendor as a listing
              vendorListings.push({
                id: userProfile.VendorProfileID,
                businessName: vp?.BusinessName,
                featuredImage: vendorData.data?.images?.[0]?.ImageURL || vp?.LogoURL,
                city: vp?.City,
                state: vp?.State,
                category: vendorData.data?.categories?.[0]?.Category,
                rating: vp?.AverageRating || 5.0,
                reviewCount: vp?.ReviewCount || 0
              });
            }
          } catch (vendorErr) {
            console.warn('Could not fetch vendor data:', vendorErr.message);
          }
        }
        
        // Extract unique vendors from bookings (for clients who booked vendors)
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
              rating: 5.0,
              reviewCount: 0
            });
          }
        });
        
        // Combine vendor listings with booked vendors
        const allListings = [...vendorListings, ...Array.from(vendorMap.values())];
        
        // Use vendor reviews if user is a vendor, otherwise use reviews they gave
        const displayReviews = vendorReviews.length > 0 ? vendorReviews : (Array.isArray(reviewsData) ? reviewsData : []);
        
        const hostInfo = {
          id: hostId,
          name: userProfile?.Name || userProfile?.DisplayName || 'User',
          profileImage: userProfile?.ProfileImageURL || userProfile?.Avatar,
          bio: userProfile?.Bio || '',
          memberSince: userProfile?.CreatedAt || userProfile?.JoinDate,
          responseRating: vendorResponseRating || null,
          responseTime: vendorResponseTime || null,
          reviewCount: displayReviews.length,
          isVerified: userProfile?.IsVerified || false,
          isEmailConfirmed: userProfile?.IsEmailConfirmed || userProfile?.EmailVerified || false,
          isPhoneConfirmed: userProfile?.IsPhoneConfirmed || !!userProfile?.Phone,
          isSuperhost: false,
          isVendor: !!userProfile?.VendorProfileID
        };
        
        setHost(hostInfo);
        setEnhancedProfile(enhancedData);
        setReviews(displayReviews);
        setListings(allListings);
        setIsUserProfile(true);
        
        document.title = `${hostInfo.name} - Profile | Planbeau`;
      } else {
        // Fallback: Try loading as vendor profile (for backwards compatibility)
        const response = await fetch(`${API_BASE_URL}/vendors/${hostId}`);
        if (!response.ok) {
          throw new Error('Failed to load profile');
        }

        const data = await response.json();
        const vendorData = data.data;
        
        // Extract host info from vendor profile
        const hostInfo = {
          id: hostId,
          name: vendorData.profile?.HostName || vendorData.profile?.ContactName || vendorData.profile?.BusinessName?.split(' ')[0] || 'Host',
          profileImage: vendorData.profile?.HostProfileImage || vendorData.profile?.LogoURL || vendorData.profile?.FeaturedImageURL,
          bio: vendorData.profile?.HostBio || vendorData.profile?.BusinessDescription || '',
          memberSince: vendorData.profile?.HostMemberSince || vendorData.profile?.CreatedAt || vendorData.profile?.JoinDate,
          responseRating: vendorData.profile?.ResponseRating || null,
          responseTime: vendorData.profile?.ResponseTime || null,
          reviewCount: vendorData.reviews?.length || 0,
          isVerified: vendorData.profile?.IsVerified || false,
          isEmailConfirmed: true,
          isPhoneConfirmed: vendorData.profile?.Phone ? true : false,
          isSuperhost: vendorData.profile?.IsSuperhost || false
        };
        
        setHost(hostInfo);
        setReviews(vendorData.reviews || []);
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
        setIsUserProfile(false);

        document.title = `${hostInfo.name} - Host Profile | Planbeau`;
      }
    } catch (error) {
      console.error('Error loading host profile:', error);
      showBanner('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  }, [hostId]);

  useEffect(() => {
    loadHostProfile();
  }, [loadHostProfile]);

  const formatDate = formatMonthYear;

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
            navigate('/dashboard');
          } else {
            setProfileModalOpen(true);
          }
        }}
      />
      <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
      
      <div className="host-profile-page">
        <div className="host-profile-container">
          {/* Airbnb-style Two Column Layout */}
          <div className="profile-layout">
            {/* Left Column - Profile Card */}
            <div className="profile-left-column">
              <div className="profile-card">
                <div className="profile-card-header">
                  <div className="profile-avatar-large">
                    <img 
                      src={host.profileImage || 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png'}
                      alt={host.name}
                      onError={(e) => { e.target.src = 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png'; }}
                    />
                    {host.isSuperhost && (
                      <div className="superhost-badge-large">
                        <i className="fas fa-award"></i>
                      </div>
                    )}
                  </div>
                  <h1 className="profile-name">{host.name}</h1>
                  {enhancedProfile?.BiographyTitle && (
                    <p className="profile-title">{enhancedProfile.BiographyTitle}</p>
                  )}
                </div>
                
                <div className="profile-card-stats">
                  <div className="profile-stat-item">
                    <span className="stat-number">{host.reviewCount || 0}</span>
                    <span className="stat-label">Reviews</span>
                  </div>
                  <div className="profile-stat-divider"></div>
                  <div className="profile-stat-item">
                    <span className="stat-number">{host.responseRating || '5.0'}</span>
                    <span className="stat-label">Rating</span>
                  </div>
                  <div className="profile-stat-divider"></div>
                  <div className="profile-stat-item">
                    <span className="stat-number">{enhancedProfile?.MemberSince || new Date(host.memberSince).getFullYear()}</span>
                    <span className="stat-label">Member since</span>
                  </div>
                </div>

                {/* Verifications */}
                <div className="profile-verifications">
                  <h3><i className="fas fa-shield-alt"></i> {host.name}'s confirmed information</h3>
                  <ul className="verification-list">
                    {host.isEmailConfirmed && (
                      <li><i className="fas fa-check"></i> Email address</li>
                    )}
                    {host.isPhoneConfirmed && (
                      <li><i className="fas fa-check"></i> Phone number</li>
                    )}
                    {host.isVerified && (
                      <li><i className="fas fa-check"></i> Identity</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Right Column - About & Details */}
            <div className="profile-right-column">
              {/* About Section */}
              <div className="profile-about-section">
                <h2>About {host.name}</h2>
                
                {/* Quick Info Grid - Airbnb style */}
                <div className="profile-quick-info">
                  <ProfileInfoItem 
                    icon="briefcase" 
                    label="My work" 
                    value={enhancedProfile?.Work} 
                  />
                  <ProfileInfoItem 
                    icon="map-marker-alt" 
                    label="Lives in" 
                    value={enhancedProfile?.City && enhancedProfile?.Country 
                      ? `${enhancedProfile.City}, ${enhancedProfile.Country}` 
                      : enhancedProfile?.City || enhancedProfile?.Country} 
                  />
                  <ProfileInfoItem 
                    icon="globe" 
                    label="Speaks" 
                    value={enhancedProfile?.Languages} 
                  />
                  <ProfileInfoItem 
                    icon="graduation-cap" 
                    label="Where I went to school" 
                    value={enhancedProfile?.School} 
                  />
                  <ProfileInfoItem 
                    icon="birthday-cake" 
                    label="Born in the" 
                    value={enhancedProfile?.DecadeBorn} 
                  />
                  <ProfileInfoItem 
                    icon="heart" 
                    label="Obsessed with" 
                    value={enhancedProfile?.ObsessedWith} 
                  />
                  <ProfileInfoItem 
                    icon="paw" 
                    label="Pets" 
                    value={enhancedProfile?.Pets} 
                  />
                  <ProfileInfoItem 
                    icon="clock" 
                    label="I spend too much time" 
                    value={enhancedProfile?.SpendTimeDoing} 
                  />
                  <ProfileInfoItem 
                    icon="lightbulb" 
                    label="Fun fact" 
                    value={enhancedProfile?.FunFact} 
                  />
                  <ProfileInfoItem 
                    icon="magic" 
                    label="My most useless skill" 
                    value={enhancedProfile?.UselessSkill} 
                  />
                </div>

                {/* Bio */}
                {(host.bio || enhancedProfile?.Bio) && (
                  <div className="profile-bio">
                    <p className={!showAllAbout && (host.bio || enhancedProfile?.Bio || '').length > 300 ? 'truncated' : ''}>
                      {host.bio || enhancedProfile?.Bio || `Welcome! I'm ${host.name}, and I'm passionate about helping create memorable events.`}
                    </p>
                    {(host.bio || enhancedProfile?.Bio || '').length > 300 && (
                      <button className="show-more-btn" onClick={() => setShowAllAbout(!showAllAbout)}>
                        {showAllAbout ? 'Show less' : 'Show more'} <i className={`fas fa-chevron-${showAllAbout ? 'up' : 'down'}`}></i>
                      </button>
                    )}
                  </div>
                )}

                {/* Favorite Quote */}
                {enhancedProfile?.FavoriteQuote && (
                  <blockquote className="profile-quote">
                    <i className="fas fa-quote-left"></i>
                    {enhancedProfile.FavoriteQuote}
                  </blockquote>
                )}

                {/* Interests */}
                {enhancedProfile?.Interests && enhancedProfile.Interests.length > 0 && (
                  <div className="profile-interests">
                    <h3>What {host.name} is into</h3>
                    <div className="interests-grid">
                      {enhancedProfile.Interests.map((interest, idx) => (
                        <InterestTag 
                          key={idx} 
                          interest={interest.Interest || interest} 
                          category={interest.Category} 
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Listings Section */}
              <div className="host-listings-section">
                <h2>{isUserProfile ? 'Vendors worked with' : `${host.name}'s ${listings.length} listing${listings.length !== 1 ? 's' : ''}`}</h2>
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
        </div>
      </div>
      
      <Footer />
    </PageLayout>
  );
}

export default HostProfilePage;
