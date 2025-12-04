import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IndexPage from './pages/IndexPage';
import VendorProfilePage from './pages/VendorProfilePage';
import BookingPage from './pages/BookingPage';
import BecomeVendorPage from './pages/BecomeVendorPage';
import { AuthProvider } from './context/AuthContext';
import './styles/MapControls.css';

// Global initMap callback for Google Maps
window.initMap = function() {
  console.log('Google Maps API loaded');
};

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
          <Route path="/" element={<IndexPage />} />
          {/* Support both old format (/vendor/138) and new format (/vendor/business-name-138) */}
          <Route path="/vendor/:vendorSlug" element={<VendorProfilePage />} />
          <Route path="/booking/:vendorSlug" element={<BookingPage />} />
          <Route path="/become-a-vendor" element={<BecomeVendorPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
