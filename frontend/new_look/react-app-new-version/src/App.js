import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import IndexPage from './pages/IndexPage';
import LandingPage from './pages/LandingPage';
import VendorProfilePage from './pages/VendorProfilePage';
import HostProfilePage from './pages/HostProfilePage';
import BookingPage from './pages/BookingPage';
import BecomeVendorPage from './pages/BecomeVendorPage';
import BecomeVendorLanding from './pages/BecomeVendorLanding';
import AdminDashboard from './pages/AdminDashboard';
import InvoicePage from './pages/InvoicePage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import HelpCentrePage from './pages/HelpCentrePage';
import HelpCentreArticlePage from './pages/HelpCentreArticlePage';
import ForumPage from './pages/ForumPage';
import ForumPostPage from './pages/ForumPostPage';
import BrowsePage from './pages/BrowsePage';
import DashboardPage from './pages/DashboardPage';
import BlogPage from './components/BlogPage';
import UnsubscribePage from './pages/UnsubscribePage';
import EmailPreferencesPage from './pages/EmailPreferencesPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useHeartbeat } from './hooks/useOnlineStatus';
import './styles/MapControls.css';

// Global initMap callback for Google Maps
window.initMap = function() {
};

// Disable right-click context menu on images (like Airbnb, Uber)
document.addEventListener('contextmenu', function(e) {
  if (e.target.tagName === 'IMG') {
    e.preventDefault();
    return false;
  }
});

// Home route wrapper - shows landing page for unauthenticated users, main page for authenticated
function HomeRoute() {
  const { currentUser, loading } = useAuth();
  
  // Send heartbeat to track online status
  useHeartbeat();
  
  // Show loading while checking auth status
  if (loading) {
    return (
      <div id="app-loading-overlay">
        <div className="loading-logo">
          <img src="/images/logo.png" alt="Planbeau" style={{ height: '160px', width: 'auto' }} />
        </div>
        <div className="loading-spinner"></div>
      </div>
    );
  }
  
  // Show landing page for unauthenticated users, main page for authenticated
  return currentUser ? <IndexPage /> : <LandingPage />;
}

// Protected deep link component - redirects to login if not authenticated, then to the target
function ProtectedDeepLink({ section }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (loading) return;
    
    if (!currentUser) {
      // Store the intended destination for after login
      const returnUrl = location.pathname + location.search;
      sessionStorage.setItem('postLoginRedirect', returnUrl);
      // Redirect to landing page (which has login)
      navigate('/', { state: { showLogin: true, returnUrl } });
    } else {
      // User is logged in, redirect to dashboard with the appropriate section and item
      const pathParts = location.pathname.split('/');
      const itemId = pathParts[pathParts.length - 1];
      
      // Build the dashboard URL with section and item ID
      let dashboardUrl = `/dashboard?section=${section}`;
      if (itemId && itemId !== section) {
        dashboardUrl += `&itemId=${itemId}`;
      }
      
      navigate(dashboardUrl, { replace: true });
    }
  }, [currentUser, loading, location, navigate, section]);
  
  // Show loading while checking auth or redirecting
  return (
    <div id="app-loading-overlay">
      <div className="loading-logo">
        <img src="/images/logo.png" alt="Planbeau" style={{ height: '160px', width: 'auto' }} />
      </div>
      <div className="loading-spinner"></div>
    </div>
  );
}

function App() {
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setAppLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (appLoading) {
    return (
      <div id="app-loading-overlay">
        <div className="loading-logo">
          <img src="/images/logo.png" alt="Planbeau" style={{ height: '160px', width: 'auto' }} />
        </div>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/explore" element={<IndexPage />} />
          {/* Support both old format (/vendor/138) and new format (/vendor/business-name-138) */}
          <Route path="/vendor/:vendorSlug" element={<VendorProfilePage />} />
          <Route path="/host/:hostId" element={<HostProfilePage />} />
          <Route path="/booking/:vendorSlug" element={<BookingPage />} />
          <Route path="/become-a-vendor" element={<BecomeVendorLanding />} />
          <Route path="/become-a-vendor/setup" element={<BecomeVendorPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/invoice/:invoiceId" element={<InvoicePage />} />
          <Route path="/invoice/booking/:bookingId" element={<InvoicePage />} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/help-centre" element={<HelpCentrePage />} />
          <Route path="/help-centre/category/:categorySlug" element={<HelpCentrePage />} />
          <Route path="/help-centre/category/:categorySlug/article/:articleId" element={<HelpCentrePage />} />
          <Route path="/help-centre/article/:articleSlug" element={<HelpCentreArticlePage />} />
          {/* Deep link routes for bookings/payments/reviews */}
          <Route path="/dashboard/booking/:bookingId" element={<ProtectedDeepLink section="bookings" />} />
          <Route path="/dashboard/payment/:bookingId" element={<ProtectedDeepLink section="payment" />} />
          <Route path="/dashboard/review/:bookingId" element={<ProtectedDeepLink section="reviews" />} />
          <Route path="/forum" element={<ForumPage />} />
          <Route path="/forum/:slug" element={<ForumPage />} />
          <Route path="/forum/post/:slug" element={<ForumPostPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPage />} />
          {/* Browse page routes for category/city/discovery filtering */}
          <Route path="/browse/:filter" element={<BrowsePage />} />
          <Route path="/browse/:filter/:subfilter" element={<BrowsePage />} />
          <Route path="/unsubscribe/:token" element={<UnsubscribePage />} />
          <Route path="/email-preferences/:token" element={<EmailPreferencesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
