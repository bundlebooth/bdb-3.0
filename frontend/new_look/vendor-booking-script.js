// ============================================
// VENDOR BOOKING PAGE SCRIPT
// Handles step navigation, form validation, and booking submission
// ============================================

// Configuration
// Use the same API base URL as the main application
const API_BASE_URL = 'https://bdb-3-0-venuevue-api.onrender.com/api';

// State Management
let currentStep = 1;
let vendorData = null;
let selectedServices = [];
let bookingData = {
    eventName: '',
    eventType: '',
    eventDate: '',
    eventTime: '',
    eventEndTime: '',
    attendeeCount: '',
    eventLocation: '',
    specialRequests: ''
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeBookingPage();
    setupEventListeners();
    loadVendorData();
});

function initializeBookingPage() {
    // Get vendor ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const vendorId = urlParams.get('vendorId');
    
    if (!vendorId) {
        alert('No vendor selected. Redirecting to home page.');
        window.location.href = 'index_mobile.html';
        return;
    }
    
    // Store vendor ID
    window.vendorId = vendorId;
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('event-date').setAttribute('min', today);
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Navigation buttons
    document.getElementById('back-btn').addEventListener('click', goBackToVendor);
    document.getElementById('prev-btn').addEventListener('click', previousStep);
    document.getElementById('next-btn').addEventListener('click', nextStep);
    document.getElementById('submit-btn').addEventListener('click', submitBookingRequest);
    
    // Success modal buttons
    document.getElementById('view-requests-btn').addEventListener('click', () => {
        window.location.href = 'index_mobile.html#my-requests';
    });
    
    document.getElementById('back-to-vendor-btn').addEventListener('click', goBackToVendor);
    
    // Form inputs - update summary on change
    const formInputs = [
        'event-name', 'event-type', 'event-date', 'event-time', 
        'event-end-time', 'attendee-count', 'event-location'
    ];
    
    formInputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            element.addEventListener('change', updateBookingSummary);
            element.addEventListener('input', updateBookingSummary);
        }
    });
}

// ============================================
// VENDOR DATA LOADING
// ============================================

async function loadVendorData() {
    try {
        const response = await fetch(`${API_BASE_URL}/vendors/${window.vendorId}`);
        
        if (!response.ok) {
            throw new Error(`Failed to load vendor data: ${response.status} ${response.statusText}`);
        }
        
        vendorData = await response.json();
        displayVendorInfo();
        
    } catch (error) {
        console.error('Error loading vendor data:', error);
        
        // Show more helpful error message
        const errorMsg = error.message.includes('fetch')
            ? 'Unable to connect to the server. Please make sure the backend is running on port 3000.'
            : 'Failed to load vendor information. Please try again.';
        
        alert(errorMsg);
        
        // Display error state in vendor info
        document.getElementById('vendor-info').innerHTML = `
            <div class="vendor-image-placeholder">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="vendor-details">
                <h3 class="vendor-name">Unable to load vendor</h3>
                <p class="vendor-category" style="color: var(--error-color);">Connection error</p>
            </div>
        `;
    }
}

function displayVendorInfo() {
    if (!vendorData) return;
    
    const businessName = vendorData.BusinessName || vendorData.Name || 'Vendor';
    const category = vendorData.Category || vendorData.ServiceCategory || '';
    const rating = vendorData.AverageRating || vendorData.Rating || 0;
    const reviewCount = vendorData.ReviewCount || vendorData.TotalReviews || 0;
    const profilePic = vendorData.ProfilePictureURL || vendorData.ProfilePicture || '';
    
    const vendorInfoHtml = `
        ${profilePic ? 
            `<img src="${profilePic}" alt="${businessName}" class="vendor-image">` :
            `<div class="vendor-image-placeholder"><i class="fas fa-store"></i></div>`
        }
        <div class="vendor-details">
            <h3 class="vendor-name">${businessName}</h3>
            ${category ? `<p class="vendor-category">${category}</p>` : ''}
            <div class="vendor-rating">
                <i class="fas fa-star"></i>
                <span>${rating > 0 ? rating.toFixed(1) : 'New'}</span>
                ${reviewCount > 0 ? `<span class="review-count">(${reviewCount} review${reviewCount !== 1 ? 's' : ''})</span>` : ''}
            </div>
        </div>
    `;
    
    document.getElementById('vendor-info').innerHTML = vendorInfoHtml;
}

// ============================================
// SERVICES LOADING
// ============================================

async function loadVendorServices() {
    const servicesList = document.getElementById('services-list');
    
    try {
        // Fetch vendor's services/features
        const response = await fetch(`${API_BASE_URL}/vendors/${window.vendorId}/selected-services`);
        
        if (!response.ok) {
            throw new Error('Failed to load services');
        }
        
        const data = await response.json();
        const services = data.selectedServices || [];
        
        if (services.length === 0) {
            servicesList.innerHTML = `
                <div class="no-services">
                    <i class="fas fa-info-circle"></i>
                    <p>This vendor hasn't listed specific services yet. You can still send a booking request with your requirements.</p>
                </div>
            `;
            return;
        }
        
        // Display services
        servicesList.innerHTML = services.map(service => `
            <div class="service-card" data-service-id="${service.PredefinedServiceID || service.VendorSelectedServiceID}" data-service-name="${service.ServiceName}" data-service-price="${service.VendorPrice || 0}">
                <div class="service-card-header">
                    <div class="service-name">${service.ServiceName}</div>
                    <div class="service-checkbox">
                        <i class="fas fa-check" style="display: none;"></i>
                    </div>
                </div>
                ${service.VendorDescription || service.PredefinedDescription ? `<div class="service-description">${service.VendorDescription || service.PredefinedDescription}</div>` : ''}
                ${service.VendorPrice ? `<div class="service-price">$${parseFloat(service.VendorPrice).toFixed(2)}</div>` : '<div class="service-price">Price on request</div>'}
            </div>
        `).join('');
        
        // Add click handlers to service cards
        document.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('click', () => toggleServiceSelection(card));
        });
        
    } catch (error) {
        console.error('Error loading services:', error);
        servicesList.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load services. Please try again.</p>
            </div>
        `;
    }
}

function toggleServiceSelection(card) {
    const serviceId = card.dataset.serviceId;
    const serviceName = card.dataset.serviceName;
    const servicePrice = parseFloat(card.dataset.servicePrice) || 0;
    const checkbox = card.querySelector('.service-checkbox i');
    
    if (card.classList.contains('selected')) {
        // Deselect
        card.classList.remove('selected');
        checkbox.style.display = 'none';
        selectedServices = selectedServices.filter(s => s.id !== serviceId);
    } else {
        // Select
        card.classList.add('selected');
        checkbox.style.display = 'block';
        selectedServices.push({
            id: serviceId,
            name: serviceName,
            price: servicePrice
        });
    }
    
    updateBookingSummary();
}

// ============================================
// STEP NAVIGATION
// ============================================

function nextStep() {
    // Validate current step
    if (!validateStep(currentStep)) {
        return;
    }
    
    // Save current step data
    saveStepData(currentStep);
    
    // Move to next step
    if (currentStep < 3) {
        currentStep++;
        updateStepDisplay();
        
        // Load services when entering step 2
        if (currentStep === 2) {
            loadVendorServices();
        }
        
        // Update review when entering step 3
        if (currentStep === 3) {
            updateReviewSection();
        }
    }
}

function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        updateStepDisplay();
    }
}

function updateStepDisplay() {
    // Hide all steps
    document.querySelectorAll('.booking-step').forEach(step => {
        step.style.display = 'none';
    });
    
    // Show current step
    document.getElementById(`step-${currentStep}`).style.display = 'block';
    
    // Update navigation buttons
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    
    prevBtn.style.display = currentStep > 1 ? 'block' : 'none';
    
    if (currentStep === 3) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
    } else {
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// VALIDATION
// ============================================

function validateStep(step) {
    if (step === 1) {
        // Validate event details
        const eventName = document.getElementById('event-name').value.trim();
        const eventType = document.getElementById('event-type').value;
        const eventDate = document.getElementById('event-date').value;
        const eventTime = document.getElementById('event-time').value;
        const attendeeCount = document.getElementById('attendee-count').value;
        const eventLocation = document.getElementById('event-location').value.trim();
        
        if (!eventName) {
            alert('Please enter an event name');
            document.getElementById('event-name').focus();
            return false;
        }
        
        if (!eventType) {
            alert('Please select an event type');
            document.getElementById('event-type').focus();
            return false;
        }
        
        if (!eventDate) {
            alert('Please select an event date');
            document.getElementById('event-date').focus();
            return false;
        }
        
        if (!eventTime) {
            alert('Please select a start time');
            document.getElementById('event-time').focus();
            return false;
        }
        
        if (!attendeeCount || attendeeCount < 1) {
            alert('Please enter the number of guests');
            document.getElementById('attendee-count').focus();
            return false;
        }
        
        if (!eventLocation) {
            alert('Please enter the event location');
            document.getElementById('event-location').focus();
            return false;
        }
        
        return true;
    }
    
    if (step === 2) {
        // Services are optional, but show a warning if none selected
        if (selectedServices.length === 0) {
            const proceed = confirm('You haven\'t selected any services. Do you want to continue anyway?');
            return proceed;
        }
        return true;
    }
    
    return true;
}

function saveStepData(step) {
    if (step === 1) {
        bookingData.eventName = document.getElementById('event-name').value.trim();
        bookingData.eventType = document.getElementById('event-type').value;
        bookingData.eventDate = document.getElementById('event-date').value;
        bookingData.eventTime = document.getElementById('event-time').value;
        bookingData.eventEndTime = document.getElementById('event-end-time').value;
        bookingData.attendeeCount = document.getElementById('attendee-count').value;
        bookingData.eventLocation = document.getElementById('event-location').value.trim();
    }
    
    if (step === 3) {
        bookingData.specialRequests = document.getElementById('special-requests').value.trim();
    }
}

// ============================================
// BOOKING SUMMARY
// ============================================

function updateBookingSummary() {
    // Update date
    const eventDate = document.getElementById('event-date').value;
    if (eventDate) {
        const dateObj = new Date(eventDate);
        const formattedDate = dateObj.toLocaleDateString('en-US', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        document.querySelector('#summary-date .summary-value').textContent = formattedDate;
        document.getElementById('summary-date').style.display = 'flex';
    }
    
    // Update time
    const eventTime = document.getElementById('event-time').value;
    const eventEndTime = document.getElementById('event-end-time').value;
    if (eventTime) {
        let timeText = formatTime(eventTime);
        if (eventEndTime) {
            timeText += ` - ${formatTime(eventEndTime)}`;
        }
        document.querySelector('#summary-time .summary-value').textContent = timeText;
        document.getElementById('summary-time').style.display = 'flex';
    }
    
    // Update guests
    const attendeeCount = document.getElementById('attendee-count').value;
    if (attendeeCount) {
        document.querySelector('#summary-guests .summary-value').textContent = `${attendeeCount} guests`;
        document.getElementById('summary-guests').style.display = 'flex';
    }
    
    // Update services
    if (selectedServices.length > 0) {
        document.querySelector('#summary-services .summary-value').textContent = 
            `${selectedServices.length} service${selectedServices.length > 1 ? 's' : ''} selected`;
        document.getElementById('summary-services').style.display = 'flex';
    } else {
        document.getElementById('summary-services').style.display = 'none';
    }
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

// ============================================
// REVIEW SECTION
// ============================================

function updateReviewSection() {
    // Event details
    document.getElementById('review-event-name').textContent = bookingData.eventName;
    document.getElementById('review-event-type').textContent = 
        document.getElementById('event-type').selectedOptions[0].text;
    
    const dateObj = new Date(bookingData.eventDate);
    const formattedDate = dateObj.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    let dateTimeText = `${formattedDate} at ${formatTime(bookingData.eventTime)}`;
    if (bookingData.eventEndTime) {
        dateTimeText += ` - ${formatTime(bookingData.eventEndTime)}`;
    }
    document.getElementById('review-date-time').textContent = dateTimeText;
    
    document.getElementById('review-guests').textContent = `${bookingData.attendeeCount} guests`;
    document.getElementById('review-location').textContent = bookingData.eventLocation;
    
    // Selected services
    const servicesListHtml = selectedServices.length > 0 
        ? selectedServices.map(service => `
            <div class="review-service-item">
                <i class="fas fa-check-circle"></i>
                <span>${service.name}</span>
            </div>
        `).join('')
        : '<p style="color: var(--text-secondary);">No specific services selected</p>';
    
    document.getElementById('review-services-list').innerHTML = servicesListHtml;
}

// ============================================
// BOOKING SUBMISSION
// ============================================

async function submitBookingRequest() {
    // Get current user (stored as 'userSession' in main app)
    const currentUser = JSON.parse(localStorage.getItem('userSession') || 'null');
    
    // Check for both userId (from main app) and UserID (from API responses)
    const userId = currentUser?.userId || currentUser?.UserID || currentUser?.id;
    
    if (!currentUser || !userId) {
        alert('You must be logged in to send a booking request. Please log in and try again.');
        window.location.href = 'index_mobile.html#login';
        return;
    }
    
    // Save step 3 data
    saveStepData(3);
    
    // Disable submit button
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    
    try {
        // Prepare booking request data
        const requestData = {
            userId: userId,
            vendorProfileId: parseInt(window.vendorId),
            eventName: bookingData.eventName,
            eventType: bookingData.eventType,
            eventDate: bookingData.eventDate,
            eventTime: bookingData.eventTime + ':00', // Add seconds
            eventEndTime: bookingData.eventEndTime ? bookingData.eventEndTime + ':00' : null,
            eventLocation: bookingData.eventLocation,
            attendeeCount: parseInt(bookingData.attendeeCount),
            services: selectedServices,
            specialRequestText: bookingData.specialRequests,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        
        // Send request to API
        const response = await fetch(`${API_BASE_URL}/bookings/requests/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to send booking request');
        }
        
        // Show success modal
        showSuccessModal();
        
    } catch (error) {
        console.error('Error submitting booking request:', error);
        alert('Failed to send booking request: ' + error.message);
        
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Request';
    }
}

function showSuccessModal() {
    document.getElementById('success-modal').style.display = 'flex';
}

// ============================================
// NAVIGATION
// ============================================

function goBackToVendor() {
    if (confirm('Are you sure you want to leave? Your booking information will be lost.')) {
        window.location.href = `index_mobile.html?vendor=${window.vendorId}`;
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Debounce function for input events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debounce to summary updates
const debouncedUpdateSummary = debounce(updateBookingSummary, 300);
