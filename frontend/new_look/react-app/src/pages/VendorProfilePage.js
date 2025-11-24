import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import Header from '../components/Header';
import VendorGallery from '../components/VendorGallery';
import ProfileModal from '../components/ProfileModal';
import DashboardModal from '../components/DashboardModal';
import Footer from '../components/Footer';
import { showBanner } from '../utils/helpers';
import './VendorProfilePage.css';

function VendorProfilePage() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [dashboardModalOpen, setDashboardModalOpen] = useState(false);
  const [dashboardSection, setDashboardSection] = useState('dashboard');
  const [vendorFeatures, setVendorFeatures] = useState([]);
  const [portfolioAlbums, setPortfolioAlbums] = useState([]);
  const [recommendations, setRecommendations] = useState({ similar: [], nearby: [], popular: [] });
  const [activeRecommendationTab, setActiveRecommendationTab] = useState('similar');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [socialMedia, setSocialMedia] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [team, setTeam] = useState([]);

  const loadVendorProfile = useCallback(async () => {
    try {
      setLoading(true);
      const userId = currentUser?.id || '';
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorId}?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load vendor profile');
      }

      const data = await response.json();
      const vendorDetails = data.data;
      
      setVendor(vendorDetails);
      setIsFavorite(vendorDetails.isFavorite || false);
      setSocialMedia(vendorDetails.socialMedia || []);
      setServiceAreas(vendorDetails.serviceAreas || []);
      setTeam(vendorDetails.team || []);
      
      // Load additional data
      if (vendorDetails.profile?.VendorProfileID) {
        loadVendorFeatures(vendorDetails.profile.VendorProfileID);
        loadPortfolioAlbums(vendorDetails.profile.VendorProfileID);
        loadRecommendations(vendorId, vendorDetails);
      }
      
      // Update page title
      document.title = `${vendorDetails.profile.BusinessName || vendorDetails.profile.DisplayName} - PlanHive`;
    } catch (error) {
      console.error('Error loading vendor profile:', error);
      showBanner('Failed to load vendor profile', 'error');
    } finally {
      setLoading(false);
    }
  }, [vendorId, currentUser]);

  // Load vendor features (questionnaire)
  const loadVendorFeatures = useCallback(async (vendorProfileId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/vendor-features/vendor/${vendorProfileId}`);
      if (response.ok) {
        const data = await response.json();
        setVendorFeatures(data.selectedFeatures || []);
      }
    } catch (error) {
      console.error('Error loading vendor features:', error);
    }
  }, []);

  // Load portfolio albums
  const loadPortfolioAlbums = useCallback(async (vendorProfileId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/portfolio/albums/public`);
      if (response.ok) {
        const data = await response.json();
        setPortfolioAlbums(data.albums || []);
      }
    } catch (error) {
      console.error('Error loading portfolio albums:', error);
    }
  }, []);

  // Load recommendations
  const loadRecommendations = useCallback(async (vendorId, vendorData) => {
    try {
      // Load similar vendors
      const category = vendorData.profile?.PrimaryCategory || vendorData.profile?.Category;
      const similarUrl = category 
        ? `${API_BASE_URL}/vendors?category=${encodeURIComponent(category)}&pageSize=8`
        : `${API_BASE_URL}/vendors?pageSize=8&sortBy=rating`;
      
      const similarResponse = await fetch(similarUrl);
      if (similarResponse.ok) {
        const similarData = await similarResponse.json();
        const similar = (similarData.vendors || similarData.data || []).filter(v => v.VendorProfileID != vendorId);
        setRecommendations(prev => ({ ...prev, similar }));
      }

      // Load nearby vendors
      const latitude = vendorData.profile?.Latitude;
      const longitude = vendorData.profile?.Longitude;
      if (latitude && longitude) {
        const nearbyResponse = await fetch(
          `${API_BASE_URL}/vendors?latitude=${latitude}&longitude=${longitude}&radiusMiles=25&pageSize=8&sortBy=nearest`
        );
        if (nearbyResponse.ok) {
          const nearbyData = await nearbyResponse.json();
          const nearby = (nearbyData.data || []).filter(v => v.VendorProfileID !== vendorId);
          setRecommendations(prev => ({ ...prev, nearby }));
        }
      }

      // Load popular vendors
      const popularResponse = await fetch(`${API_BASE_URL}/vendors?pageSize=8&sortBy=rating`);
      if (popularResponse.ok) {
        const popularData = await popularResponse.json();
        const popular = (popularData.data || []).filter(v => v.VendorProfileID !== vendorId);
        setRecommendations(prev => ({ ...prev, popular }));
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  }, []);

  useEffect(() => {
    if (vendorId) {
      loadVendorProfile();
    }
  }, [vendorId, loadVendorProfile]);

  const handleToggleFavorite = async () => {
    if (!currentUser) {
      showBanner('Please log in to save favorites', 'info');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/favorites/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: currentUser.id,
          vendorProfileId: vendorId
        })
      });

      if (!response.ok) throw new Error('Failed to toggle favorite');

      const result = await response.json();
      setIsFavorite(result.IsFavorite);
      showBanner(
        result.IsFavorite ? 'Vendor saved to favorites' : 'Vendor removed from favorites',
        'favorite'
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showBanner('Failed to update favorites', 'error');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const vendorName = vendor?.profile?.BusinessName || 'this vendor';

    if (navigator.share) {
      try {
        await navigator.share({
          title: vendorName,
          text: `Check out ${vendorName} on PlanHive!`,
          url: url
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          copyToClipboard(url);
        }
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showBanner('Link copied to clipboard!', 'success');
    }).catch(() => {
      showBanner('Failed to copy link', 'error');
    });
  };

  const handleRequestBooking = () => {
    if (!currentUser) {
      showBanner('Please log in to request a booking', 'info');
      setProfileModalOpen(true);
      return;
    }
    // Navigate to booking page
    navigate(`/booking/${vendorId}`);
  };

  const handleMessageVendor = () => {
    if (!currentUser) {
      showBanner('Please log in to message vendors', 'info');
      navigate('/');
      return;
    }
    console.log('Message vendor:', vendorId);
  };

  // Render social media icons
  const renderSocialMediaIcons = () => {
    if (!socialMedia || (socialMedia.length === 0 && !profile.Website)) {
      return null;
    }

    const platformIcons = {
      'facebook': 'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg',
      'instagram': 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png',
      'twitter': 'https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg',
      'x': 'https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg',
      'linkedin': 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png',
      'youtube': 'https://upload.wikimedia.org/wikipedia/commons/4/42/YouTube_icon_%282013-2017%29.png'
    };

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
        {socialMedia.map((social, index) => {
          const iconUrl = platformIcons[social.Platform.toLowerCase()] || 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Globe_icon.svg';
          const url = social.URL.startsWith('http') ? social.URL : `https://${social.URL}`;
          return (
            <a key={index} href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', opacity: 0.7, transition: 'all 0.2s' }}
               onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
               onMouseOut={(e) => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <img src={iconUrl} className="social-icon-small" alt={social.Platform} />
            </a>
          );
        })}
        {profile.Website && (
          <a href={profile.Website.startsWith('http') ? profile.Website : `https://${profile.Website}`} target="_blank" rel="noopener noreferrer"
             style={{ textDecoration: 'none', opacity: 0.7, transition: 'all 0.2s' }}
             onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
             onMouseOut={(e) => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.transform = 'translateY(0)'; }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c4/Globe_icon.svg" className="social-icon-small" alt="Website" />
          </a>
        )}
      </div>
    );
  };

  // Render vendor features (questionnaire)
  const renderVendorFeatures = () => {
    if (!vendorFeatures || vendorFeatures.length === 0) return null;

    // Group features by category
    const categorizedFeatures = {};
    vendorFeatures.forEach(feature => {
      const category = feature.CategoryName || 'Other';
      if (!categorizedFeatures[category]) {
        categorizedFeatures[category] = [];
      }
      categorizedFeatures[category].push(feature);
    });

    return (
      <div className="content-section">
        <h2>What this place offers</h2>
        <div>
          {Object.keys(categorizedFeatures).map((categoryName, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '2rem', padding: '1.5rem 0', borderBottom: '1px solid #ebebeb', alignItems: 'start' }}>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#222' }}>{categoryName}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem 1.5rem' }}>
                {categorizedFeatures[categoryName].map((feature, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <i className={`fas fa-${feature.FeatureIcon || 'check'}`} style={{ width: '16px', height: '16px', color: '#717171', flexShrink: 0 }}></i>
                    <span style={{ fontSize: '0.9375rem', color: '#222', lineHeight: 1.4 }}>{feature.FeatureName}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render location and service areas
  const renderLocationAndServiceAreas = () => {
    const hasLocation = profile.Latitude && profile.Longitude;
    const hasServiceAreas = serviceAreas && serviceAreas.length > 0;

    if (!hasLocation && !hasServiceAreas) return null;

    return (
      <div className="content-section">
        <h2>Where you'll find us</h2>
        {hasLocation && (
          <div style={{ marginBottom: '1rem' }}>
            <iframe
              width="100%"
              height="350"
              frameBorder="0"
              style={{ border: 0, display: 'block', borderRadius: '12px' }}
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${profile.Latitude},${profile.Longitude}&hl=en&z=14&output=embed`}
              allowFullScreen
            ></iframe>
            <div style={{ padding: '1rem', background: 'white', borderTop: '1px solid var(--border)', borderRadius: '0 0 12px 12px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fas fa-building"></i>
                <span>Business Location</span>
              </div>
              <div style={{ fontSize: '0.95rem', color: 'var(--text)' }}>
                {[profile.Address, profile.City, profile.State, profile.PostalCode, profile.Country].filter(Boolean).join(', ')}
              </div>
            </div>
          </div>
        )}
        {hasServiceAreas && (
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.75rem' }}>Areas We Serve</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
              {serviceAreas.map((area, index) => {
                const location = [area.CityName, area.StateProvince, area.Country].filter(Boolean).join(', ');
                return (
                  <div key={index} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                      <i className="fas fa-map-marker-alt" style={{ color: 'var(--primary)', marginRight: '0.5rem', fontSize: '0.85rem' }}></i>
                      {location}
                    </div>
                    {(area.ServiceRadius || (area.TravelCost && parseFloat(area.TravelCost) > 0)) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-light)' }}>
                        {area.ServiceRadius && (
                          <div><i className="fas fa-route" style={{ marginRight: '0.35rem', width: '12px' }}></i>{area.ServiceRadius} miles radius</div>
                        )}
                        {area.TravelCost && parseFloat(area.TravelCost) > 0 && (
                          <div><i className="fas fa-dollar-sign" style={{ marginRight: '0.35rem', width: '12px' }}></i>${parseFloat(area.TravelCost).toFixed(2)} travel fee</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render portfolio albums
  const renderPortfolioAlbums = () => {
    if (!portfolioAlbums || portfolioAlbums.length === 0) return null;

    return (
      <div className="content-section">
        <h2>Portfolio</h2>
        <div className="portfolio-grid">
          {portfolioAlbums.map((album, index) => (
            <div key={index} className="portfolio-album" onClick={() => console.log('Open album:', album.AlbumID)}>
              <div style={{ position: 'relative', paddingTop: '66%', background: 'var(--bg-dark)' }}>
                {album.CoverImageURL ? (
                  <img src={album.CoverImageURL} alt={album.AlbumName} className="portfolio-album-image" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-folder-open" style={{ fontSize: '3rem', color: 'var(--text-light)', opacity: 0.5 }}></i>
                  </div>
                )}
                <div className="portfolio-album-badge">
                  <i className="fas fa-images"></i> {album.ImageCount || 0}
                </div>
              </div>
              <div className="portfolio-album-info">
                <h4>{album.AlbumName}</h4>
                {album.AlbumDescription && <p>{album.AlbumDescription}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render team members
  const renderTeam = () => {
    if (!team || team.length === 0) return null;

    return (
      <div className="content-section">
        <h2>Meet the team</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {team.map((member, index) => (
            <div key={index} className="team-member-card">
              {member.PhotoURL && <img src={member.PhotoURL} alt={member.Name} className="team-member-photo" />}
              <h4 className="team-member-name">{member.Name}</h4>
              <p className="team-member-role">{member.Role}</p>
              {member.Bio && <p className="team-member-bio">{member.Bio}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render enhanced services with better formatting
  const renderEnhancedServices = () => {
    if (!services || services.length === 0) return null;

    return (
      <div className="content-section">
        <h2>What we offer</h2>
        <div>
          {services.map((service, index) => {
            const serviceName = service.ServiceName || service.Name || 'Unnamed Service';
            const servicePrice = service.Price || 0;
            const serviceDescription = service.Description || '';
            const serviceDuration = service.DurationMinutes || 0;
            const serviceCapacity = service.MaxAttendees || 0;
            const categoryName = service.CategoryName || '';
            const requiresDeposit = service.RequiresDeposit || false;
            const depositPercentage = service.DepositPercentage || 0;

            let priceDisplay = servicePrice > 0 ? `$${parseFloat(servicePrice).toFixed(2)}` : 'Contact for pricing';
            let priceSubtext = servicePrice > 0 ? '/ per service' : '';

            let durationText = '';
            if (serviceDuration > 0) {
              const hours = Math.floor(serviceDuration / 60);
              const mins = serviceDuration % 60;
              if (hours > 0 && mins > 0) {
                durationText = `${hours} hour${hours > 1 ? 's' : ''} ${mins} min`;
              } else if (hours > 0) {
                durationText = `${hours} hour${hours > 1 ? 's' : ''}`;
              } else {
                durationText = `${mins} minutes`;
              }
            }

            return (
              <div key={index} className="service-package-card">
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div className="service-image-container">
                    <i className="fas fa-concierge-bell service-icon"></i>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 className="service-card-title">{serviceName}</h3>
                        <div className="service-card-details" style={{ marginBottom: '0.25rem' }}>
                          {categoryName && <span><i className="fas fa-tag"></i>{categoryName}</span>}
                          {durationText && <span><i className="fas fa-clock"></i>{durationText}</span>}
                        </div>
                        <div className="service-card-details">
                          {serviceCapacity > 0 && <span><i className="fas fa-users"></i>Up to {serviceCapacity}</span>}
                          {requiresDeposit && depositPercentage > 0 && (
                            <span><i className="fas fa-receipt" style={{ color: 'var(--accent)' }}></i>{depositPercentage}% deposit</span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>{priceDisplay}</div>
                        {priceSubtext && <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '0.15rem' }}>{priceSubtext}</div>}
                      </div>
                    </div>
                    {serviceDescription && <p className="service-card-description" style={{ marginTop: '0.5rem' }}>{serviceDescription}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render enhanced FAQs with multiple choice support
  const renderEnhancedFAQs = () => {
    if (!faqs || faqs.length === 0) return null;

    return (
      <div className="content-section">
        <h2>Things to know</h2>
        <div>
          {faqs.map((faq, index) => {
            const answerType = (faq.AnswerType || '').trim().toLowerCase();
            const hasAnswerOptions = faq.AnswerOptions && faq.AnswerOptions !== 'null' && faq.AnswerOptions !== '';
            
            let answerContent = null;

            if ((answerType === 'multiple choice' || answerType === 'multiple_choice') && hasAnswerOptions) {
              try {
                let options = typeof faq.AnswerOptions === 'string' ? JSON.parse(faq.AnswerOptions) : faq.AnswerOptions;
                
                if (Array.isArray(options) && options.length > 0) {
                  if (options[0] && typeof options[0] === 'object' && 'label' in options[0]) {
                    const checkedOptions = options.filter(opt => opt.checked === true).map(opt => opt.label);
                    
                    if (checkedOptions.length > 0) {
                      answerContent = (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', marginTop: '0.75rem' }}>
                          {checkedOptions.map((label, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <i className="fas fa-check" style={{ color: '#3b82f6', fontSize: '0.875rem' }}></i>
                              <span style={{ color: '#2d3748', fontSize: '0.9375rem' }}>{label}</span>
                            </div>
                          ))}
                        </div>
                      );
                    } else {
                      answerContent = <div style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.6 }}>No options selected</div>;
                    }
                  } else {
                    answerContent = (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', marginTop: '0.75rem' }}>
                        {options.map((option, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <i className="fas fa-check" style={{ color: '#3b82f6', fontSize: '0.875rem' }}></i>
                            <span style={{ color: '#2d3748', fontSize: '0.9375rem' }}>{option}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                } else {
                  answerContent = <div style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.6 }}>{faq.Answer || 'No answer provided'}</div>;
                }
              } catch (e) {
                answerContent = <div style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.6 }}>{faq.Answer || 'No answer provided'}</div>;
              }
            } else {
              answerContent = <div style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.6 }}>{faq.Answer || 'No answer provided'}</div>;
            }

            return (
              <div key={index} style={{ padding: '1.5rem 0', borderBottom: index < faqs.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '1rem', marginBottom: '0.75rem' }}>
                  {faq.Question}
                </div>
                {answerContent}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render recommendations section
  const renderRecommendations = () => {
    const currentRecs = recommendations[activeRecommendationTab] || [];
    if (currentRecs.length === 0) return null;

    return (
      <div className="venue-recommendations-section">
        <div className="venue-recommendations-container">
          <div className="venue-recommendations-header">
            <h2>You might also like</h2>
          </div>
          <div className="venue-recommendation-tabs">
            <button 
              className={`venue-recommendation-tab ${activeRecommendationTab === 'similar' ? 'active' : ''}`}
              onClick={() => setActiveRecommendationTab('similar')}
            >
              Similar Vendors
            </button>
            <button 
              className={`venue-recommendation-tab ${activeRecommendationTab === 'nearby' ? 'active' : ''}`}
              onClick={() => setActiveRecommendationTab('nearby')}
            >
              Nearby Vendors
            </button>
            <button 
              className={`venue-recommendation-tab ${activeRecommendationTab === 'popular' ? 'active' : ''}`}
              onClick={() => setActiveRecommendationTab('popular')}
            >
              Popular Vendors
            </button>
          </div>
          <div className="venues-grid">
            {currentRecs.map((venue, index) => {
              const vId = venue.VendorProfileID || venue.vendorProfileId || venue.id;
              const name = venue.BusinessName || venue.businessName || venue.name || 'Unnamed Venue';
              const rating = parseFloat(venue.averageRating ?? venue.rating ?? 0);
              const reviewCount = venue.totalReviews || venue.reviewCount || 0;
              const city = venue.City || venue.city || '';
              const state = venue.State || venue.state || '';
              const location = [city, state].filter(Boolean).join(', ') || 'Location unavailable';
              
              let imageUrl = 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png';
              if (venue.images && venue.images.length > 0) {
                imageUrl = venue.images[0].ImageURL || venue.images[0].imageUrl || venue.images[0].url || imageUrl;
              } else if (venue.PrimaryImageURL || venue.primaryImageURL || venue.imageUrl) {
                imageUrl = venue.PrimaryImageURL || venue.primaryImageURL || venue.imageUrl;
              }
              
              const stars = '★'.repeat(Math.round(rating));

              return (
                <div key={index} className="recommendation-venue-card" onClick={() => navigate(`/vendor/${vId}`)}>
                  <img src={imageUrl} alt={name} className="recommendation-venue-image" 
                       onError={(e) => e.target.src = 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png'} />
                  <div className="recommendation-venue-info">
                    <div className="recommendation-venue-name">{name}</div>
                    {rating > 0 && (
                      <div className="recommendation-venue-rating">
                        <span className="stars">{stars}</span>
                        <span style={{ color: '#6b7280' }}>{rating.toFixed(1)}</span>
                        <span style={{ color: '#9ca3af' }}>({reviewCount})</span>
                      </div>
                    )}
                    <div className="recommendation-venue-location">
                      <i className="fas fa-map-marker-alt"></i>
                      {location}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <Header 
          onSearch={(q) => console.log(q)} 
          onProfileClick={() => setProfileModalOpen(true)} 
          onWishlistClick={() => setProfileModalOpen(true)} 
          onChatClick={() => setProfileModalOpen(true)} 
          onNotificationsClick={() => {}} 
        />
        <div className="profile-container">
          {/* Back Button Skeleton */}
          <div className="skeleton" style={{ width: '150px', height: '40px', borderRadius: '12px', marginBottom: '2rem' }}></div>

          {/* Image Gallery Skeleton */}
          <div className="image-gallery">
            <div className="gallery-item large-image">
              <div className="skeleton" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}></div>
            </div>
            <div className="thumbnails-container">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="gallery-item">
                  <div className="skeleton" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Header Skeleton */}
          <div className="vendor-profile-header">
            <div className="vendor-profile-info" style={{ flex: 1 }}>
              <div className="skeleton" style={{ width: '60%', height: '36px', marginBottom: '0.75rem' }}></div>
              <div className="skeleton" style={{ width: '40%', height: '20px', marginBottom: '0.5rem' }}></div>
            </div>
            <div className="vendor-profile-actions">
              <div className="skeleton" style={{ width: '44px', height: '44px', borderRadius: '50%' }}></div>
              <div className="skeleton" style={{ width: '44px', height: '44px', borderRadius: '50%' }}></div>
            </div>
          </div>

          {/* Content Layout Skeleton */}
          <div className="vendor-content-layout">
            <div className="vendor-main-content">
              {/* About Section Skeleton */}
              <div className="content-section">
                <div className="skeleton" style={{ width: '200px', height: '28px', marginBottom: '1rem' }}></div>
                <div className="skeleton" style={{ width: '100%', height: '20px', marginBottom: '0.5rem' }}></div>
                <div className="skeleton" style={{ width: '90%', height: '20px', marginBottom: '0.5rem' }}></div>
                <div className="skeleton" style={{ width: '80%', height: '20px' }}></div>
              </div>

              {/* Services Section Skeleton */}
              <div className="content-section">
                <div className="skeleton" style={{ width: '180px', height: '28px', marginBottom: '1rem' }}></div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="service-package-card" style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '12px' }}></div>
                      <div style={{ flex: 1 }}>
                        <div className="skeleton" style={{ width: '60%', height: '20px', marginBottom: '0.5rem' }}></div>
                        <div className="skeleton" style={{ width: '100%', height: '16px', marginBottom: '0.5rem' }}></div>
                        <div className="skeleton" style={{ width: '40%', height: '16px' }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar Skeleton */}
            <div className="vendor-sidebar">
              <div className="sidebar-card">
                <div className="skeleton" style={{ width: '100%', height: '48px', borderRadius: '12px', marginBottom: '1rem' }}></div>
                <div className="skeleton" style={{ width: '100%', height: '48px', borderRadius: '12px' }}></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!vendor) {
    return (
      <div className="profile-container">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-light)' }}>Vendor not found</p>
          <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const profile = vendor.profile;
  const images = vendor.images || [];
  const services = vendor.services || [];
  const reviews = vendor.reviews || [];
  const faqs = vendor.faqs || [];
  const businessHours = vendor.businessHours || [];

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', width: '100%' }}>
      <Header 
        onSearch={(q) => console.log(q)} 
        onProfileClick={() => {
          if (currentUser) {
            setDashboardModalOpen(true);
          } else {
            setProfileModalOpen(true);
          }
        }} 
        onWishlistClick={() => {
          if (currentUser) {
            setDashboardSection('favorites');
            setDashboardModalOpen(true);
          } else {
            setProfileModalOpen(true);
          }
        }} 
        onChatClick={() => {
          if (currentUser) {
            const section = currentUser.isVendor ? 'vendor-messages' : 'messages';
            setDashboardSection(section);
            setDashboardModalOpen(true);
          } else {
            setProfileModalOpen(true);
          }
        }} 
        onNotificationsClick={() => {}} 
      />
      <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
      <DashboardModal 
        isOpen={dashboardModalOpen} 
        onClose={() => setDashboardModalOpen(false)}
        initialSection={dashboardSection}
      />
      <div className="profile-container">
        {/* Back Button */}
        <button className="back-button" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i>
          <span>Back to search</span>
        </button>

        {/* Image Gallery */}
        <VendorGallery images={images} />

        {/* Vendor Title and Rating - BELOW Gallery */}
        <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '1.625rem', fontWeight: 600, marginBottom: '0.5rem', color: '#222', lineHeight: 1.25 }}>
                {profile.BusinessName || profile.DisplayName}
              </h1>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.95rem' }}>
                {/* Rating with blue star */}
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" style={{ 
                    display: 'block', 
                    height: '14px', 
                    width: '14px', 
                    fill: '#0066CC'
                  }}>
                    <path fillRule="evenodd" d="M15.1 1.58l-4.13 8.88-9.86 1.27a1 1 0 0 0-.54 1.74l7.3 6.57-1.97 9.85a1 1 0 0 0 1.48 1.06l8.62-5 8.63 5a1 1 0 0 0 1.48-1.06l-1.97-9.85 7.3-6.57a1 1 0 0 0-.55-1.73l-9.86-1.28-4.12-8.88a1 1 0 0 0-1.82 0z"></path>
                  </svg>
                  <span style={{ fontWeight: 600, color: '#000' }}>
                    {reviews.length > 0 ? '4.9' : '5.0'}
                  </span>
                  {reviews.length > 0 && (
                    <span style={{ color: '#717171' }}>({reviews.length})</span>
                  )}
                </span>
                
                <span style={{ color: '#717171', margin: '0 0.25rem' }}>·</span>
                
                {/* Location */}
                {(profile.City || profile.State) && (
                  <>
                    <span style={{ color: '#000', textDecoration: 'underline', fontWeight: 500, cursor: 'pointer' }}>
                      {[profile.City, profile.State, profile.Country].filter(Boolean).join(', ')}
                    </span>
                    <span style={{ color: '#717171', margin: '0 0.25rem' }}>·</span>
                  </>
                )}
                
                {/* Category */}
                <span style={{ color: '#000' }}>{profile.Tagline || profile.CategoryName || 'Event Services'}</span>
              </div>
            </div>

            {/* Action Buttons - Aligned to the right */}
            <div className="vendor-profile-actions">
              <div
                className={`vendor-action-btn ${isFavorite ? 'active' : ''}`}
                onClick={handleToggleFavorite}
                title="Save to favorites"
              >
                <i className="fas fa-heart"></i>
                <span>Save</span>
              </div>
              <div
                className="vendor-action-btn"
                onClick={handleShare}
                title="Share this vendor"
              >
                <i className="fas fa-share-alt"></i>
                <span>Share</span>
              </div>
            </div>
          </div>

          {/* Social Media Icons */}
          <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #ebebeb' }}>
            {renderSocialMediaIcons()}
          </div>
        </div>

      {/* Content Layout */}
      <div className="vendor-content-layout">
        {/* Main Content */}
        <div className="vendor-main-content">
          {/* About Section */}
          <div className="content-section">
            <h2>About this vendor</h2>
            <p>{profile.BusinessDescription || 'Welcome to our business! We provide exceptional event services tailored to your needs.'}</p>
          </div>

          {/* Location & Service Areas */}
          {renderLocationAndServiceAreas()}

          {/* Vendor Features (Questionnaire) */}
          {renderVendorFeatures()}

          {/* Enhanced Services Section */}
          {renderEnhancedServices()}

          {/* Enhanced FAQs Section */}
          {renderEnhancedFAQs()}

          {/* Team Section */}
          {renderTeam()}

          {/* Portfolio Section */}
          {renderPortfolioAlbums()}

          {/* Reviews Section */}
          <div className="content-section">
            <h2>Reviews</h2>
            <div id="reviews-list">
              {reviews.length > 0 ? (
                reviews.map((review, index) => (
                  <div key={index} className="review-card">
                    <div className="review-header">
                      <div className="reviewer-name">{review.ReviewerName || 'Anonymous'}</div>
                      <div className="review-date">{new Date(review.CreatedAt).toLocaleDateString()}</div>
                    </div>
                    <div className="review-rating">{'★'.repeat(review.Rating)}{'☆'.repeat(5 - review.Rating)}</div>
                    <div className="review-comment">{review.Comment}</div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>No reviews yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Reordered */}
        <div className="vendor-sidebar">
          {/* Business Hours - First */}
          {businessHours.length > 0 && (
            <div className="sidebar-card">
              <h3>Business Hours</h3>
              <div style={{ fontSize: '0.9rem' }}>
                {businessHours.map((hour, index) => {
                  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  return (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: index < businessHours.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                      <span style={{ fontWeight: 500, color: '#222' }}>{dayNames[hour.DayOfWeek]}</span>
                      <span style={{ color: '#717171' }}>{hour.IsAvailable ? `${hour.OpenTime} - ${hour.CloseTime}` : 'Closed'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Request Booking Card - Second */}
          <div className="sidebar-card">
            <h3>Request to Book</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Send a booking request to this vendor with your event details and service requirements.
            </p>
            <button className="btn btn-primary btn-full-width" onClick={handleRequestBooking}>
              <i className="fas fa-calendar-check"></i>
              <span>Request Booking</span>
            </button>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.75rem', textAlign: 'center' }}>
              <i className="fas fa-shield-alt" style={{ color: 'var(--primary)' }}></i> Free request • No payment required
            </p>
          </div>

          {/* Contact - Third */}
          <div className="sidebar-card">
            <h3>Message Vendor</h3>
            <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-light)' }}>
              Have questions? Get in touch!
            </p>
            <button className="btn btn-outline btn-full-width" onClick={handleMessageVendor}>
              <i className="fas fa-comment"></i>
              <span>Send Message</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Recommendations Section */}
      {renderRecommendations()}
    </div>
    <Footer />
    </div>
  );
}

export default VendorProfilePage;
