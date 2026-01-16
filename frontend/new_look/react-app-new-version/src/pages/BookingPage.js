import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, GOOGLE_MAPS_API_KEY } from '../config';
import { PageLayout } from '../components/PageWrapper';
import Header from '../components/Header';
import SkeletonLoader from '../components/SkeletonLoader';
import { ServiceCard, PackageCard, PackageServiceTabs, PackageServiceEmpty, PackageServiceList } from '../components/PackageServiceCard';
import UniversalModal, { ConfirmationModal } from '../components/UniversalModal';
import ProfileModal from '../components/ProfileModal';
import SetupIncompleteBanner from '../components/SetupIncompleteBanner';
import MessagingWidget from '../components/MessagingWidget';
import Breadcrumb from '../components/Breadcrumb';
import BookingCalendar from '../components/BookingCalendar';
import SharedDateTimePicker from '../components/SharedDateTimePicker';
import { extractVendorIdFromSlug, parseQueryParams, trackPageView } from '../utils/urlHelpers';
import { getProvinceFromLocation, getTaxInfoForProvince, PROVINCE_TAX_RATES } from '../utils/taxCalculations';
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
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [step2Tab, setStep2Tab] = useState('packages'); // 'packages' or 'services'
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [vendorAvailability, setVendorAvailability] = useState(null);
  const [cancellationPolicy, setCancellationPolicy] = useState(null);
  const [commissionSettings, setCommissionSettings] = useState({ platformFeePercent: 5 });
  const [provinceTaxRates, setProvinceTaxRates] = useState({});
  const [activeTooltip, setActiveTooltip] = useState(null);
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

  // Initialize page and pre-fill data from URL params (from ProfileVendorWidget)
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

    // Pre-fill booking data from URL params (coming from ProfileVendorWidget)
    const searchParams = new URLSearchParams(location.search);
    const prefilledDate = searchParams.get('date');
    const prefilledStartTime = searchParams.get('startTime');
    const prefilledEndTime = searchParams.get('endTime');
    const prefilledPackageId = searchParams.get('packageId');

    if (prefilledDate || prefilledStartTime || prefilledEndTime) {
      setBookingData(prev => ({
        ...prev,
        eventDate: prefilledDate || prev.eventDate,
        eventTime: prefilledStartTime || prev.eventTime,
        eventEndTime: prefilledEndTime || prev.eventEndTime
      }));
    }

    // Store prefilled package ID to select after packages load
    if (prefilledPackageId) {
      sessionStorage.setItem('prefilledPackageId', prefilledPackageId);
    }

    loadVendorData();
    loadVendorAvailability();
    loadCancellationPolicy();
    loadCommissionSettings();
    loadProvinceTaxRates();
  }, [vendorId, navigate, location.search]);

  // Load commission settings from API
  const loadCommissionSettings = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/public/commission-info`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.commissionInfo) {
          setCommissionSettings({
            platformFeePercent: parseFloat(data.commissionInfo.renterProcessingFee) || 5
          });
        }
      }
    } catch (error) {
      console.error('Error loading commission settings:', error);
    }
  }, []);

  // Load province tax rates
  const loadProvinceTaxRates = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/tax-rates`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.provinces) {
          setProvinceTaxRates(data.provinces);
        }
      }
    } catch (error) {
      console.error('Error loading province tax rates:', error);
    }
  }, []);

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

  // Load cancellation policy
  const loadCancellationPolicy = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/vendor/${vendorId}/cancellation-policy`);
      if (response.ok) {
        const data = await response.json();
        setCancellationPolicy(data.policy);
      }
    } catch (error) {
      console.error('Error loading cancellation policy:', error);
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

  // Load vendor packages
  const loadVendorPackages = useCallback(async () => {
    setLoadingPackages(true);
    try {
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorId}/packages`);
      
      if (!response.ok) {
        throw new Error('Failed to load packages');
      }
      
      const data = await response.json();
      setPackages(data.packages || []);
    } catch (error) {
      console.error('Error loading packages:', error);
      setPackages([]);
    } finally {
      setLoadingPackages(false);
    }
  }, [vendorId]);

  // Load packages and services when entering step 2
  useEffect(() => {
    if (currentStep === 2) {
      if (packages.length === 0) loadVendorPackages();
      if (services.length === 0) loadVendorServices();
    }
  }, [currentStep, packages.length, services.length, loadVendorPackages, loadVendorServices]);

  // Auto-select prefilled package after packages load
  useEffect(() => {
    if (packages.length > 0) {
      const prefilledPackageId = sessionStorage.getItem('prefilledPackageId');
      if (prefilledPackageId) {
        const pkg = packages.find(p => p.PackageID === parseInt(prefilledPackageId));
        if (pkg) {
          setSelectedPackage(pkg);
        }
        sessionStorage.removeItem('prefilledPackageId');
      }
    }
  }, [packages]);

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

  // Select package with duration and attendee validation
  const selectPackage = (pkg) => {
    if (selectedPackage?.PackageID === pkg.PackageID) {
      setSelectedPackage(null); // Deselect if already selected
    } else {
      // Check if package duration fits in time slot
      const pkgDuration = pkg.DurationMinutes || pkg.Duration || pkg.duration || null;
      const durationCheck = checkDurationFits(pkgDuration);
      
      if (!durationCheck.fits) {
        setDurationWarning({
          type: 'package',
          name: pkg.PackageName || pkg.name,
          itemDuration: durationCheck.itemDuration,
          slotDuration: durationCheck.slotDuration
        });
        return;
      }
      
      // Check attendee limits for packages with per_attendee pricing
      const attendeeCheck = checkAttendeeFits(pkg);
      if (!attendeeCheck.fits) {
        setAttendeeWarning({
          type: 'package',
          name: pkg.PackageName || pkg.name,
          min: attendeeCheck.min,
          max: attendeeCheck.max,
          current: attendeeCheck.current
        });
        return;
      }
      
      setSelectedPackage(pkg);
    }
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
      // Validate attendee count against selected package/services min/max
      const attendees = parseInt(bookingData.attendeeCount) || 0;
      
      // Check package attendee limits (for any package with min/max set, regardless of pricing model)
      if (selectedPackage) {
        const minAttendees = selectedPackage.MinAttendees || selectedPackage.minAttendees || selectedPackage.MinimumAttendees || selectedPackage.minimumAttendees;
        const maxAttendees = selectedPackage.MaxAttendees || selectedPackage.maxAttendees || selectedPackage.MaximumAttendees || selectedPackage.maximumAttendees;
        const packageName = selectedPackage.PackageName || selectedPackage.name || 'This package';
        
        if (minAttendees && attendees < parseInt(minAttendees)) {
          alert(`"${packageName}" requires at least ${minAttendees} guests. You entered ${attendees} guests.`);
          return false;
        }
        if (maxAttendees && attendees > parseInt(maxAttendees)) {
          alert(`"${packageName}" allows a maximum of ${maxAttendees} guests. You entered ${attendees} guests.`);
          return false;
        }
      }
      
      // Check selected services attendee limits (only for per_attendee pricing model)
      for (const service of selectedServices) {
        const pricingModel = service.PricingModel || service.pricingModel;
        if (pricingModel === 'per_attendee' || pricingModel === 'per_person') {
          const minAttendees = service.MinAttendees || service.minAttendees || service.MinimumAttendees || service.minimumAttendees;
          const maxAttendees = service.MaxAttendees || service.maxAttendees || service.MaximumAttendees || service.maximumAttendees;
          const serviceName = service.ServiceName || service.name || service.serviceName;
          
          if (minAttendees && attendees < parseInt(minAttendees)) {
            alert(`"${serviceName}" requires at least ${minAttendees} guests. You entered ${attendees} guests.`);
            return false;
          }
          if (maxAttendees && attendees > parseInt(maxAttendees)) {
            alert(`"${serviceName}" allows a maximum of ${maxAttendees} guests. You entered ${attendees} guests.`);
            return false;
          }
        }
      }
      
      if (!selectedPackage && selectedServices.length === 0) {
        const proceed = window.confirm('You haven\'t selected a package or services. Do you want to continue anyway?');
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
      // Calculate total hours for hourly services
      let totalHours = 0;
      if (bookingData.eventTime && bookingData.eventEndTime) {
        const start = new Date(`2000-01-01T${bookingData.eventTime}`);
        const end = new Date(`2000-01-01T${bookingData.eventEndTime}`);
        const diffMs = end - start;
        totalHours = diffMs > 0 ? diffMs / (1000 * 60 * 60) : 0;
      }

      // Calculate services subtotal (with hourly multiplier if applicable)
      const servicesSubtotal = selectedServices.reduce((sum, s) => {
        const price = parseFloat(s.VendorPrice || s.Price || s.BasePrice || s.baseRate || s.fixedPrice || s.price || 0);
        const pricingModel = s.PricingModel || s.pricingModel || '';
        const isHourly = pricingModel === 'time_based' || pricingModel === 'hourly';
        return sum + (isHourly && totalHours > 0 ? price * totalHours : price);
      }, 0);

      // Calculate package price
      const packagePriceCalc = selectedPackage 
        ? (selectedPackage.SalePrice && parseFloat(selectedPackage.SalePrice) < parseFloat(selectedPackage.Price) 
            ? parseFloat(selectedPackage.SalePrice) 
            : parseFloat(selectedPackage.Price || selectedPackage.price || 0))
        : 0;

      // Subtotal before fees
      const subtotal = servicesSubtotal + packagePriceCalc;

      // Add services with calculated prices to the request
      const servicesWithPrices = selectedServices.map(s => {
        const price = parseFloat(s.VendorPrice || s.Price || s.BasePrice || s.baseRate || s.fixedPrice || s.price || 0);
        const pricingModel = s.PricingModel || s.pricingModel || '';
        const isHourly = pricingModel === 'time_based' || pricingModel === 'hourly';
        const calculatedPrice = isHourly && totalHours > 0 ? price * totalHours : price;
        return {
          ...s,
          calculatedPrice,
          hours: isHourly ? totalHours : null
        };
      });

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
        services: servicesWithPrices,
        packageId: selectedPackage?.PackageID || null,
        packageName: selectedPackage?.PackageName || null,
        packagePrice: packagePriceCalc || null,
        budget: subtotal, // Send the calculated subtotal as budget
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

  // Calculate selected time slot duration in minutes
  const getSelectedTimeSlotDuration = () => {
    if (!bookingData.eventTime || !bookingData.eventEndTime) return null;
    
    const parseTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const startMinutes = parseTime(bookingData.eventTime);
    const endMinutes = parseTime(bookingData.eventEndTime);
    
    // Handle overnight bookings
    if (endMinutes < startMinutes) {
      return (24 * 60 - startMinutes) + endMinutes;
    }
    return endMinutes - startMinutes;
  };

  // Check if a service/package duration fits in the selected time slot
  const checkDurationFits = (itemDuration) => {
    const slotDuration = getSelectedTimeSlotDuration();
    if (!slotDuration || !itemDuration) return { fits: true, slotDuration: null, itemDuration: null };
    return { 
      fits: itemDuration <= slotDuration, 
      slotDuration, 
      itemDuration 
    };
  };

  // State for duration warning modal
  const [durationWarning, setDurationWarning] = useState(null);
  
  // State for attendee warning modal
  const [attendeeWarning, setAttendeeWarning] = useState(null);
  
  // Check if attendee count fits service/package limits
  const checkAttendeeFits = (item) => {
    const attendees = parseInt(bookingData.attendeeCount) || 0;
    // Check both PricingModel (services) and PriceType (packages)
    const pricingModel = item.PricingModel || item.pricingModel || item.PriceType || item.priceType;
    
    // Only check for per_attendee pricing model
    if (pricingModel !== 'per_attendee' && pricingModel !== 'per_person') {
      return { fits: true };
    }
    
    const minAttendees = item.MinAttendees || item.minAttendees || item.MinimumAttendees || item.minimumAttendees;
    const maxAttendees = item.MaxAttendees || item.maxAttendees || item.MaximumAttendees || item.maximumAttendees;
    
    if (minAttendees && attendees < parseInt(minAttendees)) {
      return { fits: false, min: minAttendees, max: maxAttendees, current: attendees, reason: 'below_min' };
    }
    if (maxAttendees && attendees > parseInt(maxAttendees)) {
      return { fits: false, min: minAttendees, max: maxAttendees, current: attendees, reason: 'above_max' };
    }
    return { fits: true };
  };

  const profile = vendorData?.profile || {};
  const businessName = profile.BusinessName || profile.Name || 'Vendor';
  const category = vendorData?.categories?.[0]?.CategoryName || vendorData?.categories?.[0]?.Category || '';
  const rating = profile.AverageRating || profile.Rating || 0;
  const reviewCount = profile.ReviewCount || profile.TotalReviews || 0;
  const profilePic = profile.LogoURL || profile.FeaturedImageURL || profile.ProfilePictureURL || profile.ProfilePicture || '';

  return (
    <PageLayout variant="fullWidth" pageClassName="booking-page-layout">
      {/* Header */}
      <Header 
        onSearch={() => {}} 
        onProfileClick={() => {
          if (currentUser) {
            navigate('/dashboard');
          } else {
            setProfileModalOpen(true);
          }
        }} 
        onWishlistClick={() => {
          if (currentUser) {
            navigate('/dashboard?section=favorites');
          } else {
            setProfileModalOpen(true);
          }
        }} 
        onChatClick={() => {
          if (currentUser) {
            const section = currentUser.isVendor ? 'vendor-messages' : 'messages';
            navigate(`/dashboard?section=${section}`);
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

                {/* Event Date & Time - Shared Calendar Component */}
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#222' }}>
                    Event Date & Time <span className="required-asterisk" style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <SharedDateTimePicker
                    vendorId={vendorId}
                    businessHours={vendorData?.businessHours || vendorAvailability?.businessHours || []}
                    timezone={vendorData?.profile?.Timezone || null}
                    selectedDate={bookingData.eventDate}
                    selectedStartTime={bookingData.eventTime}
                    selectedEndTime={bookingData.eventEndTime}
                    onDateChange={(date) => {
                      setBookingData(prev => ({ ...prev, eventDate: date, eventTime: '', eventEndTime: '' }));
                    }}
                    onStartTimeChange={(time) => {
                      setBookingData(prev => ({ ...prev, eventTime: time || '', eventEndTime: '' }));
                    }}
                    onEndTimeChange={(time) => {
                      setBookingData(prev => ({ ...prev, eventEndTime: time || '' }));
                    }}
                    showSaveDeleteButtons={false}
                    inline={true}
                  />
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

            {/* Step 2: Package/Service Selection */}
            {currentStep === 2 && (
              <div className="booking-step" id="step-2" style={{ display: 'block', width: '100%', padding: '20px', backgroundColor: '#ffffff' }}>
                <div className="step-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="step-number-circle" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#222', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600' }}>2</div>
                  <h2 className="step-title" style={{ fontSize: '1.5rem', fontWeight: '600', margin: '0', color: '#222' }}>Choose a Package or Service</h2>
                </div>
                <p className="step-description" style={{ color: '#717171', marginBottom: '1.5rem' }}>Select a package or individual service you'd like to book</p>
                
                {/* Tab Toggle */}
                <PackageServiceTabs 
                  activeTab={step2Tab}
                  onTabChange={setStep2Tab}
                  packagesCount={packages.length}
                  servicesCount={services.length}
                />
                
                {/* Packages Tab */}
                {step2Tab === 'packages' && (
                <PackageServiceList>
                  {loadingPackages ? (
                    <SkeletonLoader variant="service-card" count={3} />
                  ) : packages.length === 0 ? (
                    <PackageServiceEmpty type="packages" message="No packages available. Check the Services tab or send a custom request." />
                  ) : (
                    packages.map((pkg) => (
                      <PackageCard
                        key={pkg.PackageID}
                        pkg={pkg}
                        isSelected={selectedPackage?.PackageID === pkg.PackageID}
                        onClick={() => selectPackage(pkg)}
                        selectable={true}
                      />
                    ))
                  )}
                </PackageServiceList>
                )}
                
                {/* Services Tab */}
                {step2Tab === 'services' && (
                <PackageServiceList>
                  {loadingServices ? (
                    <SkeletonLoader variant="service-card" count={3} />
                  ) : services.length === 0 ? (
                    <PackageServiceEmpty type="services" message="No individual services available. Check the Packages tab or send a custom request." />
                  ) : (
                    services.map((service, index) => {
                      // Use multiple fields to create a unique identifier
                      const serviceId = service.VendorServiceID || service.ServiceID || service.id || `service-${index}`;
                      const serviceName = service.ServiceName || service.name || '';
                      const serviceDuration = service.DurationMinutes || service.VendorDurationMinutes || service.baseDuration || service.vendorDuration || null;
                      
                      // Check selection by both ID and name to ensure uniqueness
                      const isSelected = selectedServices.some(s => {
                        const sId = s.VendorServiceID || s.ServiceID || s.id;
                        const sName = s.ServiceName || s.name || '';
                        return sId === serviceId || (sName && sName === serviceName);
                      });
                      
                      // Check if duration fits in time slot
                      const durationCheck = checkDurationFits(serviceDuration);
                      
                      return (
                        <ServiceCard
                          key={`${serviceId}-${serviceName}-${index}`}
                          service={service}
                          isSelected={isSelected}
                          onClick={() => {
                            if (isSelected) {
                              // Allow deselection
                              setSelectedServices(selectedServices.filter(s => {
                                const sId = s.VendorServiceID || s.ServiceID || s.id;
                                const sName = s.ServiceName || s.name || '';
                                return sId !== serviceId && sName !== serviceName;
                              }));
                            } else {
                              // Check duration before selecting
                              if (!durationCheck.fits) {
                                setDurationWarning({
                                  type: 'service',
                                  name: serviceName,
                                  itemDuration: durationCheck.itemDuration,
                                  slotDuration: durationCheck.slotDuration
                                });
                              } else {
                                // Check attendee limits for per_attendee pricing
                                const attendeeCheck = checkAttendeeFits(service);
                                if (!attendeeCheck.fits) {
                                  setAttendeeWarning({
                                    type: 'service',
                                    name: serviceName,
                                    min: attendeeCheck.min,
                                    max: attendeeCheck.max,
                                    current: attendeeCheck.current,
                                    reason: attendeeCheck.reason
                                  });
                                } else {
                                  setSelectedServices([...selectedServices, service]);
                                }
                              }
                            }
                          }}
                          selectable={true}
                        />
                      );
                    })
                  )}
                </PackageServiceList>
                )}
                
                
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
                  <h3 className="review-subtitle">Selected Package</h3>
                  <div id="review-package" className="review-services">
                    {selectedPackage ? (
                      <div style={{ 
                        padding: '1rem', 
                        background: '#f9fafb', 
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <i className="fas fa-check-circle" style={{ color: '#22c55e' }}></i>
                          <span style={{ fontWeight: 600, color: '#222' }}>{selectedPackage.PackageName}</span>
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#222', marginBottom: '0.5rem' }}>
                          ${selectedPackage.SalePrice && parseFloat(selectedPackage.SalePrice) < parseFloat(selectedPackage.Price) 
                            ? parseFloat(selectedPackage.SalePrice).toFixed(0) 
                            : parseFloat(selectedPackage.Price).toFixed(0)}
                          <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#6b7280', marginLeft: '0.25rem' }}>
                            / {selectedPackage.PriceType === 'per_person' ? 'person' : 'package'}
                          </span>
                        </div>
                        {selectedPackage.IncludedServices && selectedPackage.IncludedServices.length > 0 && (
                          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                            Includes: {selectedPackage.IncludedServices.map(s => s.name || s.ServiceName).join(', ')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-secondary)' }}>No package selected</p>
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

              </div>
            )}

            {/* Navigation Buttons */}
            <div className="form-actions">
              {currentStep > 1 && (
                <button 
                  onClick={previousStep}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#fff',
                    color: '#222',
                    border: '1px solid #222',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  Back
                </button>
              )}
              {currentStep < 3 ? (
                <button 
                  onClick={nextStep}
                  style={{
                    padding: '0.75rem 2rem',
                    background: '#222',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={submitBookingRequest}
                  disabled={submitting}
                  style={{
                    padding: '0.75rem 2rem',
                    background: '#222',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin" style={{ width: '18px', height: '18px', marginRight: '0.5rem' }} viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
                      </svg>
                      Sending...
                    </>
                  ) : 'Send Request'}
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

            {/* Giggster-style Date/Time Display */}
            {(bookingData.eventDate || bookingData.eventTime) && (
              <div style={{ padding: '16px 0' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {bookingData.eventDate && (
                    <span style={{ fontSize: '0.95rem', color: '#222', fontWeight: 500 }}>
                      {formatDate(bookingData.eventDate)}
                    </span>
                  )}
                  {bookingData.eventTime && bookingData.eventEndTime && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.95rem', color: '#222' }}>{formatTime(bookingData.eventTime)}</span>
                      <span style={{ color: '#9ca3af' }}>→</span>
                      <span style={{ fontSize: '0.95rem', color: '#222' }}>{formatTime(bookingData.eventEndTime)}</span>
                    </div>
                  )}
                </div>
                {bookingData.eventTime && bookingData.eventEndTime && (() => {
                  const start = new Date(`2000-01-01T${bookingData.eventTime}`);
                  const end = new Date(`2000-01-01T${bookingData.eventEndTime}`);
                  const diffMs = end - start;
                  const totalHours = diffMs > 0 ? diffMs / (1000 * 60 * 60) : 0;
                  return totalHours > 0 ? (
                    <div style={{ textAlign: 'right', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                        Total hours: {totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1)}
                      </span>
                    </div>
                  ) : null;
                })()}
                {bookingData.attendeeCount && (
                  <div style={{ marginTop: '8px', fontSize: '0.9rem', color: '#6b7280' }}>
                    <i className="fas fa-users" style={{ marginRight: '6px', fontSize: '0.8rem' }}></i>
                    {bookingData.attendeeCount} guests
                  </div>
                )}
              </div>
            )}

            {/* Giggster-style Price Breakdown - Only show when items selected */}
            {(selectedServices.length > 0 || selectedPackage) && (
              <>
                <div className="summary-divider"></div>
                <div style={{ padding: '16px 0', position: 'relative' }}>
                  {(() => {
                    // Calculate total hours
                    let totalHours = 0;
                    if (bookingData.eventTime && bookingData.eventEndTime) {
                      const start = new Date(`2000-01-01T${bookingData.eventTime}`);
                      const end = new Date(`2000-01-01T${bookingData.eventEndTime}`);
                      const diffMs = end - start;
                      totalHours = diffMs > 0 ? diffMs / (1000 * 60 * 60) : 0;
                    }

                    // Calculate services subtotal (with hourly multiplier if applicable)
                    const servicesSubtotal = selectedServices.reduce((sum, s) => {
                      const price = parseFloat(s.VendorPrice || s.Price || s.BasePrice || s.baseRate || s.fixedPrice || s.price || 0);
                      const pricingModel = s.PricingModel || s.pricingModel || '';
                      const isHourly = pricingModel === 'time_based' || pricingModel === 'hourly';
                      return sum + (isHourly && totalHours > 0 ? price * totalHours : price);
                    }, 0);

                    // Calculate package price
                    const packagePrice = selectedPackage 
                      ? (selectedPackage.SalePrice && parseFloat(selectedPackage.SalePrice) < parseFloat(selectedPackage.Price) 
                          ? parseFloat(selectedPackage.SalePrice) 
                          : parseFloat(selectedPackage.Price || selectedPackage.price || 0))
                      : 0;

                    // Subtotal before fees
                    const subtotal = servicesSubtotal + packagePrice;

                    // Platform Service Fee (from admin console settings)
                    const platformFeePercent = (commissionSettings.platformFeePercent || 5) / 100;
                    const platformFee = subtotal * platformFeePercent;

                    // Get province and tax info from event location using shared utility
                    const eventProvince = getProvinceFromLocation(bookingData.eventLocation);
                    const taxInfo = getTaxInfoForProvince(eventProvince);
                    const taxPercent = taxInfo.rate / 100;
                    const taxableAmount = subtotal + platformFee;
                    const tax = taxableAmount * taxPercent;

                    // Payment Processing Fee (Stripe: 2.9% + $0.30) - calculated on subtotal only
                    const stripePercent = 0.029;
                    const stripeFixed = 0.30;
                    const stripeFee = (subtotal * stripePercent) + stripeFixed;

                    // Total
                    const total = subtotal + platformFee + tax + stripeFee;

                    // Tooltip component
                    const TooltipIcon = ({ id, children }) => (
                      <div style={{ position: 'relative', display: 'inline-flex' }}>
                        <div 
                          onClick={() => setActiveTooltip(activeTooltip === id ? null : id)}
                          onMouseEnter={() => setActiveTooltip(id)}
                          onMouseLeave={() => setActiveTooltip(null)}
                          style={{ 
                            width: '16px', 
                            height: '16px', 
                            borderRadius: '50%', 
                            border: '1px solid #d1d5db',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            background: activeTooltip === id ? '#f3f4f6' : 'transparent'
                          }}
                        >
                          <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>?</span>
                        </div>
                        {activeTooltip === id && (
                          <div style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginBottom: '8px',
                            padding: '12px 14px',
                            background: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            width: '220px',
                            zIndex: 1000,
                            fontSize: '0.85rem',
                            color: '#374151',
                            lineHeight: 1.5
                          }}>
                            {children}
                            <div style={{
                              position: 'absolute',
                              bottom: '-6px',
                              left: '50%',
                              transform: 'translateX(-50%) rotate(45deg)',
                              width: '10px',
                              height: '10px',
                              background: '#fff',
                              borderRight: '1px solid #e5e7eb',
                              borderBottom: '1px solid #e5e7eb'
                            }}></div>
                          </div>
                        )}
                      </div>
                    );

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Package line item */}
                        {selectedPackage && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <span style={{ color: '#222', fontSize: '0.95rem' }}>
                                {selectedPackage.PackageName || selectedPackage.name}
                              </span>
                              {selectedPackage.PriceType === 'per_person' && bookingData.attendeeCount && (
                                <span style={{ color: '#6b7280', fontSize: '0.85rem', marginLeft: '4px' }}>
                                  × {bookingData.attendeeCount}
                                </span>
                              )}
                            </div>
                            <span style={{ color: '#222', fontSize: '0.95rem', fontWeight: 500 }}>
                              ${packagePrice.toFixed(2)}
                            </span>
                          </div>
                        )}

                        {/* Services line items */}
                        {selectedServices.map((s, idx) => {
                          const servicePrice = parseFloat(s.VendorPrice || s.Price || s.BasePrice || s.baseRate || s.fixedPrice || s.price || 0);
                          const pricingModel = s.PricingModel || s.pricingModel || '';
                          const isHourly = pricingModel === 'time_based' || pricingModel === 'hourly';
                          const calculatedPrice = isHourly && totalHours > 0 ? servicePrice * totalHours : servicePrice;
                          
                          return (
                            <div key={s.VendorServiceID || s.ServiceID || s.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <span style={{ color: '#222', fontSize: '0.95rem' }}>
                                  {s.ServiceName || s.name}
                                </span>
                                {isHourly && totalHours > 0 && (
                                  <span style={{ color: '#6b7280', fontSize: '0.85rem', marginLeft: '4px' }}>
                                    (${servicePrice.toFixed(2)} × {totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1)} hrs)
                                  </span>
                                )}
                              </div>
                              <span style={{ color: '#222', fontSize: '0.95rem', fontWeight: 500 }}>
                                ${calculatedPrice.toFixed(2)}
                              </span>
                            </div>
                          );
                        })}

                        {/* Subtotal */}
                        <div style={{ borderTop: '1px solid #e5e7eb', margin: '4px 0', paddingTop: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#222', fontSize: '0.95rem' }}>Subtotal</span>
                            <span style={{ color: '#222', fontSize: '0.95rem', fontWeight: 500 }}>
                              ${subtotal.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Platform Service Fee */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Platform Service Fee</span>
                            <TooltipIcon id="platform-fee">
                              This helps us cover transaction fees and provide support for your booking.
                            </TooltipIcon>
                          </div>
                          <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                            ${platformFee.toFixed(2)}
                          </span>
                        </div>

                        {/* Tax (Province-based) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Tax ({taxInfo.label})</span>
                            <TooltipIcon id="tax-info">
                              Tax is calculated based on the location of your event. {eventProvince ? `Event in ${eventProvince}.` : 'Enter your event location in Step 1 for accurate tax calculation.'}
                            </TooltipIcon>
                          </div>
                          <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                            ${tax.toFixed(2)}
                          </span>
                        </div>

                        {/* Payment Processing Fee */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Payment Processing Fee</span>
                            <TooltipIcon id="processing-fee">
                              This helps us cover transaction fees and provide support for your booking.
                            </TooltipIcon>
                          </div>
                          <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                            ${stripeFee.toFixed(2)}
                          </span>
                        </div>

                        {/* Total */}
                        <div style={{ borderTop: '1px solid #e5e7eb', margin: '4px 0', paddingTop: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#222', fontSize: '1rem', fontWeight: 600 }}>Total</span>
                            <span style={{ color: '#222', fontSize: '1.15rem', fontWeight: 700 }}>
                              ${total.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className="summary-divider"></div>
              </>
            )}

            <div className="info-notice">
              <i className="fas fa-shield-alt"></i>
              <p>This is a free request. You won't be charged until you confirm with the vendor.</p>
            </div>

            {/* Cancellation Policy */}
            {cancellationPolicy && (() => {
              const policyType = cancellationPolicy.PolicyType || 'flexible';
              const policyInfo = {
                flexible: { title: 'Flexible', color: '#28a745', bg: '#d4edda', icon: 'fa-check-circle' },
                moderate: { title: 'Moderate', color: '#856404', bg: '#fff3cd', icon: 'fa-clock' },
                strict: { title: 'Strict', color: '#dc3545', bg: '#f8d7da', icon: 'fa-exclamation-circle' },
                custom: { title: 'Custom', color: '#6c757d', bg: '#e2e3e5', icon: 'fa-cog' }
              };
              const info = policyInfo[policyType] || policyInfo.flexible;
              
              return (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '16px', 
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #fff 100%)',
                  border: '1px solid #e9ecef',
                  borderRadius: '12px'
                }}>
                  {/* Header with badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#222' }}>Cancellation Policy</span>
                    <span style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: info.bg,
                      color: info.color,
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      <i className={`fas ${info.icon}`} style={{ fontSize: '0.7rem' }}></i>
                      {info.title}
                    </span>
                  </div>
                  
                  {/* Policy details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {policyType === 'custom' ? (
                      <>
                        {cancellationPolicy.FullRefundDays > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fas fa-check" style={{ color: '#28a745', fontSize: '0.75rem', width: '16px' }}></i>
                            <span style={{ color: '#484848', fontSize: '0.8rem' }}>
                              Full refund {cancellationPolicy.FullRefundDays}+ days before
                            </span>
                          </div>
                        )}
                        {cancellationPolicy.PartialRefundDays > 0 && cancellationPolicy.PartialRefundPercent > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fas fa-percentage" style={{ color: '#856404', fontSize: '0.75rem', width: '16px' }}></i>
                            <span style={{ color: '#484848', fontSize: '0.8rem' }}>
                              {cancellationPolicy.PartialRefundPercent}% refund {cancellationPolicy.PartialRefundDays}-{cancellationPolicy.FullRefundDays - 1} days before
                            </span>
                          </div>
                        )}
                        {cancellationPolicy.NoRefundDays > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fas fa-times" style={{ color: '#dc3545', fontSize: '0.75rem', width: '16px' }}></i>
                            <span style={{ color: '#484848', fontSize: '0.8rem' }}>
                              No refund within {cancellationPolicy.NoRefundDays} days
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {policyType === 'flexible' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fas fa-check" style={{ color: '#28a745', fontSize: '0.75rem', width: '16px' }}></i>
                            <span style={{ color: '#484848', fontSize: '0.8rem' }}>Full refund if cancelled 24+ hours before</span>
                          </div>
                        )}
                        {policyType === 'moderate' && (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <i className="fas fa-check" style={{ color: '#28a745', fontSize: '0.75rem', width: '16px' }}></i>
                              <span style={{ color: '#484848', fontSize: '0.8rem' }}>Full refund 7+ days before</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <i className="fas fa-percentage" style={{ color: '#856404', fontSize: '0.75rem', width: '16px' }}></i>
                              <span style={{ color: '#484848', fontSize: '0.8rem' }}>50% refund 3-7 days before</span>
                            </div>
                          </>
                        )}
                        {policyType === 'strict' && (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <i className="fas fa-percentage" style={{ color: '#856404', fontSize: '0.75rem', width: '16px' }}></i>
                              <span style={{ color: '#484848', fontSize: '0.8rem' }}>50% refund 14+ days before</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <i className="fas fa-times" style={{ color: '#dc3545', fontSize: '0.75rem', width: '16px' }}></i>
                              <span style={{ color: '#484848', fontSize: '0.8rem' }}>No refund within 14 days</span>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Duration Warning Modal */}
      {durationWarning && (
        <UniversalModal
          isOpen={!!durationWarning}
          onClose={() => setDurationWarning(null)}
          title="Duration Doesn't Fit"
          size="small"
          footerCentered={true}
          primaryAction={{
            label: 'Go to Step 1',
            onClick: () => {
              setDurationWarning(null);
              setCurrentStep(1);
            }
          }}
          secondaryAction={{
            label: 'Choose Another',
            onClick: () => setDurationWarning(null)
          }}
        >
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <i className="fas fa-exclamation-triangle" style={{ fontSize: '28px', color: '#f59e0b' }}></i>
            </div>
            <p style={{ color: '#6b7280', marginBottom: '1rem', lineHeight: 1.6 }}>
              The <strong>{durationWarning.name}</strong> {durationWarning.type} requires <strong>{formatDuration(durationWarning.itemDuration)}</strong>, 
              but your selected time slot is only <strong>{formatDuration(durationWarning.slotDuration)}</strong>.
            </p>
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              Please go back to Step 1 to select a longer time slot, or choose a different {durationWarning.type}.
            </p>
          </div>
        </UniversalModal>
      )}

      {/* Attendee Warning Modal */}
      {attendeeWarning && (
        <UniversalModal
          isOpen={!!attendeeWarning}
          onClose={() => setAttendeeWarning(null)}
          title="Guest Count Doesn't Match"
          size="small"
          footerCentered={true}
          primaryAction={{
            label: 'Go to Step 1',
            onClick: () => {
              setAttendeeWarning(null);
              setCurrentStep(1);
            }
          }}
          secondaryAction={{
            label: 'Choose Another',
            onClick: () => setAttendeeWarning(null)
          }}
        >
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <i className="fas fa-users" style={{ fontSize: '28px', color: '#f59e0b' }}></i>
            </div>
            <p style={{ color: '#6b7280', marginBottom: '1rem', lineHeight: 1.6 }}>
              The <strong>{attendeeWarning.name}</strong> {attendeeWarning.type} requires <strong>{attendeeWarning.min}-{attendeeWarning.max} guests</strong>, 
              but you entered <strong>{attendeeWarning.current} guests</strong>.
            </p>
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              Please go back to Step 1 to update your guest count, or choose a different {attendeeWarning.type}.
            </p>
          </div>
        </UniversalModal>
      )}

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
            <h2 style={{ marginBottom: '0.5rem' }}>Request Sent Successfully!</h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Your booking request has been sent to the vendor.</p>
            
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', marginBottom: '2rem', textAlign: 'left' }}>
              <div style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                What happens next?
              </div>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.6 }}>
                The vendor will review your request and respond within 24 hours. You'll receive a notification when they respond.
              </p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
              <button
                onClick={() => navigate('/dashboard?section=bookings')}
                style={{
                  width: '100%',
                  padding: '0.875rem 1.5rem',
                  background: '#222',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                View My Bookings
              </button>
              <button
                onClick={() => navigate(`/vendor/${vendorId}`)}
                style={{
                  width: '100%',
                  padding: '0.875rem 1.5rem',
                  background: '#fff',
                  color: '#222',
                  border: '1px solid #222',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
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
      
      {/* Messaging Widget */}
      <MessagingWidget />
    </PageLayout>
  );
}

export default BookingPage;
