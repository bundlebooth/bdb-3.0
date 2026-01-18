import React, { useState } from 'react';

/**
 * CategoriesStep - Vendor onboarding step for selecting service categories
 * Extracted from BecomeVendorPage.js for better maintainability
 */
function CategoriesStep({ formData, onInputChange, categories }) {
  const [additionalExpanded, setAdditionalExpanded] = useState(false);
  
  const handlePrimaryChange = (categoryId) => {
    onInputChange('primaryCategory', categoryId);
    const newAdditional = formData.additionalCategories.filter(c => c !== categoryId);
    onInputChange('additionalCategories', newAdditional);
  };

  const handleAdditionalToggle = (categoryId) => {
    if (categoryId === formData.primaryCategory) return;
    
    const newAdditional = formData.additionalCategories.includes(categoryId)
      ? formData.additionalCategories.filter(c => c !== categoryId)
      : [...formData.additionalCategories, categoryId];
    
    onInputChange('additionalCategories', newAdditional);
  };

  // Auto-expand if user has already selected additional categories
  const hasAdditionalSelected = formData.additionalCategories && formData.additionalCategories.length > 0;

  return (
    <div className="categories-step">
      <h3 style={{ marginBottom: '1.5rem', color: '#222', fontSize: '1.125rem', fontWeight: '600' }}>
        Primary Category <span style={{ color: '#ef4444' }}>*</span>
      </h3>
      <div className="categories-grid">
        {categories.map(category => {
          const isSelected = formData.primaryCategory === category.id;
          return (
            <div
              key={category.id}
              className={`category-card ${isSelected ? 'selected primary' : ''}`}
              onClick={() => handlePrimaryChange(category.id)}
            >
              <div className="category-icon">{category.icon}</div>
              <div className="category-card-content">
                <h4 className="category-name">{category.name}</h4>
                <p className="category-description">{category.description}</p>
              </div>
              {isSelected && (
                <i className="fas fa-check-circle" style={{ fontSize: '1.5rem', color: '#222222' }}></i>
              )}
            </div>
          );
        })}
      </div>

      {/* Collapsible Additional Categories Section */}
      <h3 
        onClick={() => setAdditionalExpanded(!additionalExpanded)}
        style={{ 
          marginTop: '2.5rem', 
          marginBottom: '1.5rem', 
          color: '#222', 
          fontSize: '1.125rem', 
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}
      >
        Additional Categories (Optional)
        {hasAdditionalSelected && (
          <span style={{
            background: '#222222',
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: '600',
            padding: '2px 8px',
            borderRadius: '12px'
          }}>
            {formData.additionalCategories.length} selected
          </span>
        )}
        <i 
          className={`fas fa-chevron-${additionalExpanded || hasAdditionalSelected ? 'up' : 'down'}`}
          style={{ color: '#6b7280', fontSize: '0.875rem', marginLeft: 'auto' }}
        ></i>
      </h3>
      
      {(additionalExpanded || hasAdditionalSelected) && (
        <div className="categories-grid">
          {categories
            .filter(c => c.id !== formData.primaryCategory)
            .map(category => {
              const isSelected = formData.additionalCategories.includes(category.id);
              return (
                <div
                  key={category.id}
                  className={`category-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleAdditionalToggle(category.id)}
                >
                  <div className="category-icon">{category.icon}</div>
                  <div className="category-card-content">
                    <h4 className="category-name">{category.name}</h4>
                    <p className="category-description">{category.description}</p>
                  </div>
                  {isSelected && (
                    <i className="fas fa-check-circle" style={{ fontSize: '1.5rem', color: '#222222' }}></i>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

export default CategoriesStep;
