/**
 * UNIVERSAL SHARED COMPONENTS LOADER
 * Loads header, navigation, dashboard, footer on ALL pages
 * Ensures authentication and functionality work everywhere
 */

(function() {
    'use strict';

    console.log('🚀 Loading universal shared components...');
    
    // Provide empty initMap function for Google Maps callback
    window.initMap = window.initMap || function() {
        console.log('📍 Google Maps API loaded');
    };

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSharedComponents);
    } else {
        initSharedComponents();
    }

    async function initSharedComponents() {
        try {
            // Check if this is a booking page
            const isBookingPage = window.location.pathname.includes('booking');
            
            if (!isBookingPage) {
                // 1. Load Header (only on non-booking pages)
                loadHeader();
                
                // 2. Load Categories Navigation (only on non-booking pages)
                loadCategoriesNav();
            } else {
                // Load minimal booking header
                loadBookingHeader();
            }
            
            // 3. Load Dashboard Modal (on all pages)
            await loadDashboard();
            
            // 4. Load Messaging Widget (on all pages)
            loadMessagingWidget();
            
            // 5. Load Footer (on all pages)
            loadFooter();
            
            // 6. Load main application script with all functionality
            await loadMainScript();
            
            console.log('✅ All shared components loaded successfully');
            
            // Dispatch event for pages that need to know
            document.dispatchEvent(new CustomEvent('sharedComponentsReady'));
            
        } catch (error) {
            console.error('❌ Error loading shared components:', error);
        }
    }

    function loadBookingHeader() {
        const headerHTML = `
<header class="header" style="border-bottom: 1px solid #e0e0e0; padding: 1rem 2rem; background: white;">
    <div style="display: flex; align-items: center; justify-content: space-between;">
        <div class="logo" style="cursor: pointer;" onclick="window.location.href='index_mobile.html'">
            <img src="planhive_logo.svg" alt="PlanHive" style="height: 40px; width: auto;">
        </div>
    </div>
</header>
<div style="border-bottom: 1px solid #e0e0e0; padding: 1.5rem 2rem; background: white;">
    <div style="display: flex; align-items: center; gap: 1rem; max-width: 1200px; margin: 0 auto;">
        <button id="booking-back-btn" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; color: #222; padding: 0.5rem;">
            <i class="fas fa-arrow-left"></i>
        </button>
        <h1 style="font-size: 1.75rem; font-weight: 600; margin: 0;">Request to book</h1>
    </div>
</div>`;
        document.body.insertAdjacentHTML('afterbegin', headerHTML);
        console.log('✅ Booking header loaded');
        
        // Attach back button handler
        setTimeout(() => {
            const backBtn = document.getElementById('booking-back-btn');
            if (backBtn) {
                backBtn.onclick = function() {
                    // Get vendorId from URL
                    const urlParams = new URLSearchParams(window.location.search);
                    const vendorId = urlParams.get('vendorId');
                    if (vendorId) {
                        window.location.href = `vendor-profile.html?vendorId=${vendorId}`;
                    } else {
                        window.history.back();
                    }
                };
            }
        }, 100);
    }

    function loadHeader() {
        const headerHTML = `
<header class="header" style="position: relative;">
    <div class="logo" style="cursor: pointer;" onclick="window.location.href='index_mobile.html'">
        <img src="planhive_logo.svg" alt="PlanHive" style="height: 50px; width: auto;">
    </div>

    <div class="search-container">
        <div class="search-bar" style="position: relative; display: flex; align-items: center;">
            <input type="text" placeholder="Search for event vendors..." id="search-input" style="flex-grow: 1; padding-left: 1rem; padding-right: 2.5rem;">
            <button id="search-button" style="position: absolute; right: 0.5rem; background: none; border: none; cursor: pointer; color: var(--primary); font-size: 1.25rem;">
                <i class="fas fa-magnifying-glass"></i>
            </button>
        </div>
    </div>

    <div class="user-nav" style="position: relative;">
        <div class="nav-icon" id="wishlist-btn">
            <i class="fas fa-heart"></i>
            <span class="badge" id="favorites-badge">0</span>
        </div>
        <div class="nav-icon" id="chat-btn" title="Chat">
            <i class="fas fa-comments"></i>
            <span class="badge" id="messages-badge">0</span>
        </div>
        <div class="nav-icon" id="notifications-btn" style="position: relative;">
            <i class="fas fa-bell"></i>
            <span class="badge" id="notifications-badge">0</span>
        </div>
        <div class="nav-icon" id="profile-btn" style="background-color: var(--primary); color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">S</div>
    </div>
    
    <!-- Notifications Dropdown - positioned right after header -->
    <div id="notifications-dropdown" class="notifications-dropdown" style="display: none; position: absolute; top: 100%; right: 60px; z-index: 10000;">
        <div class="dropdown-header">
            <h3>Notifications</h3>
            <button id="mark-all-read" class="btn btn-sm">Mark All Read</button>
        </div>
        <div class="notification-tabs">
            <button class="notification-tab active" data-tab="all">All</button>
            <button class="notification-tab" data-tab="unread">Unread</button>
        </div>
        <div id="notifications-list" class="notifications-list">
            <div class="loading-notifications">
                <div class="spinner" style="margin: 0 auto;"></div>
            </div>
        </div>
        <div class="dropdown-footer">
            <a href="#" onclick="displayUserDashboard('client', 'dashboard')" class="view-all-link">View All Notifications</a>
        </div>
    </div>
</header>`;
        document.body.insertAdjacentHTML('afterbegin', headerHTML);
        console.log('✅ Header loaded');
    }

    function loadCategoriesNav() {
        const navHTML = `
<nav class="categories-nav">
    <button class="nav-scroll-btn left" id="scroll-left">◀</button>
    <div class="categories-list-wrapper">
        <div class="categories-list" id="categories-list">
            <div class="category-item active" data-category="all"><i class="fas fa-layer-group"></i><span>All Categories</span></div>
            <div class="category-item" data-category="venue"><i class="fas fa-building"></i><span>Venues</span></div>
            <div class="category-item" data-category="photo"><i class="fas fa-camera"></i><span>Photo/Video</span></div>
            <div class="category-item" data-category="music"><i class="fas fa-music"></i><span>Music/DJ</span></div>
            <div class="category-item" data-category="catering"><i class="fas fa-utensils"></i><span>Catering</span></div>
            <div class="category-item" data-category="entertainment"><i class="fas fa-theater-masks"></i><span>Entertainment</span></div>
            <div class="category-item" data-category="experiences"><i class="fas fa-star"></i><span>Experiences</span></div>
            <div class="category-item" data-category="decor"><i class="fas fa-ribbon"></i><span>Decorations</span></div>
            <div class="category-item" data-category="beauty"><i class="fas fa-spa"></i><span>Beauty</span></div>
            <div class="category-item" data-category="cake"><i class="fas fa-birthday-cake"></i><span>Cake</span></div>
            <div class="category-item" data-category="transport"><i class="fas fa-shuttle-van"></i><span>Transportation</span></div>
            <div class="category-item" data-category="planner"><i class="fas fa-clipboard-list"></i><span>Planners</span></div>
            <div class="category-item" data-category="fashion"><i class="fas fa-tshirt"></i><span>Fashion</span></div>
            <div class="category-item" data-category="stationery"><i class="fas fa-envelope"></i><span>Stationery</span></div>
        </div>
        <div class="category-indicator" id="category-indicator"></div>
    </div>
    <button class="nav-scroll-btn right" id="scroll-right">▶</button>
</nav>`;
        document.body.insertAdjacentHTML('beforeend', navHTML);
        console.log('✅ Categories navigation loaded');
    }

    async function loadDashboard() {
        try {
            const response = await fetch('components/shared-dashboard.html');
            const html = await response.text();
            document.body.insertAdjacentHTML('beforeend', html);
            console.log('✅ Dashboard loaded');
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }

    function loadNotificationsDropdown() {
        const dropdownHTML = `
<!-- Notifications Dropdown -->
<div id="notifications-dropdown" class="notifications-dropdown" style="display: none;">
    <div class="dropdown-header">
        <h3>Notifications</h3>
        <button id="mark-all-read" class="btn btn-sm">Mark All Read</button>
    </div>
    <div class="notification-tabs">
        <button class="notification-tab active" data-tab="all">All</button>
        <button class="notification-tab" data-tab="unread">Unread</button>
    </div>
    <div id="notifications-list" class="notifications-list">
        <div class="loading-notifications">
            <div class="spinner" style="margin: 0 auto;"></div>
        </div>
    </div>
    <div class="dropdown-footer">
        <a href="#" onclick="displayUserDashboard('client', 'dashboard')" class="view-all-link">View All Notifications</a>
    </div>
</div>`;
        document.body.insertAdjacentHTML('beforeend', dropdownHTML);
        console.log('✅ Notifications dropdown loaded');
    }

    function loadMessagingWidget() {
        const widgetHTML = `
<div id="messaging-widget" class="messaging-widget">
    <div id="chat-button" class="chat-button">
        <i class="fas fa-comments"></i>
        <span class="chat-button-text">Messages</span>
        <span id="widget-message-badge" class="widget-message-badge" style="display: none;">0</span>
    </div>
    <div id="widget-container" class="widget-container" style="display: none;">
        <div class="widget-header">
            <h3>Messages</h3>
            <button id="widget-close" class="widget-close">&times;</button>
        </div>
        <div id="conversations-view" class="widget-view">
            <div class="conversations-header">
                <input type="text" id="conversation-search" placeholder="Search conversations..." class="conversation-search">
            </div>
            <div id="conversations-list" class="conversations-list">
                <div class="loading-state"><div class="spinner" style="margin: 0 auto;"></div></div>
            </div>
        </div>
        <div id="chat-view" class="widget-view" style="display: none;">
            <div class="chat-header">
                <button id="back-to-conversations" class="back-button">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <div class="chat-user-info">
                    <img id="chat-user-avatar" src="" alt="" class="chat-user-avatar">
                    <span id="chat-user-name" class="chat-user-name"></span>
                </div>
            </div>
            <div id="chat-messages-container" class="chat-messages-container">
                <div style="text-align: center; padding: 2rem;"><div class="spinner" style="margin: 0 auto;"></div></div>
            </div>
            <div class="chat-input-container">
                <input type="text" id="widget-chat-input" placeholder="Type a message..." class="widget-chat-input">
                <button id="widget-send-button" class="widget-send-button">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    </div>
</div>`;
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
        console.log('✅ Messaging widget loaded');
    }

    function loadFooter() {
        const footerHTML = `
<footer class="vv-footer" aria-label="Site footer">
    <div class="vv-wrap">
        <div class="vv-brand">
            <div class="vv-logo">
                <img src="planhive_logo.svg" alt="PlanHive" style="height: 45px; width: auto;">
            </div>
            <div class="vv-tagline">Get the app and plan on the go</div>
            <div class="vv-badges">
                <a class="vv-badge" href="#" onclick="event.preventDefault();" aria-label="Get it on Google Play">
                    <i class="fab fa-google-play"></i>
                    <span>Google Play</span>
                </a>
                <a class="vv-badge" href="#" onclick="event.preventDefault();" aria-label="Download on the App Store">
                    <i class="fab fa-apple"></i>
                    <span>App Store</span>
                </a>
            </div>
            <div style="color: var(--text-light); font-size: 0.9rem;">© 2025 PlanHive. All rights reserved.</div>
        </div>
        <div class="vv-col">
            <h4>Company</h4>
            <ul class="vv-links">
                <li><a href="#" onclick="event.preventDefault();">Home</a></li>
                <li><a href="#" onclick="event.preventDefault();">Articles</a></li>
                <li><a href="#" onclick="event.preventDefault();">Submit to Blog</a></li>
                <li><a href="#" onclick="event.preventDefault();">Are You a Vendor?</a></li>
                <li><a href="#" onclick="event.preventDefault();">Meet the Team</a></li>
                <li><a href="#" onclick="event.preventDefault();">Privacy Policy</a></li>
                <li><a href="#" onclick="event.preventDefault();">Terms of Use</a></li>
            </ul>
        </div>
        <div class="vv-col">
            <h4>Vendors</h4>
            <ul class="vv-links">
                <li><a href="#" onclick="event.preventDefault();">Venues</a></li>
                <li><a href="#" onclick="event.preventDefault();">Caterers</a></li>
                <li><a href="#" onclick="event.preventDefault();">Event Planners</a></li>
                <li><a href="#" onclick="event.preventDefault();">Photographers</a></li>
                <li><a href="#" onclick="event.preventDefault();">Videographers</a></li>
                <li><a href="#" onclick="event.preventDefault();">Live Music & DJs</a></li>
                <li><a href="#" onclick="event.preventDefault();">Décor & Rentals</a></li>
            </ul>
        </div>
        <div class="vv-col">
            <h4>Connect With Us</h4>
            <div class="vv-social">
                <a href="#" onclick="event.preventDefault();" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
                <a href="#" onclick="event.preventDefault();" aria-label="X"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
                <a href="#" onclick="event.preventDefault();" aria-label="Pinterest"><i class="fab fa-pinterest-p"></i></a>
                <a href="#" onclick="event.preventDefault();" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                <a href="#" onclick="event.preventDefault();" aria-label="TikTok"><i class="fab fa-tiktok"></i></a>
            </div>
            <div class="vv-cta">
                <a href="#" onclick="event.preventDefault();">Advertise with Us!</a>
            </div>
        </div>
    </div>
</footer>`;
        document.body.insertAdjacentHTML('beforeend', footerHTML);
        console.log('✅ Footer loaded');
    }

    async function loadMainScript() {
        // Collect all DOMContentLoaded listeners and execute them after script loads
        const domContentLoadedListeners = [];
        const originalAddEventListener = document.addEventListener;
        
        document.addEventListener = function(type, listener, options) {
            if (type === 'DOMContentLoaded') {
                // Collect the listener to execute after script loads
                domContentLoadedListeners.push(listener);
            } else {
                // Other events work normally
                originalAddEventListener.call(document, type, listener, options);
            }
        };
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'index_mobile-script.js';
            script.onload = () => {
                console.log('✅ Main application script loaded');
                
                // Restore original addEventListener
                document.addEventListener = originalAddEventListener;
                
                // Execute all collected DOMContentLoaded listeners
                console.log(`🔧 Executing ${domContentLoadedListeners.length} DOMContentLoaded listeners...`);
                domContentLoadedListeners.forEach((listener, index) => {
                    try {
                        listener();
                    } catch (error) {
                        console.error(`❌ Error in DOMContentLoaded listener ${index}:`, error);
                    }
                });
                
                console.log('✅ All DOMContentLoaded listeners executed');
                
                // Verify and manually attach button handlers
                setTimeout(() => {
                    console.log('🔧 Attaching header button handlers...');
                    
                    const profileBtn = document.getElementById('profile-btn');
                    const wishlistBtn = document.getElementById('wishlist-btn');
                    const chatBtn = document.getElementById('chat-btn');
                    const notificationsBtn = document.getElementById('notifications-btn');
                    
                    console.log('🔍 Button check:', {
                        profileBtn: profileBtn ? 'exists' : 'missing',
                        wishlistBtn: wishlistBtn ? 'exists' : 'missing',
                        chatBtn: chatBtn ? 'exists' : 'missing',
                        notificationsBtn: notificationsBtn ? 'exists' : 'missing'
                    });
                    
                    // Profile button - open dashboard
                    if (profileBtn) {
                        profileBtn.style.cursor = 'pointer';
                        profileBtn.onclick = function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🖱️ Profile button clicked!');
                            
                            if (typeof window.displayUserDashboard === 'function') {
                                const mode = (window.currentUser && window.currentUser.isVendor) ? 'vendor' : 'client';
                                console.log('Opening dashboard in mode:', mode);
                                try {
                                    window.displayUserDashboard(mode, 'dashboard');
                                    
                                    // After dashboard opens, attach menu handlers
                                    setTimeout(() => {
                                        attachDashboardMenuHandlers();
                                    }, 500);
                                } catch (error) {
                                    console.error('Error opening dashboard:', error);
                                }
                            } else {
                                console.error('displayUserDashboard function not found');
                            }
                        };
                        console.log('✅ Profile button handler attached');
                    }
                    
                    // Wishlist button
                    if (wishlistBtn) {
                        wishlistBtn.style.cursor = 'pointer';
                        wishlistBtn.onclick = function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🖱️ Wishlist button clicked!');
                            
                            if (typeof window.displayUserDashboard === 'function') {
                                const mode = (window.currentUser && window.currentUser.isVendor) ? 'vendor' : 'client';
                                window.displayUserDashboard(mode, 'favorites');
                            }
                        };
                        console.log('✅ Wishlist button handler attached');
                    }
                    
                    // Chat button
                    if (chatBtn) {
                        chatBtn.style.cursor = 'pointer';
                        chatBtn.onclick = function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🖱️ Chat button clicked!');
                            
                            if (typeof window.displayUserDashboard === 'function') {
                                const mode = (window.currentUser && window.currentUser.isVendor) ? 'vendor' : 'client';
                                const section = mode === 'vendor' ? 'vendor-messages' : 'messages';
                                window.displayUserDashboard(mode, section);
                            }
                        };
                        console.log('✅ Chat button handler attached');
                    }
                    
                    // Notifications button
                    if (notificationsBtn) {
                        notificationsBtn.style.cursor = 'pointer';
                        notificationsBtn.onclick = function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🖱️ Notifications button clicked!');
                            
                            // Toggle notifications dropdown if it exists
                            const dropdown = document.getElementById('notifications-dropdown');
                            if (dropdown) {
                                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                            }
                        };
                        console.log('✅ Notifications button handler attached');
                    }
                    
                    console.log('✅ All header button handlers attached');
                }, 500);
                
                // Function to attach dashboard menu handlers
                function attachDashboardMenuHandlers() {
                    console.log('🔧 Attaching dashboard menu handlers...');
                    
                    const dashboardMenu = document.querySelector('.dashboard-menu');
                    if (!dashboardMenu) {
                        console.error('❌ Dashboard menu not found!');
                        return;
                    }
                    
                    const menuItems = dashboardMenu.querySelectorAll('a[data-section]');
                    console.log(`Found ${menuItems.length} dashboard menu items`);
                    
                    menuItems.forEach(item => {
                        // Remove any existing listeners
                        const newItem = item.cloneNode(true);
                        item.parentNode.replaceChild(newItem, item);
                        
                        newItem.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            const section = this.getAttribute('data-section');
                            console.log('📋 Dashboard menu clicked:', section);
                            
                            // Remove active class from all items
                            menuItems.forEach(mi => mi.classList.remove('active'));
                            // Add active class to clicked item
                            this.classList.add('active');
                            
                            // Determine mode from section name
                            const mode = section.startsWith('vendor-') ? 'vendor' : 'client';
                            
                            // Call displayUserDashboard to switch sections
                            if (typeof window.displayUserDashboard === 'function') {
                                window.displayUserDashboard(mode, section);
                            }
                        });
                    });
                    
                    console.log('✅ Dashboard menu handlers attached successfully');
                    
                    // Attach close button handler
                    const closeBtn = document.querySelector('#dashboard-modal .close-modal');
                    if (closeBtn) {
                        closeBtn.onclick = function(e) {
                            e.preventDefault();
                            console.log('❌ Close dashboard clicked');
                            const modal = document.getElementById('dashboard-modal');
                            if (modal) {
                                modal.style.display = 'none';
                                // Restore body scrolling
                                document.body.style.overflow = '';
                            }
                        };
                        console.log('✅ Dashboard close button handler attached');
                    }
                    
                    // Also handle clicking outside the modal
                    const dashboardModal = document.getElementById('dashboard-modal');
                    if (dashboardModal) {
                        dashboardModal.addEventListener('click', function(e) {
                            // Only close if clicking the modal backdrop (not the content)
                            if (e.target === dashboardModal && !dashboardModal.hasAttribute('data-no-outside-close')) {
                                dashboardModal.style.display = 'none';
                                document.body.style.overflow = '';
                            }
                        });
                    }
                    
                    // Also attach save button handlers for Business Profile Management
                    attachBusinessProfileSaveHandlers();
                }
                
                function attachBusinessProfileSaveHandlers() {
                    console.log('🔧 Attaching Business Profile save handlers...');
                    
                    // Wait a bit for the dashboard content to load
                    setTimeout(() => {
                        // Save Business Info button
                        const saveBusinessInfoBtn = document.getElementById('save-business-info');
                        if (saveBusinessInfoBtn) {
                            saveBusinessInfoBtn.onclick = function(e) {
                                e.preventDefault();
                                console.log('💾 Save Business Info clicked');
                                if (typeof window.saveBusinessInfo === 'function') {
                                    window.saveBusinessInfo();
                                }
                            };
                            console.log('✅ Save Business Info handler attached');
                        }
                        
                        // Save Services button
                        const saveServicesBtn = document.getElementById('save-services');
                        if (saveServicesBtn) {
                            saveServicesBtn.onclick = function(e) {
                                e.preventDefault();
                                console.log('💾 Save Services clicked');
                                if (typeof window.saveServices === 'function') {
                                    window.saveServices();
                                }
                            };
                            console.log('✅ Save Services handler attached');
                        }
                        
                        // Save Availability button
                        const saveAvailabilityBtn = document.getElementById('save-availability');
                        if (saveAvailabilityBtn) {
                            saveAvailabilityBtn.onclick = function(e) {
                                e.preventDefault();
                                console.log('💾 Save Availability clicked');
                                if (typeof window.saveAvailability === 'function') {
                                    window.saveAvailability();
                                }
                            };
                            console.log('✅ Save Availability handler attached');
                        }
                        
                        // Save Questionnaire button
                        const saveQuestionnaireBtn = document.getElementById('save-vendor-questionnaire');
                        if (saveQuestionnaireBtn) {
                            saveQuestionnaireBtn.onclick = function(e) {
                                e.preventDefault();
                                console.log('💾 Save Questionnaire clicked');
                                if (typeof window.saveVendorQuestionnaire === 'function') {
                                    window.saveVendorQuestionnaire();
                                }
                            };
                            console.log('✅ Save Questionnaire handler attached');
                        }
                        
                        // Save Gallery button
                        const saveGalleryBtn = document.getElementById('save-gallery');
                        if (saveGalleryBtn) {
                            saveGalleryBtn.onclick = function(e) {
                                e.preventDefault();
                                console.log('💾 Save Gallery clicked');
                                if (typeof window.saveGallery === 'function') {
                                    window.saveGallery();
                                }
                            };
                            console.log('✅ Save Gallery handler attached');
                        }
                        
                        console.log('✅ All Business Profile save handlers attached');
                    }, 1000);
                }
                
                // Initialize authentication after everything is loaded
                setTimeout(() => {
                    if (typeof window.checkAuthStatus === 'function') {
                        console.log('🔐 Initializing authentication...');
                        window.checkAuthStatus();
                    } else {
                        console.warn('⚠️ checkAuthStatus function not found');
                    }
                }, 1000);
                
                resolve();
            };
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }
})();
