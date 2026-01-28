import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';

/**
 * CategoriesStep - Vendor onboarding step for selecting service category and subcategories
 * Updated: Single primary category only, with multiple subcategories selection
 */
function CategoriesStep({ formData, onInputChange, categories }) {
  const [subcategories, setSubcategories] = useState([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  
  // Fetch subcategories when primary category changes
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!formData.primaryCategory) {
        setSubcategories([]);
        return;
      }
      
      // Find the category name from the ID
      const selectedCategory = categories.find(c => c.id === formData.primaryCategory);
      if (!selectedCategory) return;
      
      setLoadingSubcategories(true);
      try {
        const response = await fetch(`${API_BASE_URL}/vendors/subcategories/${encodeURIComponent(selectedCategory.name)}`);
        const data = await response.json();
        if (data.success) {
          setSubcategories(data.subcategories || []);
        }
      } catch (error) {
        console.error('Error fetching subcategories:', error);
        setSubcategories([]);
      } finally {
        setLoadingSubcategories(false);
      }
    };
    
    fetchSubcategories();
  }, [formData.primaryCategory, categories]);
  
  const handlePrimaryChange = (categoryId) => {
    onInputChange('primaryCategory', categoryId);
    // Clear subcategories when category changes
    onInputChange('selectedSubcategories', []);
  };

  const handleSubcategoryToggle = (subcategoryId) => {
    const currentSubcategories = formData.selectedSubcategories || [];
    const newSubcategories = currentSubcategories.includes(subcategoryId)
      ? currentSubcategories.filter(id => id !== subcategoryId)
      : [...currentSubcategories, subcategoryId];
    
    onInputChange('selectedSubcategories', newSubcategories);
  };

  const selectedSubcategoriesCount = (formData.selectedSubcategories || []).length;

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

      {/* Subcategories Section - Only show when a category is selected */}
      {formData.primaryCategory && (
        <>
          <h3 style={{ 
            marginTop: '2.5rem', 
            marginBottom: '1rem', 
            color: '#222', 
            fontSize: '1.125rem', 
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            Select Your Services
            {selectedSubcategoriesCount > 0 && (
              <span style={{
                background: '#5086E8',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: '600',
                padding: '2px 10px',
                borderRadius: '12px'
              }}>
                {selectedSubcategoriesCount} selected
              </span>
            )}
          </h3>
          <p style={{ marginBottom: '1.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
            Select all the specific services you offer within your category. This helps clients find exactly what they need.
          </p>
          
          {loadingSubcategories ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
              Loading services...
            </div>
          ) : subcategories.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
              gap: '0.75rem' 
            }}>
              {subcategories.map(subcategory => {
                const isSelected = (formData.selectedSubcategories || []).includes(subcategory.SubcategoryID);
                return (
                  <div
                    key={subcategory.SubcategoryID}
                    onClick={() => handleSubcategoryToggle(subcategory.SubcategoryID)}
                    style={{
                      padding: '0.875rem 1rem',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #5086E8' : '1px solid #e5e7eb',
                      background: isSelected ? '#f0f7ff' : '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      border: isSelected ? '2px solid #5086E8' : '2px solid #d1d5db',
                      background: isSelected ? '#5086E8' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isSelected && (
                        <i className="fas fa-check" style={{ color: '#fff', fontSize: '0.7rem' }}></i>
                      )}
                    </div>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: isSelected ? '#1e40af' : '#374151',
                      fontWeight: isSelected ? '500' : '400'
                    }}>
                      {subcategory.SubcategoryName}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem', 
              color: '#6b7280',
              background: '#f9fafb',
              borderRadius: '8px'
            }}>
              No specific services available for this category yet.
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CategoriesStep;
