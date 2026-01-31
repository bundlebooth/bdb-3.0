import React from 'react';

// Map category IDs to names for API calls
const CATEGORY_ID_TO_NAME = {
  'venue': 'Venues',
  'photo': 'Photo/Video',
  'music': 'Music/DJ',
  'catering': 'Catering',
  'entertainment': 'Entertainment',
  'decorations': 'Decorations',
  'decor': 'Decorations',
  'beauty': 'Beauty',
  'cake': 'Cake',
  'transportation': 'Transportation',
  'transport': 'Transportation',
  'planners': 'Planners',
  'planner': 'Planners',
  'fashion': 'Fashion',
  'stationery': 'Stationery',
  'experiences': 'Experiences'
};

/**
 * CategoriesStep - Vendor onboarding step for selecting service category only
 * Subcategories, event types, cultures, features are now in ServiceDetailsStep
 * Category questions are now in CategoryQuestionsStep
 */
function CategoriesStep({ formData, onInputChange, setFormData, categories, currentUser }) {

  const handlePrimaryChange = (categoryId) => {
    onInputChange('primaryCategory', categoryId);
    // Clear category-specific selections when category changes
    onInputChange('selectedSubcategories', []);
    onInputChange('selectedFeatures', []);
    if (setFormData) {
      setFormData(prev => ({ ...prev, categoryAnswers: {} }));
    }
  };

  return (
    <div className="categories-step">
      <h3 style={{ marginBottom: '1.5rem', color: '#222', fontSize: '1.125rem', fontWeight: '600' }}>
        Select Your Category <span style={{ color: '#ef4444' }}>*</span>
      </h3>
      <p style={{ marginBottom: '1.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
        Choose the main category that best describes your business. You can select specific services within this category next.
      </p>
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
    </div>
  );
}

export default CategoriesStep;
