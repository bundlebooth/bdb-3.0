import React, { useState } from 'react';

/**
 * BusinessDetailsStep - Vendor onboarding step for business information
 * Extracted from BecomeVendorPage.js for better maintainability
 */
function BusinessDetailsStep({ formData, onInputChange }) {
  const [logoPreview, setLogoPreview] = useState(formData.profileLogo || '');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Compress image to reduce size and prevent "request entity too large" error
  const compressImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          
          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with compression
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size - if over 500KB, compress it
      const maxSizeKB = 500;
      const fileSizeKB = file.size / 1024;
      
      setUploadingLogo(true);
      try {
        let imageData;
        if (fileSizeKB > maxSizeKB) {
          // Compress the image
          imageData = await compressImage(file, 400, 400, 0.7);
        } else {
          // Still compress slightly for consistency
          imageData = await compressImage(file, 600, 600, 0.85);
        }
        setLogoPreview(imageData);
        onInputChange('profileLogo', imageData);
      } catch (error) {
        console.error('Error processing image:', error);
        // Fallback to original method if compression fails
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoPreview(reader.result);
          onInputChange('profileLogo', reader.result);
        };
        reader.readAsDataURL(file);
      } finally {
        setUploadingLogo(false);
      }
    }
  };

  return (
    <div className="business-details-step">
      <div className="form-group">
        <label>Profile Logo</label>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="form-input"
              style={{ padding: '0.5rem' }}
            />
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
              Upload your business logo (JPG, PNG, or GIF)
            </p>
          </div>
          {(logoPreview || uploadingLogo) && (
            <div style={{ 
              width: '100px', 
              height: '100px', 
              borderRadius: '50%', 
              overflow: 'hidden',
              border: '2px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f9fafb',
              position: 'relative'
            }}>
              {uploadingLogo ? (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: '4px',
                  color: '#6b7280',
                  fontSize: '12px'
                }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '20px' }}></i>
                  <span>Processing...</span>
                </div>
              ) : (
                <img 
                  src={logoPreview} 
                  alt="Logo preview" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label>Business Name <span style={{ color: '#ef4444' }}>*</span></label>
        <input
          type="text"
          value={formData.businessName}
          onChange={(e) => onInputChange('businessName', e.target.value)}
          className="form-input"
          placeholder="e.g., Elegant Events Catering"
        />
      </div>

      <div className="form-group">
        <label>Display Name <span style={{ color: '#ef4444' }}>*</span></label>
        <input
          type="text"
          value={formData.displayName}
          onChange={(e) => onInputChange('displayName', e.target.value)}
          className="form-input"
          placeholder="How you want to appear to clients"
        />
      </div>

      <div className="form-group">
        <label>Business Description</label>
        <textarea
          value={formData.businessDescription}
          onChange={(e) => onInputChange('businessDescription', e.target.value)}
          className="form-textarea"
          rows="5"
          placeholder="Tell clients about your business, what makes you unique, and what they can expect..."
        />
      </div>

      <div className="form-group">
        <label>Price Range</label>
        <select
          value={formData.priceRange}
          onChange={(e) => onInputChange('priceRange', e.target.value)}
          className="form-input"
        >
          <option value="">Select price range</option>
          <option value="$">$ - Budget Friendly</option>
          <option value="$$">$$ - Moderate</option>
          <option value="$$$">$$$ - Premium</option>
          <option value="$$$$">$$$$ - Luxury</option>
        </select>
        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
          Help clients understand your pricing level
        </p>
      </div>

      <div className="form-group">
        <label>Years in Business</label>
        <input
          type="number"
          value={formData.yearsInBusiness}
          onChange={(e) => onInputChange('yearsInBusiness', e.target.value)}
          className="form-input"
          min="0"
          placeholder="e.g., 5"
        />
      </div>
    </div>
  );
}

export default BusinessDetailsStep;
