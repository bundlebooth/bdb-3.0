import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { PageLayout } from '../components/PageWrapper';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProfileModal from '../components/ProfileModal';
import { showBanner } from '../utils/helpers';
import './HostProfilePage.css';

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
  const [showShareMenu, setShowShareMenu] = useState(false);
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
        
        // Only show vendor listings the user OWNS (not booked vendors)
        const allListings = [...vendorListings];
        
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

  // Calculate years hosting
  const getYearsHosting = () => {
    if (!host.memberSince) return null;
    const date = new Date(host.memberSince);
    if (isNaN(date.getTime())) return null;
    const years = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24 * 365));
    return years > 0 ? years : null;
  };

  const yearsHosting = getYearsHosting();

  // Get average rating
  const getAverageRating = () => {
    if (reviews.length === 0) return null;
    const sum = reviews.reduce((acc, r) => acc + (r.Rating || 5), 0);
    return (sum / reviews.length).toFixed(1);
  };

  const avgRating = getAverageRating();

  // Format member since date
  const formatMemberSince = () => {
    if (!host.memberSince) return null;
    const date = new Date(host.memberSince);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Get first name
  const firstName = host.name?.split(' ')[0] || 'User';

  // Check if there are any "about" details to show
  const hasAboutDetails = enhancedProfile && (
    enhancedProfile.Work || enhancedProfile.BiographyTitle || enhancedProfile.Pets ||
    enhancedProfile.School || enhancedProfile.SpendTimeDoing || enhancedProfile.Languages ||
    enhancedProfile.DecadeBorn || enhancedProfile.ObsessedWith || enhancedProfile.FunFact ||
    enhancedProfile.UselessSkill
  );

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
          
          {/* Hero Section - Airbnb Style */}
          <div className="host-hero-section">
            
            {/* Left - Profile Card - Airbnb Style */}
            <div className="host-profile-card">
              <div className="host-card-left">
                <div className="host-card-avatar">
                  <img 
                    src={host.profileImage || 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png'}
                    alt={host.name}
                    onError={(e) => { e.target.src = 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png'; }}
                  />
                  {host.isVerified && (
                    <span className="host-verified-badge">
                      <i className="fas fa-shield-alt"></i>
                    </span>
                  )}
                </div>
                <h1 className="host-card-name">{host.name}</h1>
                {host.isSuperhost && (
                  <span className="host-superhost-badge">
                    <i className="fas fa-award"></i> Superhost
                  </span>
                )}
              </div>
              
              <div className="host-card-right">
                <div className="host-card-stat">
                  <span className="host-card-stat-value">{reviews.length}</span>
                  <span className="host-card-stat-label">Reviews</span>
                </div>
                <div className="host-card-stat-divider"></div>
                <div className="host-card-stat">
                  <span className="host-card-stat-value">{avgRating || '5.0'}<i className="fas fa-star"></i></span>
                  <span className="host-card-stat-label">Rating</span>
                </div>
                <div className="host-card-stat-divider"></div>
                <div className="host-card-stat">
                  <span className="host-card-stat-value">{yearsHosting || 1}</span>
                  <span className="host-card-stat-label">{yearsHosting === 1 ? 'Year hosting' : 'Years hosting'}</span>
                </div>
              </div>
            </div>

            {/* Right - About Section */}
            <div className="host-about-section">
              <h2 className="host-about-title">About {firstName}</h2>
              
              {/* Quick Info */}
              <div className="host-quick-info">
                {(enhancedProfile?.Work || enhancedProfile?.BiographyTitle) && (
                  <div className="host-quick-item">
                    <i className="fas fa-briefcase"></i>
                    <span>My work: {enhancedProfile?.Work || enhancedProfile?.BiographyTitle}</span>
                  </div>
                )}
                {enhancedProfile?.Languages && (
                  <div className="host-quick-item">
                    <i className="fas fa-globe"></i>
                    <span>Speaks {enhancedProfile.Languages}</span>
                  </div>
                )}
                {(enhancedProfile?.City || enhancedProfile?.Country) && (
                  <div className="host-quick-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>Lives in {[enhancedProfile?.City, enhancedProfile?.Country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {host.isVerified && (
                  <div className="host-quick-item verified">
                    <i className="fas fa-check-circle"></i>
                    <span>Identity verified</span>
                  </div>
                )}
              </div>
              
              {/* Bio */}
              {(host.bio || enhancedProfile?.Bio) && (
                <p className="host-bio">{host.bio || enhancedProfile?.Bio}</p>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="host-content">
            
            {/* More About Section */}
            {hasAboutDetails && (
              <section className="host-section">
                <h2 className="host-section-title">More about {firstName}</h2>
                <div className="host-more-grid">
                  {enhancedProfile?.Pets && (
                    <div className="host-more-card">
                      <i className="fas fa-paw"></i>
                      <div>
                        <span className="host-more-label">Pets</span>
                        <span className="host-more-value">{enhancedProfile.Pets}</span>
                      </div>
                    </div>
                  )}
                  {enhancedProfile?.School && (
                    <div className="host-more-card">
                      <i className="fas fa-graduation-cap"></i>
                      <div>
                        <span className="host-more-label">Where I went to school</span>
                        <span className="host-more-value">{enhancedProfile.School}</span>
                      </div>
                    </div>
                  )}
                  {enhancedProfile?.SpendTimeDoing && (
                    <div className="host-more-card">
                      <i className="fas fa-hourglass-half"></i>
                      <div>
                        <span className="host-more-label">I spend too much time</span>
                        <span className="host-more-value">{enhancedProfile.SpendTimeDoing}</span>
                      </div>
                    </div>
                  )}
                  {enhancedProfile?.DecadeBorn && (
                    <div className="host-more-card">
                      <i className="fas fa-birthday-cake"></i>
                      <div>
                        <span className="host-more-label">Born in the</span>
                        <span className="host-more-value">{enhancedProfile.DecadeBorn}</span>
                      </div>
                    </div>
                  )}
                  {enhancedProfile?.ObsessedWith && (
                    <div className="host-more-card">
                      <i className="fas fa-heart"></i>
                      <div>
                        <span className="host-more-label">Obsessed with</span>
                        <span className="host-more-value">{enhancedProfile.ObsessedWith}</span>
                      </div>
                    </div>
                  )}
                  {enhancedProfile?.FunFact && (
                    <div className="host-more-card">
                      <i className="fas fa-lightbulb"></i>
                      <div>
                        <span className="host-more-label">Fun fact</span>
                        <span className="host-more-value">{enhancedProfile.FunFact}</span>
                      </div>
                    </div>
                  )}
                  {enhancedProfile?.UselessSkill && (
                    <div className="host-more-card">
                      <i className="fas fa-magic"></i>
                      <div>
                        <span className="host-more-label">My most useless skill</span>
                        <span className="host-more-value">{enhancedProfile.UselessSkill}</span>
                      </div>
                    </div>
                  )}
                  {enhancedProfile?.FavoriteQuote && (
                    <div className="host-more-card quote-card">
                      <i className="fas fa-quote-left"></i>
                      <div>
                        <span className="host-more-label">Favorite quote</span>
                        <span className="host-more-value">"{enhancedProfile.FavoriteQuote}"</span>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Listings Section */}
            {listings.filter(l => l.businessName).length > 0 && (
              <section className="host-section">
                <h2 className="host-section-title">{firstName}'s listings</h2>
                <div className="host-listings-grid">
                  {listings.filter(l => l.businessName).map((listing) => (
                    <div key={listing.id} className="host-listing-card" onClick={() => navigate(`/vendor/${listing.id}`)}>
                      <div className="host-listing-image">
                        <img 
                          src={listing.featuredImage || 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png'} 
                          alt={listing.businessName} 
                          onError={(e) => { e.target.src = 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png'; }} 
                        />
                      </div>
                      <div className="host-listing-content">
                        <div className="host-listing-rating">
                          <i className="fas fa-star"></i>
                          <span>{listing.rating?.toFixed(1) || '5.0'}</span>
                          <span className="host-listing-reviews">({listing.reviewCount || 0})</span>
                        </div>
                        <h4>{listing.businessName}</h4>
                        <p>{listing.city}{listing.state ? `, ${listing.state}` : ''}</p>
                        {listing.category && <span className="host-listing-category">{listing.category}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

              {/* Interests Section */}
              {enhancedProfile?.Interests && enhancedProfile.Interests.length > 0 && (
                <section className="host-section">
                  <h2 className="host-section-title">Ask {firstName} about</h2>
                  <div className="host-interests">
                    {enhancedProfile.Interests.map((interest, i) => (
                      <span key={i} className="host-interest-tag">
                        {interest.Interest || interest}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Reviews Section */}
              <section className="host-section">
                <h2 className="host-section-title">
                  <i className="fas fa-star"></i> {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </h2>
                
                {paginatedReviews.length > 0 ? (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: '2rem 3rem'
                  }}>
                    {paginatedReviews.map((review, i) => (
                      <div key={i}>
                        {/* Reviewer Info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <div style={{ 
                            width: '48px', 
                            height: '48px', 
                            borderRadius: '50%', 
                            backgroundImage: review.ReviewerImage ? `url(${review.ReviewerImage})` : 'none',
                            backgroundColor: review.ReviewerImage ? 'transparent' : '#222', 
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '1.1rem',
                            flexShrink: 0
                          }}>
                            {!review.ReviewerImage && (review.ReviewerName?.charAt(0) || 'G')}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#222', fontSize: '1rem' }}>
                              {review.ReviewerName || 'Guest'}
                            </div>
                          </div>
                        </div>

                        {/* Rating and Date */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ color: '#222', fontSize: '0.85rem' }}>
                            {'★'.repeat(review.Rating || 5)}
                          </span>
                          <span style={{ color: '#717171', fontSize: '0.85rem' }}>·</span>
                          <span style={{ color: '#717171', fontSize: '0.85rem' }}>
                            {review.CreatedAt ? (() => {
                              const date = new Date(review.CreatedAt);
                              const now = new Date();
                              const diffMs = now - date;
                              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                              if (diffDays < 7) return 'recently';
                              if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
                              if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
                              return `${Math.floor(diffDays / 365)} years ago`;
                            })() : 'recently'}
                          </span>
                        </div>

                        {/* Review Text */}
                        <div style={{ 
                          color: '#222', 
                          fontSize: '1rem', 
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 4,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {review.Comment || review.ReviewText || 'Great experience!'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="host-no-reviews">
                    <i className="fas fa-comment-slash"></i>
                    <p>No reviews yet</p>
                  </div>
                )}
                
                {reviews.length > reviewsPerPage && (
                  <button className="host-show-more-btn" onClick={() => setCurrentReviewPage(p => p < totalPages ? p + 1 : 1)}>
                    Show all {reviews.length} reviews
                  </button>
                )}
              </section>

            {/* Report Actions */}
            <div className="host-report-section">
              <button className="host-report-btn">
                <i className="fas fa-flag"></i> Report this profile
              </button>
            </div>

          </div>
        </div>
      </div>
      
      <Footer />
    </PageLayout>
  );
}

export default HostProfilePage;
