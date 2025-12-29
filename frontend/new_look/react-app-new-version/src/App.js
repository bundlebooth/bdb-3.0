import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IndexPage from './pages/IndexPage';
import LandingPage from './pages/LandingPage';
import VendorProfilePage from './pages/VendorProfilePage';
import BookingPage from './pages/BookingPage';
import BecomeVendorPage from './pages/BecomeVendorPage';
import BecomeVendorLanding from './pages/BecomeVendorLanding';
import AdminDashboard from './pages/AdminDashboard';
import InvoicePage from './pages/InvoicePage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import HelpCentrePage from './pages/HelpCentrePage';
import ForumPage from './pages/ForumPage';
import ForumPostPage from './pages/ForumPostPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useHeartbeat } from './hooks/useOnlineStatus';
import './styles/MapControls.css';

// Global initMap callback for Google Maps
window.initMap = function() {
};

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
          <img src="/planhive_logo.svg" alt="PlanHive" style={{ height: '60px', width: 'auto' }} />
        </div>
        <div className="loading-spinner"></div>
      </div>
    );
  }
  
  // Show landing page for unauthenticated users, main page for authenticated
  return currentUser ? <IndexPage /> : <LandingPage />;
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
          <img src="/planhive_logo.svg" alt="PlanHive" style={{ height: '60px', width: 'auto' }} />
        </div>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/explore" element={<IndexPage />} />
          {/* Support both old format (/vendor/138) and new format (/vendor/business-name-138) */}
          <Route path="/vendor/:vendorSlug" element={<VendorProfilePage />} />
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
          <Route path="/forum" element={<ForumPage />} />
          <Route path="/forum/:slug" element={<ForumPage />} />
          <Route path="/forum/post/:slug" element={<ForumPostPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
