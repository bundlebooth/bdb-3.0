// Vendor Profile Page Script
// Configuration
const API_BASE_URL = 'https://bdb-3-0-venuevue-api.onrender.com/api';

// Global state
let currentUser = null;
let currentVendor = null;
let lightboxImages = [];
let currentLightboxIndex = 0;
let currentGalleryIndex = 0;

// Get vendor ID from URL parameter
function getVendorIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('vendorId');
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Vendor profile page loaded');
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                currentUser = data.user || data.data;
                console.log('✅ User logged in:', currentUser);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    }
    
    // Get vendor ID and load profile
    const vendorId = getVendorIdFromUrl();
    if (vendorId) {
        await loadVendorProfile(vendorId);
    } else {
        showError('No vendor ID provided');
    }
    
    // Setup event listeners
    setupEventListeners();
});

// Load vendor profile
async function loadVendorProfile(vendorId) {
    console.log(`🔍 Loading vendor profile: ${vendorId}`);
    
    // Show loading skeleton
    showLoadingSkeleton();
    
    try {
        const apiUrl = `${API_BASE_URL}/vendors/${vendorId}?userId=${currentUser ? currentUser.id : ''}`;
        console.log(`🔍 Fetching from: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch vendor: ${response.status}`);
        }
        
        const data = await response.json();
        const vendorDetails = data.data;
        
        console.log('✅ Vendor data loaded:', vendorDetails);
        
        // Store current vendor
        currentVendor = {
            ...vendorDetails.profile,
            images: vendorDetails.images || []
        };
        
        // Render profile
        renderVendorProfile(vendorDetails);
        
        // Initialize recommendations
        initializeVenueRecommendations(vendorId, vendorDetails);
        
    } catch (error) {
        console.error('❌ Error loading vendor profile:', error);
        showError(error.message);
    }
}

// Render vendor profile
function renderVendorProfile(details) {
    const profile = details.profile;
    const isFavorite = details.isFavorite;
    const socialMedia = details.socialMedia || [];
    const businessHours = details.businessHours || [];
    const faqs = details.faqs || [];
    const team = details.team || [];
    const services = details.services || [];
    const reviews = details.reviews || [];
    const serviceAreas = details.serviceAreas || [];
    
    // Update page title
    document.title = `${profile.BusinessName || profile.DisplayName} - VenueVue`;
    
    // Populate gallery
    populateVendorGallery(details.images || []);
    
    // Update header
    document.getElementById('vendor-business-name').textContent = profile.BusinessName || profile.DisplayName;
    document.getElementById('vendor-tagline').textContent = profile.Tagline || 'Professional Event Services';
    
    // Update location
    const locationEl = document.getElementById('vendor-location');
    if (profile.City || profile.State) {
        locationEl.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${[profile.City, profile.State].filter(Boolean).join(', ')}`;
    }
    
    // Update years in business
    const yearsEl = document.getElementById('vendor-years');
    if (profile.YearsInBusiness) {
        yearsEl.innerHTML = `<i class="fas fa-trophy" style="color: #fbbf24;"></i> ${profile.YearsInBusiness} years in business`;
    }
    
    // Update favorite button
    const favoriteBtn = document.getElementById('vendor-favorite-btn');
    if (favoriteBtn) {
        if (isFavorite) {
            favoriteBtn.classList.add('active');
        }
    }
    
    // Update about section
    document.getElementById('vendor-about').textContent = profile.BusinessDescription || 'Welcome to our business! We provide exceptional event services tailored to your needs.';
    
    // Render social media icons in header
    renderSocialMediaIcons(socialMedia, profile);
    
    // Render location and service areas
    renderLocationAndServiceAreas(profile, serviceAreas);
    
    // Load vendor questionnaire (this replaces fetchAndRenderVendorFeatures)
    loadVendorProfileQuestionnaire(profile.VendorProfileID);
    
    // Load portfolio albums
    loadPublicPortfolioAlbums(profile.VendorProfileID);
    
    // Render services
    if (services.length > 0) {
        document.getElementById('services-section').style.display = 'block';
        document.getElementById('services-list').innerHTML = renderServices(services);
    }
    
    // Render FAQs
    if (faqs.length > 0) {
        document.getElementById('faqs-section').style.display = 'block';
        document.getElementById('faqs-list').innerHTML = renderFAQs(faqs);
    }
    
    // Render team
    if (team.length > 0) {
        document.getElementById('team-section').style.display = 'block';
        document.getElementById('team-list').innerHTML = renderTeam(team);
    }
    
    // Render reviews
    document.getElementById('reviews-list').innerHTML = renderReviews(reviews);
    
    // Render business hours
    if (businessHours.length > 0) {
        document.getElementById('business-hours-section').style.display = 'block';
        document.getElementById('business-hours-list').innerHTML = renderBusinessHours(businessHours);
    }
    
    // Setup interactive elements
    setupProfileInteractions(profile);
}

// Render services - Complete version with images and enhanced details
function renderServices(services) {
    if (!services || services.length === 0) {
        return '<p style="color: var(--text-light); font-style: italic;">No services available.</p>';
    }
    
    return services.map((service, index) => {
        const serviceName = service.ServiceName || service.Name || 'Unnamed Service';
        const servicePrice = service.Price || 0;
        const serviceDescription = service.Description || '';
        const serviceDuration = service.DurationMinutes || 0;
        const serviceCapacity = service.MaxAttendees || 0;
        const serviceId = service.ServiceID || index;
        const categoryName = service.CategoryName || '';
        const requiresDeposit = service.RequiresDeposit || false;
        const depositPercentage = service.DepositPercentage || 0;
        
        // Handle service image
        let serviceImage = service.PrimaryImage || service.ImageURL || service.image_url || service.primaryimage || '';
        if (serviceImage && !serviceImage.startsWith('http')) {
            if (serviceImage.includes('cloudinary')) {
                serviceImage = 'https://' + serviceImage.replace(/^\/+/, '');
            } else if (serviceImage.startsWith('/')) {
                serviceImage = API_BASE_URL + serviceImage;
            }
        }
        
        // Get category icon
        const getCategoryIcon = () => {
            const catLower = (categoryName || '').toLowerCase();
            const nameLower = (serviceName || '').toLowerCase();
            
            if (catLower.includes('photo') || nameLower.includes('photo')) return 'fa-camera';
            if (catLower.includes('video') || nameLower.includes('video')) return 'fa-video';
            if (catLower.includes('music') || catLower.includes('dj') || nameLower.includes('music') || nameLower.includes('dj')) return 'fa-music';
            if (catLower.includes('cater') || nameLower.includes('food') || nameLower.includes('cater')) return 'fa-utensils';
            if (catLower.includes('venue') || nameLower.includes('venue') || nameLower.includes('space')) return 'fa-building';
            if (catLower.includes('decor') || catLower.includes('floral') || nameLower.includes('decor') || nameLower.includes('flower')) return 'fa-leaf';
            if (catLower.includes('entertainment') || nameLower.includes('perform')) return 'fa-masks-theater';
            if (catLower.includes('transport') || nameLower.includes('transport')) return 'fa-car';
            if (catLower.includes('beauty') || catLower.includes('wellness') || nameLower.includes('makeup') || nameLower.includes('spa')) return 'fa-spa';
            return 'fa-concierge-bell';
        };
        
        const serviceIcon = getCategoryIcon();
        
        // Format pricing
        let priceDisplay = '';
        let priceSubtext = '';
        if (servicePrice > 0) {
            priceDisplay = `$${parseFloat(servicePrice).toFixed(2)}`;
            priceSubtext = '/ per service';
        } else {
            priceDisplay = 'Contact for pricing';
            priceSubtext = '';
        }
        
        // Format duration
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
        
        return `
            <div class="service-package-card">
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <!-- Service Image -->
                    <div class="service-image-container">
                        ${serviceImage ? 
                            `<img src="${serviceImage}" 
                                  alt="${serviceName}" 
                                  onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas ${serviceIcon} service-icon\\'></i>'">` 
                            : 
                            `<i class="fas ${serviceIcon} service-icon"></i>`
                        }
                    </div>
                    
                    <!-- Service Details -->
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
                            <div style="flex: 1; min-width: 0;">
                                <h3 class="service-card-title">${serviceName}</h3>
                                
                                <!-- First info row: Category & Duration -->
                                <div class="service-card-details" style="margin-bottom: 0.25rem;">
                                    ${categoryName ? `<span><i class="fas fa-tag"></i>${categoryName}</span>` : ''}
                                    ${durationText ? `<span><i class="fas fa-clock"></i>${durationText}</span>` : ''}
                                </div>
                                
                                <!-- Second info row: Capacity, Deposit, etc -->
                                <div class="service-card-details">
                                    ${serviceCapacity > 0 ? `<span><i class="fas fa-users"></i>Up to ${serviceCapacity}</span>` : ''}
                                    ${requiresDeposit && depositPercentage > 0 ? `<span><i class="fas fa-receipt" style="color: var(--accent);"></i>${depositPercentage}% deposit</span>` : ''}
                                </div>
                            </div>
                            <div style="text-align: right; flex-shrink: 0;">
                                <div style="font-size: 1.15rem; font-weight: 700; color: var(--primary); white-space: nowrap;">${priceDisplay}</div>
                                ${priceSubtext ? `<div style="font-size: 0.7rem; color: var(--text-light); margin-top: 0.15rem;">${priceSubtext}</div>` : ''}
                            </div>
                        </div>
                        ${serviceDescription ? `<p class="service-card-description" style="margin-top: 0.5rem;">${serviceDescription}</p>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Render FAQs
function renderFAQs(faqs) {
    return faqs.map((faq, index) => {
        return `
            <div style="padding: 1.5rem 0; ${index < faqs.length - 1 ? 'border-bottom: 1px solid #e5e7eb;' : ''}">
                <div style="font-weight: 600; color: var(--text); font-size: 1rem; margin-bottom: 0.75rem;">
                    ${faq.Question}
                </div>
                <div style="color: var(--text-light); font-size: 0.9rem; line-height: 1.6;">
                    ${faq.Answer}
                </div>
            </div>
        `;
    }).join('');
}

// Render reviews
function renderReviews(reviews) {
    if (!reviews || reviews.length === 0) {
        return '<p style="color: var(--text-light); font-style: italic;">No reviews yet.</p>';
    }
    
    return reviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <div class="reviewer-name">${review.ReviewerName || review.UserName || 'Anonymous'}</div>
                <div class="review-date">${new Date(review.CreatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            <div class="review-rating">${'★'.repeat(review.Rating)}${'☆'.repeat(5 - review.Rating)}</div>
            <div class="review-comment">${review.Comment}</div>
        </div>
    `).join('');
}

// Render business hours
function renderBusinessHours(hours) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        let timePart = timeStr;
        if (timeStr.includes('T')) timePart = timeStr.split('T')[1];
        if (timeStr.includes(' ')) timePart = timeStr.split(' ')[1];
        
        const [hours, minutes] = timePart.split(':');
        let h = parseInt(hours);
        const m = minutes;
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${m} ${ampm}`;
    };
    
    return hours.map(hour => {
        if (hour.IsAvailable) {
            return `
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
                    <span style="font-weight: 500;">${dayNames[hour.DayOfWeek]}</span>
                    <span>${formatTime(hour.OpenTime)} - ${formatTime(hour.CloseTime)}</span>
                </div>
            `;
        } else {
            return `
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; opacity: 0.6;">
                    <span style="font-weight: 500;">${dayNames[hour.DayOfWeek]}</span>
                    <span style="color: var(--text-light);">Closed</span>
                </div>
            `;
        }
    }).join('');
}

// Setup profile interactions
function setupProfileInteractions(profile) {
    // Favorite button
    const favoriteBtn = document.getElementById('vendor-favorite-btn');
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', () => toggleFavorite(profile.VendorProfileID));
    }
    
    // Share button
    const shareBtn = document.getElementById('vendor-share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => shareVendorProfile(profile.VendorProfileID, profile.BusinessName));
    }
    
    // Request booking button
    const requestBookingBtn = document.getElementById('request-booking-btn');
    if (requestBookingBtn) {
        requestBookingBtn.addEventListener('click', () => {
            // Check if user is logged in
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Please log in to send a booking request.');
                window.location.href = 'index_mobile.html';
                return;
            }
            // Navigate to vendor booking page with vendorId
            window.location.href = `vendor-booking.html?vendorId=${profile.VendorProfileID}`;
        });
    }
    
    // Message vendor button
    const messageBtn = document.getElementById('message-vendor-btn');
    if (messageBtn) {
        messageBtn.addEventListener('click', () => {
            if (!currentUser) {
                alert('Please log in to message this vendor.');
                window.location.href = 'index_mobile.html';
                return;
            }
            alert('Messaging feature coming soon!');
        });
    }
}

// Toggle favorite
async function toggleFavorite(vendorId) {
    if (!currentUser) {
        alert('Please log in to save favorites.');
        window.location.href = 'index_mobile.html';
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
                vendorId: vendorId
            })
        });
        
        if (response.ok) {
            const favoriteBtn = document.getElementById('vendor-favorite-btn');
            favoriteBtn.classList.toggle('active');
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
    }
}

// Share vendor profile
async function shareVendorProfile(vendorId, vendorName) {
    const profileUrl = `${window.location.origin}/vendor-profile.html?vendorId=${vendorId}`;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: vendorName,
                text: `Check out ${vendorName} on VenueVue!`,
                url: profileUrl
            });
        } catch (error) {
            console.log('Share cancelled or failed:', error);
        }
    } else {
        // Fallback: copy to clipboard
        try {
            await navigator.clipboard.writeText(profileUrl);
            alert('Profile link copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy link:', error);
            alert(`Share this link: ${profileUrl}`);
        }
    }
}

// Populate vendor gallery
function populateVendorGallery(images) {
    console.log('🖼️ Populating gallery with', images.length, 'images');
    
    const galleryContainer = document.getElementById('image-gallery');
    if (!galleryContainer) return;
    
    // Extract image URLs
    const imageUrls = [];
    if (images && Array.isArray(images)) {
        images.forEach(img => {
            if (img.url) imageUrls.push(img.url);
            else if (img.ImageURL) imageUrls.push(img.ImageURL);
            else if (typeof img === 'string') imageUrls.push(img);
        });
    }
    
    lightboxImages = imageUrls;
    
    // Clear gallery
    galleryContainer.innerHTML = '';
    
    // Create main image
    const mainImageDiv = document.createElement('div');
    mainImageDiv.className = 'gallery-item large-image';
    
    const mainImg = document.createElement('img');
    mainImg.src = imageUrls.length > 0 ? imageUrls[0] : 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png';
    mainImg.alt = 'Main Image';
    
    if (imageUrls.length > 0) {
        mainImg.style.cursor = 'pointer';
        mainImg.addEventListener('click', () => openLightbox(0));
    }
    
    mainImageDiv.appendChild(mainImg);
    galleryContainer.appendChild(mainImageDiv);
    
    // Create thumbnails
    const thumbnailsContainer = document.createElement('div');
    thumbnailsContainer.className = 'thumbnails-container';
    
    for (let i = 1; i <= 4; i++) {
        const thumbDiv = document.createElement('div');
        thumbDiv.className = 'gallery-item';
        
        const thumbImg = document.createElement('img');
        thumbImg.src = i < imageUrls.length ? imageUrls[i] : 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png';
        thumbImg.alt = `Thumbnail ${i}`;
        
        if (i < imageUrls.length) {
            thumbImg.style.cursor = 'pointer';
            thumbImg.addEventListener('click', () => openLightbox(i));
        }
        
        thumbDiv.appendChild(thumbImg);
        
        // Add "See All" overlay on last thumbnail
        if (i === 4 && imageUrls.length > 5) {
            const overlay = document.createElement('div');
            overlay.className = 'see-all-overlay';
            overlay.textContent = `+${imageUrls.length - 5} See All`;
            overlay.style.cursor = 'pointer';
            overlay.addEventListener('click', () => openLightbox(0));
            thumbDiv.appendChild(overlay);
        }
        
        thumbnailsContainer.appendChild(thumbDiv);
    }
    
    galleryContainer.appendChild(thumbnailsContainer);
}

// Lightbox functions
function openLightbox(index) {
    currentLightboxIndex = index;
    updateLightboxImage();
    
    const lightbox = document.getElementById('lightbox-modal');
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    document.getElementById('lightbox-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function updateLightboxImage() {
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxCounter = document.getElementById('lightbox-counter');
    
    if (lightboxImages.length > 0) {
        lightboxImage.src = lightboxImages[currentLightboxIndex];
        lightboxCounter.textContent = `${currentLightboxIndex + 1} / ${lightboxImages.length}`;
    }
}

function showPrevImage() {
    if (lightboxImages.length > 0) {
        currentLightboxIndex = (currentLightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
        updateLightboxImage();
    }
}

function showNextImage() {
    if (lightboxImages.length > 0) {
        currentLightboxIndex = (currentLightboxIndex + 1) % lightboxImages.length;
        updateLightboxImage();
    }
}

// Venue recommendations
function initializeVenueRecommendations(vendorId, vendorData) {
    console.log('🎯 Initializing recommendations');
    
    setTimeout(() => {
        const tabs = document.querySelectorAll('.venue-recommendation-tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabType = tab.getAttribute('data-tab');
                switchRecommendationTab(tabType, vendorId, vendorData);
            });
        });
        
        // Load similar venues by default
        loadSimilarVenues(vendorId, vendorData);
    }, 100);
}

function switchRecommendationTab(tabType, vendorId, vendorData) {
    // Update tabs
    const tabs = document.querySelectorAll('.venue-recommendation-tab');
    tabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === tabType) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Hide all content
    document.querySelectorAll('.venue-tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    // Show selected content
    if (tabType === 'similar') {
        document.getElementById('similar-venues-content').style.display = 'block';
        loadSimilarVenues(vendorId, vendorData);
    } else if (tabType === 'nearby') {
        document.getElementById('nearby-venues-content').style.display = 'block';
        loadNearbyVenues(vendorId, vendorData);
    } else if (tabType === 'viewing') {
        document.getElementById('viewing-venues-content').style.display = 'block';
        loadCurrentlyViewingVenues(vendorId);
    }
}

async function loadSimilarVenues(vendorId, vendorData) {
    const grid = document.getElementById('similar-venues-grid');
    grid.innerHTML = '<p>Loading...</p>';
    
    try {
        // Get category from vendor data
        let category = vendorData.profile?.PrimaryCategory || vendorData.profile?.Category;
        
        const url = category 
            ? `${API_BASE_URL}/vendors?category=${encodeURIComponent(category)}&pageSize=8`
            : `${API_BASE_URL}/vendors?pageSize=8&sortBy=rating`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load similar venues');
        
        const data = await response.json();
        const venues = (data.vendors || data.data || []).filter(v => v.VendorProfileID != vendorId);
        
        if (venues.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: #6b7280;">No similar venues found.</p>';
            return;
        }
        
        renderRecommendationVenues(venues, 'similar-venues-grid');
    } catch (error) {
        console.error('Error loading similar venues:', error);
        grid.innerHTML = '<p style="text-align: center; color: #ef4444;">Error loading venues.</p>';
    }
}

async function loadNearbyVenues(vendorId, vendorData) {
    const grid = document.getElementById('nearby-venues-grid');
    grid.innerHTML = '<p>Loading...</p>';
    
    try {
        const profile = vendorData.profile || vendorData;
        const latitude = profile.Latitude || profile.latitude;
        const longitude = profile.Longitude || profile.longitude;
        
        if (!latitude || !longitude) {
            grid.innerHTML = '<p style="text-align: center; color: #6b7280;">Location data not available.</p>';
            return;
        }
        
        const response = await fetch(
            `${API_BASE_URL}/vendors?latitude=${latitude}&longitude=${longitude}&radiusMiles=25&pageSize=8&sortBy=nearest`
        );
        if (!response.ok) throw new Error('Failed to load nearby venues');
        
        const data = await response.json();
        const venues = (data.data || []).filter(v => v.VendorProfileID !== vendorId);
        
        if (venues.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: #6b7280;">No nearby venues found.</p>';
            return;
        }
        
        renderRecommendationVenues(venues, 'nearby-venues-grid');
    } catch (error) {
        console.error('Error loading nearby venues:', error);
        grid.innerHTML = '<p style="text-align: center; color: #ef4444;">Error loading venues.</p>';
    }
}

async function loadCurrentlyViewingVenues(vendorId) {
    const grid = document.getElementById('viewing-venues-grid');
    grid.innerHTML = '<p>Loading...</p>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/vendors?pageSize=8&sortBy=rating`);
        if (!response.ok) throw new Error('Failed to load venues');
        
        const data = await response.json();
        const venues = (data.data || []).filter(v => v.VendorProfileID !== vendorId);
        
        if (venues.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: #6b7280;">No venues available.</p>';
            return;
        }
        
        renderRecommendationVenues(venues, 'viewing-venues-grid');
    } catch (error) {
        console.error('Error loading venues:', error);
        grid.innerHTML = '<p style="text-align: center; color: #ef4444;">Error loading venues.</p>';
    }
}

function renderRecommendationVenues(venues, gridId) {
    const grid = document.getElementById(gridId);
    
    const html = venues.map(venue => {
        const vendorId = venue.VendorProfileID || venue.vendorProfileId || venue.id;
        const name = venue.BusinessName || venue.businessName || venue.name || 'Unnamed Venue';
        const rating = parseFloat(venue.averageRating ?? venue.rating ?? 0);
        const reviewCount = venue.totalReviews || venue.reviewCount || 0;
        const city = venue.City || venue.city || '';
        const state = venue.State || venue.state || '';
        const location = [city, state].filter(Boolean).join(', ') || 'Location unavailable';
        const isPremium = venue.IsPremium || venue.isPremium || false;
        
        let imageUrl = 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png';
        if (venue.images && venue.images.length > 0) {
            imageUrl = venue.images[0].ImageURL || venue.images[0].imageUrl || venue.images[0].url || imageUrl;
        } else if (venue.PrimaryImageURL || venue.primaryImageURL || venue.imageUrl) {
            imageUrl = venue.PrimaryImageURL || venue.primaryImageURL || venue.imageUrl;
        }
        
        const stars = '★'.repeat(Math.round(rating));
        
        return `
            <div class="recommendation-venue-card" onclick="window.location.href='vendor-profile.html?vendorId=${vendorId}'">
                <div style="position: relative;">
                    <img src="${imageUrl}" alt="${name}" class="recommendation-venue-image"
                         onerror="this.src='https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png'">
                    ${isPremium ? `
                        <div class="recommendation-venue-badge">
                            <i class="fas fa-crown"></i> Premium
                        </div>
                    ` : ''}
                </div>
                <div class="recommendation-venue-info">
                    <div class="recommendation-venue-name">${name}</div>
                    ${rating > 0 ? `
                    <div class="recommendation-venue-rating">
                        <span class="stars">${stars}</span>
                        <span style="color: #6b7280;">${rating.toFixed(1)}</span>
                        <span style="color: #9ca3af;">(${reviewCount})</span>
                    </div>
                    ` : ''}
                    <div class="recommendation-venue-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${location}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    grid.innerHTML = html;
}

// Setup event listeners
function setupEventListeners() {
    // Back button
    const backBtn = document.querySelector('.back-button');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'index_mobile.html';
        });
    }
    
    // Lightbox controls
    const lightboxClose = document.getElementById('lightbox-close');
    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }
    
    const lightboxPrev = document.getElementById('lightbox-prev');
    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', showPrevImage);
    }
    
    const lightboxNext = document.getElementById('lightbox-next');
    if (lightboxNext) {
        lightboxNext.addEventListener('click', showNextImage);
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        const lightbox = document.getElementById('lightbox-modal');
        if (lightbox && lightbox.style.display === 'flex') {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') showPrevImage();
            if (e.key === 'ArrowRight') showNextImage();
        }
    });
    
    // Setup scroll arrows for recommendations
    setupScrollArrows();
}

// Setup scroll arrows for venue recommendations
function setupScrollArrows() {
    const scrollArrows = document.querySelectorAll('.scroll-arrow');
    
    scrollArrows.forEach(arrow => {
        arrow.addEventListener('click', () => {
            const targetId = arrow.getAttribute('data-target');
            const targetGrid = document.getElementById(targetId);
            
            if (!targetGrid) return;
            
            const scrollAmount = 300;
            
            if (arrow.classList.contains('scroll-left')) {
                targetGrid.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else if (arrow.classList.contains('scroll-right')) {
                targetGrid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        });
    });
}

// Fetch and render vendor features from Business Profile Setup
async function fetchAndRenderVendorFeatures(vendorProfileId) {
    try {
        const response = await fetch(`${API_BASE_URL}/vendor-features/vendor/${vendorProfileId}`);
        
        if (!response.ok) {
            console.warn('No vendor features found');
            return;
        }
        
        const data = await response.json();
        
        if (data.success && data.groupedByCategory && data.groupedByCategory.length > 0) {
            const container = document.getElementById('vendor-features-container');
            
            // Render each category with its features
            const featuresHTML = data.groupedByCategory.map(category => {
                const featuresListHTML = category.features.map(feature => `
                    <div class="feature-item">
                        <i class="${feature.featureIcon || 'fas fa-check'}"></i>
                        <span>${feature.featureName}</span>
                    </div>
                `).join('');
                
                return `
                    <div class="content-section vendor-feature-category">
                        <h3>${category.categoryName}</h3>
                        <div class="features-grid">
                            ${featuresListHTML}
                        </div>
                    </div>
                `;
            }).join('');
            
            container.innerHTML = featuresHTML;
        }
    } catch (error) {
        console.error('Error fetching vendor features:', error);
    }
}

// Load public portfolio albums
async function loadPublicPortfolioAlbums(vendorProfileId) {
    const container = document.getElementById('portfolio-grid');
    if (!container) return;
    
    const portfolioSection = document.getElementById('portfolio-section');
    
    try {
        if (!vendorProfileId) {
            return;
        }

        const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/portfolio/albums/public`);
        if (!response.ok) {
            if (response.status === 404) {
                return;
            }
            throw new Error('Failed to fetch albums');
        }
        const data = await response.json();
        const albums = data.albums || [];
        
        if (albums.length === 0) {
            return;
        }
        
        // Show portfolio section
        if (portfolioSection) {
            portfolioSection.style.display = 'block';
        }
        
        container.innerHTML = albums.map(album => `
            <div class="portfolio-album" onclick="openPublicAlbumImages(${album.AlbumID}, ${vendorProfileId})">
                <div style="position: relative; padding-top: 66%; background: var(--bg-dark);">
                    ${album.CoverImageURL ? 
                        `<img src="${album.CoverImageURL}" alt="${album.AlbumName}" class="portfolio-album-image" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">` : 
                        `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-folder-open" style="font-size: 3rem; color: var(--text-light); opacity: 0.5;"></i>
                        </div>`
                    }
                    <div class="portfolio-album-badge">
                        <i class="fas fa-images"></i> ${album.ImageCount || 0}
                    </div>
                </div>
                <div class="portfolio-album-info">
                    <h4>${album.AlbumName}</h4>
                    ${album.AlbumDescription ? 
                        `<p>${album.AlbumDescription}</p>` : 
                        ''
                    }
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading public portfolio albums:', error);
    }
}

// Open public album images
async function openPublicAlbumImages(albumId, vendorProfileId) {
    try {
        const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/portfolio/albums/${albumId}/images/public`);
        if (!response.ok) throw new Error('Failed to fetch album images');
        const data = await response.json();
        const images = data.images || [];
        
        // Get album info
        const albumsResponse = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/portfolio/albums/public`);
        const albumsData = await albumsResponse.json();
        const album = (albumsData.albums || []).find(a => a.AlbumID === albumId);
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1200px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2 style="margin: 0; display: flex; align-items: center; gap: 0.75rem;">
                        <i class="fas fa-folder-open"></i> 
                        ${album ? album.AlbumName : 'Album'}
                        <span style="font-size: 0.9rem; color: var(--text-light); font-weight: normal;">(${images.length} ${images.length === 1 ? 'image' : 'images'})</span>
                    </h2>
                    <button class="modal-close" style="background: none; border: none; font-size: 28px; font-weight: bold; cursor: pointer; color: var(--text);">&times;</button>
                </div>
                <div class="modal-body">
                    ${album && album.AlbumDescription ? `
                        <p style="color: var(--text-light); margin-bottom: 1.5rem;">${album.AlbumDescription}</p>
                    ` : ''}
                    
                    ${images.length === 0 ? `
                        <div style="text-align: center; padding: 3rem; background: var(--secondary); border-radius: var(--radius); border: 2px dashed var(--border);">
                            <i class="fas fa-images" style="font-size: 3rem; color: var(--text-light); margin-bottom: 1rem;"></i>
                            <p style="color: var(--text-light); margin: 0;">No images in this album</p>
                        </div>
                    ` : `
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">
                            ${images.map((img, index) => `
                                <div style="position: relative; aspect-ratio: 1; background: var(--bg-dark); border-radius: var(--radius); overflow: hidden; border: 2px solid var(--border); cursor: pointer;" onclick="openImageLightbox(${index}, ${JSON.stringify(images.map(i => i.ImageURL)).replace(/"/g, '&quot;')})">
                                    <img src="${img.ImageURL}" alt="${img.Caption || ''}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                                    ${img.Caption ? `<div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.8)); color: white; padding: 1rem 0.75rem 0.5rem; font-size: 0.85rem;">${img.Caption}</div>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.modal-close').onclick = () => {
            document.body.removeChild(modal);
        };
        modal.onclick = (e) => {
            if (e.target === modal) document.body.removeChild(modal);
        };
    } catch (error) {
        console.error('Error opening public album:', error);
        alert('Failed to load album images');
    }
}

// Open image lightbox for portfolio
function openImageLightbox(startIndex, imageUrls) {
    let currentIndex = startIndex;
    
    const lightbox = document.createElement('div');
    lightbox.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.95); z-index: 10000; display: flex; align-items: center; justify-content: center;';
    
    function updateImage() {
        lightbox.innerHTML = `
            <button onclick="event.stopPropagation(); this.parentElement.remove();" style="position: absolute; top: 1rem; right: 1rem; background: rgba(255,255,255,0.2); border: none; color: white; font-size: 2rem; width: 3rem; height: 3rem; border-radius: 50%; cursor: pointer; z-index: 10001;">&times;</button>
            ${currentIndex > 0 ? `<button onclick="event.stopPropagation(); window.lightboxPrev();" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.2); border: none; color: white; font-size: 2rem; width: 3rem; height: 3rem; border-radius: 50%; cursor: pointer; z-index: 10001;">‹</button>` : ''}
            ${currentIndex < imageUrls.length - 1 ? `<button onclick="event.stopPropagation(); window.lightboxNext();" style="position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.2); border: none; color: white; font-size: 2rem; width: 3rem; height: 3rem; border-radius: 50%; cursor: pointer; z-index: 10001;">›</button>` : ''}
            <img src="${imageUrls[currentIndex]}" style="max-width: 90%; max-height: 90%; object-fit: contain;">
            <div style="position: absolute; bottom: 1rem; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); color: white; padding: 0.5rem 1rem; border-radius: 1rem; font-size: 0.9rem;">${currentIndex + 1} / ${imageUrls.length}</div>
        `;
    }
    
    window.lightboxNext = () => {
        if (currentIndex < imageUrls.length - 1) {
            currentIndex++;
            updateImage();
        }
    };
    
    window.lightboxPrev = () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateImage();
        }
    };
    
    lightbox.onclick = () => lightbox.remove();
    updateImage();
    document.body.appendChild(lightbox);
}

// Make functions globally accessible
window.openPublicAlbumImages = openPublicAlbumImages;
window.openImageLightbox = openImageLightbox;

// Show loading skeleton
function showLoadingSkeleton() {
    document.getElementById('vendor-business-name').innerHTML = '<div class="skeleton skeleton-title"></div>';
    document.getElementById('vendor-tagline').innerHTML = '<div class="skeleton skeleton-text"></div>';
    document.getElementById('vendor-about').innerHTML = '<div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div>';
}

// Show error
function showError(message) {
    const container = document.querySelector('.profile-container');
    container.innerHTML = `
        <div style="text-align: center; margin-top: 5rem;">
            <p style="color: var(--accent); margin-bottom: 1rem; font-size: 1.2rem;">Error: ${message}</p>
            <button onclick="window.location.href='index_mobile.html'" class="btn btn-outline">← Back to search</button>
        </div>
    `;
}

// Render location and service areas
function renderLocationAndServiceAreas(profile, serviceAreas) {
    const locationSection = document.getElementById('location-section');
    const mapContainer = document.getElementById('location-map-container');
    const areasContainer = document.getElementById('service-areas-container');
    
    if (!locationSection || !mapContainer || !areasContainer) return;
    
    let hasLocation = profile.Latitude && profile.Longitude;
    let hasServiceAreas = serviceAreas && serviceAreas.length > 0;
    
    if (!hasLocation && !hasServiceAreas) {
        locationSection.style.display = 'none';
        return;
    }
    
    locationSection.style.display = 'block';
    
    // Render Google Maps
    if (hasLocation) {
        mapContainer.innerHTML = `
            <div class="location-map-container">
                <iframe 
                    width="100%" 
                    height="350" 
                    frameborder="0" 
                    style="border:0; display: block;" 
                    referrerpolicy="no-referrer-when-downgrade"
                    src="https://maps.google.com/maps?q=${profile.Latitude},${profile.Longitude}&hl=en&z=14&output=embed"
                    allowfullscreen>
                </iframe>
                <div class="location-info">
                    <div style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-building"></i>
                        <span>Business Location</span>
                    </div>
                    <div style="font-size: 0.95rem; color: var(--text);">
                        ${[profile.Address, profile.City, profile.State, profile.PostalCode, profile.Country].filter(Boolean).join(', ')}
                    </div>
                </div>
            </div>
        `;
    }
    
    // Render service areas
    if (hasServiceAreas) {
        areasContainer.innerHTML = `
            <h3 style="font-size: 1.1rem; font-weight: 600; color: var(--text); margin-bottom: 0.75rem;">Areas We Serve</h3>
            <div class="service-areas-grid">
                ${serviceAreas.map(area => {
                    const location = [area.CityName, area.StateProvince, area.Country].filter(Boolean).join(', ');
                    return `
                        <div class="service-area-card">
                            <div style="font-weight: 600; color: var(--text); margin-bottom: 0.5rem; font-size: 0.95rem;">
                                <i class="fas fa-map-marker-alt" style="color: var(--primary); margin-right: 0.5rem; font-size: 0.85rem;"></i>${location}
                            </div>
                            ${area.ServiceRadius || (area.TravelCost && parseFloat(area.TravelCost) > 0) ? `
                                <div style="display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.8rem; color: var(--text-light);">
                                    ${area.ServiceRadius ? `
                                        <div><i class="fas fa-route" style="margin-right: 0.35rem; width: 12px;"></i>${area.ServiceRadius} miles radius</div>
                                    ` : ''}
                                    ${area.TravelCost && parseFloat(area.TravelCost) > 0 ? `
                                        <div><i class="fas fa-dollar-sign" style="margin-right: 0.35rem; width: 12px;"></i>$${parseFloat(area.TravelCost).toFixed(2)} travel fee</div>
                                    ` : ''}
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
}

// Render social media icons in header
function renderSocialMediaIcons(socialMedia, profile) {
    const container = document.getElementById('vendor-social-icons');
    if (!container) return;
    
    if (!socialMedia || (socialMedia.length === 0 && !profile.Website)) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'flex';
    
    const platformIcons = {
        'facebook': 'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg',
        'instagram': 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png',
        'twitter': 'https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg',
        'x': 'https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg',
        'linkedin': 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png',
        'youtube': 'https://upload.wikimedia.org/wikipedia/commons/4/42/YouTube_icon_%282013-2017%29.png'
    };
    
    let html = '';
    
    socialMedia.forEach(social => {
        const iconUrl = platformIcons[social.Platform.toLowerCase()] || 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Globe_icon.svg';
        html += `
            <a href="${social.URL.startsWith('http') ? social.URL : 'https://' + social.URL}" target="_blank" 
               style="text-decoration: none; opacity: 0.7; transition: all 0.2s;" 
               onmouseover="this.style.opacity='1'; this.style.transform='translateY(-2px)'" 
               onmouseout="this.style.opacity='0.7'; this.style.transform='translateY(0)'">
                <img src="${iconUrl}" class="social-icon-small" alt="${social.Platform}">
            </a>
        `;
    });
    
    // Add website if available
    if (profile.Website) {
        html += `
            <a href="${profile.Website.startsWith('http') ? profile.Website : 'https://' + profile.Website}" target="_blank" 
               style="text-decoration: none; opacity: 0.7; transition: all 0.2s;" 
               onmouseover="this.style.opacity='1'; this.style.transform='translateY(-2px)'" 
               onmouseout="this.style.opacity='0.7'; this.style.transform='translateY(0)'">
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c4/Globe_icon.svg" class="social-icon-small" alt="Website">
            </a>
        `;
    }
    
    container.innerHTML = html;
}

// Render team members
function renderTeam(team) {
    if (!team || team.length === 0) {
        return '<p style="color: var(--text-light); font-style: italic;">No team members listed.</p>';
    }
    
    return team.map(member => `
        <div class="team-member-card">
            ${member.PhotoURL ? `<img src="${member.PhotoURL}" alt="${member.Name}" class="team-member-photo">` : ''}
            <h4 class="team-member-name">${member.Name}</h4>
            <p class="team-member-role">${member.Role}</p>
            ${member.Bio ? `<p class="team-member-bio">${member.Bio}</p>` : ''}
        </div>
    `).join('');
}

// Load vendor questionnaire for public display
async function loadVendorProfileQuestionnaire(vendorProfileId) {
    try {
        const container = document.getElementById('vendor-profile-questionnaire-section');
        if (!container) return;
        
        // Show loading state
        container.innerHTML = `
            <div style="text-align: center; padding: 1.5rem;">
                <div class="spinner" style="margin: 0 auto; width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
            </div>
        `;
        
        // Fetch vendor's selected features
        const response = await fetch(`${API_BASE_URL}/vendor-features/vendor/${vendorProfileId}`);
        
        if (!response.ok) {
            // Hide the section if no features found
            container.style.display = 'none';
            return;
        }
        
        const data = await response.json();
        const selectedFeatures = data.selectedFeatures || [];
        
        if (selectedFeatures.length === 0) {
            // Hide the section if no features selected
            container.style.display = 'none';
            return;
        }
        
        // Group features by category
        const categorizedFeatures = {};
        selectedFeatures.forEach(feature => {
            const category = feature.CategoryName || 'Other';
            if (!categorizedFeatures[category]) {
                categorizedFeatures[category] = {
                    categoryIcon: feature.CategoryIcon,
                    features: []
                };
            }
            categorizedFeatures[category].features.push(feature);
        });
        
        // Render questionnaire display
        renderVendorProfileQuestionnaire(categorizedFeatures);
        
    } catch (error) {
        console.error('Error loading vendor profile questionnaire:', error);
        const container = document.getElementById('vendor-profile-questionnaire-section');
        if (container) {
            container.style.display = 'none';
        }
    }
}

// Render vendor questionnaire for public display
function renderVendorProfileQuestionnaire(categorizedFeatures) {
    const container = document.getElementById('vendor-profile-questionnaire-section');
    if (!container) return;
    
    let html = '';
    
    Object.keys(categorizedFeatures).forEach((categoryName, index) => {
        const categoryData = categorizedFeatures[categoryName];
        
        html += `
            <div style="display: grid; grid-template-columns: 180px 1fr; gap: 2rem; padding: 1.5rem 0; border-bottom: 1px solid #e5e7eb; align-items: start;">
                <div style="font-size: 1.125rem; font-weight: 600; color: #1a202c;">${categoryName}</div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem 1.5rem;">
        `;
        
        categoryData.features.forEach(feature => {
            const iconName = feature.FeatureIcon || 'check';
            html += `
                <div style="display: flex; align-items: center; gap: 0.625rem;">
                    <i data-lucide="${iconName}" style="width: 16px; height: 16px; color: #4a5568; flex-shrink: 0;"></i>
                    <span style="font-size: 0.9375rem; color: #2d3748; line-height: 1.4;">${feature.FeatureName}</span>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    // Add responsive CSS for mobile
    html += `
        <style>
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            @media (max-width: 1024px) {
                #vendor-profile-questionnaire-section > div {
                    grid-template-columns: 150px 1fr !important;
                }
                #vendor-profile-questionnaire-section > div > div:nth-child(2) {
                    grid-template-columns: repeat(2, 1fr) !important;
                }
            }
            @media (max-width: 768px) {
                #vendor-profile-questionnaire-section > div {
                    grid-template-columns: 1fr !important;
                    gap: 1rem !important;
                }
                #vendor-profile-questionnaire-section > div > div:nth-child(2) {
                    grid-template-columns: repeat(2, 1fr) !important;
                }
            }
            @media (max-width: 640px) {
                #vendor-profile-questionnaire-section > div > div:nth-child(2) {
                    grid-template-columns: 1fr !important;
                }
            }
        </style>
    `;
    
    container.innerHTML = html;
    
    // Initialize Lucide icons after rendering
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Map feature icons to Font Awesome icons (DEPRECATED - now using Lucide)
function getFeatureIcon(iconName) {
    const iconMap = {
        'church': 'church',
        'chef-hat': 'hat-chef',
        'accessibility': 'wheelchair',
        'car-front': 'car',
        'speaker': 'volume-up',
        'wifi': 'wifi',
        'trees': 'tree',
        'eye': 'eye',
        'disc': 'circle',
        'presentation': 'chalkboard',
        'door-closed': 'door-closed',
        'bed': 'bed',
        'plane': 'plane',
        'users': 'users',
        'camera-off': 'camera',
        'zap': 'bolt',
        'heart': 'heart',
        'file': 'file',
        'images': 'images',
        'printer': 'print',
        'book-open': 'book-open',
        'video': 'video',
        'film': 'film',
        'radio': 'broadcast-tower',
        'mic': 'microphone',
        'volume-2': 'volume-up',
        'lightbulb': 'lightbulb',
        'glass-water': 'glass-martini',
        'list-music': 'list',
        'guitar': 'guitar',
        'palette': 'palette',
        'sparkles': 'star',
        'utensils': 'utensils',
        'cake': 'birthday-cake',
        'coffee': 'coffee',
        'wine-glass': 'wine-glass',
        'cocktail': 'cocktail',
        'beer': 'beer',
        'pizza-slice': 'pizza-slice',
        'drumstick-bite': 'drumstick-bite',
        'ice-cream': 'ice-cream',
        'leaf': 'leaf',
        'seedling': 'seedling',
        'sun': 'sun',
        'moon': 'moon',
        'star': 'star',
        'music': 'music',
        'headphones': 'headphones',
        'gamepad': 'gamepad',
        'trophy': 'trophy',
        'gift': 'gift',
        'balloon': 'balloons',
        'party-horn': 'birthday-cake',
        'confetti': 'star',
        'fireworks': 'star',
        'tent': 'campground',
        'umbrella': 'umbrella',
        'sun-umbrella': 'umbrella-beach',
        'swimming-pool': 'swimming-pool',
        'hot-tub': 'hot-tub',
        'dumbbell': 'dumbbell',
        'bicycle': 'bicycle',
        'running': 'running',
        'hiking': 'hiking',
        'skiing': 'skiing',
        'snowboarding': 'snowboarding',
        'surfing': 'water',
        'boat': 'ship',
        'anchor': 'anchor',
        'life-ring': 'life-ring',
        'compass': 'compass',
        'map': 'map',
        'map-pin': 'map-marker-alt',
        'globe': 'globe',
        'building': 'building',
        'home': 'home',
        'hotel': 'hotel',
        'warehouse': 'warehouse',
        'store': 'store',
        'shopping-bag': 'shopping-bag',
        'shopping-cart': 'shopping-cart',
        'credit-card': 'credit-card',
        'dollar-sign': 'dollar-sign',
        'euro-sign': 'euro-sign',
        'pound-sign': 'pound-sign',
        'yen-sign': 'yen-sign',
        'percent': 'percent',
        'tag': 'tag',
        'tags': 'tags',
        'bookmark': 'bookmark',
        'flag': 'flag',
        'bell': 'bell',
        'calendar': 'calendar',
        'clock': 'clock',
        'stopwatch': 'stopwatch',
        'timer': 'hourglass',
        'hourglass': 'hourglass',
        'alarm-clock': 'alarm-clock',
        'phone': 'phone',
        'mobile': 'mobile-alt',
        'tablet': 'tablet',
        'laptop': 'laptop',
        'desktop': 'desktop',
        'keyboard': 'keyboard',
        'mouse': 'mouse',
        'monitor': 'tv',
        'projector': 'video',
        'screen': 'tv',
        'envelope': 'envelope',
        'mail': 'envelope',
        'inbox': 'inbox',
        'send': 'paper-plane',
        'paperclip': 'paperclip',
        'link': 'link',
        'chain': 'link',
        'lock': 'lock',
        'unlock': 'unlock',
        'key': 'key',
        'shield': 'shield-alt',
        'check': 'check',
        'x': 'times',
        'plus': 'plus',
        'minus': 'minus',
        'equals': 'equals',
        'slash': 'slash',
        'asterisk': 'asterisk',
        'hash': 'hashtag',
        'at-sign': 'at',
        'info': 'info-circle',
        'help': 'question-circle',
        'alert': 'exclamation-triangle',
        'warning': 'exclamation-triangle',
        'error': 'times-circle',
        'success': 'check-circle',
        'search': 'search',
        'zoom-in': 'search-plus',
        'zoom-out': 'search-minus',
        'filter': 'filter',
        'sort': 'sort',
        'settings': 'cog',
        'sliders': 'sliders-h',
        'tool': 'wrench',
        'edit': 'edit',
        'pen': 'pen',
        'pencil': 'pencil-alt',
        'trash': 'trash',
        'delete': 'trash-alt',
        'save': 'save',
        'download': 'download',
        'upload': 'upload',
        'share': 'share-alt',
        'external-link': 'external-link-alt',
        'copy': 'copy',
        'clipboard': 'clipboard',
        'scissors': 'cut',
        'folder': 'folder',
        'folder-open': 'folder-open',
        'archive': 'archive',
        'box': 'box',
        'package': 'box',
        'layers': 'layer-group',
        'grid': 'th',
        'list': 'list',
        'menu': 'bars',
        'more-vertical': 'ellipsis-v',
        'more-horizontal': 'ellipsis-h',
        'chevron-up': 'chevron-up',
        'chevron-down': 'chevron-down',
        'chevron-left': 'chevron-left',
        'chevron-right': 'chevron-right',
        'arrow-up': 'arrow-up',
        'arrow-down': 'arrow-down',
        'arrow-left': 'arrow-left',
        'arrow-right': 'arrow-right',
        'refresh': 'sync',
        'rotate': 'redo',
        'undo': 'undo',
        'redo': 'redo',
        'repeat': 'redo',
        'shuffle': 'random',
        'play': 'play',
        'pause': 'pause',
        'stop': 'stop',
        'skip-back': 'step-backward',
        'skip-forward': 'step-forward',
        'rewind': 'backward',
        'fast-forward': 'forward',
        'volume': 'volume-up',
        'volume-x': 'volume-mute',
        'volume-1': 'volume-down',
        'volume-off': 'volume-off',
        'maximize': 'expand',
        'minimize': 'compress',
        'fullscreen': 'expand-arrows-alt',
        'exit-fullscreen': 'compress-arrows-alt',
        'sidebar': 'columns',
        'layout': 'th-large',
        'align-left': 'align-left',
        'align-center': 'align-center',
        'align-right': 'align-right',
        'align-justify': 'align-justify',
        'bold': 'bold',
        'italic': 'italic',
        'underline': 'underline',
        'strikethrough': 'strikethrough',
        'code': 'code',
        'quote': 'quote-right',
        'heading': 'heading',
        'paragraph': 'paragraph',
        'type': 'font'
    };
    
    return iconMap[iconName] || 'check';
}
