import React from 'react';
import { useNavigate } from 'react-router-dom';

function Footer() {
  const navigate = useNavigate();

  const handleCategoryClick = (category) => {
    window.scrollTo(0, 0);
    navigate(`/explore?category=${category}`);
  };

  const handleNavigate = (path) => {
    window.scrollTo(0, 0);
    navigate(path);
  };

  return (
    <footer className="vv-footer" aria-label="Site footer">
      <div className="vv-wrap">
        <div className="vv-brand">
          <div className="vv-logo" onClick={() => handleNavigate('/')} style={{ cursor: 'pointer' }}>
            <img src="/images/logo.png" alt="PlanBeau" style={{ height: '120px', width: 'auto' }} />
          </div>
          <div className="vv-tagline">Get the app and plan on the go</div>
          <div className="vv-badges">
            <a className="vv-badge" href="#" onClick={(e) => e.preventDefault()} aria-label="Get it on Google Play">
              <i className="fab fa-google-play"></i>
              <span>Google Play</span>
            </a>
            <a className="vv-badge" href="#" onClick={(e) => e.preventDefault()} aria-label="Download on the App Store">
              <i className="fab fa-apple"></i>
              <span>App Store</span>
            </a>
          </div>
          <div style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>© 2025 PlanBeau. All rights reserved.</div>
        </div>

        <div className="vv-col">
          <h4>Company</h4>
          <ul className="vv-links">
            <li><a href="/" onClick={(e) => { e.preventDefault(); handleNavigate('/'); }}>Home</a></li>
            <li><a href="/explore" onClick={(e) => { e.preventDefault(); handleNavigate('/explore'); }}>Browse Vendors</a></li>
            <li><a href="/become-a-vendor" onClick={(e) => { e.preventDefault(); handleNavigate('/become-a-vendor'); }}>Are You a Vendor?</a></li>
            <li><a href="/help-centre" onClick={(e) => { e.preventDefault(); handleNavigate('/help-centre'); }}>Help Centre</a></li>
            <li><a href="/privacy-policy" onClick={(e) => { e.preventDefault(); handleNavigate('/privacy-policy'); }}>Privacy Policy</a></li>
            <li><a href="/terms-of-service" onClick={(e) => { e.preventDefault(); handleNavigate('/terms-of-service'); }}>Terms of Service</a></li>
          </ul>
        </div>

        <div className="vv-col">
          <h4>Vendors</h4>
          <ul className="vv-links">
            <li><a href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick('venue'); }}>Venues</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick('catering'); }}>Caterers</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick('planner'); }}>Event Planners</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick('photo'); }}>Photographers</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick('music'); }}>Live Music & DJs</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick('decor'); }}>Décor & Rentals</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick('entertainment'); }}>Entertainment</a></li>
          </ul>
        </div>

        <div className="vv-col">
          <h4>Connect With Us</h4>
          <div className="vv-social">
            <a href="#" onClick={(e) => e.preventDefault()} aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
            <a href="#" onClick={(e) => e.preventDefault()} aria-label="X"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
            <a href="#" onClick={(e) => e.preventDefault()} aria-label="Pinterest"><i className="fab fa-pinterest-p"></i></a>
            <a href="#" onClick={(e) => e.preventDefault()} aria-label="Instagram"><i className="fab fa-instagram"></i></a>
            <a href="#" onClick={(e) => e.preventDefault()} aria-label="TikTok"><i className="fab fa-tiktok"></i></a>
          </div>
          <div className="vv-cta">
            <a href="/become-a-vendor" onClick={(e) => { e.preventDefault(); handleNavigate('/become-a-vendor'); }}>Advertise with Us!</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
