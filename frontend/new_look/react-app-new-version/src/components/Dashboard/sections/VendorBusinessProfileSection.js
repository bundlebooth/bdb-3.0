import React, { useState } from 'react';
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
  
  const vendorProfileId = currentUser?.vendorProfileId || currentUser?.id;

  const profileCards = [
    { id: 'vendor-profile-panel', icon: 'fa-building', title: 'Business Information', description: 'Update your business details, categories, and description' },
    { id: 'vendor-location-panel', icon: 'fa-map-marker-alt', title: 'Location & Service Areas', description: 'Set your business address and areas you serve' },
    { id: 'vendor-additional-details-panel', icon: 'fa-clipboard-check', title: 'Vendor Setup Questionnaire', description: 'Select features that describe your services' },
    { id: 'vendor-services-panel', icon: 'fa-briefcase', title: 'Services & Packages', description: 'Manage your offerings and service packages' },
    { id: 'vendor-photos-panel', icon: 'fa-images', title: 'Gallery & Media', description: 'Manage business photos and organize into albums' },
    { id: 'vendor-social-panel', icon: 'fa-share-alt', title: 'Social Media & Booking', description: 'Connect your social profiles and booking link' },
    { id: 'vendor-faqs-panel', icon: 'fa-question-circle', title: 'FAQs', description: 'Create frequently asked questions' },
    { id: 'vendor-availability-panel', icon: 'fa-clock', title: 'Availability & Hours', description: 'Set your business hours and availability' },
    { id: 'vendor-google-reviews-panel', icon: 'fa-google', title: 'Google Reviews Integration', description: 'Display your Google Reviews on your profile', iconClass: 'fab' },
    { id: 'vendor-stripe-panel', icon: 'fa-stripe', title: 'Stripe Setup', description: 'Connect your Stripe account to receive payments', iconClass: 'fab' },
    { id: 'vendor-popular-filters-panel', icon: 'fa-tags', title: 'Popular Filters', description: 'Enable special badges that help clients find your business' }
  ];

  const renderPanel = () => {
    switch (activePanel) {
      case 'vendor-profile-panel':
        return <BusinessInformationPanel onBack={() => setActivePanel(null)} vendorProfileId={vendorProfileId} />;
      case 'vendor-location-panel':
        return <LocationServiceAreasPanel onBack={() => setActivePanel(null)} vendorProfileId={vendorProfileId} />;
      case 'vendor-services-panel':
        return <ServicesPackagesPanel onBack={() => setActivePanel(null)} vendorProfileId={vendorProfileId} />;
      case 'vendor-social-panel':
        return <SocialMediaPanel onBack={() => setActivePanel(null)} vendorProfileId={vendorProfileId} />;
      case 'vendor-additional-details-panel':
        return <VendorQuestionnairePanel onBack={() => setActivePanel(null)} vendorProfileId={vendorProfileId} />;
      case 'vendor-photos-panel':
        return <GalleryMediaPanel onBack={() => setActivePanel(null)} vendorProfileId={vendorProfileId} />;
      case 'vendor-faqs-panel':
        return <FAQsPanel onBack={() => setActivePanel(null)} vendorProfileId={vendorProfileId} />;
      case 'vendor-availability-panel':
        return <AvailabilityHoursPanel onBack={() => setActivePanel(null)} vendorProfileId={vendorProfileId} />;
      case 'vendor-google-reviews-panel':
        return <GoogleReviewsPanel onBack={() => setActivePanel(null)} vendorProfileId={vendorProfileId} />;
      case 'vendor-stripe-panel':
        return <StripeSetupPanel onBack={() => setActivePanel(null)} vendorProfileId={vendorProfileId} />;
      case 'vendor-popular-filters-panel':
        return <PopularFiltersPanel onBack={() => setActivePanel(null)} vendorProfileId={vendorProfileId} />;
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
                  <i className={`${card.iconClass || 'fas'} ${card.icon}`}></i>
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
