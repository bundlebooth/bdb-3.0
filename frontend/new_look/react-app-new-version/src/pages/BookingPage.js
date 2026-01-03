import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, GOOGLE_MAPS_API_KEY } from '../config';
import Header from '../components/Header';
import ServiceCard from '../components/ServiceCard';
import SkeletonLoader from '../components/SkeletonLoader';
import ProfileModal from '../components/ProfileModal';
import DashboardModal from '../components/DashboardModal';
import SetupIncompleteBanner from '../components/SetupIncompleteBanner';
import MessagingWidget from '../components/MessagingWidget';
import Breadcrumb from '../components/Breadcrumb';
import BookingCalendar from '../components/BookingCalendar';
import { extractVendorIdFromSlug, parseQueryParams, trackPageView } from '../utils/urlHelpers';
import '../styles/BookingPage.css';
import '../components/Calendar.css';

function BookingPage() {
  const { vendorSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  // Extract vendor ID from slug (supports both "138" and "business-name-138")
  const vendorId = extractVendorIdFromSlug(vendorSlug) || vendorSlug;

  // State Management
  const [currentStep, setCurrentStep] = useState(1);
  const [vendorData, setVendorData] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [dashboardModalOpen, setDashboardModalOpen] = useState(false);
  const [dashboardSection, setDashboardSection] = useState('dashboard');
  const [showCalendar, setShowCalendar] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [vendorAvailability, setVendorAvailability] = useState(null);
  const locationInputRef = useRef(null);
  const autocompleteRef = useRef(null);

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
    loadVendorAvailability();
  }, [vendorId, navigate]);

  // Load Google Maps API for location autocomplete
  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      initializeGooglePlaces();
    } else {
      loadGoogleMapsAPI();
    }
  }, []);

  // Initialize Google Places when location input is rendered
  useEffect(() => {
    if (locationInputRef.current && window.google && window.google.maps && window.google.maps.places) {
      initializeGooglePlaces();
    }
  }, [currentStep]);

  // Scroll to top when component mounts or vendorId changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [vendorId]);

  // Load vendor data
  const loadVendorData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load vendor data: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
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

  // Load vendor availability (business hours and exceptions)
  const loadVendorAvailability = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorId}/availability`);
      if (response.ok) {
        const data = await response.json();
        setVendorAvailability(data);
      }
    } catch (error) {
      console.error('❌ Error loading vendor availability:', error);
    }
  }, [vendorId]);

  // Load Google Maps API
  const loadGoogleMapsAPI = () => {
    if (window.google) return;
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = initializeGooglePlaces;
    document.head.appendChild(script);
  };

  // Initialize Google Places Autocomplete
  const initializeGooglePlaces = () => {
    if (!locationInputRef.current) return;
    
    // Clear existing autocomplete if it exists
    if (autocompleteRef.current) {
      window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
    }

    const autocomplete = new window.google.maps.places.Autocomplete(locationInputRef.current, {
      componentRestrictions: { country: 'ca' } // Restrict to Canada
    });

    autocompleteRef.current = autocomplete;

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        setBookingData(prev => ({
          ...prev,
          eventLocation: place.formatted_address
        }));
      }
    });
  };

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

  // Handle calendar date selection - do everything here, no useEffect
  const handleCalendarDateSelect = (dateString) => {
    // Generate time slots for this date
    let newSlots = [];
    if (dateString && vendorAvailability?.businessHours) {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      
      let dayHours = vendorAvailability.businessHours.find(bh => bh.DayOfWeek === dayOfWeek);
      if (!dayHours && dayOfWeek === 0) {
        dayHours = vendorAvailability.businessHours.find(bh => bh.DayOfWeek === 7);
      }
      
      if (dayHours && dayHours.IsAvailable) {
        const parseTime = (timeStr) => {
          if (!timeStr) return null;
          if (typeof timeStr !== 'string') {
            if (timeStr instanceof Date) return { hour: timeStr.getHours(), minute: timeStr.getMinutes() };
            if (typeof timeStr === 'object' && timeStr.hour !== undefined) return timeStr;
            timeStr = String(timeStr);
          }
          if (timeStr.includes('T')) {
            const d = new Date(timeStr);
            return { hour: d.getHours(), minute: d.getMinutes() };
          }
          const parts = timeStr.split(':');
          return { hour: parseInt(parts[0]), minute: parseInt(parts[1] || 0) };
        };
        
        const openTime = parseTime(dayHours.OpenTime);
        const closeTime = parseTime(dayHours.CloseTime);
        
        if (openTime && closeTime && !isNaN(openTime.hour) && !isNaN(closeTime.hour)) {
          let currentHour = openTime.hour;
          let currentMinute = openTime.minute || 0;
          const closeMinutes = closeTime.hour * 60 + (closeTime.minute || 0);
          
          while (currentHour * 60 + currentMinute <= closeMinutes) {
            newSlots.push(`${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`);
            currentMinute += 30;
            if (currentMinute >= 60) { currentMinute = 0; currentHour++; }
          }
        }
      }
    }
    
    setAvailableTimeSlots(newSlots);
    
    // Set date only - don't auto-select times, let user choose
    setBookingData(prev => ({
      ...prev,
      eventDate: dateString,
      eventTime: '',
      eventEndTime: ''
    }));
  };

  // Handle time change from calendar
  const handleTimeChange = (type, value) => {
    if (type === 'start') {
      setBookingData(prev => ({
        ...prev,
        eventTime: value
      }));
    } else {
      setBookingData(prev => ({
        ...prev,
        eventEndTime: value
      }));
    }
  };

  // Generate available time slots based on business hours for selected date
  const updateAvailableTimeSlots = useCallback((dateString) => {
    if (!dateString) {
      setAvailableTimeSlots([]);
      return;
    }

    if (!vendorAvailability) {
      setAvailableTimeSlots([]);
      return;
    }

    if (!vendorAvailability.businessHours) {
      setAvailableTimeSlots([]);
      return;
    }

    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday (JavaScript standard)
    
    // Try to find business hours - check if database uses 0-6 or 1-7
    let dayHours = vendorAvailability.businessHours.find(bh => bh.DayOfWeek === dayOfWeek);
    
    // If not found and it's Sunday (0), try looking for day 7 (some databases use 1-7 where Sunday=7)
    if (!dayHours && dayOfWeek === 0) {
      dayHours = vendorAvailability.businessHours.find(bh => bh.DayOfWeek === 7);
    }
    
    if (!dayHours) {
      setAvailableTimeSlots([]);
      return;
    }

    if (!dayHours.IsAvailable) {
      setAvailableTimeSlots([]);
      return;
    }

    // Parse OpenTime and CloseTime (can be ISO timestamp or time string)
    const parseTime = (timeStr) => {
      if (!timeStr) return null;
      
      // Ensure timeStr is a string
      if (typeof timeStr !== 'string') {
        // If it's a Date object, extract time
        if (timeStr instanceof Date) {
          return {
            hour: timeStr.getHours(),
            minute: timeStr.getMinutes()
          };
        }
        // If it's an object with hour/minute, return as-is
        if (typeof timeStr === 'object' && timeStr.hour !== undefined) {
          return timeStr;
        }
        // Try to convert to string
        timeStr = String(timeStr);
      }
      
      // Check if it's an ISO timestamp (contains 'T')
      if (timeStr.includes('T')) {
        const date = new Date(timeStr);
        // Use local time (getHours) instead of UTC to respect timezone
        return {
          hour: date.getHours(),
          minute: date.getMinutes()
        };
      }
      
      // Otherwise parse as time string "HH:MM:SS"
      const parts = timeStr.split(':');
      return {
        hour: parseInt(parts[0]),
        minute: parseInt(parts[1] || 0)
      };
    };

    const openTime = parseTime(dayHours.OpenTime);
    const closeTime = parseTime(dayHours.CloseTime);

    if (!openTime || !closeTime) {
      setAvailableTimeSlots([]);
      return;
    }

    // Validate parsed times before proceeding
    if (isNaN(openTime.hour) || isNaN(closeTime.hour)) {
      setAvailableTimeSlots([]);
      return;
    }

    // Generate 30-minute interval slots (including close time)
    const slots = [];
    let currentHour = openTime.hour;
    let currentMinute = openTime.minute || 0;
    const closeMinutes = closeTime.hour * 60 + (closeTime.minute || 0);

    while (currentHour * 60 + currentMinute <= closeMinutes) {
      const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      slots.push(timeStr);

      currentMinute += 30;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;
      }
    }

    setAvailableTimeSlots(slots);
    return slots;
  }, [vendorAvailability]);

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
      if (!bookingData.eventEndTime) {
        alert('Please select an end time');
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
      // Open profile modal for login instead of redirecting
      setProfileModalOpen(true);
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
    try {
      // Parse date components to avoid timezone issues
      const parts = dateString.split('-');
      if (parts.length !== 3) return dateString;
      const [year, month, day] = parts.map(Number);
      if (isNaN(year) || isNaN(month) || isNaN(day)) return dateString;
      const dateObj = new Date(year, month - 1, day);
      if (isNaN(dateObj.getTime())) return dateString;
      return dateObj.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  // Get timezone info from vendor data
  const getVendorTimezoneInfo = () => {
    const profile = vendorData?.profile || {};
    const timezone = profile.TimeZone || 'America/Toronto';
    const abbr = profile.TimeZoneAbbr;
    
    // If we have the abbreviation from the database, use it
    if (abbr) {
      return { timezone, abbr };
    }
    
    // Otherwise, try to get it dynamically
    try {
      const date = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'short'
      });
      const parts = formatter.formatToParts(date);
      const tzPart = parts.find(part => part.type === 'timeZoneName');
      return { 
        timezone, 
        abbr: tzPart ? tzPart.value : 'EST' 
      };
    } catch (error) {
      return { timezone, abbr: 'EST' };
    }
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
  const profilePic = profile.LogoURL || profile.FeaturedImageURL || profile.ProfilePictureURL || profile.ProfilePicture || '';

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', width: '100%' }}>
      {/* Header */}
      <Header 
        onSearch={() => {}} 
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

      {/* Main Content */}
      <div className="booking-container">
        {/* Left Side - Booking Form */}
        <div className="booking-form-section">
          <div className="booking-form-wrapper">
            {/* Back Button - Above Breadcrumb */}
            <button 
              className="back-button" 
              onClick={goBackToVendor}
              style={{ 
                marginBottom: '1rem',
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

            {/* Breadcrumb Navigation */}
            {vendorData && (
              <Breadcrumb items={[
                vendorData.profile?.City || 'City',
                vendorData.categories?.[0]?.CategoryName || vendorData.profile?.CategoryName || vendorData.profile?.PrimaryCategory || vendorData.profile?.Category || 'Services',
                vendorData.profile?.BusinessName || 'Vendor Name',
                'Booking'
              ]} />
            )}

            
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

                {/* Event Date with Calendar Popup */}
                <div className="form-group" style={{ marginBottom: '1.5rem', position: 'relative' }}>
                  <label htmlFor="event-date" className="form-label" style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#222' }}>
                    Event Date <span className="required-asterisk" style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div 
                    onClick={() => setShowCalendar(true)}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem 1rem', 
                      border: '1px solid #ddd', 
                      borderRadius: '8px', 
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      minHeight: '48px'
                    }}
                  >
                    <i className="fas fa-calendar" style={{ color: '#717171' }}></i>
                    <span style={{ color: bookingData.eventDate ? '#222' : '#999' }}>
                      {bookingData.eventDate ? formatDate(bookingData.eventDate) : 'Select date'}
                    </span>
                  </div>
                  
                  {showCalendar && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, marginTop: '0.5rem' }}>
                      <BookingCalendar
                        selectedDate={bookingData.eventDate}
                        onDateSelect={(date) => {
                          handleCalendarDateSelect(date);
                          setShowCalendar(false);
                        }}
                        onClose={() => setShowCalendar(false)}
                        vendorAvailability={vendorAvailability}
                      />
                    </div>
                  )}
                </div>

                {/* Timezone Note */}
                {bookingData.eventDate && vendorData && (() => {
                  const tzInfo = getVendorTimezoneInfo();
                  return (
                    <div style={{ 
                      marginBottom: '1rem', 
                      padding: '0.75rem 1rem', 
                      backgroundColor: '#f0f9ff', 
                      border: '1px solid #bfdbfe',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                      color: '#1e40af'
                    }}>
                      <i className="fas fa-info-circle"></i>
                      <span>
                        All times are shown in the vendor's timezone: <strong>{tzInfo.timezone} ({tzInfo.abbr})</strong>
                      </span>
                    </div>
                  );
                })()}

                {/* Start Time and End Time in Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  {/* Start Time */}
                  <div className="form-group">
                    <label htmlFor="event-time" className="form-label" style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#222' }}>
                      Start Time <span className="required-asterisk" style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      id="event-time"
                      className="form-input"
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem 1rem', 
                        border: '1px solid #ddd', 
                        borderRadius: '8px', 
                        fontSize: '1rem',
                        display: 'block',
                        backgroundColor: bookingData.eventDate ? 'white' : '#f5f5f5',
                        cursor: bookingData.eventDate ? 'pointer' : 'not-allowed'
                      }}
                      value={bookingData.eventTime}
                      onChange={handleInputChange}
                      disabled={!bookingData.eventDate}
                      required
                    >
                      {bookingData.eventDate ? (
                        <>
                          <option value="">Select a time</option>
                          {availableTimeSlots.length > 0 ? (
                            availableTimeSlots.map((time) => {
                              const [hour, min] = time.split(':').map(Number);
                              const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                              const period = hour < 12 ? 'AM' : 'PM';
                              return (
                                <option key={time} value={time}>
                                  {displayHour}:{min.toString().padStart(2, '0')} {period}
                                </option>
                              );
                            })
                          ) : (
                            // Fallback: Show default business hours (9 AM - 5 PM) if no slots generated
                            Array.from({ length: 17 }, (_, i) => {
                              const totalMinutes = 540 + (i * 30); // Start at 9:00 AM (540 minutes)
                              const hour = Math.floor(totalMinutes / 60);
                              const min = totalMinutes % 60;
                              if (hour >= 17) return null; // Stop at 5 PM
                              const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                              const period = hour < 12 ? 'AM' : 'PM';
                              const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
                              return (
                                <option key={timeStr} value={timeStr}>
                                  {displayHour}:{min.toString().padStart(2, '0')} {period}
                                </option>
                              );
                            }).filter(Boolean)
                          )}
                        </>
                      ) : (
                        <option value="">Select a date first</option>
                      )}
                    </select>
                  </div>

                  {/* End Time */}
                  <div className="form-group">
                    <label htmlFor="event-end-time" className="form-label" style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#222' }}>
                      End Time <span className="required-asterisk" style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      id="event-end-time"
                      className="form-input"
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem 1rem', 
                        border: '1px solid #ddd', 
                        borderRadius: '8px', 
                        fontSize: '1rem',
                        display: 'block',
                        backgroundColor: bookingData.eventDate ? 'white' : '#f5f5f5',
                        cursor: bookingData.eventDate ? 'pointer' : 'not-allowed'
                      }}
                      value={bookingData.eventEndTime}
                      onChange={handleInputChange}
                      disabled={!bookingData.eventDate}
                      required
                    >
                      {bookingData.eventDate ? (
                        <>
                          <option value="">Select a time</option>
                          {(availableTimeSlots.length > 0 ? availableTimeSlots : 
                            Array.from({ length: 17 }, (_, i) => {
                              const totalMinutes = 540 + (i * 30);
                              const hour = Math.floor(totalMinutes / 60);
                              const min = totalMinutes % 60;
                              if (hour >= 17) return null;
                              return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
                            }).filter(Boolean)
                          )
                            .filter((time) => {
                              if (!bookingData.eventTime) return true;
                              const [startHour, startMin] = bookingData.eventTime.split(':').map(Number);
                              const [timeHour, timeMin] = time.split(':').map(Number);
                              const startMinutes = startHour * 60 + startMin;
                              const timeMinutes = timeHour * 60 + timeMin;
                              return timeMinutes > startMinutes;
                            })
                            .map((time) => {
                              const [hour, min] = time.split(':').map(Number);
                              const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                              const period = hour < 12 ? 'AM' : 'PM';
                              return (
                                <option key={time} value={time}>
                                  {displayHour}:{min.toString().padStart(2, '0')} {period}
                                </option>
                              );
                            })}
                        </>
                      ) : (
                        <option value="">Select a date first</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Number of Guests */}
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="attendee-count" className="form-label" style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#222' }}>
                    Number of Guests <span className="required-asterisk" style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    id="attendee-count"
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
                    placeholder="50"
                    min="1"
                    value={bookingData.attendeeCount}
                    onChange={handleInputChange}
                    required
                  />
                </div>


                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="event-location" className="form-label" style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#222' }}>
                    Event Location <span className="required-asterisk" style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    ref={locationInputRef}
                    type="text"
                    id="event-location"
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
                    placeholder="Enter address or city (Canada only)"
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
                    <SkeletonLoader variant="service-card" count={3} />
                  ) : services.length === 0 ? (
                    <div className="no-services" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                      <i className="fas fa-info-circle" style={{ fontSize: '3rem', color: '#d1d5db', marginBottom: '1rem' }}></i>
                      <p style={{ color: '#6b7280', fontSize: '1rem' }}>This vendor hasn't listed specific services yet. You can still send a booking request with your requirements.</p>
                    </div>
                  ) : (
                    services.map((service) => {
                      const serviceId = service.PredefinedServiceID || service.VendorSelectedServiceID;
                      const isSelected = selectedServices.some(s => s.id === serviceId);
                      
                      return (
                        <ServiceCard
                          key={serviceId}
                          service={service}
                          variant="selectable"
                          isSelected={isSelected}
                          onSelect={() => toggleServiceSelection(service)}
                        />
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
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  overflow: 'hidden', 
                  border: '2px solid #DDDDDD',
                  background: '#f7f7f7',
                  flexShrink: 0
                }}>
                  <img src={profilePic} alt={businessName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div className="vendor-image-placeholder">
                  <i className="fas fa-store"></i>
                </div>
              )}
              <div className="vendor-details">
                <h3 className="vendor-name">{businessName}</h3>
                {category && <p className="vendor-category">{category}</p>}
                {rating > 0 ? (
                  <div className="vendor-rating">
                    <i className="fas fa-star"></i>
                    <span>{rating.toFixed(1)}</span>
                    {reviewCount > 0 && (
                      <span className="review-count">({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#717171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fas fa-briefcase" style={{ color: '#5e72e4' }}></i>
                    <span>Verified Vendor</span>
                  </div>
                )}
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

              {(bookingData.eventTime || bookingData.eventEndTime) && (
                <div className="summary-item" id="summary-time">
                  <i className="fas fa-clock"></i>
                  <div>
                    <div className="summary-label">Time</div>
                    <div className="summary-value">
                      {bookingData.eventTime ? formatTime(bookingData.eventTime) : ''}
                      {bookingData.eventTime && bookingData.eventEndTime && ' - '}
                      {bookingData.eventEndTime ? formatTime(bookingData.eventEndTime) : ''}
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
            <div className="success-icon" style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <i className="fas fa-check" style={{ fontSize: '28px', color: 'white' }}></i>
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
      
      {/* Dashboard Modal */}
      <DashboardModal 
        isOpen={dashboardModalOpen} 
        onClose={() => setDashboardModalOpen(false)}
        initialSection={dashboardSection}
      />
      
      {/* Messaging Widget */}
      <MessagingWidget />
    </div>
  );
}

export default BookingPage;
