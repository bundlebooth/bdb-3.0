import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL, GOOGLE_MAPS_API_KEY } from '../config';
import './EnhancedSearchBar.css';
import Calendar from './Calendar';
import './Calendar.css';

const EnhancedSearchBar = ({ onSearch, isScrolled }) => {
  const [location, setLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [startTime, setStartTime] = useState('11:00');
  const [endTime, setEndTime] = useState('17:00');

  const locationRef = useRef(null);
  const dateRef = useRef(null);
  const calendarRef = useRef(null);
  const searchBarRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      initializeGooglePlaces();
    } else {
      // Load Google Maps API if not already loaded
      loadGoogleMapsAPI();
    }
  }, []);

  // Reinitialize Google Places when expanded, hide when collapsed
  useEffect(() => {
    if (isExpanded && window.google && window.google.maps && window.google.maps.places) {
      setTimeout(() => {
        initializeGooglePlaces();
      }, 100);
    } else if (!isExpanded) {
      // Hide Google Maps dropdown when collapsed
      const pacContainers = document.querySelectorAll('.pac-container');
      pacContainers.forEach(container => {
        container.style.display = 'none';
      });
    }
  }, [isExpanded]);

  // Handle click outside to close dropdowns and collapse search bar
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is on Google Maps dropdown
      const isPacContainer = event.target.closest('.pac-container');
      if (isPacContainer) return;

      if (searchBarRef.current && !searchBarRef.current.contains(event.target)) {
        setIsExpanded(false);
        setShowLocationDropdown(false);
        setShowCalendar(false);
        
        // Clear Google Maps dropdown
        const pacContainers = document.querySelectorAll('.pac-container');
        pacContainers.forEach(container => {
          container.style.display = 'none';
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle scroll to collapse search bar when expanded
  useEffect(() => {
    const handleScroll = () => {
      if (isExpanded) {
        setIsExpanded(false);
        setShowLocationDropdown(false);
        setShowCalendar(false);
        
        // Clear Google Maps dropdown
        const pacContainers = document.querySelectorAll('.pac-container');
        pacContainers.forEach(container => {
          container.style.display = 'none';
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isExpanded]);

  const loadGoogleMapsAPI = () => {
    if (window.google) return;
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = initializeGooglePlaces;
    document.head.appendChild(script);
  };

  const initializeGooglePlaces = () => {
    if (!locationRef.current) return;
    
    const input = locationRef.current.querySelector('input');
    if (!input) return;

    // Clear existing autocomplete if it exists
    if (autocompleteRef.current) {
      window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
    }

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ['(cities)'],
      componentRestrictions: { country: 'ca' } // Restrict to Canada
    });

    autocompleteRef.current = autocomplete;

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        setLocation(place.formatted_address);
        setUserLocation({
          latitude: place.geometry?.location?.lat(),
          longitude: place.geometry?.location?.lng(),
          city: place.formatted_address
        });
        // Collapse search bar after selection
        setTimeout(() => {
          setIsExpanded(false);
        }, 300);
      }
    });
  };

  // Get user's current location
  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Use Google Geocoding API if available, otherwise fallback
      if (window.google && window.google.maps) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode(
          { location: { lat: latitude, lng: longitude } },
          (results, status) => {
            if (status === 'OK' && results[0]) {
              const city = results[0].formatted_address;
              setLocation(city);
              setUserLocation({ latitude, longitude, city });
            } else {
              fallbackGeocoding(latitude, longitude);
            }
            setLoadingLocation(false);
          }
        );
      } else {
        fallbackGeocoding(latitude, longitude);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Unable to get your location. Please select a city manually.');
      setLoadingLocation(false);
    }
  };

  const fallbackGeocoding = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      
      if (response.ok) {
        const data = await response.json();
        const city = data.city || data.locality;
        const province = data.principalSubdivision;
        
        if (city && province) {
          const locationString = `${city}, ${province}`;
          setLocation(locationString);
          setUserLocation({ latitude, longitude, city: locationString });
        }
      }
    } catch (error) {
      console.error('Fallback geocoding error:', error);
    }
  };

  // Check vendor availability for selected date and time
  const checkVendorAvailability = async (date, cityName, startTime, endTime) => {
    try {
      const response = await fetch(`${API_BASE_URL}/vendors/check-availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: date,
          city: cityName,
          dayOfWeek: new Date(date).getDay(),
          startTime: startTime,
          endTime: endTime
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.availableVendors || [];
      }
    } catch (error) {
      console.error('Error checking availability:', error);
    }
    return [];
  };

  const handleSearch = async () => {
    if (!location && !selectedDate) {
      alert('Please select a location or date to search');
      return;
    }

    const searchParams = {
      location: location,
      date: selectedDate,
      startTime: startTime,
      endTime: endTime,
      userLocation: userLocation
    };

    // If date is selected, check availability
    if (selectedDate && location) {
      const cityName = location.split(',')[0].trim();
      const availableVendors = await checkVendorAvailability(selectedDate, cityName, startTime, endTime);
      searchParams.availableVendors = availableVendors;
    }

    console.log('Search params:', searchParams);

    if (onSearch) {
      onSearch(searchParams);
    }
    
    // Collapse search bar after search
    setIsExpanded(false);
    setShowCalendar(false);
  };

  const handleLocationSelect = (city) => {
    setLocation(city);
    setShowLocationDropdown(false);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setShowDatePicker(false);
  };

  const handleCalendarDateSelect = (date) => {
    setSelectedDate(date);
    // Don't close calendar - let user select times
  };

  const handleTimeChange = (type, value) => {
    if (type === 'start') {
      setStartTime(value);
    } else {
      setEndTime(value);
    }
  };

  const handleClearLocation = (e) => {
    e.stopPropagation();
    setLocation('');
    setUserLocation(null);
  };

  const handleClearDate = (e) => {
    e.stopPropagation();
    setSelectedDate('');
    setStartTime('11:00');
    setEndTime('17:00');
  };

  const handleDateFieldClick = (e) => {
    e.stopPropagation();
    console.log('Date field clicked, showing calendar');
    setIsExpanded(true);
    setShowCalendar(true);
    setShowLocationDropdown(false);
  };

  const handleLocationFieldClick = (e) => {
    e.stopPropagation();
    setIsExpanded(true);
    setShowLocationDropdown(true);
    setShowCalendar(false);
  };

  const handleSearchBarClick = () => {
    setIsExpanded(true);
  };

  // Format date for display (compact version with year)
  const formatDateDisplay = (dateString) => {
    if (!dateString) return 'When?';
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  // Format location for compact display (show full location)
  const formatLocationDisplay = (locationString) => {
    if (!locationString) return 'Where?';
    return locationString; // Show full location like "Toronto, ON, Canada"
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div 
      className={`enhanced-search-container ${isScrolled ? 'scrolled' : ''} ${isExpanded ? 'expanded' : ''}`}
      ref={searchBarRef}
    >
        <div className="enhanced-search-bar" onClick={handleSearchBarClick}>
        {/* Compact View (default - always show unless expanded) */}
        {!isExpanded ? (
          <div className="compact-view">
            <div className="compact-field compact-location" onClick={handleLocationFieldClick}>
              <span className="compact-value">{formatLocationDisplay(location)}</span>
              {location && (
                <button className="clear-btn" onClick={handleClearLocation} title="Clear location">
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
            <div className="compact-separator">|</div>
            <div className="compact-field compact-date" onClick={handleDateFieldClick}>
              <span className="compact-value">{formatDateDisplay(selectedDate)}</span>
              {selectedDate && (
                <button className="clear-btn" onClick={handleClearDate} title="Clear date">
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
            <button className="search-btn-compact" onClick={handleSearch} title="Search">
              <i className="fas fa-search"></i>
              <span>Search</span>
            </button>
          </div>
        ) : (
          /* Expanded View */
          <div className="expanded-view">
            {/* Location Input */}
            <div className="search-field location-field" ref={locationRef} onClick={handleLocationFieldClick}>
              <div className="field-label">Where?</div>
              <div className="field-input-wrapper">
                <input
                  type="text"
                  placeholder="Search cities in Canada"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                {location && (
                  <button className="clear-field-btn" onClick={handleClearLocation} title="Clear location">
                    <i className="fas fa-times"></i>
                  </button>
                )}
                <button 
                  className="use-location-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    getCurrentLocation();
                  }}
                  disabled={loadingLocation}
                  title="Use my current location"
                >
                  {loadingLocation ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-crosshairs"></i>
                  )}
                </button>
              </div>
            </div>

            <div className="field-separator"></div>

            {/* Date Input */}
            <div className="search-field date-field" ref={dateRef} onClick={handleDateFieldClick}>
              <div className="field-label">When?</div>
              <div className="field-value">
                {formatDateDisplay(selectedDate)}
                {selectedDate && (
                  <button className="clear-field-btn" onClick={handleClearDate} title="Clear date">
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
              
              {showCalendar && isExpanded && (
                <Calendar
                  selectedDate={selectedDate}
                  onDateSelect={handleCalendarDateSelect}
                  onClose={() => setShowCalendar(false)}
                  startTime={startTime}
                  endTime={endTime}
                  onTimeChange={handleTimeChange}
                />
              )}
            </div>

            {/* Search Button */}
            <button className="search-btn" onClick={handleSearch} title="Search">
              <i className="fas fa-search"></i>
              <span className="search-btn-text">Search</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedSearchBar;
