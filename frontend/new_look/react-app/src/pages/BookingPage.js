import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import Header from '../components/Header';
import ProfileModal from '../components/ProfileModal';
import '../styles/BookingPage.css';

function BookingPage() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // State Management
  const [currentStep, setCurrentStep] = useState(1);
  const [vendorData, setVendorData] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const [bookingData, setBookingData] = useState({
    eventName: '',
    eventType: '',
    eventDate: '',
    eventTime: '',
    eventEndTime: '',
    attendeeCount: '',
    eventLocation: '',
    specialRequests: ''
  });

  // Initialize page
  useEffect(() => {
    if (!vendorId) {
      alert('No vendor selected. Redirecting to home page.');
      navigate('/');
      return;
    }

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('event-date');
    if (dateInput) {
      dateInput.setAttribute('min', today);
    }

    loadVendorData();
  }, [vendorId, navigate]);

  // Load vendor data
  const loadVendorData = useCallback(async () => {
    try {
      console.log(`Loading vendor data for ID: ${vendorId}`);
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load vendor data: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Vendor data response:', result);
      
      if (result.success && result.data) {
        setVendorData(result.data);
      } else {
        throw new Error('Invalid vendor data format');
      }
    } catch (error) {
      console.error('Error loading vendor data:', error);
      
      // For development/testing, show a placeholder vendor
      setVendorData({
        profile: {
          BusinessName: 'Sample Vendor',
          AverageRating: 4.8,
          ReviewCount: 24
        },
        categories: [{
          CategoryName: 'Event Services'
        }]
      });
    }
  }, [vendorId]);

  // Load vendor services
  const loadVendorServices = useCallback(async () => {
    setLoadingServices(true);
    try {
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorId}/selected-services`);
      
      if (!response.ok) {
        throw new Error('Failed to load services');
      }
      
      const data = await response.json();
      setServices(data.selectedServices || []);
    } catch (error) {
      console.error('Error loading services:', error);
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  }, [vendorId]);

  // Load services when entering step 2
  useEffect(() => {
    if (currentStep === 2 && services.length === 0) {
      loadVendorServices();
    }
  }, [currentStep, services.length, loadVendorServices]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    let fieldName = id;
    
    // Map form field IDs to state property names
    const fieldMapping = {
      'event-name': 'eventName',
      'event-type': 'eventType',
      'event-date': 'eventDate',
      'event-time': 'eventTime',
      'event-end-time': 'eventEndTime',
      'attendee-count': 'attendeeCount',
      'event-location': 'eventLocation',
      'special-requests': 'specialRequests'
    };
    
    fieldName = fieldMapping[id] || fieldName;
    
    setBookingData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Toggle service selection
  const toggleServiceSelection = (service) => {
    const serviceId = service.PredefinedServiceID || service.VendorSelectedServiceID;
    const serviceName = service.ServiceName;
    const servicePrice = service.VendorPrice || 0;

    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.id === serviceId);
      if (isSelected) {
        return prev.filter(s => s.id !== serviceId);
      } else {
        return [...prev, { id: serviceId, name: serviceName, price: servicePrice }];
      }
    });
  };

  // Validation
  const validateStep = (step) => {
    if (step === 1) {
      if (!bookingData.eventName.trim()) {
        alert('Please enter an event name');
        return false;
      }
      if (!bookingData.eventType) {
        alert('Please select an event type');
        return false;
      }
      if (!bookingData.eventDate) {
        alert('Please select an event date');
        return false;
      }
      if (!bookingData.eventTime) {
        alert('Please select a start time');
        return false;
      }
      if (!bookingData.attendeeCount || bookingData.attendeeCount < 1) {
        alert('Please enter the number of guests');
        return false;
      }
      if (!bookingData.eventLocation.trim()) {
        alert('Please enter the event location');
        return false;
      }
      return true;
    }
    
    if (step === 2) {
      if (selectedServices.length === 0) {
        const proceed = window.confirm('You haven\'t selected any services. Do you want to continue anyway?');
        return proceed;
      }
      return true;
    }
    
    return true;
  };

  // Navigation
  const nextStep = () => {
    if (!validateStep(currentStep)) {
      return;
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goBackToVendor = () => {
    if (window.confirm('Are you sure you want to leave? Your booking information will be lost.')) {
      navigate(`/vendor/${vendorId}`);
    }
  };

  // Submit booking
  const submitBookingRequest = async () => {
    if (!currentUser || !currentUser.id) {
      alert('You must be logged in to send a booking request. Please log in and try again.');
      navigate('/');
      return;
    }

    setSubmitting(true);

    try {
      const requestData = {
        userId: currentUser.id,
        vendorProfileId: parseInt(vendorId),
        eventName: bookingData.eventName,
        eventType: bookingData.eventType,
        eventDate: bookingData.eventDate,
        eventTime: bookingData.eventTime + ':00',
        eventEndTime: bookingData.eventEndTime ? bookingData.eventEndTime + ':00' : null,
        eventLocation: bookingData.eventLocation,
        attendeeCount: parseInt(bookingData.attendeeCount),
        services: selectedServices,
        specialRequestText: bookingData.specialRequests,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      const response = await fetch(`${API_BASE_URL}/bookings/requests/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to send booking request');
      }

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error submitting booking request:', error);
      alert('Failed to send booking request: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format service duration
  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${mins} min`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${mins} min`;
    }
  };

  const profile = vendorData?.profile || {};
  const businessName = profile.BusinessName || profile.Name || 'Vendor';
  const category = vendorData?.categories?.[0]?.CategoryName || vendorData?.categories?.[0]?.Category || '';
  const rating = profile.AverageRating || profile.Rating || 0;
  const reviewCount = profile.ReviewCount || profile.TotalReviews || 0;
  const profilePic = profile.ProfilePictureURL || profile.ProfilePicture || '';

  // Debug logging
  console.log('Current step:', currentStep);
  console.log('Booking data:', bookingData);

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', width: '100%' }}>
      {/* Header */}
      <Header 
        onSearch={(q) => console.log(q)} 
        onProfileClick={() => {
          if (currentUser) {
            setProfileModalOpen(true);
          } else {
            navigate('/');
          }
        }} 
        onWishlistClick={() => setProfileModalOpen(true)} 
        onChatClick={() => setProfileModalOpen(true)} 
        onNotificationsClick={() => {}} 
      />

      {/* Main Content */}
      <div className="booking-container">
        {/* Left Side - Booking Form */}
        <div className="booking-form-section">
          <div className="booking-form-wrapper">
            {/* Back Button */}
            <button 
              className="back-button" 
              onClick={goBackToVendor}
              style={{ 
                marginBottom: '1.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'transparent',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                color: '#222'
              }}
            >
              <i className="fas fa-arrow-left"></i>
              Back to Vendor
            </button>
            
            <h1 className="booking-title">Request to book</h1>
            
            
            {/* Step 1: Event Information */}
            {currentStep === 1 && (
            <div style={{ display: 'block', width: '100%', padding: '20px', backgroundColor: '#ffffff' }}>
              <div className="booking-step" id="step-1" style={{ display: 'block', width: '100%' }}>
                <div className="step-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="step-number-circle" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#222', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600' }}>1</div>
                  <h2 className="step-title" style={{ fontSize: '1.5rem', fontWeight: '600', margin: '0', color: '#222' }}>Your Event Details</h2>
                </div>
                
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="event-name" className="form-label" style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#222' }}>
                    Event Name <span className="required-asterisk" style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="event-name"
                    className="form-input"
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem 1rem', 
                      border: '1px solid #ddd', 
                      borderRadius: '8px', 
                      fontSize: '1rem',
                      display: 'block',
                      backgroundColor: 'white'
                    }}
                    placeholder="e.g., Sarah & John's Wedding"
                    value={bookingData.eventName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="event-type" className="form-label" style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#222' }}>
                    Event Type <span className="required-asterisk" style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    id="event-type"
                    className="form-input"
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem 1rem', 
                      border: '1px solid #ddd', 
                      borderRadius: '8px', 
                      fontSize: '1rem',
                      display: 'block',
                      backgroundColor: 'white'
                    }}
                    value={bookingData.eventType}
                    onChange={handleInputChange}
                  >
                    <option value="">Select event type</option>
                    <option value="wedding">Wedding</option>
                    <option value="birthday">Birthday Party</option>
                    <option value="corporate">Corporate Event</option>
                    <option value="anniversary">Anniversary</option>
                    <option value="graduation">Graduation</option>
                    <option value="baby-shower">Baby Shower</option>
                    <option value="engagement">Engagement Party</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label htmlFor="event-date" className="form-label" style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#222' }}>
                      Event Date <span className="required-asterisk" style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="date"
                      id="event-date"
                      className="form-input"
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem 1rem', 
                        border: '1px solid #ddd', 
                        borderRadius: '8px', 
                        fontSize: '1rem',
                        display: 'block',
                        backgroundColor: 'white'
                      }}
                      value={bookingData.eventDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="event-time" className="form-label" style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#222' }}>
                      Start Time <span className="required-asterisk" style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="time"
                      id="event-time"
                      className="form-input"
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem 1rem', 
                        border: '1px solid #ddd', 
                        borderRadius: '8px', 
                        fontSize: '1rem',
                        display: 'block',
                        backgroundColor: 'white'
                      }}
                      value={bookingData.eventTime}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="event-end-time" className="form-label">
                      End Time (Optional)
                    </label>
                    <input
                      type="time"
                      id="event-end-time"
                      className="form-input"
                      value={bookingData.eventEndTime}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="attendee-count" className="form-label">
                      Number of Guests <span className="required-asterisk">*</span>
                    </label>
                    <input
                      type="number"
                      id="attendee-count"
                      className="form-input"
                      placeholder="50"
                      min="1"
                      value={bookingData.attendeeCount}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="event-location" className="form-label">
                    Event Location <span className="required-asterisk">*</span>
                  </label>
                  <input
                    type="text"
                    id="event-location"
                    className="form-input"
                    placeholder="Enter address or venue"
                    value={bookingData.eventLocation}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                {/* Upcoming Steps Preview */}
                <div className="upcoming-steps">
                  <div className="overview-step" data-step="2">
                    <div className="overview-number">2</div>
                    <div className="overview-title">Choose Services</div>
                  </div>
                  <div className="overview-step" data-step="3">
                    <div className="overview-number">3</div>
                    <div className="overview-title">Review your request</div>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Step 2: Service Selection */}
            {currentStep === 2 && (
              <div className="booking-step" id="step-2" style={{ display: 'block', width: '100%', padding: '20px', backgroundColor: '#ffffff' }}>
                <div className="step-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="step-number-circle" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#222', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600' }}>2</div>
                  <h2 className="step-title" style={{ fontSize: '1.5rem', fontWeight: '600', margin: '0', color: '#222' }}>Choose Services</h2>
                </div>
                <p className="step-description" style={{ color: '#717171', marginBottom: '1.5rem' }}>Select the services you'd like to book from this vendor</p>
                
                <div id="services-list" className="services-list">
                  {loadingServices ? (
                    <div className="loading-spinner">
                      <i className="fas fa-spinner fa-spin"></i>
                      <p>Loading services...</p>
                    </div>
                  ) : services.length === 0 ? (
                    <div className="no-services">
                      <i className="fas fa-info-circle"></i>
                      <p>This vendor hasn't listed specific services yet. You can still send a booking request with your requirements.</p>
                    </div>
                  ) : (
                    services.map((service) => {
                      const serviceId = service.PredefinedServiceID || service.VendorSelectedServiceID;
                      const isSelected = selectedServices.some(s => s.id === serviceId);
                      const category = service.Category || 'Beauty & Wellness';
                      const duration = service.VendorDurationMinutes || service.DefaultDurationMinutes || 0;
                      
                      return (
                        <div
                          key={serviceId}
                          className={`service-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleServiceSelection(service)}
                        >
                          <div className="service-icon-container">
                            <i className="fas fa-spa"></i>
                          </div>
                          <div className="service-content">
                            <h4 className="service-name">{service.ServiceName}</h4>
                            <div className="service-meta">
                              <span className="service-category">
                                <i className="fas fa-tag"></i>
                                {category}
                              </span>
                              {duration > 0 && (
                                <span className="service-duration">
                                  <i className="far fa-clock"></i> {formatDuration(duration)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="service-checkbox">
                            {isSelected && <i className="fas fa-check"></i>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                
                {/* Upcoming Steps Preview */}
                <div className="upcoming-steps">
                  <div className="overview-step" data-step="3">
                    <div className="overview-number">3</div>
                    <div className="overview-title">Review your request</div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Additional Details & Review */}
            {currentStep === 3 && (
              <div className="booking-step" id="step-3" style={{ display: 'block', width: '100%', padding: '20px', backgroundColor: '#ffffff' }}>
                <div className="step-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="step-number-circle" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#222', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600' }}>3</div>
                  <h2 className="step-title" style={{ fontSize: '1.5rem', fontWeight: '600', margin: '0', color: '#222' }}>Review your request</h2>
                </div>
                
                <div className="review-section" style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f7f7f7', borderRadius: '12px' }}>
                  <h3 className="review-subtitle" style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#222' }}>Event Details</h3>
                  <div className="review-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #ddd' }}>
                    <span className="review-label" style={{ color: '#717171', fontWeight: '500' }}>Event:</span>
                    <span className="review-value" style={{ color: '#222', fontWeight: '600', textAlign: 'right' }}>{bookingData.eventName}</span>
                  </div>
                  <div className="review-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #ddd' }}>
                    <span className="review-label" style={{ color: '#717171', fontWeight: '500' }}>Type:</span>
                    <span className="review-value">
                      {bookingData.eventType.charAt(0).toUpperCase() + bookingData.eventType.slice(1).replace('-', ' ')}
                    </span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Date & Time:</span>
                    <span className="review-value">
                      {formatDate(bookingData.eventDate)} at {formatTime(bookingData.eventTime)}
                      {bookingData.eventEndTime && ` - ${formatTime(bookingData.eventEndTime)}`}
                    </span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Guests:</span>
                    <span className="review-value">{bookingData.attendeeCount} guests</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Location:</span>
                    <span className="review-value">{bookingData.eventLocation}</span>
                  </div>
                </div>

                <div className="review-section">
                  <h3 className="review-subtitle">Selected Services</h3>
                  <div id="review-services-list" className="review-services">
                    {selectedServices.length > 0 ? (
                      selectedServices.map((service, index) => (
                        <div key={index} className="review-service-item">
                          <i className="fas fa-check-circle"></i>
                          <span>{service.name}</span>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: 'var(--text-secondary)' }}>No specific services selected</p>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="special-requests" className="form-label">
                    Special Requests or Questions (Optional)
                  </label>
                  <textarea
                    id="special-requests"
                    className="form-textarea"
                    rows="4"
                    placeholder="Add any special requests, dietary restrictions, or questions for the vendor..."
                    value={bookingData.specialRequests}
                    onChange={handleInputChange}
                  ></textarea>
                </div>

                <div className="info-box">
                  <i className="fas fa-info-circle"></i>
                  <div>
                    <strong>What happens next?</strong>
                    <p>The vendor will review your request and respond within 24 hours. You'll receive a notification when they respond.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="form-actions">
              {currentStep > 1 && (
                <button className="btn btn-secondary" onClick={previousStep}>
                  <i className="fas fa-arrow-left"></i> Back
                </button>
              )}
              {currentStep < 3 ? (
                <button className="btn btn-primary" onClick={nextStep}>
                  Next <i className="fas fa-arrow-right"></i>
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={submitBookingRequest}
                  disabled={submitting}
                >
                  {submitting ? (
                    <><i className="fas fa-spinner fa-spin"></i> Sending...</>
                  ) : (
                    <><i className="fas fa-paper-plane"></i> Send Request</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Booking Summary */}
        <div className="booking-summary-section">
          <div className="booking-summary-card">
            <div className="vendor-info" id="vendor-info">
              {profilePic ? (
                <img src={profilePic} alt={businessName} className="vendor-image" />
              ) : (
                <div className="vendor-image-placeholder">
                  <i className="fas fa-store"></i>
                </div>
              )}
              <div className="vendor-details">
                <h3 className="vendor-name">{businessName}</h3>
                {category && <p className="vendor-category">{category}</p>}
                <div className="vendor-rating">
                  <i className="fas fa-star"></i>
                  <span>{rating > 0 ? rating.toFixed(1) : 'New'}</span>
                  {reviewCount > 0 && (
                    <span className="review-count">({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
                  )}
                </div>
              </div>
            </div>

            <div className="summary-divider"></div>

            <div className="booking-summary-details">
              <h4 className="summary-title">Booking Summary</h4>
              
              {bookingData.eventDate && (
                <div className="summary-item" id="summary-date">
                  <i className="fas fa-calendar"></i>
                  <div>
                    <div className="summary-label">Date</div>
                    <div className="summary-value">{formatDate(bookingData.eventDate)}</div>
                  </div>
                </div>
              )}

              {bookingData.eventTime && (
                <div className="summary-item" id="summary-time">
                  <i className="fas fa-clock"></i>
                  <div>
                    <div className="summary-label">Time</div>
                    <div className="summary-value">
                      {formatTime(bookingData.eventTime)}
                      {bookingData.eventEndTime && ` - ${formatTime(bookingData.eventEndTime)}`}
                    </div>
                  </div>
                </div>
              )}

              {bookingData.attendeeCount && (
                <div className="summary-item" id="summary-guests">
                  <i className="fas fa-users"></i>
                  <div>
                    <div className="summary-label">Guests</div>
                    <div className="summary-value">{bookingData.attendeeCount} guests</div>
                  </div>
                </div>
              )}

              {selectedServices.length > 0 && (
                <div className="summary-item" id="summary-services">
                  <i className="fas fa-list"></i>
                  <div>
                    <div className="summary-label">Services</div>
                    <div className="summary-value">
                      {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} selected
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="summary-divider"></div>

            <div className="info-notice">
              <i className="fas fa-shield-alt"></i>
              <p>This is a free request. You won't be charged until you confirm with the vendor.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div id="success-modal" className="modal">
          <div className="modal-content success-modal-content">
            <div className="success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h2>Request Sent Successfully!</h2>
            <p>Your booking request has been sent to the vendor. They will review your request and respond within 24 hours.</p>
            <div className="success-actions">
              <button
                className="btn btn-primary"
                onClick={() => navigate('/')}
              >
                View My Requests
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate(`/vendor/${vendorId}`)}
              >
                Back to Vendor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={profileModalOpen} 
        onClose={() => setProfileModalOpen(false)} 
      />
    </div>
  );
}

export default BookingPage;
