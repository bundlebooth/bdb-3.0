import React from 'react';

function Footer() {
  return (
    <footer className="vv-footer" aria-label="Site footer">
      <div className="vv-wrap">
        <div className="vv-brand">
          <div className="vv-logo">
            <img src="/planhive_logo.svg" alt="PlanHive" style={{ height: '45px', width: 'auto' }} />
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
          <div style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>© 2025 PlanHive. All rights reserved.</div>
        </div>

        <div className="vv-col">
          <h4>Company</h4>
          <ul className="vv-links">
            <li><a href="#" onClick={(e) => e.preventDefault()}>Home</a></li>
            <li><a href="#" onClick={(e) => e.preventDefault()}>Articles</a></li>
            <li><a href="#" onClick={(e) => e.preventDefault()}>Submit to Blog</a></li>
            <li><a href="#" onClick={(e) => e.preventDefault()}>Are You a Vendor?</a></li>
            <li><a href="#" onClick={(e) => e.preventDefault()}>Meet the Team</a></li>
            <li><a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a></li>
            <li><a href="#" onClick={(e) => e.preventDefault()}>Terms of Use</a></li>
          </ul>
        </div>

        <div className="vv-col">
          <h4>Vendors</h4>
          <ul className="vv-links">
            <li><a href="#" onClick={(e) => e.preventDefault()}>Venues</a></li>
            <li><a href="#" onClick={(e) => e.preventDefault()}>Caterers</a></li>
            <li><a href="#" onClick={(e) => e.preventDefault()}>Event Planners</a></li>
            <li><a href="#" onClick={(e) => e.preventDefault()}>Photographers</a></li>
            <li><a href="#" onClick={(e) => e.preventDefault()}>Videographers</a></li>
            <li><a href="#" onClick={(e) => e.preventDefault()}>Live Music & DJs</a></li>
            <li><a href="#" onClick={(e) => e.preventDefault()}>Décor & Rentals</a></li>
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
            <a href="#" onClick={(e) => e.preventDefault()}>Advertise with Us!</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
