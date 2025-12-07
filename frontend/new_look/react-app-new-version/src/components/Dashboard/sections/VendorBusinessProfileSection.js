import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import BusinessInformationPanel from '../panels/BusinessInformationPanel';
import LocationServiceAreasPanel from '../panels/LocationServiceAreasPanel';
import ServicesPackagesPanel from '../panels/ServicesPackagesPanel';
import SocialMediaPanel from '../panels/SocialMediaPanel';
import VendorQuestionnairePanel from '../panels/VendorQuestionnairePanel';
import GalleryMediaPanel from '../panels/GalleryMediaPanel';
import FAQsPanel from '../panels/FAQsPanel';
import AvailabilityHoursPanel from '../panels/AvailabilityHoursPanel';
import StripeSetupPanel from '../panels/StripeSetupPanel';
import PopularFiltersPanel from '../panels/PopularFiltersPanel';
import GoogleReviewsPanel from '../panels/GoogleReviewsPanel';

function VendorBusinessProfileSection() {
  const { currentUser } = useAuth();
  const [activePanel, setActivePanel] = useState(null);
  
  // NO FALLBACK - must have vendorProfileId
  const vendorProfileId = currentUser?.vendorProfileId;

  // Debug logging - hooks must be called unconditionally
  useEffect(() => {
    if (!vendorProfileId) return; // Guard inside effect
    console.log('🔍 VendorBusinessProfileSection - currentUser changed:', {
      userId: currentUser?.id,
      vendorProfileId: currentUser?.vendorProfileId,
      calculatedVendorId: vendorProfileId,
      activePanel
    });
  }, [currentUser, vendorProfileId, activePanel]);

  // Close any open panel when user changes to prevent showing old data
  useEffect(() => {
    console.log('🚪 Closing active panel due to user change');
    setActivePanel(null);
  }, [currentUser?.id, currentUser?.vendorProfileId]);
  
  // Don't render if no vendorProfileId - MUST be after all hooks
  if (!vendorProfileId) {
    console.error('❌ No vendorProfileId found for user:', currentUser);
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Vendor Profile Not Found</h2>
        <p>Please complete your vendor registration first.</p>
      </div>
    );
  }

  const profileCards = [
    { id: 'vendor-profile-panel', icon: 'fa-building', title: 'Business Information', description: 'Update your business details, categories, and description' },
    { id: 'vendor-location-panel', icon: 'fa-map-marker-alt', title: 'Location & Service Areas', description: 'Set your business address and areas you serve' },
    { id: 'vendor-additional-details-panel', icon: 'fa-clipboard-check', title: 'Vendor Setup Questionnaire', description: 'Select features that describe your services' },
    { id: 'vendor-services-panel', icon: 'fa-briefcase', title: 'Services & Packages', description: 'Manage your offerings and service packages' },
    { id: 'vendor-photos-panel', icon: 'fa-images', title: 'Gallery & Media', description: 'Manage business photos and organize into albums' },
    { id: 'vendor-social-panel', icon: 'fa-share-alt', title: 'Social Media & Booking', description: 'Connect your social profiles and booking link' },
    { id: 'vendor-faqs-panel', icon: 'fa-question-circle', title: 'FAQs', description: 'Create frequently asked questions' },
    { id: 'vendor-availability-panel', icon: 'fa-clock', title: 'Availability & Hours', description: 'Set your business hours and availability' },
    { id: 'vendor-google-reviews-panel', icon: 'fa-google', title: 'Google Reviews Integration', description: 'Display your Google Reviews on your profile', iconClass: 'fab', useGoogleLogo: true },
    { id: 'vendor-stripe-panel', icon: 'fa-stripe', title: 'Stripe Setup', description: 'Connect your Stripe account to receive payments', iconClass: 'fab' },
    { id: 'vendor-popular-filters-panel', icon: 'fa-tags', title: 'Popular Filters', description: 'Enable special badges that help clients find your business' }
  ];

  const renderPanel = () => {
    // Use vendorProfileId as key to force component remount when vendor changes
    switch (activePanel) {
      case 'vendor-profile-panel':
        return <BusinessInformationPanel key={vendorProfileId} onBack={() => setActivePanel(null)} vendorProfileId={vendorProfileId} />;
      case 'vendor-location-panel':
        return <LocationServiceAreasPanel key={vendorProfileId} onBack={() => setActivePanel(null)} vendorProfileId={vendorProfileId} />;
      case 'vendor-services-panel':
        return <ServicesPackagesPanel key={vendorProfileId} onBack={() => setActivePanel(null)} vendorProfileId={vendorProfileId} />;
      case 'vendor-social-panel':
        return <SocialMediaPanel key={vendorProfileId} onBack={() => setActivePanel(null)} vendorProfileId={vendorProfileId} />;
      case 'vendor-additional-details-panel':
        return <VendorQuestionnairePanel key={vendorProfileId} onBack={() => setActivePanel(null)} vendorProfileId={vendorProfileId} />;
      case 'vendor-photos-panel':
        return <GalleryMediaPanel key={vendorProfileId} onBack={() => setActivePanel(null)} vendorProfileId={vendorProfileId} />;
      case 'vendor-faqs-panel':
        return <FAQsPanel key={vendorProfileId} onBack={() => setActivePanel(null)} vendorProfileId={vendorProfileId} />;
      case 'vendor-availability-panel':
        return <AvailabilityHoursPanel key={vendorProfileId} onBack={() => setActivePanel(null)} vendorProfileId={vendorProfileId} />;
      case 'vendor-google-reviews-panel':
        return <GoogleReviewsPanel key={vendorProfileId} onBack={() => setActivePanel(null)} vendorProfileId={vendorProfileId} />;
      case 'vendor-stripe-panel':
        return <StripeSetupPanel key={vendorProfileId} onBack={() => setActivePanel(null)} vendorProfileId={vendorProfileId} />;
      case 'vendor-popular-filters-panel':
        return <PopularFiltersPanel key={vendorProfileId} onBack={() => setActivePanel(null)} vendorProfileId={vendorProfileId} />;
      default:
        return null;
    }
  };

  return (
    <div id="vendor-business-profile-section">
      {!activePanel ? (
        <div className="settings-category">
          <div id="business-profile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="settings-category-title" style={{ marginBottom: 0 }}>Business Profile Management</h2>
            <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', padding: '0.6rem 1rem' }}>
              <i className="fas fa-external-link-alt"></i>
              View your profile
            </button>
          </div>
          <div className="settings-grid">
            {profileCards.map(card => (
              <div 
                key={card.id}
                className="settings-card" 
                data-panel={card.id}
                onClick={() => setActivePanel(card.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="settings-card-icon">
                  {card.useGoogleLogo ? (
                    <img 
                      src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" 
                      alt="Google" 
                      style={{ width: '24px', height: '24px' }}
                    />
                  ) : (
                    <i className={`${card.iconClass || 'fas'} ${card.icon}`}></i>
                  )}
                </div>
                <h3 className="settings-card-title">{card.title}</h3>
                <p className="settings-card-description">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        renderPanel()
      )}
    </div>
  );
}

export default VendorBusinessProfileSection;
