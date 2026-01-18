import React from 'react';

/**
 * ContactStep - Vendor onboarding step for contact information
 * Extracted from BecomeVendorPage.js for better maintainability
 */
function ContactStep({ formData, onInputChange }) {
  return (
    <div className="contact-step">
      <div className="form-group">
        <label>Business Phone <span style={{ color: '#ef4444' }}>*</span></label>
        <input
          type="tel"
          value={formData.businessPhone}
          onChange={(e) => onInputChange('businessPhone', e.target.value)}
          className="form-input"
          placeholder="(555) 123-4567"
        />
      </div>

      <div className="form-group">
        <label>Email <span style={{ color: '#ef4444' }}>*</span></label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => onInputChange('email', e.target.value)}
          className="form-input"
          placeholder="your@email.com"
        />
      </div>

      <div className="form-group">
        <label>Website</label>
        <input
          type="url"
          value={formData.website}
          onChange={(e) => onInputChange('website', e.target.value)}
          className="form-input"
          placeholder="https://yourwebsite.com"
        />
      </div>
    </div>
  );
}

export default ContactStep;
